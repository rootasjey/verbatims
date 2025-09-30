import { User } from '#auth-utils'
import { generateImportId, initializeProgress, updateProgress, addError, updateStepProgress, addExtras } from '~/server/utils/onboarding-progress'

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

    // Parse multipart if provided to see if a ZIP is sent (enables importing users first)
    const contentType = getHeader(event, 'content-type') || ''
    const isMultipart = contentType.includes('multipart/form-data')
    let zipBytes: Uint8Array | null = null
    if (isMultipart) {
      const formData = await readMultipartFormData(event)
      const filePart = (formData || []).find(p => p.name === 'file' && p.type)
      if (filePart && filePart.data) {
        zipBytes = new Uint8Array(filePart.data)
      }
    }

    // Check if admin user exists unless we're importing users from ZIP
    let adminUser: User | null = await db.prepare(`
      SELECT id FROM users WHERE role = 'admin' LIMIT 1
    `).first()

    if (!adminUser && !zipBytes) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Admin user must be created or import a ZIP containing users first'
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
      processImportAsync(db, adminUser?.id || 0, importId, zipBytes)
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
  const results = await processImportSync(db, adminUser?.id || 0, importId, zipBytes)

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
async function processImportSync(db: any, adminUserId: number, importId: string, zipBytes?: Uint8Array | null) {
  const results = {
    users: 0,
    authors: 0,
    references: 0,
    tags: 0,
    quotes: 0
  }

  // Update overall status
  updateProgress(importId, { status: 'processing' })

  // If provided a ZIP, extract datasets
  let datasets: Record<string, any[]> | null = null
  if (zipBytes && zipBytes.byteLength > 0) {
    datasets = await extractDatasetsFromZip(zipBytes)
  }

  // 0. Import Users (if zip provides users)
  try {
    if (datasets?.users) {
      console.log('Importing users...')
      results.users = await importUsersFromDataset(db, importId, datasets.users)
      // Refresh adminUserId in case added via import
      const admin: User | null = await db.prepare(`SELECT id FROM users WHERE role='admin' LIMIT 1`).first()
      if (admin) adminUserId = admin.id
    }
  } catch (error: any) {
    console.error('Failed to import users:', error)
    addError(importId, `Failed to import users: ${error.message}`)
    throw createError({ statusCode: 500, statusMessage: `Failed to import users: ${error.message}` })
  }

  // 1. Import Authors
  try {
    console.log('Importing authors...')
    results.authors = datasets?.authors ?
      await importAuthorsFromDataset(db, importId, datasets.authors) :
      await importAuthorsFromBackup(db, importId)
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
    results.references = datasets?.references ?
      await importReferencesFromDataset(db, importId, datasets.references) :
      await importReferencesFromBackup(db, importId)
    console.log(`✅ Imported ${results.references} references`)
  } catch (error: any) {
    console.error('Failed to import references:', error)
    addError(importId, `Failed to import references: ${error.message}`)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to import references: ${error.message}`
    })
  }

  // 2.5 Import Tags (optional)
  try {
    if (datasets?.tags) {
      console.log('Importing tags...')
      results.tags = await importTagsFromDataset(db, importId, datasets.tags)
      console.log(`✅ Imported ${results.tags} tags`)
    }
  } catch (error: any) {
    console.error('Failed to import tags:', error)
    addError(importId, `Failed to import tags: ${error.message}`)
    throw createError({ statusCode: 500, statusMessage: `Failed to import tags: ${error.message}` })
  }

  // 3. Import Quotes
  try {
    console.log('Importing quotes...')
    results.quotes = datasets?.quotes ?
      await importQuotesFromDataset(db, adminUserId, importId, datasets.quotes) :
      await importQuotesFromBackup(db, adminUserId, importId)
    console.log(`✅ Imported ${results.quotes} quotes`)

    // 3.5 Import quote_tags relations if present in ZIP (after tags and quotes exist)
    if (datasets?.quote_tags && datasets.quote_tags.length > 0) {
      console.log('Importing quote_tags relations...')
      const linked = await importQuoteTagsFromDataset(db, importId, datasets.quote_tags)
      console.log(`✅ Linked ${linked} quote-tags relations`)
      // update progress message to reflect linking done under quotes step
      const { updateStepProgress } = await import('~/server/utils/onboarding-progress')
      updateStepProgress(importId, 'quotes', {
        message: `Imported ${results.quotes} quotes • Linked ${linked} tag relations`
      })
    }
  } catch (error: any) {
    console.error('Failed to import quotes:', error)
    addError(importId, `Failed to import quotes: ${error.message}`)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to import quotes: ${error.message}`
    })
  }

  // Keep the Quotes step active while importing related optional data
  updateStepProgress(importId, 'quotes', {
    status: 'processing',
    message: 'Importing related data: collections, likes, sessions/messages, analytics...'
  })

  // 4. Import user collections and relations (optional)
  try {
    if (datasets?.user_collections && datasets.user_collections.length > 0) {
      console.log('Importing user collections...')
      const count = await importUserCollectionsFromDataset(db, importId, datasets.user_collections)
      console.log(`✅ Imported ${count} user collections`)
      addExtras(importId, { user_collections: count })
    }

    if (datasets?.collection_quotes && datasets.collection_quotes.length > 0) {
      console.log('Linking collection_quotes...')
      const count = await importCollectionQuotesFromDataset(db, importId, datasets.collection_quotes)
      console.log(`✅ Linked ${count} collection-quote relations`)
      addExtras(importId, { collection_quotes: count })
    }
  } catch (error: any) {
    console.error('Failed to import collections:', error)
    // Soft-fail: continue import but record warning
    const { addWarning } = await import('~/server/utils/onboarding-progress')
    addWarning(importId, `Collection import issue: ${error.message}`)
  }

  // 5. Import likes (optional)
  try {
    if (datasets?.user_likes && datasets.user_likes.length > 0) {
      console.log('Importing user likes...')
      const count = await importUserLikesFromDataset(db, importId, datasets.user_likes)
      console.log(`✅ Imported ${count} user likes`)
      addExtras(importId, { user_likes: count })
    }
  } catch (error: any) {
    console.error('Failed to import user likes:', error)
    const { addWarning } = await import('~/server/utils/onboarding-progress')
    addWarning(importId, `User likes import issue: ${error.message}`)
  }

  // 6. Import sessions and messages (optional)
  try {
    if (datasets?.user_sessions && datasets.user_sessions.length > 0) {
      console.log('Importing user sessions...')
      const count = await importUserSessionsFromDataset(db, importId, datasets.user_sessions)
      console.log(`✅ Imported ${count} user sessions`)
      addExtras(importId, { user_sessions: count })
    }
    if (datasets?.user_messages && datasets.user_messages.length > 0) {
      console.log('Importing user messages...')
      const count = await importUserMessagesFromDataset(db, importId, datasets.user_messages)
      console.log(`✅ Imported ${count} user messages`)
      addExtras(importId, { user_messages: count })
    }
  } catch (error: any) {
    console.error('Failed to import sessions/messages:', error)
    const { addWarning } = await import('~/server/utils/onboarding-progress')
    addWarning(importId, `Sessions/messages import issue: ${error.message}`)
  }

  // 7. Moderation & analytics (optional)
  try {
    if (datasets?.quote_reports && datasets.quote_reports.length > 0) {
      console.log('Importing quote reports...')
      const count = await importQuoteReportsFromDataset(db, importId, datasets.quote_reports)
      console.log(`✅ Imported ${count} quote reports`)
      addExtras(importId, { quote_reports: count })
    }
    const analyticsCounts: string[] = []
    if (datasets?.quote_views && datasets.quote_views.length > 0) {
      const c = await importQuoteViewsFromDataset(db, importId, datasets.quote_views)
      analyticsCounts.push(`${c} quote views`)
      addExtras(importId, { quote_views: c })
    }
    if (datasets?.author_views && datasets.author_views.length > 0) {
      const c = await importAuthorViewsFromDataset(db, importId, datasets.author_views)
      analyticsCounts.push(`${c} author views`)
      addExtras(importId, { author_views: c })
    }
    if (datasets?.reference_views && datasets.reference_views.length > 0) {
      const c = await importReferenceViewsFromDataset(db, importId, datasets.reference_views)
      analyticsCounts.push(`${c} reference views`)
      addExtras(importId, { reference_views: c })
    }
    if (analyticsCounts.length) {
      const { updateStepProgress } = await import('~/server/utils/onboarding-progress')
      updateStepProgress(importId, 'quotes', { message: `Analytics imported: ${analyticsCounts.join(', ')}` })
    }
  } catch (error: any) {
    console.error('Failed to import moderation/analytics:', error)
    const { addWarning } = await import('~/server/utils/onboarding-progress')
    addWarning(importId, `Moderation/analytics import issue: ${error.message}`)
  }

  // Mark Quotes as completed after all related optional data is processed
  updateStepProgress(importId, 'quotes', {
    status: 'completed',
    message: 'Completed quotes and related data import'
  })

