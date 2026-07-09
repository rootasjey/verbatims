-- Add Latin ('la') to the allowed languages on quotes table
-- This migration rebuilds the quotes table with the new CHECK constraint.

PRAGMA foreign_keys=off;

ALTER TABLE quotes RENAME TO quotes_old;

CREATE TABLE quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  language TEXT DEFAULT 'en' CHECK (language IN ('en','fr','es','de','it','pt','ru','ja','zh','la')),
  author_id INTEGER,
  reference_id INTEGER,
  user_id INTEGER NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','rejected')),
  moderator_id INTEGER,
  moderated_at DATETIME,
  rejection_reason TEXT,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES authors(id),
  FOREIGN KEY (reference_id) REFERENCES quote_references(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (moderator_id) REFERENCES users(id)
);

INSERT INTO quotes SELECT * FROM quotes_old;
DROP TABLE quotes_old;

PRAGMA foreign_keys=on;
