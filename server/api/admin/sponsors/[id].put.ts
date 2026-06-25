import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throwServer(403, 'Admin access required')
  }

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

    const updates: any = {}
    if (typeof body.message === 'string' && body.message.trim()) {
      updates.message = body.message.trim()
    }
    if (body.leading_icon !== undefined) updates.leadingIcon = body.leading_icon || null
    if (body.trailing_icon !== undefined) updates.trailingIcon = body.trailing_icon || null
    if (body.url !== undefined) updates.url = body.url || null
    if (body.type !== undefined) updates.type = body.type
    if (body.is_active !== undefined) updates.isActive = Boolean(body.is_active)
    if (body.priority !== undefined) updates.priority = body.priority
    if (body.starts_at !== undefined) updates.startsAt = body.starts_at || null
    if (body.ends_at !== undefined) updates.endsAt = body.ends_at || null
    if (body.max_views !== undefined) updates.maxViews = body.max_views || null

    if (Object.keys(updates).length === 0) {
      return { success: true, data: existing[0] }
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
    if ((error as any).statusCode) throw error
    console.error('Error updating sponsor message:', error)
    throwServer(500, 'Failed to update sponsor message')
  }
})
