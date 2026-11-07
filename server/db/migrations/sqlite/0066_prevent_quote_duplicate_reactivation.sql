CREATE TRIGGER quotes_prevent_duplicate_reactivation
BEFORE UPDATE OF status ON quotes
WHEN OLD.status = 'rejected' AND NEW.status <> 'rejected'
  AND EXISTS (
    SELECT 1 FROM quotes
    WHERE id <> NEW.id
      AND status <> 'rejected'
      AND lower(trim(name)) = lower(trim(NEW.name))
  )
BEGIN
  SELECT RAISE(ABORT, 'Active quote text already exists');
END;
