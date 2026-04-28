import { Hono } from 'hono'
import sql from '../db/client.js'
import { orgMiddleware, hasRole, forbiddenRole } from '../middleware/org.js'
import { listTemplates, getTemplate } from '../analytics/templates/index.js'
import { getProvider, decrypt } from '../services/llm.js'
import { resolvePeriod } from '../services/analytics-data.js'
import type {
  AuthVariables, OrgLlmConfig, Analysis, AnalysisTemplate as AnalysisTemplateType,
} from '../types.js'

const analytics = new Hono<{ Variables: AuthVariables }>()

analytics.use('/*', orgMiddleware)

// ── Helpers ──────────────────────────────────────────────────────────────────────

async function getDefaultLlmConfig(orgId: string): Promise<OrgLlmConfig | null> {
  const [config] = await sql<OrgLlmConfig[]>`
    SELECT * FROM org_llm_configs
    WHERE org_id = ${orgId} AND is_default = TRUE AND is_active = TRUE
    LIMIT 1
  `
  return config ?? null
}

async function getOrgPrompt(orgId: string, templateKey: string): Promise<string | null> {
  const [row] = await sql<Array<{ prompt: string }>>`
    SELECT prompt FROM analysis_templates
    WHERE org_id = ${orgId} AND template_key = ${templateKey}
    LIMIT 1
  `
  return row?.prompt ?? null
}

// ── GET /analytics/templates — list available templates ──────────────────────────

analytics.get('/templates', async (c) => {
  const myRole = c.get('orgRole')
  if (!hasRole(myRole, 'admin')) return c.json(forbiddenRole('admin'), 403)

  const orgId = c.get('orgId')
  const templates = listTemplates()

  const result = await Promise.all(templates.map(async (t) => {
    const override = await getOrgPrompt(orgId, t.key)
    return {
      key: t.key,
      name: t.name,
      description: t.description,
      category: t.category,
      default_period: t.defaultPeriod,
      has_custom_prompt: override !== null,
    }
  }))

  return c.json(result)
})

// ── GET /analytics/templates/:key — detail (prompts + schema) ────────────────────

analytics.get('/templates/:key', async (c) => {
  const myRole = c.get('orgRole')
  if (!hasRole(myRole, 'admin')) return c.json(forbiddenRole('admin'), 403)

  const orgId = c.get('orgId')
  const key = c.req.param('key')
  const t = getTemplate(key)

  if (!t) return c.json({ error: 'Not Found', message: `Template "${key}" not found` }, 404)

  const orgPrompt = await getOrgPrompt(orgId, key)

  return c.json({
    key: t.key,
    name: t.name,
    description: t.description,
    category: t.category,
    default_period: t.defaultPeriod,
    default_prompt: t.defaultPrompt,
    org_prompt: orgPrompt,
    output_schema: t.outputSchema,
  })
})

// ── PUT /analytics/templates/:key/prompt — save org prompt override ──────────────

analytics.put('/templates/:key/prompt', async (c) => {
  const myRole = c.get('orgRole')
  if (!hasRole(myRole, 'admin')) return c.json(forbiddenRole('admin'), 403)

  const orgId = c.get('orgId')
  const userId = c.get('userId')
  const key = c.req.param('key')
  const body = await c.req.json<{ prompt?: string }>()

  if (!body.prompt?.trim()) {
    return c.json({ error: 'Bad Request', message: 'prompt is required' }, 400)
  }

  await sql`
    INSERT INTO analysis_templates (org_id, template_key, prompt, updated_by)
    VALUES (${orgId}, ${key}, ${body.prompt.trim()}, ${userId})
    ON CONFLICT (org_id, template_key) DO UPDATE
      SET prompt = EXCLUDED.prompt, updated_by = EXCLUDED.updated_by, updated_at = now()
  `

  return c.json({ ok: true })
})

// ── DELETE /analytics/templates/:key/prompt — remove org prompt override ─────────