// ===== Additional dataset import helpers =====
async function importUserCollectionsFromDataset(db: any, importId: string, cols: any[]): Promise<number> {
  const { updateStepProgress } = await import('~/server/utils/onboarding-progress')
  let imported = 0
  updateStepProgress(importId, 'quotes', { message: `Importing ${cols.length} user collections...` })
  for (let i = 0; i < cols.length; i++) {
    const c = cols[i]
    try {
      await db.prepare(`
        INSERT INTO user_collections (user_id, name, description, is_public, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        c.user_id,
        c.name || 'My Collection',
        c.description || null,
        !!c.is_public,
        c.created_at || new Date().toISOString(),
        c.updated_at || new Date().toISOString()
      ).run()
      imported++
    } catch {}
  }
  updateStepProgress(importId, 'quotes', { message: `Imported ${imported} user collections` })
  return imported
}

async function importCollectionQuotesFromDataset(db: any, importId: string, rows: any[]): Promise<number> {
  const { updateStepProgress } = await import('~/server/utils/onboarding-progress')
  let imported = 0
  updateStepProgress(importId, 'quotes', { message: `Linking ${rows.length} collection-quote relations...` })
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    try {
      await db.prepare(`
        INSERT OR IGNORE INTO collection_quotes (collection_id, quote_id, added_at)
        VALUES (?, ?, ?)
      `).bind(r.collection_id, r.quote_id, r.added_at || new Date().toISOString()).run()
      imported++
    } catch {}
  }
  updateStepProgress(importId, 'quotes', { message: `Linked ${imported} collection-quote relations` })
  return imported
}

async function importUserLikesFromDataset(db: any, importId: string, likes: any[]): Promise<number> {
  const { updateStepProgress } = await import('~/server/utils/onboarding-progress')
  let imported = 0
  const allowed = new Set(['quote','author','reference'])
  updateStepProgress(importId, 'quotes', { message: `Importing ${likes.length} user likes...` })
  for (let i = 0; i < likes.length; i++) {
    const l = likes[i]
    if (!allowed.has((l.likeable_type || '').toString())) continue
    try {
      await db.prepare(`
        INSERT OR IGNORE INTO user_likes (user_id, likeable_type, likeable_id, created_at)
        VALUES (?, ?, ?, ?)
      `).bind(l.user_id, l.likeable_type, l.likeable_id, l.created_at || new Date().toISOString()).run()
      imported++
    } catch {}
  }
  updateStepProgress(importId, 'quotes', { message: `Imported ${imported} user likes` })
  return imported
}

async function importUserSessionsFromDataset(db: any, importId: string, sessions: any[]): Promise<number> {
  const { updateStepProgress } = await import('~/server/utils/onboarding-progress')
  let imported = 0
  updateStepProgress(importId, 'quotes', { message: `Importing ${sessions.length} user sessions...` })
  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i]
    try {
      await db.prepare(`
        INSERT OR IGNORE INTO user_sessions (user_id, session_token, expires_at, created_at)
        VALUES (?, ?, ?, ?)
      `).bind(
        s.user_id,
        s.session_token,
        s.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        s.created_at || new Date().toISOString()
      ).run()
      imported++
    } catch {}
  }
  updateStepProgress(importId, 'quotes', { message: `Imported ${imported} user sessions` })
  return imported
}

async function importUserMessagesFromDataset(db: any, importId: string, msgs: any[]): Promise<number> {
  const { updateStepProgress } = await import('~/server/utils/onboarding-progress')
  let imported = 0
  const allowedCat = new Set(['bug','feature','feedback','content','other'])
  const allowedTarget = new Set(['general','quote','author','reference'])
  const allowedStatus = new Set(['new','triaged','spam','resolved'])
  updateStepProgress(importId, 'quotes', { message: `Importing ${msgs.length} user messages...` })
  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i]
    try {
      const category = allowedCat.has(m.category) ? m.category : 'other'
      const target_type = allowedTarget.has(m.target_type) ? m.target_type : 'general'
      const status = allowedStatus.has(m.status) ? m.status : 'new'
      await db.prepare(`
        INSERT INTO user_messages (
          user_id, name, email, category, tags, message, target_type, target_id,
          ip_address, user_agent, status, reviewed_by, reviewed_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        m.user_id || null,
        m.name || null,
        m.email || null,
        category,
        JSON.stringify(m.tags || []),
        m.message || '',
        target_type,
        m.target_id || null,
        m.ip_address || null,
        m.user_agent || null,
        status,
        m.reviewed_by || null,
        m.reviewed_at || null,
        m.created_at || new Date().toISOString()
      ).run()
      imported++
    } catch {}
  }
  updateStepProgress(importId, 'quotes', { message: `Imported ${imported} user messages` })
  return imported
}

async function importQuoteReportsFromDataset(db: any, importId: string, reports: any[]): Promise<number> {
  const { updateStepProgress } = await import('~/server/utils/onboarding-progress')
  let imported = 0
  const allowedReason = new Set(['spam','inappropriate','copyright','misinformation','other'])
  const allowedStatus = new Set(['pending','reviewed','resolved'])
  updateStepProgress(importId, 'quotes', { message: `Importing ${reports.length} quote reports...` })
  for (let i = 0; i < reports.length; i++) {
    const r = reports[i]
    try {
      const reason = allowedReason.has(r.reason) ? r.reason : 'other'
      const status = allowedStatus.has(r.status) ? r.status : 'pending'
      await db.prepare(`
        INSERT INTO quote_reports (
          quote_id, reporter_id, reason, description, status, reviewed_by, reviewed_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        r.quote_id,
        r.reporter_id,
        reason,
        r.description || null,
        status,
        r.reviewed_by || null,
        r.reviewed_at || null,
        r.created_at || new Date().toISOString()
      ).run()
      imported++
    } catch {}
  }
  updateStepProgress(importId, 'quotes', { message: `Imported ${imported} quote reports` })
  return imported
}

async function importQuoteViewsFromDataset(db: any, importId: string, views: any[]): Promise<number> {
  const { updateStepProgress } = await import('~/server/utils/onboarding-progress')
  let imported = 0
  updateStepProgress(importId, 'quotes', { message: `Importing ${views.length} quote views...` })
  for (let i = 0; i < views.length; i++) {
    const v = views[i]
    try {
      await db.prepare(`
        INSERT INTO quote_views (quote_id, user_id, ip_address, user_agent, viewed_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        v.quote_id,
        v.user_id || null,
        v.ip_address || null,
        v.user_agent || null,
        v.viewed_at || new Date().toISOString()
      ).run()
      imported++
    } catch {}
  }
  updateStepProgress(importId, 'quotes', { message: `Imported ${imported} quote views` })
  return imported
}

async function importAuthorViewsFromDataset(db: any, importId: string, views: any[]): Promise<number> {
  const { updateStepProgress } = await import('~/server/utils/onboarding-progress')
  let imported = 0
  updateStepProgress(importId, 'quotes', { message: `Importing ${views.length} author views...` })
  for (let i = 0; i < views.length; i++) {
    const v = views[i]
    try {
      await db.prepare(`
        INSERT INTO author_views (author_id, user_id, ip_address, user_agent, viewed_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        v.author_id,
        v.user_id || null,
        v.ip_address || null,
        v.user_agent || null,
        v.viewed_at || new Date().toISOString()
      ).run()
      imported++
    } catch {}
  }
  updateStepProgress(importId, 'quotes', { message: `Imported ${imported} author views` })
  return imported
}

async function importReferenceViewsFromDataset(db: any, importId: string, views: any[]): Promise<number> {
  const { updateStepProgress } = await import('~/server/utils/onboarding-progress')
  let imported = 0
  updateStepProgress(importId, 'quotes', { message: `Importing ${views.length} reference views...` })
  for (let i = 0; i < views.length; i++) {
    const v = views[i]
    try {
      await db.prepare(`
        INSERT INTO reference_views (reference_id, user_id, ip_address, user_agent, viewed_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        v.reference_id,
        v.user_id || null,
        v.ip_address || null,
        v.user_agent || null,
        v.viewed_at || new Date().toISOString()
      ).run()
      imported++
    } catch {}
  }
  updateStepProgress(importId, 'quotes', { message: `Imported ${imported} reference views` })
  return imported
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
async function processImportAsync(db: any, adminUserId: number, importId: string, zipBytes?: Uint8Array | null) {
  try {
    await processImportSync(db, adminUserId, importId, zipBytes)
  } catch (error: any) {
    console.error('Async import failed:', error)
    addError(importId, `Import failed: ${error.message}`)
    throw error
  }
}

// Extract datasets from a zip buffer; expects filenames like users.json, authors.json, references.json, tags.json, quotes.json, quote_tags.json etc.
async function extractDatasetsFromZip(zipBytes: Uint8Array): Promise<Record<string, any[]>> {
  const { unzipSync } = await import('fflate')
  const result: Record<string, any[]> = {}
  try {
    const files = unzipSync(zipBytes)
    const dec = new TextDecoder()
    const read = (name: string): any[] | null => {
      const entry = Object.keys(files).find(k => k.toLowerCase() === name)
      if (!entry) return null
      try {
        const text = dec.decode(files[entry])
        const parsed = JSON.parse(text)
        return Array.isArray(parsed) ? parsed : null
      } catch { return null }
    }

    const candidates = [
      'users.json',
      'authors.json',
      'references.json',
      'tags.json',
      'quotes.json',
      'quote_tags.json',
      'user_collections.json',
      'collection_quotes.json',
      'user_likes.json',
      'user_sessions.json',
      'user_messages.json',
      'quote_reports.json',
      'quote_views.json',
      'author_views.json',
      'reference_views.json'
    ]
    for (const c of candidates) {
      const data = read(c)
      if (data) {
        result[c.replace('.json','')] = data
      }
    }
  } catch (e) {
    console.error('Failed to unzip provided archive', e)
  }
  return result
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
  let skippedCount = 0

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
        // Sanitize inputs defensively to avoid enum/constraint errors
        const allowedStatuses = new Set(['draft','pending','approved','rejected'])
        const allowedLanguages = new Set(['en','fr','es','de','it','pt','ru','ja','zh'])
        const str = (v: any) => typeof v === 'string' ? v.trim() : ''
        const toInt = (v: any) => {
          if (v === null || v === undefined || v === '') return null
          const n = Number(v)
          return Number.isFinite(n) ? Math.trunc(n) : null
        }
        const toNonNeg = (v: any) => {
          const n = toInt(v)
          return n == null ? 0 : Math.max(0, n)
        }
        const toBool = (v: any) => {
          if (typeof v === 'boolean') return v
          if (typeof v === 'number') return v === 1
          if (typeof v === 'string') {
            const s = v.trim().toLowerCase()
            if (['1','true','yes','y'].includes(s)) return true
            if (['0','false','no','n'].includes(s)) return false
          }
          return !!v
        }

        const language = allowedLanguages.has(str(quoteData.language).toLowerCase())
          ? str(quoteData.language).toLowerCase()
          : 'en'
        const status = allowedStatuses.has(str(quoteData.status).toLowerCase())
          ? str(quoteData.status).toLowerCase()
          : 'approved'
        const authorId = toInt(quoteData.author_id)
        const referenceId = toInt(quoteData.reference_id)
        const userId = toInt(quoteData.user_id) ?? adminUserId
        const likes = toNonNeg(quoteData.likes_count)
        const shares = toNonNeg(quoteData.shares_count)
        const views = toNonNeg(quoteData.views_count)
        const isFeatured = toBool(quoteData.is_featured)
        const createdAt = quoteData.created_at || new Date().toISOString()
        const updatedAt = quoteData.updated_at || new Date().toISOString()
        const moderatorId = toInt(quoteData.moderator_id) ?? adminUserId
        const moderatedAt = quoteData.moderated_at || new Date().toISOString()

        // Insert
        await db.prepare(`
          INSERT INTO quotes (
            name, language, author_id, reference_id, user_id, status,
            likes_count, shares_count, views_count, is_featured,
            created_at, updated_at, moderator_id, moderated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          quoteData.name || '',
          language,
          authorId,
          referenceId,
          userId,
          status,
          likes,
          shares,
          views,
          isFeatured,
          createdAt,
          updatedAt,
          moderatorId,
          moderatedAt
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
      } catch (error: any) {
        console.error(`Failed to import quote ${quoteData.name || 'unknown'}:`, error)
        skippedCount++
        if (importId) {
          const { addWarning } = await import('~/server/utils/onboarding-progress')
          addWarning(importId, `Quote ${i + index + 1} "${String(quoteData.name || '').slice(0,80)}" skipped: ${error?.message || 'unknown error'}`)
        }
      }
    }
  }

  // Update progress: completed quotes import
  if (importId) {
    updateStepProgress(importId, 'quotes', {
      status: 'completed',
      message: `Imported ${importedCount}/${totalQuotes} quotes${skippedCount ? ` • Skipped ${skippedCount}` : ''}`,
      current: totalQuotes,
      imported: importedCount
    })
  }

  return importedCount
}

// Dataset-based import helpers (JSON arrays already parsed)
async function importUsersFromDataset(db: any, importId: string, users: any[]): Promise<number> {
  const { updateStepProgress } = await import('~/server/utils/onboarding-progress')
  const total = users.length
  let imported = 0
  updateStepProgress(importId, 'users', { status: 'processing', total, current: 0, imported: 0, message: `Importing ${total} users...` })
  for (let i = 0; i < users.length; i++) {
    const u = users[i]
    try {
      await db.prepare(`
        INSERT INTO users (email, name, password, avatar_url, role, is_active, email_verified, biography, job, language, location, socials, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        u.email || '',
        u.name || '',
        u.password || '',
        u.avatar_url || null,
        u.role || 'user',
        u.is_active !== false,
        !!u.email_verified,
        u.biography || null,
        u.job || null,
        u.language || 'en',
        u.location || 'On Earth',
        JSON.stringify(u.socials || []),
        u.created_at || new Date().toISOString(),
        u.updated_at || new Date().toISOString()
      ).run()
      imported++
      if (imported % 10 === 0) updateStepProgress(importId, 'users', { current: i + 1, imported, message: `Imported ${imported}/${total} users` })
    } catch (e) {
      // continue on duplicates/errors
    }
  }
  updateStepProgress(importId, 'users', { status: 'completed', current: total, imported, message: `Imported ${imported} users` })
  return imported
}

async function importAuthorsFromDataset(db: any, importId: string, authors: any[]): Promise<number> {
  const { updateStepProgress } = await import('~/server/utils/onboarding-progress')
  const total = authors.length
  let imported = 0
  updateStepProgress(importId, 'authors', { status: 'processing', total, current: 0, imported: 0, message: `Importing ${total} authors...` })
  for (let i = 0; i < authors.length; i++) {
    const a = authors[i]
    try {
      await db.prepare(`
        INSERT INTO authors (
          name, description, birth_date, death_date, birth_location, job,
          image_url, is_fictional, views_count, likes_count, shares_count,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        a.name || '', a.description || '', a.birth_date || null, a.death_date || null, a.birth_location || '', a.job || '',
        a.image_url || '', !!a.is_fictional, a.views_count || 0, a.likes_count || 0, a.shares_count || 0,
        a.created_at || new Date().toISOString(), a.updated_at || new Date().toISOString()
      ).run()
      imported++
      if (imported % 10 === 0) updateStepProgress(importId, 'authors', { current: i + 1, imported, message: `Imported ${imported}/${total} authors` })
    } catch {}
  }
  updateStepProgress(importId, 'authors', { status: 'completed', current: total, imported, message: `Imported ${imported} authors` })
  return imported
}

async function importReferencesFromDataset(db: any, importId: string, refs: any[]): Promise<number> {
  const { updateStepProgress } = await import('~/server/utils/onboarding-progress')
  const total = refs.length
  let imported = 0
  updateStepProgress(importId, 'references', { status: 'processing', total, current: 0, imported: 0, message: `Importing ${total} references...` })
  for (let i = 0; i < refs.length; i++) {
    const r = refs[i]
    try {
      await db.prepare(`
        INSERT INTO quote_references (
          name, original_language, release_date, description, primary_type, secondary_type,
          image_url, urls, views_count, likes_count, shares_count,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        r.name || '', r.original_language || 'en', r.release_date || null, r.description || '', r.primary_type || 'other', r.secondary_type || '',
        r.image_url || '', JSON.stringify(r.urls || []), r.views_count || 0, r.likes_count || 0, r.shares_count || 0,
        r.created_at || new Date().toISOString(), r.updated_at || new Date().toISOString()
      ).run()
      imported++
      if (imported % 10 === 0) updateStepProgress(importId, 'references', { current: i + 1, imported, message: `Imported ${imported}/${total} references` })
    } catch {}
  }
  updateStepProgress(importId, 'references', { status: 'completed', current: total, imported, message: `Imported ${imported} references` })
  return imported
}

async function importTagsFromDataset(db: any, importId: string, tags: any[]): Promise<number> {
  const { updateStepProgress } = await import('~/server/utils/onboarding-progress')
  const total = tags.length
  let imported = 0
  updateStepProgress(importId, 'tags', { status: 'processing', total, current: 0, imported: 0, message: `Importing ${total} tags...` })
  for (let i = 0; i < tags.length; i++) {
    const t = tags[i]
    try {
      await db.prepare(`
        INSERT INTO tags (name, description, category, color, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        t.name || '', t.description || null, t.category || null, t.color || '#3B82F6', t.created_at || new Date().toISOString(), t.updated_at || new Date().toISOString()
      ).run()
      imported++
      if (imported % 25 === 0) updateStepProgress(importId, 'tags', { current: i + 1, imported, message: `Imported ${imported}/${total} tags` })
    } catch {}
  }
  updateStepProgress(importId, 'tags', { status: 'completed', current: total, imported, message: `Imported ${imported} tags` })
  return imported
}

async function importQuotesFromDataset(db: any, adminUserId: number, importId: string, quotes: any[]): Promise<number> {
  const { updateStepProgress } = await import('~/server/utils/onboarding-progress')
  const total = quotes.length
  let imported = 0
  let skipped = 0
  updateStepProgress(importId, 'quotes', { status: 'processing', total, current: 0, imported: 0, message: `Importing ${total} quotes...` })
  for (let i = 0; i < quotes.length; i++) {
    const q = quotes[i]
    try {
      const allowedStatuses = new Set(['draft','pending','approved','rejected'])
      const allowedLanguages = new Set(['en','fr','es','de','it','pt','ru','ja','zh'])
      const str = (v: any) => typeof v === 'string' ? v.trim() : ''
      const toInt = (v: any) => {
        if (v === null || v === undefined || v === '') return null
        const n = Number(v)
        return Number.isFinite(n) ? Math.trunc(n) : null
      }
      const toNonNeg = (v: any) => {
        const n = toInt(v)
        return n == null ? 0 : Math.max(0, n)
      }
      const toBool = (v: any) => {
        if (typeof v === 'boolean') return v
        if (typeof v === 'number') return v === 1
        if (typeof v === 'string') {
          const s = v.trim().toLowerCase()
          if (['1','true','yes','y'].includes(s)) return true
          if (['0','false','no','n'].includes(s)) return false
        }
        return !!v
      }

      const language = allowedLanguages.has(str(q.language).toLowerCase()) ? str(q.language).toLowerCase() : 'en'
      const status = allowedStatuses.has(str(q.status).toLowerCase()) ? str(q.status).toLowerCase() : 'approved'
      const authorId = toInt(q.author_id)
      const referenceId = toInt(q.reference_id)
  const userId = toInt(q.user_id) ?? (adminUserId ?? 1)
      const likes = toNonNeg(q.likes_count)
      const shares = toNonNeg(q.shares_count)
      const views = toNonNeg(q.views_count)
      const isFeatured = toBool(q.is_featured)
      const createdAt = q.created_at || new Date().toISOString()
      const updatedAt = q.updated_at || new Date().toISOString()
  const moderatorId = toInt(q.moderator_id) ?? adminUserId
      const moderatedAt = q.moderated_at || new Date().toISOString()

      await db.prepare(`
        INSERT INTO quotes (
          name, language, author_id, reference_id, user_id, status,
          likes_count, shares_count, views_count, is_featured,
          created_at, updated_at, moderator_id, moderated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        q.name || '', language, authorId, referenceId,
        userId, status, likes, shares, views, isFeatured,
        createdAt, updatedAt, moderatorId, moderatedAt
      ).run()
      imported++
      if (imported % 25 === 0) updateStepProgress(importId, 'quotes', { current: i + 1, imported, message: `Imported ${imported}/${total} quotes` })
    } catch (e: any) {
      skipped++
      const { addWarning } = await import('~/server/utils/onboarding-progress')
      addWarning(importId, `Quote ${i + 1} "${String(q.name || '').slice(0,80)}" skipped: ${e?.message || 'unknown error'}`)
    }
  }
  updateStepProgress(importId, 'quotes', { status: 'completed', current: total, imported, message: `Imported ${imported}/${total} quotes${skipped ? ` • Skipped ${skipped}` : ''}` })
  return imported
}

// Link quotes to tags from dataset of pairs: { quote_id, tag_id }
async function importQuoteTagsFromDataset(db: any, importId: string, quoteTags: any[]): Promise<number> {
  const { updateStepProgress } = await import('~/server/utils/onboarding-progress')
  const total = quoteTags.length
  let imported = 0
  // Reuse quotes step progress to avoid adding a separate stage
  updateStepProgress(importId, 'quotes', {
    message: `Linking ${total} quote-tag relations...`
  })

  for (let i = 0; i < quoteTags.length; i++) {
    const qt = quoteTags[i]
    try {
      if (qt && (qt.quote_id != null) && (qt.tag_id != null)) {
        await db.prepare(`
          INSERT OR IGNORE INTO quote_tags (quote_id, tag_id) VALUES (?, ?)
        `).bind(qt.quote_id, qt.tag_id).run()
        imported++
        if (imported % 50 === 0) {
          updateStepProgress(importId, 'quotes', {
            message: `Linked ${imported}/${total} quote-tag relations...`
          })
        }
      }
    } catch {
      // ignore and continue
    }
  }

  updateStepProgress(importId, 'quotes', {
    message: `Linked ${imported} quote-tag relations`
  })
  return imported
}






