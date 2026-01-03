/**
 * Admin API: Get Authors
 * Retrieves authors with pagination, search, and filtering for admin interface
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
    const is_fictional = query.is_fictional as string
    const sortBy = query.sort_by as string || 'name'
    const sortOrder = query.sort_order as string || 'ASC'
    
    const offset = (page - 1) * limit
    
    // Build the WHERE clause
    const whereConditions = []
    
    if (search) {
      const searchPattern = `%${search}%`
      whereConditions.push(`(a.name LIKE ${sql.raw(`'${searchPattern}'`)} OR a.job LIKE ${sql.raw(`'${searchPattern}'`)} OR a.description LIKE ${sql.raw(`'${searchPattern}'`)})`)
    }
    
    if (is_fictional !== undefined && is_fictional !== '') {
      whereConditions.push(`a.is_fictional = ${is_fictional === 'true' ? 1 : 0}`)
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
    
    // Map frontend sort values to database columns
    const sortColumnMap: Record<string, string> = {
      'name': 'name',
      'created': 'created_at',
      'updated': 'updated_at',
      'views': 'views_count',
      'likes': 'likes_count',
      'quotes': 'quotes_count'
    }

    // Validate and map sort column
    const mappedSortBy = sortColumnMap[sortBy] || sortBy
    const allowedSortColumns = ['name', 'created_at', 'updated_at', 'views_count', 'likes_count', 'quotes_count']
    const sortColumn = allowedSortColumns.includes(mappedSortBy) ? mappedSortBy : 'name'
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    
    // Main query with quote count
    const authors = await db.all(sql.raw(`
      SELECT 
        a.*,
        COUNT(q.id) as quotes_count
      FROM ${schema.authors._.name} a
      LEFT JOIN ${schema.quotes._.name} q ON a.id = q.author_id
      ${whereClause}
      GROUP BY a.id
      ORDER BY ${sortColumn === 'quotes_count' ? 'quotes_count' : `a.${sortColumn}`} ${sortDirection}
      LIMIT ${limit} OFFSET ${offset}
    `))
    
    // Count query for pagination
    const countResult = await db.get<{ total: number }>(sql.raw(`
      SELECT COUNT(*) as total
      FROM ${schema.authors._.name} a
      ${whereClause}
    `))
    
    const authorsData = authors.map((author: any) => ({
      ...author,
      socials: author.socials ? JSON.parse(author.socials) : {}
    }))
    
    const total = countResult?.total || 0
    const totalPages = Math.ceil(total / limit)
    
    return {
      success: true,
      data: authorsData,
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
    console.error('Error fetching authors:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
