-- Migration 006 (docker/init mirror): Add IPL fields
-- Mirrors packages/db/migrations/006_add_ipl.sql for the docker-compose postgres init sequence.

ALTER TABLE loops
  ADD COLUMN IF NOT EXISTS ipl_minutes INTEGER NOT NULL DEFAULT 0
    CHECK (ipl_minutes >= 0);

ALTER TABLE work_signals
  ADD COLUMN IF NOT EXISTS estimated_human_minutes INTEGER
    CHECK (estimated_human_minutes IS NULL
        OR (estimated_human_minutes >= 0 AND estimated_human_minutes <= 480));

CREATE INDEX IF NOT EXISTS idx_work_signals_loop_source
  ON work_signals (loop_id, source);
