import { db, schema } from 'hub:db'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAuth(event)

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

    return {
      success: true,
      data: sponsors,
    }
  } catch (error: any) {
    if (error?.statusCode) {
      throw error
    }
    console.error('Dashboard sponsors error:', error)
    throwServer(500, 'Failed to fetch sponsor messages')
  }
})
