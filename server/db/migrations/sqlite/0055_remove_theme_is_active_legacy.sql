-- Rebuild themes and every table that references it. Dropping the old parent
-- while its ON DELETE CASCADE dependents still exist would erase their rows.

CREATE TABLE themes_replacement_0055 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  config TEXT DEFAULT '{}',
  is_default INTEGER DEFAULT 0,
  scheduled_start INTEGER,
  scheduled_end INTEGER,
  priority INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  updated_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'la')),
  image_url TEXT,
  image_alt TEXT,
  image_credit TEXT,
  image_source_url TEXT,
  image_license TEXT,
  image_date TEXT,
  image_location TEXT,
  mobile_image_url TEXT,
  mobile_image_alt TEXT,
  mobile_image_credit TEXT,
  mobile_image_source_url TEXT,
  mobile_image_license TEXT,
  mobile_image_date TEXT,
  mobile_image_location TEXT,
  publication_status TEXT NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft', 'published')),
  social_is_active INTEGER NOT NULL DEFAULT 0,
  home_is_active INTEGER NOT NULL DEFAULT 0
);

INSERT INTO themes_replacement_0055 (
  id, slug, name, description, config, is_default, scheduled_start, scheduled_end,
  priority, created_at, updated_at, language, image_url, image_alt, image_credit,
  image_source_url, image_license, image_date, image_location, mobile_image_url,
  mobile_image_alt, mobile_image_credit, mobile_image_source_url,
  mobile_image_license, mobile_image_date, mobile_image_location,
  publication_status, social_is_active, home_is_active
)
SELECT
  id, slug, name, description, config, is_default, scheduled_start, scheduled_end,
  priority, created_at, updated_at, language, image_url, image_alt, image_credit,
  image_source_url, image_license, image_date, image_location, mobile_image_url,
  mobile_image_alt, mobile_image_credit, mobile_image_source_url,
  mobile_image_license, mobile_image_date, mobile_image_location,
  publication_status, social_is_active, home_is_active
FROM themes;

CREATE TABLE theme_content_filters_replacement_0055 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  theme_id INTEGER NOT NULL REFERENCES themes_replacement_0055(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('keyword', 'tag_name', 'author_name', 'reference_name', 'author_id', 'reference_id', 'language')),
  value TEXT NOT NULL,
  match_mode TEXT DEFAULT 'any' CHECK (match_mode IN ('any', 'all'))
);

CREATE TABLE theme_translations_replacement_0055 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  theme_id INTEGER NOT NULL REFERENCES themes_replacement_0055(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  home_copy TEXT,
  UNIQUE(theme_id, language)
);

CREATE TABLE theme_enrichment_jobs_replacement_0055 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  theme_id INTEGER NOT NULL REFERENCES themes_replacement_0055(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  payload TEXT DEFAULT '{}',
  result TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER DEFAULT (CAST(unixepoch() AS INTEGER)),
  processed_at INTEGER
);

CREATE TABLE entity_suggestions_replacement_0055 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  theme_id INTEGER NOT NULL REFERENCES themes_replacement_0055(id) ON DELETE CASCADE,
  enrichment_job_id INTEGER REFERENCES theme_enrichment_jobs_replacement_0055(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('tag', 'author', 'reference')),
  suggested_value TEXT NOT NULL,
  context TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at INTEGER,
  created_at INTEGER DEFAULT (CAST(unixepoch() AS INTEGER)),
  updated_at INTEGER DEFAULT (CAST(unixepoch() AS INTEGER))
);

CREATE TABLE user_messages_replacement_0055 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT,
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'feedback', 'content', 'other')),
  tags TEXT DEFAULT '[]' CHECK (json_valid(tags)),
  message TEXT NOT NULL CHECK (length(message) >= 10 AND length(message) <= 4000),
  target_type TEXT DEFAULT 'general' CHECK (target_type IN ('general', 'quote', 'author', 'reference')),
  target_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'triaged', 'spam', 'resolved')),
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  subject TEXT,
  theme_id INTEGER REFERENCES themes_replacement_0055(id) ON DELETE SET NULL,
  image_variant TEXT,
  reported_image_url TEXT
);

INSERT INTO theme_content_filters_replacement_0055 (id, theme_id, type, value, match_mode)
SELECT id, theme_id, type, value, match_mode FROM theme_content_filters;

INSERT INTO theme_translations_replacement_0055 (id, theme_id, language, name, description, home_copy)
SELECT id, theme_id, language, name, description, home_copy FROM theme_translations;

INSERT INTO theme_enrichment_jobs_replacement_0055 (
  id, theme_id, status, payload, result, created_by, created_at, processed_at
)
SELECT id, theme_id, status, payload, result, created_by, created_at, processed_at
FROM theme_enrichment_jobs;

INSERT INTO entity_suggestions_replacement_0055 (
  id, theme_id, enrichment_job_id, type, suggested_value, context, status,
  created_by, reviewed_by, reviewed_at, created_at, updated_at
)
SELECT
  id, theme_id, enrichment_job_id, type, suggested_value, context, status,
  created_by, reviewed_by, reviewed_at, created_at, updated_at
FROM entity_suggestions;

