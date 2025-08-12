import { User } from '#auth-utils'
import { generateImportId, initializeProgress, updateProgress, addError } from '~/server/utils/onboarding-progress'

export default defineEventHandler(async (event) => {
  // Check if this is a request for async processing
  const query = getQuery(event)
  const isAsync = query.async === 'true'

  try {
    const db = hubDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database not available'
      })
    }

    // Check if database schema exists
    try {
      await db.prepare('SELECT 1 FROM users LIMIT 1').first()
    } catch (error) {
      // Database tables don't exist, initialize them first
      const initSuccess = await initializeDatabase()
      if (!initSuccess) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to initialize database schema'
        })
      }
    }

    // Check if admin user exists
    const adminUser: User | null = await db.prepare(`
      SELECT id FROM users WHERE role = 'admin' LIMIT 1
    `).first()

    if (!adminUser) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Admin user must be created before initializing database'
      })
    }

    // Check if data already exists
    const existingQuotes = await db.prepare('SELECT COUNT(*) as count FROM quotes').first()
    if (Number(existingQuotes?.count) > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Database already contains data'
      })
    }

    console.log('Starting database initialization with backup data...')

    // Generate import ID and initialize progress tracking
    const importId = generateImportId()
    const progress = initializeProgress(importId)

    // If async mode, start processing in background and return import ID
    if (isAsync) {
      // Start processing asynchronously
      processImportAsync(db, adminUser.id, importId)
        .catch(error => {
          console.error('Async import failed:', error)
          addError(importId, `Import failed: ${error.message}`)
        })

      return {
        success: true,
        importId,
        message: 'Import started successfully',
        progressUrl: `/api/onboarding/progress/${importId}`
      }
    }

    // Synchronous processing (legacy mode)
    const results = await processImportSync(db, adminUser.id, importId)

    return {
      success: true,
      message: 'Database initialized successfully',
      data: results,
      importId
    }

  } catch (error: any) {
    console.error('Database initialization error:', error)

    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Failed to initialize database'
    })
  }
})

/**
 * Process import synchronously (legacy mode)
 */
