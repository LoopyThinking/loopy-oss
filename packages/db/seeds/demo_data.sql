-- Demo seed data for local development and testing.
-- Compatible with schema v0.3.0 (includes multi-org model).
--
-- Creates:
--   · 1 demo user + 1 personal organization
--   · 1 registered agent with its token hash
--   · 4 loops (3 open, 1 closed) with realistic work signals
--   · IPL data so the /admin panel has numbers to show
--
-- Usage (from repo root):
--   docker compose exec -T db psql -U loopy loopy < packages/db/seeds/demo_data.sql
--
-- All UUIDs are fixed so the seed is idempotent (safe to run multiple times).

DO $$
DECLARE
  -- Identity
  demo_user_id  UUID := '00000000-0000-0000-0000-000000000001';
  demo_org_id   UUID := '00000000-0000-0000-0000-000000000002';
  demo_agent_id UUID := '00000000-0000-0000-0000-000000000003';

  -- Loops
  loop_1_id UUID := '00000000-0000-0000-0000-000000000010';  -- open, high confidence
  loop_2_id UUID := '00000000-0000-0000-0000-000000000011';  -- closed
  loop_3_id UUID := '00000000-0000-0000-0000-000000000012';  -- open, low confidence
  loop_4_id UUID := '00000000-0000-0000-0000-000000000013';  -- open, team scope
BEGIN

-- ── 1. Demo user ─────────────────────────────────────────────────────────────

INSERT INTO users (id, email, display_name)
VALUES (demo_user_id, 'demo@loopy-oss.local', 'Demo User')
ON CONFLICT (id) DO NOTHING;

-- ── 2. Demo organization ─────────────────────────────────────────────────────

INSERT INTO organizations (id, name, slug)
VALUES (demo_org_id, 'Personal Workspace', 'demo-workspace')
ON CONFLICT (id) DO NOTHING;

INSERT INTO org_members (user_id, org_id, role)
VALUES (demo_user_id, demo_org_id, 'owner')
ON CONFLICT (user_id, org_id) DO NOTHING;

-- ── 3. Demo agent ────────────────────────────────────────────────────────────
-- Token: lpy_agent_demo0000000000000000000000000000000000000000000000000000
-- Hash of that token (sha256):
--   echo -n "lpy_agent_demo0000000000000000000000000000000000000000000000000000" | sha256sum

INSERT INTO agent_registry (id, user_id, org_id, agent_name, token_hash, description)
VALUES (
  demo_agent_id,
  demo_user_id,
  demo_org_id,
  'Claude Cowork Agent',
  -- sha256 of "lpy_agent_demo0000000000000000000000000000000000000000000000000000"
  'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
  'Demo agent for local development and testing'
)
ON CONFLICT (id) DO NOTHING;

-- ── 4. Loop 1: Migrating the API (open, high confidence, agent IPL) ──────────

INSERT INTO loops (id, user_id, org_id, title, hypothesis, status, scope, confidence_index, ipl_minutes)
VALUES (
  loop_1_id, demo_user_id, demo_org_id,
  'Migrate API from Supabase Edge Functions to Hono',
  'Hono will be faster to iterate on and easier for contributors to understand',
  'open', 'personal', 73, 38
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO work_signals (loop_id, user_id, org_id, type, content, source, estimated_human_minutes)
VALUES
  (loop_1_id, demo_user_id, demo_org_id,
   'perception',
   'Analyzed current edge function structure — 12 functions, heavy Supabase coupling',
   'agent', 3),
  (loop_1_id, demo_user_id, demo_org_id,
   'interpretation',
   'Evaluated Hono vs Express: Hono is TypeScript-native, zero deps, runs on Node + edge',
   'human', NULL),
  (loop_1_id, demo_user_id, demo_org_id,
   'decision',
   'Decided to rebuild from scratch with Hono rather than migrating function by function',
   'human', NULL),
  (loop_1_id, demo_user_id, demo_org_id,
   'action',
   'Scaffolded apps/api/ with Hono, auth middleware (JWT + agent token), and /health endpoint',
   'agent', 25),
  (loop_1_id, demo_user_id, demo_org_id,
   'action',
   'Implemented /loops, /signals, /agents routes — 8 core endpoints passing basic tests',
   'agent', 10);

-- ── 5. Loop 2: Choosing a license (closed) ───────────────────────────────────

INSERT INTO loops (id, user_id, org_id, title, hypothesis, status, scope, confidence_index, ipl_minutes)
VALUES (
  loop_2_id, demo_user_id, demo_org_id,
  'Choose license for Loopy OSS',
  'AGPL v3 is the right choice to prevent SaaS forks without contribution',
  'open', 'personal', 100, 12
)
ON CONFLICT (id) DO UPDATE SET status = 'open', resolution = NULL, closed_at = NULL;

INSERT INTO work_signals (loop_id, user_id, org_id, type, content, source, estimated_human_minutes)
VALUES
  (loop_2_id, demo_user_id, demo_org_id,
   'perception',
   'Researched how PostHog, n8n, Supabase, and Metabase chose their licenses',
   'agent', 8),
  (loop_2_id, demo_user_id, demo_org_id,
   'interpretation',
   'AGPL v3 is the standard for open-core SaaS: free to use, must open modifications',
   'human', NULL),
  (loop_2_id, demo_user_id, demo_org_id,
   'reflection',
   'AGPL v3 confirmed. Protects commercial viability while enabling community self-hosting.',
   'human', NULL);

UPDATE loops
SET
  status     = 'closed',
  resolution = 'Chose AGPL v3. Protects the open-core model without restricting self-hosters.',
  closed_at  = now() - interval '3 days'
WHERE id = loop_2_id;

-- ── 6. Loop 3: Investigating a bug (open, low confidence, early stage) ───────

INSERT INTO loops (id, user_id, org_id, title, hypothesis, status, scope, confidence_index, ipl_minutes)
VALUES (
  loop_3_id, demo_user_id, demo_org_id,
  'Confidence index not updating after agent signals',
  'Possibly a missing recalculation call after signal insert',
  'open', 'personal', 16, 3
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO work_signals (loop_id, user_id, org_id, type, content, source, estimated_human_minutes)
VALUES
  (loop_3_id, demo_user_id, demo_org_id,
   'perception',
   'User reported: confidence_index stays at 0 after emitting 3 agent signals via SDK',
   'agent', 3);

-- ── 7. Loop 4: Planning the MCP server (open, team scope) ────────────────────

INSERT INTO loops (id, user_id, org_id, title, hypothesis, status, scope, confidence_index, ipl_minutes)
VALUES (
  loop_4_id, demo_user_id, demo_org_id,
  'Design and ship loopy-mcp server',
  '7 core MCP tools is the right scope: create, emit, map, close, get, list, confidence',
  'open', 'team', 55, 0
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO work_signals (loop_id, user_id, org_id, type, content, source)
VALUES
  (loop_4_id, demo_user_id, demo_org_id,
   'perception',
   'Reviewed MCP SDK docs and existing server examples (filesystem, postgres, github)',
   'agent'),
  (loop_4_id, demo_user_id, demo_org_id,
   'interpretation',
   'StdioServerTransport is the correct transport for npx-style CLI servers',
   'human'),
  (loop_4_id, demo_user_id, demo_org_id,
   'decision',
   'Scope: 7 tools. map_signal added for auto-classification — removes friction for new users.',
   'human');

END $$;
