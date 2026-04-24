import { Hono } from 'hono'
import sql from '../db/client.js'
import type { AuthVariables, Loop, WorkSignal, LoopStatus } from '../types.js'

const loops = new Hono<{ Variables: AuthVariables }>()

// ── Confidence index calculation ──────────────────────────────────────────────
// Simple deterministic formula for the OSS version.
// Advanced AI-powered IPL calculation is a Cloud feature.

const SIGNAL_WEIGHTS: Record<string, number> = {
  perception: 8,
  interpretation: 12,
  decision: 20,
  action: 10,
  reflection: 15,
}

async function recalculateConfidence(loopId: string): Promise<number> {
  const signals = await sql<Array<{ type: string }>>`
    SELECT type FROM work_signals WHERE loop_id = ${loopId}
  `
  const raw = signals.reduce((sum, s) => sum + (SIGNAL_WEIGHTS[s.type] ?? 10), 0)
  return Math.min(100, raw)
}

// ── GET /loops ────────────────────────────────────────────────────────────────

loops.get('/', async (c) => {
  const userId = c.get('userId')
  const status = c.req.query('status') as LoopStatus | undefined

  const rows = status
    ? await sql<Loop[]>`
        SELECT * FROM loops
        WHERE user_id = ${userId} AND status = ${status}
        ORDER BY created_at DESC
      `
    : await sql<Loop[]>`
        SELECT * FROM loops
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `

  return c.json(rows)
})

// ── POST /loops ───────────────────────────────────────────────────────────────

loops.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{
    title?: string
    hypothesis?: string
    scope?: string
  }>()

  if (!body.title?.trim()) {
    return c.json({ error: 'Bad Request', message: 'title is required' }, 400)
  }

  const validScopes = ['personal', 'team', 'organizational']
  const scope = body.scope ?? 'personal'
  if (!validScopes.includes(scope)) {
    return c.json(
      { error: 'Bad Request', message: `scope must be one of: ${validScopes.join(', ')}` },
      400
    )
  }

  const [loop] = await sql<Loop[]>`
    INSERT INTO loops (user_id, title, hypothesis, scope)
    VALUES (${userId}, ${body.title.trim()}, ${body.hypothesis ?? null}, ${scope})
    RETURNING *
  `

  return c.json(loop, 201)
})

// ── GET /loops/:id ────────────────────────────────────────────────────────────

loops.get('/:id', async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()

  const [loop] = await sql<Loop[]>`
    SELECT * FROM loops WHERE id = ${id} AND user_id = ${userId}
  `

  if (!loop) {
    return c.json({ error: 'Not Found', message: 'Loop not found' }, 404)
  }

  const signals = await sql<WorkSignal[]>`
    SELECT * FROM work_signals
    WHERE loop_id = ${id}
    ORDER BY created_at ASC
  `

  return c.json({
    ...loop,
    ipl_hours: parseFloat((loop.ipl_minutes / 60).toFixed(2)),
    signals,
  })
})

// ── POST /loops/:id/close ─────────────────────────────────────────────────────

loops.post('/:id/close', async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()

  const [existing] = await sql<Loop[]>`
    SELECT * FROM loops WHERE id = ${id} AND user_id = ${userId}
  `

  if (!existing) {
    return c.json({ error: 'Not Found', message: 'Loop not found' }, 404)
  }

  if (existing.status === 'closed') {
    return c.json({ error: 'Bad Request', message: 'Loop is already closed' }, 400)
  }

  const body = await c.req.json<{ resolution?: string }>().catch(() => ({ resolution: undefined }))

  const [closed] = await sql<Loop[]>`
    UPDATE loops
    SET
      status     = 'closed',
      resolution = ${body.resolution ?? null},
      closed_at  = now()
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `

  return c.json(closed)
})

// ── GET /loops/:id/signals ────────────────────────────────────────────────────

loops.get('/:id/signals', async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()

  // Verify the loop belongs to this user
  const [loop] = await sql<Loop[]>`
    SELECT id FROM loops WHERE id = ${id} AND user_id = ${userId}
  `

  if (!loop) {
    return c.json({ error: 'Not Found', message: 'Loop not found' }, 404)
  }

  const source = c.req.query('source')
  const type = c.req.query('type')

  const signals =
    source && type
      ? await sql<WorkSignal[]>`
          SELECT * FROM work_signals
          WHERE loop_id = ${id} AND source = ${source} AND type = ${type}
          ORDER BY created_at ASC
        `
      : source
        ? await sql<WorkSignal[]>`
            SELECT * FROM work_signals
            WHERE loop_id = ${id} AND source = ${source}
            ORDER BY created_at ASC
          `
        : type
          ? await sql<WorkSignal[]>`
              SELECT * FROM work_signals
              WHERE loop_id = ${id} AND type = ${type}
              ORDER BY created_at ASC
            `
          : await sql<WorkSignal[]>`
              SELECT * FROM work_signals
              WHERE loop_id = ${id}
              ORDER BY created_at ASC
            `

  return c.json(signals)
})

export { recalculateConfidence }
export default loops
