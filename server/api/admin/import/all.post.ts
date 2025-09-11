import { unzipSync, strFromU8 } from 'fflate'
import { base64ToUint8, parseZipImportEntries } from '~/server/utils/import-helpers'
import { createAdminImport, getAdminImport, updateAdminImport } from '~/server/utils/admin-import-progress'
import type { ImportOptions } from '~/types'

import { importReferencesInline } from '~/server/utils/imports/import-references'
import { importAuthorsInline } from '~/server/utils/imports/import-authors'
import { importTagsInline } from '~/server/utils/imports/import-tags'
import { importUsersInline } from '~/server/utils/imports/import-users'
import { importQuotesInline } from '~/server/utils/imports/import-quotes'

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
  if (user.role !== 'admin') { throw createError({ statusCode: 403, statusMessage: 'Admin access required' }) }

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
      throw createError({ statusCode: 400, statusMessage: `Invalid ZIP payload: ${e.message}` })
    }
  } else {
    if (!bundle || typeof bundle !== 'object') {
      throw createError({ statusCode: 400, statusMessage: 'Missing or invalid bundle. Expected an object with references/authors/tags/users/quotes arrays.' })
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

  // Aggregate totals (currently references supported; other types planned next steps)
  const counts = {
    references: Array.isArray(parsedBundle?.references) ? parsedBundle.references.length : 0,
    authors: Array.isArray(parsedBundle?.authors) ? parsedBundle.authors.length : 0,
    tags: Array.isArray(parsedBundle?.tags) ? parsedBundle.tags.length : 0,
    users: Array.isArray(parsedBundle?.users) ? parsedBundle.users.length : 0,
    quotes: Array.isArray(parsedBundle?.quotes) ? parsedBundle.quotes.length : 0,
  }
  
  const grandTotal = Object.values(counts).reduce((a, b) => a + b, 0)
  updateAdminImport(importId, { status: 'processing', totalRecords: grandTotal })

  // Add a per-type counts note and dependency order to warnings for UI visibility
  try {
    const p1 = getAdminImport(importId)!
    const countsNote = `Counts — users: ${counts.users}, authors: ${counts.authors}, references: ${counts.references}, tags: ${counts.tags}, quotes: ${counts.quotes}`
    const orderNote = 'Processing order: users → authors → references → tags → quotes'
    updateAdminImport(importId, { warnings: [...p1.warnings, countsNote, orderNote] })
  } catch {}

  // Process in dependency-friendly order: users -> authors -> references -> tags -> quotes
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

  return {
    success: true,
    importId,
    message: 'ALL import started',
    progressUrl: `/api/admin/import/progress/${importId}`,
  }
})
