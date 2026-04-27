// Lightweight HTTP client for the Loopy API.
// Intentionally does NOT import @loopythinking/sdk to keep loopy-mcp
// dependency-free at runtime (only @modelcontextprotocol/sdk is required).

// ── Config ────────────────────────────────────────────────────────────────────

export interface LoopyClientConfig {
  token:   string
  baseUrl: string
  orgId:   string | null
}

export function resolveConfig(): LoopyClientConfig {
  const token = process.env.LOOPY_AGENT_REGISTRY_TOKEN
  if (!token) {
    throw new Error(
      'LOOPY_AGENT_REGISTRY_TOKEN is required. ' +
      'Get your token from your Loopy instance → Admin → Connections.'
    )
  }
  return {
    token,
    baseUrl: (process.env.LOOPY_BASE_URL ?? 'https://loopythinking.ai').replace(/\/$/, ''),
    orgId:   process.env.LOOPY_ORG_ID ?? null,
  }
}

// ── Types (mirrors @loopythinking/sdk without the import) ─────────────────────

export type LoopStatus     = 'open' | 'closed' | 'blocked'
export type LoopScope      = 'personal' | 'team' | 'organizational'
export type CognitiveLayer = 'perception' | 'interpretation' | 'decision' | 'action' | 'reflection'
export type SignalSource   = 'human' | 'agent'

export interface Loop {
  id:               string
  title:            string
  hypothesis:       string | null
  status:           LoopStatus
  scope:            LoopScope
  confidence_index: number
  ipl_minutes:      number
  ipl_hours:        number
  resolution:       string | null
  created_at:       string
  updated_at:       string
  closed_at:        string | null
}

export interface WorkSignal {
  id:         string
  loop_id:    string
  type:       CognitiveLayer
  content:    string
  source:     SignalSource
  created_at: string
}

export interface LoopDetail extends Loop {
  signals: WorkSignal[]
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

class LoopyApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(`Loopy API ${status}: ${message}`)
    this.name = 'LoopyApiError'
  }
}

async function request<T>(
  cfg: LoopyClientConfig,
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${cfg.token}`,
  }
  if (cfg.orgId) headers['X-Org-Id'] = cfg.orgId

  const res = await fetch(`${cfg.baseUrl}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string }
    throw new LoopyApiError(res.status, err.message ?? res.statusText)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ── API methods ───────────────────────────────────────────────────────────────

export const loopy = {
  createLoop(
    cfg: LoopyClientConfig,
    data: { title: string; hypothesis?: string; scope?: LoopScope }
  ): Promise<Loop> {
    return request(cfg, 'POST', '/loops', data)
  },

  getLoop(cfg: LoopyClientConfig, id: string): Promise<LoopDetail> {
    return request(cfg, 'GET', `/loops/${id}`)
  },

  listActiveLoops(cfg: LoopyClientConfig): Promise<Loop[]> {
    return request(cfg, 'GET', '/loops?status=open')
  },

  closeLoop(
    cfg: LoopyClientConfig,
    id: string,
    resolution?: string
  ): Promise<Loop> {
    return request(cfg, 'POST', `/loops/${id}/close`, { resolution })
  },

  emitSignal(
    cfg: LoopyClientConfig,
    data: {
      loopId: string
      type: CognitiveLayer
      content: string
      source?: SignalSource
      estimatedHumanMinutes?: number
      metadata?: Record<string, unknown>
    }
  ): Promise<WorkSignal> {
    return request(cfg, 'POST', '/signals', data)
  },
}

// ── LoopyMapper: keyword-based cognitive layer classifier ─────────────────────
// Mirrors packages/sdk/src/mapper.ts without the import.

const LAYER_KEYWORDS: Record<CognitiveLayer, string[]> = {
  perception:     ['noticed', 'detected', 'observed', 'found', 'saw', 'received', 'discovered', 'identified', 'monitored', 'scanned'],
  interpretation: ['analyzed', 'interpreted', 'understood', 'means', 'pattern', 'suggests', 'indicates', 'because', 'therefore', 'concluded'],
  decision:       ['decided', 'chose', 'selected', 'will', 'going to', 'plan to', 'determined', 'resolved', 'agreed', 'approved'],
  action:         ['created', 'updated', 'deleted', 'deployed', 'sent', 'built', 'implemented', 'executed', 'ran', 'completed', 'wrote', 'fixed'],
  reflection:     ['retrospective', 'learned', 'realized', 'improved', 'in hindsight', 'next time', 'should have', 'worked well', 'did not work'],
}

export function classifySignal(description: string): CognitiveLayer {
  const lower = description.toLowerCase()
  let best: CognitiveLayer = 'action'
  let bestScore = 0

  for (const [layer, keywords] of Object.entries(LAYER_KEYWORDS) as [CognitiveLayer, string[]][]) {
    const score = keywords.filter(kw => lower.includes(kw)).length
    if (score > bestScore) {
      bestScore = score
      best = layer
    }
  }

  return best
}
