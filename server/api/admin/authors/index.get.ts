/**
 * Admin API: Get Authors
 * Retrieves authors with pagination, search, and filtering for admin interface
 */

import { db, schema } from 'hub:db'
import { sql, like, eq, or, and, count, desc, asc, getTableColumns } from 'drizzle-orm'
import { normalizeAdminAuthor } from '~~/server/utils/admin-author-transformer'

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
    
    // Build the WHERE conditions using Drizzle ORM
    const whereConditions = []
    
    if (search) {
      const searchPattern = `%${search}%`
      whereConditions.push(
        or(
          like(schema.authors.name, searchPattern),
          like(schema.authors.job, searchPattern),
          like(schema.authors.description, searchPattern)
        )
      )
    }
    
    if (is_fictional !== undefined && is_fictional !== '') {
      whereConditions.push(eq(schema.authors.isFictional, is_fictional === 'true'))
    }
    
    // Map frontend sort values to database columns
    const sortColumnMap: Record<string, any> = {
      'name': schema.authors.name,
      'created': schema.authors.createdAt,
      'updated': schema.authors.updatedAt,
      'views': schema.authors.viewsCount,
      'likes': schema.authors.likesCount,
      'quotes': sql<number>`COUNT(${schema.quotes.id})`
    }

    // Get the sort column
    const sortColumn = sortColumnMap[sortBy] || schema.authors.name
    const sortDirection = sortOrder.toUpperCase() === 'DESC' ? desc : asc
    
    // Build the query using Drizzle ORM
    let authorsQuery = db
      .select({
        ...getTableColumns(schema.authors),
        quotes_count: count(schema.quotes.id),
        enrichment_pending_count: sql<number>`(
          SELECT COUNT(*)
          FROM ${schema.entityEnrichmentFieldProposals} proposal
          INNER JOIN ${schema.entityEnrichmentJobs} job ON job.id = proposal.job_id
          WHERE proposal.entity_type = 'author'
            AND proposal.entity_id = ${schema.authors.id}
            AND proposal.decision_status = 'pending'
            AND job.status = 'completed'
            AND job.applied_at IS NULL
        )`,
        enrichment_latest_job_id: sql<number | null>`(
          SELECT job.id
          FROM ${schema.entityEnrichmentJobs} job
          INNER JOIN ${schema.entityEnrichmentFieldProposals} proposal ON proposal.job_id = job.id
          WHERE job.entity_type = 'author'
            AND job.entity_id = ${schema.authors.id}
            AND job.status = 'completed'
            AND job.applied_at IS NULL
            AND proposal.decision_status = 'pending'
          ORDER BY job.created_at DESC, job.id DESC
          LIMIT 1
        )`
      })
      .from(schema.authors)
      .leftJoin(schema.quotes, eq(schema.authors.id, schema.quotes.authorId))
      .$dynamic()
    
    // Apply where conditions
    if (whereConditions.length > 0) {
      authorsQuery = authorsQuery.where(and(...whereConditions))
    }
    
    // Apply grouping, sorting, and pagination
    const authors = await authorsQuery
      .groupBy(schema.authors.id)
      .orderBy(sortDirection(sortColumn))
      .limit(limit)
      .offset(offset)
    
    // Count query for pagination
    let countQuery = db
      .select({ total: count() })
      .from(schema.authors)
      .$dynamic()
    
    if (whereConditions.length > 0) {
      countQuery = countQuery.where(and(...whereConditions))
    }
    
    const countResult = await countQuery.get()
    
    const authorsData = authors.map((author: any) => normalizeAdminAuthor(author))
    
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
