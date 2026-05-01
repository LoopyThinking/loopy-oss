import { Hono } from 'hono'
import sql from '../db/client.js'
import { orgMiddleware, hasRole, forbiddenRole } from '../middleware/org.js'
import { encrypt, computeLast4, testConnection } from '../services/llm.js'
import type { AuthVariables, OrgLlmConfig, OrgLlmConfigPublic, LLMProviderType } from '../types.js'

const llm = new Hono<{ Variables: AuthVariables }>()

// All routes require org context + admin role
llm.use('/*', orgMiddleware)

// ── Helpers ──────────────────────────────────────────────────────────────────────

const VALID_PROVIDERS: LLMProviderType[] = ['anthropic', 'openai', 'google', 'openai_compatible', 'deepseek']

function toPublic(config: OrgLlmConfig): OrgLlmConfigPublic {
  return {
    id: config.id,
    org_id: config.org_id,
    provider: config.provider,
    display_name: config.display_name,
    model: config.model,
    base_url: config.base_url,
    api_key_last4: config.api_key_last4,
    is_default: config.is_default,
    is_active: config.is_active,
    last_tested_at: config.last_tested_at,
    last_test_ok: config.last_test_ok,
    last_test_error: config.last_test_error,
    created_at: config.created_at,
    updated_at: config.updated_at,
  }
}

async function ensureNoOtherDefault(orgId: string, excludeId?: string) {
  const q = excludeId
    ? sql`UPDATE org_llm_configs SET is_default = FALSE, updated_at = now()
          WHERE org_id = ${orgId} AND id != ${excludeId} AND is_default = TRUE`
    : sql`UPDATE org_llm_configs SET is_default = FALSE, updated_at = now()
          WHERE org_id = ${orgId} AND is_default = TRUE`
  await q
}

// ── GET /orgs/:id/llm-configs — list configs ────────────────────────────────────

llm.get('/', async (c) => {
  const myRole = c.get('orgRole')
  if (!hasRole(myRole, 'admin')) return c.json(forbiddenRole('admin'), 403)

  const rows = await sql<OrgLlmConfig[]>`
    SELECT * FROM org_llm_configs
    WHERE org_id = ${c.get('orgId')}
    ORDER BY created_at DESC
  `

  return c.json(rows.map(toPublic))
})

// ── POST /orgs/:id/llm-configs — create config ──────────────────────────────────

llm.post('/', async (c) => {
  const myRole = c.get('orgRole')
  if (!hasRole(myRole, 'admin')) return c.json(forbiddenRole('admin'), 403)

  const orgId = c.get('orgId')
  const userId = c.get('userId')
  const body = await c.req.json<{
    provider?: string
    display_name?: string
    model?: string
    base_url?: string
    api_key?: string
    is_default?: boolean
  }>()

  // Validate required fields
  if (!body.provider || !VALID_PROVIDERS.includes(body.provider as LLMProviderType)) {
    return c.json({ error: 'Bad Request', message: `provider must be one of: ${VALID_PROVIDERS.join(', ')}` }, 400)
  }
  if (!body.display_name?.trim()) {
    return c.json({ error: 'Bad Request', message: 'display_name is required' }, 400)
  }
  if (!body.model?.trim()) {
    return c.json({ error: 'Bad Request', message: 'model is required' }, 400)
  }
  if (!body.api_key) {
    return c.json({ error: 'Bad Request', message: 'api_key is required' }, 400)
  }
  if (body.provider === 'openai_compatible' && !body.base_url?.trim()) {
    return c.json({ error: 'Bad Request', message: 'base_url is required for openai_compatible provider' }, 400)
  }

  const apiKeyCipher = encrypt(body.api_key)
  const apiKeyLast4 = computeLast4(body.api_key)
  const isDefault = body.is_default ?? false

  if (isDefault) {
    await ensureNoOtherDefault(orgId)
  }

  const [config] = await sql<OrgLlmConfig[]>`
    INSERT INTO org_llm_configs (org_id, provider, display_name, model, base_url, api_key_cipher, api_key_last4, is_default, created_by)
    VALUES (${orgId}, ${body.provider}, ${body.display_name.trim()}, ${body.model.trim()}, ${body.base_url?.trim() ?? null}, ${apiKeyCipher}, ${apiKeyLast4}, ${isDefault}, ${userId})
    RETURNING *
  `

  return c.json(toPublic(config), 201)
})

// ── PATCH /orgs/:id/llm-configs/:configId — update non-key fields ────────────────

