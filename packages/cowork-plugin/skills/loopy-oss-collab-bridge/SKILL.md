# loopy-oss-collab-bridge

Invite teammates to the org and share loops with them.

## Activation

Trigger when the user says:
- "invita a [persona]", "invite teammate", "add member to org"
- "genera un enlace de invitación", "generate invite link"
- "comparte este loop con [usuario]", "share loop with"
- "avisa al equipo", "escala al equipo", "transfiere el loop a"
- "revoca la invitación de", "revoke invite"
- "ver invitaciones pendientes", "list pending invites"

## Environment

| Variable | Default |
|---|---|
| `LOOPY_BASE_URL` | `http://localhost:3001` |
| `LOOPY_AGENT_TOKEN` | required |
| `LOOPY_ORG_ID` | required (X-Org-Id header) |

Requires **admin** or **owner** role in the org.

## Generate an invite link

```bash
curl -X POST {LOOPY_BASE_URL}/orgs/{orgId}/invites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {LOOPY_AGENT_TOKEN}" \
  -H "X-Org-Id: {LOOPY_ORG_ID}" \
  -d '{
    "role": "member",
    "expires_in_days": 7
  }'
→ {
    "invite_token": "abc123...",
    "expires_at": "2026-05-04T00:00:00Z",
    "role": "member",
    "accept_url": "/invites/accept/abc123..."
  }
```

Present the full URL as:
`{LOOPY_BASE_URL_WEB}/invites/accept/{invite_token}`

`role` options: `viewer` | `member` | `admin`
`expires_in_days`: 1–30, default 7.

**No email is sent** — the operator delivers the link to the invitee directly.

## List pending invites

```bash
curl {LOOPY_BASE_URL}/orgs/{orgId}/invites \
  -H "Authorization: Bearer {LOOPY_AGENT_TOKEN}" \
  -H "X-Org-Id: {LOOPY_ORG_ID}"
→ [{ "id": "...", "role": "member", "expires_at": "...", "created_at": "..." }]
```

## Revoke an invite

```bash
curl -X DELETE {LOOPY_BASE_URL}/orgs/{orgId}/invites/{inviteId} \
  -H "Authorization: Bearer {LOOPY_AGENT_TOKEN}" \
  -H "X-Org-Id: {LOOPY_ORG_ID}"
→ 204 No Content
```

After revocation, the public `GET /invites/{token}` returns `410 Gone`.

## List members

```bash
curl {LOOPY_BASE_URL}/orgs/{orgId}/members \
  -H "Authorization: Bearer {LOOPY_AGENT_TOKEN}" \
  -H "X-Org-Id: {LOOPY_ORG_ID}"
→ [{ "user_id": "...", "email": "...", "display_name": "...", "role": "member" }]
```

## Failure modes

| Situation | Response |
|---|---|
| `403 Forbidden` | User is not admin/owner — cannot manage invites |
| `409 Conflict` | Invite already accepted or already revoked |
| `410 Gone` | Invite expired or revoked — generate a new one |
| `404` | Invite not found — list invites to confirm |
