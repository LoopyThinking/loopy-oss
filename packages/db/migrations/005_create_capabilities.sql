-- Migration 005: Create agent capabilities tables (skills + tools)
--
-- Agents can declare which skills and tools they have available via idempotent
-- upsert endpoints. This enables Loopy to build a "capability map" per agent
-- and allows skills (e.g. loopy-bridge in Claude Code / Cowork) to report their
-- state on session start without duplicating records.
--
-- Design decisions:
--   · Uniqueness is per (agent_id, skill_name) / (agent_id, tool_name) — not
--     per user — so two agents owned by the same user may both have "docx".
--   · last_seen_at is updated on every upsert; a background job can mark
--     records inactive after 30+ days without activity.
--   · source / tool_type are stored as TEXT with CHECK constraints rather than
--     enums so forks can extend the vocabulary without a schema migration.
--   · description is capped at 500 chars; metadata JSONB is limited to 8 KB
--     at the application layer (enforced in the API route, not here).

-- ── agent_skills ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agent_skills (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID        NOT NULL
                              REFERENCES agent_registry(id)
                              ON DELETE CASCADE,
  skill_name    TEXT        NOT NULL CHECK (char_length(skill_name) BETWEEN 1 AND 200),
  version       TEXT,
  description   TEXT        CHECK (char_length(description) <= 500),
  -- built-in | user | plugin
  source        TEXT        NOT NULL DEFAULT 'user'
                              CHECK (source IN ('built-in', 'user', 'plugin')),
  metadata      JSONB       NOT NULL DEFAULT '{}',
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT agent_skills_unique_per_agent UNIQUE (agent_id, skill_name)
);

-- ── agent_tools ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agent_tools (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID        NOT NULL
                              REFERENCES agent_registry(id)
                              ON DELETE CASCADE,
  tool_name     TEXT        NOT NULL CHECK (char_length(tool_name) BETWEEN 1 AND 200),
  -- mcp | connector | function
  tool_type     TEXT        NOT NULL DEFAULT 'function'
                              CHECK (tool_type IN ('mcp', 'connector', 'function')),
  provider      TEXT,
  description   TEXT        CHECK (char_length(description) <= 500),
  metadata      JSONB       NOT NULL DEFAULT '{}',
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT agent_tools_unique_per_agent UNIQUE (agent_id, tool_name)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

-- Most common query: list all skills/tools for a given agent
CREATE INDEX IF NOT EXISTS idx_agent_skills_agent_id
  ON agent_skills (agent_id);

CREATE INDEX IF NOT EXISTS idx_agent_tools_agent_id
  ON agent_tools (agent_id);

-- Useful for "stale capability" cleanup jobs
CREATE INDEX IF NOT EXISTS idx_agent_skills_last_seen
  ON agent_skills (last_seen_at);

CREATE INDEX IF NOT EXISTS idx_agent_tools_last_seen
  ON agent_tools (last_seen_at);

-- ── Row-Level Security ────────────────────────────────────────────────────────
-- Same pattern as agent_registry: access via agent_registry.user_id join.
-- In plain Postgres (docker-compose) disable RLS and let the API enforce
-- ownership via the agent token middleware.

ALTER TABLE agent_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tools  ENABLE ROW LEVEL SECURITY;

-- Skills: readable/writable only for the agent's owner
CREATE POLICY agent_skills_select ON agent_skills
  FOR SELECT USING (
    agent_id IN (
      SELECT id FROM agent_registry WHERE user_id = auth.uid()
    )
  );

CREATE POLICY agent_skills_insert ON agent_skills
  FOR INSERT WITH CHECK (
    agent_id IN (
      SELECT id FROM agent_registry WHERE user_id = auth.uid()
    )
  );

CREATE POLICY agent_skills_update ON agent_skills
  FOR UPDATE USING (
    agent_id IN (
      SELECT id FROM agent_registry WHERE user_id = auth.uid()
    )
  );

-- Tools: same pattern
CREATE POLICY agent_tools_select ON agent_tools
  FOR SELECT USING (
    agent_id IN (
      SELECT id FROM agent_registry WHERE user_id = auth.uid()
    )
  );

CREATE POLICY agent_tools_insert ON agent_tools
  FOR INSERT WITH CHECK (
    agent_id IN (
      SELECT id FROM agent_registry WHERE user_id = auth.uid()
    )
  );

CREATE POLICY agent_tools_update ON agent_tools
  FOR UPDATE USING (
    agent_id IN (
      SELECT id FROM agent_registry WHERE user_id = auth.uid()
    )
  );

-- ── Note on self-hosted (non-Supabase) deployments ───────────────────────────
-- If running against plain PostgreSQL, auth.uid() won't exist.
-- Disable RLS and rely on the API middleware for ownership checks:
--
--   ALTER TABLE agent_skills DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE agent_tools  DISABLE ROW LEVEL SECURITY;
