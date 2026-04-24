-- Self-hosted init: indexes
-- RLS is intentionally omitted for plain PostgreSQL deployments.
-- User isolation is enforced by the API middleware (apps/api/src/middleware/auth.ts).

CREATE INDEX IF NOT EXISTS idx_loops_user_id      ON loops (user_id);
CREATE INDEX IF NOT EXISTS idx_loops_user_status  ON loops (user_id, status);
CREATE INDEX IF NOT EXISTS idx_loops_created_at   ON loops (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_work_signals_loop_id      ON work_signals (loop_id);
CREATE INDEX IF NOT EXISTS idx_work_signals_loop_created ON work_signals (loop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_signals_user_id      ON work_signals (user_id);

CREATE INDEX IF NOT EXISTS idx_agent_registry_token_hash ON agent_registry (token_hash);
CREATE INDEX IF NOT EXISTS idx_agent_registry_user_id    ON agent_registry (user_id);