analytics.delete('/templates/:key/prompt', async (c) => {
  const myRole = c.get('orgRole')
  if (!hasRole(myRole, 'admin')) return c.json(forbiddenRole('admin'), 403)

  const orgId = c.get('orgId')
  const key = c.req.param('key')

  await sql`
    DELETE FROM analysis_templates WHERE org_id = ${orgId} AND template_key = ${key}
  `

  return c.body(null, 204)
})

// ── POST /analytics/run — run an analysis ────────────────────────────────────────

analytics.post('/run', async (c) => {
  const myRole = c.get('orgRole')
  if (!hasRole(myRole, 'admin')) return c.json(forbiddenRole('admin'), 403)

  const orgId = c.get('orgId')
  const userId = c.get('userId')
  const body = await c.req.json<{
    template_key?: string
    period?: string
    llm_config_id?: string | null
    prompt_override?: string
  }>()

  if (!body.template_key) {
    return c.json({ error: 'Bad Request', message: 'template_key is required' }, 400)
  }

  const template = getTemplate(body.template_key)
  if (!template) {
    return c.json({ error: 'Not Found', message: `Template "${body.template_key}" not found` }, 404)
  }

  // Resolve prompt
  const prompt = body.prompt_override ?? (await getOrgPrompt(orgId, body.template_key)) ?? template.defaultPrompt

  // Resolve period
  const period = resolvePeriod(body.period ?? template.defaultPeriod)

  // Load inputs
  const dataInputs = await template.loadInputs(orgId, period)

  // Determine if this template needs LLM
  const needsLlm = template.category !== 'roi' // Simplification; all current templates use LLM

  let llmConfig: OrgLlmConfig | null = null
  if (body.llm_config_id) {
    const [config] = await sql<OrgLlmConfig[]>`
      SELECT * FROM org_llm_configs WHERE id = ${body.llm_config_id} AND org_id = ${orgId}
    `
    llmConfig = config ?? null
  }

  if (needsLlm && !llmConfig) {
    llmConfig = await getDefaultLlmConfig(orgId)
  }

  if (needsLlm && !llmConfig) {
    return c.json({
      error: 'No Default LLM Config',
      message: 'No default LLM provider configured. Add one in Settings → Proveedores LLM.',
    }, 422)
  }

  // Create analysis record
  const [analysis] = await sql<Analysis[]>`
    INSERT INTO analyses (org_id, template_key, period_label, prompt_used, data_inputs, llm_config_id, llm_provider, llm_model, status)
    VALUES (
      ${orgId},
      ${body.template_key},
      ${period.label},
      ${prompt},
      ${JSON.stringify(dataInputs)},
      ${llmConfig?.id ?? null},
      ${llmConfig?.provider ?? null},
      ${llmConfig?.model ?? null},
      'running'
    )
    RETURNING *
  `

  // Run the analysis (async — fire and forget)
  runAnalysisJob(analysis.id, orgId, prompt, dataInputs, template, llmConfig).catch(err => {
    console.error(`[analytics] Analysis ${analysis.id} failed:`, err)
  })

  return c.json({ analysis_id: analysis.id }, 201)
})

async function runAnalysisJob(
  analysisId: string,
  orgId: string,
  prompt: string,
  dataInputs: Record<string, unknown>,
  template: { outputSchema: Record<string, unknown> },
  llmConfig: OrgLlmConfig | null,
) {
  try {
    if (!llmConfig) {
      // Deterministic-only analysis — just store the inputs
      await sql`
        UPDATE analyses SET result = ${JSON.stringify(dataInputs)}, status = 'succeeded', completed_at = now()
        WHERE id = ${analysisId}
      `
      return
    }

    const provider = getProvider(llmConfig)
    const result = await provider.complete({
      systemPrompt: prompt,
      userPrompt: formatInputsForPrompt(dataInputs),
      schema: template.outputSchema,
      temperature: 0.3,
    })

    await sql`
      UPDATE analyses
      SET result = ${JSON.stringify(result.structured ?? { content: result.content })},
          status = 'succeeded',
          completed_at = now()
      WHERE id = ${analysisId}
    `
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    await sql`
      UPDATE analyses SET status = 'failed', error = ${msg}, completed_at = now()
      WHERE id = ${analysisId}
    `
  }
}

