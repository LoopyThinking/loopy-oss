export type CognitiveLayer =
  | 'perception'
  | 'interpretation'
  | 'decision'
  | 'action'
  | 'reflection'

export type SignalSource = 'human' | 'agent'

export interface LoopyConfig {
  /** Agent registry token from Loopy Thinking → Admin → Conexiones */
  token: string
  /** Base URL of your Loopy instance. Defaults to https://loopythinking.ai */
  baseUrl?: string
}

export interface WorkSignal {
  loopId: string
  type: CognitiveLayer
  content: string
  source: SignalSource
  /**
   * Optional override for the IPL heuristic.
   * When provided (and > 0) on an agent-sourced signal, Loopy will use this
   * value instead of the default weight for that signal type.
   * Must be an integer between 0 and 480 (one full workday in minutes).
   */
  estimatedHumanMinutes?: number
  metadata?: Record<string, unknown>
}

// ── Capability types ──────────────────────────────────────────────────────────

export type SkillSource = 'built-in' | 'user' | 'plugin'
export type ToolType = 'mcp' | 'connector' | 'function'

export interface RegisterSkillPayload {
  skillName: string
  version?: string
  description?: string
  /** Defaults to 'user' if not provided */
  source?: SkillSource
  metadata?: Record<string, unknown>
}

export interface RegisterToolPayload {
  toolName: string
  /** Defaults to 'function' if not provided */
  toolType?: ToolType
  provider?: string
  description?: string
  metadata?: Record<string, unknown>
}

export interface RegisterBatchPayload {
  skills?: RegisterSkillPayload[]
  tools?: RegisterToolPayload[]
}

export interface AgentSkill {
  id: string
  agentId: string
  skillName: string
  version: string | null
  description: string | null
  source: SkillSource
  metadata: Record<string, unknown>
  isActive: boolean
  registeredAt: string
  lastSeenAt: string
}

export interface AgentTool {
  id: string
  agentId: string
  toolName: string
  toolType: ToolType
  provider: string | null
  description: string | null
  metadata: Record<string, unknown>
  isActive: boolean
  registeredAt: string
  lastSeenAt: string
}

export interface Loop {
  id: string
  title: string
  hypothesis: string
  status: 'open' | 'closed' | 'blocked'
  confidenceIndex: number
  signals: WorkSignal[]
  createdAt: string
  updatedAt: string
}
