#!/usr/bin/env bash
# Synchronise la base avec les fiches sourcées du repo, en une commande.
#
#   bash scripts/sync-catalog.sh              # tout : fiches + descriptions + archivages
#   bash scripts/sync-catalog.sh attio zoom   # seulement ces slugs (+ descriptions)
#   bash scripts/sync-catalog.sh --no-archive # saute les archivages
#
# Étapes :
#   1. bundle-editorial  → verdict / pros / cons / use_cases (FR+EN)
#   2. fill-short-descriptions --apply → short_description + long_description (FR+EN)
#   3. apply-archive-sql  → archive doublons, fiches fermées, entrées junk
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

DIR=research/bundle-editorial
SKIP_ARCHIVE=0
SLUGS=()
for arg in "$@"; do
  case "$arg" in
    --no-archive) SKIP_ARCHIVE=1 ;;
    -*) echo "option inconnue : $arg" >&2; exit 2 ;;
    *) SLUGS+=("$arg") ;;
  esac
done

# Sans argument : toutes les fiches présentes.
if [ ${#SLUGS[@]} -eq 0 ]; then
  for f in "$DIR"/*.json; do
    s="$(basename "$f" .json)"
    SLUGS+=("$s")
  done
fi

echo "▶ 1/3 — Fiches éditoriales (${#SLUGS[@]})"
ok=0; fail=0; failed=()
for s in "${SLUGS[@]}"; do
  if [ ! -f "$DIR/$s.json" ]; then
    echo "  ✗ $s — fichier absent"; fail=$((fail+1)); failed+=("$s"); continue
  fi
  if node scripts/catalog-batch.mjs bundle-editorial --slug="$s" --overwrite --apply >/dev/null 2>&1; then
    ok=$((ok+1))
  else
    echo "  ✗ $s"; fail=$((fail+1)); failed+=("$s")
  fi
done
echo "  → $ok appliquée(s), $fail échec(s)"

# Une relance suffit en général : les échecs sont surtout des timeouts réseau.
if [ ${#failed[@]} -gt 0 ]; then
  echo "▶ relance des échecs…"
  for s in "${failed[@]}"; do
    node scripts/catalog-batch.mjs bundle-editorial --slug="$s" --overwrite --apply >/dev/null 2>&1 \
      && echo "  ✓ $s (2e essai)" || echo "  ✗ $s (toujours en échec)"
  done
fi

echo "▶ 2/3 — Descriptions courtes/longues (FR+EN)"
node scripts/fill-short-descriptions.mjs --apply 2>&1 | tail -1

if [ "$SKIP_ARCHIVE" -eq 0 ]; then
  echo "▶ 3/3 — Archivages (doublons, fiches fermées, junk)"
  node scripts/apply-archive-sql.mjs 2>&1 | tail -2
else
  echo "▶ 3/3 — Archivages ignorés (--no-archive)"
fi

echo "✅ Base synchronisée. Un push git déclenche le déploiement Vercel."
