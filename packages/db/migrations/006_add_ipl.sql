-- Migration 006: Add IPL (Índice de Productividad Liberada) fields
--
-- IPL measures how many human-equivalent minutes the agent executed per loop.
-- The OSS version uses a heuristic (signal type × weight for agent signals),
-- optionally overridden per-signal via estimated_human_minutes.
--
-- Design decisions:
--   · ipl_minutes lives on loops (aggregated, recalculated after every signal).
--   · estimated_human_minutes lives on work_signals (per-signal override).
--     When present and > 0 for an agent signal, it replaces the heuristic weight.
--   · The heuristic weights (IPL_WEIGHTS_AGENT) live in code (apps/api/src/lib/ipl.ts)
--     so forks can adjust them without a migration.
--   · Human-sourced signals do NOT contribute to IPL — IPL measures agent output.
--   · Upper bound on estimated_human_minutes = 480 (one full 8-hour workday).

-- ── loops ─────────────────────────────────────────────────────────────────────

ALTER TABLE loops
  ADD COLUMN IF NOT EXISTS ipl_minutes INTEGER NOT NULL DEFAULT 0
    CHECK (ipl_minutes >= 0);

-- ── work_signals ──────────────────────────────────────────────────────────────

ALTER TABLE work_signals
  ADD COLUMN IF NOT EXISTS estimated_human_minutes INTEGER
    CHECK (estimated_human_minutes IS NULL
        OR (estimated_human_minutes >= 0 AND estimated_human_minutes <= 480));

-- ── Index ─────────────────────────────────────────────────────────────────────
-- Useful for the IPL recalculation query (filters by loop_id + source = 'agent')

CREATE INDEX IF NOT EXISTS idx_work_signals_loop_source
  ON work_signals (loop_id, source);
