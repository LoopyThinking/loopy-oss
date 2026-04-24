-- Loopy OSS — Complete Database Schema (reference)
-- Generated from migrations 001–004.
--
-- This file is for REFERENCE ONLY. Do not apply it directly.
-- Use the numbered files in migrations/ instead so changes are tracked.
--
-- To apply all migrations in order:
--   psql $DATABASE_URL -f migrations/001_create_loops.sql
--   psql $DATABASE_URL -f migrations/002_create_work_signals.sql
--   psql $DATABASE_URL -f migrations/003_create_agent_registry.sql
--   psql $DATABASE_URL -f migrations/004_indexes_and_rls.sql

-- ── loops ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS loops (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL,
  title            TEXT        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 255),
  hypothesis       TEXT,
  status           TEXT        NOT NULL DEFAULT 'open'
                               CHECK (status IN ('open', 'closed', 'blocked')),
  scope            TEXT        NOT NULL DEFAULT 'personal'
                               CHECK (scope IN ('personal', 'team', 'organizational')),
  confidence_index INTEGER     NOT NULL DEFAULT 0
                               CHECK (confidence_index BETWEEN 0 AND 100),
  resolution       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at        TIMESTAMPTZ,
  CONSTRAINT loops_closed_at_required
    CHECK ((status = 'closed' AND closed_at IS NOT NULL) OR status != 'closed')
);

CREATE INDEX IF NOT EXISTS idx_loops_user_id     ON loops (user_id);
CREATE INDEX IF NOT EXISTS idx_loops_user_status ON loops (user_id, status);
CREATE INDEX IF NOT EXISTS idx_loops_created_at  ON loops (created_at DESC);

-- ── work_signals ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS work_signals (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  loop_id    UUID        NOT NULL REFERENCES loops(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL,
  type       TEXT        NOT NULL
             CHECK (type IN ('perception', 'interpretation', 'decision', 'action', 'reflection')),
  content    TEXT        NOT NULL CHECK (char_length(content) >= 1),
  source     TEXT        NOT NULL DEFAULT 'human'
             CHECK (source IN ('human', 'agent')),
  metadata   JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_work_signals_loop_id      ON work_signals (loop_id);
CREATE INDEX IF NOT EXISTS idx_work_signals_loop_created ON work_signals (loop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_signals_user_id      ON work_signals (user_id);

-- ── agent_registry ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agent_registry (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL,
  agent_name   TEXT        NOT NULL CHECK (char_length(agent_name) BETWEEN 1 AND 100),
  token_hash   TEXT        NOT NULL UNIQUE,
  description  TEXT,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ,
  CONSTRAINT agent_registry_unique_name_per_user UNIQUE (user_id, agent_name)
);

CREATE INDEX IF NOT EXISTS idx_agent_registry_token_hash ON agent_registry (token_hash);
CREATE INDEX IF NOT EXISTS idx_agent_registry_user_id    ON agent_registry (user_id);
