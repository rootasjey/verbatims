import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)

  try {
    const id = getRouterParam(event, 'id')!
    if (!id || isNaN(parseInt(id))) {
      throwServer(400, 'Invalid sponsor message ID')
    }
    const sponsorId = parseInt(id)
    const body = await readBody(event)

    const existing = await db.select()
      .from(schema.sponsorMessages)
      .where(and(
        eq(schema.sponsorMessages.id, sponsorId),
        eq(schema.sponsorMessages.userId, user.id),
      ))
      .limit(1)

    if (!existing || existing.length === 0) {
      throwServer(404, 'Sponsor message not found')
    }

    const sponsor = existing[0]!
    if (sponsor.status === 'approved') {
      throwServer(403, 'Cannot edit an approved sponsor message')
    }

    const updates: any = {}
    if (body.message !== undefined) {
      const trimmed = String(body.message).trim()
      if (!trimmed) throwServer(400, 'Message cannot be empty')
      updates.message = trimmed
    }
    if (body.leading_icon !== undefined) updates.leadingIcon = body.leading_icon || null
    if (body.trailing_icon !== undefined) updates.trailingIcon = body.trailing_icon || null
    if (body.url !== undefined) updates.url = body.url || null

    if (Object.keys(updates).length === 0) {
      return { success: true, data: sponsor }
    }

    await db.update(schema.sponsorMessages)
      .set(updates)
      .where(eq(schema.sponsorMessages.id, sponsorId))

    const updated = await db.select()
      .from(schema.sponsorMessages)
      .where(eq(schema.sponsorMessages.id, sponsorId))
      .limit(1)

    return { success: true, data: updated[0] }
  } catch (error: any) {
    if (error?.statusCode) throw error
    console.error('Error updating sponsor message:', error)
    throwServer(500, 'Failed to update sponsor message')
  }
})
