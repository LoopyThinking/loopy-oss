import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoopySignals } from '../signals'
import type { WorkSignal, LoopyConfig } from '../types'

// ── Helpers ──────────────────────────────────────────────────────────────────

const config: LoopyConfig = {
  token: 'agent-token-xyz',
  baseUrl: 'https://test.loopythinking.ai',
}

const mockSignal: WorkSignal = {
  loopId: '550e8400-e29b-41d4-a716-446655440000',
  type: 'action',
  content: 'Deployed v0.1.0-beta to npm',
  source: 'agent',
  metadata: { tool: 'claude-cowork' },
}

const mockSignalResponse = {
  id: 'sig-uuid-001',
  loop_id: mockSignal.loopId,
  ...mockSignal,
  created_at: '2026-04-22T10:00:00Z',
}

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LoopySignals', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('emit', () => {
    it('posts signal to /api/signals', async () => {
      globalThis.fetch = mockFetch(mockSignalResponse)

      const result = await LoopySignals.emit(mockSignal, config)

      expect(fetch).toHaveBeenCalledWith(
        'https://test.loopythinking.ai/api/signals',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.token}`,
          }),
          body: JSON.stringify(mockSignal),
        })
      )
      expect(result).toEqual(mockSignalResponse)
    })

    it('defaults baseUrl to loopythinking.ai when not set', async () => {
      globalThis.fetch = mockFetch(mockSignalResponse)
      const configNoUrl: LoopyConfig = { token: 'tk' }

      await LoopySignals.emit(mockSignal, configNoUrl)

      expect(fetch).toHaveBeenCalledWith(
        'https://loopythinking.ai/api/signals',
        expect.anything()
      )
    })

    it('throws on non-ok response', async () => {
      globalThis.fetch = mockFetch({ error: 'Unauthorized' }, 401)

      await expect(LoopySignals.emit(mockSignal, config)).rejects.toThrow(
        'Failed to emit signal: 401'
      )
    })

    it('emits signal with all cognitive layer types', async () => {
      const layers = ['perception', 'interpretation', 'decision', 'action', 'reflection'] as const

      for (const type of layers) {
        globalThis.fetch = mockFetch({ ...mockSignalResponse, type })
        const result = await LoopySignals.emit({ ...mockSignal, type }, config)
        expect(result.type).toBe(type)
      }
    })
  })

  describe('listByLoop', () => {
    it('fetches signals for a loop', async () => {
      const loopId = '550e8400-e29b-41d4-a716-446655440000'
      globalThis.fetch = mockFetch([mockSignalResponse])

      const result = await LoopySignals.listByLoop(loopId, config)

      expect(fetch).toHaveBeenCalledWith(
        `https://test.loopythinking.ai/api/loops/${loopId}/signals`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${config.token}`,
          }),
        })
      )
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockSignalResponse)
    })

    it('returns empty array when loop has no signals', async () => {
      globalThis.fetch = mockFetch([])

      const result = await LoopySignals.listByLoop('loop-id', config)

      expect(result).toEqual([])
    })

    it('throws on non-ok response', async () => {
      globalThis.fetch = mockFetch({ error: 'Not Found' }, 404)

      await expect(LoopySignals.listByLoop('bad-id', config)).rejects.toThrow(
        'Failed to fetch signals: 404'
      )
    })
  })
})
