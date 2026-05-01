import { Hono } from 'hono'
import { randomBytes, createHash } from 'crypto'
import sql from '../db/client.js'
import type { AuthVariables } from '../types.js'

const agents = new Hono<{ Variables: AuthVariables }>()

// ── POST /agents ──────────────────────────────────────────────────────────────
// Registers a new agent and returns its Bearer token.
// The token is returned ONCE — it is stored as a SHA-256 hash server-side.

agents.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{
    agentName?: string
    description?: string
  }>()

  if (!body.agentName?.trim()) {
    return c.json({ error: 'Bad Request', message: 'agentName is required' }, 400)
  }

  if (body.agentName.length > 100) {
    return c.json(
      { error: 'Bad Request', message: 'agentName must be 100 characters or fewer' },
      400
    )
  }

  // Generate a cryptographically random token
  const rawToken = `lpy_agent_${randomBytes(32).toString('hex')}`
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')

  try {
    const [agent] = await sql<
      Array<{ id: string; agent_name: string; description: string | null; created_at: string }>
    >`
      INSERT INTO agent_registry (user_id, org_id, agent_name, token_hash, description)
      VALUES (
        ${userId},
        (SELECT org_id FROM org_members WHERE user_id = ${userId} ORDER BY joined_at ASC LIMIT 1),
        ${body.agentName.trim()},
        ${tokenHash},
        ${body.description ?? null}
      )
      RETURNING id, agent_name, description, created_at
    `

    return c.json(
      {
        id: agent.id,
        agentName: agent.agent_name,
        token: rawToken,   // returned ONCE — never stored in plain text
        description: agent.description,
        created_at: agent.created_at,
      },
      201
    )
  } catch (err: unknown) {
    // Unique constraint violation: agent name already exists for this user
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('agent_registry_unique_name_per_user')) {
      return c.json(
        { error: 'Conflict', message: `An agent named "${body.agentName}" already exists` },
        409
      )
    }
    throw err
  }
})

export default agents
