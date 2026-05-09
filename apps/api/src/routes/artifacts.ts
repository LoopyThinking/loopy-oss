import { Hono } from 'hono'
import sql from '../db/client.js'
import type { AuthVariables, CognitiveLayer } from '../types.js'

// Artifacts — cognitive layer views.
// GET /artifacts/summary — per-layer loop counts
// GET /artifacts/:layer  — loops with embedded signals for a specific layer

const artifacts = new Hono<{ Variables: AuthVariables }>()

const VALID_LAYERS: CognitiveLayer[] = ['perception', 'interpretation', 'decision', 'action', 'reflection']

// ── GET /artifacts/summary ──────────────────────────────────────────────────────

artifacts.get('/summary', async (c) => {
  const userId = c.get('userId')
  const orgId = c.get('orgId')
  const orgRole = c.get('orgRole')
  const isOrgAdmin = orgRole === 'admin' || orgRole === 'owner'

  const rows = await sql<Array<{ type: string; cnt: number }>>`
    SELECT s.type, COUNT(DISTINCT s.loop_id)::int AS cnt
    FROM work_signals s
    JOIN loops l ON l.id = s.loop_id AND l.deleted_at IS NULL
    WHERE ${isOrgAdmin
      ? sql`l.org_id = ${orgId}`
      : sql`s.user_id = ${userId}`
    }
    GROUP BY s.type
  `

  const result: Record<string, number> = {
    perception: 0,
    interpretation: 0,
    decision: 0,
    action: 0,
    reflection: 0,
  }
  for (const r of rows) {
    result[r.type] = r.cnt
  }

  return c.json(result)
})

// ── GET /artifacts/:layer ───────────────────────────────────────────────────────

artifacts.get('/:layer', async (c) => {
  const userId = c.get('userId')
  const orgId = c.get('orgId')
  const orgRole = c.get('orgRole')
  const isOrgAdmin = orgRole === 'admin' || orgRole === 'owner'

  const layer = c.req.param('layer') as CognitiveLayer

  if (!VALID_LAYERS.includes(layer)) {
    return c.json({
      error: 'Bad Request',
      message: `Invalid layer "${layer}". Must be one of: ${VALID_LAYERS.join(', ')}`,
    }, 400)
  }

  if (isOrgAdmin) {
    // Admin sees all loops in the org with owner info
    const rows = await sql<Array<{
      loop_id: string
      title: string
      hypothesis: string | null
      status: string
      scope: string
      created_at: string
      owner_name: string | null
      owner_email: string
      signal_count: number
      signals: string // json_agg result
    }>>`
      SELECT
        l.id AS loop_id,
        l.title,
        l.hypothesis,
        l.status,
        l.scope,
        l.created_at,
        u.display_name AS owner_name,
        u.email AS owner_email,
        COUNT(s.id)::int AS signal_count,
        COALESCE(json_agg(
          json_build_object(
            'id', s.id,
            'content', s.content,
            'source', s.source,
            'created_at', s.created_at
          ) ORDER BY s.created_at ASC
        ) FILTER (WHERE s.id IS NOT NULL), '[]'::json) AS signals
      FROM loops l
      LEFT JOIN work_signals s ON s.loop_id = l.id AND s.type = ${layer}
      LEFT JOIN users u ON u.id = l.user_id
      WHERE l.org_id = ${orgId}
        AND l.deleted_at IS NULL
      GROUP BY l.id, u.display_name, u.email
      HAVING COUNT(s.id) > 0
      ORDER BY MAX(s.created_at) DESC
    `
    return c.json(rows)
  }

  // Member/viewer sees only their own loops
  const rows = await sql<Array<{
    loop_id: string
    title: string
    hypothesis: string | null
    status: string
    scope: string
    created_at: string
    signal_count: number
    signals: string
  }>>`
    SELECT
      l.id AS loop_id,
      l.title,
      l.hypothesis,
      l.status,
      l.scope,
      l.created_at,
      COUNT(s.id)::int AS signal_count,
      COALESCE(json_agg(
        json_build_object(
          'id', s.id,
          'content', s.content,
          'source', s.source,
          'created_at', s.created_at
        ) ORDER BY s.created_at ASC
      ) FILTER (WHERE s.id IS NOT NULL), '[]'::json) AS signals
    FROM loops l
    LEFT JOIN work_signals s ON s.loop_id = l.id AND s.type = ${layer}
    WHERE l.user_id = ${userId}
      AND l.deleted_at IS NULL
    GROUP BY l.id
    HAVING COUNT(s.id) > 0
    ORDER BY MAX(s.created_at) DESC
  `
  return c.json(rows)
})

export default artifacts
