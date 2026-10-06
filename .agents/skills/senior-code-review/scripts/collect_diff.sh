#!/usr/bin/env bash
# collect_diff.sh — gather everything that differs from the base branch into
# reviewable files: committed commits on this branch + staged + unstaged +
# untracked changes. Generated/lock files are split into a separate patch.
#
# Usage:
#   bash scripts/collect_diff.sh [base-branch] [output-dir]
#   base-branch  default: develop (falls back to origin/develop, main, origin/main, master)
#   output-dir   default: /tmp/review
#
# Output files in <output-dir>:
#   summary.txt             human-readable summary (also printed)
#   files.txt               changed files with status (A/M/D/R) and class (code|test|generated|config)
#   stats.txt               git --stat for the whole range
#   diff.patch              diff of reviewable files (code, tests, config), 8 lines of context
#   diff.generated.patch    diff of generated / lock / vendored files (skim only)
#   commits.txt             commits on the branch not in base
#   untracked.txt           untracked files (their full content is included in diff.patch)

set -u

BASE_ARG="${1:-}"
OUT="${2:-/tmp/review}"

die() { echo "ERROR: $*" >&2; exit 1; }

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "not inside a git repository"
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT" || die "cannot cd to repo root"

mkdir -p "$OUT" || die "cannot create output dir $OUT"

# Best-effort fetch so origin/<base> is fresh; never fail the review on network.
git fetch --quiet --all --prune 2>/dev/null || true

# ---- resolve base ----------------------------------------------------------
resolve_base() {
  local candidates=()
  if [ -n "$BASE_ARG" ]; then
    candidates+=("$BASE_ARG" "origin/$BASE_ARG")
  else
    candidates+=(develop origin/develop main origin/main master origin/master)
  fi
  local c
  for c in "${candidates[@]}"; do
    if git rev-parse --verify --quiet "$c^{commit}" >/dev/null; then
      echo "$c"; return 0
    fi
  done
  return 1
}

BASE="$(resolve_base)" || {
  echo "ERROR: could not find base branch (tried: ${BASE_ARG:-develop/main/master} and origin/ variants)." >&2
  echo "Available branches:" >&2
  git branch -a --format='  %(refname:short)' >&2
  exit 2
}

HEAD_SHA="$(git rev-parse --short HEAD)"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
MERGE_BASE="$(git merge-base "$BASE" HEAD 2>/dev/null)" || die "no merge base between $BASE and HEAD"
MB_SHORT="$(git rev-parse --short "$MERGE_BASE")"
BASE_SHORT="$(git rev-parse --short "$BASE")"

