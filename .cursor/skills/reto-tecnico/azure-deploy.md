# Azure Deploy — Referencia detallada

Ver rules: `azure-architecture.mdc`, `azure-cicd.mdc`, `mongodb.mdc`.

## Orden de provisión

1. Resource group `rg-fraud-detection-prod`
2. Key Vault + secrets
3. **Cosmos DB for MongoDB** (API MongoDB, serverless o provisioned)
4. Azure OpenAI (gpt-4o + text-embedding-3-small)
5. AI Search + índice `fraud-policies`
6. ACR + build/push imagen backend
7. Container Apps + Application Insights
8. Static Web Apps + deploy React
9. Seed MongoDB + index policies

## Bicep modules

```bicep
module kv './modules/key-vault.bicep'
module cosmos './modules/cosmos-mongodb.bicep'   // reemplaza postgresql
module search './modules/ai-search.bicep'
module insights './modules/app-insights.bicep'
module acr './modules/container-registry.bicep'
module api './modules/container-app.bicep'
module web './modules/static-web-app.bicep'
```

## Secretos Key Vault

- `mongodb-uri` — connection string Cosmos DB
- `azure-openai-key`, `azure-search-key`

## Smoke tests

```bash
curl https://<api>/health
curl -X POST https://<api>/api/transactions/T-1003/evaluate
curl https://<api>/api/audit/T-1003
```

## Troubleshooting

| Problema | Solución |
|----------|----------|
| Cosmos connection | Firewall IP + `MONGODB_URI` en KV |
| RAG vacío | Re-ejecutar `index_policies` |
| Tests CI fallan | Ver `python-testing.mdc`, `web-testing.mdc` |
