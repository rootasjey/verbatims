export default defineEventHandler(async (event) => {
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
    const adminUser = await db.prepare(`
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

    // Import data in order: authors -> references -> quotes
    const results = {
      authors: 0,
      references: 0,
      quotes: 0
    }

    // 1. Import Authors
    try {
      console.log('Importing authors...')
      results.authors = await importAuthorsFromBackup(db)
      console.log(`✅ Imported ${results.authors} authors`)
    } catch (error: any) {
      console.error('Failed to import authors:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to import authors: ${error.message}`
      })
    }

    // 2. Import References
    try {
      console.log('Importing references...')
      results.references = await importReferencesFromBackup(db)
      console.log(`✅ Imported ${results.references} references`)
    } catch (error: any) {
      console.error('Failed to import references:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to import references: ${error.message}`
      })
    }

    // 3. Import Quotes
    try {
      console.log('Importing quotes...')
      results.quotes = await importQuotesFromBackup(db, adminUser.id)
      console.log(`✅ Imported ${results.quotes} quotes`)
    } catch (error: any) {
      console.error('Failed to import quotes:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to import quotes: ${error.message}`
      })
    }

    const totalImported = results.authors + results.references + results.quotes
    console.log(`🎉 Database initialization completed! Total items imported: ${totalImported}`)

    return {
      success: true,
      message: 'Database initialized successfully',
      data: results
    }

  } catch (error: any) {
    console.error('Database initialization error:', error)
    
    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error
    }

    // Otherwise, create a generic error
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Failed to initialize database'
    })
  }
})

/**
 * Import authors from backup file
 */
async function importAuthorsFromBackup(db: any): Promise<number> {
  const { readFileSync } = await import('fs')
  const { join } = await import('path')

  // Load authors backup file
  const backupPath = join(process.cwd(), 'server/database/backups/authors-1752638847.json')
  const rawData = readFileSync(backupPath, 'utf-8')
  const firebaseData = JSON.parse(rawData)
  
  const authors = firebaseData.data || firebaseData
  const authorEntries = Object.entries(authors)
  
  let importedCount = 0
  
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
      } catch (error) {
        console.error(`Failed to import author ${firebaseId}:`, error)
        // Continue with other authors
      }
    }
  }
  
  return importedCount
}

/**
 * Import references from backup file
 */
async function importReferencesFromBackup(db: any): Promise<number> {
  const { readFileSync } = await import('fs')
  const { join } = await import('path')

  // Load references backup file
  const backupPath = join(process.cwd(), 'server/database/backups/references-1752639132.json')
  const rawData = readFileSync(backupPath, 'utf-8')
  const firebaseData = JSON.parse(rawData)
  
  const references = firebaseData.data || firebaseData
  const referenceEntries = Object.entries(references)
  
  let importedCount = 0
  
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
      } catch (error) {
        console.error(`Failed to import reference ${firebaseId}:`, error)
        // Continue with other references
      }
    }
  }
  
  return importedCount
}

/**
 * Import quotes from backup files
 */
async function importQuotesFromBackup(db: any, adminUserId: number): Promise<number> {
  const { readFileSync, readdirSync } = await import('fs')
  const { join } = await import('path')

  // Load all quotes backup files
  const backupDir = join(process.cwd(), 'server/database/backups')
  const quoteFiles = readdirSync(backupDir).filter(file => file.startsWith('quotes_part_') && file.endsWith('.json'))
  
  let importedCount = 0
  
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
        } catch (error) {
          console.error(`Failed to import quote ${firebaseId}:`, error)
          // Continue with other quotes
        }
      }
    }
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
