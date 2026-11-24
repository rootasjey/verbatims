DROP TRIGGER IF EXISTS quote_correction_apply_attempts_guard_applied;
CREATE TRIGGER quote_correction_apply_attempts_guard_applied
BEFORE INSERT ON quote_correction_apply_attempts
WHEN NEW.outcome IN ('applied', 'applied_unverified', 'verified', 'verification_failed') AND NOT EXISTS (
  SELECT 1 FROM quote_correction_proposals p
  WHERE p.id = NEW.proposal_id AND p.fingerprint = NEW.fingerprint
    AND p.applied_at IS NOT NULL AND p.application_id = NEW.application_id
)
BEGIN SELECT RAISE(ABORT, 'Applied result requires an applied proposal'); END;

CREATE TRIGGER quote_correction_proposals_version_guard
BEFORE INSERT ON quote_correction_proposals
WHEN (
  NEW.previous_proposal_id IS NULL AND (
    NEW.version != 1 OR EXISTS (
      SELECT 1 FROM quote_correction_proposals p
      WHERE p.quote_id = NEW.quote_id AND p.target_type = NEW.target_type AND p.target_id = NEW.target_id
    )
  )
) OR (
  NEW.previous_proposal_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM quote_correction_proposals previous
    WHERE previous.id = NEW.previous_proposal_id
      AND previous.quote_id = NEW.quote_id
      AND previous.target_type = NEW.target_type
      AND previous.target_id = NEW.target_id
      AND NEW.version = previous.version + 1
      AND previous.id = (
        SELECT latest.id FROM quote_correction_proposals latest
        WHERE latest.quote_id = NEW.quote_id AND latest.target_type = NEW.target_type AND latest.target_id = NEW.target_id
        ORDER BY latest.version DESC, latest.id DESC LIMIT 1
      )
  )
)
BEGIN SELECT RAISE(ABORT, 'Quote correction version chain is no longer current'); END;
