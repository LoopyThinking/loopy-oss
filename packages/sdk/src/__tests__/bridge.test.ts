import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoopyBridge } from '../bridge'
import type { Loop } from '../types'

// ── Helpers ──────────────────────────────────────────────────────────────────

const BASE_URL = 'https://test.loopythinking.ai'
const TOKEN = 'test-token-abc'

const mockLoop: Loop = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Test loop',
  hypothesis: 'This will work',
  status: 'open',
  confidenceIndex: 50,
  signals: [],
  createdAt: '2026-04-22T10:00:00Z',
  updatedAt: '2026-04-22T10:00:00Z',
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

describe('LoopyBridge', () => {
  let bridge: LoopyBridge

  beforeEach(() => {
    bridge = new LoopyBridge({ token: TOKEN, baseUrl: BASE_URL })
  })

  describe('constructor', () => {
    it('uses provided baseUrl', () => {
      // We verify via the fetch URL in subsequent tests
      expect(bridge).toBeInstanceOf(LoopyBridge)
    })

    it('defaults baseUrl to loopythinking.ai when not provided', () => {
      const defaultBridge = new LoopyBridge({ token: TOKEN })
      expect(defaultBridge).toBeInstanceOf(LoopyBridge)
    })
  })

  describe('getLoop', () => {
    it('fetches a loop by id', async () => {
      globalThis.fetch = mockFetch(mockLoop)

      const result = await bridge.getLoop(mockLoop.id)

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/api/loops/${mockLoop.id}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual(mockLoop)
    })

    it('throws on non-ok response', async () => {
      globalThis.fetch = mockFetch({ error: 'Not Found' }, 404)

      await expect(bridge.getLoop('bad-id')).rejects.toThrow('Loopy API error: 404')
    })
  })

  describe('listActiveLoops', () => {
    it('fetches loops filtered by status=open', async () => {
      globalThis.fetch = mockFetch([mockLoop])

      const result = await bridge.listActiveLoops()

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/api/loops?status=open`,
        expect.anything()
      )
      expect(result).toEqual([mockLoop])
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('createLoop', () => {
    it('sends POST with title, hypothesis, scope', async () => {
      const created = { ...mockLoop, title: 'New loop' }
      globalThis.fetch = mockFetch(created)

      const result = await bridge.createLoop({
        title: 'New loop',
        hypothesis: 'Testing hypothesis',
        scope: 'personal',
      })

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/api/loops`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            title: 'New loop',
            hypothesis: 'Testing hypothesis',
            scope: 'personal',
          }),
        })
      )
      expect(result.title).toBe('New loop')
    })

    it('creates loop without optional scope', async () => {
      globalThis.fetch = mockFetch(mockLoop)

      await bridge.createLoop({ title: 'Minimal loop', hypothesis: 'Just title and hypothesis' })

      const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(body.title).toBe('Minimal loop')
      expect(body.scope).toBeUndefined()
    })
  })

  describe('closeLoop', () => {
    it('sends POST to close endpoint with resolution', async () => {
      const closed = { ...mockLoop, status: 'closed' as const, resolution: 'Done' }
      globalThis.fetch = mockFetch(closed)

      const result = await bridge.closeLoop(mockLoop.id, 'Done')

      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/api/loops/${mockLoop.id}/close`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ resolution: 'Done' }),
        })
      )
      expect(result.status).toBe('closed')
    })

    it('closes loop without resolution', async () => {
      const closed = { ...mockLoop, status: 'closed' as const }
      globalThis.fetch = mockFetch(closed)

      await bridge.closeLoop(mockLoop.id)

      const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(JSON.parse(call[1].body)).toEqual({ resolution: undefined })
    })
  })
})
