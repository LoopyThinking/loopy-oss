-- Migration 001: Create loops table
-- Loops are the core unit of work in the Loopy protocol.
-- Each loop tracks a hypothesis toward a decision or outcome.

CREATE TABLE IF NOT EXISTS loops (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL,
  title            TEXT        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 255),
  hypothesis       TEXT,
  status           TEXT        NOT NULL DEFAULT 'open'
                               CHECK (status IN ('open', 'closed', 'blocked')),
  scope            TEXT        NOT NULL DEFAULT 'personal'
                               CHECK (scope IN ('personal', 'team', 'organizational')),
  confidence_index INTEGER     NOT NULL DEFAULT 0
                               CHECK (confidence_index BETWEEN 0 AND 100),
  resolution       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at        TIMESTAMPTZ
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER loops_set_updated_at
  BEFORE UPDATE ON loops
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enforce: closed loops must have a closed_at timestamp
ALTER TABLE loops
  ADD CONSTRAINT loops_closed_at_required
  CHECK (
    (status = 'closed' AND closed_at IS NOT NULL)
    OR status != 'closed'
  );
