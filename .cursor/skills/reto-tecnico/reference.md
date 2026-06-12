# Referencia – Desafío Técnico BCP

## Stack activo

| Capa | Tech |
|------|------|
| Servidor | Python 3.11+ / FastAPI / LangGraph |
| DB | **MongoDB** / **Cosmos DB MongoDB API** |
| RAG | Chroma (local) / Azure AI Search (prod) |
| LLM | Azure OpenAI |
| Web | React + Vite |
| Tests | pytest ≥80%, Vitest ≥70% |
| Cloud | Container Apps + SWA + Key Vault |

## Base de datos — ¿MongoDB?

El PDF **no indica** motor específico. MongoDB es adecuado para:

- Documentos con `agent_trace`, `citations` anidadas
- Audit trail append-only (`audit_events`)
- Cola HITL flexible

**RAG vectorial** permanece en **Azure AI Search** (no confundir con MongoDB).

## API mínima

```
POST /api/transactions/{id}/evaluate
GET  /api/transactions
GET  /api/evaluations/{id}
GET  /api/hitl/queue
POST /api/hitl/{case_id}/resolve
GET  /api/audit/{transaction_id}
GET  /health
```

## Azure

| Componente | Servicio |
|------------|----------|
| API | Container Apps + ACR |
| Web | Static Web Apps |
| DB | **Cosmos DB for MongoDB** |
| RAG/LLM | AI Search + Azure OpenAI |
| CI | GitHub Actions + tests obligatorios |

Detalle: [azure-deploy.md](azure-deploy.md)

## Colecciones MongoDB

`transactions`, `customer_behaviors`, `evaluations`, `audit_events`, `hitl_cases`

Ver [data-models.md](data-models.md) y rule `mongodb.mdc`.
