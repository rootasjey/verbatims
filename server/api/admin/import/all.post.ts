import { unzipSync, strFromU8 } from 'fflate'
import type { ImportOptions } from '~/types'

/**
 * Admin API: Unified "All" Import (Bundle or ZIP)
 *
 * Supports two inputs:
 * - bundle: { users, authors, references, tags, quotes } arrays
 * - zipBase64: a base64 ZIP containing files named one of
 *   users|authors|references|tags|quotes.(json|csv|xml)
 * ZIP parsing uses fflate (no install needed in this project).
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (user.role !== 'admin') throwServer(403, 'Admin access required')

  const body = await readBody<{ zipBase64?: string; bundle?: Record<string, any[]>; options?: ImportOptions; filename?: string }>(event)
  const { zipBase64, bundle, options = {}, filename } = body || {}

  // Build a normalized bundle either from provided object or from ZIP entries
  let parsedBundle: Record<string, any[]> | null = null
  let formatLabel: 'zip' | 'bundle' = 'bundle'

  if (zipBase64) {
    formatLabel = 'zip'
    try {
      const zipU8 = base64ToUint8(zipBase64)
      const entries = unzipSync(zipU8)
      const { bundle: result, warnings } = parseZipImportEntries(entries, strFromU8)
      parsedBundle = result
      // Attach parsing warnings after progress object is created
      event.context._zipWarnings = warnings
    } catch (e: any) {
      throwServer(400, `Invalid ZIP payload: ${e.message}`)
    }
  } else {
    if (!bundle || typeof bundle !== 'object') {
      throwServer(400, 'Missing or invalid bundle. Expected an object with references/authors/tags/users/quotes arrays.')
      return
    }
    parsedBundle = bundle
  }

  // Initialize unified import
  const importId = `import_all_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  createAdminImport(importId, { status: 'pending', dataType: 'all', filename })

  // If ZIP parsing generated warnings, attach them now
  const zipWarnings = (event.context as any)._zipWarnings as string[] | undefined
  if (zipWarnings && zipWarnings.length) {
    const p0 = getAdminImport(importId)!
    updateAdminImport(importId, { warnings: [...p0.warnings, ...zipWarnings] })
  }

  // Persist initial log for the ALL import (best-effort)
  try {
    const db = hubDatabase()
    await db.prepare(`INSERT INTO import_logs (import_id, filename, format, data_type, status, user_id, options) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(importId, filename || null, formatLabel, 'all', 'pending', user.id, JSON.stringify(options || {})).run()
  } catch (e) { console.warn('Failed to log ALL import start:', e) }


  // Aggregate totals for all supported tables
  const counts = {
    references: Array.isArray(parsedBundle?.references) ? parsedBundle.references.length : 0,
    authors: Array.isArray(parsedBundle?.authors) ? parsedBundle.authors.length : 0,
    tags: Array.isArray(parsedBundle?.tags) ? parsedBundle.tags.length : 0,
    users: Array.isArray(parsedBundle?.users) ? parsedBundle.users.length : 0,
    quotes: Array.isArray(parsedBundle?.quotes) ? parsedBundle.quotes.length : 0,
    quote_tags: Array.isArray(parsedBundle?.quote_tags) ? parsedBundle.quote_tags.length : 0,
    user_likes: Array.isArray(parsedBundle?.user_likes) ? parsedBundle.user_likes.length : 0,
    user_collections: Array.isArray(parsedBundle?.user_collections) ? parsedBundle.user_collections.length : 0,
    collection_quotes: Array.isArray(parsedBundle?.collection_quotes) ? parsedBundle.collection_quotes.length : 0,
    user_sessions: Array.isArray(parsedBundle?.user_sessions) ? parsedBundle.user_sessions.length : 0,
    user_messages: Array.isArray(parsedBundle?.user_messages) ? parsedBundle.user_messages.length : 0,
    quote_reports: Array.isArray(parsedBundle?.quote_reports) ? parsedBundle.quote_reports.length : 0,
    quote_views: Array.isArray(parsedBundle?.quote_views) ? parsedBundle.quote_views.length : 0,
    author_views: Array.isArray(parsedBundle?.author_views) ? parsedBundle.author_views.length : 0,
    reference_views: Array.isArray(parsedBundle?.reference_views) ? parsedBundle.reference_views.length : 0,
  }

  const grandTotal = Object.values(counts).reduce((a, b) => a + b, 0)
  updateAdminImport(importId, { status: 'processing', totalRecords: grandTotal })

  // Add a per-type counts note and dependency order to warnings for UI visibility
  try {
    const p1 = getAdminImport(importId)!
    const countsNote = `Counts — users: ${counts.users}, authors: ${counts.authors}, references: ${counts.references}, tags: ${counts.tags}, quotes: ${counts.quotes}, quote_tags: ${counts.quote_tags}, user_likes: ${counts.user_likes}, user_collections: ${counts.user_collections}, collection_quotes: ${counts.collection_quotes}, user_sessions: ${counts.user_sessions}, user_messages: ${counts.user_messages}, quote_reports: ${counts.quote_reports}, quote_views: ${counts.quote_views}, author_views: ${counts.author_views}, reference_views: ${counts.reference_views}`
    const orderNote = 'Processing order: users → authors → references → tags → quotes → quote_tags → user_likes → user_collections → collection_quotes → user_sessions → user_messages → quote_reports → quote_views → author_views → reference_views'
    updateAdminImport(importId, { warnings: [...p1.warnings, countsNote, orderNote] })
  } catch {}

  // Define the heavy work as a function so we can schedule it with Cloudflare waitUntil
  const runImport = async () => {
    try {
      // Process in dependency-friendly order
      if (parsedBundle) {
        try { if (counts.users) { await importUsersInline(importId, parsedBundle.users, options) } } catch (e: any) {
          const p = getAdminImport(importId); if (p) updateAdminImport(importId, { errors: [...p.errors, `Users import failed: ${e.message}`] })
        }
        try { if (counts.authors) { await importAuthorsInline(importId, parsedBundle.authors, options) } } catch (e: any) {
          const p = getAdminImport(importId); if (p) updateAdminImport(importId, { errors: [...p.errors, `Authors import failed: ${e.message}`] })
        }
        try { if (counts.references) { await importReferencesInline(importId, parsedBundle.references, options) } } catch (e: any) {
          const p = getAdminImport(importId); if (p) updateAdminImport(importId, { errors: [...p.errors, `References import failed: ${e.message}`] })
        }
        try { if (counts.tags) { await importTagsInline(importId, parsedBundle.tags, options) } } catch (e: any) {
          const p = getAdminImport(importId); if (p) updateAdminImport(importId, { errors: [...p.errors, `Tags import failed: ${e.message}`] })
        }
        try { if (counts.quotes) { await importQuotesInline(importId, parsedBundle.quotes, options, user.id) } } catch (e: any) {
          const p = getAdminImport(importId); if (p) updateAdminImport(importId, { errors: [...p.errors, `Quotes import failed: ${e.message}`] })
        }
        try { if (counts.quote_tags) { await importQuoteTagsInline(importId, parsedBundle.quote_tags, options) } } catch (e: any) {
          const p = getAdminImport(importId); if (p) updateAdminImport(importId, { errors: [...p.errors, `QuoteTags import failed: ${e.message}`] })
        }
        try { if (counts.user_likes) { await importUserLikesInline(importId, parsedBundle.user_likes, options, String(user.id)) } } catch (e: any) {
          const p = getAdminImport(importId); if (p) updateAdminImport(importId, { errors: [...p.errors, `UserLikes import failed: ${e.message}`] })
        }
        try { if (counts.user_collections) { await importUserCollectionsInline(importId, parsedBundle.user_collections, options, String(user.id)) } } catch (e: any) {
          const p = getAdminImport(importId); if (p) updateAdminImport(importId, { errors: [...p.errors, `UserCollections import failed: ${e.message}`] })
        }
        try { if (counts.collection_quotes) { await importCollectionQuotesInline(importId, parsedBundle.collection_quotes, options) } } catch (e: any) {
          const p = getAdminImport(importId); if (p) updateAdminImport(importId, { errors: [...p.errors, `CollectionQuotes import failed: ${e.message}`] })
        }
        try { if (counts.user_sessions) { await importUserSessionsInline(importId, parsedBundle.user_sessions, options, String(user.id)) } } catch (e: any) {
          const p = getAdminImport(importId); if (p) updateAdminImport(importId, { errors: [...p.errors, `UserSessions import failed: ${e.message}`] })
        }
        try { if (counts.user_messages) { await importUserMessagesInline(importId, parsedBundle.user_messages, options, String(user.id)) } } catch (e: any) {
          const p = getAdminImport(importId); if (p) updateAdminImport(importId, { errors: [...p.errors, `UserMessages import failed: ${e.message}`] })
        }
        try { if (counts.quote_reports) { await importQuoteReportsInline(importId, parsedBundle.quote_reports, options) } } catch (e: any) {
          const p = getAdminImport(importId); if (p) updateAdminImport(importId, { errors: [...p.errors, `QuoteReports import failed: ${e.message}`] })
        }
        try { if (counts.quote_views) { await importQuoteViewsInline(importId, parsedBundle.quote_views, options) } } catch (e: any) {
          const p = getAdminImport(importId); if (p) updateAdminImport(importId, { errors: [...p.errors, `QuoteViews import failed: ${e.message}`] })
        }
        try { if (counts.author_views) { await importAuthorViewsInline(importId, parsedBundle.author_views, options) } } catch (e: any) {
          const p = getAdminImport(importId); if (p) updateAdminImport(importId, { errors: [...p.errors, `AuthorViews import failed: ${e.message}`] })
        }
        try { if (counts.reference_views) { await importReferenceViewsInline(importId, parsedBundle.reference_views, options) } } catch (e: any) {
          const p = getAdminImport(importId); if (p) updateAdminImport(importId, { errors: [...p.errors, `ReferenceViews import failed: ${e.message}`] })
        }
      }

      updateAdminImport(importId, { status: 'completed', completedAt: new Date() })

      try { // Snapshot completion to import_logs
        const db = hubDatabase()
        const importData = getAdminImport(importId)

        if (importData) await db.prepare(`
          UPDATE import_logs 
          SET status=?, record_count=?, successful_count=?, failed_count=?, warnings_count=?, completed_at=CURRENT_TIMESTAMP 
          WHERE import_id=?
        `)
          .bind(
            importData.status,
            importData.totalRecords,
            importData.successfulRecords,
            importData.failedRecords,
            importData.warnings.length,
            importId,
          )
          .run()
      } catch {}
    } catch (e: any) {
      const p = getAdminImport(importId)
      if (p) updateAdminImport(importId, { status: 'failed', errors: [...p.errors, e.message], completedAt: new Date() })
    }
  }

  // Run the heavy work asynchronously so the client can subscribe to progress immediately.
  scheduleBackground(event, runImport)

  return {
    success: true,
    importId,
    message: 'ALL import started',
    progressUrl: `/api/admin/import/progress/${importId}`,
  }
})
