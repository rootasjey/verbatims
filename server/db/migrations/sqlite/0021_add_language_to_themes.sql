ALTER TABLE themes ADD COLUMN language TEXT DEFAULT 'en' CHECK (language IN ('en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'la'));
