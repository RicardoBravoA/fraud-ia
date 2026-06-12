#!/usr/bin/env bash
# Ejecuta tests de TODAS las tecnologías. Falla en el primer error.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAILED=0

run() {
  echo "==> $1"
  shift
  if "$@"; then
    echo "✓ OK: $1" 2>/dev/null || true
  else
    echo "✗ FAIL"
    FAILED=1
  fi
  echo
}

echo "=== Backend (pytest) ==="
run "pytest" bash -c "cd '$ROOT/backend' && pytest --cov=app --cov=scripts --cov-fail-under=80"

echo "=== Web (Vitest) ==="
run "vitest" bash -c "cd '$ROOT/web' && npm run test:coverage"

echo "=== Infra (Bicep) ==="
if command -v az &>/dev/null && [ -f "$ROOT/infra/main.bicep" ]; then
  run "bicep build" az bicep build --file "$ROOT/infra/main.bicep"
  run "bicep lint" az bicep lint --file "$ROOT/infra/main.bicep"
else
  echo "⚠ Skip bicep: az CLI no disponible o infra/main.bicep no existe aún"
fi

echo "=== Docker ==="
run "compose config" docker compose -f "$ROOT/docker-compose.yml" config
if [ -f "$ROOT/backend/Dockerfile" ]; then
  run "docker build" docker build -f "$ROOT/backend/Dockerfile" "$ROOT/backend"
else
  echo "⚠ Skip docker build: backend/Dockerfile no existe aún"
fi

if [ "$FAILED" -eq 1 ]; then
  echo "Al menos un test falló."
  exit 1
fi

echo "Todos los tests pasaron."
