# Modelos de Datos

## CSV / JSON fuente

Ver `data/transactions.csv`, `data/customer_behavior.csv`, `data/fraud_policies.json`.

## Señales derivadas — Python (`shared` logic en backend)

```python
def compute_signals(tx: Transaction, behavior: CustomerBehavior) -> list[str]:
    ...
```

## EvaluationResult — Pydantic (API) + MongoDB (persistencia)

Mismo schema que `.cursor/rules/decision-response-format.mdc`.
En MongoDB guardar también `agent_trace[]` y `created_at`.

## Colecciones MongoDB

| Colección | Clave de negocio | Contenido |
|-----------|------------------|-----------|
| `transactions` | `transaction_id` | Fila CSV + timestamps |
| `customer_behaviors` | `customer_id` | Perfil habitual |
| `evaluations` | `transaction_id` | EvaluationResult + agent_trace |
| `audit_events` | compuesto | Log append-only por agente |
| `hitl_cases` | `case_id` | Cola HITL + resolución |

## Web TypeScript

Espejar JSON en `web/src/types/evaluation.ts`.

## RAG (no MongoDB)

Políticas vectorizadas en **Azure AI Search** (prod) o **Chroma** (local).
