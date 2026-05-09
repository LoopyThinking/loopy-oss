-- v0.7.0: email invites + onboarding wizard + delete loops + skills/tools deactivation
-- All changes are additive and idempotent (IF NOT EXISTS).
-- Artefactos (Block F) does not require DB changes.

-- Block A: email address on invites (audit trail)
ALTER TABLE org_invites ADD COLUMN IF NOT EXISTS invited_email TEXT;
ALTER TABLE org_invites ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- Block B: onboarding status per user
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_users_onboarded_at
  ON users (onboarded_at)
  WHERE onboarded_at IS NULL;

-- Block C: soft-delete for loops
ALTER TABLE loops ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_loops_deleted_at
  ON loops (deleted_at)
  WHERE deleted_at IS NULL;

-- Block D: deactivation timestamp for skills and tools
ALTER TABLE agent_skills ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;
ALTER TABLE agent_tools  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;
