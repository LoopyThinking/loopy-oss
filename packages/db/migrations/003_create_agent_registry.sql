-- Migration 003: Create agent_registry table
-- Registered agents receive a Bearer token to emit signals via the API.
-- Tokens are stored as SHA-256 hashes — never in plain text.

CREATE TABLE IF NOT EXISTS agent_registry (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL,
  agent_name   TEXT        NOT NULL CHECK (char_length(agent_name) BETWEEN 1 AND 100),
  token_hash   TEXT        NOT NULL UNIQUE,
  description  TEXT,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ,

  -- One user cannot register two agents with the same name
  CONSTRAINT agent_registry_unique_name_per_user UNIQUE (user_id, agent_name)
);

-- Soft-deactivate instead of deleting so we preserve audit history
-- Use UPDATE SET is_active = false rather than DELETE.
