// Typed wrappers around the analytics SQL views.
// Each function returns a strictly-typed Inputs object consumed by template prompts.

import sql from '../db/client.js'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Period {
  key: string         // 'last_7d' | 'last_30d' | 'last_90d' | 'mtd' | 'qtd'
  label: string       // display label like "Last 7 days"
  startDate: Date
  endDate: Date
}

export function resolvePeriod(periodKey: string): Period {
  const now = new Date()
  const end = new Date(now)
  let start: Date

  switch (periodKey) {
    case 'last_7d':
      start = new Date(+now - 7 * 86_400_000)
      return { key: periodKey, label: 'Últimos 7 días', startDate: start, endDate: end }
    case 'last_30d':
      start = new Date(+now - 30 * 86_400_000)
      return { key: periodKey, label: 'Últimos 30 días', startDate: start, endDate: end }
    case 'last_90d':
      start = new Date(+now - 90 * 86_400_000)
      return { key: periodKey, label: 'Últimos 90 días', startDate: start, endDate: end }
    case 'mtd': {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { key: periodKey, label: 'Mes actual', startDate: start, endDate: end }
    }
    case 'qtd': {
      const q = Math.floor(now.getMonth() / 3) * 3
      start = new Date(now.getFullYear(), q, 1)
      return { key: periodKey, label: 'Trimestre actual', startDate: start, endDate: end }
    }
    default:
      start = new Date(+now - 30 * 86_400_000)
      return { key: 'last_30d', label: 'Últimos 30 días', startDate: start, endDate: end }
  }
}

// ── ROI inputs ─────────────────────────────────────────────────────────────────

export interface RoiInputs {
  ipl_hours_total: number
  hourly_rate: number
  savings_usd: number
  loops_closed: number
  loops_total: number
  active_users: number
  top_agents: Array<{ agent_name: string; ipl_minutes_contributed: number }>
}

export async function getRoiInputs(orgId: string, period: Period): Promise<RoiInputs> {
  const [hourlyRow] = await sql<Array<{ hourly_rate_usd: string }>>`
    SELECT hourly_rate_usd FROM organizations WHERE id = ${orgId}
  `
  const hourlyRate = parseFloat(hourlyRow?.hourly_rate_usd ?? '50')

  const [stats] = await sql<Array<{
    ipl_minutes_total: string
    loops_closed: string
    loops_total: string
    active_users: string
  }>>`
    SELECT
      COALESCE(SUM(COALESCE(ipl_minutes, 0)) FILTER (WHERE created_at >= ${period.startDate.toISOString()} AND created_at <= ${period.endDate.toISOString()}), 0)::text AS ipl_minutes_total,
      COUNT(*) FILTER (WHERE status = 'closed' AND created_at >= ${period.startDate.toISOString()} AND created_at <= ${period.endDate.toISOString()})::text AS loops_closed,
      COUNT(*) FILTER (WHERE created_at >= ${period.startDate.toISOString()} AND created_at <= ${period.endDate.toISOString()})::text AS loops_total,
      COUNT(DISTINCT user_id) FILTER (WHERE created_at >= ${period.startDate.toISOString()} AND created_at <= ${period.endDate.toISOString()})::text AS active_users
    FROM loops
    WHERE org_id = ${orgId}
  `

  const iplMinutes = parseInt(stats?.ipl_minutes_total ?? '0', 10)
  const iplHours = iplMinutes / 60

  const topAgents = await sql<Array<{ agent_name: string; ipl_minutes_contributed: string }>>`
    SELECT ar.agent_name, COALESCE(SUM(l.ipl_minutes), 0)::text AS ipl_minutes_contributed
    FROM agent_registry ar
    LEFT JOIN work_signals ws ON ws.agent_id = ar.id
    LEFT JOIN loops l ON l.id = ws.loop_id AND l.created_at >= ${period.startDate.toISOString()} AND l.created_at <= ${period.endDate.toISOString()}
    WHERE ar.org_id = ${orgId} AND ar.is_active = TRUE
    GROUP BY ar.agent_name
    ORDER BY SUM(l.ipl_minutes) DESC NULLS LAST
    LIMIT 5
  `

  return {
    ipl_hours_total: Math.round(iplHours * 100) / 100,
    hourly_rate: hourlyRate,
    savings_usd: Math.round(iplHours * hourlyRate * 100) / 100,
    loops_closed: parseInt(stats?.loops_closed ?? '0', 10),
    loops_total: parseInt(stats?.loops_total ?? '0', 10),
    active_users: parseInt(stats?.active_users ?? '0', 10),
    top_agents: topAgents.map(a => ({
      agent_name: a.agent_name,
      ipl_minutes_contributed: parseInt(a.ipl_minutes_contributed ?? '0', 10),
    })),
  }
}

