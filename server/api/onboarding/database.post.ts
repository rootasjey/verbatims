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

  // Load authors backup file
  const backupPath = join(process.cwd(), 'server/database/backups/authors-1752638847.json')
  const rawData = readFileSync(backupPath, 'utf-8')
  const firebaseData = JSON.parse(rawData)

  const authors = firebaseData.data || firebaseData
  const authorEntries = Object.entries(authors)
  const totalAuthors = authorEntries.length

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
  for (let i = 0; i < authorEntries.length; i += batchSize) {
    const batch = authorEntries.slice(i, i + batchSize)

    for (const [firebaseId, authorData] of batch) {
      try {
        const transformedAuthor = transformAuthorData(authorData as any)

        await db.prepare(`
          INSERT INTO authors (
            name, description, birth_date, death_date, birth_location, job,
            image_url, is_fictional, views_count, likes_count, shares_count,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          transformedAuthor.name,
          transformedAuthor.description,
          transformedAuthor.birth_date,
          transformedAuthor.death_date,
          transformedAuthor.birth_location,
          transformedAuthor.job,
          transformedAuthor.image_url,
          transformedAuthor.is_fictional,
          transformedAuthor.views_count,
          transformedAuthor.likes_count,
          transformedAuthor.shares_count,
          transformedAuthor.created_at,
          transformedAuthor.updated_at
        ).run()

        importedCount++

        // Update progress periodically
        if (importId && importedCount % 10 === 0) {
          updateStepProgress(importId, 'authors', {
            current: i + batch.indexOf([firebaseId, authorData]) + 1,
            imported: importedCount,
            message: `Imported ${importedCount} of ${totalAuthors} authors...`
          })
        }
      } catch (error) {
        console.error(`Failed to import author ${firebaseId}:`, error)
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

  // Load references backup file
  const backupPath = join(process.cwd(), 'server/database/backups/references-1752639132.json')
  const rawData = readFileSync(backupPath, 'utf-8')
  const firebaseData = JSON.parse(rawData)

  const references = firebaseData.data || firebaseData
  const referenceEntries = Object.entries(references)
  const totalReferences = referenceEntries.length

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
  for (let i = 0; i < referenceEntries.length; i += batchSize) {
    const batch = referenceEntries.slice(i, i + batchSize)

    for (const [firebaseId, referenceData] of batch) {
      try {
        const transformedReference = transformReferenceData(referenceData as any)

        await db.prepare(`
          INSERT INTO quote_references (
            name, original_language, release_date, description, primary_type, secondary_type,
            image_url, urls, views_count, likes_count, shares_count,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          transformedReference.name,
          transformedReference.original_language,
          transformedReference.release_date,
          transformedReference.description,
          transformedReference.primary_type,
          transformedReference.secondary_type,
          transformedReference.image_url,
          transformedReference.urls,
          transformedReference.views_count,
          transformedReference.likes_count,
          transformedReference.shares_count,
          transformedReference.created_at,
          transformedReference.updated_at
        ).run()

        importedCount++

        // Update progress periodically
        if (importId && importedCount % 10 === 0) {
          updateStepProgress(importId, 'references', {
            current: i + batch.indexOf([firebaseId, referenceData]) + 1,
            imported: importedCount,
            message: `Imported ${importedCount} of ${totalReferences} references...`
          })
        }
      } catch (error) {
        console.error(`Failed to import reference ${firebaseId}:`, error)
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

  // Load all quotes backup files
  const backupDir = join(process.cwd(), 'server/database/backups')
  const quoteFiles = readdirSync(backupDir).filter(file => file.startsWith('quotes_part_') && file.endsWith('.json'))

  // Calculate total quotes across all files
  let totalQuotes = 0
  const fileQuoteCounts: { [filename: string]: number } = {}

  for (const filename of quoteFiles) {
    const backupPath = join(backupDir, filename)
    const rawData = readFileSync(backupPath, 'utf-8')
    const firebaseData = JSON.parse(rawData)
    const quotes = firebaseData.data || firebaseData
    const count = Object.keys(quotes).length
    fileQuoteCounts[filename] = count
    totalQuotes += count
  }

  let importedCount = 0
  let processedCount = 0

  // Update progress: starting quotes import
  if (importId) {
    updateStepProgress(importId, 'quotes', {
      status: 'processing',
      message: `Starting import of ${totalQuotes} quotes from ${quoteFiles.length} files...`,
      total: totalQuotes,
      current: 0,
      imported: 0
    })
  }

  for (const filename of quoteFiles) {
    const backupPath = join(backupDir, filename)
    const rawData = readFileSync(backupPath, 'utf-8')
    const firebaseData = JSON.parse(rawData)

    const quotes = firebaseData.data || firebaseData
    const quoteEntries = Object.entries(quotes)

    // Process in batches
    const batchSize = 50
    for (let i = 0; i < quoteEntries.length; i += batchSize) {
      const batch = quoteEntries.slice(i, i + batchSize)

      for (const [firebaseId, quoteData] of batch) {
        try {
          const transformedQuote = await transformQuoteData(quoteData as any, db, adminUserId)

          await db.prepare(`
            INSERT INTO quotes (
              name, language, author_id, reference_id, user_id, status,
              likes_count, shares_count, views_count, is_featured,
              created_at, updated_at, moderator_id, moderated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            transformedQuote.name,
            transformedQuote.language,
            transformedQuote.author_id,
            transformedQuote.reference_id,
            transformedQuote.user_id,
            transformedQuote.status,
            transformedQuote.likes_count,
            transformedQuote.shares_count,
            transformedQuote.views_count,
            transformedQuote.is_featured,
            transformedQuote.created_at,
            transformedQuote.updated_at,
            transformedQuote.moderator_id,
            transformedQuote.moderated_at
          ).run()

          importedCount++
          processedCount++

          // Update progress periodically
          if (importId && processedCount % 25 === 0) {
            updateStepProgress(importId, 'quotes', {
              current: processedCount,
              imported: importedCount,
              message: `Imported ${importedCount} of ${totalQuotes} quotes (processing ${filename})...`
            })
          }
        } catch (error) {
          console.error(`Failed to import quote ${firebaseId}:`, error)
          processedCount++
          // Continue with other quotes
        }
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

/**
 * Transform Firebase author data to SQL format
 */
function transformAuthorData(firebaseRecord: any) {
  return {
    name: (firebaseRecord.name || '').trim().substring(0, 100), // Schema limit is 100
    description: firebaseRecord.summary || '', // Changed from 'bio' to 'description'
    birth_date: transformDate(firebaseRecord.birth?.date),
    death_date: transformDate(firebaseRecord.death?.date),
    birth_location: transformNationality(firebaseRecord.birth), // Changed from 'nationality' to 'birth_location'
    job: firebaseRecord.job || '',
    image_url: firebaseRecord.urls?.image || '',
    is_fictional: firebaseRecord.is_fictional || false,
    views_count: 0,
    likes_count: 0, // Added likes_count
    shares_count: 0, // Added shares_count
    created_at: transformDate(firebaseRecord.created_at) || new Date().toISOString(),
    updated_at: transformDate(firebaseRecord.updated_at) || new Date().toISOString()
  }
}

/**
 * Transform Firebase reference data to SQL format
 */
function transformReferenceData(firebaseRecord: any) {
  return {
    name: (firebaseRecord.name || '').trim().substring(0, 200),
    original_language: firebaseRecord.language || 'en',
    release_date: transformDate(firebaseRecord.release?.original),
    description: firebaseRecord.summary || '',
    primary_type: normalizePrimaryType(firebaseRecord.type?.primary || 'other'),
    secondary_type: firebaseRecord.type?.secondary || '',
    image_url: firebaseRecord.urls?.image || '',
    urls: JSON.stringify(firebaseRecord.urls || {}),
    views_count: 0,
    likes_count: 0,
    shares_count: 0,
    created_at: transformDate(firebaseRecord.created_at) || new Date().toISOString(),
    updated_at: transformDate(firebaseRecord.updated_at) || new Date().toISOString()
  }
}

/**
 * Transform Firebase quote data to SQL format
 */
async function transformQuoteData(firebaseRecord: any, db: any, adminUserId: number) {
  // Find author by name
  let authorId = null
  if (firebaseRecord.author?.name) {
    const author = await db.prepare(`
      SELECT id FROM authors WHERE name = ? LIMIT 1
    `).bind(firebaseRecord.author.name).first()
    authorId = author?.id || null
  }

  // Find reference by name
  let referenceId = null
  if (firebaseRecord.reference?.name) {
    const reference = await db.prepare(`
      SELECT id FROM quote_references WHERE name = ? LIMIT 1
    `).bind(firebaseRecord.reference.name).first()
    referenceId = reference?.id || null
  }

  return {
    name: (firebaseRecord.name || '').trim(),
    language: firebaseRecord.language || 'en',
    author_id: authorId,
    reference_id: referenceId,
    user_id: adminUserId,
    status: 'approved',
    likes_count: firebaseRecord.metrics?.likes || 0,
    shares_count: firebaseRecord.metrics?.shares || 0,
    views_count: 0,
    is_featured: false,
    created_at: transformDate(firebaseRecord.created_at) || new Date().toISOString(),
    updated_at: transformDate(firebaseRecord.updated_at) || new Date().toISOString(),
    moderator_id: adminUserId,
    moderated_at: new Date().toISOString()
  }
}

/**
 * Transform Firebase date to ISO string
 */
function transformDate(dateField: any): string | null {
  if (!dateField) return null
  
  if (dateField.__time__) {
    return new Date(dateField.__time__).toISOString()
  }
  
  if (typeof dateField === 'string') {
    return new Date(dateField).toISOString()
  }
  
  if (typeof dateField === 'number') {
    return new Date(dateField).toISOString()
  }
  
  return null
}

/**
 * Transform nationality from birth data
 */
function transformNationality(birthData: any): string {
  if (!birthData) return ''
  
  const parts = []
  if (birthData.city) parts.push(birthData.city)
  if (birthData.country) parts.push(birthData.country)
  
  return parts.join(', ')
}

/**
 * Normalize primary type for references
 * Must match schema CHECK constraint: ('film', 'book', 'tv_series', 'music', 'speech', 'podcast', 'interview', 'documentary', 'media_stream', 'writings', 'video_game', 'other')
 */
function normalizePrimaryType(type: string): string {
  if (!type) return 'other'

  const normalizedType = type.toLowerCase().trim()

  // Direct mappings to valid schema values
  const typeMap: Record<string, string> = {
    // TV/Film
    'tv series': 'tv_series',
    'tv_series': 'tv_series',
    'television': 'tv_series',
    'film': 'film',
    'movie': 'film',
    'cinema': 'film',

    // Literature
    'book': 'book',
    'novel': 'book',
    'play': 'writings',
    'poem': 'writings',
    'poetry': 'writings',
    'writings': 'writings',
    'literature': 'writings',

    // Audio/Music
    'music': 'music',
    'song': 'music',
    'album': 'music',
    'podcast': 'podcast',
    'speech': 'speech',
    'interview': 'interview',

    // Digital/Media
    'youtube': 'media_stream',
    'video': 'media_stream',
    'media_stream': 'media_stream',
    'documentary': 'documentary',
    'video_game': 'video_game',
    'game': 'video_game',

    // Other
    'conference': 'speech',
    'post': 'writings',
    'other': 'other'
  }

  // Return mapped value or default to 'other'
  return typeMap[normalizedType] || 'other'
}
