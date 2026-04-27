# loopy-oss-signal-emit

Emit a Work Signal to an existing loop. The "quick pen" — the user knows which loop and what to record.

## Activation

Trigger when the user says:
- "registra en el loop X", "emite una señal", "anota en loopy que"
- "marca que ya hice", "agrega al loop", "registra avance en"
- "emit signal", "add signal to loop", "log to loop", "update loop with"
- "deja constancia de", "record that I did"

Do **not** use this to create new loops — use `loopy-oss-loop-mapper` for that.

## Environment

| Variable | Default |
|---|---|
| `LOOPY_BASE_URL` | `http://localhost:3001` |
| `LOOPY_AGENT_TOKEN` | required |
| `LOOPY_ORG_ID` | required (X-Org-Id header) |

## Emit a signal

```bash
curl -X POST {LOOPY_BASE_URL}/signals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {LOOPY_AGENT_TOKEN}" \
  -H "X-Org-Id: {LOOPY_ORG_ID}" \
  -d '{
    "loop_id": "loop_uuid",
    "type": "action",
    "content": "Descripción concisa de la señal",
    "source": "agent",
    "metadata": {}
  }'
→ { "id": "signal_uuid", "loop_id": "...", "type": "action", ... }
```

### List user's loops (to find the right loop_id)
```bash
curl {LOOPY_BASE_URL}/loops \
  -H "Authorization: Bearer {LOOPY_AGENT_TOKEN}" \
  -H "X-Org-Id: {LOOPY_ORG_ID}"
→ [{ "id": "loop_uuid", "title": "...", "status": "open" }, ...]
```

## Signal types

| type | When to use |
|---|---|
| `perception` | Observing, gathering data, reading |
| `interpretation` | Analysing, synthesising |
| `decision` | Choosing, planning |
| `action` | Doing, building, executing |
| `reflection` | Reviewing, learning |

## Failure modes

| Situation | Response |
|---|---|
| User doesn't know the loop ID | List loops with `GET /loops`, let them choose |
| Loop is `closed` | Cannot add signals to a closed loop. Inform the user. |
| `401` | Token invalid — re-run `loopy-oss-bridge` |
| `404 loop not found` | Wrong loop_id — list loops to confirm |
