import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { corsMiddleware } from './middleware/cors.js'
import { authMiddleware } from './middleware/auth.js'
import health from './routes/health.js'
import loops from './routes/loops.js'
import signals from './routes/signals.js'
import agents from './routes/agents.js'
import capabilities from './routes/capabilities.js'
import orgs from './routes/orgs.js'
import admin from './routes/admin.js'
import invites from './routes/invites.js'
import me from './routes/me.js'
import llm from './routes/llm.js'

const app = new Hono()

// ── Global middleware ─────────────────────────────────────────────────────────

app.use('*', corsMiddleware)

// ── Public routes (no auth) ───────────────────────────────────────────────────

app.route('/health', health)

// ── Protected routes ──────────────────────────────────────────────────────────

app.use('/loops/*', authMiddleware)
app.use('/signals/*', authMiddleware)
app.use('/agents/*', authMiddleware)
app.use('/orgs/*', authMiddleware)
app.use('/admin/*', authMiddleware)
app.use('/me/*', authMiddleware)
// /invites/:token is public; /invites/accept requires auth (handled inside route)

app.route('/loops', loops)
app.route('/signals', signals)
app.route('/agents', agents)
app.route('/agents', capabilities)   // /agents/:agentId/skills + /agents/:agentId/tools
app.route('/orgs', orgs)
app.route('/admin', admin)
app.route('/invites', invites)       // GET /invites/:token (public) + POST /invites/accept (auth)
app.route('/me', me)                 // GET/PATCH /me, GET/DELETE /me/agents
app.route('/orgs/:orgId/llm-configs', llm)  // /orgs/:id/llm-configs/* (admin+)

// ── 404 handler ───────────────────────────────────────────────────────────────

app.notFound((c) =>
  c.json({ error: 'Not Found', message: `${c.req.method} ${c.req.path} not found` }, 404)
)

// ── Error handler ─────────────────────────────────────────────────────────────

app.onError((err, c) => {
  console.error(`[${c.req.method} ${c.req.path}]`, err)
  return c.json({ error: 'Internal Server Error', message: 'An unexpected error occurred' }, 500)
})

// ── Start server ──────────────────────────────────────────────────────────────

const port = Number(process.env.PORT ?? 3001)

serve({ fetch: app.fetch, port }, () => {
  console.log(`🚀 Loopy API running on http://localhost:${port}`)
})

export default app
