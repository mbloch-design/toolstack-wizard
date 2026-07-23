#!/usr/bin/env bash
# Applique l'éditorial de tous les satellites de bundle (research/bundle-editorial/*.json)
# dans public.tools via la factory. Idempotent, transactionnel, sans prix propre.
# Usage : bash "/Users/mike/Documents/New project/apply-bundle-editorial.sh"
set -uo pipefail
cd "$(dirname "$0")"

ok=0; ko=0
for f in research/bundle-editorial/*.json; do
  slug=$(basename "$f" .json)
  if node scripts/catalog-batch.mjs bundle-editorial --slug="$slug" --apply >/tmp/be-"$slug".log 2>&1; then
    echo "  ✓ $slug"; ok=$((ok+1))
  else
    echo "  ✗ $slug — $(tail -1 /tmp/be-"$slug".log)"; ko=$((ko+1))
  fi
done
echo "Éditorial appliqué : $ok ok, $ko en échec."
