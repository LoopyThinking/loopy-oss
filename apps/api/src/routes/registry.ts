import { Hono } from 'hono'
import sql from '../db/client.js'
import type { AuthVariables, OrgRole } from '../types.js'

const registry = new Hono<{ Variables: AuthVariables }>()

const VALID_TYPES = ['agent', 'skill', 'tool', 'workflow'] as const
type RegistryType = typeof VALID_TYPES[number]

// ── Helpers ────────────────────────────────────────────────────────────────────

const ROLE_RANK: Record<OrgRole, number> = {
  viewer: 0, member: 1, admin: 2, owner: 3,
}

function isAdmin(role: OrgRole): boolean {
  return ROLE_RANK[role] >= 2
}

async function getOrgId(c: any): Promise<string | null> {
  // Try X-Org-Id header first, then fall back to user's primary org
  const headerOrg = c.req.header('X-Org-Id')
  if (headerOrg) return headerOrg

  const userId = c.get('userId')
  const [row] = await sql<Array<{ org_id: string }>>`
    SELECT org_id FROM org_members
    WHERE user_id = ${userId}
    ORDER BY joined_at ASC
    LIMIT 1
  `
  return row?.org_id ?? null
}

// ── POST /registry — Batch upsert agents/skills/tools/workflows ────────────────
// Payload format is compatible with loopy-bridge cloud.
// agent_id in the payload → stored as agent_key in the DB.

registry.post('/', async (c) => {
  const userId = c.get('userId')
  const orgId = await getOrgId(c)
  if (!orgId) {
    return c.json({ error: 'Bad Request', message: 'No organization found. Set X-Org-Id header.' }, 400)
  }

  const body = await c.req.json<{
    source_agent?: string
    agents?: Array<{
      agent_id: string
      type: string
      name: string
      role?: string
      emoji?: string
      reports_to?: string
      subordinates?: string[]
      responsibilities?: string[]
      technical_specialization?: string[]
      vibe?: string
      strategic_priorities?: string[]
      team_contacts?: string[]
      status?: string
    }>
  }>()

  if (!body.agents || !Array.isArray(body.agents) || body.agents.length === 0) {
    return c.json({ error: 'Bad Request', message: 'agents array is required' }, 400)
  }

  let registered = 0
  let updated = 0
  const breakdown: Record<string, number> = { agent: 0, skill: 0, tool: 0, workflow: 0 }

  for (const agent of body.agents) {
    if (!agent.agent_id || !agent.type || !agent.name) {
      continue // skip invalid entries
    }
    if (!VALID_TYPES.includes(agent.type as RegistryType)) {
      continue
    }

    const type = agent.type as RegistryType

    // If reports_to is provided, resolve parent relationship
    // If subordinates is provided on an agent, we create reverse links later
    const parentKey = agent.reports_to ?? null

    // Upsert: if agent_key exists for this org → UPDATE, else → INSERT
    const [existing] = await sql<Array<{ id: string }>>`
      SELECT id FROM agent_catalog
      WHERE org_id = ${orgId} AND agent_key = ${agent.agent_id}
      LIMIT 1
    `

    if (existing) {
      await sql`
        UPDATE agent_catalog SET
          name = ${agent.name},
          type = ${type},
          role = ${agent.role ?? null},
          emoji = ${agent.emoji ?? null},
          parent_key = ${parentKey},
          responsibilities = ${agent.responsibilities ?? null},
          technical_specialization = ${agent.technical_specialization ?? null},
          vibe = ${agent.vibe ?? null},
          strategic_priorities = ${agent.strategic_priorities ?? null},
          team_contacts = ${agent.team_contacts ?? null},
          status = ${agent.status ?? 'active'},
          last_seen_at = NOW(),
          registered_by = ${userId}
        WHERE id = ${existing.id}
      `
      updated++
    } else {
      await sql`
        INSERT INTO agent_catalog (
          org_id, registered_by, agent_key, type, name, role, emoji,
          parent_key, responsibilities, technical_specialization, vibe,
          strategic_priorities, team_contacts, status, last_seen_at
        ) VALUES (
          ${orgId}, ${userId}, ${agent.agent_id}, ${type}, ${agent.name},
          ${agent.role ?? null}, ${agent.emoji ?? null},
          ${parentKey},
          ${agent.responsibilities ?? null},
          ${agent.technical_specialization ?? null},
          ${agent.vibe ?? null},
          ${agent.strategic_priorities ?? null},
          ${agent.team_contacts ?? null},
          ${agent.status ?? 'active'},
          NOW()
        )
      `
      registered++
    }
    breakdown[type]++
  }

  // Handle subordinates: if an agent lists subordinates, set parent_key on each
  for (const agent of body.agents) {
    if (agent.subordinates && Array.isArray(agent.subordinates)) {
      for (const subKey of agent.subordinates) {
        await sql`
          UPDATE agent_catalog
          SET parent_key = ${agent.agent_id}
          WHERE org_id = ${orgId}
            AND agent_key = ${subKey}
            AND (parent_key IS NULL OR parent_key != ${agent.agent_id})
        `
      }
    }
  }

  return c.json({
    registered,
    updated,
    total: body.agents.length,
    breakdown,
  }, 201)
})

// ── GET /registry — List catalog entries with optional filters ────────────────

