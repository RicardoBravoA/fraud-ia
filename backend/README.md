# Backend — FastAPI + Multi-Agent Pipeline + MongoDB

> **Demo setup:** use the root **[README.md](../README.md)** — one guide to init everything.

Python API for fraud evaluation: 8 agents, MongoDB persistence, optional Ollama LLM.

---

## Prerequisites

- Python **3.11+**
- MongoDB running (`docker compose up -d mongo` from repo root)
- Root `.env` copied from `.env.example`

---

## Quick start

```bash
# From repo root
cp .env.example .env

cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

pip install --upgrade pip
pip install -e ".[dev]"

python -m scripts.seed_data
uvicorn app.main:app --reload --port 8000
```

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health: `curl http://localhost:8000/health`

---

## Architecture (Clean / Hexagonal)

```
backend/app/
├── api/routes/         # HTTP — no business logic
├── services/           # FraudService, HitlService, AuditService, SimulatorService
├── domain/             # Pure models, signals, risk score (no I/O)
├── agents/             # 8 agents (async run(state) → state)
├── orchestrator/       # FraudPipeline — sequential agent runner
├── repositories/       # MongoDB CRUD
├── infrastructure/     # LLM client, policy store, web search
├── models/             # Pydantic API schemas
└── core/               # config, deps, database, exceptions
```

### Agent pipeline (execution order)

| # | Agent | LLM? | Role |
|---|-------|------|------|
| 1 | TransactionContextAgent | No | Signals: amount, hour, country, device |
| 2 | BehavioralPatternAgent | No | Profile deviation, new device flag |
| 3 | InternalPolicyRagAgent | No | Match FP-01…FP-04 from JSON policies |
| 4 | ExternalThreatIntelAgent | No | Web citations (mock or empty) |
| 5 | EvidenceAggregationAgent | No | Consolidate signals + citations |
| 6 | DebateAgents | **Yes** | Pro-Fraud vs Pro-Customer arguments |
| 7 | DecisionArbiterAgent | No | Final decision + risk score |
| 8 | ExplainabilityAgent | **Yes** | Customer + audit narratives |

Orchestrator: `app/orchestrator/pipeline.py` — sequential loop (LangGraph dependency present for future migration).

---

## MongoDB collections

| Collection | Content |
|------------|---------|
| `transactions` | Seed + simulator rows |
| `customer_behaviors` | Profile baselines |
| `evaluations` | Full EvaluationResult per transaction |
| `audit_events` | Append-only agent + HITL events |
| `hitl_cases` | Human review queue |

---

## Environment variables

Loaded from repo root `.env` via `app/core/config.py`:

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017/fraud_detection` | Database |
| `LLM_MOCK` | `true` in tests / `false` in `.env.example` | Skip Ollama |
| `LLM_PROVIDER` | `ollama` | `ollama` \| `azure` (stub) |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API |
| `OLLAMA_MODEL` | `qwen2.5:7b-instruct` | Model name |
| `LLM_TIMEOUT_SECONDS` | `120` | Per-request timeout |
| `LLM_MAX_RETRIES` | `2` | Retries on timeout |
| `WEB_SEARCH_MOCK` | `true` | Mock external intel |
| `HITL_CONFIDENCE_THRESHOLD` | `0.5` | Queue when risk ≥ threshold |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed frontend origins |

---

## LLM modes

### Tests (always mock)

`backend/tests/conftest.py` sets `LLM_MOCK=true`. No Ollama required for pytest.

### Local development (Ollama)

```bash
ollama serve
ollama pull qwen2.5:7b-instruct

