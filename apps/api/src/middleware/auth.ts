import { createMiddleware } from 'hono/factory'
import { jwtVerify, createRemoteJWKSet } from 'jose'
import { createHash } from 'crypto'
import sql from '../db/client.js'
import type { AuthVariables } from '../types.js'

// Auth middleware — two token types accepted:
//
// 1. User JWT: issued by Supabase Auth (or self-hosted with JWT_SECRET).
//    Contains sub = user UUID.
//
// 2. Agent Token: opaque Bearer token like "lpy_agent_<hex>".
//    Stored as SHA-256 hash in agent_registry.
//    Resolved to user_id via the registry.

const JWT_SECRET = process.env.JWT_SECRET
const SUPABASE_URL = process.env.SUPABASE_URL

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized', message: 'Missing Bearer token' }, 401)
    }

    const token = authHeader.slice(7)

    // ── Try agent token first (fast path: starts with "lpy_agent_") ──────────
    if (token.startsWith('lpy_agent_')) {
      const tokenHash = createHash('sha256').update(token).digest('hex')

      const [agent] = await sql<Array<{ id: string; user_id: string }>>`
        SELECT id, user_id
        FROM agent_registry
        WHERE token_hash = ${tokenHash}
          AND is_active = true
        LIMIT 1
      `

      if (!agent) {
        return c.json({ error: 'Unauthorized', message: 'Invalid agent token' }, 401)
      }

      // Update last_seen_at in the background (fire-and-forget)
      sql`UPDATE agent_registry SET last_seen_at = now() WHERE id = ${agent.id}`.catch(
        () => {}
      )

      c.set('userId', agent.user_id)
      c.set('agentId', agent.id)
      return next()
    }

    // ── Try JWT ───────────────────────────────────────────────────────────────
    try {
      let payload: { sub?: string }

      if (SUPABASE_URL) {
        // Supabase hosted: verify against Supabase's JWKS endpoint
        const JWKS = createRemoteJWKSet(
          new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
        )
        const { payload: p } = await jwtVerify(token, JWKS)
        payload = p as { sub?: string }
      } else if (JWT_SECRET) {
        // Self-hosted: verify with symmetric JWT_SECRET
        const secret = new TextEncoder().encode(JWT_SECRET)
        const { payload: p } = await jwtVerify(token, secret)
        payload = p as { sub?: string }
      } else {
        return c.json(
          { error: 'Server Error', message: 'Auth not configured: set JWT_SECRET or SUPABASE_URL' },
          500
        )
      }

      if (!payload.sub) {
        return c.json({ error: 'Unauthorized', message: 'Invalid JWT: missing sub' }, 401)
      }

      c.set('userId', payload.sub)
      c.set('agentId', null)
      return next()
    } catch {
      return c.json({ error: 'Unauthorized', message: 'Invalid or expired token' }, 401)
    }
  }
)
