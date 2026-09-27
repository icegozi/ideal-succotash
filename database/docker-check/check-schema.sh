#!/usr/bin/env bash
set -euo pipefail

if [[ ! "${ORACLE_USER:-}" =~ ^[A-Za-z][A-Za-z0-9_$#]{0,29}$ ]]; then
  echo "ERROR: ORACLE_USER is missing or invalid." >&2
  exit 1
fi

if [[ -z "${ORACLE_PASSWORD_FILE:-}" || ! -r "${ORACLE_PASSWORD_FILE}" ]]; then
  echo "ERROR: ORACLE_PASSWORD_FILE is missing or unreadable." >&2
  exit 1
fi

oracle_password="$(<"${ORACLE_PASSWORD_FILE}")"
if [[ "${oracle_password}" == *'"'* || "${oracle_password}" == *$'\n'* ]]; then
  echo 'ERROR: ORACLE_APP_PASSWORD must not contain a double quote or newline.' >&2
  exit 1
fi

schema_state="$({ sqlplus -s /nolog <<SQL
WHENEVER OSERROR EXIT 9 ROLLBACK
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
SET HEADING OFF FEEDBACK OFF PAGESIZE 0 VERIFY OFF ECHO OFF
CONNECT "${ORACLE_USER}"/"${oracle_password}"@//${ORACLE_CONNECT_STRING}
SELECT CASE
  WHEN (SELECT COUNT(*) FROM USER_TABLES
        WHERE TABLE_NAME IN ('DON_VI_TINH', 'THUOC', 'GIAO_DICH_KHO', 'SCHEMA_MIGRATIONS')) = 4
   AND (SELECT COUNT(*) FROM USER_OBJECTS
        WHERE OBJECT_TYPE = 'PACKAGE'
          AND OBJECT_NAME IN ('PKG_KHO_DUOC', 'PKG_KHO_NANG_CAO', 'PKG_FLASHBACK_KHO')
          AND STATUS = 'VALID') = 3
   AND (SELECT COUNT(*) FROM USER_VIEWS
        WHERE VIEW_NAME IN ('VW_TON_KHO_FEFO', 'VW_TON_KHO_TONG_HOP')) = 2
   AND (SELECT COUNT(*) FROM SCHEMA_MIGRATIONS
        WHERE VERSION IN ('001', '002', '003')) = 3
   AND (SELECT COUNT(*) FROM USER_OBJECTS WHERE STATUS <> 'VALID') = 0
  THEN 'READY'
  ELSE 'NOT_READY'
END
FROM DUAL;
EXIT SUCCESS
SQL
} | tr -d '[:space:]')"

if [[ "${schema_state}" != "READY" ]]; then
  echo "ERROR: MedStock schema validation returned ${schema_state:-no result}." >&2
  exit 1
fi

echo "MedStock schema is ready."
