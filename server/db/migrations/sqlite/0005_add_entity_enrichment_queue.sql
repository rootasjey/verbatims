CREATE TABLE IF NOT EXISTS entity_verification_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('author', 'reference')),
  entity_id INTEGER NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'queued' CHECK (verification_status IN ('queued', 'processing', 'verified', 'review', 'failed')),
  last_verified_at INTEGER,
  next_check_at INTEGER,
  last_enqueued_at INTEGER,
  last_successful_job_id INTEGER,
  last_source TEXT,
  last_external_id TEXT,
  last_confidence_score INTEGER,
  review_required INTEGER DEFAULT 0,
  last_error TEXT,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  updated_at INTEGER DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_entity_verification_state_unique
  ON entity_verification_state(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_entity_verification_state_due
  ON entity_verification_state(entity_type, next_check_at, verification_status);

CREATE TABLE IF NOT EXISTS entity_enrichment_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id TEXT NOT NULL UNIQUE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('author', 'reference')),
  entity_id INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT 'manual' CHECK (reason IN ('never_verified', 'stale', 'manual', 'retry')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  trigger_source TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_source IN ('cron', 'manual')),
  priority INTEGER NOT NULL DEFAULT 0,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  scheduled_for INTEGER DEFAULT CURRENT_TIMESTAMP,
  started_at INTEGER,
  completed_at INTEGER,
  created_by INTEGER,
  payload TEXT DEFAULT '{}',
  error_message TEXT,
  created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  updated_at INTEGER DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_entity_enrichment_jobs_status_scheduled
  ON entity_enrichment_jobs(status, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_entity_enrichment_jobs_entity_status
  ON entity_enrichment_jobs(entity_type, entity_id, status);

CREATE INDEX IF NOT EXISTS idx_entity_enrichment_jobs_created
  ON entity_enrichment_jobs(created_at);