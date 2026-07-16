DROP INDEX IF EXISTS idx_themes_scheduled;
ALTER TABLE themes DROP COLUMN scheduled_date;
