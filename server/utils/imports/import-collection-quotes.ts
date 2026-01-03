import type { ImportOptions } from '~/types'
import { getAdminImport, updateAdminImport } from '~/server/utils/admin-import-progress'
import { addUnresolvedRow } from '~/server/utils/admin-import-unresolved'
import { db, schema } from 'hub:db'
import { eq, and, sql } from 'drizzle-orm'

export async function importCollectionQuotesInline(importId: string, data: any[], options?: ImportOptions): Promise<void> {
  if (!Array.isArray(data) || !data.length) return
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
        const col = await db.select({ id: schema.userCollections.id })
          .from(schema.userCollections)
          .where(
            row.user_id
              ? and(
                  eq(schema.userCollections.name, row.collection_name.trim()),
                  eq(schema.userCollections.userId, row.user_id)
                )
              : eq(schema.userCollections.name, row.collection_name.trim())
          )
          .limit(1)
          .get()
        if (col?.id) collectionId = col.id
        else warnings.push(`Could not resolve collection id for name="${row.collection_name}"${row.user_id ? ` (user_id=${row.user_id})` : ''}`)
      }

      // 2) Resolve quote by name (+ optional language/author/reference hints)
      if ((!quoteId || Number.isNaN(quoteId)) && typeof row.quote_name === 'string' && row.quote_name.trim()) {
        const name = row.quote_name.trim()
        const lang = typeof row.language === 'string' && row.language.trim() ? row.language.trim() : undefined
        // Prefer an exact name+language match when language provided
        let q: any
        if (lang) {
          q = await db.select({ id: schema.quotes.id })
            .from(schema.quotes)
            .where(and(
              eq(schema.quotes.name, name),
              eq(schema.quotes.language, lang)
            ))
            .orderBy(sql`${schema.quotes.createdAt} DESC`)
            .limit(1)
            .get()
        } else {
          q = await db.select({ id: schema.quotes.id })
            .from(schema.quotes)
            .where(eq(schema.quotes.name, name))
            .orderBy(sql`${schema.quotes.createdAt} DESC`)
            .limit(1)
            .get()
        }
        if (q?.id) quoteId = q.id
        else warnings.push(`Could not resolve quote id for name="${name}"${lang ? ` (lang=${lang})` : ''}`)
      }

      // Last chance: verify provided IDs exist; if not, skip with warning
      if (collectionId) {
        const colExists = await db.select({ id: schema.userCollections.id })
          .from(schema.userCollections)
          .where(eq(schema.userCollections.id, collectionId))
          .limit(1)
          .get()
        if (!colExists) warnings.push(`Collection id not found: ${collectionId}`)
      }
      if (quoteId) {
        const qExists = await db.select({ id: schema.quotes.id })
          .from(schema.quotes)
          .where(eq(schema.quotes.id, quoteId))
          .limit(1)
          .get()
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

      await db.insert(schema.collectionQuotes)
        .values({
          collectionId,
          quoteId,
          addedAt: row.added_at || null,
        })
        .onConflictDoNothing()
        .run()
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
