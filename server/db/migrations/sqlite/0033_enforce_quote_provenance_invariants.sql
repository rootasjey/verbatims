-- Make every existing source explicit: evidence belongs to an attribution.
UPDATE quote_sources
SET attribution_id = (
  SELECT id
  FROM quote_attributions
  WHERE quote_id = quote_sources.quote_id
  ORDER BY is_primary DESC, id ASC
  LIMIT 1
)
WHERE attribution_id IS NULL;

UPDATE quote_sources
SET attribution_id = (
  SELECT id
  FROM quote_attributions
  WHERE quote_id = quote_sources.quote_id
  ORDER BY is_primary DESC, id ASC
  LIMIT 1
)
WHERE NOT EXISTS (
  SELECT 1
  FROM quote_attributions
  WHERE id = quote_sources.attribution_id
    AND quote_id = quote_sources.quote_id
);

-- Keep one deterministic primary row before adding partial unique indexes.
UPDATE quote_attributions
SET is_primary = FALSE
WHERE is_primary = TRUE
  AND id NOT IN (
    SELECT MIN(id)
    FROM quote_attributions
    WHERE is_primary = TRUE
    GROUP BY quote_id
  );

UPDATE quote_attributions
SET is_primary = TRUE
WHERE id IN (
  SELECT MIN(id)
  FROM quote_attributions
  GROUP BY quote_id
  HAVING SUM(CASE WHEN is_primary = TRUE THEN 1 ELSE 0 END) = 0
);

UPDATE quote_sources
SET is_primary = FALSE
WHERE is_primary = TRUE
  AND id NOT IN (
    SELECT MIN(id)
    FROM quote_sources
    WHERE is_primary = TRUE
    GROUP BY quote_id
  );

-- Rebuild quote_sources so an evidence row can never be global to a quote.
CREATE TABLE quote_sources_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  attribution_id INTEGER NOT NULL,
  source_type TEXT NOT NULL,
  source_url TEXT,
  label TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'manually_verified', 'externally_verified', 'disputed')),
  verified_by INTEGER,
  verified_at DATETIME,
  notes TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  FOREIGN KEY (attribution_id) REFERENCES quote_attributions(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO quote_sources_new
SELECT * FROM quote_sources;

DROP TABLE quote_sources;
ALTER TABLE quote_sources_new RENAME TO quote_sources;

CREATE INDEX idx_quote_sources_quote ON quote_sources(quote_id);
CREATE INDEX idx_quote_sources_attribution ON quote_sources(attribution_id);
CREATE INDEX idx_quote_sources_status ON quote_sources(verification_status);
CREATE UNIQUE INDEX idx_quote_attributions_one_primary
  ON quote_attributions(quote_id) WHERE is_primary = TRUE;
CREATE UNIQUE INDEX idx_quote_sources_one_primary
  ON quote_sources(quote_id) WHERE is_primary = TRUE;

CREATE TRIGGER quote_attributions_require_entity_on_insert
BEFORE INSERT ON quote_attributions
WHEN NEW.author_id IS NULL AND NEW.reference_id IS NULL
BEGIN
  SELECT RAISE(ABORT, 'An attribution requires an author or reference');
END;

CREATE TRIGGER quote_attributions_require_entity_on_update
BEFORE UPDATE OF author_id, reference_id ON quote_attributions
WHEN NEW.author_id IS NULL AND NEW.reference_id IS NULL
BEGIN
  SELECT RAISE(ABORT, 'An attribution requires an author or reference');
END;

CREATE TRIGGER quote_sources_require_matching_attribution_on_insert
BEFORE INSERT ON quote_sources
WHEN NOT EXISTS (
  SELECT 1 FROM quote_attributions
  WHERE id = NEW.attribution_id AND quote_id = NEW.quote_id
)
BEGIN
  SELECT RAISE(ABORT, 'A source must belong to an attribution of the same quote');
END;

CREATE TRIGGER quote_sources_require_matching_attribution_on_update
BEFORE UPDATE OF quote_id, attribution_id ON quote_sources
WHEN NOT EXISTS (
  SELECT 1 FROM quote_attributions
  WHERE id = NEW.attribution_id AND quote_id = NEW.quote_id
)
BEGIN
  SELECT RAISE(ABORT, 'A source must belong to an attribution of the same quote');
END;