# ---- classify files ---------------------------------------------------------
# Generated / lock / vendored: still diffed, but kept out of the main patch.
is_generated() {
  case "$1" in
    *.g.dart|*.freezed.dart|*.gr.dart|*.mocks.dart|*.pb.dart|*.pbenum.dart|*.pbjson.dart|*.config.dart|*.gen.dart) return 0;;
    pubspec.lock|package-lock.json|yarn.lock|pnpm-lock.yaml|Podfile.lock|Gemfile.lock|poetry.lock|Cargo.lock|go.sum|composer.lock|flake.lock) return 0;;
    *.min.js|*.min.css|*.map|*.bundle.js|*.chunk.js) return 0;;
    *.pb.go|*_pb2.py|*_pb2_grpc.py|*.generated.*|*.d.ts.map) return 0;;
    */generated/*|*/gen/*|*/build/*|*/dist/*|*/node_modules/*|*/vendor/*|*/.dart_tool/*|*/Pods/*) return 0;;
    *.png|*.jpg|*.jpeg|*.gif|*.webp|*.ico|*.svg|*.pdf|*.ttf|*.otf|*.woff|*.woff2|*.mp3|*.mp4|*.zip|*.jar|*.aar|*.so|*.dylib) return 0;;
  esac
  return 1
}
is_test() {
  case "$1" in
    *_test.dart|*_test.go|*_test.py|test_*.py|*.test.ts|*.test.tsx|*.test.js|*.test.jsx|*.spec.ts|*.spec.tsx|*.spec.js|*.spec.jsx|*Test.kt|*Test.java|*Tests.swift|*Test.swift) return 0;;
    test/*|tests/*|*/test/*|*/tests/*|*/__tests__/*|spec/*|*/spec/*|integration_test/*|*/androidTest/*|*/testFlutter/*) return 0;;
  esac
  return 1
}
is_config() {
  case "$1" in
    *.yaml|*.yml|*.json|*.toml|*.ini|*.env|*.env.*|*.properties|*.gradle|*.gradle.kts|*.plist|*.xcconfig|*.xml|Dockerfile|*.dockerfile|Makefile|*.cfg|*.conf|.gitignore|.editorconfig|*.lock) return 0;;
    pubspec.yaml|package.json|tsconfig*.json|.eslintrc*|analysis_options.yaml) return 0;;
  esac
  return 1
}
classify() {
  if is_generated "$1"; then echo generated
  elif is_test "$1"; then echo test
  elif is_config "$1"; then echo config
  else echo code
  fi
}

# ---- collect changed paths -------------------------------------------------
# Committed range (merge-base..HEAD) + working tree vs merge-base, union.
TMP_STATUS="$(mktemp)"
git diff --name-status --find-renames "$MERGE_BASE" -- . > "$TMP_STATUS" 2>/dev/null   # working tree + index vs merge base
# untracked (not ignored)
git ls-files --others --exclude-standard > "$OUT/untracked.txt"
while IFS= read -r f; do
  [ -n "$f" ] && printf 'A\t%s\n' "$f" >> "$TMP_STATUS"
done < "$OUT/untracked.txt"

: > "$OUT/files.txt"
CODE_FILES=(); GEN_FILES=()
n_code=0; n_test=0; n_cfg=0; n_gen=0
TMP_SORTED="$(mktemp "${TMPDIR:-/tmp}/review_sorted_XXXXXX")"
sort -u -t $'\t' -k2,3 "$TMP_STATUS" > "$TMP_SORTED"
while IFS=$'\t' read -r status p1 p2; do
  [ -z "${status:-}" ] && continue
  path="$p1"; [ -n "${p2:-}" ] && path="$p2"   # renames: use new path
  cls="$(classify "$path")"
  printf '%s\t%s\t%s\n' "$status" "$cls" "$path" >> "$OUT/files.txt"
  case "$cls" in
    generated) GEN_FILES+=("$path"); n_gen=$((n_gen+1));;
    test)      CODE_FILES+=("$path"); n_test=$((n_test+1));;
    config)    CODE_FILES+=("$path"); n_cfg=$((n_cfg+1));;
    *)         CODE_FILES+=("$path"); n_code=$((n_code+1));;
  esac
done < "$TMP_SORTED"
rm -f "$TMP_STATUS" "$TMP_SORTED"

# ---- write diffs -------------------------------------------------------------
git log --oneline --no-merges "$MERGE_BASE..HEAD" > "$OUT/commits.txt" 2>/dev/null || true
git diff --stat=120 "$MERGE_BASE" > "$OUT/stats.txt" 2>/dev/null || true

# Tracked changes (committed + staged + unstaged) vs merge base, 8 lines of context.
# -U8 gives enough surrounding code to judge most hunks; still open the file for anything non-trivial.
if [ ${#CODE_FILES[@]} -gt 0 ]; then
  git diff -U8 --find-renames "$MERGE_BASE" -- "${CODE_FILES[@]}" > "$OUT/diff.patch" 2>/dev/null || true
else
  : > "$OUT/diff.patch"
fi
if [ ${#GEN_FILES[@]} -gt 0 ]; then
  git diff -U3 --find-renames "$MERGE_BASE" -- "${GEN_FILES[@]}" > "$OUT/diff.generated.patch" 2>/dev/null || true
else
  : > "$OUT/diff.generated.patch"
fi

# Untracked files are invisible to `git diff`; append them as new-file diffs so they get reviewed.
if [ -s "$OUT/untracked.txt" ]; then
  while IFS= read -r f; do
    [ -f "$f" ] || continue
    target="$OUT/diff.patch"
    is_generated "$f" && target="$OUT/diff.generated.patch"
    # Skip obviously binary files
    if grep -Iq . "$f" 2>/dev/null; then
      git diff --no-index -U8 -- /dev/null "$f" >> "$target" 2>/dev/null || true
    else
      printf '\n# [binary untracked file skipped] %s\n' "$f" >> "$target"
    fi
  done < "$OUT/untracked.txt"
fi

# ---- line counts -----------------------------------------------------------
read -r ADD DEL < <(git diff --numstat "$MERGE_BASE" -- 2>/dev/null | awk '{a+=$1; d+=$2} END {print a+0, d+0}')
UNCOMMITTED="$(git status --porcelain | grep -vc '^??' | tr -d ' ')"
TOTAL=$((n_code + n_test + n_cfg + n_gen))

# ---- summary -------------------------------------------------------------------
{
  echo "=== Review scope ==="
  echo "branch        : $BRANCH @ $HEAD_SHA"
  echo "base          : $BASE @ $BASE_SHORT (merge-base $MB_SHORT)"
  echo "commits ahead : $(wc -l < "$OUT/commits.txt" | tr -d ' ')"
  echo "uncommitted   : $UNCOMMITTED tracked path(s) modified in working tree / index (included in diff)"
  echo "untracked     : $(wc -l < "$OUT/untracked.txt" | tr -d ' ') file(s) (included in diff)"
  echo "files changed : $TOTAL  (code $n_code, test $n_test, config $n_cfg, generated $n_gen)"
  echo "lines         : +$ADD / -$DEL (tracked files)"
  BEHIND="$(git rev-list --count "HEAD..$BASE" 2>/dev/null || echo '?')"
  echo "behind base   : $BEHIND commit(s) — if > 0, remind the author to rebase/merge $BASE before relying on this review"
  echo
  echo "=== Changed files (status  class  path) ==="
  cat "$OUT/files.txt"
  echo
  echo "=== Output ==="
  echo "$OUT/diff.patch             <- review this (code/test/config, -U8)"
  echo "$OUT/diff.generated.patch   <- skim only (generated/lock/binary)"
  echo "$OUT/files.txt  $OUT/stats.txt  $OUT/commits.txt  $OUT/untracked.txt"
  echo
  echo "Next: read diff.patch, then open the full files for every non-trivial hunk and grep callers of changed symbols."
} | tee "$OUT/summary.txt"

# Warn about things worth a reviewer's attention right away
if [ -s "$OUT/diff.patch" ]; then
  echo
  echo "=== Quick flags (grep on added lines of diff.patch) ==="
  grep -nE '^\+' "$OUT/diff.patch" | grep -vE '^\+\+\+' | grep -niE \
    'TODO|FIXME|HACK|XXX|print\(|console\.log|debugPrint|Log\.d\(|NSLog|System\.out|password|secret|api[_-]?key|token\s*=\s*["'"'"']|BEGIN (RSA|PRIVATE)|verify\s*=\s*False|badCertificateCallback|allowsArbitraryLoads|usesCleartextTraffic|dangerouslySetInnerHTML|innerHTML|eval\(|shell\s*=\s*True|\.skip\(|xit\(|@Ignore|@skip|skip:\s*true' \
    | head -40 || echo "(none)"
fi