INSERT INTO user_messages_replacement_0055 (
  id, user_id, name, email, category, tags, message, target_type, target_id,
  ip_address, user_agent, status, reviewed_by, reviewed_at, created_at,
  subject, theme_id, image_variant, reported_image_url
)
SELECT
  id, user_id, name, email, category, tags, message, target_type, target_id,
  ip_address, user_agent, status, reviewed_by, reviewed_at, created_at,
  subject, theme_id, image_variant, reported_image_url
FROM user_messages;

-- Preserve the AUTOINCREMENT high-water marks, including IDs from deleted rows.
CREATE TABLE theme_active_removal_sequences_0055 (
  table_name TEXT PRIMARY KEY,
  seq INTEGER NOT NULL
);

INSERT INTO theme_active_removal_sequences_0055 (table_name, seq)
SELECT name, seq FROM sqlite_sequence
WHERE name IN (
  'themes', 'theme_content_filters', 'theme_translations',
  'theme_enrichment_jobs', 'entity_suggestions', 'user_messages'
);

DROP TABLE entity_suggestions;
DROP TABLE theme_content_filters;
DROP TABLE theme_translations;
DROP TABLE theme_enrichment_jobs;
DROP TABLE user_messages;
DROP TABLE themes;

ALTER TABLE themes_replacement_0055 RENAME TO themes;
ALTER TABLE theme_enrichment_jobs_replacement_0055 RENAME TO theme_enrichment_jobs;
ALTER TABLE entity_suggestions_replacement_0055 RENAME TO entity_suggestions;
ALTER TABLE theme_content_filters_replacement_0055 RENAME TO theme_content_filters;
ALTER TABLE theme_translations_replacement_0055 RENAME TO theme_translations;
ALTER TABLE user_messages_replacement_0055 RENAME TO user_messages;

CREATE INDEX idx_themes_slug ON themes(slug);
CREATE INDEX idx_themes_home_active ON themes(home_is_active);
CREATE INDEX idx_themes_default ON themes(is_default);
CREATE INDEX idx_themes_publication_status ON themes(publication_status);
CREATE INDEX idx_themes_language ON themes(language);
CREATE INDEX idx_theme_filters_theme ON theme_content_filters(theme_id);
CREATE INDEX idx_theme_translations_theme ON theme_translations(theme_id);
CREATE INDEX idx_theme_translations_language ON theme_translations(language);
CREATE INDEX idx_theme_enrichment_jobs_theme_status ON theme_enrichment_jobs(theme_id, status);
CREATE INDEX idx_theme_enrichment_jobs_status_order ON theme_enrichment_jobs(status, created_at);
CREATE INDEX idx_entity_suggestions_theme ON entity_suggestions(theme_id, status);
CREATE INDEX idx_entity_suggestions_status ON entity_suggestions(status, created_at);
CREATE INDEX idx_user_messages_category ON user_messages(category);
CREATE INDEX idx_user_messages_created ON user_messages(created_at DESC);
CREATE INDEX idx_user_messages_ip ON user_messages(ip_address);
CREATE INDEX idx_user_messages_status ON user_messages(status);
CREATE INDEX idx_user_messages_target ON user_messages(target_type, target_id);
CREATE INDEX idx_user_messages_user ON user_messages(user_id);

INSERT INTO sqlite_sequence(name, seq)
SELECT 'themes', seq FROM theme_active_removal_sequences_0055
WHERE table_name = 'themes'
  AND NOT EXISTS (SELECT 1 FROM sqlite_sequence WHERE name = 'themes');
INSERT INTO sqlite_sequence(name, seq)
SELECT 'theme_content_filters', seq FROM theme_active_removal_sequences_0055
WHERE table_name = 'theme_content_filters'
  AND NOT EXISTS (SELECT 1 FROM sqlite_sequence WHERE name = 'theme_content_filters');
INSERT INTO sqlite_sequence(name, seq)
SELECT 'theme_translations', seq FROM theme_active_removal_sequences_0055
WHERE table_name = 'theme_translations'
  AND NOT EXISTS (SELECT 1 FROM sqlite_sequence WHERE name = 'theme_translations');
INSERT INTO sqlite_sequence(name, seq)
SELECT 'theme_enrichment_jobs', seq FROM theme_active_removal_sequences_0055
WHERE table_name = 'theme_enrichment_jobs'
  AND NOT EXISTS (SELECT 1 FROM sqlite_sequence WHERE name = 'theme_enrichment_jobs');
INSERT INTO sqlite_sequence(name, seq)
SELECT 'entity_suggestions', seq FROM theme_active_removal_sequences_0055
WHERE table_name = 'entity_suggestions'
  AND NOT EXISTS (SELECT 1 FROM sqlite_sequence WHERE name = 'entity_suggestions');
INSERT INTO sqlite_sequence(name, seq)
SELECT 'user_messages', seq FROM theme_active_removal_sequences_0055
WHERE table_name = 'user_messages'
  AND NOT EXISTS (SELECT 1 FROM sqlite_sequence WHERE name = 'user_messages');

UPDATE sqlite_sequence
SET seq = MAX(seq, (SELECT seq FROM theme_active_removal_sequences_0055 WHERE table_name = sqlite_sequence.name))
WHERE name IN (
  'themes', 'theme_content_filters', 'theme_translations',
  'theme_enrichment_jobs', 'entity_suggestions', 'user_messages'
)
AND EXISTS (
  SELECT 1 FROM theme_active_removal_sequences_0055 WHERE table_name = sqlite_sequence.name
);

DROP TABLE theme_active_removal_sequences_0055;
