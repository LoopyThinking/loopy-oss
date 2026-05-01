-- Migration 012: Create agent_catalog table
-- Rich registry for organizational visibility of the AI ecosystem.
-- Separates catalog metadata from auth tokens (agent_registry handles auth).
--
-- Types: agent | skill | tool | workflow
-- Hierarchy: parent_key creates a reports-to chain (agent → skills/tools)
-- Payload format is compatible with loopy-bridge cloud for cross-platform sync.

CREATE TABLE IF NOT EXISTS agent_catalog (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  registered_by UUID        NOT NULL REFERENCES users(id),

  -- Identity
  agent_key     TEXT        NOT NULL,  -- "claude:cowork-main", "skill:xlsx", "mcp:gmail"
  type          TEXT        NOT NULL CHECK (type IN ('agent','skill','tool','workflow')),
  name          TEXT        NOT NULL,
  role          TEXT,
  emoji         TEXT,

  -- Hierarchy
  parent_key    TEXT,                  -- agent_key of the parent (reports_to)

  -- Rich metadata
  responsibilities        TEXT[],
  technical_specialization TEXT[],
  vibe                    TEXT,
  strategic_priorities    TEXT[],
  team_contacts           TEXT[],

  -- Status
  status        TEXT        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active','inactive','deprecated')),

  -- Timestamps
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ,           -- heartbeat: last time this was registered

  -- One agent_key is unique per organization
  UNIQUE (org_id, agent_key)
);

CREATE INDEX idx_agent_catalog_org    ON agent_catalog(org_id);
CREATE INDEX idx_agent_catalog_type   ON agent_catalog(org_id, type);
CREATE INDEX idx_agent_catalog_parent ON agent_catalog(org_id, parent_key);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_agent_catalog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_agent_catalog_updated_at
  BEFORE UPDATE ON agent_catalog
  FOR EACH ROW EXECUTE FUNCTION update_agent_catalog_updated_at();
