import { User } from '#auth-utils'

export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    if (!session || !session.user) throwServer(401, 'Authentication required')
    if (session.user.role !== 'admin' && session.user.role !== 'moderator') throwServer(403, 'Admin or moderator role required.')
  } catch (e) {
    // If getUserSession or the check throws a createError-like object, rethrow so Nuxt handles it
    if (e && (e as any).statusCode) throw e
    throwServer(401, 'Authentication required')
  }

  // Check if this is a request for async processing
  const query = getQuery(event)
  let isAsync = query.async === 'true'

  try {
    const db = hubDatabase(); if (!db) throwServer(500, 'Database not available')

    try { await db.prepare('SELECT 1 FROM users LIMIT 1').first() }
    catch (error) {
      // Database tables don't exist, initialize them first
      const initSuccess = await initializeDatabase()
      if (!initSuccess) throwServer(500, 'Failed to initialize database schema')
    }

    // Parse multipart if provided to see if a ZIP is sent (enables importing users first)
    const contentType = getHeader(event, 'content-type') || ''
    const isMultipart = contentType.includes('multipart/form-data')
    let zipBytes: Uint8Array | null = null
    let preloadedDatasets: Record<string, any[]> | null = null
    
    if (isMultipart) {
      const formData = await readMultipartFormData(event)
      const filePart = (formData || []).find(p => p.name === 'file' && p.type)
      const asyncPart = (formData || []).find(p => p.name === 'async')
      if (!isAsync && asyncPart && asyncPart.data) {
        try { isAsync = new TextDecoder().decode(asyncPart.data).trim() === 'true' } catch {}
      }
      if (filePart && filePart.data) {
        const filename = (filePart as any).filename || ''
        const mime = filePart.type || ''
        const bytes = new Uint8Array(filePart.data)
        if (mime.includes('zip') || filename.toLowerCase().endsWith('.zip')) {
          zipBytes = bytes
        } else if (mime.includes('json') || filename.toLowerCase().endsWith('.json')) {
          try {
            const text = new TextDecoder().decode(bytes)
            const parsed = JSON.parse(text)
            if (!Array.isArray(parsed)) {
              throw new Error('Uploaded JSON must be an array of objects')
            }
            // Only support single quotes.json upload for onboarding
            preloadedDatasets = { quotes: parsed }
          } catch (e: any) {
            throwServer(400, `Invalid JSON file: ${e?.message || 'parse error'}`)
          }
        }
      }
    }

    // Enforce explicit import source: require an uploaded file (ZIP or quotes.json).
    // We no longer auto-import from repository backups in onboarding.
    if (!zipBytes && !preloadedDatasets) {
      throwServer(400, 'Please upload a ZIP (full export) or a quotes.json file. No default backups are used.')
    }

    // Check if admin user exists unless we're importing users from ZIP
    let adminUser: User | null = await db.prepare(`
      SELECT id FROM users WHERE role = 'admin' LIMIT 1
    `).first()

    if (!adminUser && !zipBytes) {
      throwServer(400, 'Admin user must be created or import a ZIP containing users first')
    }

    // Check if data already exists
    const existingQuotes = await db.prepare('SELECT COUNT(*) as count FROM quotes').first()
    if (Number(existingQuotes?.count) > 0) {
      throwServer(409, 'Database already contains data')
    }

    console.log('Starting database initialization with uploaded data...')

    // Generate import ID and initialize progress tracking
    const importId = generateImportId()
    initializeProgress(importId)

    // If async mode, start processing in background and return import ID
    if (isAsync) {
      // Start processing asynchronously; keep worker alive with waitUntil on Cloudflare
      const runJob = () => processImportAsync(db, adminUser?.id || 0, importId, zipBytes, preloadedDatasets || undefined)
        .catch(error => {
          console.error('Async import failed:', error)
          addError(importId, `Import failed: ${error.message}`)
        })

      const { scheduleBackground } = await import('~/server/utils/schedule')
      scheduleBackground(event, runJob)

      return {
        success: true,
        importId,
        message: 'Import started successfully',
        progressUrl: `/api/onboarding/progress/${importId}`
      }
    }

    // Synchronous processing (legacy mode)
    const results = await processImportSync(db, adminUser?.id || 0, importId, zipBytes, preloadedDatasets || undefined)

    return {
      success: true,
      message: 'Database initialized successfully',
      data: results,
      importId
    }
  } catch (error: any) {
    console.error('Database initialization error:', error)
    // If it's already a createError-like object, re-throw it
    if (error && error.statusCode) throw error
    throwServer(500, error?.message || 'Failed to initialize database')
  }
})

/**
 * Process import synchronously (legacy mode)
 */
