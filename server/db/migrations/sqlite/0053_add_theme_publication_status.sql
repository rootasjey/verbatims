ALTER TABLE themes ADD COLUMN publication_status TEXT NOT NULL DEFAULT 'draft'
  CHECK (publication_status IN ('draft', 'published'));

ALTER TABLE themes ADD COLUMN social_is_active INTEGER NOT NULL DEFAULT 0;

UPDATE themes
SET publication_status = 'published',
    social_is_active = COALESCE(is_active, 0);

CREATE INDEX idx_themes_publication_status ON themes(publication_status);