function formatInputsForPrompt(inputs: Record<string, unknown>): string {
  return JSON.stringify(inputs, null, 2)
}

// ── GET /analytics/analyses — list recent runs ───────────────────────────────────

analytics.get('/analyses', async (c) => {
  const myRole = c.get('orgRole')
  if (!hasRole(myRole, 'admin')) return c.json(forbiddenRole('admin'), 403)

  const orgId = c.get('orgId')
  const templateKey = c.req.query('template_key')
  const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10), 100)
  const offset = parseInt(c.req.query('offset') ?? '0', 10)

  const where = templateKey
    ? sql`WHERE org_id = ${orgId} AND template_key = ${templateKey}`
    : sql`WHERE org_id = ${orgId}`

  const rows = await sql<Analysis[]>`
    SELECT * FROM analyses ${where}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  return c.json(rows)
})

// ── GET /analytics/analyses/:id — full result ────────────────────────────────────

analytics.get('/analyses/:id', async (c) => {
  const myRole = c.get('orgRole')
  if (!hasRole(myRole, 'admin')) return c.json(forbiddenRole('admin'), 403)

  const orgId = c.get('orgId')
  const id = c.req.param('id')

  const [row] = await sql<Analysis[]>`
    SELECT * FROM analyses WHERE id = ${id} AND org_id = ${orgId}
  `

  if (!row) return c.json({ error: 'Not Found' }, 404)

  return c.json(row)
})

// ── GET /analytics/analyses/:id/markdown — markdown export ───────────────────────

analytics.get('/analyses/:id/markdown', async (c) => {
  const myRole = c.get('orgRole')
  if (!hasRole(myRole, 'admin')) return c.json(forbiddenRole('admin'), 403)

  const orgId = c.get('orgId')
  const id = c.req.param('id')

  const [row] = await sql<Analysis[]>`
    SELECT * FROM analyses WHERE id = ${id} AND org_id = ${orgId}
  `

  if (!row) return c.json({ error: 'Not Found' }, 404)

  const md = [
    `# Análisis: ${row.template_key}`,
    `**Período:** ${row.period_label}`,
    `**Estado:** ${row.status}`,
    `**Creado:** ${row.created_at}`,
    ``,
    row.result ? `## Resultado\n\n${JSON.stringify(row.result, null, 2)}` : '',
  ].join('\n')

  return c.newResponse(md, 200, {
    'Content-Type': 'text/markdown; charset=utf-8',
    'Content-Disposition': `attachment; filename="analytics-${id.slice(0, 8)}.md"`,
  })
})

// ── GET /analytics/schedules — list ─────────────────────────────────────────────

analytics.get('/schedules', async (c) => {
  const myRole = c.get('orgRole')
  if (!hasRole(myRole, 'admin')) return c.json(forbiddenRole('admin'), 403)

  const rows = await sql`
    SELECT * FROM analysis_schedules
    WHERE org_id = ${c.get('orgId')}
    ORDER BY next_run_at ASC
  `

  return c.json(rows)
})

// ── POST /analytics/schedules — create ──────────────────────────────────────────

