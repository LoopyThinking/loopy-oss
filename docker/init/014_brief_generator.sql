-- Migration 014: Generador de Informes Opinados (Brief Generator)
--
-- Adds support for generating opinionated PDF briefs from loops:
--   1. Bimodal IPL: ipl_projected_minutes on loops (alongside existing ipl_minutes).
--   2. Sponsor attestations: declared inputs for hypothesis-mode briefs.
--   3. Brief generation telemetry: audit trail of every generation.
--   4. Cognitive layer + owner/sponsor designation on loops.
--
-- Design decisions:
--   · ipl_minutes = IPL Realizado (measured from agent signals).
--   · ipl_projected_minutes = IPL Proyectado (calculated from sponsor attestation).
--   · One attestation per loop (UNIQUE constraint), regenerable via update.
--   · brief_generations is append-only telemetry, no user-facing history UI yet.

-- ── loops: new fields ─────────────────────────────────────────────────────────

ALTER TABLE loops
  ADD COLUMN IF NOT EXISTS ipl_projected_minutes INTEGER NOT NULL DEFAULT 0
    CHECK (ipl_projected_minutes >= 0);

ALTER TABLE loops
  ADD COLUMN IF NOT EXISTS cognitive_layer TEXT
    CHECK (cognitive_layer IS NULL OR cognitive_layer IN (
      'perception', 'interpretation', 'decision', 'action', 'reflection'
    ));

-- owner_id and sponsor_id extend the loop's organizational context.
-- user_id remains the loop creator; owner_id is the designated process owner.
ALTER TABLE loops
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id);

ALTER TABLE loops
  ADD COLUMN IF NOT EXISTS sponsor_id UUID REFERENCES users(id);

-- ── sponsor_attestations ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sponsor_attestations (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  loop_id               UUID        NOT NULL REFERENCES loops(id) ON DELETE CASCADE,
  sponsor_id            UUID        NOT NULL REFERENCES users(id),
  frequency_per_month   INTEGER     NOT NULL CHECK (frequency_per_month > 0),
  avg_duration_minutes  INTEGER     NOT NULL CHECK (avg_duration_minutes > 0),
  people_count          INTEGER     NOT NULL CHECK (people_count > 0),
  adoption_rate_pct     INTEGER     NOT NULL CHECK (adoption_rate_pct BETWEEN 1 AND 100),
  critical_assumptions  JSONB       NOT NULL DEFAULT '[]',
  comment               TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_attestation_loop UNIQUE (loop_id)
);

CREATE INDEX IF NOT EXISTS idx_attestations_loop
  ON sponsor_attestations (loop_id);

CREATE INDEX IF NOT EXISTS idx_attestations_sponsor
  ON sponsor_attestations (sponsor_id);

-- ── brief_generations (telemetry) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS brief_generations (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  loop_id       UUID        NOT NULL REFERENCES loops(id) ON DELETE CASCADE,
  generated_by  UUID        NOT NULL REFERENCES users(id),
  template_id   TEXT        NOT NULL CHECK (template_id IN ('project_brief', 'endoso_jefatura')),
  mode          TEXT        NOT NULL CHECK (mode IN ('validated', 'hypothesis')),
  context_text  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brief_generations_loop
  ON brief_generations (loop_id);

CREATE INDEX IF NOT EXISTS idx_brief_generations_user
  ON brief_generations (generated_by);

CREATE INDEX IF NOT EXISTS idx_brief_generations_created
  ON brief_generations (created_at DESC);
