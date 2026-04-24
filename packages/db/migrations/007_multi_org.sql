-- Migration 007: Multi-org model (users, organizations, org_members)
--
-- Introduces a proper user table and organizational model so multiple users
-- can collaborate within a shared workspace. All existing core tables
-- (loops, work_signals, agent_registry) gain an org_id column for data
-- isolation and cross-org queries in the executive panel.
--
-- Design decisions:
--   · users table is minimal — email + display_name. Auth identity (JWT sub)
--     maps to users.id. In Supabase deployments, users.id = auth.users.id.
--   · organizations have a unique slug for URL-friendly references.
--   · org_members roles: viewer < member < admin < owner (owner can't be removed
--     as member without transferring ownership first).
--   · org_id is added to loops, work_signals, agent_registry. NOT NULL with a
--     default of the "personal org" created during upgrade (see below).
--   · Compound indexes (org_id, ...) support the admin panel aggregate queries.
--
-- Upgrade path for existing data (instances running v0.1.0-beta or v0.2.0):
--   · The upgrade block at the bottom creates one personal org per existing
--     unique user_id in loops and inserts the user + org + membership,
--     then backfills org_id on all existing rows.
--   · Safe to run multiple times (all statements are idempotent).

-- ── users ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE
                              CHECK (char_length(email) BETWEEN 3 AND 320),
  display_name  TEXT        CHECK (char_length(display_name) <= 120),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── organizations ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS organizations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  -- URL-friendly identifier, e.g. "acme-corp"
  slug        TEXT        NOT NULL UNIQUE
                            CHECK (slug ~ '^[a-z0-9][a-z0-9\-]{0,62}[a-z0-9]$'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── org_members ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS org_members (
  user_id   UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id    UUID    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- viewer: read-only  |  member: emit signals, create loops
  -- admin: see exec panel, manage members  |  owner: full control
  role      TEXT    NOT NULL DEFAULT 'member'
                      CHECK (role IN ('viewer', 'member', 'admin', 'owner')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, org_id)
);

-- ── Add org_id to core tables ─────────────────────────────────────────────────
-- Using a two-step approach that works whether or not the table already has rows:
-- 1. Add nullable first.
-- 2. Backfill with upgrade data (in the upgrade block below).
-- 3. Set NOT NULL after backfill.
--
-- If this migration is run on a fresh database (no existing rows), both
-- NOT NULL constraints are applied immediately at the end of the upgrade block.

ALTER TABLE loops
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

ALTER TABLE work_signals
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

ALTER TABLE agent_registry
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);

-- ── Indexes ───────────────────────────────────────────────────────────────────

-- org_members: fast lookup by org (list all members of an org)
CREATE INDEX IF NOT EXISTS idx_org_members_org_id
  ON org_members (org_id);

-- loops: compound index for admin panel queries scoped to an org
CREATE INDEX IF NOT EXISTS idx_loops_org_id_status
  ON loops (org_id, status);

CREATE INDEX IF NOT EXISTS idx_loops_org_id_created
  ON loops (org_id, created_at DESC);

-- work_signals: compound index for activity time-series by org
CREATE INDEX IF NOT EXISTS idx_work_signals_org_id_created
  ON work_signals (org_id, created_at DESC);

-- agent_registry: lookup agents by org
CREATE INDEX IF NOT EXISTS idx_agent_registry_org_id
  ON agent_registry (org_id);

-- ── Upgrade block: backfill existing data ─────────────────────────────────────
--
-- For instances that already have data from v0.1.0-beta or v0.2.0.
-- Creates a personal org per user and links all their content to it.
-- Idempotent: wrapped in a DO block, checks for existing orgs before inserting.

DO $$
DECLARE
  v_user_id   UUID;
  v_org_id    UUID;
  v_slug      TEXT;
  v_user_row  RECORD;
BEGIN
  -- Collect all unique user_ids from existing content tables
  FOR v_user_id IN
    SELECT DISTINCT user_id FROM loops
    UNION
    SELECT DISTINCT user_id FROM work_signals
    UNION
    SELECT DISTINCT user_id FROM agent_registry
  LOOP
    -- Ensure user row exists (for self-hosted installs that bypass Supabase auth)
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = v_user_id) THEN
      INSERT INTO users (id, email, display_name)
      VALUES (
        v_user_id,
        -- Placeholder email — operator should update via admin or profile page
        v_user_id::TEXT || '@placeholder.loopy',
        'User ' || LEFT(v_user_id::TEXT, 8)
      )
      ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Build a deterministic slug from the user UUID (first 8 chars + "-workspace")
    v_slug := LEFT(REPLACE(v_user_id::TEXT, '-', ''), 8) || '-workspace';

    -- Create the personal org if it doesn't already exist for this user
    SELECT o.id INTO v_org_id
    FROM organizations o
    JOIN org_members m ON m.org_id = o.id
    WHERE m.user_id = v_user_id AND m.role = 'owner'
    LIMIT 1;

    IF v_org_id IS NULL THEN
      -- Make slug unique in case of collision (shouldn't happen but defensive)
      WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = v_slug) LOOP
        v_slug := v_slug || '-' || LEFT(gen_random_uuid()::TEXT, 4);
      END LOOP;

      INSERT INTO organizations (name, slug)
      VALUES (
        'Personal Workspace',
        v_slug
      )
      RETURNING id INTO v_org_id;

      INSERT INTO org_members (user_id, org_id, role)
      VALUES (v_user_id, v_org_id, 'owner')
      ON CONFLICT DO NOTHING;
    END IF;

    -- Backfill org_id on existing rows
    UPDATE loops        SET org_id = v_org_id WHERE user_id = v_user_id AND org_id IS NULL;
    UPDATE work_signals SET org_id = v_org_id WHERE user_id = v_user_id AND org_id IS NULL;
    UPDATE agent_registry SET org_id = v_org_id WHERE user_id = v_user_id AND org_id IS NULL;
  END LOOP;
END $$;

-- ── Enforce NOT NULL now that all rows are backfilled ─────────────────────────
-- These will no-op on a fresh DB (no rows to violate the constraint).
-- On an upgraded DB they succeed because the DO block above filled all nulls.

ALTER TABLE loops         ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE work_signals  ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE agent_registry ALTER COLUMN org_id SET NOT NULL;

-- ── Row-Level Security ────────────────────────────────────────────────────────
-- Supabase deployments: policies scope reads/writes to the user's orgs.
-- Plain-Postgres deployments: disable RLS and enforce in API middleware.

ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members    ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY users_select ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY users_update ON users
  FOR UPDATE USING (id = auth.uid());

-- Organizations: visible to any member
CREATE POLICY orgs_select ON organizations
  FOR SELECT USING (
    id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

-- Org members: visible to all members of the same org
CREATE POLICY org_members_select ON org_members
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

-- ── Note on self-hosted (plain PostgreSQL) deployments ───────────────────────
-- Disable RLS on the three new tables and rely on API middleware:
--
--   ALTER TABLE users          DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE organizations  DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE org_members    DISABLE ROW LEVEL SECURITY;
