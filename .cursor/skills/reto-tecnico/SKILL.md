---
name: reto-tecnico
description: Implementa el reto BCP de fraude multi-agente (FastAPI, MongoDB, React, Azure, tests en TODAS las tecnologías). Usar en este repo. Mobile en espera.
---

# Reto Técnico – Sistema Multi-Agente de Fraude

## Stack

- **backend/** — FastAPI + LangGraph + MongoDB
- **web/** — React + Vite
- **infra/** — Bicep Azure
- **mobile** — ⏸

## Calidad de código

Rule: **`engineering-standards.mdc`** — capas, SOLID, escalable, DI, tipado estricto.

## Tests — OBLIGATORIO en todas las tecnologías

Rule maestra: **`testing-strategy.mdc`**

```bash
./scripts/run-all-tests.sh
```

| Capa | Tool | Cov |
|------|------|-----|
| Backend + scripts | pytest | ≥80% |
| Web (components, pages, api, hooks) | Vitest | ≥70% |
| Infra Bicep | az bicep build/lint | 100% files |
| Docker | compose + build | CI |

## Fases

```
- [ ] Fase 1: scaffold + mongo + tests estructura vacía pasando
- [ ] Fase 2: API + repos MongoDB + tests repos
- [ ] Fase 3: RAG + tests rag
- [ ] Fase 4: Agentes + LangGraph + tests agents
- [ ] Fase 5: Web search + tests
- [ ] Fase 6: Debate + Explainability + tests
- [ ] Fase 7: HITL + audit + tests integration API
- [ ] Fase 8: React pages + tests Vitest cada page
- [ ] Fase 9: batch_evaluations + tests scripts
- [ ] Fase 10: Bicep + CI 7 jobs + deploy Azure + smoke
```

## Recursos

- [reference.md](reference.md)
- [data-models.md](data-models.md)
- [azure-deploy.md](azure-deploy.md)
- [../../tests/README.md](../../tests/README.md)
