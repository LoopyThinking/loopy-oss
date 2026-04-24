import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LoopyMapper } from '../mapper'
import type { LoopyConfig } from '../types'

// ── Helpers ──────────────────────────────────────────────────────────────────

const config: LoopyConfig = {
  token: 'agent-token-xyz',
  baseUrl: 'https://test.loopythinking.ai',
}

const LOOP_ID = '550e8400-e29b-41d4-a716-446655440000'

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
  })
}

function signalResponse(type: string, content: string) {
  return {
    id: 'sig-uuid-mapper',
    loop_id: LOOP_ID,
    loopId: LOOP_ID,
    type,
    content,
    source: 'agent',
    created_at: '2026-04-22T10:00:00Z',
  }
}

// ── Classification tests ──────────────────────────────────────────────────────

describe('LoopyMapper — classify (via map)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  const cases: Array<{ description: string; expectedType: string }> = [
    // perception keywords
    { description: 'Analyzed error logs from the last deploy', expectedType: 'perception' },
    { description: 'Observed unusual spike in latency', expectedType: 'perception' },
    { description: 'Detected a memory leak in the API', expectedType: 'perception' },
    { description: 'Scanned the codebase for TODOs', expectedType: 'perception' },
    { description: 'Read the latest user feedback report', expectedType: 'perception' },

    // interpretation keywords
    { description: 'Interpreted the error as a race condition', expectedType: 'interpretation' },
    { description: 'Evaluated three possible approaches to the problem', expectedType: 'interpretation' },
    { description: 'Assessed the risk of the migration', expectedType: 'interpretation' },
    { description: 'Reviewed the pull request for correctness', expectedType: 'interpretation' },
    { description: 'Understanding the root cause of the bug clarified the fix', expectedType: 'interpretation' },

    // decision keywords
    { description: 'Decided to use Hono instead of Express', expectedType: 'decision' },
    { description: 'Choosing PostgreSQL over MySQL for the schema', expectedType: 'decision' },
    { description: 'Selected the fastest implementation path', expectedType: 'decision' },
    { description: 'Prioritized the auth bug over the UI work', expectedType: 'decision' },
    { description: 'Approved the PR and merged to main', expectedType: 'decision' },

    // reflection keywords
    { description: 'Reflected on what slowed down the sprint', expectedType: 'reflection' },
    { description: 'Learned that mocking the DB masked real bugs', expectedType: 'reflection' },
    { description: 'Wrote a retrospective on the release process', expectedType: 'reflection' },
    { description: 'Drew a conclusion from the A/B test results', expectedType: 'reflection' },

    // default → action
    { description: 'Deployed v0.1.0-beta to npm', expectedType: 'action' },
    { description: 'Sent the summary email to the team', expectedType: 'action' },
    { description: 'Committed the final build artifacts to main branch', expectedType: 'action' },
    { description: 'Pushed the fix to the feature branch', expectedType: 'action' },
  ]

  for (const { description, expectedType } of cases) {
    it(`classifies "${description.slice(0, 50)}..." as ${expectedType}`, async () => {
      globalThis.fetch = mockFetch(signalResponse(expectedType, description))

      const result = await LoopyMapper.map(LOOP_ID, { description }, config)

      const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
      expect(body.type).toBe(expectedType)
      expect(body.content).toBe(description)
    })
  }
})

// ── map() integration tests ───────────────────────────────────────────────────

describe('LoopyMapper.map', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('emits a signal with the classified type', async () => {
    const description = 'Deployed the new API to production'
    globalThis.fetch = mockFetch(signalResponse('action', description))

    const result = await LoopyMapper.map(LOOP_ID, { description }, config)

    expect(fetch).toHaveBeenCalledOnce()
    expect(result.type).toBe('action')
    expect(result.content).toBe(description)
  })

  it('defaults source to agent', async () => {
    const description = 'Analyzed the performance metrics'
    globalThis.fetch = mockFetch(signalResponse('perception', description))

    await LoopyMapper.map(LOOP_ID, { description }, config)

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
    expect(body.source).toBe('agent')
  })

  it('respects explicit source override', async () => {
    const description = 'Read through the spec manually'
    globalThis.fetch = mockFetch(signalResponse('perception', description))

    await LoopyMapper.map(LOOP_ID, { description, source: 'human' }, config)

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
    expect(body.source).toBe('human')
  })

  it('passes metadata to the emitted signal', async () => {
    const description = 'Updated the changelog'
    const metadata = { tool: 'claude-cowork', session: 'abc123' }
    globalThis.fetch = mockFetch(signalResponse('action', description))

    await LoopyMapper.map(LOOP_ID, { description, metadata }, config)

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
    expect(body.metadata).toEqual(metadata)
  })

  it('uses the correct loopId', async () => {
    const description = 'Reviewed the sprint board'
    globalThis.fetch = mockFetch(signalResponse('interpretation', description))

    await LoopyMapper.map(LOOP_ID, { description }, config)

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
    expect(body.loopId).toBe(LOOP_ID)
  })

  it('is case-insensitive in classification', async () => {
    const description = 'ANALYZED THE SYSTEM LOGS'
    globalThis.fetch = mockFetch(signalResponse('perception', description))

    await LoopyMapper.map(LOOP_ID, { description }, config)

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
    expect(body.type).toBe('perception')
  })
})
