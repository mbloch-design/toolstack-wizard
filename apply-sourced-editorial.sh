#!/usr/bin/env bash
# Applique la repasse éditoriale SOURCÉE (fiches avec bloc "sources") dans public.tools.
# --overwrite car la repasse remplace l'éditorial existant. Transactionnel, sans prix propre.
# Usage : bash "/Users/mike/Documents/New project/apply-sourced-editorial.sh"
set -uo pipefail
cd "$(dirname "$0")"

ok=0; ko=0
for f in research/bundle-editorial/*.json; do
  slug=$(basename "$f" .json)
  # ne traiter que les fiches réellement sourcées (présence d'un bloc "sources")
  grep -q '"sources"' "$f" || continue
  if node scripts/catalog-batch.mjs bundle-editorial --slug="$slug" --overwrite --apply >/tmp/se-"$slug".log 2>&1; then
    echo "  ✓ $slug"; ok=$((ok+1))
  else
    echo "  ✗ $slug — $(tail -1 /tmp/se-"$slug".log)"; ko=$((ko+1))
  fi
done
echo "Repasse sourcée appliquée : $ok ok, $ko en échec."
