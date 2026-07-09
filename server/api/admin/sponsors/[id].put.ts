import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  try {
    const id = getRouterParam(event, 'id')!
    if (!id || isNaN(parseInt(id))) {
      throwServer(400, 'Invalid sponsor message ID')
    }
    const sponsorId = parseInt(id)
    const body = await readBody(event)

    const existing = await db.select()
      .from(schema.sponsorMessages)
      .where(eq(schema.sponsorMessages.id, sponsorId))
      .limit(1)

    if (!existing || existing.length === 0) {
      throwServer(404, 'Sponsor message not found')
    }

    const existingRecord = existing[0]!

    const updates: any = {}
    if (typeof body.message === 'string' && body.message.trim()) {
      updates.message = body.message.trim()
    }
    if (body.leading_icon !== undefined) updates.leadingIcon = body.leading_icon || null
    if (body.trailing_icon !== undefined) updates.trailingIcon = body.trailing_icon || null
    if (body.url !== undefined) updates.url = body.url || null
    if (body.type !== undefined) updates.type = body.type
    if (body.status !== undefined && ['pending', 'approved', 'rejected'].includes(body.status)) {
      updates.status = body.status
      if (body.status === 'approved') {
        updates.rejectionReason = null
      }
    }
    if (body.rejection_reason !== undefined) {
      updates.rejectionReason = body.rejection_reason || null
    }
    if (body.priority !== undefined) updates.priority = body.priority
    if (body.starts_at !== undefined) updates.startsAt = body.starts_at || null
    if (body.ends_at !== undefined) updates.endsAt = body.ends_at || null
    if (body.max_views !== undefined) updates.maxViews = body.max_views || null

    if (Object.keys(updates).length === 0) {
      return { success: true, data: existingRecord }
    }

    await db.update(schema.sponsorMessages)
      .set(updates)
      .where(eq(schema.sponsorMessages.id, sponsorId))

    const updated = await db.select()
      .from(schema.sponsorMessages)
      .where(eq(schema.sponsorMessages.id, sponsorId))
      .limit(1)

    // Send email notification on status change
    if (body.status && (body.status === 'approved' || body.status === 'rejected') && body.status !== existingRecord.status && existingRecord.userId) {
      const users = await db.select({ email: schema.users.email })
        .from(schema.users)
        .where(eq(schema.users.id, existingRecord.userId))
        .limit(1)

      if (users.length > 0 && users[0]!.email) {
        await sendSponsorStatusEmail(event, users[0]!.email, existingRecord.message, body.status, body.rejection_reason || null)
      }
    }

    return { success: true, data: updated[0] }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error updating sponsor message:', error)
    throwServer(500, 'Failed to update sponsor message')
  }
})
