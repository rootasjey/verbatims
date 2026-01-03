import { db, schema } from 'hub:db'
import { sql, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
    }

    const referenceId = getRouterParam(event, 'id')
    if (!referenceId || isNaN(parseInt(referenceId))) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid reference ID' })
    }

    type AdminReferenceRow = {
      id: number
      name: string
      urls: string | null
      quotes_count: number
      [key: string]: unknown
    }

    const reference = await db.get<AdminReferenceRow>(sql`
      SELECT
        r.*,
        COUNT(q.id) as quotes_count
      FROM ${schema.quoteReferences} r
      LEFT JOIN ${schema.quotes} q ON r.id = q.reference_id
      WHERE r.id = ${Number(referenceId)}
      GROUP BY r.id
    `)

    if (!reference) {
      throw createError({ statusCode: 404, statusMessage: 'Reference not found' })
    }

    const transformed = {
      ...reference,
      urls: reference.urls ? JSON.parse(reference.urls) : []
    }

    return { success: true, data: transformed }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error fetching admin reference details:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch reference' })
  }
})
