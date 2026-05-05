import { Hono } from 'hono'
import sql from '../db/client.js'
import type { AuthVariables, AgentSkill, AgentTool, SkillSource, ToolType } from '../types.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

const METADATA_MAX_BYTES = 8 * 1024 // 8 KB

function metadataTooLarge(metadata: unknown): boolean {
  try {
    return Buffer.byteLength(JSON.stringify(metadata), 'utf8') > METADATA_MAX_BYTES
  } catch {
    return true
  }
}

/**
 * Ensure the requesting agent owns the :agentId route param.
 * - Agents (token auth): agentId must match the route param exactly.
 * - Users (JWT auth): the agent must belong to this user.
 * Returns the resolved agent UUID or null if ownership check fails.
 */
async function resolveAgentOwnership(
  routeAgentId: string,
  ctxAgentId: string | null,
  ctxUserId: string
): Promise<string | null> {
  // Agent-token path: must match exactly
  if (ctxAgentId !== null) {
    return ctxAgentId === routeAgentId ? routeAgentId : null
  }

  // JWT (user) path: verify agent belongs to user
  const [row] = await sql<Array<{ id: string }>>`
    SELECT id FROM agent_registry
    WHERE id = ${routeAgentId}
      AND user_id = ${ctxUserId}
      AND is_active = true
    LIMIT 1
  `
  return row?.id ?? null
}

// ── Router ────────────────────────────────────────────────────────────────────

const capabilities = new Hono<{ Variables: AuthVariables }>()

// =============================================================================
// SKILLS
// =============================================================================

/**
 * POST /agents/:agentId/skills
 * Upsert a single skill for an agent (idempotent).
 */
capabilities.post('/:agentId/skills', async (c) => {
  const routeAgentId = c.req.param('agentId')
  const agentId = await resolveAgentOwnership(
    routeAgentId,
    c.get('agentId'),
    c.get('userId')
  )

  if (!agentId) {
    return c.json({ error: 'Forbidden', message: 'Agent not found or access denied' }, 403)
  }

  const body = await c.req.json<{
    skillName?: string
    version?: string
    description?: string
    source?: SkillSource
    metadata?: Record<string, unknown>
  }>()

  if (!body.skillName?.trim()) {
    return c.json({ error: 'Bad Request', message: 'skillName is required' }, 400)
  }
  if (body.skillName.length > 200) {
    return c.json({ error: 'Bad Request', message: 'skillName must be 200 characters or fewer' }, 400)
  }
  if (body.description && body.description.length > 500) {
    return c.json({ error: 'Bad Request', message: 'description must be 500 characters or fewer' }, 400)
  }
  if (body.metadata && metadataTooLarge(body.metadata)) {
    return c.json({ error: 'Bad Request', message: 'metadata exceeds 8 KB limit' }, 400)
  }

  const validSources: SkillSource[] = ['built-in', 'user', 'plugin']
  const source: SkillSource = body.source && validSources.includes(body.source) ? body.source : 'user'

  const [skill] = await sql<AgentSkill[]>`
    INSERT INTO agent_skills
      (agent_id, skill_name, version, description, source, metadata)
    VALUES (
      ${agentId},
      ${body.skillName.trim()},
      ${body.version ?? null},
      ${body.description ?? null},
      ${source},
      ${JSON.stringify(body.metadata ?? {})}
    )
    ON CONFLICT (agent_id, skill_name) DO UPDATE SET
      version      = EXCLUDED.version,
      description  = EXCLUDED.description,
      source       = EXCLUDED.source,
      metadata     = EXCLUDED.metadata,
      is_active    = true,
      last_seen_at = now()
    RETURNING *
  `

  return c.json(skill, 201)
})

/**
 * POST /agents/:agentId/skills/batch
 * Register multiple skills in a single request (session startup).
 * Returns the list of upserted skills.
 */
