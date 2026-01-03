import type { ExportValidation } from '~/types/export'
import { db, schema } from 'hub:db'
import { eq, inArray, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (user.role !== 'admin' && user.role !== 'moderator') {
    throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
  }

  const body = await readBody(event) as any
  const { format, include_relations = true, limit = 0, all_filters = {} } = body || {}

  const validation: ExportValidation = { valid: true, errors: [], warnings: [] }

  if (!format || !['json', 'csv', 'xml'].includes(format)) {
    validation.errors.push('Unsupported export format. Supported formats: json, csv, xml')
    validation.valid = false
  }

  try {
    // Helper to count from a query
    const countFrom = async (query: any) => {
      const res = await query
      return Number(res[0]?.total || 0)
    }

    // Quotes count (apply minimal filters where simple; full parity left to per-type validators)
    const qf = (all_filters?.quotes || {})
    let quotesQuery = db
      .select({ total: sql<number>`COUNT(DISTINCT ${schema.quotes.id})`.as('total') })
      .from(schema.quotes)
      .$dynamic()
    
    if (qf.language && Array.isArray(qf.language) && qf.language.length) {
      quotesQuery = quotesQuery.where(inArray(schema.quotes.language, qf.language))
    }
    
    if (qf.status && Array.isArray(qf.status) && qf.status.length) {
      quotesQuery = quotesQuery.where(inArray(schema.quotes.status, qf.status))
    }
    
    const quotesCount = await countFrom(quotesQuery);

    // Authors count
    const af = (all_filters?.authors || {})
    let authorsQuery = db
      .select({ total: sql<number>`COUNT(*)`.as('total') })
      .from(schema.authors)
      .$dynamic()
      
    if (af.is_fictional !== undefined) {
      authorsQuery = authorsQuery.where(eq(schema.authors.isFictional, !!af.is_fictional))
    }
    
    const authorsCount = await countFrom(authorsQuery);

    // References count
    const rf = (all_filters?.references || {})
    let referencesQuery = db
      .select({ total: sql<number>`COUNT(*)`.as('total') })
      .from(schema.quoteReferences)
      .$dynamic()
    
    if (rf.primary_type && Array.isArray(rf.primary_type) && rf.primary_type.length) {
      referencesQuery = referencesQuery.where(inArray(schema.quoteReferences.primaryType, rf.primary_type))
    }
    
    const referencesCount = await countFrom(referencesQuery);

    // Users count
    const uf = (all_filters?.users || {})
    let usersQuery = db
      .select({ total: sql<number>`COUNT(*)`.as('total') })
      .from(schema.users)
      .$dynamic()
    
    if (uf.role && Array.isArray(uf.role) && uf.role.length) {
      usersQuery = usersQuery.where(inArray(schema.users.role, uf.role))
    }
    
    const usersCount = await countFrom(usersQuery);

    // Tags count
    const tf = (all_filters?.tags || {})
    let tagsQuery = db
      .select({ total: sql<number>`COUNT(DISTINCT ${schema.tags.id})`.as('total') })
      .from(schema.tags)
      .$dynamic()

    if (tf.category && Array.isArray(tf.category) && tf.category.length) {
      tagsQuery = tagsQuery.where(inArray(schema.tags.category, tf.category))
    }

    if (tf.color && Array.isArray(tf.color) && tf.color.length) {
      tagsQuery = tagsQuery.where(inArray(schema.tags.color, tf.color))
    }

    if (tf.unused_only) {
      tagsQuery = tagsQuery.where(sql`NOT EXISTS (SELECT 1 FROM quote_tags qt WHERE qt.tag_id = ${schema.tags.id})`)
    }

    if (tf.min_usage && tf.min_usage > 0) {
      tagsQuery = tagsQuery.where(sql`(SELECT COUNT(*) FROM quote_tags qt2 WHERE qt2.tag_id = ${schema.tags.id}) >= ${tf.min_usage}`)
    }

    const tagsCount = await countFrom(tagsQuery)

    const parts = [quotesCount, referencesCount, authorsCount, usersCount, tagsCount]
    const limitedParts = parts.map(c => limit > 0 ? Math.min(c, limit) : c)
    const total = limitedParts.reduce((a, b) => a + b, 0)

    const multipliers: any = { json: 1.2, csv: 0.9, xml: 1.8 }
    const basePerRow = include_relations ? 450 : 220
    validation.estimated_count = total
    validation.estimated_size = Math.round(total * basePerRow * (multipliers[format] || 1))

    if (total === 0) validation.warnings.push('No records match the current filters. Export will be empty.')
    if ((validation.estimated_size || 0) > 50 * 1024 * 1024) {
      validation.warnings.push('Large file size estimated. Export may take several minutes.')
    }

    return { success: true, data: validation }
  } catch (e: any) {
    console.error('All export validate error:', e)
    throw createError({ statusCode: 500, statusMessage: 'Failed to validate combined export' })
  }
})
