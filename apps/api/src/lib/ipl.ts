import sql from '../db/client.js'

// ── Default weights ───────────────────────────────────────────────────────────
//
// Minutes of human-equivalent effort replaced per agent signal, by cognitive layer.
// These are the OSS defaults — intentionally conservative and based on early
// internal data. Operators can override any weight via environment variables
// (see resolveWeights below).
//
// IMPORTANT: Changing weights makes IPL values non-comparable across instances.
// If you override these in a deployment, document it clearly so users understand
// their numbers are not on the same scale as other Loopy deployments.

const DEFAULT_WEIGHTS: Record<string, number> = {
  perception:     3,   // Sensing / gathering information
  interpretation: 8,   // Analyzing and making sense of data
  decision:       15,  // Evaluating options and choosing a path
  action:         10,  // Executing a concrete task
  reflection:     6,   // Reviewing outcomes and extracting learning
}

// ── Env var overrides ─────────────────────────────────────────────────────────
//
// Operators can tune any weight by setting:
//   IPL_WEIGHT_PERCEPTION=5
//   IPL_WEIGHT_INTERPRETATION=10
//   IPL_WEIGHT_DECISION=20
//   IPL_WEIGHT_ACTION=12
//   IPL_WEIGHT_REFLECTION=8
//
// Values must be integers between 0 and 480 (one full workday).
// Out-of-range or non-integer values are silently ignored (default is used).

function parseWeight(envValue: string | undefined, fallback: number): number {
  if (!envValue) return fallback
  const parsed = parseInt(envValue, 10)
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 480) return fallback
  return parsed
}

function resolveWeights(): Record<string, number> {
  return {
    perception:     parseWeight(process.env.IPL_WEIGHT_PERCEPTION,     DEFAULT_WEIGHTS.perception),
    interpretation: parseWeight(process.env.IPL_WEIGHT_INTERPRETATION, DEFAULT_WEIGHTS.interpretation),
    decision:       parseWeight(process.env.IPL_WEIGHT_DECISION,        DEFAULT_WEIGHTS.decision),
    action:         parseWeight(process.env.IPL_WEIGHT_ACTION,          DEFAULT_WEIGHTS.action),
    reflection:     parseWeight(process.env.IPL_WEIGHT_REFLECTION,      DEFAULT_WEIGHTS.reflection),
  }
}

/**
 * IPL_WEIGHTS_AGENT — resolved at module load time.
 *
 * Uses environment variable overrides when present, falling back to defaults.
 * Exported for use in admin/overview and for testing.
 */
export const IPL_WEIGHTS_AGENT: Record<string, number> = resolveWeights()

/**
 * Returns the active weight configuration as a plain object.
 * Useful for exposing via GET /admin/overview so operators can verify
 * which weights are in effect on a running instance.
 */
export function getActiveWeights(): Record<string, number> {
  return { ...IPL_WEIGHTS_AGENT }
}

/**
 * Recalculate the IPL (in minutes) for a loop from its work signals.
 *
 * Logic:
 *   · Only agent-sourced signals contribute.
 *   · If a signal has `estimated_human_minutes` set and > 0, use that override.
 *   · Otherwise, use IPL_WEIGHTS_AGENT[type] (env var or default).
 *   · Result is the sum of all contributing signals.
 *
 * Called after every new agent signal is persisted (mirrors recalculateConfidence).
 */
/**
 * Calculate projected annual IPL from sponsor-declared inputs.
 *
 * Formula:
 *   projected_minutes = frequency_per_month × avg_duration_minutes × people_count
 *                     × (adoption_rate_pct / 100) × 12 months
 *
 * This represents the estimated human-equivalent minutes the loop would liberate
 * per year if the proposed integration/automation were implemented.
 */
export function calculateProjectedIpl(attestation: {
  frequency_per_month: number
  avg_duration_minutes: number
  people_count: number
  adoption_rate_pct: number
}): number {
  const monthlyMinutes =
    attestation.frequency_per_month *
    attestation.avg_duration_minutes *
    attestation.people_count *
    (attestation.adoption_rate_pct / 100)

  return Math.round(monthlyMinutes * 12)
}

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
