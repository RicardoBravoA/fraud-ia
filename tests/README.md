# Tests — Global strategy

Automated tests cover backend, frontend, and (when present) infra/Docker. Run everything:

```bash
./scripts/run-all-tests.sh
```

---

## Matrix

| Layer | Tool | Coverage target | Command |
|-------|------|-----------------|---------|
| Backend Python | pytest | ≥80% | `cd backend && pytest --cov=app --cov=scripts --cov-fail-under=80` |
| Frontend React | Vitest | ≥70% | `cd web && npm run test:coverage` |
| Infra Bicep | Azure CLI | all `.bicep` | `az bicep build --file infra/main.bicep` *(when exists)* |
| Docker | compose + build | Dockerfile | `docker compose config` *(build when Dockerfile exists)* |

---

## Backend tests

```
backend/tests/
├── conftest.py              # mongomock, LLM_MOCK=true
├── unit/                    # domain, services, agents, LLM, policies
├── integration/             # API routes, simulator, evaluate-pending
└── integration/test_ollama_live.py   # optional, needs Ollama
```

Key scenarios:

- Demo decisions T-1003, T-1001, T-1004, T-1005
- Bulk evaluate pending
- Simulator insert + audit
- LLM client retries and fallbacks

```bash
cd backend
pytest -v
pytest --cov=app --cov=scripts --cov-fail-under=80
```

---

## Frontend tests

```
web/src/
├── pages/__tests__/
├── components/__tests__/
├── hooks/__tests__/
├── api/__tests__/
└── lib/__tests__/
```

Uses **MSW** to mock API — no running backend required.

```bash
cd web
npm run test
npm run test:coverage
npm run lint
npm run build
```

---

## Infra / Docker (conditional)

`run-all-tests.sh` skips Bicep and Docker build if files are missing:

- `infra/main.bicep` — not yet in repo
- `backend/Dockerfile` — not yet in repo

---

## CI (planned)

GitHub Actions `ci.yml` will mirror `run-all-tests.sh` jobs before deploy.

---

## Layer READMEs

- [backend/README.md](../backend/README.md)
- [web/README.md](../web/README.md)
- [infra/README.md](../infra/README.md)