capabilities.post('/:agentId/skills/batch', async (c) => {
  const routeAgentId = c.req.param('agentId')
  const agentId = await resolveAgentOwnership(
    routeAgentId,
    c.get('agentId'),
    c.get('userId')
  )

  if (!agentId) {
    return c.json({ error: 'Forbidden', message: 'Agent not found or access denied' }, 403)
  }

  const body = await c.req.json<{
    skills?: Array<{
      skillName: string
      version?: string
      description?: string
      source?: SkillSource
      metadata?: Record<string, unknown>
    }>
  }>()

  if (!Array.isArray(body.skills) || body.skills.length === 0) {
    return c.json({ error: 'Bad Request', message: 'skills array is required and must be non-empty' }, 400)
  }
  if (body.skills.length > 100) {
    return c.json({ error: 'Bad Request', message: 'Cannot register more than 100 skills per batch' }, 400)
  }

  const validSources: SkillSource[] = ['built-in', 'user', 'plugin']
  const results: AgentSkill[] = []

  // Process sequentially to keep error messages per-item legible
  for (const item of body.skills) {
    if (!item.skillName?.trim()) continue

    const source: SkillSource = item.source && validSources.includes(item.source) ? item.source : 'user'

    const [skill] = await sql<AgentSkill[]>`
      INSERT INTO agent_skills
        (agent_id, skill_name, version, description, source, metadata)
      VALUES (
        ${agentId},
        ${item.skillName.trim()},
        ${item.version ?? null},
        ${item.description?.slice(0, 500) ?? null},
        ${source},
        ${JSON.stringify(item.metadata ?? {})}
      )
      ON CONFLICT (agent_id, skill_name) DO UPDATE SET
        version      = EXCLUDED.version,
        description  = EXCLUDED.description,
        source       = EXCLUDED.source,
        metadata     = EXCLUDED.metadata,
        is_active    = true,
        last_seen_at = now()
      RETURNING *
    `
    if (skill) results.push(skill)
  }

  return c.json({ registered: results.length, skills: results }, 200)
})

/**
 * DELETE /agents/:agentId/skills/:skillId
 * Soft-delete a skill (set is_active = false).
 */
capabilities.delete('/:agentId/skills/:skillId', async (c) => {
  const routeAgentId = c.req.param('agentId')
  const skillId      = c.req.param('skillId')
  const agentId = await resolveAgentOwnership(
    routeAgentId,
    c.get('agentId'),
    c.get('userId')
  )

  if (!agentId) {
    return c.json({ error: 'Forbidden', message: 'Agent not found or access denied' }, 403)
  }

  const [row] = await sql<Array<{ id: string }>>`
    UPDATE agent_skills
    SET is_active = false, deactivated_at = now()
    WHERE id = ${skillId} AND agent_id = ${agentId}
    RETURNING id
  `

  if (!row) {
    return c.json({ error: 'Not Found', message: 'Skill not found' }, 404)
  }

  return c.body(null, 204)
})

/**
 * GET /agents/:agentId/skills
 * List skills for an agent. Role-based visibility:
 * - Org admin/owner: sees all (active + inactive)
 * - Agent owner / member / viewer: sees only active
 */
capabilities.get('/:agentId/skills', async (c) => {
  const routeAgentId = c.req.param('agentId')
  const agentId = await resolveAgentOwnership(
    routeAgentId,
    c.get('agentId'),
    c.get('userId')
  )

  if (!agentId) {
    return c.json({ error: 'Forbidden', message: 'Agent not found or access denied' }, 403)
  }

  const orgRole = c.get('orgRole')
  const isOrgAdmin = orgRole === 'admin' || orgRole === 'owner'

  const skills = isOrgAdmin
    ? await sql<AgentSkill[]>`
        SELECT * FROM agent_skills
        WHERE agent_id = ${agentId}
        ORDER BY skill_name ASC
      `
    : await sql<AgentSkill[]>`
        SELECT * FROM agent_skills
        WHERE agent_id = ${agentId} AND is_active = true
        ORDER BY skill_name ASC
      `

  return c.json(skills)
})

// =============================================================================
// TOOLS
// =============================================================================

/**
 * POST /agents/:agentId/tools
 * Upsert a single tool for an agent (idempotent).
 */
capabilities.post('/:agentId/tools', async (c) => {
  const routeAgentId = c.req.param('agentId')
  const agentId = await resolveAgentOwnership(
    routeAgentId,
    c.get('agentId'),
    c.get('userId')
  )

  if (!agentId) {
    return c.json({ error: 'Forbidden', message: 'Agent not found or access denied' }, 403)
  }

  const body = await c.req.json<{
    toolName?: string
    toolType?: ToolType
    provider?: string
    description?: string
    metadata?: Record<string, unknown>
  }>()

  if (!body.toolName?.trim()) {
    return c.json({ error: 'Bad Request', message: 'toolName is required' }, 400)
  }
  if (body.toolName.length > 200) {
    return c.json({ error: 'Bad Request', message: 'toolName must be 200 characters or fewer' }, 400)
  }
  if (body.description && body.description.length > 500) {
    return c.json({ error: 'Bad Request', message: 'description must be 500 characters or fewer' }, 400)
  }
  if (body.metadata && metadataTooLarge(body.metadata)) {
    return c.json({ error: 'Bad Request', message: 'metadata exceeds 8 KB limit' }, 400)
  }

  const validTypes: ToolType[] = ['mcp', 'connector', 'function']
  const toolType: ToolType = body.toolType && validTypes.includes(body.toolType) ? body.toolType : 'function'

  const [tool] = await sql<AgentTool[]>`
    INSERT INTO agent_tools
      (agent_id, tool_name, tool_type, provider, description, metadata)
    VALUES (
      ${agentId},
      ${body.toolName.trim()},
      ${toolType},
      ${body.provider ?? null},
      ${body.description ?? null},
      ${JSON.stringify(body.metadata ?? {})}
    )
    ON CONFLICT (agent_id, tool_name) DO UPDATE SET
      tool_type    = EXCLUDED.tool_type,
      provider     = EXCLUDED.provider,
      description  = EXCLUDED.description,
      metadata     = EXCLUDED.metadata,
      is_active    = true,
      last_seen_at = now()
    RETURNING *
  `

  return c.json(tool, 201)
})

