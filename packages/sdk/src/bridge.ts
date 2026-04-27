import type {
  LoopyConfig,
  Loop,
  AgentSkill,
  AgentTool,
  RegisterSkillPayload,
  RegisterToolPayload,
  RegisterBatchPayload,
} from './types'

/**
 * LoopyBridge — main client for connecting an agent to a Loopy instance.
 *
 * @example
 * const loopy = new LoopyBridge({ token: process.env.LOOPY_AGENT_REGISTRY_TOKEN })
 * const loop = await loopy.getLoop('loop-id')
 */
export class LoopyBridge {
  private config: Required<LoopyConfig>

  constructor(config: LoopyConfig) {
    this.config = {
      baseUrl: 'https://loopythinking.ai',
      ...config,
    }
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.config.baseUrl}/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.token}`,
        ...options?.headers,
      },
    })

    if (!res.ok) {
      throw new Error(`Loopy API error: ${res.status} ${res.statusText}`)
    }

    return res.json() as Promise<T>
  }

  /** Fetch a single loop by ID */
  async getLoop(id: string): Promise<Loop> {
    return this.request<Loop>(`/loops/${id}`)
  }

  /** List all active loops for the authenticated user */
  async listActiveLoops(): Promise<Loop[]> {
    return this.request<Loop[]>('/loops?status=open')
  }

  /** Create a new loop */
  async createLoop(data: {
    title: string
    hypothesis: string
    scope?: 'personal' | 'team' | 'organizational'
  }): Promise<Loop> {
    return this.request<Loop>('/loops', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /** Close a loop */
  async closeLoop(id: string, resolution?: string): Promise<Loop> {
    return this.request<Loop>(`/loops/${id}/close`, {
      method: 'POST',
      body: JSON.stringify({ resolution }),
    })
  }

  // ── Capabilities ────────────────────────────────────────────────────────────

  /**
   * Register (upsert) a single skill for the given agent.
   * Safe to call on every session start — idempotent.
   *
   * @example
   * await loopy.registerSkill(agentId, {
   *   skillName: 'loopy-bridge',
   *   version: '1.2.0',
   *   source: 'plugin',
   * })
   */
  async registerSkill(agentId: string, skill: RegisterSkillPayload): Promise<AgentSkill> {
    return this.request<AgentSkill>(`/agents/${agentId}/skills`, {
      method: 'POST',
      body: JSON.stringify(skill),
    })
  }

  /**
   * Register (upsert) a single tool for the given agent.
   *
   * @example
   * await loopy.registerTool(agentId, {
   *   toolName: 'Read',
   *   toolType: 'function',
   *   provider: 'claude-code',
   * })
   */
  async registerTool(agentId: string, tool: RegisterToolPayload): Promise<AgentTool> {
    return this.request<AgentTool>(`/agents/${agentId}/tools`, {
      method: 'POST',
      body: JSON.stringify(tool),
    })
  }

  /**
   * Register all skills and/or tools in a single request.
   * Intended for session startup — call once with everything the agent has.
   *
   * @example
   * await loopy.registerBatch(agentId, {
   *   skills: [
   *     { skillName: 'loopy-bridge', version: '1.2.0', source: 'plugin' },
   *     { skillName: 'docx',         version: '2.0.0', source: 'plugin' },
   *   ],
   *   tools: [
   *     { toolName: 'Read',    toolType: 'function', provider: 'claude-code' },
   *     { toolName: 'WebSearch', toolType: 'function', provider: 'claude-code' },
   *   ],
   * })
   */
  async registerBatch(
    agentId: string,
    payload: RegisterBatchPayload
  ): Promise<{ registeredSkills: number; registeredTools: number }> {
    const results = { registeredSkills: 0, registeredTools: 0 }

    if (payload.skills && payload.skills.length > 0) {
      const res = await this.request<{ registered: number }>(`/agents/${agentId}/skills/batch`, {
        method: 'POST',
        body: JSON.stringify({ skills: payload.skills }),
      })
      results.registeredSkills = res.registered
    }

    if (payload.tools && payload.tools.length > 0) {
      const res = await this.request<{ registered: number }>(`/agents/${agentId}/tools/batch`, {
        method: 'POST',
        body: JSON.stringify({ tools: payload.tools }),
      })
      results.registeredTools = res.registered
    }

    return results
  }

  /** List all active skills registered for an agent */
  async listSkills(agentId: string): Promise<AgentSkill[]> {
    return this.request<AgentSkill[]>(`/agents/${agentId}/skills`)
  }

  /** Soft-delete (deactivate) a skill — sets is_active = false */
  async deactivateSkill(agentId: string, skillId: string): Promise<void> {
    await this.request<void>(`/agents/${agentId}/skills/${skillId}`, { method: 'DELETE' })
  }

  /** List all active tools registered for an agent */
  async listTools(agentId: string): Promise<AgentTool[]> {
    return this.request<AgentTool[]>(`/agents/${agentId}/tools`)
  }

  /** Soft-delete (deactivate) a tool — sets is_active = false */
  async deactivateTool(agentId: string, toolId: string): Promise<void> {
    await this.request<void>(`/agents/${agentId}/tools/${toolId}`, { method: 'DELETE' })
  }

  /** List pending (unaccepted, unrevoked) invites for an org (admin+ only) */
  async listOrgInvites(orgId: string): Promise<Array<{
    id: string; role: string; expires_at: string; created_at: string
  }>> {
    return this.request(`/orgs/${orgId}/invites`)
  }

  /** Revoke an org invite (sets revoked_at, does not hard-delete) */
  async revokeOrgInvite(orgId: string, inviteId: string): Promise<void> {
    await this.request<void>(`/orgs/${orgId}/invites/${inviteId}`, { method: 'DELETE' })
  }

  /**
   * List loops. Pass scope='team' (admin+) to see all org loops.
   *
   * @example
   * const myLoops   = await loopy.listLoops()
   * const teamLoops = await loopy.listLoops({ scope: 'team' })
   */
  async listLoops(params?: { scope?: 'mine' | 'team'; status?: string }): Promise<Loop[]> {
    const qs = new URLSearchParams()
    if (params?.scope)  qs.set('scope', params.scope)
    if (params?.status) qs.set('status', params.status)
    const q = qs.toString()
    return this.request<Loop[]>(`/loops${q ? `?${q}` : ''}`)
  }
}
