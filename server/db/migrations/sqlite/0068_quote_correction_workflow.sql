CREATE TABLE quote_correction_proposals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('quote', 'attribution', 'source')),
  target_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  previous_proposal_id INTEGER,
  payload TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  proposed_by INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  applied_at DATETIME,
  application_id TEXT
);
CREATE INDEX idx_quote_correction_proposals_quote ON quote_correction_proposals(quote_id);
CREATE TRIGGER quote_correction_proposals_immutable
BEFORE UPDATE ON quote_correction_proposals
WHEN OLD.quote_id != NEW.quote_id OR OLD.target_type != NEW.target_type OR OLD.target_id != NEW.target_id
  OR OLD.version != NEW.version OR OLD.previous_proposal_id IS NOT NEW.previous_proposal_id
  OR OLD.payload != NEW.payload OR OLD.fingerprint != NEW.fingerprint OR OLD.proposed_by IS NOT NEW.proposed_by
  OR OLD.created_at != NEW.created_at OR (OLD.applied_at IS NOT NULL AND OLD.applied_at IS NOT NEW.applied_at)
  OR (OLD.application_id IS NOT NULL AND OLD.application_id IS NOT NEW.application_id)
  OR (OLD.applied_at IS NULL AND NEW.applied_at IS NULL AND NEW.application_id IS NOT NULL)
  OR (NEW.applied_at IS NOT NULL AND NEW.application_id IS NULL)
BEGIN SELECT RAISE(ABORT, 'Quote correction proposals are immutable'); END;
CREATE TRIGGER quote_correction_proposals_no_delete
BEFORE DELETE ON quote_correction_proposals
BEGIN SELECT RAISE(ABORT, 'Quote correction proposals cannot be deleted'); END;

