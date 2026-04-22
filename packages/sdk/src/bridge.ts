import type { LoopyConfig, Loop } from './types'

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
}
