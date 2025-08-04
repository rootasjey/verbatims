/**
 * Admin API: Import Draft Quotes from Firestore JSON
 * Handles bulk import of draft quote data with embedded author/reference handling
 */

import { validateQuoteData } from '~/server/utils/data-validation'
import { transformFirestoreQuotes } from '~/server/utils/firestore-quote-transformer'
import { findOrCreateAuthor, findOrCreateReference } from '~/server/utils/import-helpers'

interface ImportProgress {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  totalRecords: number
  processedRecords: number
  successfulRecords: number
  failedRecords: number
  createdAuthors: number
  createdReferences: number
  errors: string[]
  warnings: string[]
  startedAt: Date
  completedAt?: Date
}

// In-memory store for import progress (in production, use Redis or database)
const importProgressStore = new Map<string, ImportProgress>()

export default defineEventHandler(async (event) => {
  try {
    // Check admin permissions
    const { user } = await requireUserSession(event)
    if (!user || user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }

    const body = await readBody(event)
    const { data, format, options = {} } = body

    if (!data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No data provided for import'
      })
    }

    if (format !== 'firestore-drafts') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Only firestore-drafts format is supported for quote imports'
      })
    }

    // Generate unique import ID
    const importId = `quotes_import_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    
    // Initialize progress tracking
    const progress: ImportProgress = {
      id: importId,
      status: 'pending',
      totalRecords: 0,
      processedRecords: 0,
      successfulRecords: 0,
      failedRecords: 0,
      createdAuthors: 0,
      createdReferences: 0,
      errors: [],
      warnings: [],
      startedAt: new Date()
    }
    
    importProgressStore.set(importId, progress)

    // Process import asynchronously
    processQuoteImport(importId, data, options, user.id)
      .catch(error => {
        const progress = importProgressStore.get(importId)
        if (progress) {
          progress.status = 'failed'
          progress.errors.push(`Fatal error: ${error.message}`)
          progress.completedAt = new Date()
        }
      })

    return {
      success: true,
      importId,
      message: 'Quote import started successfully',
      progressUrl: `/api/admin/import/progress/${importId}`
    }

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Quote import failed'
    })
  }
})

async function processQuoteImport(
  importId: string, 
  rawData: any, 
  options: any,
  adminUserId: number
) {
  const progress = importProgressStore.get(importId)!
  progress.status = 'processing'

  try {
    const db = hubDatabase()
    if (!db) {
      throw new Error('Database not available')
    }

    // Transform Firestore data
    const transformResult = transformFirestoreQuotes(rawData, adminUserId)
    const quotes = transformResult.quotes
    progress.warnings.push(...transformResult.warnings.map(w => 
      w.firebaseId ? `${w.firebaseId}: ${w.warning}` : w.warning
    ))

    progress.totalRecords = quotes.length

    if (quotes.length === 0) {
      progress.status = 'completed'
      progress.completedAt = new Date()
      progress.warnings.push('No quotes found in the provided data')
      return
    }

    // Validate data
    const validationResult = validateQuoteData(quotes)
    progress.warnings.push(...validationResult.warnings)

    if (!validationResult.isValid && !options.ignoreValidationErrors) {
      progress.errors.push(...validationResult.errors)
      throw new Error(`Validation failed: ${validationResult.errors.length} errors found`)
    }

    // Create backup before import (if requested)
    let backupId: string | null = null
    if (options.createBackup !== false) {
      backupId = await createDatabaseBackup(db)
      progress.warnings.push(`Backup created: ${backupId}`)
    }

    // Process quotes in batches using NuxtHub transaction handling
    const batchSize = options.batchSize || 50
    const batches = []

    for (let i = 0; i < quotes.length; i += batchSize) {
      batches.push(quotes.slice(i, i + batchSize))
    }

    // Process each batch
    for (const batch of batches) {
      await processQuoteBatch(db, batch, progress)

      // Update progress
      progress.processedRecords = Math.min(progress.processedRecords + batch.length, progress.totalRecords)
    }

    progress.status = 'completed'
    progress.completedAt = new Date()

  } catch (error: any) {
    progress.status = 'failed'
    progress.errors.push(error.message)
    progress.completedAt = new Date()
    throw error
  }
}

async function processQuoteBatch(db: any, batch: any[], progress: ImportProgress) {
  // Prepare all statements for batch processing
  const statements = []

  for (const quote of batch) {
    try {
      let authorId: number | null = null
      let referenceId: number | null = null

      // Handle author creation/lookup
      if (quote.author && quote.author.name) {
        const authorResult = await findOrCreateAuthor(db, quote.author)
        authorId = authorResult.id
        if (authorResult.isNew) {
          progress.createdAuthors++
        }
      }

      // Handle reference creation/lookup
      if (quote.reference && quote.reference.name) {
        const referenceResult = await findOrCreateReference(db, quote.reference)
        referenceId = referenceResult.id
        if (referenceResult.isNew) {
          progress.createdReferences++
        }
      }

      // Prepare the quote insert statement
      const stmt = db.prepare(`
        INSERT INTO quotes (
          name, language, author_id, reference_id, user_id, status,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        quote.name,
        quote.language || 'en',
        authorId,
        referenceId,
        quote.user_id,
        'draft',
        quote.created_at,
        quote.updated_at
      )

      statements.push(stmt)

    } catch (error: any) {
      progress.failedRecords++
      progress.errors.push(`Failed to prepare quote "${quote.name?.substring(0, 50)}...": ${error.message}`)
    }
  }

  // Execute all statements in a batch using NuxtHub's batch method
  if (statements.length > 0) {
    try {
      await db.batch(statements)
      progress.successfulRecords += statements.length
    } catch (error: any) {
      // If batch fails, try individual inserts to identify problematic records
      for (let i = 0; i < statements.length; i++) {
        try {
          await statements[i].run()
          progress.successfulRecords++
        } catch (individualError: any) {
          progress.failedRecords++
          const quote = batch[i]
          progress.errors.push(`Failed to import quote "${quote?.name?.substring(0, 50)}...": ${individualError.message}`)
        }
      }
    }
  }
}

async function createDatabaseBackup(db: any): Promise<string> {
  const backupId = `quotes_backup_${Date.now()}`
  
  // Export current quotes to backup table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS quotes_backup_${backupId} AS 
    SELECT * FROM quotes
  `).run()
  
  return backupId
}

// Export the progress store for other endpoints to access
export { importProgressStore }