CREATE TABLE quote_correction_decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_id INTEGER NOT NULL,
  fingerprint TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
  decided_by INTEGER NOT NULL,
  decided_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  reason TEXT
);
CREATE INDEX idx_quote_correction_decisions_proposal ON quote_correction_decisions(proposal_id);
CREATE TRIGGER quote_correction_decisions_guard_insert
BEFORE INSERT ON quote_correction_decisions
WHEN NOT EXISTS (
  SELECT 1 FROM quote_correction_proposals p
  WHERE p.id = NEW.proposal_id AND p.fingerprint = NEW.fingerprint AND p.applied_at IS NULL
) OR EXISTS (
  SELECT 1 FROM quote_correction_decisions d WHERE d.proposal_id = NEW.proposal_id AND d.decision = 'rejected'
) OR EXISTS (
  SELECT 1 FROM quote_correction_decisions d WHERE d.proposal_id = NEW.proposal_id AND d.decision = 'approved' AND d.expires_at > unixepoch()
) OR (NEW.decision = 'approved' AND (NEW.expires_at IS NULL OR NEW.expires_at <= unixepoch()))
OR (NEW.decision = 'approved' AND EXISTS (SELECT 1 FROM quote_correction_proposals p WHERE p.id = NEW.proposal_id AND p.proposed_by = NEW.decided_by))
BEGIN SELECT RAISE(ABORT, 'Quote correction decision is no longer valid'); END;
CREATE TRIGGER quote_correction_decisions_no_update
BEFORE UPDATE ON quote_correction_decisions
BEGIN SELECT RAISE(ABORT, 'Quote correction decisions are immutable'); END;
CREATE TRIGGER quote_correction_decisions_no_delete
BEFORE DELETE ON quote_correction_decisions
BEGIN SELECT RAISE(ABORT, 'Quote correction decisions cannot be deleted'); END;
CREATE TRIGGER quote_correction_proposals_apply_guard
BEFORE UPDATE OF applied_at ON quote_correction_proposals
WHEN OLD.applied_at IS NULL AND NEW.applied_at IS NOT NULL
BEGIN
  SELECT CASE WHEN NEW.application_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM quote_correction_decisions d
    WHERE d.proposal_id = NEW.id AND d.fingerprint = NEW.fingerprint
      AND d.decision = 'approved' AND d.expires_at > unixepoch()
  ) OR EXISTS (
    SELECT 1 FROM quote_correction_decisions d WHERE d.proposal_id = NEW.id AND d.decision = 'rejected'
  ) THEN RAISE(ABORT, 'A current approval without rejection is required') END;
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM quote_editorial_audit_events e
    WHERE e.action = 'update' AND e.target_type = NEW.target_type
      AND e.target_id = CAST(NEW.target_id AS TEXT) AND e.request_id = NEW.application_id
  ) THEN RAISE(ABORT, 'Correction mutation audit record is missing') END;
  SELECT CASE WHEN NEW.target_type = 'quote' AND NOT EXISTS (
    SELECT 1 FROM quotes q WHERE q.id = NEW.target_id AND datetime(q.updated_at, 'auto') = datetime(NEW.applied_at, 'unixepoch')
      AND (json_type(NEW.payload, '$.changes.name') IS NULL OR q.name IS json_extract(NEW.payload, '$.changes.name.after'))
      AND (json_type(NEW.payload, '$.changes.language') IS NULL OR q.language IS json_extract(NEW.payload, '$.changes.language.after'))
  ) THEN RAISE(ABORT, 'Quote correction mutation was not applied') END;
  SELECT CASE WHEN NEW.target_type = 'attribution' AND NOT EXISTS (
    SELECT 1 FROM quote_attributions a WHERE a.id = NEW.target_id AND a.quote_id = NEW.quote_id AND datetime(a.updated_at, 'auto') = datetime(NEW.applied_at, 'unixepoch')
      AND (json_type(NEW.payload, '$.changes.author_id') IS NULL OR a.author_id IS json_extract(NEW.payload, '$.changes.author_id.after'))
      AND (json_type(NEW.payload, '$.changes.reference_id') IS NULL OR a.reference_id IS json_extract(NEW.payload, '$.changes.reference_id.after'))
      AND (json_type(NEW.payload, '$.changes.notes') IS NULL OR a.notes IS json_extract(NEW.payload, '$.changes.notes.after'))
  ) THEN RAISE(ABORT, 'Attribution correction mutation was not applied') END;
  SELECT CASE WHEN NEW.target_type = 'source' AND NOT EXISTS (
    SELECT 1 FROM quote_sources s WHERE s.id = NEW.target_id AND s.quote_id = NEW.quote_id AND datetime(s.updated_at, 'auto') = datetime(NEW.applied_at, 'unixepoch')
      AND (json_type(NEW.payload, '$.changes.source_type') IS NULL OR s.source_type IS json_extract(NEW.payload, '$.changes.source_type.after'))
      AND (json_type(NEW.payload, '$.changes.source_medium') IS NULL OR s.source_medium IS json_extract(NEW.payload, '$.changes.source_medium.after'))
      AND (json_type(NEW.payload, '$.changes.source_url') IS NULL OR s.source_url IS json_extract(NEW.payload, '$.changes.source_url.after'))
      AND (json_type(NEW.payload, '$.changes.label') IS NULL OR s.label IS json_extract(NEW.payload, '$.changes.label.after'))
      AND (json_type(NEW.payload, '$.changes.locator_type') IS NULL OR s.locator_type IS json_extract(NEW.payload, '$.changes.locator_type.after'))
      AND (json_type(NEW.payload, '$.changes.locator_value') IS NULL OR s.locator_value IS json_extract(NEW.payload, '$.changes.locator_value.after'))
      AND (json_type(NEW.payload, '$.changes.translator_name') IS NULL OR s.translator_name IS json_extract(NEW.payload, '$.changes.translator_name.after'))
      AND (json_type(NEW.payload, '$.changes.notes') IS NULL OR s.notes IS json_extract(NEW.payload, '$.changes.notes.after'))
  ) THEN RAISE(ABORT, 'Source correction mutation was not applied') END;
END;

CREATE TABLE quote_correction_apply_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_id INTEGER,
  fingerprint TEXT,
  actor_user_id INTEGER,
  api_key_id INTEGER,
  application_id TEXT,
  request_id TEXT,
  outcome TEXT NOT NULL,
  reason TEXT,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_quote_correction_attempts_proposal ON quote_correction_apply_attempts(proposal_id);
CREATE TRIGGER quote_correction_apply_attempts_guard_applied
BEFORE INSERT ON quote_correction_apply_attempts
WHEN NEW.outcome = 'applied' AND NOT EXISTS (
  SELECT 1 FROM quote_correction_proposals p
WHERE p.id = NEW.proposal_id AND p.fingerprint = NEW.fingerprint AND p.applied_at IS NOT NULL AND p.application_id = NEW.application_id
)
BEGIN SELECT RAISE(ABORT, 'Applied result requires an applied proposal'); END;
CREATE TRIGGER quote_correction_attempts_no_update
BEFORE UPDATE ON quote_correction_apply_attempts
BEGIN SELECT RAISE(ABORT, 'Quote correction apply attempts are immutable'); END;
CREATE TRIGGER quote_correction_attempts_no_delete
BEFORE DELETE ON quote_correction_apply_attempts
BEGIN SELECT RAISE(ABORT, 'Quote correction apply attempts cannot be deleted'); END;