/**
 * POST /agents/:agentId/tools/batch
 * Register multiple tools in a single request.
 */
capabilities.post('/:agentId/tools/batch', async (c) => {
  const routeAgentId = c.req.param('agentId')
  const agentId = await resolveAgentOwnership(
    routeAgentId,
    c.get('agentId'),
    c.get('userId')
  )

  if (!agentId) {
    return c.json({ error: 'Forbidden', message: 'Agent not found or access denied' }, 403)
  }

  const body = await c.req.json<{
    tools?: Array<{
      toolName: string
      toolType?: ToolType
      provider?: string
      description?: string
      metadata?: Record<string, unknown>
    }>
  }>()

  if (!Array.isArray(body.tools) || body.tools.length === 0) {
    return c.json({ error: 'Bad Request', message: 'tools array is required and must be non-empty' }, 400)
  }
  if (body.tools.length > 100) {
    return c.json({ error: 'Bad Request', message: 'Cannot register more than 100 tools per batch' }, 400)
  }

  const validTypes: ToolType[] = ['mcp', 'connector', 'function']
  const results: AgentTool[] = []

  for (const item of body.tools) {
    if (!item.toolName?.trim()) continue

    const toolType: ToolType = item.toolType && validTypes.includes(item.toolType) ? item.toolType : 'function'

    const [tool] = await sql<AgentTool[]>`
      INSERT INTO agent_tools
        (agent_id, tool_name, tool_type, provider, description, metadata)
      VALUES (
        ${agentId},
        ${item.toolName.trim()},
        ${toolType},
        ${item.provider ?? null},
        ${item.description?.slice(0, 500) ?? null},
        ${JSON.stringify(item.metadata ?? {})}
      )
      ON CONFLICT (agent_id, tool_name) DO UPDATE SET
        tool_type    = EXCLUDED.tool_type,
        provider     = EXCLUDED.provider,
        description  = EXCLUDED.description,
        metadata     = EXCLUDED.metadata,
        is_active    = true,
        last_seen_at = now()
      RETURNING *
    `
    if (tool) results.push(tool)
  }

  return c.json({ registered: results.length, tools: results }, 200)
})

/**
 * DELETE /agents/:agentId/tools/:toolId
 * Soft-delete a tool (set is_active = false).
 */
capabilities.delete('/:agentId/tools/:toolId', async (c) => {
  const routeAgentId = c.req.param('agentId')
  const toolId       = c.req.param('toolId')
  const agentId = await resolveAgentOwnership(
    routeAgentId,
    c.get('agentId'),
    c.get('userId')
  )

  if (!agentId) {
    return c.json({ error: 'Forbidden', message: 'Agent not found or access denied' }, 403)
  }

  const [row] = await sql<Array<{ id: string }>>`
    UPDATE agent_tools
    SET is_active = false, deactivated_at = now()
    WHERE id = ${toolId} AND agent_id = ${agentId}
    RETURNING id
  `

  if (!row) {
    return c.json({ error: 'Not Found', message: 'Tool not found' }, 404)
  }

  return c.body(null, 204)
})

/**
 * GET /agents/:agentId/tools
 * List tools for an agent. Role-based visibility:
 * - Org admin/owner: sees all (active + inactive)
 * - Agent owner / member / viewer: sees only active
 */
capabilities.get('/:agentId/tools', async (c) => {
  const routeAgentId = c.req.param('agentId')
  const agentId = await resolveAgentOwnership(
    routeAgentId,
    c.get('agentId'),
    c.get('userId')
  )

  if (!agentId) {
    return c.json({ error: 'Forbidden', message: 'Agent not found or access denied' }, 403)
  }

  const orgRole = c.get('orgRole')
  const isOrgAdmin = orgRole === 'admin' || orgRole === 'owner'

  const tools = isOrgAdmin
    ? await sql<AgentTool[]>`
        SELECT * FROM agent_tools
        WHERE agent_id = ${agentId}
        ORDER BY tool_name ASC
      `
    : await sql<AgentTool[]>`
        SELECT * FROM agent_tools
        WHERE agent_id = ${agentId} AND is_active = true
        ORDER BY tool_name ASC
      `

  return c.json(tools)
})

export default capabilities
