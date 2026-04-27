# loopy-oss-ipl-tracker

Summarise IPL (Índice de Productividad Liberada) — hours of human work executed by agents through loops.

## Activation

Trigger when the user says:
- "calcula mi IPL", "cuántas horas liberó loopy", "resumen de IPL"
- "calculate my IPL", "how many hours did the agent save", "IPL summary"
- "cuánto aportó el agente", "how productive was the agent this week"
- "ver mi índice de amplificación", "amplification index"
- Automatically offer after closing a loop where the agent generated signals.

## Environment

| Variable | Default |
|---|---|
| `LOOPY_BASE_URL` | `http://localhost:3001` |
| `LOOPY_AGENT_TOKEN` | required |
| `LOOPY_ORG_ID` | required (X-Org-Id header) |

## Fetch personal IPL

```bash
# Get all loops with their ipl_minutes
curl {LOOPY_BASE_URL}/loops \
  -H "Authorization: Bearer {LOOPY_AGENT_TOKEN}" \
  -H "X-Org-Id: {LOOPY_ORG_ID}"
→ [{ "id": "...", "title": "...", "ipl_minutes": 45, "status": "closed" }, ...]
```

Compute:
- `total_ipl_minutes` = sum of `ipl_minutes` across all loops
- `total_ipl_hours`   = total_ipl_minutes / 60
- `amplification_pct` = (total_ipl_hours / 180) × 100  (baseline = 180h/month)

## Fetch org-wide IPL (admin+)

```bash
curl {LOOPY_BASE_URL}/admin/overview \
  -H "Authorization: Bearer {LOOPY_AGENT_TOKEN}" \
  -H "X-Org-Id: {LOOPY_ORG_ID}"
→ { "total_ipl_hours": 12.5, "total_agents": 3, ... }
```

## Present the summary

Show a concise report:

```
📊 IPL Summary
──────────────────────────
Total horas liberadas: 12.5h
Amplificación: 6.9% (12.5h / 180h baseline)
Loops con actividad de agente: 8
──────────────────────────
Top loops por IPL:
  1. "Integración CI/CD" — 3.2h
  2. "Análisis de métricas" — 2.8h
  3. "Refactor auth module" — 1.5h
```

## Failure modes

| Situation | Response |
|---|---|
| No loops with `ipl_minutes > 0` | "Los agentes aún no han registrado IPL. Emite señales desde el agente para acumular IPL." |
| `403` on `/admin/overview` | User lacks admin role — fall back to personal loop data |
| `401` | Re-run `loopy-oss-bridge` to refresh token |