# In .env: LLM_MOCK=false, LLM_PROVIDER=ollama
python -m scripts.validate_ollama
```

### Without Ollama

Set `LLM_MOCK=true` in `.env` — pipeline completes with deterministic text.

On timeout, Debate and Explainability agents use **rule-based fallbacks** (`app/infrastructure/llm/fallbacks.py`).

---

## Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Seed data | `python -m scripts.seed_data` | Load CSV/JSON into MongoDB |
| Reset evaluations | `python -m scripts.reset_evaluations` | Clear evaluations, audit, HITL |
| Re-evaluate demos | `python -m scripts.reevaluate_demo` | Run pipeline for T-1003/01/04/05 |
| Validate Ollama | `python -m scripts.validate_ollama` | Smoke test LLM connectivity |

### What to reset when re-testing

| Data | Reset? | Why |
|------|--------|-----|
| `transactions`, `customer_behaviors` | No | Input seed data |
| `evaluations` | Optional | Overwritten on re-evaluate |
| `audit_events`, `hitl_cases` | Optional | Append-only; reset for clean trail |

---

## API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Service + DB status |
| GET | `/api/transactions` | List all transactions |
| POST | `/api/transactions/{id}/evaluate` | Run pipeline |
| POST | `/api/transactions/evaluate-pending` | Bulk evaluate unevaluated |
| GET | `/api/evaluations/{transaction_id}` | Get stored evaluation |
| GET | `/api/hitl/queue` | Pending HITL cases |
| POST | `/api/hitl/{case_id}/resolve` | Resolve case `{ action, reviewer_note? }` |
| GET | `/api/audit/{transaction_id}` | Audit event timeline |
| GET | `/api/simulator/scenarios` | Available templates |
| GET | `/api/simulator/status` | Simulator stats |
| POST | `/api/simulator/insert/{template_id}` | Insert SIM-* row |
| POST | `/api/simulator/insert-next` | Insert next template |

### Evaluation response schema

```json
{
  "decision": "CHALLENGE",
  "confidence": 0.65,
  "signals": ["Monto fuera de rango", "Horario no habitual"],
  "citations_internal": [{ "policy_id": "FP-01", "chunk_id": "1", "version": "2025.1" }],
  "citations_external": [{ "url": "https://...", "summary": "..." }],
  "explanation_customer": "…",
  "explanation_audit": "…",
  "matched_policies": [],
  "transaction_context": {},
  "agent_trace": []
}
```

`confidence` is a **fraud risk score** in `[0.0, 1.0]` — higher = more risky.

HITL case created when `decision == ESCALATE_TO_HUMAN` or `confidence >= HITL_CONFIDENCE_THRESHOLD`.

---

## Demo decisions (automated tests)

| Transaction | Expected decision |
|-------------|-------------------|
| T-1003 | APPROVE |
| T-1001 | CHALLENGE |
| T-1004 | BLOCK |
| T-1005 | ESCALATE_TO_HUMAN |

Tests: `tests/unit/test_demo_decisions.py`, `tests/integration/test_api.py`

---

## Tests

```bash
cd backend
pytest --cov=app --cov=scripts --cov-fail-under=80
ruff check .
```

Optional live Ollama test:

```bash
OLLAMA_LIVE_TEST=1 pytest tests/integration/test_ollama_live.py -m ollama_live
```

| Suite | Path |
|-------|------|
| Unit | `tests/unit/` |
| Integration | `tests/integration/` |
| Fixtures | `tests/conftest.py` (mongomock, LLM mock) |

---

## curl examples

```bash
# Health
curl http://localhost:8000/health

# List transactions
curl http://localhost:8000/api/transactions

# Evaluate
curl -X POST http://localhost:8000/api/transactions/T-1003/evaluate

# Bulk pending
curl -X POST http://localhost:8000/api/transactions/evaluate-pending

# Audit trail
curl http://localhost:8000/api/audit/T-1003

# Simulator insert
curl -X POST http://localhost:8000/api/simulator/insert/T-1001
```

---

## Related docs

- [Root README](../README.md) — full stack + Git setup
- [Web README](../web/README.md) — frontend flows
- `.cursor/rules/python-backend.mdc` — layer rules
