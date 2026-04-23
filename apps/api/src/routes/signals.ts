import { Hono } from 'hono'
import sql from '../db/client.js'
import { recalculateConfidence } from './loops.js'
import { recalculateIpl } from '../lib/ipl.js'
import type { AuthVariables, WorkSignal, Loop } from '../types.js'

const signals = new Hono<{ Variables: AuthVariables }>()

const VALID_TYPES = ['perception', 'interpretation', 'decision', 'action', 'reflection']
const VALID_SOURCES = ['human', 'agent']

// ── POST /signals ─────────────────────────────────────────────────────────────

signals.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{
    loopId?: string
    type?: string
    content?: string
    source?: string
    /** Override IPL heuristic: minutes of human work this agent signal replaced (max 480) */
    estimatedHumanMinutes?: number
    metadata?: Record<string, unknown>
  }>()

  // Validate required fields
  if (!body.loopId) {
    return c.json({ error: 'Bad Request', message: 'loopId is required' }, 400)
  }
  if (!body.type || !VALID_TYPES.includes(body.type)) {
    return c.json(
      { error: 'Bad Request', message: `type must be one of: ${VALID_TYPES.join(', ')}` },
      400
    )
  }
  if (!body.content?.trim()) {
    return c.json({ error: 'Bad Request', message: 'content is required' }, 400)
  }

  const source = body.source ?? 'human'
  if (!VALID_SOURCES.includes(source)) {
    return c.json(
      { error: 'Bad Request', message: `source must be one of: ${VALID_SOURCES.join(', ')}` },
      400
    )
  }

  // Verify the loop exists and belongs to this user
  const [loop] = await sql<Loop[]>`
    SELECT id, status FROM loops WHERE id = ${body.loopId} AND user_id = ${userId}
  `

  if (!loop) {
    return c.json({ error: 'Not Found', message: 'Loop not found' }, 404)
  }

  if (loop.status === 'closed') {
    return c.json(
      { error: 'Bad Request', message: 'Cannot emit a signal into a closed loop' },
      400
    )
  }

  const metadata = body.metadata ?? {}

  // Validate estimatedHumanMinutes if provided
  let estimatedHumanMinutes: number | null = null
  if (body.estimatedHumanMinutes !== undefined) {
    const val = Number(body.estimatedHumanMinutes)
    if (!Number.isInteger(val) || val < 0 || val > 480) {
      return c.json(
        { error: 'Bad Request', message: 'estimatedHumanMinutes must be an integer between 0 and 480' },
        400
      )
    }
    estimatedHumanMinutes = val
  }

  const [signal] = await sql<WorkSignal[]>`
    INSERT INTO work_signals (loop_id, user_id, type, content, source, estimated_human_minutes, metadata)
    VALUES (
      ${body.loopId},
      ${userId},
      ${body.type},
      ${body.content.trim()},
      ${source},
      ${estimatedHumanMinutes},
      ${JSON.stringify(metadata)}
    )
    RETURNING *
  `

  // Recalculate confidence index and IPL after each new signal (fire in parallel)
  const [newConfidence, newIpl] = await Promise.all([
    recalculateConfidence(body.loopId),
    recalculateIpl(body.loopId),
  ])
  await sql`
    UPDATE loops
    SET confidence_index = ${newConfidence},
        ipl_minutes      = ${newIpl}
    WHERE id = ${body.loopId}
  `

  return c.json(signal, 201)
})

export default signals
