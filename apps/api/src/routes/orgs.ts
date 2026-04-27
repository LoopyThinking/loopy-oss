import { Hono } from 'hono'
import { randomBytes } from 'crypto'
import sql from '../db/client.js'
import { orgMiddleware, hasRole, forbiddenRole } from '../middleware/org.js'
import type { AuthVariables, Organization, OrgMember, OrgInvite } from '../types.js'

const orgs = new Hono<{ Variables: AuthVariables }>()

// ── GET /orgs — list orgs the authenticated user belongs to ───────────────────

orgs.get('/', async (c) => {
  const userId = c.get('userId')

  const rows = await sql<Array<Organization & { role: string }>>`
    SELECT o.id, o.name, o.slug, o.created_at, m.role
    FROM organizations o
    JOIN org_members m ON m.org_id = o.id
    WHERE m.user_id = ${userId}
    ORDER BY o.created_at ASC
  `

  return c.json(rows)
})

// ── POST /orgs — create a new organization ────────────────────────────────────

orgs.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{ name?: string; slug?: string }>()

  if (!body.name?.trim()) {
    return c.json({ error: 'Bad Request', message: 'name is required' }, 400)
  }

  // Auto-generate slug if not provided
  const slug = body.slug?.trim()
    ?? body.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)

  const slugRe = /^[a-z0-9][a-z0-9\-]{0,62}[a-z0-9]$/
  if (!slugRe.test(slug)) {
    return c.json(
      { error: 'Bad Request', message: 'slug must be 2–64 chars, lowercase alphanumeric and hyphens' },
      400
    )
  }

  const existing = await sql`SELECT id FROM organizations WHERE slug = ${slug}`
  if (existing.length > 0) {
    return c.json({ error: 'Conflict', message: `Slug "${slug}" is already taken` }, 409)
  }

  const [org] = await sql<Organization[]>`
    INSERT INTO organizations (name, slug)
    VALUES (${body.name.trim()}, ${slug})
    RETURNING *
  `

  // Creator becomes owner
  await sql`
    INSERT INTO org_members (user_id, org_id, role)
    VALUES (${userId}, ${org.id}, 'owner')
  `

  return c.json({ ...org, role: 'owner' }, 201)
})

// ── Routes below require org context (X-Org-Id header) ───────────────────────

orgs.use('/:id/*', orgMiddleware)

// ── GET /orgs/:id — org detail ────────────────────────────────────────────────

orgs.get('/:id', async (c) => {
  const orgId = c.get('orgId')

  const [org] = await sql<Organization[]>`
    SELECT * FROM organizations WHERE id = ${orgId}
  `

  if (!org) return c.json({ error: 'Not Found' }, 404)
  return c.json({ ...org, role: c.get('orgRole') })
})

// ── GET /orgs/:id/members — list members ──────────────────────────────────────

orgs.get('/:id/members', async (c) => {
  const orgId = c.get('orgId')

  const members = await sql<OrgMember[]>`
    SELECT m.user_id, m.org_id, m.role, m.joined_at,
           u.email, u.display_name
    FROM org_members m
    JOIN users u ON u.id = m.user_id
    WHERE m.org_id = ${orgId}
    ORDER BY m.joined_at ASC
  `

  return c.json(members)
})

// ── POST /orgs/:id/members — add a member directly (admin+) ──────────────────

orgs.post('/:id/members', async (c) => {
  const orgId  = c.get('orgId')
  const myRole = c.get('orgRole')

  if (!hasRole(myRole, 'admin')) {
    return c.json(forbiddenRole('admin'), 403)
  }

  const body = await c.req.json<{ user_id?: string; role?: string }>()

  if (!body.user_id) {
    return c.json({ error: 'Bad Request', message: 'user_id is required' }, 400)
  }

  const validRoles = ['viewer', 'member', 'admin']
  const role = body.role ?? 'member'
  if (!validRoles.includes(role)) {
    return c.json(
      { error: 'Bad Request', message: `role must be one of: ${validRoles.join(', ')}` },
      400
    )
  }

  // Upsert — allows updating an existing member's role
  await sql`
    INSERT INTO org_members (user_id, org_id, role)
    VALUES (${body.user_id}, ${orgId}, ${role})
    ON CONFLICT (user_id, org_id) DO UPDATE SET role = EXCLUDED.role
  `

  return c.json({ user_id: body.user_id, org_id: orgId, role }, 201)
})

// ── POST /orgs/:id/invites — generate an invite link token (admin+) ──────────
// No email is sent — the operator decides how to deliver the link.
// The token is a 32-byte hex string stored in a simple invites table.
// (The invites table is created inline here as a lightweight addition.)

