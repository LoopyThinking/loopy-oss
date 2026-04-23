// API client — thin wrapper around fetch that reads VITE_API_URL
// and injects the stored auth token on every request.

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

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
  /** Total agent-equivalent minutes accumulated in this loop */
  ipl_minutes: number
  resolution: string | null
  created_at: string
  updated_at: string
  closed_at: string | null
}

export interface LoopWithSignals extends Loop {
  signals: WorkSignal[]
}

export interface WorkSignal {
  id: string
  loop_id: string
  user_id: string
  type: CognitiveLayer
  content: string
  source: SignalSource
  metadata: Record<string, unknown>
  created_at: string
}

// ── Token storage ─────────────────────────────────────────────────────────────

const TOKEN_KEY = 'loopy_token'

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
}

// ── HTTP client ───────────────────────────────────────────────────────────────

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string }
    throw new ApiError(res.status, body.message ?? `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

// ── Loops ─────────────────────────────────────────────────────────────────────

export const api = {
  loops: {
    list: (status?: LoopStatus) =>
      request<Loop[]>(`/loops${status ? `?status=${status}` : ''}`),

    get: (id: string) =>
      request<LoopWithSignals>(`/loops/${id}`),

    create: (data: { title: string; hypothesis?: string; scope?: LoopScope }) =>
      request<Loop>('/loops', { method: 'POST', body: JSON.stringify(data) }),

    close: (id: string, resolution?: string) =>
      request<Loop>(`/loops/${id}/close`, {
        method: 'POST',
        body: JSON.stringify({ resolution }),
      }),

    signals: (id: string) =>
      request<WorkSignal[]>(`/loops/${id}/signals`),
  },

  signals: {
    emit: (data: {
      loopId: string
      type: CognitiveLayer
      content: string
      source?: SignalSource
      metadata?: Record<string, unknown>
    }) => request<WorkSignal>('/signals', { method: 'POST', body: JSON.stringify(data) }),
  },

  health: () => request<{ status: string; version: string }>('/health'),
}