async function processImportSync(
  db: any, 
  adminUserId: number,
  importId: string,
  zipBytes?: Uint8Array | null,
  preloadedDatasets?: Record<string, any[]>,
) {
  const results = {
    users: 0,
    authors: 0,
    references: 0,
    tags: 0,
    quotes: 0
  }

  // Update overall status
  updateProgress(importId, { status: 'processing' })

  // Extract datasets from the provided ZIP; or use preloaded datasets (e.g., quotes.json upload)
  let datasets: Record<string, any[]> = preloadedDatasets || {}
  if (!preloadedDatasets && zipBytes && zipBytes.byteLength > 0) {
    datasets = await extractDatasetsFromZip(zipBytes)
  }

  // 0. Import Users (if zip provides users)
  try {
    if (datasets?.users && datasets.users.length > 0) {
      console.log('Importing users...')
      results.users = await importUsersFromDataset(db, importId, datasets.users)
      // Refresh adminUserId in case added via import
      const admin: User | null = await db.prepare(`SELECT id FROM users WHERE role='admin' LIMIT 1`).first()
      if (admin) adminUserId = admin.id
    } else {
      updateStepProgress(importId, 'users', {
        status: 'completed', total: 0, current: 0, imported: 0, message: 'No users dataset provided'
      })
    }
  } catch (error: any) {
    console.error('Failed to import users:', error)
    addError(importId, `Failed to import users: ${error.message}`)
    throwServer(500, `Failed to import users: ${error.message}`)
  }

  // 1. Import Authors
  try {
    console.log('Importing authors...')
    if (datasets?.authors && datasets.authors.length > 0) {
      results.authors = await importAuthorsFromDataset(db, importId, datasets.authors)
      console.log(`✅ Imported ${results.authors} authors`)
    } else {
      updateStepProgress(importId, 'authors', {
        status: 'completed', total: 0, current: 0, imported: 0, message: 'No authors dataset provided'
      })
      results.authors = 0
    }
  } catch (error: any) {
    console.error('Failed to import authors:', error)
    addError(importId, `Failed to import authors: ${error.message}`)
    throwServer(500, `Failed to import authors: ${error.message}`)
  }

  // 2. Import References
  try {
    console.log('Importing references...')
    if (datasets?.references && datasets.references.length > 0) {
      results.references = await importReferencesFromDataset(db, importId, datasets.references)
      console.log(`✅ Imported ${results.references} references`)
    } else {
      updateStepProgress(importId, 'references', {
        status: 'completed', total: 0, current: 0, imported: 0, message: 'No references dataset provided'
      })
      results.references = 0
    }
  } catch (error: any) {
    console.error('Failed to import references:', error)
    addError(importId, `Failed to import references: ${error.message}`)
    throwServer(500, `Failed to import references: ${error.message}`)
  }

  // 2.5 Import Tags (optional)
  try {
    if (datasets?.tags && datasets.tags.length > 0) {
      console.log('Importing tags...')
      results.tags = await importTagsFromDataset(db, importId, datasets.tags)
      console.log(`✅ Imported ${results.tags} tags`)
    } else {
      updateStepProgress(importId, 'tags', {
        status: 'completed', total: 0, current: 0, imported: 0, message: 'No tags dataset provided'
      })
    }
  } catch (error: any) {
    console.error('Failed to import tags:', error)
    addError(importId, `Failed to import tags: ${error.message}`)
    throwServer(500, `Failed to import tags: ${error.message}`)
  }

  // 3. Import Quotes
  try {
    console.log('Importing quotes...')
    if (datasets?.quotes && datasets.quotes.length > 0) {
      results.quotes = await importQuotesFromDataset(db, adminUserId, importId, datasets.quotes)
      console.log(`✅ Imported ${results.quotes} quotes`)
    } else {
      updateStepProgress(importId, 'quotes', {
        status: 'completed', total: 0, current: 0, imported: 0, message: 'No quotes dataset provided'
      })
      results.quotes = 0
    }

      // 3.5 Import quote_tags relations if present in ZIP (after tags and quotes exist)
      if (datasets?.quote_tags && datasets.quote_tags.length > 0) {
        console.log('Importing quote_tags relations...')
        const linked = await importQuoteTagsFromDataset(db, importId, datasets.quote_tags)
        console.log(`✅ Linked ${linked} quote-tags relations`)
        // update progress message to reflect linking done under quotes step
        updateStepProgress(importId, 'quotes', {
          message: `Imported ${results.quotes} quotes • Linked ${linked} tag relations`
        })
      }
  } catch (error: any) {
    console.error('Failed to import quotes:', error)
    addError(importId, `Failed to import quotes: ${error.message}`)
    throwServer(500, `Failed to import quotes: ${error.message}`)
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
  // If quotes dataset existed, mark message accordingly; otherwise already marked above
  if (datasets?.quotes && datasets.quotes.length > 0) {
    updateStepProgress(importId, 'quotes', {
      status: 'completed',
      message: 'Completed quotes and related data import'
    })
  }

  const totalImported = results.users + results.tags + results.authors + results.references + results.quotes
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
async function processImportAsync(
  db: any,
  adminUserId: number,
  importId: string,
  zipBytes?: Uint8Array | null,
  preloadedDatasets?: Record<string, any[]>,
) {
  try {
    await processImportSync(db, adminUserId, importId, zipBytes, preloadedDatasets)
  } catch (error: any) {
    console.error('Async import failed:', error)
    addError(importId, `Import failed: ${error.message}`)
    throw error
  }
}