analytics.post('/schedules', async (c) => {
  const myRole = c.get('orgRole')
  if (!hasRole(myRole, 'admin')) return c.json(forbiddenRole('admin'), 403)

  const orgId = c.get('orgId')
  const userId = c.get('userId')
  const body = await c.req.json<{
    template_key?: string
    period?: string
    cadence?: string
    day_of_week?: number
    hour?: number
    timezone?: string
    llm_config_id?: string
  }>()

  if (!body.template_key || !body.cadence) {
    return c.json({ error: 'Bad Request', message: 'template_key and cadence are required' }, 400)
  }

  if (!['weekly', 'monthly'].includes(body.cadence)) {
    return c.json({ error: 'Bad Request', message: 'cadence must be weekly or monthly' }, 400)
  }

  const hour = body.hour ?? 8
  const timezone = body.timezone ?? 'UTC'
  const period = body.period ?? 'last_7d'

  // Calculate next run date (simplified — next Monday 08:00 for weekly)
  const now = new Date()
  const nextRun = new Date(now)
  nextRun.setUTCHours(hour, 0, 0, 0)
  if (body.cadence === 'weekly') {
    const dayOfWeek = body.day_of_week ?? 1 // Monday
    const daysUntilTarget = (dayOfWeek - nextRun.getUTCDay() + 7) % 7
    nextRun.setUTCDate(nextRun.getUTCDate() + (daysUntilTarget || 7))
  } else {
    // Monthly: first day of next month
    nextRun.setUTCMonth(nextRun.getUTCMonth() + 1, 1)
  }

  const [schedule] = await sql`
    INSERT INTO analysis_schedules (org_id, template_key, period, cadence, day_of_week, hour, timezone, llm_config_id, next_run_at, created_by)
    VALUES (${orgId}, ${body.template_key}, ${period}, ${body.cadence}, ${body.day_of_week ?? null}, ${hour}, ${timezone}, ${body.llm_config_id ?? null}, ${nextRun.toISOString()}, ${userId})
    RETURNING *
  `

  return c.json(schedule, 201)
})

// ── PATCH /analytics/schedules/:id — update schedule ────────────────────────────

analytics.patch('/schedules/:id', async (c) => {
  const myRole = c.get('orgRole')
  if (!hasRole(myRole, 'admin')) return c.json(forbiddenRole('admin'), 403)

  const orgId = c.get('orgId')
  const scheduleId = c.req.param('id')
  const body = await c.req.json<{
    is_active?: boolean
    cadence?: string
    hour?: number
    period?: string
    llm_config_id?: string | null
  }>()

  const sets: string[] = []
  const vals: (string | number | boolean | null)[] = []
  let idx = 0

  if (body.is_active !== undefined) { sets.push(`is_active = $${++idx}`); vals.push(body.is_active) }
  if (body.cadence) { sets.push(`cadence = $${++idx}`); vals.push(body.cadence) }
  if (body.hour !== undefined) { sets.push(`hour = $${++idx}`); vals.push(body.hour) }
  if (body.period) { sets.push(`period = $${++idx}`); vals.push(body.period) }
  if (body.llm_config_id !== undefined) { sets.push(`llm_config_id = $${++idx}`); vals.push(body.llm_config_id) }

  if (sets.length === 0) {
    return c.json({ error: 'Bad Request', message: 'No fields to update' }, 400)
  }

  vals.push(orgId, scheduleId)

  const [updated] = await sql.unsafe<Analysis[]>`
    UPDATE analysis_schedules SET ${sql.unsafe(sets.join(', '))}
    WHERE org_id = ${orgId} AND id = ${scheduleId}
    RETURNING *
  `.execute(...vals)

  if (!updated) return c.json({ error: 'Not Found' }, 404)

  return c.json(updated)
})

// ── DELETE /analytics/schedules/:id — delete schedule ────────────────────────────

analytics.delete('/schedules/:id', async (c) => {
  const myRole = c.get('orgRole')
  if (!hasRole(myRole, 'admin')) return c.json(forbiddenRole('admin'), 403)

  const orgId = c.get('orgId')

  await sql`
    DELETE FROM analysis_schedules WHERE id = ${c.req.param('id')} AND org_id = ${orgId}
  `

  return c.body(null, 204)
})

export default analytics
