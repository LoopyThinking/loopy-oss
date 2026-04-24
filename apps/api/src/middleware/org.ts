import { createMiddleware } from 'hono/factory'
import sql from '../db/client.js'
import type { AuthVariables, OrgRole } from '../types.js'

// Org middleware — resolves the "current org" for a request.
//
// Reads the X-Org-Id header (UUID of the target organization), then verifies
// that the authenticated user is a member of that org. If so, injects orgId
// and orgRole into the Hono context for downstream route handlers.
//
// Must run AFTER authMiddleware (depends on context.userId being set).
//
// Routes that don't require an org context (e.g. GET /health, POST /agents to
// register a new agent before an org exists) should not apply this middleware.

export const orgMiddleware = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const userId = c.get('userId')
    const orgId = c.req.header('X-Org-Id')

    if (!orgId) {
      return c.json(
        { error: 'Bad Request', message: 'X-Org-Id header is required' },
        400
      )
    }

    // Basic UUID format check to avoid needless DB round-trip on garbage input
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRe.test(orgId)) {
      return c.json(
        { error: 'Bad Request', message: 'X-Org-Id must be a valid UUID' },
        400
      )
    }

    const [membership] = await sql<Array<{ role: OrgRole }>>`
      SELECT role
      FROM org_members
      WHERE user_id = ${userId}
        AND org_id  = ${orgId}
      LIMIT 1
    `

    if (!membership) {
      return c.json(
        { error: 'Forbidden', message: 'You are not a member of this organization' },
        403
      )
    }

    c.set('orgId', orgId)
    c.set('orgRole', membership.role)
    return next()
  }
)

// ── Role guard helpers ────────────────────────────────────────────────────────

const ROLE_RANK: Record<OrgRole, number> = {
  viewer: 0,
  member: 1,
  admin: 2,
  owner: 3,
}

/**
 * Returns true if the user's role is at least `required`.
 * Use inside route handlers after orgMiddleware has run.
 */
export function hasRole(userRole: OrgRole, required: OrgRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[required]
}

/**
 * Returns a 403 JSON response. Convenience for route handlers.
 */
export function forbiddenRole(required: OrgRole) {
  return { error: 'Forbidden', message: `This action requires role: ${required} or above` }
}
