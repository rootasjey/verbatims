ALTER TABLE quote_creation_requests
ADD COLUMN payload_hash TEXT NOT NULL DEFAULT '';
