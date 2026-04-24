-- Migration 008: Formalize org_invites table
--
-- In v0.2.1 the org_invites table was created lazily via DDL inside the route
-- handler (CREATE TABLE IF NOT EXISTS). This migration makes it a proper
-- first-class schema object with indexes, RLS, and FK tracking of who accepted.
--
-- The CREATE TABLE IF NOT EXISTS in the route handler will become a no-op once
-- this migration has run, so both code paths remain safe.
--
-- Design decisions:
--   · invited_by is nullable for legacy rows created before this migration.
--   · accepted_by is the user_id of the person who accepted the invite.
--     It is set atomically when POST /invites/accept is called.
--   · A token can only be accepted once (accepted_at IS NULL guard in API).
--   · Invites are scoped to an org; CASCADE DELETE keeps the table clean.

CREATE TABLE IF NOT EXISTS org_invites (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token           TEXT        NOT NULL UNIQUE,
  role            TEXT        NOT NULL DEFAULT 'member'
                                CHECK (role IN ('viewer', 'member', 'admin')),
  invited_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
  accepted_by     UUID        REFERENCES users(id) ON DELETE SET NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

-- Primary lookup: validate a token on the accept page
CREATE INDEX IF NOT EXISTS idx_org_invites_token
  ON org_invites (token);

-- Lookup: list all pending invites for an org (admin panel use)
CREATE INDEX IF NOT EXISTS idx_org_invites_org_id
  ON org_invites (org_id)
  WHERE accepted_at IS NULL;

-- ── Row-Level Security ────────────────────────────────────────────────────────
-- Org admins can see invites they created; the accept endpoint uses a
-- service-role or unauthed lookup (token is the secret).

ALTER TABLE org_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_invites_select ON org_invites
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );

-- ── Backfill: migrate rows created by the v0.2.1 lazy DDL ────────────────────
-- If the table was created in a running instance, the rows already exist.
-- This migration adds columns that the lazy-created table doesn't have.
-- The ALTER TABLE ... ADD COLUMN IF NOT EXISTS handles both cases safely.

ALTER TABLE org_invites
  ADD COLUMN IF NOT EXISTS invited_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accepted_by UUID REFERENCES users(id) ON DELETE SET NULL;
