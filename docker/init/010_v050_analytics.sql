-- Migration 010: v0.5.0 analytics
-- Adds analytics data layer, LLM provider config (BYOK), analysis templates,
-- run history, scheduled digests, and supporting columns/triggers.
--
-- All changes are additive — no breaking changes.

-- (a) Org tariff for ROI calculation
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS hourly_rate_usd NUMERIC(10,2) DEFAULT 50.00;

-- (b) Helper column on loops for stuck-loop detection
ALTER TABLE loops
  ADD COLUMN IF NOT EXISTS last_signal_at TIMESTAMPTZ;

UPDATE loops l SET last_signal_at = (
  SELECT MAX(ws.created_at) FROM work_signals ws WHERE ws.loop_id = l.id
);

CREATE OR REPLACE FUNCTION update_loop_last_signal_at() RETURNS trigger AS $$
BEGIN
  UPDATE loops SET last_signal_at = NEW.created_at WHERE id = NEW.loop_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_loop_last_signal ON work_signals;
CREATE TRIGGER trg_update_loop_last_signal
  AFTER INSERT ON work_signals
  FOR EACH ROW EXECUTE FUNCTION update_loop_last_signal_at();

-- (b2) Add agent_id to work_signals for agent-to-signal attribution
ALTER TABLE work_signals
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agent_registry(id);

CREATE INDEX IF NOT EXISTS idx_work_signals_agent_id
  ON work_signals (agent_id);

-- (c) LLM provider configs (BYOK)
CREATE TABLE IF NOT EXISTS org_llm_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL CHECK (provider IN ('anthropic','openai','google','openai_compatible','deepseek')),
  display_name    TEXT NOT NULL,
  model           TEXT NOT NULL,
  base_url        TEXT,
  api_key_cipher  TEXT NOT NULL,
  api_key_last4   TEXT NOT NULL,
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_tested_at  TIMESTAMPTZ,
  last_test_ok    BOOLEAN,
  last_test_error TEXT,
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_org_llm_default
  ON org_llm_configs (org_id) WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_org_llm_active
  ON org_llm_configs (org_id) WHERE is_active = TRUE;

-- (d) Analysis template prompt overrides (org-level)
CREATE TABLE IF NOT EXISTS analysis_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_key  TEXT NOT NULL,
  prompt        TEXT NOT NULL,
  updated_by    UUID NOT NULL REFERENCES users(id),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, template_key)
);

-- (e) Analysis run history
CREATE TABLE IF NOT EXISTS analyses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_key    TEXT NOT NULL,
  period_label    TEXT NOT NULL,
  prompt_used     TEXT NOT NULL,
  data_inputs     JSONB NOT NULL,
  llm_config_id   UUID REFERENCES org_llm_configs(id),
  llm_provider    TEXT,
  llm_model       TEXT,
  result          JSONB,
  status          TEXT NOT NULL CHECK (status IN ('pending','running','succeeded','failed')),
  error           TEXT,
  scheduled       BOOLEAN NOT NULL DEFAULT FALSE,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_analyses_org_recent
  ON analyses (org_id, created_at DESC);

-- (f) Scheduled analysis configs
CREATE TABLE IF NOT EXISTS analysis_schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_key    TEXT NOT NULL,
  period          TEXT NOT NULL,
  cadence         TEXT NOT NULL CHECK (cadence IN ('weekly','monthly')),
  day_of_week     SMALLINT,
  hour            SMALLINT NOT NULL DEFAULT 8,
  timezone        TEXT NOT NULL DEFAULT 'UTC',
  llm_config_id   UUID REFERENCES org_llm_configs(id),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at     TIMESTAMPTZ,
  next_run_at     TIMESTAMPTZ NOT NULL,
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedules_due
  ON analysis_schedules (next_run_at) WHERE is_active = TRUE;

-- (g) Analytics views

-- IPL summary per org per month
CREATE OR REPLACE VIEW v_analytics_ipl_monthly AS
SELECT
  l.org_id,
  date_trunc('month', l.created_at)::date AS month,
  COUNT(*) FILTER (WHERE l.status = 'closed') AS loops_closed,
  COUNT(*) AS loops_total,
  COALESCE(SUM(l.ipl_minutes), 0) AS ipl_minutes_total,
  COUNT(DISTINCT l.user_id) AS active_users
FROM loops l
GROUP BY l.org_id, date_trunc('month', l.created_at);

-- Adoption: weekly active users + loops per week
CREATE OR REPLACE VIEW v_analytics_adoption_weekly AS
SELECT
  l.org_id,
  date_trunc('week', l.created_at)::date AS week,
  COUNT(DISTINCT l.user_id) AS active_users,
  COUNT(*) AS loops_created
FROM loops l
GROUP BY l.org_id, date_trunc('week', l.created_at);

-- Agent performance: total IPL contribution and signals per agent within an org
CREATE OR REPLACE VIEW v_analytics_agent_performance AS
SELECT
  ar.org_id,
  ar.id AS agent_id,
  ar.agent_name,
  COUNT(DISTINCT ws.loop_id) AS loops_touched,
  COUNT(ws.id) AS signals_total,
  COALESCE(SUM(l.ipl_minutes), 0) AS ipl_minutes_contributed,
  COUNT(DISTINCT l.user_id) AS distinct_users
FROM agent_registry ar
LEFT JOIN work_signals ws ON ws.agent_id = ar.id
LEFT JOIN loops l ON l.id = ws.loop_id
GROUP BY ar.org_id, ar.id, ar.agent_name;

-- Team IPL segmentation: per-user productivity
CREATE OR REPLACE VIEW v_analytics_user_ipl AS
SELECT
  l.org_id,
  l.user_id,
  u.display_name,
  u.email,
  COUNT(*) FILTER (WHERE l.status = 'closed') AS loops_closed,
  COALESCE(SUM(l.ipl_minutes), 0) AS ipl_minutes_total,
  CASE WHEN COUNT(*) FILTER (WHERE l.status = 'closed') > 0
       THEN COALESCE(SUM(l.ipl_minutes), 0) / COUNT(*) FILTER (WHERE l.status = 'closed')
       ELSE 0 END AS avg_ipl_per_loop
FROM loops l
JOIN users u ON u.id = l.user_id
GROUP BY l.org_id, l.user_id, u.display_name, u.email;

-- Stuck loops: open loops with no signals in last 14 days
CREATE OR REPLACE VIEW v_analytics_stuck_loops AS
SELECT
  l.id, l.org_id, l.user_id, l.title, l.status,
  l.created_at, l.last_signal_at,
  EXTRACT(DAY FROM now() - COALESCE(l.last_signal_at, l.created_at))::int AS days_idle
FROM loops l
WHERE l.status = 'open'
  AND COALESCE(l.last_signal_at, l.created_at) < now() - interval '14 days';
