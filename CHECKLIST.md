# Checklist — BCP Technical Challenge

Status of PDF requirements vs this repository. Last updated to match implemented code.

---

## Functional requirements (PDF)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Web App Backend + Frontend | ✅ | FastAPI + React |
| 8 orchestrated agents | ✅ | Sequential pipeline in `orchestrator/pipeline.py` |
| 4 decision types | ✅ | APPROVE, CHALLENGE, BLOCK, ESCALATE_TO_HUMAN |
| Internal policy RAG | ⚠️ | JSON rule matching — no vector DB yet |
| Governed web search | ⚠️ | Mock only (`WEB_SEARCH_MOCK=true`) |
| HITL + audit trail | ✅ | Queue, resolve, MongoDB events, UI |
| Generative AI explanations | ⚠️ | Ollama local; Azure OpenAI stub |
| Python backend | ✅ | 3.11+ |
| Agent framework | ⚠️ | LangGraph in deps, not wired in code |
| Cloud deploy (Azure) | ❌ | Documented, not deployed |

---

## Demo data

| File | Status |
|------|--------|
| `data/transactions.csv` | ✅ 5 transactions |
| `data/customer_behavior.csv` | ✅ 3 customers |
| `data/fraud_policies.json` | ✅ FP-01 to FP-04 |
| `data/high_risk_merchants.json` | ✅ |

---

## Deliverables

| Item | Status |
|------|--------|
| GitHub repo + README | ⚠️ README done; push + email pending |
| Local run instructions | ✅ Root README |
| Azure demo URL | ❌ |
| 4 AI reports in `examples/evaluations/` | ❌ Use `reevaluate_demo` + manual export |
| Audit trail demonstrable | ✅ UI `/audit` + MongoDB |
| CI green | ⚠️ Local script; no GitHub Actions yet |
| Video 5 min (optional) | ❌ |

---

## Implementation status

| Component | Status |
|-----------|--------|
| `backend/` FastAPI + agents | ✅ |
| `web/` React + Vite | ✅ |
| `docker-compose.yml` (MongoDB) | ✅ |
| `backend/Dockerfile` | ❌ |
| `infra/main.bicep` | ❌ |
| `.github/workflows/ci.yml` | ❌ |
| `scripts/batch_evaluations.py` | ❌ (use `reevaluate_demo`) |

---

## Validate local environment

```bash
docker compose up -d mongo
cp .env.example .env
cp web/.env.example web/.env

cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
python -m scripts.seed_data
uvicorn app.main:app --reload --port 8000

# Another terminal
cd web && npm install && npm run dev

# Tests
./scripts/run-all-tests.sh
```

Submit repo to: **enriqueinca@bcp.com.pe**
