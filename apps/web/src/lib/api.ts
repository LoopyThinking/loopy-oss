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

export interface AgentSkill {
  id: string
  agent_id: string
  skill_name: string
  version: string | null
  description: string | null
  source: 'built-in' | 'user' | 'plugin'
  metadata: Record<string, unknown>
  is_active: boolean
  registered_at: string
  last_seen_at: string
}

export interface AgentTool {
  id: string
  agent_id: string
  tool_name: string
  tool_type: 'mcp' | 'connector' | 'function'
  provider: string | null
  description: string | null
  metadata: Record<string, unknown>
  is_active: boolean
  registered_at: string
  last_seen_at: string
}

export interface OrgInvite {
  id: string
  role: OrgRole
  expires_at: string
  created_at: string
  revoked_at: string | null
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

export interface LlmConfigPublic {
  id: string
  org_id: string
  provider: string
  display_name: string
  model: string
  base_url: string | null
  api_key_last4: string
  is_default: boolean
  is_active: boolean
  last_tested_at: string | null
  last_test_ok: boolean | null
  last_test_error: string | null
  created_at: string
  updated_at: string
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
    list: (params?: { status?: LoopStatus; scope?: 'mine' | 'team' }) => {
      const qs = new URLSearchParams()
      if (params?.status) qs.set('status', params.status)
      if (params?.scope)  qs.set('scope', params.scope)
      const q = qs.toString()
      return request<Loop[]>(`/loops${q ? `?${q}` : ''}`, {}, true)
    },

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

    members: (orgId: string) =>
      request<Array<{ user_id: string; email: string; display_name: string | null; role: OrgRole; joined_at: string }>>(
        `/orgs/${orgId}/members`, {}, true
      ),

    updateMember: (orgId: string, userId: string, role: OrgRole) =>
      request<{ user_id: string; org_id: string; role: OrgRole }>(
        `/orgs/${orgId}/members`,
        { method: 'POST', body: JSON.stringify({ user_id: userId, role }) },
        true
      ),

    removeMember: (orgId: string, userId: string) =>
      request<void>(`/orgs/${orgId}/members/${userId}`, { method: 'DELETE' }, true),

    listInvites: (orgId: string) =>
      request<OrgInvite[]>(`/orgs/${orgId}/invites`, {}, true),

    createInvite: (orgId: string, data: { role: OrgRole; expires_in_days?: number }) =>
      request<{ invite_token: string; expires_at: string; role: string; accept_url: string }>(
        `/orgs/${orgId}/invites`,
        { method: 'POST', body: JSON.stringify(data) },
        true
      ),

    revokeInvite: (orgId: string, inviteId: string) =>
      request<void>(`/orgs/${orgId}/invites/${inviteId}`, { method: 'DELETE' }, true),

    updateSettings: (orgId: string, data: { hourly_rate_usd?: number }) =>
      request<{ id: string; hourly_rate_usd: string; role: string }>(`/orgs/${orgId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }, true),
  },

  // ── LLM configs ────────────────────────────────────────────────────────────

  llm: {
    list: (orgId: string) =>
      request<LlmConfigPublic[]>(`/orgs/${orgId}/llm-configs`, {}, true),

    create: (orgId: string, data: {
      provider: string
      display_name: string
      model: string
      base_url?: string
      api_key: string
      is_default?: boolean
    }) => request<LlmConfigPublic>(`/orgs/${orgId}/llm-configs`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, true),

    update: (orgId: string, configId: string, data: {
      display_name?: string
      model?: string
      base_url?: string
      is_default?: boolean
      is_active?: boolean
    }) => request<LlmConfigPublic>(`/orgs/${orgId}/llm-configs/${configId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true),

    rotate: (orgId: string, configId: string, apiKey: string) =>
      request<LlmConfigPublic>(`/orgs/${orgId}/llm-configs/${configId}/rotate`, {
        method: 'POST',
        body: JSON.stringify({ api_key: apiKey }),
      }, true),

    test: (orgId: string, configId: string) =>
      request<LlmConfigPublic>(`/orgs/${orgId}/llm-configs/${configId}/test`, {
        method: 'POST',
      }, true),

    remove: (orgId: string, configId: string) =>
      request<void>(`/orgs/${orgId}/llm-configs/${configId}`, { method: 'DELETE' }, true),
  },

