import { db, schema } from 'hub:db'
import { eq, and, like, desc, asc, sql, countDistinct, getTableColumns } from 'drizzle-orm'
import { findQuotes } from '../../services/quote.service'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)

    const rawSortBy = (query.sort_by as string | undefined)?.toLowerCase()
    const rawSortOrder = (query.sort_order as string | undefined)?.toLowerCase()

    const { sort_by, sort_order } = getSortParams(
      {
        sort_by: rawSortBy as typeof rawSortBy & (SortBy | undefined),
        sort_order: rawSortOrder as typeof rawSortOrder & (SortOrder | undefined)
      },
      ['created_at', 'updated_at', 'views_count', 'likes_count', 'shares_count']
    )

    const { data, pagination } = await findQuotes({
      status: (query.status as string || 'approved') as any,
      language: query.language as string,
      authorId: query.author_id ? parseInt(query.author_id as string) : undefined,
      referenceId: query.reference_id ? parseInt(query.reference_id as string) : undefined,
      search: query.search as string,
      tag: query.tag as string | undefined,
      sortBy: sort_by || 'created_at',
      sortOrder: (sort_order || 'desc') as 'asc' | 'desc',
      page: parseInt(query.page as string) || 1,
      limit: parseInt(query.limit as string) || 20,
    })

    return { success: true, data, pagination }
  } catch (error) {
    console.error('Error fetching quotes:', error)
    throwServer(500, 'Failed to fetch quotes')
  }
})