import sql from '../db/client.js'

/**
 * IPL_WEIGHTS_AGENT — heuristic minutes-per-signal-type for agent signals.
 *
 * These values represent the estimated human effort replaced when an agent
 * emits a signal of each cognitive layer. They are intentionally conservative
 * and should be calibrated against real loops in v0.3.
 *
 * Human-sourced signals are NOT included — IPL only measures agent output.
 *
 * IMPORTANT: These weights are part of the public OSS contract.
 * If you change them in a fork, IPL values will not be comparable across
 * instances. Document the change clearly in your deployment.
 */
export const IPL_WEIGHTS_AGENT: Record<string, number> = {
  perception:     3,   // Sensing / gathering information
  interpretation: 8,   // Analyzing and making sense of data
  decision:       15,  // Evaluating options and choosing a path
  action:         10,  // Executing a concrete task
  reflection:     6,   // Reviewing outcomes and extracting learning
}

/**
 * Recalculate the IPL (in minutes) for a loop from its work signals.
 *
 * Logic:
 *   · Only agent-sourced signals contribute.
 *   · If a signal has `estimated_human_minutes` set (override), use that.
 *   · Otherwise, fall back to IPL_WEIGHTS_AGENT[type].
 *   · Result is the sum of all contributing signals.
 *
 * This mirrors recalculateConfidence in routes/loops.ts — both are called
 * after every new signal is persisted.
 */
export async function recalculateIpl(loopId: string): Promise<number> {
  const signals = await sql<Array<{ type: string; estimated_human_minutes: number | null }>>`
    SELECT type, estimated_human_minutes
    FROM work_signals
    WHERE loop_id = ${loopId}
      AND source = 'agent'
  `

  const total = signals.reduce((sum, s) => {
    const minutes =
      s.estimated_human_minutes != null && s.estimated_human_minutes > 0
        ? s.estimated_human_minutes
        : (IPL_WEIGHTS_AGENT[s.type] ?? 5)
    return sum + minutes
  }, 0)

  return total
}
