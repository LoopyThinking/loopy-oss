import sql from '../db/client.js'
import type { LoopEligibility, ModeEligibility } from '../types.js'

/**
 * Evaluate whether a loop is eligible for each brief mode.
 *
 * Gate for Validated mode:
 *   - Title and hypothesis defined
 *   - Cognitive layer and scope assigned
 *   - Owner and sponsor designated
 *   - At least 5 work signals accumulated
 *   - IPL Realizado > 0
 *   - Confidence index >= 50
 *   - At least one agent-sourced signal (data source connected)
 *
 * Gate for Hypothesis mode:
 *   - Title and hypothesis defined
 *   - Cognitive layer and scope assigned
 *   - Owner and sponsor designated
 *   - Sponsor attestation completed
 *   - IPL Proyectado > 0
 *   - At least 3 critical assumptions articulated
 */
export async function checkEligibility(loopId: string): Promise<LoopEligibility> {
  // Single query to get loop + attestation + signal counts
  const [row] = await sql<Array<{
    title: string | null
    hypothesis: string | null
    scope: string | null
    cognitive_layer: string | null
    owner_id: string | null
    sponsor_id: string | null
    confidence_index: number
    ipl_minutes: number
    ipl_projected_minutes: number
    signal_count: string
    agent_signal_count: string
    attestation_id: string | null
    critical_assumptions: unknown
  }>>`
    SELECT
      l.title,
      l.hypothesis,
      l.scope,
      l.cognitive_layer,
      l.owner_id,
      l.sponsor_id,
      l.confidence_index,
      l.ipl_minutes,
      l.ipl_projected_minutes,
      COUNT(ws.id)::text AS signal_count,
      COUNT(ws.id) FILTER (WHERE ws.source = 'agent')::text AS agent_signal_count,
      sa.id AS attestation_id,
      sa.critical_assumptions
    FROM loops l
    LEFT JOIN work_signals ws ON ws.loop_id = l.id
    LEFT JOIN sponsor_attestations sa ON sa.loop_id = l.id
    WHERE l.id = ${loopId} AND l.deleted_at IS NULL
    GROUP BY l.id, sa.id
  `

  if (!row) {
    return {
      validated_mode: { eligible: false, missing: ['Loop not found'] },
      hypothesis_mode: { eligible: false, missing: ['Loop not found'] },
    }
  }

  const signalCount = parseInt(row.signal_count, 10)
  const agentSignalCount = parseInt(row.agent_signal_count, 10)

  // Parse critical assumptions (JSONB: driver may return parsed array or string)
  let assumptionCount = 0
  if (row.critical_assumptions) {
    if (Array.isArray(row.critical_assumptions)) {
      assumptionCount = row.critical_assumptions.length
    } else if (typeof row.critical_assumptions === 'string') {
      try {
        const parsed = JSON.parse(row.critical_assumptions)
        assumptionCount = Array.isArray(parsed) ? parsed.length : 0
      } catch {
        assumptionCount = 0
      }
    }
  }

  return {
    validated_mode: checkValidatedMode(
      row.title,
      row.hypothesis,
      row.scope,
      row.cognitive_layer,
      row.owner_id,
      row.sponsor_id,
      signalCount,
      agentSignalCount,
      row.confidence_index,
      row.ipl_minutes
    ),
    hypothesis_mode: checkHypothesisMode(
      row.title,
      row.hypothesis,
      row.scope,
      row.cognitive_layer,
      row.owner_id,
      row.sponsor_id,
      row.attestation_id,
      row.ipl_projected_minutes,
      assumptionCount
    ),
  }
}

function checkValidatedMode(
  title: string | null,
  hypothesis: string | null,
  scope: string | null,
  cognitiveLayer: string | null,
  ownerId: string | null,
  sponsorId: string | null,
  signalCount: number,
  agentSignalCount: number,
  confidenceIndex: number,
  iplMinutes: number
): ModeEligibility {
  const missing: string[] = []

  if (!title?.trim()) missing.push('Loop needs a title')
  if (!hypothesis?.trim()) missing.push('Loop needs a hypothesis/description')
  if (!scope) missing.push('Scope must be assigned')
  if (!cognitiveLayer) missing.push('Cognitive layer must be assigned')
  if (!ownerId) missing.push('Owner must be designated')
  if (!sponsorId) missing.push('Sponsor must be designated')
  if (signalCount < 5) missing.push(`Need at least 5 work signals (has ${signalCount})`)
  if (iplMinutes <= 0) missing.push('IPL Realizado must be greater than 0')
  if (confidenceIndex < 50) missing.push(`Confidence index must be >= 50 (currently ${confidenceIndex})`)
  if (agentSignalCount < 1) missing.push('Need at least one agent data source connected')

  return { eligible: missing.length === 0, missing }
}

function checkHypothesisMode(
  title: string | null,
  hypothesis: string | null,
  scope: string | null,
  cognitiveLayer: string | null,
  ownerId: string | null,
  sponsorId: string | null,
  attestationId: string | null,
  iplProjectedMinutes: number,
  assumptionCount: number
): ModeEligibility {
  const missing: string[] = []

  if (!title?.trim()) missing.push('Loop needs a title')
  if (!hypothesis?.trim()) missing.push('Loop needs a hypothesis/description')
  if (!scope) missing.push('Scope must be assigned')
  if (!cognitiveLayer) missing.push('Cognitive layer must be assigned')
  if (!ownerId) missing.push('Owner must be designated')
  if (!sponsorId) missing.push('Sponsor must be designated')
  if (!attestationId) missing.push('Sponsor attestation must be completed and signed')
  if (iplProjectedMinutes <= 0) missing.push('IPL Proyectado must be greater than 0')
  if (assumptionCount < 3) missing.push(`Need at least 3 critical assumptions articulated (has ${assumptionCount})`)

  return { eligible: missing.length === 0, missing }
}
