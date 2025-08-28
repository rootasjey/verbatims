import type { ExportValidation } from '~/types/export'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
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
    const db = hubDatabase()

    // Helper to count from a query
    const countFrom = async (query: string, bindings: any[] = []) => {
      const res = await db.prepare(query).bind(...bindings).first<{ total: number }>()
      return Number(res?.total || 0)
    }

    // Quotes count (apply minimal filters where simple; full parity left to per-type validators)
    let quotesWhere: string[] = []
    let qBind: any[] = []
    const qf = (all_filters?.quotes || {})
    if (qf.language && Array.isArray(qf.language) && qf.language.length) {
      quotesWhere.push(`q.language IN (${qf.language.map(() => '?').join(',')})`)
      qBind.push(...qf.language)
    }
    if (qf.status && Array.isArray(qf.status) && qf.status.length) {
      quotesWhere.push(`q.status IN (${qf.status.map(() => '?').join(',')})`)
      qBind.push(...qf.status)
    }
    const quotesCount = await countFrom(`
      SELECT COUNT(DISTINCT q.id) as total
      FROM quotes q
      ${quotesWhere.length ? 'WHERE ' + quotesWhere.join(' AND ') : ''}
    `, qBind)

    // Authors count
    let authorsWhere: string[] = []
    let aBind: any[] = []
    const af = (all_filters?.authors || {})
    if (af.is_fictional !== undefined) {
      authorsWhere.push('a.is_fictional = ?')
      aBind.push(!!af.is_fictional)
    }
    const authorsCount = await countFrom(`
      SELECT COUNT(*) as total FROM authors a
      ${authorsWhere.length ? 'WHERE ' + authorsWhere.join(' AND ') : ''}
    `, aBind)

    // References count
    let refsWhere: string[] = []
    let rBind: any[] = []
    const rf = (all_filters?.references || {})
    if (rf.primary_type && Array.isArray(rf.primary_type) && rf.primary_type.length) {
      refsWhere.push(`r.primary_type IN (${rf.primary_type.map(() => '?').join(',')})`)
      rBind.push(...rf.primary_type)
    }
    const referencesCount = await countFrom(`
      SELECT COUNT(*) as total FROM quote_references r
      ${refsWhere.length ? 'WHERE ' + refsWhere.join(' AND ') : ''}
    `, rBind)

    // Users count
    let usersWhere: string[] = []
    let uBind: any[] = []
    const uf = (all_filters?.users || {})
    if (uf.role && Array.isArray(uf.role) && uf.role.length) {
      usersWhere.push(`u.role IN (${uf.role.map(() => '?').join(',')})`)
      uBind.push(...uf.role)
    }
    const usersCount = await countFrom(`
      SELECT COUNT(*) as total FROM users u
      ${usersWhere.length ? 'WHERE ' + usersWhere.join(' AND ') : ''}
    `, uBind)

    const parts = [quotesCount, referencesCount, authorsCount, usersCount]
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