  // ── Agent capabilities ─────────────────────────────────────────────────────

  agents: {
    skills: {
      list: (agentId: string) =>
        request<AgentSkill[]>(`/agents/${agentId}/skills`, {}, true),
      deactivate: (agentId: string, skillId: string) =>
        request<void>(`/agents/${agentId}/skills/${skillId}`, { method: 'DELETE' }, true),
    },
    tools: {
      list: (agentId: string) =>
        request<AgentTool[]>(`/agents/${agentId}/tools`, {}, true),
      deactivate: (agentId: string, toolId: string) =>
        request<void>(`/agents/${agentId}/tools/${toolId}`, { method: 'DELETE' }, true),
    },
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

  // ── Analytics ──────────────────────────────────────────────────────────────

  analytics: {
    templates: {
      list: () =>
        request<Array<{
          key: string; name: string; description: string; category: string
          default_period: string; has_custom_prompt: boolean
        }>>('/analytics/templates', {}, true),

      get: (key: string) =>
        request<{
          key: string; name: string; description: string; category: string
          default_period: string; default_prompt: string; org_prompt: string | null
          output_schema: Record<string, unknown>
        }>(`/analytics/templates/${key}`, {}, true),

      savePrompt: (key: string, prompt: string) =>
        request<{ ok: boolean }>(`/analytics/templates/${key}/prompt`, {
          method: 'PUT',
          body: JSON.stringify({ prompt }),
        }, true),

      resetPrompt: (key: string) =>
        request<void>(`/analytics/templates/${key}/prompt`, { method: 'DELETE' }, true),
    },

    run: (data: {
      template_key: string; period?: string; llm_config_id?: string | null; prompt_override?: string
    }) => request<{ analysis_id: string }>('/analytics/run', {
      method: 'POST', body: JSON.stringify(data),
    }, true),

    listAnalyses: (params?: { template_key?: string; limit?: number; offset?: number }) => {
      const qs = new URLSearchParams()
      if (params?.template_key) qs.set('template_key', params.template_key)
      if (params?.limit) qs.set('limit', String(params.limit))
      if (params?.offset) qs.set('offset', String(params.offset))
      const q = qs.toString()
      return request<Array<{
        id: string; template_key: string; period_label: string; status: string
        llm_provider: string | null; llm_model: string | null; error: string | null
        scheduled: boolean; created_at: string; completed_at: string | null
      }>>(`/analytics/analyses${q ? `?${q}` : ''}`, {}, true)
    },

    getAnalysis: (id: string) =>
      request<{
        id: string; template_key: string; period_label: string; prompt_used: string
        data_inputs: Record<string, unknown>; result: Record<string, unknown> | null
        llm_provider: string | null; llm_model: string | null
        status: string; error: string | null; created_at: string; completed_at: string | null
      }>(`/analytics/analyses/${id}`, {}, true),

    markdownUrl: (id: string) => `${BASE_URL}/analytics/analyses/${id}/markdown`,

    schedules: {
      list: () =>
        request<Array<{
          id: string; template_key: string; period: string; cadence: string
          hour: number; timezone: string; is_active: boolean
          last_run_at: string | null; next_run_at: string
        }>>('/analytics/schedules', {}, true),

      create: (data: {
        template_key: string; period?: string; cadence: string
        hour?: number; timezone?: string; llm_config_id?: string
      }) => request<any>('/analytics/schedules', { method: 'POST', body: JSON.stringify(data) }, true),

      update: (id: string, data: {
        is_active?: boolean; cadence?: string; hour?: number; period?: string
      }) => request<any>(`/analytics/schedules/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, true),

      remove: (id: string) =>
        request<void>(`/analytics/schedules/${id}`, { method: 'DELETE' }, true),
    },
  },
}
