import { Hono } from 'hono'
import sql from '../db/client.js'
import { calculateProjectedIpl } from '../lib/ipl.js'
import type { AuthVariables, SponsorAttestation } from '../types.js'

const attestations = new Hono<{ Variables: AuthVariables }>()

// ── GET /loops/:id/attestation ──────────────────────────────────────────────

attestations.get('/:id/attestation', async (c) => {
  const userId = c.get('userId')
  const loopId = c.req.param('id')

  const [loop] = await sql<Array<{ user_id: string; org_id: string }>>`
    SELECT user_id, org_id FROM loops WHERE id = ${loopId} AND deleted_at IS NULL
  `
  if (!loop) {
    return c.json({ error: 'Not Found', message: 'Loop not found' }, 404)
  }

  const [attestation] = await sql<SponsorAttestation[]>`
    SELECT * FROM sponsor_attestations WHERE loop_id = ${loopId}
  `

  if (!attestation) {
    return c.json({ error: 'Not Found', message: 'No attestation for this loop' }, 404)
  }

  // Parse JSONB fields that postgres driver returns as strings
  const parsed = {
    ...attestation,
    critical_assumptions: Array.isArray(attestation.critical_assumptions)
      ? attestation.critical_assumptions
      : typeof attestation.critical_assumptions === 'string'
        ? JSON.parse(attestation.critical_assumptions)
        : [],
  }

  return c.json(parsed)
})

// ── POST /loops/:id/attestation ─────────────────────────────────────────────
// Creates or replaces the attestation. Only the loop owner or sponsor can do this.

attestations.post('/:id/attestation', async (c) => {
  const userId = c.get('userId')
  const loopId = c.req.param('id')

  const [loop] = await sql<Array<{ user_id: string; sponsor_id: string | null }>>`
    SELECT user_id, sponsor_id FROM loops WHERE id = ${loopId} AND deleted_at IS NULL
  `
  if (!loop) {
    return c.json({ error: 'Not Found', message: 'Loop not found' }, 404)
  }

  // Only the loop owner or designated sponsor can create/update the attestation
  const isOwner = loop.user_id === userId
  const isSponsor = loop.sponsor_id === userId
  if (!isOwner && !isSponsor) {
    return c.json({ error: 'Forbidden', message: 'Only the loop owner or designated sponsor can manage the attestation' }, 403)
  }

  const body = await c.req.json<{
    frequency_per_month: number
    avg_duration_minutes: number
    people_count: number
    adoption_rate_pct: number
    critical_assumptions?: string[]
    comment?: string
  }>()

  // Validate required fields
  const errors: string[] = []
  if (!body.frequency_per_month || body.frequency_per_month < 1) errors.push('frequency_per_month must be >= 1')
  if (!body.avg_duration_minutes || body.avg_duration_minutes < 1) errors.push('avg_duration_minutes must be >= 1')
  if (!body.people_count || body.people_count < 1) errors.push('people_count must be >= 1')
  if (!body.adoption_rate_pct || body.adoption_rate_pct < 1 || body.adoption_rate_pct > 100) errors.push('adoption_rate_pct must be between 1 and 100')

  if (errors.length > 0) {
    return c.json({ error: 'Bad Request', message: errors.join('; ') }, 400)
  }

  const assumptions = body.critical_assumptions ?? []

  // Calculate projected IPL from the declared inputs
  const projectedIpl = calculateProjectedIpl({
    frequency_per_month: body.frequency_per_month,
    avg_duration_minutes: body.avg_duration_minutes,
    people_count: body.people_count,
    adoption_rate_pct: body.adoption_rate_pct,
  })

  // Upsert attestation
  const [attestation] = await sql<SponsorAttestation[]>`
    INSERT INTO sponsor_attestations (
      loop_id, sponsor_id, frequency_per_month, avg_duration_minutes,
      people_count, adoption_rate_pct, critical_assumptions, comment
    ) VALUES (
      ${loopId}, ${userId},
      ${body.frequency_per_month}, ${body.avg_duration_minutes},
      ${body.people_count}, ${body.adoption_rate_pct},
      ${JSON.stringify(assumptions)}::jsonb,
      ${body.comment ?? null}
    )
    ON CONFLICT (loop_id) DO UPDATE SET
      sponsor_id           = EXCLUDED.sponsor_id,
      frequency_per_month  = EXCLUDED.frequency_per_month,
      avg_duration_minutes = EXCLUDED.avg_duration_minutes,
      people_count         = EXCLUDED.people_count,
      adoption_rate_pct    = EXCLUDED.adoption_rate_pct,
      critical_assumptions = EXCLUDED.critical_assumptions,
      comment              = EXCLUDED.comment,
      updated_at           = now()
    RETURNING *
  `

  // Update the loop's projected IPL
  await sql`
    UPDATE loops SET ipl_projected_minutes = ${projectedIpl}, updated_at = now()
    WHERE id = ${loopId}
  `

  const parsed = {
    ...attestation,
    critical_assumptions: Array.isArray(attestation.critical_assumptions)
      ? attestation.critical_assumptions
      : typeof attestation.critical_assumptions === 'string'
        ? JSON.parse(attestation.critical_assumptions)
        : [],
  }

  return c.json(parsed, 201)
})

// ── DELETE /loops/:id/attestation ────────────────────────────────────────────
// Removes the attestation so it can be regenerated.

attestations.delete('/:id/attestation', async (c) => {
  const userId = c.get('userId')
  const loopId = c.req.param('id')

  const [loop] = await sql<Array<{ user_id: string; sponsor_id: string | null }>>`
    SELECT user_id, sponsor_id FROM loops WHERE id = ${loopId} AND deleted_at IS NULL
  `
  if (!loop) {
    return c.json({ error: 'Not Found', message: 'Loop not found' }, 404)
  }

  const isOwner = loop.user_id === userId
  const isSponsor = loop.sponsor_id === userId
  if (!isOwner && !isSponsor) {
    return c.json({ error: 'Forbidden', message: 'Only the loop owner or designated sponsor can remove the attestation' }, 403)
  }

  await sql`DELETE FROM sponsor_attestations WHERE loop_id = ${loopId}`

  // Reset projected IPL
  await sql`
    UPDATE loops SET ipl_projected_minutes = 0, updated_at = now()
    WHERE id = ${loopId}
  `

  return c.body(null, 204)
})

export default attestations
