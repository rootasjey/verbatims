/**
 * Admin API: Import References from JSON/CSV
 * Handles bulk import of reference data with validation, progress tracking, and rollback
 */

import { validateReferenceDataZod } from '~/server/utils/validation/reference'
import type { ImportOptions, ImportProgress } from '~/types'

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

    // Generate unique import ID
    const importId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Initialize progress tracking
    const progress: ImportProgress = {
      id: importId,
      status: 'pending',
      totalRecords: 0,
      processedRecords: 0,
      successfulRecords: 0,
      createdAuthors: 0,
      createdReferences: 0,
      failedRecords: 0,
      errors: [],
      warnings: [],
      startedAt: new Date()
    }

    importProgressStore.set(importId, progress)

    // Process import asynchronously
    processImport(importId, data, format, options, user.id)
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
      message: 'Import started successfully',
      progressUrl: `/api/admin/import/progress/${importId}`
    }

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Import failed'
    })
  }
})

async function processImport(
  importId: string,
  rawData: any,
  format: 'json' | 'csv' | 'firebase',
  options: ImportOptions,
  userId: number
) {
  const progress = importProgressStore.get(importId)!
  progress.status = 'processing'

  try {
    // Parse and transform data based on format
    let references: any[] = []

    if (format === 'json') {
      references = Array.isArray(rawData) ? rawData : [rawData]
    } else if (format === 'csv') {
      references = await parseCsvData(rawData)
    } else {
      throw new Error(`Unsupported format: ${format}`)
    }

    progress.totalRecords = references.length

    // Validate data (Zod-based)
    const validationResult = validateReferenceDataZod(references)
    progress.warnings.push(...validationResult.warnings)

    if (!validationResult.isValid && !options.ignoreValidationErrors) {
      progress.errors.push(...validationResult.errors)
      throw new Error(`Validation failed: ${validationResult.errors.length} errors found`)
    }

    // Get database connection
    const db = hubDatabase()
    if (!db) {
      throw new Error('Database not available')
    }

    // Create backup before import (if requested)
    let backupId: string | null = null
    if (options.createBackup !== false) {
      backupId = await createDatabaseBackup(db)
      progress.warnings.push(`Backup created: ${backupId}`)
    }

    // Begin transaction
    await db.prepare('BEGIN TRANSACTION').run()

    try {
      // Process references in batches
      const batchSize = options.batchSize || 50
      const batches = []

      for (let i = 0; i < references.length; i += batchSize) {
        batches.push(references.slice(i, i + batchSize))
      }

      for (const batch of batches) {
        await processBatch(db, batch, progress, userId)

        // Update progress
        progress.processedRecords = Math.min(progress.processedRecords + batch.length, progress.totalRecords)
      }

      // Commit transaction
      await db.prepare('COMMIT').run()

      progress.status = 'completed'
      progress.completedAt = new Date()

    } catch (error) {
      // Rollback transaction
      await db.prepare('ROLLBACK').run()
      throw error
    }

  } catch (error: any) {
    progress.status = 'failed'
    progress.errors.push(error.message)
    progress.completedAt = new Date()
    throw error
  }
}

async function processBatch(db: any, batch: any[], progress: ImportProgress, userId: number) {
  // Optimize for Cloudflare D1: Use prepared statements and batch transactions
  const insertStmt = db.prepare(`
    INSERT INTO quote_references (
      name, original_language, release_date, description, primary_type, secondary_type,
      image_url, urls, views_count, likes_count, shares_count,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  // Process in smaller sub-batches for better performance
  const subBatchSize = 10 // Optimal for D1
  const subBatches = []

  for (let i = 0; i < batch.length; i += subBatchSize) {
    subBatches.push(batch.slice(i, i + subBatchSize))
  }

  for (const subBatch of subBatches) {
    // Use batch() for better D1 performance
    const statements = subBatch.map(reference => {
      // Handle URLs field - convert export format (array) to database format (JSON string)
      let urlsField = '{}'
      if (reference.urls) {
        if (Array.isArray(reference.urls)) {
          // Export format: convert array to JSON string
          urlsField = JSON.stringify(reference.urls)
        } else if (typeof reference.urls === 'string') {
          // Already a JSON string
          urlsField = reference.urls
        } else if (typeof reference.urls === 'object') {
          // Object format: convert to JSON string
          urlsField = JSON.stringify(reference.urls)
        }
      }

      return insertStmt.bind(
        reference.name,
        reference.original_language || 'en', // Default for exports that don't include this
        reference.release_date,
        reference.description || '',
        reference.primary_type,
        reference.secondary_type || '',
        reference.image_url || '',
        urlsField,
        reference.views_count || 0,
        reference.likes_count || 0,
        reference.shares_count || 0, // Default for exports that don't include this
        reference.created_at || new Date().toISOString(),
        reference.updated_at || new Date().toISOString()
      )
    })

    try {
      // Execute batch with D1 optimization
      await db.batch(statements)
      progress.successfulRecords += subBatch.length
    } catch (error: any) {
      // If batch fails, try individual inserts to identify problematic records
      for (const [index, reference] of subBatch.entries()) {
        try {
          await statements[index].run()
          progress.successfulRecords++
        } catch (individualError: any) {
          progress.failedRecords++
          progress.errors.push(`Failed to import \"${reference.name}\": ${individualError.message}`)
        }
      }
    }

    // Add small delay to prevent overwhelming D1
    if (subBatches.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }
}



async function parseCsvData(csvData: string): Promise<any[]> {
  // Enhanced CSV parser to handle export format properly
  const lines = csvData.trim().split('\n')
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0])

  return lines.slice(1).map(line => {
    const values = parseCSVLine(line)
    const obj: any = {}

    headers.forEach((header, index) => {
      const value = values[index] || null

      // Handle special fields from export format
      if (header === 'urls' && value && value !== '{}' && value !== '') {
        try {
          // Try to parse as JSON (could be array or object)
          obj[header] = JSON.parse(value)
        } catch {
          // If parsing fails, keep as string
          obj[header] = value
        }
      } else if (['views_count', 'likes_count', 'shares_count', 'quotes_count'].includes(header)) {
        // Convert numeric fields
        obj[header] = value && value !== '' ? parseInt(value, 10) : 0
      } else if (header === 'is_featured' && value) {
        // Convert boolean fields
        obj[header] = value.toLowerCase() === 'true'
      } else {
        obj[header] = value
      }
    })

    return obj
  })
}

// Helper function to properly parse CSV lines with quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  // Add the last field
  result.push(current.trim())

  return result
}

async function createDatabaseBackup(db: any): Promise<string> {
  const backupId = `backup_${Date.now()}`

  // Export current references to backup table
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS quote_references_backup_${backupId} AS
    SELECT * FROM quote_references
  `).run()

  return backupId
}

// Export progress store for other endpoints
export { importProgressStore }
