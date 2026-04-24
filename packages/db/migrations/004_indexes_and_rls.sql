-- Migration 004: Indexes and Row-Level Security
-- Performance indexes for the most common query patterns,
-- and RLS policies so each user can only access their own data.

-- ── Indexes ──────────────────────────────────────────────────────────────────

-- loops: most common queries filter by user_id + status
CREATE INDEX IF NOT EXISTS idx_loops_user_id
  ON loops (user_id);

CREATE INDEX IF NOT EXISTS idx_loops_user_status
  ON loops (user_id, status);

CREATE INDEX IF NOT EXISTS idx_loops_created_at
  ON loops (created_at DESC);

-- work_signals: most common queries filter by loop_id, with time ordering
CREATE INDEX IF NOT EXISTS idx_work_signals_loop_id
  ON work_signals (loop_id);

CREATE INDEX IF NOT EXISTS idx_work_signals_loop_created
  ON work_signals (loop_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_work_signals_user_id
  ON work_signals (user_id);

-- agent_registry: token lookup must be fast (happens on every agent request)
CREATE INDEX IF NOT EXISTS idx_agent_registry_token_hash
  ON agent_registry (token_hash);

CREATE INDEX IF NOT EXISTS idx_agent_registry_user_id
  ON agent_registry (user_id);

-- ── Row-Level Security (Supabase / PostgreSQL with auth.uid()) ────────────────
-- These policies assume the caller sets auth.uid() via JWT (Supabase pattern).
-- If using a custom auth middleware, adapt the auth.uid() calls accordingly.

ALTER TABLE loops           ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_signals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_registry  ENABLE ROW LEVEL SECURITY;

-- loops: users can only see and modify their own loops
CREATE POLICY loops_select ON loops
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY loops_insert ON loops
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY loops_update ON loops
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY loops_delete ON loops
  FOR DELETE USING (user_id = auth.uid());

-- work_signals: users can only see signals on their own loops
CREATE POLICY work_signals_select ON work_signals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY work_signals_insert ON work_signals
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Signals are immutable — no UPDATE or DELETE policies.

-- agent_registry: users can only see and manage their own agents
CREATE POLICY agent_registry_select ON agent_registry
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY agent_registry_insert ON agent_registry
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY agent_registry_update ON agent_registry
  FOR UPDATE USING (user_id = auth.uid());

-- ── Note on self-hosted (non-Supabase) deployments ───────────────────────────
-- If running against a plain PostgreSQL instance (docker-compose),
-- auth.uid() won't exist. In that case, disable RLS and enforce
-- user isolation in the API middleware (apps/api/src/middleware/auth.ts).
-- To disable RLS for a plain Postgres setup:
--
--   ALTER TABLE loops          DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE work_signals   DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE agent_registry DISABLE ROW LEVEL SECURITY;
