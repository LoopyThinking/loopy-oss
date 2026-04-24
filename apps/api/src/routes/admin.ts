import { Hono } from 'hono'
import sql from '../db/client.js'
import { orgMiddleware, hasRole, forbiddenRole } from '../middleware/org.js'
import type { AuthVariables, AdminOverview, ActivityPoint } from '../types.js'

// Admin routes — require X-Org-Id header + role admin or above.
// All data returned is aggregated; individual signal content from personal
// loops is never exposed (privacy: admins see counts, not content).

const admin = new Hono<{ Variables: AuthVariables }>()

// Apply org middleware to all admin routes
admin.use('*', orgMiddleware)

// Admin-gate middleware — applied after orgMiddleware
admin.use('*', async (c, next) => {
  const role = c.get('orgRole')
  if (!hasRole(role, 'admin')) {
    return c.json(forbiddenRole('admin'), 403)
  }
  return next()
})

// ── GET /admin/overview — aggregate KPIs ──────────────────────────────────────

admin.get('/overview', async (c) => {
  const orgId = c.get('orgId')

  const [loopStats] = await sql<Array<{
    total_loops: string
    active_loops: string
    closed_last_30d: string
    avg_confidence: string
    total_ipl_minutes: string
  }>>`
    SELECT
      COUNT(*)                                              AS total_loops,
      COUNT(*) FILTER (WHERE status = 'open')              AS active_loops,
      COUNT(*) FILTER (
        WHERE status = 'closed'
          AND closed_at >= now() - INTERVAL '30 days'
      )                                                     AS closed_last_30d,
      ROUND(AVG(confidence_index), 1)                       AS avg_confidence,
      SUM(ipl_minutes)                                      AS total_ipl_minutes
    FROM loops
    WHERE org_id = ${orgId}
  `

  const [agentStats] = await sql<Array<{ total_agents: string }>>`
    SELECT COUNT(*) AS total_agents
    FROM agent_registry
    WHERE org_id = ${orgId} AND is_active = true
  `

  const overview: AdminOverview = {
    total_loops:      parseInt(loopStats.total_loops ?? '0', 10),
    active_loops:     parseInt(loopStats.active_loops ?? '0', 10),
    closed_last_30d:  parseInt(loopStats.closed_last_30d ?? '0', 10),
    avg_confidence:   parseFloat(loopStats.avg_confidence ?? '0'),
    total_ipl_hours:  Math.round((parseInt(loopStats.total_ipl_minutes ?? '0', 10) / 60) * 10) / 10,
    total_agents:     parseInt(agentStats.total_agents ?? '0', 10),
  }

  return c.json(overview)
})

// ── GET /admin/loops — aggregated loop list ───────────────────────────────────
// Query params: groupBy=scope|status|owner, status=open|closed|blocked, limit, offset

admin.get('/loops', async (c) => {
  const orgId   = c.get('orgId')
  const status  = c.req.query('status')
  const limit   = Math.min(parseInt(c.req.query('limit') ?? '50', 10), 200)
  const offset  = parseInt(c.req.query('offset') ?? '0', 10)

  const validStatuses = ['open', 'closed', 'blocked']

  const rows = status && validStatuses.includes(status)
    ? await sql`
        SELECT
          l.id,
          l.title,
          l.status,
          l.scope,
          l.confidence_index,
          l.ipl_minutes,
          l.created_at,
          l.closed_at,
          COUNT(ws.id) AS signal_count,
          u.display_name AS owner_name,
          u.email        AS owner_email
        FROM loops l
        LEFT JOIN work_signals ws ON ws.loop_id = l.id
        LEFT JOIN users u ON u.id = l.user_id
        WHERE l.org_id = ${orgId} AND l.status = ${status}
        GROUP BY l.id, u.display_name, u.email
        ORDER BY l.confidence_index DESC, l.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    : await sql`
        SELECT
          l.id,
          l.title,
          l.status,
          l.scope,
          l.confidence_index,
          l.ipl_minutes,
          l.created_at,
          l.closed_at,
          COUNT(ws.id) AS signal_count,
          u.display_name AS owner_name,
          u.email        AS owner_email
        FROM loops l
        LEFT JOIN work_signals ws ON ws.loop_id = l.id
        LEFT JOIN users u ON u.id = l.user_id
        WHERE l.org_id = ${orgId}
        GROUP BY l.id, u.display_name, u.email
        ORDER BY l.confidence_index DESC, l.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `

  const [{ total }] = await sql<Array<{ total: string }>>`
    SELECT COUNT(*) AS total FROM loops
    WHERE org_id = ${orgId}
    ${status && validStatuses.includes(status) ? sql`AND status = ${status}` : sql``}
  `

  return c.json({ data: rows, total: parseInt(total, 10), limit, offset })
})

// ── GET /admin/agents — list active agents with last activity ─────────────────

admin.get('/agents', async (c) => {
  const orgId = c.get('orgId')

  const agents = await sql`
    SELECT
      a.id,
      a.agent_name,
      a.description,
      a.is_active,
      a.created_at,
      a.last_seen_at,
      u.display_name AS owner_name,
      u.email        AS owner_email,
      COUNT(DISTINCT s.id) AS total_signals
    FROM agent_registry a
    LEFT JOIN users u ON u.id = a.user_id
    LEFT JOIN work_signals s ON s.loop_id IN (
      SELECT id FROM loops WHERE org_id = ${orgId}
    ) AND s.source = 'agent'
    WHERE a.org_id = ${orgId}
    GROUP BY a.id, u.display_name, u.email
    ORDER BY a.last_seen_at DESC NULLS LAST
  `

  return c.json(agents)
})

// ── GET /admin/activity — signal time series ──────────────────────────────────
// Query param: window=7d|30d|90d (default 30d)

admin.get('/activity', async (c) => {
  const orgId  = c.get('orgId')
  const window = c.req.query('window') ?? '30d'

  const days = window === '7d' ? 7 : window === '90d' ? 90 : 30

  const series = await sql<ActivityPoint[]>`
    SELECT
      TO_CHAR(gs.day, 'YYYY-MM-DD') AS date,
      COALESCE(counts.signal_count, 0)::INTEGER AS signal_count
    FROM
      generate_series(
        (now() - (${days} || ' days')::INTERVAL)::DATE,
        now()::DATE,
        '1 day'::INTERVAL
      ) AS gs(day)
    LEFT JOIN (
      SELECT
        DATE(ws.created_at) AS day,
        COUNT(*)            AS signal_count
      FROM work_signals ws
      JOIN loops l ON l.id = ws.loop_id
      WHERE l.org_id = ${orgId}
        AND ws.created_at >= now() - (${days} || ' days')::INTERVAL
      GROUP BY DATE(ws.created_at)
    ) counts ON counts.day = gs.day::DATE
    ORDER BY gs.day ASC
  `

  return c.json({ window, data: series })
})

export default admin
