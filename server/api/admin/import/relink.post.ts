import type { ImportOptions } from '~/types'
import { unzipSync, strFromU8 } from 'fflate'

/**
 * Admin API: Relink Post-Quote Relations
 *
 * Allows re-running the post-quote linking steps (quote_tags, user_likes, user_collections,
 * collection_quotes, user_sessions, user_messages, quote_reports, quote_views, author_views,
 * reference_views) using a provided bundle or ZIP. This is useful if quotes import failed
 * mid-chain and you want to link relations after quotes have been successfully imported,
 * without wiping the database.
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (user.role !== 'admin') throwServer(403, 'Admin access required')

  const body = await readBody<{ zipBase64?: string; bundle?: Record<string, any[]>; options?: ImportOptions; filename?: string }>(event)
  const { zipBase64, bundle, options = {}, filename } = body || {}

  // Parse inputs similarly to ALL import, but we only consider relation datasets
  let parsed: Record<string, any[]> | null = null
  let format: 'zip' | 'bundle' = 'bundle'
  if (zipBase64) {
    format = 'zip'
    const zipU8 = base64ToUint8(zipBase64)
    const entries = unzipSync(zipU8)
    const out = parseZipImportEntries(entries, strFromU8)
    parsed = out.bundle
  } else {
    if (!bundle || typeof bundle !== 'object') {
      throwServer(400, 'Missing or invalid bundle')
      return
    }
    parsed = bundle
  }

  const importId = `relink_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  // dataType union doesn't include 'relations'; use 'all' to represent a mixed relation bundle
  createAdminImport(importId, { status: 'pending', dataType: 'all', filename })

  const counts = {
    quote_tags: parsed?.quote_tags?.length || 0,
    user_likes: parsed?.user_likes?.length || 0,
    user_collections: parsed?.user_collections?.length || 0,
    collection_quotes: parsed?.collection_quotes?.length || 0,
    user_sessions: parsed?.user_sessions?.length || 0,
    user_messages: parsed?.user_messages?.length || 0,
    quote_reports: parsed?.quote_reports?.length || 0,
    quote_views: parsed?.quote_views?.length || 0,
    author_views: parsed?.author_views?.length || 0,
    reference_views: parsed?.reference_views?.length || 0,
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  updateAdminImport(importId, { status: 'processing', totalRecords: total })

  // Run only linking/imports that are safe idempotent and do not require wiping core tables
  try { if (counts.quote_tags) await importQuoteTagsInline(importId, parsed?.quote_tags ?? [], options) } catch (e: any) { addAdminImportError(importId, `quote_tags failed: ${e.message}`) }
  try { if (counts.user_likes) await importUserLikesInline(importId, parsed?.user_likes ?? [], options, String(user.id)) } catch (e: any) { addAdminImportError(importId, `user_likes failed: ${e.message}`) }
  try { if (counts.user_collections) await importUserCollectionsInline(importId, parsed?.user_collections ?? [], options, String(user.id)) } catch (e: any) { addAdminImportError(importId, `user_collections failed: ${e.message}`) }
  try { if (counts.collection_quotes) await importCollectionQuotesInline(importId, parsed?.collection_quotes ?? [], options) } catch (e: any) { addAdminImportError(importId, `collection_quotes failed: ${e.message}`) }
  try { if (counts.user_sessions) await importUserSessionsInline(importId, parsed?.user_sessions ?? [], options, String(user.id)) } catch (e: any) { addAdminImportError(importId, `user_sessions failed: ${e.message}`) }
  try { if (counts.user_messages) await importUserMessagesInline(importId, parsed?.user_messages ?? [], options, String(user.id)) } catch (e: any) { addAdminImportError(importId, `user_messages failed: ${e.message}`) }
  try { if (counts.quote_reports) await importQuoteReportsInline(importId, parsed?.quote_reports ?? [], options) } catch (e: any) { addAdminImportError(importId, `quote_reports failed: ${e.message}`) }
  try { if (counts.quote_views) await importQuoteViewsInline(importId, parsed?.quote_views ?? [], options) } catch (e: any) { addAdminImportError(importId, `quote_views failed: ${e.message}`) }
  try { if (counts.author_views) await importAuthorViewsInline(importId, parsed?.author_views ?? [], options) } catch (e: any) { addAdminImportError(importId, `author_views failed: ${e.message}`) }
  try { if (counts.reference_views) await importReferenceViewsInline(importId, parsed?.reference_views ?? [], options) } catch (e: any) { addAdminImportError(importId, `reference_views failed: ${e.message}`) }

  updateAdminImport(importId, { status: 'completed', completedAt: new Date() })

  return { success: true, importId, message: 'Relink started', counts }
})
