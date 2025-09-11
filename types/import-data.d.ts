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
  conflict?: ImportConflictOptions
}
