-- Migration 009: v0.4.0 workflow revision
-- Adds revoked_at to org_invites and a convenience view for team loop browsing.

-- (a) Revocation column — lets admins revoke invite links without hard-deleting them.
--     Revoked invites remain auditable; the public GET /invites/:token returns 410 Gone.
ALTER TABLE org_invites
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

-- Index for fast "pending invites" queries (not yet accepted, not revoked)
CREATE INDEX IF NOT EXISTS idx_org_invites_pending
  ON org_invites (org_id)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

-- (b) Convenience view for admin team-loop browsing.
--     Centralises the auth predicate and avoids repeating the JOIN in every query.
CREATE OR REPLACE VIEW v_team_loops AS
SELECT
  l.*,
  u.display_name AS owner_name,
  u.email        AS owner_email
FROM loops l
LEFT JOIN users u ON u.id = l.user_id;
