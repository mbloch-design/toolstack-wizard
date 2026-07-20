#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQL_DIR="$ROOT/docs/tool-catalog-migration/contract-v3"
CONFIRM_EXPECTED='dark-launch-4.12-online'

: "${DATABASE_URL:?DATABASE_URL est obligatoire}"
: "${BACKUP_FILE:?BACKUP_FILE est obligatoire}"
: "${BACKUP_RESTORE_REF:?BACKUP_RESTORE_REF est obligatoire}"
: "${TOOLTRIM_DARK_LAUNCH_CONFIRM:?TOOLTRIM_DARK_LAUNCH_CONFIRM est obligatoire}"

if [[ "$TOOLTRIM_DARK_LAUNCH_CONFIRM" != "$CONFIRM_EXPECTED" ]]; then
  echo "Refus : confirmation attendue=$CONFIRM_EXPECTED" >&2
  exit 2
fi
if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Refus : backup absent: $BACKUP_FILE" >&2
  exit 2
fi
if [[ ${#BACKUP_RESTORE_REF} -lt 8 || "$BACKUP_RESTORE_REF" =~ [Pp][Ll][Aa][Cc][Ee][Hh][Oo][Ll][Dd][Ee][Rr]|[Tt][Oo][Dd][Oo] ]]; then
  echo 'Refus : BACKUP_RESTORE_REF invalide' >&2
  exit 2
fi
command -v psql >/dev/null || { echo 'Refus : psql absent' >&2; exit 2; }

BACKUP_SHA="$(shasum -a 256 "$BACKUP_FILE" | awk '{print $1}')"
(
  cd "$SQL_DIR"
  shasum -a 256 -c A7-bundle-lock.4.12.sha256
)

echo "Bundle 4.12 verrouillé. Backup sha256=$BACKUP_SHA"
(
  cd "$SQL_DIR"
  psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 -f A7-online-preflight-readonly.4.12.sql
)
echo "Lancement autorisé sur la connexion fournie ; aucun consommateur ne sera basculé."

set +e
(
  cd "$SQL_DIR"
  psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 \
    -v backup_ref="$BACKUP_RESTORE_REF" \
    -v backup_sha256="$BACKUP_SHA" \
    -f A7-migration-dark-launch.4.12.sql
)
MIGRATION_RC=$?
set -e

if [[ $MIGRATION_RC -ne 0 ]]; then
  echo "Migration en erreur (rc=$MIGRATION_RC). Détection d'un éventuel COMMIT déjà réalisé." >&2
  COMMITTED="$(psql -X "$DATABASE_URL" -Atq -v ON_ERROR_STOP=1 -c \
    "select case when to_regclass('catalog_private.dark_launch_state') is not null then 1 else 0 end" || echo unknown)"
  if [[ "$COMMITTED" == "1" ]]; then
    echo 'Échec post-COMMIT détecté : rollback 4.12 automatique.' >&2
    (
      cd "$SQL_DIR"
      psql -X "$DATABASE_URL" -v ON_ERROR_STOP=1 -f A7-rollback-dark-launch.4.12.sql
    )
  else
    echo 'Aucun marqueur committé : PostgreSQL a annulé la transaction.' >&2
  fi
  exit "$MIGRATION_RC"
fi

echo 'DARK_LAUNCH_4_12_ONLINE_SUCCESS'
