ALTER TABLE themes ADD COLUMN home_is_active INTEGER NOT NULL DEFAULT 0;

UPDATE themes
SET home_is_active = COALESCE(is_active, 0);

CREATE INDEX idx_themes_home_active ON themes(home_is_active);

CREATE TRIGGER themes_sync_home_is_active_after_insert
AFTER INSERT ON themes
WHEN NEW.home_is_active != COALESCE(NEW.is_active, 0)
BEGIN
  UPDATE themes SET home_is_active = COALESCE(NEW.is_active, 0) WHERE id = NEW.id;
END;

CREATE TRIGGER themes_sync_home_is_active_after_legacy_update
AFTER UPDATE OF is_active ON themes
WHEN COALESCE(NEW.is_active, 0) != COALESCE(OLD.is_active, 0)
  AND NEW.home_is_active != COALESCE(NEW.is_active, 0)
BEGIN
  UPDATE themes SET home_is_active = COALESCE(NEW.is_active, 0) WHERE id = NEW.id;
END;

CREATE TRIGGER themes_sync_legacy_is_active_after_home_update
AFTER UPDATE OF home_is_active ON themes
WHEN NEW.home_is_active != OLD.home_is_active
  AND COALESCE(NEW.is_active, 0) != NEW.home_is_active
BEGIN
  UPDATE themes SET is_active = NEW.home_is_active WHERE id = NEW.id;
END;
