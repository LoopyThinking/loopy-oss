-- Self-hosted init: agent_registry table

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
