# Demo evaluation exports

AI-generated reports for the **4 mandatory transactions** (one per decision type).

---

## Expected files

| File | Transaction | Decision |
|------|-------------|----------|
| `T-1003.json` + `T-1003.md` | T-1003 | APPROVE |
| `T-1001.json` + `T-1001.md` | T-1001 | CHALLENGE |
| `T-1004.json` + `T-1004.md` | T-1004 | BLOCK |
| `T-1005.json` + `T-1005.md` | T-1005 | ESCALATE_TO_HUMAN |

---

## Generate evaluations (MongoDB + API)

Prerequisites: MongoDB, backend running, Ollama optional (`LLM_MOCK=true` for fast mock text).

```bash
# From repo root
docker compose up -d mongo

cd backend
source .venv/bin/activate
python -m scripts.seed_data

# Optional: clean previous results
python -m scripts.reset_evaluations

# Run pipeline for all 4 demo transactions (~4 min with Ollama)
python -m scripts.reevaluate_demo
```

Results are stored in MongoDB collections `evaluations` and `audit_events`.

---

## Export JSON for this folder

After reevaluate, fetch each evaluation from the API and save here:

```bash
curl -s http://localhost:8000/api/evaluations/T-1003 | jq . > examples/evaluations/T-1003.json
curl -s http://localhost:8000/api/evaluations/T-1001 | jq . > examples/evaluations/T-1001.json
curl -s http://localhost:8000/api/evaluations/T-1004 | jq . > examples/evaluations/T-1004.json
curl -s http://localhost:8000/api/evaluations/T-1005 | jq . > examples/evaluations/T-1005.json
```

Create matching `.md` summaries from `explanation_customer` and `explanation_audit` for readable deliverables.

---

## JSON schema

Matches API `EvaluationResult`:

- `decision`, `confidence`, `signals`
- `citations_internal`, `citations_external`
- `explanation_customer`, `explanation_audit`
- `matched_policies`, `transaction_context`, `agent_trace`

See `.cursor/rules/decision-response-format.mdc`.

---

## Verify in the UI

| Transaction | Where to check |
|-------------|----------------|
| T-1003 | `/evaluations/T-1003` — APPROVE |
| T-1001 | `/evaluations/T-1001` — CHALLENGE |
| T-1004 | `/evaluations/T-1004` — BLOCK |
| T-1005 | `/evaluations/T-1005` — ESCALATE + HITL case |

Audit: `/audit/T-1004`

---

## Related tests

- `backend/tests/unit/test_demo_decisions.py`
- `backend/tests/integration/test_api.py`

Automated `scripts/batch_evaluations.py` — planned; use `reevaluate_demo` today.
