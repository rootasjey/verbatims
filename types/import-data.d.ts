export interface ImportProgress {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  totalRecords: number
  processedRecords: number
  successfulRecords: number
  createdAuthors?: number
  createdReferences?: number
  failedRecords: number
  errors: string[]
  warnings: string[]
  startedAt: Date
  completedAt?: Date
}

export type ConflictMode = 'insert' | 'ignore' | 'upsert'
export type UpdateStrategy = 'fill-missing' | 'overwrite' | 'prefer-existing'

export interface ConflictPolicy {
  mode: ConflictMode
  updateStrategy?: UpdateStrategy
  fields?: string[]
}

export interface ImportConflictOptions {
  users?: ConflictPolicy
  tags?: ConflictPolicy
  authors?: ConflictPolicy
  references?: ConflictPolicy
  quotes?: ConflictPolicy
}

export interface ImportOptions {
  createBackup?: boolean
  ignoreValidationErrors?: boolean
  batchSize?: number
  retentionDays?: number
  /**
   * Preserve explicit IDs from import data when possible.
   * When true and an item contains a valid numeric `id`, importers may insert using that ID
   * and then adjust sqlite_sequence to MAX(id) to keep AUTOINCREMENT in sync.
   */
  preserveIds?: boolean
  conflict?: ImportConflictOptions
}

interface ImportSummary {
  pending: number
  processing: number
  completed: number
  failed: number
  total: number
  totalRecordsImported: number
}

interface ImportPagination {
  limit: number
  total: number
  hasMore: boolean
  offset: number
}
