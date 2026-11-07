CREATE TRIGGER quotes_prevent_active_name_conflict
BEFORE UPDATE OF name ON quotes
WHEN NEW.status <> 'rejected'
  AND lower(trim(NEW.name)) <> lower(trim(OLD.name))
  AND EXISTS (
    SELECT 1 FROM quotes
    WHERE id <> NEW.id
      AND status <> 'rejected'
      AND lower(trim(name)) = lower(trim(NEW.name))
  )
BEGIN
  SELECT RAISE(ABORT, 'Active quote text already exists');
END;
