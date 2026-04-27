-- Migration 002: Create work_signals table
-- Work signals are discrete units of activity emitted into a loop.
-- They map to one of five cognitive layers: perception, interpretation,
-- decision, action, or reflection.

CREATE TABLE IF NOT EXISTS work_signals (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  loop_id    UUID        NOT NULL REFERENCES loops(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL,
  type       TEXT        NOT NULL
             CHECK (type IN ('perception', 'interpretation', 'decision', 'action', 'reflection')),
  content    TEXT        NOT NULL CHECK (char_length(content) >= 1),
  source     TEXT        NOT NULL DEFAULT 'human'
             CHECK (source IN ('human', 'agent')),
  metadata   JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Signals cannot be emitted into a closed loop
CREATE OR REPLACE FUNCTION check_loop_open_for_signal()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT status FROM loops WHERE id = NEW.loop_id) = 'closed' THEN
    RAISE EXCEPTION 'Cannot emit a signal into a closed loop (loop_id: %)', NEW.loop_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER work_signals_check_loop_open
  BEFORE INSERT ON work_signals
  FOR EACH ROW EXECUTE FUNCTION check_loop_open_for_signal();
