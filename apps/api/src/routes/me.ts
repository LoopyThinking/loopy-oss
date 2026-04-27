import { Hono } from 'hono'
import sql from '../db/client.js'
import type { AuthVariables, User } from '../types.js'

// /me routes — current authenticated user's profile and agent tokens.

const me = new Hono<{ Variables: AuthVariables }>()

// ── GET /me — current user profile ───────────────────────────────────────────

me.get('/', async (c) => {
  const userId = c.get('userId')

  // Ensure a user row exists (auto-create for fresh self-hosted installs)
  await sql`
    INSERT INTO users (id, email, display_name)
    VALUES (
      ${userId},
      ${userId + '@placeholder.loopy'},
      NULL
    )
    ON CONFLICT (id) DO NOTHING
  `

  const [user] = await sql<User[]>`
    SELECT id, email, display_name, created_at
    FROM users
    WHERE id = ${userId}
  `

  // Also return org memberships for the org switcher
  const orgs = await sql<Array<{ id: string; name: string; slug: string; role: string }>>`
    SELECT o.id, o.name, o.slug, m.role
    FROM organizations o
    JOIN org_members m ON m.org_id = o.id
    WHERE m.user_id = ${userId}
    ORDER BY o.created_at ASC
  `

  return c.json({ ...user, orgs })
})

// ── PATCH /me — update display name ──────────────────────────────────────────

me.patch('/', async (c) => {
  const userId = c.get('userId')
  const body   = await c.req.json<{ display_name?: string }>()

  const displayName = body.display_name?.trim() ?? null

  if (displayName !== null && displayName.length > 120) {
    return c.json({ error: 'Bad Request', message: 'display_name must be ≤ 120 characters' }, 400)
  }

  const [user] = await sql<User[]>`
    UPDATE users
    SET display_name = ${displayName}
    WHERE id = ${userId}
    RETURNING id, email, display_name, created_at
  `

  if (!user) {
    return c.json({ error: 'Not Found', message: 'User not found' }, 404)
  }

  return c.json(user)
})

// ── GET /me/agents — agent tokens belonging to this user ─────────────────────
// Returns agents without their token_hash (never expose the hash).
// The plain token is only shown once, at creation time (POST /agents).

me.get('/agents', async (c) => {
  const userId = c.get('userId')

  const agents = await sql<Array<{
    id: string
    agent_name: string
    description: string | null
    is_active: boolean
    created_at: string
    last_seen_at: string | null
  }>>`
    SELECT id, agent_name, description, is_active, created_at, last_seen_at
    FROM agent_registry
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `

  return c.json(agents)
})

// ── DELETE /me/agents/:agentId — deactivate (revoke) an agent token ──────────

me.delete('/agents/:agentId', async (c) => {
  const userId  = c.get('userId')
  const agentId = c.req.param('agentId')

  const [agent] = await sql<Array<{ id: string }>>`
    UPDATE agent_registry
    SET is_active = false
    WHERE id = ${agentId} AND user_id = ${userId}
    RETURNING id
  `

  if (!agent) {
    return c.json({ error: 'Not Found', message: 'Agent not found or not owned by you' }, 404)
  }

  return c.body(null, 204)
})

export default me
