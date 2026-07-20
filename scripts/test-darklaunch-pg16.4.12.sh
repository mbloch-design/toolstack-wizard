#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQL_DIR="$ROOT/docs/tool-catalog-migration/contract-v3"
TMP_ROOT="$(mktemp -d /tmp/tooltrim-darklaunch-4.12.XXXXXX)"
DMG="$TMP_ROOT/Postgres-2.9.5-16.dmg"
MOUNT="$TMP_ROOT/mount"
APP="$TMP_ROOT/Postgres.app"
PGDATA="$TMP_ROOT/cluster"
SOCKET="$TMP_ROOT/socket"
LOG="$TMP_ROOT/postgres.log"
PORT=55432
MOUNTED=0
STARTED=0

cleanup() {
  set +e
  if [[ "$STARTED" == 1 ]]; then "$BIN/pg_ctl" -D "$PGDATA" -m fast stop >/dev/null 2>&1; fi
  if [[ "$MOUNTED" == 1 ]]; then hdiutil detach "$MOUNT" -quiet >/dev/null 2>&1; fi
  rm -rf "$TMP_ROOT"
}
trap cleanup EXIT INT TERM

mkdir -p "$MOUNT" "$SOCKET"
curl --fail --location --silent --show-error \
  'https://github.com/PostgresApp/PostgresApp/releases/download/v2.9.5/Postgres-2.9.5-16.dmg' \
  --output "$DMG"
hdiutil attach "$DMG" -nobrowse -readonly -mountpoint "$MOUNT" -quiet
MOUNTED=1
spctl --assess --type execute --verbose=2 "$MOUNT/Postgres.app"
ditto "$MOUNT/Postgres.app" "$APP"
hdiutil detach "$MOUNT" -quiet
MOUNTED=0
spctl --assess --type execute --verbose=2 "$APP"

BIN="$APP/Contents/Versions/16/bin"
"$BIN/postgres" --version
"$BIN/initdb" -D "$PGDATA" -U postgres --no-locale --encoding=UTF8 >/dev/null
"$BIN/pg_ctl" -D "$PGDATA" -l "$LOG" \
  -o "-k '$SOCKET' -h '' -p $PORT" start >/dev/null
STARTED=1

PSQL=("$BIN/psql" -X -v ON_ERROR_STOP=1 -h "$SOCKET" -p "$PORT" -U postgres -d postgres)

"${PSQL[@]}" <<SQL
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
\i '$SQL_DIR/_bootstrap-public-tools.4.12.sql'
\i '$SQL_DIR/_seed-533-existing.4.12.sql'
SQL

BACKUP_SHA="$(shasum -a 256 "$SQL_DIR/_seed-533-existing.4.12.sql" | awk '{print $1}')"

(
  cd "$SQL_DIR"
  "${PSQL[@]}" -f A7-online-preflight-readonly.4.12.sql
)

(
  cd "$SQL_DIR"
  "${PSQL[@]}" \
    -v backup_ref="$SQL_DIR/_seed-533-existing.4.12.sql" \
    -v backup_sha256="$BACKUP_SHA" \
    -f A7-migration-dark-launch.4.12.sql
)

"${PSQL[@]}" <<'SQL'
do $$ begin
  if (select count(*) from public.tools)<>1126 then raise exception 'POSTCOMMIT tools'; end if;
  if (select count(*) from catalog_api.published_tool_projection)<>2252 then raise exception 'POSTCOMMIT projection'; end if;
  if (select count(*) from public.tools where legacy_payload->>'import_batch'='dark-launch-4.12')<>593 then raise exception 'POSTCOMMIT imports'; end if;
end $$;
set role anon;
select count(*)=2252 as anon_projection_ok from catalog_api.published_tool_projection;
reset role;
set role authenticated;
select count(*)=2252 as authenticated_projection_ok from catalog_api.published_tool_projection;
reset role;
SQL

if "${PSQL[@]}" -c 'set role anon; select count(*) from catalog_private.tool_claims;' >/dev/null 2>&1; then
  echo 'FAIL: anon peut lire catalog_private' >&2
  exit 1
fi
if "${PSQL[@]}" -c 'set role authenticated; select count(*) from catalog_private.tool_claims;' >/dev/null 2>&1; then
  echo 'FAIL: authenticated peut lire catalog_private' >&2
  exit 1
fi

(
  cd "$SQL_DIR"
  "${PSQL[@]}" -f A7-rollback-dark-launch.4.12.sql
)

"${PSQL[@]}" <<'SQL'
do $$ begin
  if (select count(*) from public.tools)<>533 then raise exception 'POSTROLLBACK tools'; end if;
  if to_regnamespace('catalog_private') is not null then raise exception 'POSTROLLBACK private'; end if;
  if to_regnamespace('catalog_api') is not null then raise exception 'POSTROLLBACK api'; end if;
  if exists(select 1 from pg_roles where rolname='catalog_owner') then raise exception 'POSTROLLBACK role'; end if;
end $$;
SQL

echo 'DARK_LAUNCH_4_12_EPHEMERAL_PASS'
