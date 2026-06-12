# AGENTS.md – Guía para agentes de Cursor

## Stack

| Capa | Tech | Rule |
|------|------|------|
| Backend | Python FastAPI | `python-backend.mdc` — **Clean/Hexagonal** |
| Agentes | LangGraph | `multi-agent-architecture.mdc`, `llm-agents.mdc` |
| HITL | Cola + resolución | `hitl-workflow.mdc` |
| Web search | Tavily/mock | `web-search-governed.mdc` |
| DB | MongoDB / Cosmos | `mongodb.mdc` |
| API schema | EvaluationResult | `decision-response-format.mdc` |
| Web | React Vite | `web-frontend.mdc` — **Feature-based + Hooks** |
| Azure | Container Apps + SWA | `azure-architecture.mdc` |
| CI/CD | GitHub Actions | `azure-cicd.mdc` |
| Mobile | ⏸ | `mobile-frontend.mdc` |

## Rules transversales (always apply)

- `project-context.mdc` — objetivo, stack, entregables
- `engineering-standards.mdc` — arquitectura limpia, SOLID, código escalable
- `testing-strategy.mdc` — índice tests

## Rules testing (por glob)

| Rule | Alcance |
|------|---------|
| `python-testing.mdc` | backend app + scripts |
| `web-testing.mdc` | React components, pages, api, hooks |
| `infra-testing.mdc` | Bicep, Docker, smoke |

## Comando tests

```bash
./scripts/run-all-tests.sh
```

## Skill

`.cursor/skills/reto-tecnico/SKILL.md` | [CHECKLIST.md](CHECKLIST.md) pre-start
