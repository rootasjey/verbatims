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
  applied_at DATETIME
);
CREATE INDEX idx_quote_correction_proposals_quote ON quote_correction_proposals(quote_id);
CREATE TRIGGER quote_correction_proposals_immutable
BEFORE UPDATE ON quote_correction_proposals
WHEN OLD.quote_id != NEW.quote_id OR OLD.target_type != NEW.target_type OR OLD.target_id != NEW.target_id
  OR OLD.version != NEW.version OR OLD.previous_proposal_id IS NOT NEW.previous_proposal_id
  OR OLD.payload != NEW.payload OR OLD.fingerprint != NEW.fingerprint OR OLD.proposed_by IS NOT NEW.proposed_by
  OR OLD.created_at != NEW.created_at OR (OLD.applied_at IS NOT NULL AND OLD.applied_at IS NOT NEW.applied_at)
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
CREATE TRIGGER quote_correction_decisions_no_update
BEFORE UPDATE ON quote_correction_decisions
BEGIN SELECT RAISE(ABORT, 'Quote correction decisions are immutable'); END;
CREATE TRIGGER quote_correction_decisions_no_delete
BEFORE DELETE ON quote_correction_decisions
BEGIN SELECT RAISE(ABORT, 'Quote correction decisions cannot be deleted'); END;

CREATE TABLE quote_correction_apply_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_id INTEGER,
  fingerprint TEXT,
  actor_user_id INTEGER,
  api_key_id INTEGER,
  request_id TEXT,
  outcome TEXT NOT NULL,
  reason TEXT,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_quote_correction_attempts_proposal ON quote_correction_apply_attempts(proposal_id);
CREATE TRIGGER quote_correction_attempts_no_update
BEFORE UPDATE ON quote_correction_apply_attempts
BEGIN SELECT RAISE(ABORT, 'Quote correction apply attempts are immutable'); END;
CREATE TRIGGER quote_correction_attempts_no_delete
BEFORE DELETE ON quote_correction_apply_attempts
BEGIN SELECT RAISE(ABORT, 'Quote correction apply attempts cannot be deleted'); END;
