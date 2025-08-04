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

export interface ImportOptions {
  createBackup?: boolean
  ignoreValidationErrors?: boolean
  batchSize?: number
}
