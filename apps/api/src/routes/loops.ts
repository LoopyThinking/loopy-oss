import { Hono } from 'hono'
import sql from '../db/client.js'
import type { AuthVariables, Loop, WorkSignal, LoopStatus } from '../types.js'

const loops = new Hono<{ Variables: AuthVariables }>()

// ── Authorization helper ──────────────────────────────────────────────────────

/**
 * Returns true if the requesting user can READ the loop.
 * - Owner always can.
 * - Org admins/owners of the loop's org can read (but not necessarily mutate).
 */
async function canSeeLoop(userId: string, loopId: string): Promise<boolean> {
  const [row] = await sql<Array<{ allowed: boolean }>>`
    SELECT (
      l.user_id = ${userId}
      OR EXISTS (
        SELECT 1 FROM org_members m
        WHERE m.user_id = ${userId}
          AND m.org_id = l.org_id
          AND m.role IN ('admin', 'owner')
      )
    ) AS allowed
    FROM loops l
    WHERE l.id = ${loopId} AND l.deleted_at IS NULL
  `
  return !!row?.allowed
}

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
  const orgId  = c.get('orgId')
  const orgRole = c.get('orgRole')
  const status = c.req.query('status') as LoopStatus | undefined
  const scope  = c.req.query('scope') // 'mine' | 'team' | undefined

  const validScopes = ['mine', 'team', undefined]
  if (scope !== undefined && !validScopes.includes(scope)) {
    return c.json({ error: 'Bad Request', message: "scope must be 'mine' or 'team'" }, 400)
  }

  if (scope === 'team') {
    // Admins and owners only
    if (orgRole !== 'admin' && orgRole !== 'owner') {
      return c.json({ error: 'Forbidden', message: 'Only admins can view team loops' }, 403)
    }
    if (!orgId) {
      return c.json({ error: 'Bad Request', message: 'X-Org-Id header required for scope=team' }, 400)
    }

    const rows = status
      ? await sql<Loop[]>`
          SELECT l.*, u.display_name AS owner_name, u.email AS owner_email
          FROM loops l
          LEFT JOIN users u ON u.id = l.user_id
          WHERE l.org_id = ${orgId} AND l.status = ${status} AND l.deleted_at IS NULL
          ORDER BY l.created_at DESC
        `
      : await sql<Loop[]>`
          SELECT l.*, u.display_name AS owner_name, u.email AS owner_email
          FROM loops l
          LEFT JOIN users u ON u.id = l.user_id
          WHERE l.org_id = ${orgId} AND l.deleted_at IS NULL
          ORDER BY l.created_at DESC
        `

    return c.json(rows)
  }

  // Default: personal loops (scope=mine or omitted)
  const rows = status
    ? await sql<Loop[]>`
        SELECT * FROM loops
        WHERE user_id = ${userId} AND status = ${status} AND deleted_at IS NULL
        ORDER BY created_at DESC
      `
    : await sql<Loop[]>`
        SELECT * FROM loops
        WHERE user_id = ${userId} AND deleted_at IS NULL
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
    INSERT INTO loops (user_id, org_id, title, hypothesis, scope)
    VALUES (
      ${userId},
      (SELECT org_id FROM org_members WHERE user_id = ${userId} ORDER BY joined_at ASC LIMIT 1),
      ${body.title.trim()},
      ${body.hypothesis ?? null},
      ${scope}
    )
    RETURNING *
  `

  return c.json(loop, 201)
})

// ── GET /loops/:id ────────────────────────────────────────────────────────────

loops.get('/:id', async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()

  const allowed = await canSeeLoop(userId, id)
  if (!allowed) {
    return c.json({ error: 'Not Found', message: 'Loop not found' }, 404)
  }

  const [loop] = await sql<Loop[]>`
    SELECT l.*, u.display_name AS owner_name, u.email AS owner_email
    FROM loops l
    LEFT JOIN users u ON u.id = l.user_id
    WHERE l.id = ${id}
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

// ── DELETE /loops/:id — soft-delete a closed loop (owner only) ────────────────

loops.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()

  const [existing] = await sql<Loop[]>`
    SELECT * FROM loops WHERE id = ${id} AND user_id = ${userId} AND deleted_at IS NULL
  `

  if (!existing) {
    return c.json({ error: 'Not Found', message: 'Loop not found' }, 404)
  }

  if (existing.status !== 'closed') {
    return c.json(
      { error: 'Bad Request', message: 'Only closed loops can be deleted. Close the loop first.' },
      400
    )
  }

  await sql`
    UPDATE loops SET deleted_at = now() WHERE id = ${id}
  `

  return c.body(null, 204)
})

export { recalculateConfidence }
export default loops
