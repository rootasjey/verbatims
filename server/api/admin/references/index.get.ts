/**
 * Admin API: Get References
 * Retrieves references with pagination, search, and filtering for admin interface
 */

import { db, schema } from 'hub:db'
import { sql, SQL } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireModerator(event)

    const query = getQuery(event)
    
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 50, 100)
    const search = query.search as string
    const primary_type = query.primary_type as string
    const sortBy = query.sort_by as string || 'name'
    const sortOrder = query.sort_order as string || 'ASC'
    
    const offset = (page - 1) * limit
    
    const conditions: SQL[] = []
    
    if (search) {
      const p = `%${search}%`
      conditions.push(sql`(r.name LIKE ${p} OR r.description LIKE ${p} OR r.secondary_type LIKE ${p})`)
    }
    
    if (primary_type) {
      conditions.push(sql`r.primary_type = ${primary_type}`)
    }
    
    const whereClause = conditions.length > 0
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``
    
    const sortColumnMap: Record<string, string> = {
      'name': 'name',
      'created': 'created_at',
      'updated': 'updated_at',
      'release_date': 'release_date',
      'type': 'primary_type',
      'views': 'views_count',
      'likes': 'likes_count',
      'quotes': 'quotes_count'
    }

    const mappedSortBy = sortColumnMap[sortBy] || sortBy
    const allowedSortColumns = ['name', 'created_at', 'updated_at', 'release_date', 'primary_type', 'views_count', 'likes_count', 'quotes_count']
    const sortColumn = allowedSortColumns.includes(mappedSortBy) ? mappedSortBy : 'name'
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    
    const orderCol = sortColumn === 'quotes_count' ? sql.raw('quotes_count') : sql.raw(`r.${sortColumn}`)
    
    const references = await db.all(sql`
      SELECT 
        r.*,
        COUNT(q.id) as quotes_count,
        (
          SELECT COUNT(*)
          FROM entity_enrichment_field_proposals proposal
          INNER JOIN entity_enrichment_jobs job ON job.id = proposal.job_id
          WHERE proposal.entity_type = 'reference'
            AND proposal.entity_id = r.id
            AND proposal.decision_status = 'pending'
            AND job.status = 'completed'
            AND job.applied_at IS NULL
        ) as enrichment_pending_count,
        (
          SELECT job.id
          FROM entity_enrichment_jobs job
          INNER JOIN entity_enrichment_field_proposals proposal ON proposal.job_id = job.id
          WHERE job.entity_type = 'reference'
            AND job.entity_id = r.id
            AND job.status = 'completed'
            AND job.applied_at IS NULL
            AND proposal.decision_status = 'pending'
          ORDER BY job.created_at DESC, job.id DESC
          LIMIT 1
        ) as enrichment_latest_job_id
      FROM quote_references r
      LEFT JOIN quotes q ON r.id = q.reference_id
      ${whereClause}
      GROUP BY r.id
      ORDER BY ${orderCol} ${sql.raw(sortDirection)}
      LIMIT ${limit} OFFSET ${offset}
    `)
    
    const countResult = await db.get<{ total: number }>(sql`
      SELECT COUNT(*) as total
      FROM quote_references r
      ${whereClause}
    `)
    
    const referencesData = references.map((reference: any) => ({
      ...reference,
      urls: reference.urls ? JSON.parse(reference.urls) : {}
    }))
    
    const total = countResult?.total || 0
    const totalPages = Math.ceil(total / limit)
    
    return {
      success: true,
      data: referencesData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    }

  } catch (error: any) {
    console.error('Error fetching references:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throwServer(500, 'Internal server error')
  }
})
