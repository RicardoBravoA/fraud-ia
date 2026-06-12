#!/usr/bin/env bash
# One-shot local setup for the fraud detection demo.
# Usage: ./scripts/demo-init.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== BCP Fraud Detection — Demo setup ==="
echo

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    exit 1
  fi
}

need_cmd docker
need_cmd python3

OLLAMA_MODEL="qwen2.5:7b-instruct"

if [ ! -f "$ROOT/.env" ]; then
  cp "$ROOT/.env.example" "$ROOT/.env"
  echo "Created .env from .env.example"
fi

if [ ! -f "$ROOT/web/.env" ]; then
  cp "$ROOT/web/.env.example" "$ROOT/web/.env"
  echo "Created web/.env from web/.env.example"
fi

if [ -f "$ROOT/.env" ]; then
  _model_from_env="$(grep -E '^OLLAMA_MODEL=' "$ROOT/.env" 2>/dev/null | cut -d= -f2- | tr -d '\r" ' || true)"
  if [ -n "$_model_from_env" ]; then
    OLLAMA_MODEL="$_model_from_env"
  fi
fi

install_ollama() {
  if command -v ollama >/dev/null 2>&1; then
    return 0
  fi

  echo "→ Ollama not found — installing..."
  case "$(uname -s)" in
    Darwin)
      if command -v brew >/dev/null 2>&1; then
        brew install ollama
      else
        echo "⚠ Homebrew not found. Install Ollama manually:"
        echo "  https://ollama.com/download"
        return 1
      fi
      ;;
    Linux)
      if command -v curl >/dev/null 2>&1; then
        curl -fsSL https://ollama.com/install.sh | sh
      else
        echo "⚠ curl not found. Install Ollama manually:"
        echo "  https://ollama.com/download"
        return 1
      fi
      ;;
    *)
      echo "⚠ Install Ollama manually: https://ollama.com/download"
      return 1
      ;;
  esac
}

ensure_ollama_running() {
  if curl -sf http://localhost:11434/api/tags >/dev/null 2>&1; then
    return 0
  fi

  echo "→ Starting Ollama server..."
  if [[ "$(uname -s)" == "Darwin" ]] && [ -d "/Applications/Ollama.app" ]; then
    open -a Ollama 2>/dev/null || true
    sleep 4
  fi

  if ! curl -sf http://localhost:11434/api/tags >/dev/null 2>&1; then
    nohup ollama serve >/tmp/ollama-serve.log 2>&1 &
    sleep 4
  fi

  curl -sf http://localhost:11434/api/tags >/dev/null 2>&1
}

setup_ollama() {
  echo "→ Ollama (local LLM for debate + explanations)..."

  if ! command -v ollama >/dev/null 2>&1; then
    install_ollama || {
      echo "⚠ Skipping model download. Use LLM_MOCK=true in .env for a fast demo without Ollama."
      return 0
    }
  fi

  if ! ensure_ollama_running; then
    echo "⚠ Ollama server not reachable at http://localhost:11434"
    echo "  macOS: open the Ollama app from Applications, then run:"
    echo "    ollama pull $OLLAMA_MODEL"
    echo "  Or set LLM_MOCK=true in .env to skip the LLM."
    return 0
  fi

  echo "→ Pulling model $OLLAMA_MODEL (first time may take several minutes)..."
  if ollama pull "$OLLAMA_MODEL"; then
    echo "✓ Ollama ready with model $OLLAMA_MODEL"
  else
    echo "⚠ ollama pull failed — run manually: ollama pull $OLLAMA_MODEL"
  fi
}

echo "→ Starting MongoDB..."
docker compose up -d mongo

echo "→ Waiting for MongoDB..."
for _ in $(seq 1 30); do
  if docker compose exec -T mongo mongosh --quiet --eval "db.adminCommand('ping').ok" 2>/dev/null | grep -q 1; then
    break
  fi
  sleep 1
done

echo "→ Backend: venv + dependencies..."
cd "$ROOT/backend"
if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
pip install --upgrade pip -q
pip install -e ".[dev]" -q

echo "→ Seeding demo data (transactions + customer profiles)..."
python -m scripts.seed_data

echo "→ Frontend: npm install..."
cd "$ROOT/web"
if command -v npm >/dev/null 2>&1; then
  npm install --silent
else
  echo "⚠ npm not found — install Node 20+ and run: cd web && npm install"
fi

cd "$ROOT"
setup_ollama

echo
echo "=== Setup complete ==="
echo
echo "Open 2 terminals and run:"
echo
echo "  # Terminal 1 — Backend API (Ollama should already be running)"
echo "  cd backend && source .venv/bin/activate"
echo "  uvicorn app.main:app --reload --port 8000"
echo
echo "  # Terminal 2 — Frontend"
echo "  cd web && npm run dev"
echo
echo "Then open: http://localhost:5173"
echo
echo "If Ollama is not running, start it:"
echo "  macOS: open -a Ollama   # or: ollama serve"
echo "  Linux: ollama serve"
echo
echo "Validate Ollama + backend:"
echo "  cd backend && source .venv/bin/activate && python -m scripts.validate_ollama"
echo
echo "Optional — reset evaluations before a fresh demo:"
echo "  cd backend && source .venv/bin/activate && python -m scripts.reset_evaluations"
echo
