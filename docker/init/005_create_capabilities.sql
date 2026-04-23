-- Migration 005 (docker/init mirror): Create agent capabilities tables
-- This file mirrors packages/db/migrations/005_create_capabilities.sql
-- for the docker-compose postgres init sequence.
-- RLS is intentionally DISABLED here — auth is enforced by the API middleware.

CREATE TABLE IF NOT EXISTS agent_skills (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID        NOT NULL
                              REFERENCES agent_registry(id)
                              ON DELETE CASCADE,
  skill_name    TEXT        NOT NULL CHECK (char_length(skill_name) BETWEEN 1 AND 200),
  version       TEXT,
  description   TEXT        CHECK (char_length(description) <= 500),
  source        TEXT        NOT NULL DEFAULT 'user'
                              CHECK (source IN ('built-in', 'user', 'plugin')),
  metadata      JSONB       NOT NULL DEFAULT '{}',
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT agent_skills_unique_per_agent UNIQUE (agent_id, skill_name)
);

CREATE TABLE IF NOT EXISTS agent_tools (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID        NOT NULL
                              REFERENCES agent_registry(id)
                              ON DELETE CASCADE,
  tool_name     TEXT        NOT NULL CHECK (char_length(tool_name) BETWEEN 1 AND 200),
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

CREATE INDEX IF NOT EXISTS idx_agent_skills_agent_id ON agent_skills (agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_tools_agent_id  ON agent_tools  (agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_skills_last_seen ON agent_skills (last_seen_at);
CREATE INDEX IF NOT EXISTS idx_agent_tools_last_seen  ON agent_tools  (last_seen_at);
