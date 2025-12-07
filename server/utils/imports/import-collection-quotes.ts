import type { ImportOptions } from '~/types'
import { getAdminImport, updateAdminImport } from '~/server/utils/admin-import-progress'
import { addUnresolvedRow } from '~/server/utils/admin-import-unresolved'

export async function importCollectionQuotesInline(importId: string, data: any[], options?: ImportOptions): Promise<void> {
  if (!Array.isArray(data) || !data.length) return
  const db = hubDatabase()
  let success = 0, failed = 0
  const errors: string[] = []
  const warnings: string[] = []
  for (const row of data) {
    try {
      let collectionId = row.collection_id as number | null | undefined
      let quoteId = row.quote_id as number | null | undefined

      // If IDs are missing or possibly mismatched, try to resolve from names
      // 1) Resolve collection by name (and optionally user_id)
      if ((!collectionId || Number.isNaN(collectionId)) && typeof row.collection_name === 'string' && row.collection_name.trim()) {
        const col = await db.prepare(
          row.user_id
            ? 'SELECT id FROM user_collections WHERE name = ? AND user_id = ? LIMIT 1'
            : 'SELECT id FROM user_collections WHERE name = ? LIMIT 1'
        ).bind(row.collection_name.trim(), row.user_id).first()
        if (col?.id) collectionId = Number(col.id)
        else warnings.push(`Could not resolve collection id for name="${row.collection_name}"${row.user_id ? ` (user_id=${row.user_id})` : ''}`)
      }

      // 2) Resolve quote by name (+ optional language/author/reference hints)
      if ((!quoteId || Number.isNaN(quoteId)) && typeof row.quote_name === 'string' && row.quote_name.trim()) {
        const name = row.quote_name.trim()
        const lang = typeof row.language === 'string' && row.language.trim() ? row.language.trim() : undefined
        // Prefer an exact name+language match when language provided
        let q: any
        if (lang) {
          q = await db.prepare('SELECT id FROM quotes WHERE name = ? AND language = ? ORDER BY created_at DESC LIMIT 1').bind(name, lang).first()
        } else {
          q = await db.prepare('SELECT id FROM quotes WHERE name = ? ORDER BY created_at DESC LIMIT 1').bind(name).first()
        }
        if (q?.id) quoteId = Number(q.id)
        else warnings.push(`Could not resolve quote id for name="${name}"${lang ? ` (lang=${lang})` : ''}`)
      }

      // Last chance: verify provided IDs exist; if not, skip with warning
      if (collectionId) {
        const colExists = await db.prepare('SELECT 1 FROM user_collections WHERE id = ? LIMIT 1').bind(collectionId).first()
        if (!colExists) warnings.push(`Collection id not found: ${collectionId}`)
      }
      if (quoteId) {
        const qExists = await db.prepare('SELECT 1 FROM quotes WHERE id = ? LIMIT 1').bind(quoteId).first()
        if (!qExists) warnings.push(`Quote id not found: ${quoteId}`)
      }

      if (!collectionId || !quoteId) {
        failed++
        // Save unresolved row with helpful context for later download
        addUnresolvedRow(importId, 'collection_quotes', {
          collection_id: collectionId || row.collection_id || null,
          quote_id: quoteId || row.quote_id || null,
          collection_name: row.collection_name || null,
          quote_name: row.quote_name || null,
          language: row.language || null,
          user_id: row.user_id || null,
          added_at: row.added_at || null
        })
        continue
      }

      await db.prepare('INSERT OR IGNORE INTO collection_quotes (collection_id, quote_id, added_at) VALUES (?, ?, ?)')
        .bind(collectionId, quoteId, row.added_at || null).run()
      success++
    } catch (e: any) {
      failed++
      errors.push(`Failed to insert collection_quote (collection_id=${row.collection_id}, quote_id=${row.quote_id}): ${e.message}`)
    }
  }
  // Update progress/errors
  const p = getAdminImport(importId)
  if (p) {
    updateAdminImport(importId, {
      successfulRecords: (p.successfulRecords || 0) + success,
      failedRecords: (p.failedRecords || 0) + failed,
      errors: [...(p.errors || []), ...errors],
      warnings: warnings.length ? [...(p.warnings || []), ...warnings] : p.warnings,
    })
  }
}
