#!/usr/bin/env bash
# Valida que todos los módulos Bicep compilen y pasen lint.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if ! command -v az &>/dev/null; then
  echo "az CLI no encontrado — skip infra tests"
  exit 0
fi

shopt -s nullglob
files=("$ROOT"/*.bicep "$ROOT"/modules/*.bicep)

if [ ${#files[@]} -eq 0 ]; then
  echo "No hay archivos .bicep aún — skip"
  exit 0
fi

for f in "${files[@]}"; do
  echo "==> build: $f"
  az bicep build --file "$f"
  echo "==> lint: $f"
  az bicep lint --file "$f"
done

echo "Infra Bicep OK."