llm.patch('/:configId', async (c) => {
  const myRole = c.get('orgRole')
  if (!hasRole(myRole, 'admin')) return c.json(forbiddenRole('admin'), 403)

  const orgId = c.get('orgId')
  const configId = c.req.param('configId')
  const body = await c.req.json<{
    display_name?: string
    model?: string
    base_url?: string
    is_default?: boolean
    is_active?: boolean
  }>()

  // Build dynamic SET clauses using sql.join
  const sq = sql as any
  const setClauses: ReturnType<typeof sql>[] = []

  if (body.display_name !== undefined) setClauses.push(sql`display_name = ${body.display_name.trim()}`)
  if (body.model !== undefined) setClauses.push(sql`model = ${body.model.trim()}`)
  if (body.base_url !== undefined) setClauses.push(sql`base_url = ${body.base_url?.trim() ?? null}`)
  if (body.is_active !== undefined) setClauses.push(sql`is_active = ${body.is_active}`)

  if (body.is_default === true) {
    await ensureNoOtherDefault(orgId, configId)
    setClauses.push(sql`is_default = TRUE`)
  } else if (body.is_default === false) {
    setClauses.push(sql`is_default = FALSE`)
  }

  if (setClauses.length === 0) {
    return c.json({ error: 'Bad Request', message: 'No fields to update' }, 400)
  }

  setClauses.push(sql`updated_at = now()`)

  const [config] = await sql<OrgLlmConfig[]>`
    UPDATE org_llm_configs SET ${sq.join(setClauses, sql`, `)}
    WHERE org_id = ${orgId} AND id = ${configId}
    RETURNING *
  `

  if (!config) return c.json({ error: 'Not Found' }, 404)

  return c.json(toPublic(config))
})

// ── POST /orgs/:id/llm-configs/:configId/rotate — rotate API key ─────────────────

llm.post('/:configId/rotate', async (c) => {
  const myRole = c.get('orgRole')
  if (!hasRole(myRole, 'admin')) return c.json(forbiddenRole('admin'), 403)

  const orgId = c.get('orgId')
  const configId = c.req.param('configId')
  const body = await c.req.json<{ api_key?: string }>()

  if (!body.api_key) {
    return c.json({ error: 'Bad Request', message: 'api_key is required' }, 400)
  }

  const apiKeyCipher = encrypt(body.api_key)
  const apiKeyLast4 = computeLast4(body.api_key)

  const [config] = await sql<OrgLlmConfig[]>`
    UPDATE org_llm_configs SET api_key_cipher = ${apiKeyCipher}, api_key_last4 = ${apiKeyLast4}, last_test_ok = NULL, last_test_error = NULL, updated_at = now()
    WHERE org_id = ${orgId} AND id = ${configId}
    RETURNING *
  `

  if (!config) return c.json({ error: 'Not Found' }, 404)

  return c.json(toPublic(config))
})

// ── POST /orgs/:id/llm-configs/:configId/test — test connection ──────────────────

llm.post('/:configId/test', async (c) => {
  const myRole = c.get('orgRole')
  if (!hasRole(myRole, 'admin')) return c.json(forbiddenRole('admin'), 403)

  const orgId = c.get('orgId')
  const configId = c.req.param('configId')

  const [config] = await sql<OrgLlmConfig[]>`
    SELECT * FROM org_llm_configs WHERE org_id = ${orgId} AND id = ${configId}
  `

  if (!config) return c.json({ error: 'Not Found' }, 404)

  const result = await testConnection(config)

  const [updated] = await sql<OrgLlmConfig[]>`
    UPDATE org_llm_configs SET last_tested_at = now(), last_test_ok = ${result.ok}, last_test_error = ${result.error ?? null}, updated_at = now()
    WHERE org_id = ${orgId} AND id = ${configId}
    RETURNING *
  `

  return c.json(toPublic(updated))
})

// ── DELETE /orgs/:id/llm-configs/:configId — soft deactivate ─────────────────────

llm.delete('/:configId', async (c) => {
  const myRole = c.get('orgRole')
  if (!hasRole(myRole, 'admin')) return c.json(forbiddenRole('admin'), 403)

  const orgId = c.get('orgId')
  const configId = c.req.param('configId')

  const [config] = await sql<OrgLlmConfig[]>`
    SELECT * FROM org_llm_configs WHERE org_id = ${orgId} AND id = ${configId}
  `

  if (!config) return c.json({ error: 'Not Found' }, 404)

  if (config.is_default) {
    return c.json(
      { error: 'Conflict', message: 'Cannot delete the default LLM config. Promote another config to default first.' },
      409
    )
  }

  await sql`
    UPDATE org_llm_configs SET is_active = FALSE, updated_at = now()
    WHERE org_id = ${orgId} AND id = ${configId}
  `

  return c.body(null, 204)
})

export default llm
