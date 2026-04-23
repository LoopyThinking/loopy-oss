// Shared types for the API layer.
// These mirror the database schema and the @loopy/sdk types,
// but are kept independent to avoid coupling the API to the SDK.

export type LoopStatus = 'open' | 'closed' | 'blocked'
export type LoopScope = 'personal' | 'team' | 'organizational'
export type CognitiveLayer = 'perception' | 'interpretation' | 'decision' | 'action' | 'reflection'
export type SignalSource = 'human' | 'agent'

export interface Loop {
  id: string
  user_id: string
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
}

export interface WorkSignal {
  id: string
  loop_id: string
  user_id: string
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
  agent_name: string
  token_hash: string
  description: string | null
  is_active: boolean
  created_at: string
  last_seen_at: string | null
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

// Hono context variables set by the auth middleware
export interface AuthVariables {
  userId: string
  agentId: string | null  // set only when authenticated as an agent
}