orgs.post('/:id/invites', async (c) => {
  const orgId  = c.get('orgId')
  const myRole = c.get('orgRole')

  if (!hasRole(myRole, 'admin')) {
    return c.json(forbiddenRole('admin'), 403)
  }

  const body = await c.req.json<{ role?: string; expires_in_days?: number }>()
  const role = body.role ?? 'member'
  const validRoles = ['viewer', 'member', 'admin']
  if (!validRoles.includes(role)) {
    return c.json(
      { error: 'Bad Request', message: `role must be one of: ${validRoles.join(', ')}` },
      400
    )
  }

  const expiresInDays = Math.min(body.expires_in_days ?? 7, 30)
  const token = randomBytes(32).toString('hex')

  // Create the invites table if it doesn't exist yet (lazy DDL for minimal footprint).
  // A proper migration can add this table if needed; for v0.2.1 this is sufficient.
  await sql`
    CREATE TABLE IF NOT EXISTS org_invites (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id      UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      token       TEXT        NOT NULL UNIQUE,
      role        TEXT        NOT NULL DEFAULT 'member',
      expires_at  TIMESTAMPTZ NOT NULL,
      accepted_at TIMESTAMPTZ,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `

  const [invite] = await sql<Array<{ id: string; token: string; expires_at: string }>>`
    INSERT INTO org_invites (org_id, token, role, expires_at)
    VALUES (
      ${orgId},
      ${token},
      ${role},
      now() + (${expiresInDays} || ' days')::INTERVAL
    )
    RETURNING id, token, expires_at
  `

  return c.json({
    invite_token: invite.token,
    expires_at: invite.expires_at,
    role,
    // Provide a sample accept URL; the web app will implement /invites/accept/:token
    accept_url: `/invites/accept/${invite.token}`,
  }, 201)
})

// ── GET /orgs/:id/invites — list pending invites (admin+) ────────────────────

orgs.get('/:id/invites', async (c) => {
  const orgId  = c.get('orgId')
  const myRole = c.get('orgRole')

  if (!hasRole(myRole, 'admin')) {
    return c.json(forbiddenRole('admin'), 403)
  }

  const invites = await sql<Array<{
    id: string
    role: string
    expires_at: string
    created_at: string
    revoked_at: string | null
    invited_by_email: string | null
  }>>`
    SELECT
      i.id,
      i.role,
      i.expires_at,
      i.created_at,
      i.revoked_at,
      NULL::text AS invited_by_email
    FROM org_invites i
    WHERE i.org_id = ${orgId}
      AND i.accepted_at IS NULL
      AND i.revoked_at IS NULL
      AND i.expires_at > now()
    ORDER BY i.created_at DESC
  `

  return c.json(invites)
})

// ── DELETE /orgs/:id/invites/:inviteId — revoke an invite (admin+) ─────────────

orgs.delete('/:id/invites/:inviteId', async (c) => {
  const orgId    = c.get('orgId')
  const myRole   = c.get('orgRole')
  const inviteId = c.req.param('inviteId')

  if (!hasRole(myRole, 'admin')) {
    return c.json(forbiddenRole('admin'), 403)
  }

  const [invite] = await sql<Array<{ id: string; accepted_at: string | null; revoked_at: string | null }>>`
    SELECT id, accepted_at, revoked_at
    FROM org_invites
    WHERE id = ${inviteId} AND org_id = ${orgId}
    LIMIT 1
  `

  if (!invite) {
    return c.json({ error: 'Not Found', message: 'Invite not found' }, 404)
  }

  if (invite.accepted_at) {
    return c.json({ error: 'Conflict', message: 'Invite has already been accepted' }, 409)
  }

  if (invite.revoked_at) {
    return c.json({ error: 'Conflict', message: 'Invite is already revoked' }, 409)
  }

  await sql`
    UPDATE org_invites
    SET revoked_at = now()
    WHERE id = ${inviteId}
  `

  return c.body(null, 204)
})

// ── DELETE /orgs/:id/members/:userId — remove a member (admin+) ──────────────

orgs.delete('/:id/members/:memberId', async (c) => {
  const orgId    = c.get('orgId')
  const myRole   = c.get('orgRole')
  const memberId = c.req.param('memberId')

  if (!hasRole(myRole, 'admin')) {
    return c.json(forbiddenRole('admin'), 403)
  }

  // Cannot remove the owner
  const [target] = await sql<Array<{ role: string }>>`
    SELECT role FROM org_members WHERE user_id = ${memberId} AND org_id = ${orgId}
  `

  if (!target) {
    return c.json({ error: 'Not Found', message: 'Member not found in this org' }, 404)
  }

  if (target.role === 'owner') {
    return c.json({ error: 'Conflict', message: 'Cannot remove the org owner' }, 409)
  }

  await sql`
    DELETE FROM org_members WHERE user_id = ${memberId} AND org_id = ${orgId}
  `

  return c.body(null, 204)
})

export default orgs
