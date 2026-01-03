/**
 * Admin API: Get References
 * Retrieves references with pagination, search, and filtering for admin interface
 */

import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    // Check admin authentication
    const { user } = await requireUserSession(event)
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin or moderator access required'
      })
    }

    const query = getQuery(event)
    
    // Parse query parameters
    const page = parseInt(query.page as string) || 1
    const limit = Math.min(parseInt(query.limit as string) || 50, 100)
    const search = query.search as string
    const primary_type = query.primary_type as string
    const sortBy = query.sort_by as string || 'name'
    const sortOrder = query.sort_order as string || 'ASC'
    
    const offset = (page - 1) * limit
    
    // Build the WHERE clause
    const whereConditions = []
    
    if (search) {
      const searchPattern = `%${search}%`
      whereConditions.push(`(r.name LIKE ${sql.raw(`'${searchPattern}'`)} OR r.description LIKE ${sql.raw(`'${searchPattern}'`)} OR r.secondary_type LIKE ${sql.raw(`'${searchPattern}'`)})`)
    }
    
    if (primary_type) {
      whereConditions.push(`r.primary_type = ${sql.raw(`'${primary_type}'`)}`)
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
    
    // Map frontend sort values to database columns
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

    // Validate and map sort column
    const mappedSortBy = sortColumnMap[sortBy] || sortBy
    const allowedSortColumns = ['name', 'created_at', 'updated_at', 'release_date', 'primary_type', 'views_count', 'likes_count', 'quotes_count']
    const sortColumn = allowedSortColumns.includes(mappedSortBy) ? mappedSortBy : 'name'
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    
    // Main query with quote count
    const references = await db.all(sql.raw(`
      SELECT 
        r.*,
        COUNT(q.id) as quotes_count
      FROM ${schema.quoteReferences._.name} r
      LEFT JOIN ${schema.quotes._.name} q ON r.id = q.reference_id
      ${whereClause}
      GROUP BY r.id
      ORDER BY ${sortColumn === 'quotes_count' ? 'quotes_count' : `r.${sortColumn}`} ${sortDirection}
      LIMIT ${limit} OFFSET ${offset}
    `))
    
    // Count query for pagination
    const countResult = await db.get<{ total: number }>(sql.raw(`
      SELECT COUNT(*) as total
      FROM ${schema.quoteReferences._.name} r
      ${whereClause}
    `))
    
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
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }

  } catch (error: any) {
    console.error('Error fetching references:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