async function processImportSync(db: any, adminUserId: number, importId: string) {
  const results = {
    authors: 0,
    references: 0,
    quotes: 0
  }

  // Update overall status
  updateProgress(importId, { status: 'processing' })

  // 1. Import Authors
  try {
    console.log('Importing authors...')
    results.authors = await importAuthorsFromBackup(db, importId)
    console.log(`✅ Imported ${results.authors} authors`)
  } catch (error: any) {
    console.error('Failed to import authors:', error)
    addError(importId, `Failed to import authors: ${error.message}`)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to import authors: ${error.message}`
    })
  }

  // 2. Import References
  try {
    console.log('Importing references...')
    results.references = await importReferencesFromBackup(db, importId)
    console.log(`✅ Imported ${results.references} references`)
  } catch (error: any) {
    console.error('Failed to import references:', error)
    addError(importId, `Failed to import references: ${error.message}`)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to import references: ${error.message}`
    })
  }

  // 3. Import Quotes
  try {
    console.log('Importing quotes...')
    results.quotes = await importQuotesFromBackup(db, adminUserId, importId)
    console.log(`✅ Imported ${results.quotes} quotes`)
  } catch (error: any) {
    console.error('Failed to import quotes:', error)
    addError(importId, `Failed to import quotes: ${error.message}`)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to import quotes: ${error.message}`
    })
  }

  const totalImported = results.authors + results.references + results.quotes
  console.log(`🎉 Database initialization completed! Total items imported: ${totalImported}`)

  // Update final status
  updateProgress(importId, {
    status: 'completed',
    completedAt: new Date()
  })

  return results
}

/**
 * Process import asynchronously (for real-time progress)
 */
async function processImportAsync(db: any, adminUserId: number, importId: string) {
  try {
    await processImportSync(db, adminUserId, importId)
  } catch (error: any) {
    console.error('Async import failed:', error)
    addError(importId, `Import failed: ${error.message}`)
    throw error
  }
}

/**
 * Import authors from backup file
 */
async function importAuthorsFromBackup(db: any, importId?: string): Promise<number> {
  const { readFileSync } = await import('fs')
  const { join } = await import('path')
  const { updateStepProgress } = await import('~/server/utils/onboarding-progress')

  // Find the latest authors export file
  const { readdirSync } = await import('fs')
  const backupDir = join(process.cwd(), 'server/database/backups')
  const files = readdirSync(backupDir)
  const authorsFile = files.find(file => file.startsWith('authors-export-') && file.endsWith('.json'))

  if (!authorsFile) {
    throw new Error('No authors export file found in backups directory')
  }

  // Load authors backup file
  const backupPath = join(backupDir, authorsFile)
  const rawData = readFileSync(backupPath, 'utf-8')
  const authors = JSON.parse(rawData)

  if (!Array.isArray(authors)) {
    throw new Error('Invalid authors export format: expected array')
  }

  const totalAuthors = authors.length

  let importedCount = 0

  // Update progress: starting authors import
  if (importId) {
    updateStepProgress(importId, 'authors', {
      status: 'processing',
      message: `Starting import of ${totalAuthors} authors...`,
      total: totalAuthors,
      current: 0,
      imported: 0
    })
  }

  // Process in batches
  const batchSize = 50
  for (let i = 0; i < authors.length; i += batchSize) {
    const batch = authors.slice(i, i + batchSize)

    for (const [index, authorData] of batch.entries()) {
      try {
        // D1 export data is already in the correct format, just need to handle optional fields
        await db.prepare(`
          INSERT INTO authors (
            name, description, birth_date, death_date, birth_location, job,
            image_url, is_fictional, views_count, likes_count, shares_count,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          authorData.name || '',
          authorData.description || '',
          authorData.birth_date || null,
          authorData.death_date || null,
          authorData.birth_location || '',
          authorData.job || '',
          authorData.image_url || '',
          authorData.is_fictional || false,
          authorData.views_count || 0,
          authorData.likes_count || 0,
          authorData.shares_count || 0,
          authorData.created_at || new Date().toISOString(),
          authorData.updated_at || new Date().toISOString()
        ).run()

        importedCount++

        // Update progress periodically
        if (importId && importedCount % 10 === 0) {
          updateStepProgress(importId, 'authors', {
            current: i + index + 1,
            imported: importedCount,
            message: `Imported ${importedCount} of ${totalAuthors} authors...`
          })
        }
      } catch (error) {
        console.error(`Failed to import author ${authorData.name || 'unknown'}:`, error)
        // Continue with other authors
      }
    }
  }

  // Update progress: completed authors import
  if (importId) {
    updateStepProgress(importId, 'authors', {
      status: 'completed',
      message: `Successfully imported ${importedCount} authors`,
      current: totalAuthors,
      imported: importedCount
    })
  }

  return importedCount
}

/**
 * Import references from backup file
 */
