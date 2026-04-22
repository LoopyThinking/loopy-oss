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
  metadata?: Record<string, unknown>
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
