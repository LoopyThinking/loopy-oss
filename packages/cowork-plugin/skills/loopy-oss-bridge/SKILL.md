# loopy-oss-bridge

Connect Claude Cowork to a self-hosted Loopy OSS instance. Handles setup, agent registration, and org context.

## Activation

Trigger this skill when the user says (Spanish or English):
- "registra mi agente", "register my agent", "setup loopy", "conecta loopy"
- "configura loopy", "initialise loopy", "qué agentes tengo", "list my agents"
- "crea una organización", "create org", "¿cuál es mi org?", "set org context"
- "completa mi perfil", "update my display name", "actualiza mi nombre"
- First time the user interacts with Loopy in a new session (check env vars)

Do **not** ask for corporate fields like "rol", "área", "departamento", or anything related to "Orion".

## Environment

Read from environment before every request:

| Variable | Default | Notes |
|---|---|---|
| `LOOPY_BASE_URL` | `http://localhost:3001` | No trailing slash |
| `LOOPY_AGENT_TOKEN` | *(empty)* | Bearer token for agent auth. Set after registration. |

If `LOOPY_AGENT_TOKEN` is empty, trigger the registration flow automatically.

## Flow

### 1. Check env / session state
```
GET {LOOPY_BASE_URL}/health
→ { status: "ok", version: "0.4.0" }
```
If the request fails, inform the user the instance is not reachable and show the base URL being used.

### 2. Agent registration (only when LOOPY_AGENT_TOKEN is empty)
```bash
curl -X POST {LOOPY_BASE_URL}/agents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {USER_JWT}" \
  -H "X-Org-Id: {ORG_ID}" \
  -d '{"agent_name": "claude-cowork-agent", "description": "Claude Cowork agent"}'
→ { "id": "...", "token": "loopy_agent_...", ... }
```
**Important:** Show the token to the user exactly once and ask them to save it as `LOOPY_AGENT_TOKEN`.
After this, all subsequent requests use the `Authorization: Bearer {LOOPY_AGENT_TOKEN}` header.

### 3. Fetch org context
```bash
curl {LOOPY_BASE_URL}/orgs \
  -H "Authorization: Bearer {LOOPY_AGENT_TOKEN}"
→ [{ "id": "...", "name": "My Org", "slug": "my-org", "role": "owner" }]
```
Pick the first org (or let the user choose if there are multiple). Store `org_id` as `LOOPY_ORG_ID` and pass it as `X-Org-Id` on all subsequent requests.

### 4. Update display name (optional)
```bash
curl -X PATCH {LOOPY_BASE_URL}/me \
  -H "Authorization: Bearer {LOOPY_AGENT_TOKEN}" \
  -d '{"display_name": "Jaime"}'
```
Ask for `display_name` only. Do **not** ask for role, area, or team.

## Failure modes

| Situation | Response |
|---|---|
| Missing `LOOPY_AGENT_TOKEN` | Trigger registration flow (§2) |
| `401 Unauthorized` | Token expired or invalid — ask user to regenerate via `/agents` |
| `403 Forbidden` | User lacks required role for this action |
| `404 Not Found` | Resource does not exist — double-check IDs |
| Instance unreachable | Show the `LOOPY_BASE_URL` being used and suggest `npm run dev` |
