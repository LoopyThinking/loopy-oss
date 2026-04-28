import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'
import type { AuthVariables, OrgRole } from '../types.js'

process.env.LOOPY_ENCRYPTION_KEY = 'dGVzdC1rZXktZm9yLXVuaXQtdGVzdHMtMTIzNDU2Nzg='

// Mock the db client — return empty arrays by default
vi.mock('../db/client.js', () => ({
  default: () => [],
}))

// Mock the org middleware to set role directly from header
vi.mock('../middleware/org.js', () => {
  const ROLE_RANK: Record<OrgRole, number> = {
    viewer: 0, member: 1, admin: 2, owner: 3,
  }
  return {
    orgMiddleware: vi.fn().mockImplementation((c: any, next: any) => {
      const orgId = c.req.header('X-Org-Id')
      if (!orgId) {
        return c.json({ error: 'Bad Request', message: 'X-Org-Id header is required' }, 400)
      }
      const role: OrgRole = (c.req.header('X-Test-Role') as OrgRole) ?? 'owner'
      c.set('userId', 'test-user-id')
      c.set('agentId', null)
      c.set('orgId', orgId)
      c.set('orgRole', role)
      return next()
    }),
    hasRole: (userRole: OrgRole, required: OrgRole) => ROLE_RANK[userRole] >= ROLE_RANK[required],
    forbiddenRole: (required: OrgRole) => ({
      error: 'Forbidden',
      message: `This action requires role: ${required} or above`,
    }),
  }
})

// Import after mocks
import llm from '../routes/llm.js'

function createTestApp() {
  const app = new Hono<{ Variables: AuthVariables }>()
  app.route('/orgs/:orgId/llm-configs', llm)
  return app
}

function headers(role: OrgRole = 'owner'): Record<string, string> {
  return {
    'X-Org-Id': 'test-org-id',
    'X-Test-Role': role,
  }
}

describe('LLM config routes — auth guards', () => {
  it('blocks viewer with 403 on GET', async () => {
    const app = createTestApp()
    const res = await app.request('/orgs/test-org-id/llm-configs', {
      headers: headers('viewer'),
    })
    expect(res.status).toBe(403)
  })

  it('blocks member with 403 on GET', async () => {
    const app = createTestApp()
    const res = await app.request('/orgs/test-org-id/llm-configs', {
      headers: headers('member'),
    })
    expect(res.status).toBe(403)
  })

  it('allows admin access on GET', async () => {
    const app = createTestApp()
    const res = await app.request('/orgs/test-org-id/llm-configs', {
      headers: headers('admin'),
    })
    expect(res.status).toBe(200)
  })

  it('allows owner access on GET', async () => {
    const app = createTestApp()
    const res = await app.request('/orgs/test-org-id/llm-configs', {
      headers: headers('owner'),
    })
    expect(res.status).toBe(200)
  })
})

describe('LLM config routes — validation', () => {
  it('rejects POST with missing provider', async () => {
    const app = createTestApp()
    const res = await app.request('/orgs/test-org-id/llm-configs', {
      method: 'POST',
      headers: { ...headers('admin'), 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    const body = await res.json() as { message?: string }
    expect(body.message).toContain('provider')
  })

  it('rejects POST with no api_key', async () => {
    const app = createTestApp()
    const res = await app.request('/orgs/test-org-id/llm-configs', {
      method: 'POST',
      headers: { ...headers('admin'), 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'anthropic', display_name: 'Test', model: 'claude-3' }),
    })
    expect(res.status).toBe(400)
  })

  it('rejects POST with invalid provider', async () => {
    const app = createTestApp()
    const res = await app.request('/orgs/test-org-id/llm-configs', {
      method: 'POST',
      headers: { ...headers('admin'), 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'invalid', display_name: 'Test', model: 'claude-3', api_key: 'sk-test' }),
    })
    expect(res.status).toBe(400)
  })

  it('rejects POST with missing base_url for openai_compatible', async () => {
    const app = createTestApp()
    const res = await app.request('/orgs/test-org-id/llm-configs', {
      method: 'POST',
      headers: { ...headers('admin'), 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'openai_compatible', display_name: 'Test', model: 'llama3', api_key: 'sk-test' }),
    })
    expect(res.status).toBe(400)
  })

  it('rejects POST with member role (403)', async () => {
    const app = createTestApp()
    const res = await app.request('/orgs/test-org-id/llm-configs', {
      method: 'POST',
      headers: { ...headers('member'), 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'anthropic', display_name: 'Test', model: 'claude-3', api_key: 'sk-test' }),
    })
    expect(res.status).toBe(403)
  })
})

describe('LLM config routes — PATCH validation', () => {
  it('rejects PATCH with no fields', async () => {
    const app = createTestApp()
    const res = await app.request('/orgs/test-org-id/llm-configs/test-id', {
      method: 'PATCH',
      headers: { ...headers('admin'), 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })

  it('blocks viewer from PATCH', async () => {
    const app = createTestApp()
    const res = await app.request('/orgs/test-org-id/llm-configs/test-id', {
      method: 'PATCH',
      headers: { ...headers('viewer'), 'Content-Type': 'application/json' },
    })
    expect(res.status).toBe(403)
  })
})

describe('LLM config routes — DELETE', () => {
  it('blocks viewer from deleting', async () => {
    const app = createTestApp()
    const res = await app.request('/orgs/test-org-id/llm-configs/test-id', {
      method: 'DELETE',
      headers: headers('viewer'),
    })
    expect(res.status).toBe(403)
  })

  it('allows admin but returns 404 if not found', async () => {
    const app = createTestApp()
    const res = await app.request('/orgs/test-org-id/llm-configs/nonexistent', {
      method: 'DELETE',
      headers: headers('admin'),
    })
    expect(res.status).toBe(404)
  })
})

describe('LLM config routes — rotate', () => {
  it('rejects rotate without api_key', async () => {
    const app = createTestApp()
    const res = await app.request('/orgs/test-org-id/llm-configs/test-id/rotate', {
      method: 'POST',
      headers: { ...headers('admin'), 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })

  it('blocks viewer from rotating', async () => {
    const app = createTestApp()
    const res = await app.request('/orgs/test-org-id/llm-configs/test-id/rotate', {
      method: 'POST',
      headers: { ...headers('viewer'), 'Content-Type': 'application/json' },
    })
    expect(res.status).toBe(403)
  })
})

describe('LLM config routes — test', () => {
  it('blocks viewer from testing', async () => {
    const app = createTestApp()
    const res = await app.request('/orgs/test-org-id/llm-configs/test-id/test', {
      method: 'POST',
      headers: headers('viewer'),
    })
    expect(res.status).toBe(403)
  })
})