async function importReferencesFromBackup(db: any, importId?: string): Promise<number> {
  const { readFileSync } = await import('fs')
  const { join } = await import('path')
  const { updateStepProgress } = await import('~/server/utils/onboarding-progress')

  // Find the latest references export file
  const { readdirSync } = await import('fs')
  const backupDir = join(process.cwd(), 'server/database/backups')
  const files = readdirSync(backupDir)
  const referencesFile = files.find(file => file.startsWith('references-export-') && file.endsWith('.json'))

  if (!referencesFile) {
    throw new Error('No references export file found in backups directory')
  }

  // Load references backup file
  const backupPath = join(backupDir, referencesFile)
  const rawData = readFileSync(backupPath, 'utf-8')
  const references = JSON.parse(rawData)

  if (!Array.isArray(references)) {
    throw new Error('Invalid references export format: expected array')
  }

  const totalReferences = references.length

  let importedCount = 0

  // Update progress: starting references import
  if (importId) {
    updateStepProgress(importId, 'references', {
      status: 'processing',
      message: `Starting import of ${totalReferences} references...`,
      total: totalReferences,
      current: 0,
      imported: 0
    })
  }

  // Process in batches
  const batchSize = 50
  for (let i = 0; i < references.length; i += batchSize) {
    const batch = references.slice(i, i + batchSize)

    for (const [index, referenceData] of batch.entries()) {
      try {
        // D1 export data is already in the correct format, just need to handle optional fields
        await db.prepare(`
          INSERT INTO quote_references (
            name, original_language, release_date, description, primary_type, secondary_type,
            image_url, urls, views_count, likes_count, shares_count,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          referenceData.name || '',
          referenceData.original_language || 'en',
          referenceData.release_date || null,
          referenceData.description || '',
          referenceData.primary_type || 'other',
          referenceData.secondary_type || '',
          referenceData.image_url || '',
          JSON.stringify(referenceData.urls || []),
          referenceData.views_count || 0,
          referenceData.likes_count || 0,
          referenceData.shares_count || 0,
          referenceData.created_at || new Date().toISOString(),
          referenceData.updated_at || new Date().toISOString()
        ).run()

        importedCount++

        // Update progress periodically
        if (importId && importedCount % 10 === 0) {
          updateStepProgress(importId, 'references', {
            current: i + index + 1,
            imported: importedCount,
            message: `Imported ${importedCount} of ${totalReferences} references...`
          })
        }
      } catch (error) {
        console.error(`Failed to import reference ${referenceData.name || 'unknown'}:`, error)
        // Continue with other references
      }
    }
  }

  // Update progress: completed references import
  if (importId) {
    updateStepProgress(importId, 'references', {
      status: 'completed',
      message: `Successfully imported ${importedCount} references`,
      current: totalReferences,
      imported: importedCount
    })
  }

  return importedCount
}

/**
 * Import quotes from backup files
 */
async function importQuotesFromBackup(db: any, adminUserId: number, importId?: string): Promise<number> {
  const { readFileSync, readdirSync } = await import('fs')
  const { join } = await import('path')
  const { updateStepProgress } = await import('~/server/utils/onboarding-progress')

  // Find the latest quotes export file
  const backupDir = join(process.cwd(), 'server/database/backups')
  const files = readdirSync(backupDir)
  const quotesFile = files.find(file => file.startsWith('quotes-export-') && file.endsWith('.json'))

  if (!quotesFile) {
    throw new Error('No quotes export file found in backups directory')
  }

  // Load quotes backup file
  const backupPath = join(backupDir, quotesFile)
  const rawData = readFileSync(backupPath, 'utf-8')
  const quotes = JSON.parse(rawData)

  if (!Array.isArray(quotes)) {
    throw new Error('Invalid quotes export format: expected array')
  }

  const totalQuotes = quotes.length

  let importedCount = 0

  // Update progress: starting quotes import
  if (importId) {
    updateStepProgress(importId, 'quotes', {
      status: 'processing',
      message: `Starting import of ${totalQuotes} quotes...`,
      total: totalQuotes,
      current: 0,
      imported: 0
    })
  }

  // Process in batches
  const batchSize = 50
  for (let i = 0; i < quotes.length; i += batchSize) {
    const batch = quotes.slice(i, i + batchSize)

    for (const [index, quoteData] of batch.entries()) {
      try {
        // D1 export data is already in the correct format, just need to handle optional fields
        await db.prepare(`
          INSERT INTO quotes (
            name, language, author_id, reference_id, user_id, status,
            likes_count, shares_count, views_count, is_featured,
            created_at, updated_at, moderator_id, moderated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          quoteData.name || '',
          quoteData.language || 'en',
          quoteData.author_id || null,
          quoteData.reference_id || null,
          quoteData.user_id || adminUserId,
          quoteData.status || 'approved',
          quoteData.likes_count || 0,
          quoteData.shares_count || 0,
          quoteData.views_count || 0,
          quoteData.is_featured || false,
          quoteData.created_at || new Date().toISOString(),
          quoteData.updated_at || new Date().toISOString(),
          quoteData.moderator_id || adminUserId,
          quoteData.moderated_at || new Date().toISOString()
        ).run()

        importedCount++

        // Update progress periodically
        if (importId && importedCount % 25 === 0) {
          updateStepProgress(importId, 'quotes', {
            current: i + index + 1,
            imported: importedCount,
            message: `Imported ${importedCount} of ${totalQuotes} quotes...`
          })
        }
      } catch (error) {
        console.error(`Failed to import quote ${quoteData.name || 'unknown'}:`, error)
        // Continue with other quotes
      }
    }
  }

  // Update progress: completed quotes import
  if (importId) {
    updateStepProgress(importId, 'quotes', {
      status: 'completed',
      message: `Successfully imported ${importedCount} quotes`,
      current: totalQuotes,
      imported: importedCount
    })
  }

  return importedCount
}






