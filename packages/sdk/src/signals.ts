import type { WorkSignal, LoopyConfig } from './types'

/**
 * LoopySignals — emit and query work signals on loops.
 *
 * @example
 * await LoopySignals.emit({
 *   loopId: 'loop-id',
 *   type: 'action',
 *   content: 'Sent report to stakeholders',
 *   source: 'agent',
 * }, config)
 */
export class LoopySignals {
  static async emit(
    signal: WorkSignal,
    config: LoopyConfig
  ): Promise<WorkSignal> {
    const baseUrl = config.baseUrl ?? 'https://loopythinking.ai'
    const res = await fetch(`${baseUrl}/api/signals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify(signal),
    })

    if (!res.ok) {
      throw new Error(`Failed to emit signal: ${res.status} ${res.statusText}`)
    }

    return res.json() as Promise<WorkSignal>
  }

  static async listByLoop(
    loopId: string,
    config: LoopyConfig
  ): Promise<WorkSignal[]> {
    const baseUrl = config.baseUrl ?? 'https://loopythinking.ai'
    const res = await fetch(`${baseUrl}/api/loops/${loopId}/signals`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch signals: ${res.status} ${res.statusText}`)
    }

    return res.json() as Promise<WorkSignal[]>
  }
}
