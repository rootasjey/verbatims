-- D1 maintenance migration. Review and test on an isolated database before production.
CREATE TABLE quote_provenance_preflight (valid INTEGER NOT NULL CHECK (valid = 1));
INSERT INTO quote_provenance_preflight(valid)
SELECT CASE WHEN EXISTS (SELECT 1 FROM quotes q WHERE NOT EXISTS (SELECT 1 FROM quote_attributions a WHERE a.quote_id=q.id))
 OR EXISTS (SELECT 1 FROM quote_attributions WHERE author_id IS NULL AND reference_id IS NULL)
 OR EXISTS (SELECT 1 FROM quotes q WHERE (SELECT count(*) FROM quote_attributions a WHERE a.quote_id=q.id AND a.is_primary=1)<>1)
 OR EXISTS (SELECT 1 FROM quote_sources s WHERE NOT EXISTS (SELECT 1 FROM quote_attributions a WHERE a.id=s.attribution_id AND a.quote_id=s.quote_id))
 THEN 0 ELSE 1 END;
DROP TABLE quote_provenance_preflight;

CREATE TABLE quotes_new (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,language TEXT DEFAULT 'en' CHECK (language IN ('en','fr','es','de','it','pt','ru','ja','zh','la')),user_id INTEGER NOT NULL,status TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','rejected')),moderator_id INTEGER,moderated_at INTEGER,rejection_reason TEXT,views_count INTEGER DEFAULT 0,likes_count INTEGER DEFAULT 0,shares_count INTEGER DEFAULT 0,is_featured BOOLEAN DEFAULT FALSE,created_at INTEGER DEFAULT CURRENT_TIMESTAMP,updated_at INTEGER DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id),FOREIGN KEY(moderator_id) REFERENCES users(id));
INSERT INTO quotes_new SELECT id,name,language,user_id,status,moderator_id,moderated_at,rejection_reason,views_count,likes_count,shares_count,is_featured,created_at,updated_at FROM quotes;

CREATE TABLE quote_attributions_new (id INTEGER PRIMARY KEY AUTOINCREMENT,quote_id INTEGER NOT NULL,author_id INTEGER,reference_id INTEGER,is_primary BOOLEAN NOT NULL DEFAULT TRUE,status TEXT NOT NULL DEFAULT 'unverified' CHECK (status IN ('unverified','manually_verified','externally_verified','disputed')),verified_by INTEGER,verified_at INTEGER,notes TEXT,created_by INTEGER,created_at INTEGER DEFAULT CURRENT_TIMESTAMP,updated_at INTEGER DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(quote_id) REFERENCES quotes_new(id) ON DELETE CASCADE,FOREIGN KEY(author_id) REFERENCES authors(id) ON DELETE SET NULL,FOREIGN KEY(reference_id) REFERENCES quote_references(id) ON DELETE SET NULL,FOREIGN KEY(verified_by) REFERENCES users(id) ON DELETE SET NULL,FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL);
INSERT INTO quote_attributions_new SELECT * FROM quote_attributions;
CREATE TABLE quote_sources_new (id INTEGER PRIMARY KEY AUTOINCREMENT,quote_id INTEGER NOT NULL,attribution_id INTEGER,source_type TEXT NOT NULL,source_url TEXT,label TEXT,verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified','manually_verified','externally_verified','disputed')),verified_by INTEGER,verified_at INTEGER,notes TEXT,is_primary BOOLEAN NOT NULL DEFAULT FALSE,created_by INTEGER,created_at INTEGER DEFAULT CURRENT_TIMESTAMP,updated_at INTEGER DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(quote_id) REFERENCES quotes_new(id) ON DELETE CASCADE,FOREIGN KEY(attribution_id) REFERENCES quote_attributions_new(id) ON DELETE SET NULL,FOREIGN KEY(verified_by) REFERENCES users(id) ON DELETE SET NULL,FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL);
INSERT INTO quote_sources_new SELECT * FROM quote_sources;

CREATE TABLE social_queue_new (id INTEGER PRIMARY KEY AUTOINCREMENT,quote_id INTEGER NOT NULL,source_type TEXT NOT NULL DEFAULT 'quote',source_id INTEGER NOT NULL,platform TEXT NOT NULL DEFAULT 'x' CHECK (platform IN ('x','bluesky','instagram','threads','facebook','pinterest')),status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','posted','failed')),position INTEGER NOT NULL DEFAULT 0,scheduled_for INTEGER,created_by INTEGER,created_at INTEGER DEFAULT CURRENT_TIMESTAMP,updated_at INTEGER DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(quote_id) REFERENCES quotes_new(id) ON DELETE CASCADE,FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL);
INSERT INTO social_queue_new SELECT * FROM social_queue;
CREATE TABLE social_posts_new (id INTEGER PRIMARY KEY AUTOINCREMENT,quote_id INTEGER NOT NULL,source_type TEXT NOT NULL DEFAULT 'quote',source_id INTEGER NOT NULL,queue_id INTEGER,platform TEXT NOT NULL DEFAULT 'x' CHECK (platform IN ('x','bluesky','instagram','threads','facebook','pinterest')),status TEXT NOT NULL CHECK (status IN ('success','failed')),post_text TEXT NOT NULL,post_url TEXT,external_post_id TEXT,error_message TEXT,idempotency_key TEXT NOT NULL UNIQUE,posted_at INTEGER DEFAULT CURRENT_TIMESTAMP,created_at INTEGER DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(quote_id) REFERENCES quotes_new(id) ON DELETE CASCADE,FOREIGN KEY(queue_id) REFERENCES social_queue_new(id) ON DELETE SET NULL);
INSERT INTO social_posts_new SELECT * FROM social_posts;

CREATE TABLE quote_tags_new (quote_id INTEGER,tag_id INTEGER,PRIMARY KEY(quote_id,tag_id),FOREIGN KEY(quote_id) REFERENCES quotes_new(id) ON DELETE CASCADE,FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE);
INSERT INTO quote_tags_new SELECT * FROM quote_tags;
CREATE TABLE quote_views_new (id INTEGER PRIMARY KEY AUTOINCREMENT,quote_id INTEGER NOT NULL,user_id INTEGER,ip_address TEXT,user_agent TEXT,viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(quote_id) REFERENCES quotes_new(id) ON DELETE CASCADE,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL);
INSERT INTO quote_views_new SELECT * FROM quote_views;
CREATE TABLE quote_reports_new (id INTEGER PRIMARY KEY AUTOINCREMENT,quote_id INTEGER NOT NULL,reporter_id INTEGER NOT NULL,reason TEXT NOT NULL CHECK (reason IN ('spam','inappropriate','copyright','misinformation','other')),description TEXT,status TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved')),reviewed_by INTEGER,reviewed_at INTEGER,created_at INTEGER DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(quote_id) REFERENCES quotes_new(id) ON DELETE CASCADE,FOREIGN KEY(reporter_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(reviewed_by) REFERENCES users(id));
INSERT INTO quote_reports_new SELECT * FROM quote_reports;
CREATE TABLE collection_quotes_new (collection_id INTEGER,quote_id INTEGER,added_at DATETIME DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(collection_id,quote_id),FOREIGN KEY(collection_id) REFERENCES user_collections(id) ON DELETE CASCADE,FOREIGN KEY(quote_id) REFERENCES quotes_new(id) ON DELETE CASCADE);
INSERT INTO collection_quotes_new SELECT * FROM collection_quotes;

DROP TRIGGER IF EXISTS quotes_fts_ai; DROP TRIGGER IF EXISTS quotes_fts_ad; DROP TRIGGER IF EXISTS quotes_fts_au; DROP TRIGGER IF EXISTS update_quotes_timestamp; DROP TRIGGER IF EXISTS increment_quote_views; DROP TRIGGER IF EXISTS increment_likes_count; DROP TRIGGER IF EXISTS decrement_likes_count;
DROP TABLE IF EXISTS quotes_fts;
DROP TABLE quote_sources; DROP TABLE quote_attributions; DROP TABLE social_posts; DROP TABLE social_queue; DROP TABLE quote_tags; DROP TABLE quote_views; DROP TABLE quote_reports; DROP TABLE collection_quotes; DROP TABLE quotes;
ALTER TABLE quotes_new RENAME TO quotes; ALTER TABLE quote_attributions_new RENAME TO quote_attributions; ALTER TABLE quote_sources_new RENAME TO quote_sources; ALTER TABLE social_queue_new RENAME TO social_queue; ALTER TABLE social_posts_new RENAME TO social_posts; ALTER TABLE quote_tags_new RENAME TO quote_tags; ALTER TABLE quote_views_new RENAME TO quote_views; ALTER TABLE quote_reports_new RENAME TO quote_reports; ALTER TABLE collection_quotes_new RENAME TO collection_quotes;

CREATE INDEX idx_quotes_status ON quotes(status); CREATE INDEX idx_quotes_user ON quotes(user_id); CREATE INDEX idx_quotes_created ON quotes(created_at DESC); CREATE INDEX idx_quotes_featured ON quotes(is_featured); CREATE INDEX idx_quotes_language ON quotes(language);
CREATE INDEX idx_quote_attributions_quote ON quote_attributions(quote_id); CREATE INDEX idx_quote_attributions_author ON quote_attributions(author_id); CREATE INDEX idx_quote_attributions_reference ON quote_attributions(reference_id); CREATE INDEX idx_quote_attributions_status ON quote_attributions(status);
CREATE INDEX idx_quote_sources_quote ON quote_sources(quote_id); CREATE INDEX idx_quote_sources_attribution ON quote_sources(attribution_id); CREATE INDEX idx_quote_sources_status ON quote_sources(verification_status); CREATE INDEX idx_social_queue_quote ON social_queue(quote_id); CREATE INDEX idx_social_posts_quote_platform ON social_posts(quote_id,platform);
CREATE UNIQUE INDEX idx_quote_attributions_one_primary ON quote_attributions(quote_id) WHERE is_primary = TRUE;
CREATE UNIQUE INDEX idx_quote_sources_one_primary ON quote_sources(quote_id) WHERE is_primary = TRUE;

CREATE VIRTUAL TABLE quotes_fts USING fts5(name,content=quotes,content_rowid=id,tokenize='porter unicode61');
CREATE TRIGGER quotes_fts_ai AFTER INSERT ON quotes BEGIN INSERT INTO quotes_fts(rowid,name) VALUES (new.id,new.name); END;
CREATE TRIGGER quotes_fts_ad AFTER DELETE ON quotes BEGIN INSERT INTO quotes_fts(quotes_fts,rowid,name) VALUES ('delete',old.id,old.name); END;
CREATE TRIGGER quotes_fts_au AFTER UPDATE ON quotes BEGIN INSERT INTO quotes_fts(quotes_fts,rowid,name) VALUES ('delete',old.id,old.name); INSERT INTO quotes_fts(rowid,name) VALUES (new.id,new.name); END;
INSERT INTO quotes_fts(quotes_fts) VALUES ('rebuild');

CREATE TRIGGER update_quotes_timestamp AFTER UPDATE ON quotes FOR EACH ROW BEGIN UPDATE quotes SET updated_at=CURRENT_TIMESTAMP WHERE id=OLD.id; END;
CREATE TRIGGER increment_quote_views AFTER INSERT ON quote_views FOR EACH ROW BEGIN UPDATE quotes SET views_count=views_count+1 WHERE id=NEW.quote_id; END;
CREATE TRIGGER increment_likes_count AFTER INSERT ON user_likes FOR EACH ROW BEGIN
 UPDATE quotes SET likes_count=likes_count+1 WHERE NEW.likeable_type='quote' AND id=NEW.likeable_id;
 UPDATE authors SET likes_count=likes_count+1 WHERE NEW.likeable_type='author' AND id=NEW.likeable_id;
 UPDATE quote_references SET likes_count=likes_count+1 WHERE NEW.likeable_type='reference' AND id=NEW.likeable_id;
END;
CREATE TRIGGER decrement_likes_count AFTER DELETE ON user_likes FOR EACH ROW BEGIN
 UPDATE quotes SET likes_count=likes_count-1 WHERE OLD.likeable_type='quote' AND id=OLD.likeable_id;
 UPDATE authors SET likes_count=likes_count-1 WHERE OLD.likeable_type='author' AND id=OLD.likeable_id;
 UPDATE quote_references SET likes_count=likes_count-1 WHERE OLD.likeable_type='reference' AND id=OLD.likeable_id;
END;
CREATE TRIGGER quote_attributions_require_entity_on_insert BEFORE INSERT ON quote_attributions WHEN NEW.author_id IS NULL AND NEW.reference_id IS NULL BEGIN SELECT RAISE(ABORT,'An attribution requires an author or reference'); END;
CREATE TRIGGER quote_attributions_require_entity_on_update BEFORE UPDATE OF author_id,reference_id ON quote_attributions WHEN NEW.author_id IS NULL AND NEW.reference_id IS NULL BEGIN SELECT RAISE(ABORT,'An attribution requires an author or reference'); END;
CREATE TRIGGER quote_sources_require_matching_attribution_on_insert BEFORE INSERT ON quote_sources WHEN NEW.attribution_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM quote_attributions WHERE id=NEW.attribution_id AND quote_id=NEW.quote_id) BEGIN SELECT RAISE(ABORT,'A source must belong to an attribution of the same quote'); END;
CREATE TRIGGER quote_sources_require_matching_attribution_on_update BEFORE UPDATE OF quote_id,attribution_id ON quote_sources WHEN NEW.attribution_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM quote_attributions WHERE id=NEW.attribution_id AND quote_id=NEW.quote_id) BEGIN SELECT RAISE(ABORT,'A source must belong to an attribution of the same quote'); END;
