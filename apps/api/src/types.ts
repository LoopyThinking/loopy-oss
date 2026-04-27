// Shared types for the API layer.
// These mirror the database schema and the @loopythinking/sdk types,
// but are kept independent to avoid coupling the API to the SDK.

export type LoopStatus = 'open' | 'closed' | 'blocked'
export type LoopScope = 'personal' | 'team' | 'organizational'
export type CognitiveLayer = 'perception' | 'interpretation' | 'decision' | 'action' | 'reflection'
export type SignalSource = 'human' | 'agent'
export type OrgRole = 'viewer' | 'member' | 'admin' | 'owner'

export interface Loop {
  id: string
  user_id: string
  org_id: string
  title: string
  hypothesis: string | null
  status: LoopStatus
  scope: LoopScope
  confidence_index: number
  ipl_minutes: number
  resolution: string | null
  created_at: string
  updated_at: string
  closed_at: string | null
  // Populated from v_team_loops view (admin team queries)
  owner_name?: string | null
  owner_email?: string
}

export interface WorkSignal {
  id: string
  loop_id: string
  user_id: string
  org_id: string
  type: CognitiveLayer
  content: string
  source: SignalSource
  /** Minutes of human work this agent signal replaced (override for IPL heuristic) */
  estimated_human_minutes: number | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface AgentRegistryEntry {
  id: string
  user_id: string
  org_id: string
  agent_name: string
  token_hash: string
  description: string | null
  is_active: boolean
  created_at: string
  last_seen_at: string | null
}

// ── Multi-org types ───────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  display_name: string | null
  created_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface OrgMember {
  user_id: string
  org_id: string
  role: OrgRole
  joined_at: string
  // Joined from users table when listing members
  email?: string
  display_name?: string | null
}

export interface OrgInvite {
  id: string
  org_id: string
  token: string
  role: OrgRole
  expires_at: string
  accepted_at: string | null
  revoked_at: string | null
  created_at: string
  // Joined from users table when listing invites
  invited_by_email?: string
}

// ── Capability types (agent_skills + agent_tools) ────────────────────────────

export type SkillSource = 'built-in' | 'user' | 'plugin'
export type ToolType = 'mcp' | 'connector' | 'function'

export interface AgentSkill {
  id: string
  agent_id: string
  skill_name: string
  version: string | null
  description: string | null
  source: SkillSource
  metadata: Record<string, unknown>
  is_active: boolean
  registered_at: string
  last_seen_at: string
}

export interface AgentTool {
  id: string
  agent_id: string
  tool_name: string
  tool_type: ToolType
  provider: string | null
  description: string | null
  metadata: Record<string, unknown>
  is_active: boolean
  registered_at: string
  last_seen_at: string
}

// ── Admin panel types ─────────────────────────────────────────────────────────

export interface AdminOverview {
  total_loops: number
  active_loops: number
  closed_last_30d: number
  avg_confidence: number
  total_ipl_hours: number
  total_agents: number
}

export interface ActivityPoint {
  date: string      // YYYY-MM-DD
  signal_count: number
}

// Hono context variables set by auth + org middleware
export interface AuthVariables {
  userId: string
  agentId: string | null  // set only when authenticated as an agent
  orgId: string           // resolved from X-Org-Id header (required for most routes)
  orgRole: OrgRole        // the user's role in the current org
}
