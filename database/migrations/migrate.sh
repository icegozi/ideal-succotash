#!/usr/bin/env bash

(
set -euo pipefail

schema_dir="/schema"
migrations=(
  "001|Core pharmacy schema|01_kho_duoc_oracle.sql"
  "002|Advanced inventory workflows|03_kho_nghiep_vu_nang_cao.sql"
  "003|Oracle flashback support|05_oracle_flashback_kho.sql"
)

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

read_secret() {
  local secret_file="$1"
  [[ -n "${secret_file}" && -r "${secret_file}" ]] || fail "Secret file ${secret_file:-<unset>} is missing or unreadable."
  local secret
  secret="$(<"${secret_file}")"
  [[ "${secret}" != *'"'* && "${secret}" != *$'\n'* ]] || fail "Oracle passwords must not contain a double quote or newline."
  printf '%s' "${secret}"
}

[[ "${ORACLE_USER:-}" =~ ^[A-Za-z][A-Za-z0-9_$#]{0,29}$ ]] || fail "ORACLE_USER is missing or is not a safe Oracle identifier."
[[ -n "${ORACLE_ADMIN_CONNECT_STRING:-}" ]] || fail "ORACLE_ADMIN_CONNECT_STRING is required."
[[ -n "${ORACLE_CONNECT_STRING:-}" ]] || fail "ORACLE_CONNECT_STRING is required."

admin_password="$(read_secret "${ORACLE_ADMIN_PASSWORD_FILE:-}")"
app_password="$(read_secret "${ORACLE_PASSWORD_FILE:-}")"

if [[ "${LOAD_DEMO_DATA:-false}" == "true" ]]; then
  migrations+=("900|Local FEFO demo data|02_demo_fefo.sql")
elif [[ "${LOAD_DEMO_DATA:-false}" != "false" ]]; then
  fail "LOAD_DEMO_DATA must be true or false."
fi

if [[ "${MIGRATION_BASELINE_EXISTING:-false}" != "true" && "${MIGRATION_BASELINE_EXISTING:-false}" != "false" ]]; then
  fail "MIGRATION_BASELINE_EXISTING must be true or false."
fi

for migration in "${migrations[@]}"; do
  IFS='|' read -r version description filename <<<"${migration}"
  [[ -r "${schema_dir}/${filename}" ]] || fail "Missing ${schema_dir}/${filename}. Set ORACLE_SCHEMA_DIR to the supplied SQL directory."
done

echo "Granting schema privileges to ${ORACLE_USER}."
sqlplus -s /nolog <<SQL
WHENEVER OSERROR EXIT 9 ROLLBACK
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
CONNECT SYSTEM/"${admin_password}"@//${ORACLE_ADMIN_CONNECT_STRING}
GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE TRIGGER, CREATE VIEW, CREATE PROCEDURE TO "${ORACLE_USER}";
ALTER USER "${ORACLE_USER}" QUOTA UNLIMITED ON USERS;
EXIT SUCCESS
SQL

sqlplus -s /nolog <<SQL
WHENEVER OSERROR EXIT 9 ROLLBACK
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
SET DEFINE OFF
CONNECT "${ORACLE_USER}"/"${app_password}"@//${ORACLE_CONNECT_STRING}
DECLARE
  table_count PLS_INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM USER_TABLES
  WHERE TABLE_NAME = 'SCHEMA_MIGRATIONS';

  IF table_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE TABLE SCHEMA_MIGRATIONS (
        VERSION         VARCHAR2(20 CHAR) PRIMARY KEY,
        DESCRIPTION     VARCHAR2(200 CHAR) NOT NULL,
        SCRIPT_NAME     VARCHAR2(255 CHAR) NOT NULL,
        CHECKSUM_SHA256 VARCHAR2(64 CHAR) NOT NULL,
        INSTALLED_ON    TIMESTAMP(6) DEFAULT SYSTIMESTAMP NOT NULL,
        INSTALLED_BY    VARCHAR2(128 CHAR) NOT NULL,
        EXECUTION_MS    NUMBER(12) NOT NULL
      )
    ]';
  END IF;
END;
/
EXIT SUCCESS
SQL

query_app() {
  local statement="$1"
  sqlplus -s /nolog <<SQL | tr -d '[:space:]'
WHENEVER OSERROR EXIT 9 ROLLBACK
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
SET HEADING OFF FEEDBACK OFF PAGESIZE 0 VERIFY OFF ECHO OFF
CONNECT "${ORACLE_USER}"/"${app_password}"@//${ORACLE_CONNECT_STRING}
${statement}
EXIT SUCCESS
SQL
}

record_migration() {
  local version="$1"
  local description="$2"
  local filename="$3"
  local checksum="$4"
  local execution_ms="$5"
  local installed_by="$6"

  sqlplus -s /nolog <<SQL
WHENEVER OSERROR EXIT 9 ROLLBACK
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
CONNECT "${ORACLE_USER}"/"${app_password}"@//${ORACLE_CONNECT_STRING}
INSERT INTO SCHEMA_MIGRATIONS (
  VERSION, DESCRIPTION, SCRIPT_NAME, CHECKSUM_SHA256, INSTALLED_BY, EXECUTION_MS
) VALUES (
  '${version}', '${description}', '${filename}', '${checksum}', '${installed_by}', ${execution_ms}
);
COMMIT;
EXIT SUCCESS
SQL
}

validate_core_schema() {
  query_app "
SELECT CASE
  WHEN (SELECT COUNT(*) FROM USER_TABLES
        WHERE TABLE_NAME IN ('DON_VI_TINH', 'THUOC', 'GIAO_DICH_KHO')) = 3
   AND (SELECT COUNT(*) FROM USER_OBJECTS
        WHERE OBJECT_TYPE = 'PACKAGE'
          AND OBJECT_NAME IN ('PKG_KHO_DUOC', 'PKG_KHO_NANG_CAO', 'PKG_FLASHBACK_KHO')
          AND STATUS = 'VALID') = 3
   AND (SELECT COUNT(*) FROM USER_VIEWS
        WHERE VIEW_NAME IN ('VW_TON_KHO_FEFO', 'VW_TON_KHO_TONG_HOP')) = 2
   AND (SELECT COUNT(*) FROM USER_OBJECTS WHERE STATUS <> 'VALID') = 0
  THEN 'READY'
  ELSE 'NOT_READY'
END
FROM DUAL;"
}

history_count="$(query_app "SELECT COUNT(*) FROM SCHEMA_MIGRATIONS;")"
core_table_count="$(query_app "SELECT COUNT(*) FROM USER_TABLES WHERE TABLE_NAME IN ('DON_VI_TINH', 'THUOC', 'GIAO_DICH_KHO');")"

if [[ "${history_count}" == "0" && "${core_table_count}" != "0" ]]; then
  [[ "${MIGRATION_BASELINE_EXISTING:-false}" == "true" ]] || fail "Existing MedStock objects have no migration history. Validate them, then run once with MIGRATION_BASELINE_EXISTING=true."
  [[ "$(validate_core_schema)" == "READY" ]] || fail "Existing schema is incomplete or contains invalid objects; refusing to baseline it."

  echo "Recording the validated existing schema as migration baseline."
  for migration in "${migrations[@]:0:3}"; do
    IFS='|' read -r version description filename <<<"${migration}"
    checksum="$(sha256sum "${schema_dir}/${filename}" | awk '{print $1}')"
    record_migration "${version}" "${description}" "${filename}" "${checksum}" 0 "BASELINE"
  done
fi

for migration in "${migrations[@]}"; do
  IFS='|' read -r version description filename <<<"${migration}"
  script_path="${schema_dir}/${filename}"
  checksum="$(sha256sum "${script_path}" | awk '{print $1}')"
  installed_checksum="$(query_app "SELECT CHECKSUM_SHA256 FROM SCHEMA_MIGRATIONS WHERE VERSION = '${version}';")"

  if [[ -n "${installed_checksum}" ]]; then
    [[ "${installed_checksum}" == "${checksum}" ]] || fail "Migration ${version} was changed after installation (checksum mismatch)."
    echo "Migration ${version} already installed; skipping."
    continue
  fi

  echo "Applying migration ${version}: ${filename}."
  started_at="$(date +%s%3N)"
  sqlplus -s /nolog <<SQL
WHENEVER OSERROR EXIT 9 ROLLBACK
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
SET DEFINE OFF
CONNECT "${ORACLE_USER}"/"${app_password}"@//${ORACLE_CONNECT_STRING}
@"${script_path}"
EXIT SUCCESS
SQL

  invalid_count="$(query_app "SELECT COUNT(*) FROM USER_OBJECTS WHERE STATUS <> 'VALID';")"
  [[ "${invalid_count}" == "0" ]] || fail "Migration ${version} left ${invalid_count} invalid Oracle object(s)."

  finished_at="$(date +%s%3N)"
  record_migration "${version}" "${description}" "${filename}" "${checksum}" "$((finished_at - started_at))" "MIGRATE"
done

[[ "$(validate_core_schema)" == "READY" ]] || fail "Final MedStock schema validation failed."
echo "MedStock migrations completed successfully."
)
