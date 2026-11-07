CREATE TABLE quote_name_claims (
  normalized_name TEXT PRIMARY KEY
);

-- Existing duplicate quotes share one name claim; preserve all quote rows.
INSERT OR IGNORE INTO quote_name_claims (normalized_name)
SELECT lower(trim(name)) FROM quotes WHERE status <> 'rejected';

CREATE TRIGGER quote_name_claims_after_insert AFTER INSERT ON quotes
WHEN NEW.status <> 'rejected'
BEGIN
  INSERT OR IGNORE INTO quote_name_claims (normalized_name)
  VALUES (lower(trim(NEW.name)));
END;

CREATE TRIGGER quote_name_claims_after_update AFTER UPDATE OF name, status ON quotes
BEGIN
  DELETE FROM quote_name_claims
  WHERE normalized_name = lower(trim(OLD.name))
    AND NOT EXISTS (
      SELECT 1 FROM quotes
      WHERE status <> 'rejected' AND lower(trim(name)) = lower(trim(OLD.name))
    );
  INSERT OR IGNORE INTO quote_name_claims (normalized_name)
  SELECT lower(trim(NEW.name)) WHERE NEW.status <> 'rejected';
END;

CREATE TRIGGER quote_name_claims_after_delete AFTER DELETE ON quotes
BEGIN
  DELETE FROM quote_name_claims
  WHERE normalized_name = lower(trim(OLD.name))
    AND NOT EXISTS (
      SELECT 1 FROM quotes
      WHERE status <> 'rejected' AND lower(trim(name)) = lower(trim(OLD.name))
    );
END;
