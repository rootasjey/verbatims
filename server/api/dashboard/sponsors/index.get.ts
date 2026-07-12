import { db, schema } from 'hub:db'
import { eq, desc, count, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAuth(event)

    const query = getQuery(event)
    const page = Math.max(1, parseInt(String(query.page), 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(String(query.limit), 10) || 20))
    const offset = (page - 1) * limit

    const totalResult = await db
      .select({ total: count() })
      .from(schema.sponsorMessages)
      .where(eq(schema.sponsorMessages.userId, user.id))

    const total = totalResult[0]?.total ?? 0

    const sponsors = await db
      .select({
        id: schema.sponsorMessages.id,
        message: schema.sponsorMessages.message,
        leadingIcon: schema.sponsorMessages.leadingIcon,
        trailingIcon: schema.sponsorMessages.trailingIcon,
        url: schema.sponsorMessages.url,
        type: schema.sponsorMessages.type,
        status: schema.sponsorMessages.status,
        rejectionReason: schema.sponsorMessages.rejectionReason,
        paid: schema.sponsorMessages.paid,
        paymentRef: schema.sponsorMessages.paymentRef,
        startsAt: schema.sponsorMessages.startsAt,
        endsAt: schema.sponsorMessages.endsAt,
        viewsCount: schema.sponsorMessages.viewsCount,
        clicksCount: schema.sponsorMessages.clicksCount,
        createdAt: schema.sponsorMessages.createdAt,
      })
      .from(schema.sponsorMessages)
      .where(eq(schema.sponsorMessages.userId, user.id))
      .orderBy(desc(schema.sponsorMessages.createdAt))
      .limit(limit)
      .offset(offset)

    const totalPages = Math.ceil(total / limit)
    const hasMore = offset + sponsors.length < total

    return {
      success: true,
      data: sponsors,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    }
  } catch (error: any) {
    if (error?.statusCode) {
      throw error
    }
    console.error('Dashboard sponsors error:', error)
    throwServer(500, 'Failed to fetch sponsor messages')
  }
})
