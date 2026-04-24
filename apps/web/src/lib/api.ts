// API client — thin wrapper around fetch that reads VITE_API_URL
// and injects the stored auth token + current org on every request.

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

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

export interface Organization {
  id: string
  name: string
  slug: string
  role: OrgRole
  created_at: string
}

export interface AdminOverview {
  total_loops: number
  active_loops: number
  closed_last_30d: number
  avg_confidence: number
  total_ipl_hours: number
  total_agents: number
}

export interface ActivityPoint {
  date: string
  signal_count: number
}

export interface AdminLoopsResponse {
  data: Array<Loop & {
    signal_count: number
    owner_name: string | null
    owner_email: string
  }>
  total: number
  limit: number
  offset: number
}

export interface AdminAgent {
  id: string
  agent_name: string
  description: string | null
  is_active: boolean
  created_at: string
  last_seen_at: string | null
  owner_name: string | null
  owner_email: string
  total_signals: number
}

// ── Token + Org storage ───────────────────────────────────────────────────────

const TOKEN_KEY  = 'loopy_token'
const ORG_KEY    = 'loopy_org_id'

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token)
}
export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
}

export function getCurrentOrgId(): string | null {
  return sessionStorage.getItem(ORG_KEY)
}
export function setCurrentOrgId(orgId: string): void {
  sessionStorage.setItem(ORG_KEY, orgId)
}
export function clearCurrentOrgId(): void {
  sessionStorage.removeItem(ORG_KEY)
}

// ── HTTP client ───────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options: RequestInit = {}, withOrg = false): Promise<T> {
  const token = getToken()
  const orgId = getCurrentOrgId()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(withOrg && orgId ? { 'X-Org-Id': orgId } : {}),
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string> | undefined ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string }
    throw new ApiError(res.status, body.message ?? `HTTP ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ── Loops ─────────────────────────────────────────────────────────────────────

export const api = {
  loops: {
    list: (status?: LoopStatus) =>
      request<Loop[]>(`/loops${status ? `?status=${status}` : ''}`, {}, true),

    get: (id: string) =>
      request<LoopWithSignals>(`/loops/${id}`, {}, true),

    create: (data: { title: string; hypothesis?: string; scope?: LoopScope }) =>
      request<Loop>('/loops', { method: 'POST', body: JSON.stringify(data) }, true),

    close: (id: string, resolution?: string) =>
      request<Loop>(`/loops/${id}/close`, {
        method: 'POST',
        body: JSON.stringify({ resolution }),
      }, true),

    signals: (id: string) =>
      request<WorkSignal[]>(`/loops/${id}/signals`, {}, true),
  },

  signals: {
    emit: (data: {
      loopId: string
      type: CognitiveLayer
      content: string
      source?: SignalSource
      metadata?: Record<string, unknown>
    }) => request<WorkSignal>('/signals', { method: 'POST', body: JSON.stringify(data) }, true),
  },

  // ── Orgs ───────────────────────────────────────────────────────────────────

  orgs: {
    list: () =>
      request<Organization[]>('/orgs'),

    create: (data: { name: string; slug?: string }) =>
      request<Organization>('/orgs', { method: 'POST', body: JSON.stringify(data) }),

    members: () =>
      request<Array<{ user_id: string; email: string; display_name: string | null; role: OrgRole; joined_at: string }>>('/orgs/current/members', {}, true),
  },

  // ── Admin panel ────────────────────────────────────────────────────────────

  admin: {
    overview: () =>
      request<AdminOverview>('/admin/overview', {}, true),

    loops: (params?: { status?: LoopStatus; limit?: number; offset?: number }) => {
      const qs = new URLSearchParams()
      if (params?.status) qs.set('status', params.status)
      if (params?.limit)  qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      const q = qs.toString()
      return request<AdminLoopsResponse>(`/admin/loops${q ? `?${q}` : ''}`, {}, true)
    },

    agents: () =>
      request<AdminAgent[]>('/admin/agents', {}, true),

    activity: (window?: '7d' | '30d' | '90d') =>
      request<{ window: string; data: ActivityPoint[] }>(
        `/admin/activity${window ? `?window=${window}` : ''}`,
        {},
        true
      ),
  },

  // ── Me / profile ──────────────────────────────────────────────────────────

  me: {
    get: () =>
      request<{
        id: string
        email: string
        display_name: string | null
        created_at: string
        orgs: Array<{ id: string; name: string; slug: string; role: OrgRole }>
      }>('/me'),

    update: (data: { display_name: string }) =>
      request<{ id: string; email: string; display_name: string | null }>('/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    agents: () =>
      request<Array<{
        id: string
        agent_name: string
        description: string | null
        is_active: boolean
        created_at: string
        last_seen_at: string | null
      }>>('/me/agents'),

    revokeAgent: (agentId: string) =>
      request<void>(`/me/agents/${agentId}`, { method: 'DELETE' }),
  },

  // ── Invites ────────────────────────────────────────────────────────────────

  invites: {
    get: (token: string) =>
      request<{
        org_id: string
        org_name: string
        org_slug: string
        role: OrgRole
        expires_at: string
      }>(`/invites/${token}`),

    accept: (token: string) =>
      request<{
        org_id: string
        org_name: string
        role: OrgRole
        already_member: boolean
      }>('/invites/accept', { method: 'POST', body: JSON.stringify({ token }) }),
  },

  health: () => request<{ status: string; version: string }>('/health'),
}