registry.get('/', async (c) => {
  const userId = c.get('userId')
  const orgId = await getOrgId(c)
  if (!orgId) {
    return c.json({ error: 'Bad Request', message: 'No organization found. Set X-Org-Id header.' }, 400)
  }

  const typeFilter = c.req.query('type')
  const parentFilter = c.req.query('parentKey')
  const statusFilter = c.req.query('status')

  let query = sql`
    SELECT
      ac.id,
      ac.agent_key,
      ac.type,
      ac.name,
      ac.role,
      ac.emoji,
      ac.parent_key,
      ac.status,
      ac.created_at,
      ac.last_seen_at,
      u.display_name AS registered_by_name,
      (SELECT COUNT(*) FROM agent_catalog child WHERE child.parent_key = ac.agent_key AND child.org_id = ac.org_id)::int AS children_count
    FROM agent_catalog ac
    LEFT JOIN users u ON u.id = ac.registered_by
    WHERE ac.org_id = ${orgId}
  `

  if (typeFilter && VALID_TYPES.includes(typeFilter as RegistryType)) {
    query = sql`${query} AND ac.type = ${typeFilter}`
  }
  if (parentFilter) {
    if (parentFilter === 'null') {
      query = sql`${query} AND ac.parent_key IS NULL`
    } else {
      query = sql`${query} AND ac.parent_key = ${parentFilter}`
    }
  }
  if (statusFilter) {
    query = sql`${query} AND ac.status = ${statusFilter}`
  }

  query = sql`${query} ORDER BY ac.type, ac.name ASC`

  const rows = await query
  return c.json(rows)
})

// ── GET /registry/summary — Executive metrics ─────────────────────────────────

registry.get('/summary', async (c) => {
  const userId = c.get('userId')
  const orgId = await getOrgId(c)
  if (!orgId) {
    return c.json({ error: 'Bad Request', message: 'No organization found. Set X-Org-Id header.' }, 400)
  }

  const [counts] = await sql`
    SELECT
      COUNT(*)::int                                          AS total,
      COUNT(*) FILTER (WHERE type = 'agent')::int            AS agents,
      COUNT(*) FILTER (WHERE type = 'skill')::int             AS skills,
      COUNT(*) FILTER (WHERE type = 'tool')::int              AS tools,
      COUNT(*) FILTER (WHERE type = 'workflow')::int          AS workflows
    FROM agent_catalog
    WHERE org_id = ${orgId}
  `

  const [org] = await sql<Array<{ name: string }>>`
    SELECT name FROM organizations WHERE id = ${orgId}
  `

  // Active users in this org
  const [activeUsers] = await sql<Array<{ count: number }>>`
    SELECT COUNT(DISTINCT registered_by)::int AS count
    FROM agent_catalog
    WHERE org_id = ${orgId}
      AND last_seen_at > NOW() - INTERVAL '30 days'
  `

  // Most common specializations
  const specializations = await sql<Array<{ spec: string; count: number }>>`
    SELECT unnest(technical_specialization) AS spec, COUNT(*)::int AS count
    FROM agent_catalog
    WHERE org_id = ${orgId}
      AND technical_specialization IS NOT NULL
    GROUP BY spec
    ORDER BY count DESC
    LIMIT 5
  `

  // Last registered timestamp
  const [lastReg] = await sql<Array<{ last_seen_at: string | null }>>`
    SELECT last_seen_at::text
    FROM agent_catalog
    WHERE org_id = ${orgId}
    ORDER BY last_seen_at DESC NULLS LAST
    LIMIT 1
  `

  return c.json({
    total: counts.total,
    by_type: {
      agent: counts.agents,
      skill: counts.skills,
      tool: counts.tools,
      workflow: counts.workflows,
    },
    active_users: activeUsers?.count ?? 0,
    last_registered_at: lastReg?.last_seen_at ?? null,
    most_common_specializations: specializations.map(s => s.spec),
    org_name: org?.name ?? '',
  })
})

// ── GET /registry/:agentKey — Detail with children ────────────────────────────

registry.get('/:agentKey', async (c) => {
  const userId = c.get('userId')
  const orgId = await getOrgId(c)
  if (!orgId) {
    return c.json({ error: 'Bad Request', message: 'No organization found. Set X-Org-Id header.' }, 400)
  }

  const agentKey = c.req.param('agentKey')

  const [entry] = await sql`
    SELECT
      ac.id,
      ac.agent_key,
      ac.type,
      ac.name,
      ac.role,
      ac.emoji,
      ac.parent_key,
      ac.status,
      ac.responsibilities,
      ac.technical_specialization,
      ac.vibe,
      ac.strategic_priorities,
      ac.team_contacts,
      ac.created_at,
      ac.updated_at,
      ac.last_seen_at,
      u.display_name AS registered_by_name
    FROM agent_catalog ac
    LEFT JOIN users u ON u.id = ac.registered_by
    WHERE ac.org_id = ${orgId} AND ac.agent_key = ${agentKey}
    LIMIT 1
  `

  if (!entry) {
    return c.json({ error: 'Not Found', message: `Agent "${agentKey}" not found in this organization` }, 404)
  }

  // Get children
  const children = await sql`
    SELECT
      id, agent_key, type, name, role, emoji, parent_key, status,
      created_at, last_seen_at
    FROM agent_catalog
    WHERE org_id = ${orgId} AND parent_key = ${agentKey}
    ORDER BY type, name ASC
  `

  return c.json({ ...entry, children })
})

export default registry
