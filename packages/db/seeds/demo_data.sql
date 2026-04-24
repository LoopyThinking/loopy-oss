-- Demo seed data for local development and testing.
-- Creates 2 loops and 5 work signals for a demo user.
--
-- Usage:
--   psql $DATABASE_URL -f seeds/demo_data.sql
--
-- Note: RLS must be disabled or bypassed (service role) when running seeds.

-- ── Demo user ─────────────────────────────────────────────────────────────────
-- We use a fixed UUID so seeds are idempotent.
-- In Supabase: create this user via the Auth dashboard first,
-- then run the seed to populate their data.

DO $$
DECLARE
  demo_user_id  UUID := '00000000-0000-0000-0000-000000000001';
  loop_1_id     UUID := '00000000-0000-0000-0000-000000000010';
  loop_2_id     UUID := '00000000-0000-0000-0000-000000000011';
BEGIN

-- ── Loop 1: Open loop with signals ───────────────────────────────────────────

INSERT INTO loops (id, user_id, title, hypothesis, status, scope, confidence_index)
VALUES (
  loop_1_id,
  demo_user_id,
  'Migrate API from Supabase Edge Functions to Hono',
  'Hono will be faster to iterate on and easier for contributors to understand',
  'open',
  'personal',
  65
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO work_signals (loop_id, user_id, type, content, source, metadata)
VALUES
  (
    loop_1_id, demo_user_id,
    'perception',
    'Analyzed current edge function structure — 12 functions, heavy Supabase coupling',
    'agent',
    '{"tool": "claude-cowork", "session": "demo-001"}'
  ),
  (
    loop_1_id, demo_user_id,
    'interpretation',
    'Evaluated Hono vs Express: Hono is TypeScript-native, runs on Node + edge, zero deps',
    'human',
    '{}'
  ),
  (
    loop_1_id, demo_user_id,
    'decision',
    'Decided to use Hono. Rebuilding from scratch rather than migrating function by function.',
    'human',
    '{}'
  ),
  (
    loop_1_id, demo_user_id,
    'action',
    'Scaffolded apps/api/ with Hono, auth middleware, and /health endpoint',
    'agent',
    '{"tool": "claude-cowork", "session": "demo-002"}'
  );

-- ── Loop 2: Closed loop ───────────────────────────────────────────────────────
-- Insert as 'open' first so the trigger allows signals, then close it.

INSERT INTO loops (id, user_id, title, hypothesis, status, scope, confidence_index)
VALUES (
  loop_2_id,
  demo_user_id,
  'Choose license for Loopy OSS',
  'AGPL v3 is the right choice to prevent SaaS forks without contribution',
  'open',
  'personal',
  100
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO work_signals (loop_id, user_id, type, content, source, metadata)
VALUES
  (
    loop_2_id, demo_user_id,
    'reflection',
    'Reviewed how PostHog, n8n, and Supabase use AGPL. Pattern is clear for open-core SaaS.',
    'human',
    '{}'
  );

UPDATE loops
SET
  status     = 'closed',
  resolution = 'Chose AGPL v3. It protects the project while allowing self-hosting.',
  closed_at  = now() - interval '2 days'
WHERE id = loop_2_id;

END $$;