// ── Adoption inputs ────────────────────────────────────────────────────────────

export interface AdoptionPoint {
  week: string
  active_users: number
  loops_created: number
}

export interface AdoptionInputs {
  weekly_data: AdoptionPoint[]
  total_members: number
}

export async function getAdoptionInputs(orgId: string, period: Period): Promise<AdoptionInputs> {
  const weeklyData = await sql<AdoptionPoint[]>`
    SELECT week::text, active_users, loops_created
    FROM v_analytics_adoption_weekly
    WHERE org_id = ${orgId}
      AND week >= ${period.startDate.toISOString()}::date
      AND week <= ${period.endDate.toISOString()}::date
    ORDER BY week ASC
  `

  const [memberCount] = await sql<Array<{ count: string }>>`
    SELECT COUNT(*)::text AS count FROM org_members WHERE org_id = ${orgId}
  `

  return {
    weekly_data: weeklyData,
    total_members: parseInt(memberCount?.count ?? '0', 10),
  }
}

// ── Agent optimization inputs ──────────────────────────────────────────────────

export interface AgentOptimizationInputs {
  agents: Array<{
    agent_name: string
    loops_touched: number
    signals_total: number
    ipl_minutes_contributed: number
    distinct_users: number
  }>
}

export async function getAgentOptimizationInputs(orgId: string, _period: Period): Promise<AgentOptimizationInputs> {
  const agents = await sql<Array<{
    agent_name: string
    loops_touched: string
    signals_total: string
    ipl_minutes_contributed: string
    distinct_users: string
  }>>`
    SELECT agent_name, loops_touched, signals_total, ipl_minutes_contributed, distinct_users
    FROM v_analytics_agent_performance
    WHERE org_id = ${orgId}
    ORDER BY ipl_minutes_contributed DESC
  `

  return {
    agents: agents.map(a => ({
      agent_name: a.agent_name,
      loops_touched: parseInt(a.loops_touched ?? '0', 10),
      signals_total: parseInt(a.signals_total ?? '0', 10),
      ipl_minutes_contributed: parseInt(a.ipl_minutes_contributed ?? '0', 10),
      distinct_users: parseInt(a.distinct_users ?? '0', 10),
    })),
  }
}

// ── Stuck loops inputs ─────────────────────────────────────────────────────────

export interface StuckLoop {
  id: string
  title: string
  days_idle: number
}

export interface StuckLoopsInputs {
  stuck_loops: StuckLoop[]
  total_stuck: number
}

export async function getStuckLoopsInputs(orgId: string): Promise<StuckLoopsInputs> {
  const loops = await sql<Array<{ id: string; title: string; days_idle: string }>>`
    SELECT id, title, days_idle::text
    FROM v_analytics_stuck_loops
    WHERE org_id = ${orgId}
    ORDER BY days_idle DESC
  `

  return {
    stuck_loops: loops.map(l => ({
      id: l.id,
      title: l.title,
      days_idle: parseInt(l.days_idle ?? '0', 10),
    })),
    total_stuck: loops.length,
  }
}

// ── Team segmentation inputs ───────────────────────────────────────────────────

export interface TeamMemberIpl {
  display_name: string | null
  email: string
  loops_closed: number
  ipl_minutes_total: number
  avg_ipl_per_loop: number
}

export interface TeamSegmentationInputs {
  members: TeamMemberIpl[]
  total_members: number
}

export async function getTeamSegmentationInputs(orgId: string, period: Period): Promise<TeamSegmentationInputs> {
  const members = await sql<Array<{
    display_name: string | null
    email: string
    loops_closed: string
    ipl_minutes_total: string
    avg_ipl_per_loop: string
  }>>`
    SELECT display_name, email, loops_closed::text, ipl_minutes_total::text, avg_ipl_per_loop::text
    FROM v_analytics_user_ipl
    WHERE org_id = ${orgId}
    ORDER BY ipl_minutes_total DESC
  `

  return {
    members: members.map(m => ({
      display_name: m.display_name,
      email: m.email,
      loops_closed: parseInt(m.loops_closed ?? '0', 10),
      ipl_minutes_total: parseInt(m.ipl_minutes_total ?? '0', 10),
      avg_ipl_per_loop: parseFloat(m.avg_ipl_per_loop ?? '0'),
    })),
    total_members: members.length,
  }
}
