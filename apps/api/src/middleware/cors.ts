import { cors } from 'hono/cors'

// CORS middleware.
// In production, set CORS_ORIGIN to your frontend's exact origin.
// Defaults to permissive for local development.

const allowedOrigin = process.env.CORS_ORIGIN ?? '*'

export const corsMiddleware = cors({
  origin: allowedOrigin,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Org-Id'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: allowedOrigin !== '*',
})
