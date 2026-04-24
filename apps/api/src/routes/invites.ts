import { Hono } from 'hono'
import sql from '../db/client.js'
import { authMiddleware } from '../middleware/auth.js'
import type { AuthVariables } from '../types.js'

// Invite routes — intentionally split from /orgs to allow a public GET
// (the accept page needs to fetch org details before the user is logged in).

const invites = new Hono<{ Variables: AuthVariables }>()

// ── GET /invites/:token — fetch invite details (PUBLIC) ───────────────────────
// Used by the InviteAccept web page to show org name and role before login.

invites.get('/:token', async (c) => {
  const token = c.req.param('token')

  const [invite] = await sql<Array<{
    id: string
    org_id: string
    org_name: string
    org_slug: string
    role: string
    expires_at: string
    accepted_at: string | null
  }>>`
    SELECT
      i.id,
      i.org_id,
      o.name  AS org_name,
      o.slug  AS org_slug,
      i.role,
      i.expires_at,
      i.accepted_at
    FROM org_invites i
    JOIN organizations o ON o.id = i.org_id
    WHERE i.token = ${token}
    LIMIT 1
  `

  if (!invite) {
    return c.json({ error: 'Not Found', message: 'Invite not found or already used' }, 404)
  }

  if (invite.accepted_at) {
    return c.json({ error: 'Gone', message: 'This invite has already been accepted' }, 410)
  }

  if (new Date(invite.expires_at) < new Date()) {
    return c.json({ error: 'Gone', message: 'This invite has expired' }, 410)
  }

  return c.json({
    org_id:   invite.org_id,
    org_name: invite.org_name,
    org_slug: invite.org_slug,
    role:     invite.role,
    expires_at: invite.expires_at,
  })
})

// ── POST /invites/accept — consume an invite (AUTHENTICATED) ──────────────────
// The user must be logged in. If they're not, the web app redirects to
// /login?redirect=/invites/accept/:token and then calls this endpoint.

invites.post('/accept', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const body   = await c.req.json<{ token?: string }>()

  if (!body.token?.trim()) {
    return c.json({ error: 'Bad Request', message: 'token is required' }, 400)
  }

  const token = body.token.trim()

  // Fetch and validate the invite in one query
  const [invite] = await sql<Array<{
    id: string
    org_id: string
    org_name: string
    role: string
    expires_at: string
    accepted_at: string | null
  }>>`
    SELECT i.id, i.org_id, o.name AS org_name, i.role, i.expires_at, i.accepted_at
    FROM org_invites i
    JOIN organizations o ON o.id = i.org_id
    WHERE i.token = ${token}
    LIMIT 1
  `

  if (!invite) {
    return c.json({ error: 'Not Found', message: 'Invite not found' }, 404)
  }

  if (invite.accepted_at) {
    return c.json({ error: 'Conflict', message: 'This invite has already been accepted' }, 409)
  }

  if (new Date(invite.expires_at) < new Date()) {
    return c.json({ error: 'Gone', message: 'This invite has expired' }, 410)
  }

  // Check if user is already a member
  const [existing] = await sql<Array<{ role: string }>>`
    SELECT role FROM org_members
    WHERE user_id = ${userId} AND org_id = ${invite.org_id}
  `

  if (existing) {
    // Already a member — mark invite as used and return success
    await sql`
      UPDATE org_invites
      SET accepted_at = now(), accepted_by = ${userId}
      WHERE id = ${invite.id}
    `
    return c.json({
      org_id:   invite.org_id,
      org_name: invite.org_name,
      role:     existing.role,
      already_member: true,
    })
  }

  // Ensure user row exists (for self-hosted instances that bypass Supabase auth)
  await sql`
    INSERT INTO users (id, email, display_name)
    VALUES (${userId}, ${userId + '@placeholder.loopy'}, NULL)
    ON CONFLICT (id) DO NOTHING
  `

  // Create membership + mark invite as accepted atomically
  await sql.begin(async (tx) => {
    await tx`
      INSERT INTO org_members (user_id, org_id, role)
      VALUES (${userId}, ${invite.org_id}, ${invite.role})
      ON CONFLICT (user_id, org_id) DO NOTHING
    `
    await tx`
      UPDATE org_invites
      SET accepted_at = now(), accepted_by = ${userId}
      WHERE id = ${invite.id}
    `
  })

  return c.json({
    org_id:   invite.org_id,
    org_name: invite.org_name,
    role:     invite.role,
    already_member: false,
  }, 201)
})

export default invites
