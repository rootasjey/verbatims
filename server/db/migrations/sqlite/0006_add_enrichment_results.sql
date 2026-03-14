ALTER TABLE entity_enrichment_jobs ADD COLUMN applied_at INTEGER;
ALTER TABLE entity_enrichment_jobs ADD COLUMN result_payload TEXT;
ALTER TABLE entity_enrichment_jobs ADD COLUMN result_summary TEXT;

CREATE TABLE IF NOT EXISTS entity_enrichment_field_proposals (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	job_id INTEGER NOT NULL,
	entity_type TEXT NOT NULL CHECK (entity_type IN ('author', 'reference')),
	entity_id INTEGER NOT NULL,
	field_name TEXT NOT NULL,
	current_value TEXT,
	proposed_value TEXT,
	confidence INTEGER NOT NULL DEFAULT 0,
	overwrite INTEGER NOT NULL DEFAULT 0,
	recommended INTEGER NOT NULL DEFAULT 0,
	source_labels TEXT DEFAULT '[]',
	source_urls TEXT DEFAULT '[]',
	external_source_type TEXT,
	external_source_id TEXT,
	rationale TEXT,
	proposed_by_type TEXT NOT NULL DEFAULT 'system' CHECK (proposed_by_type IN ('system', 'user')),
	proposed_by_user_id INTEGER,
	decision_status TEXT NOT NULL DEFAULT 'pending' CHECK (decision_status IN ('pending', 'accepted', 'rejected', 'applied', 'skipped')),
	decided_by INTEGER,
	decided_at INTEGER,
	applied_by INTEGER,
	applied_at INTEGER,
	created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
	updated_at INTEGER DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (job_id) REFERENCES entity_enrichment_jobs(id) ON DELETE CASCADE,
	FOREIGN KEY (proposed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
	FOREIGN KEY (decided_by) REFERENCES users(id) ON DELETE SET NULL,
	FOREIGN KEY (applied_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_entity_enrichment_field_proposals_job
	ON entity_enrichment_field_proposals(job_id);

CREATE INDEX IF NOT EXISTS idx_entity_enrichment_field_proposals_entity_field
	ON entity_enrichment_field_proposals(entity_type, entity_id, field_name);

CREATE INDEX IF NOT EXISTS idx_entity_enrichment_field_proposals_decision
	ON entity_enrichment_field_proposals(decision_status, created_at);

CREATE TABLE IF NOT EXISTS entity_field_change_history (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	entity_type TEXT NOT NULL CHECK (entity_type IN ('author', 'reference')),
	entity_id INTEGER NOT NULL,
	field_name TEXT NOT NULL,
	previous_value TEXT,
	new_value TEXT,
	change_origin TEXT NOT NULL DEFAULT 'enrichment_review' CHECK (change_origin IN ('enrichment_auto', 'enrichment_review', 'manual')),
	job_id INTEGER,
	proposal_id INTEGER,
	changed_by INTEGER,
	created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (job_id) REFERENCES entity_enrichment_jobs(id) ON DELETE SET NULL,
	FOREIGN KEY (proposal_id) REFERENCES entity_enrichment_field_proposals(id) ON DELETE SET NULL,
	FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_entity_field_change_history_entity_field
	ON entity_field_change_history(entity_type, entity_id, field_name);

CREATE INDEX IF NOT EXISTS idx_entity_field_change_history_created
	ON entity_field_change_history(created_at);