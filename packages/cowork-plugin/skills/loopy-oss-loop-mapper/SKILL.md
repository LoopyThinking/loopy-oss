# loopy-oss-loop-mapper

Translate significant work into a Loopy loop. Executes the pipeline: Work Signal → Loop Candidate → Loop Instance.

## Activation

Trigger **automatically** when the user:
- Completes a significant task, makes a decision, starts a project
- Repeats a process for the second time
- Says: "registra esto en loopy", "crea un loop", "mapea mi trabajo", "crea loop de esto"
- Says: "register this in loopy", "create a loop", "map my work", "track this"

## Environment

| Variable | Default |
|---|---|
| `LOOPY_BASE_URL` | `http://localhost:3001` |
| `LOOPY_AGENT_TOKEN` | required |
| `LOOPY_ORG_ID` | required (X-Org-Id header) |

## Cognitive layer mapping

Classify the work into the appropriate layer before creating the loop:

| Layer | When to use |
|---|---|
| `perception` | Gathering data, observing, reading |
| `interpretation` | Analysing, understanding, synthesising |
| `decision` | Choosing, planning, committing |
| `action` | Implementing, building, executing |
| `reflection` | Reviewing, retrospecting, learning |

## Pipeline

### Step 1 — Create the loop
```bash
curl -X POST {LOOPY_BASE_URL}/loops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {LOOPY_AGENT_TOKEN}" \
  -H "X-Org-Id: {LOOPY_ORG_ID}" \
  -d '{
    "title": "Título claro y específico",
    "hypothesis": "¿Qué resultado se espera? (opcional)",
    "scope": "personal"
  }'
→ { "id": "loop_uuid", "title": "...", "status": "open", ... }
```

`scope` values: `personal` | `team` | `organizational`

### Step 2 — Emit the initial Work Signal
```bash
curl -X POST {LOOPY_BASE_URL}/signals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {LOOPY_AGENT_TOKEN}" \
  -H "X-Org-Id: {LOOPY_ORG_ID}" \
  -d '{
    "loop_id": "loop_uuid",
    "type": "action",
    "content": "Descripción de lo que se hizo",
    "source": "agent"
  }'
```

`type` values: `perception` | `interpretation` | `decision` | `action` | `reflection`

### Step 3 — Register agent skills (optional, on startup)
```bash
curl -X POST {LOOPY_BASE_URL}/agents/{agentId}/skills \
  -H "Authorization: Bearer {LOOPY_AGENT_TOKEN}" \
  -H "X-Org-Id: {LOOPY_ORG_ID}" \
  -d '{"skillName": "loopy-oss-loop-mapper", "source": "plugin"}'
```

## Failure modes

| Situation | Response |
|---|---|
| Missing `LOOPY_AGENT_TOKEN` | Run `loopy-oss-bridge` setup first |
| Missing `LOOPY_ORG_ID` | Run `GET /orgs` and set org context |
| `400 scope invalid` | Use one of: personal, team, organizational |
| `400 type invalid` | Use one of: perception, interpretation, decision, action, reflection |
| `404 loop not found` | Loop ID is wrong — list loops with `GET /loops` |
