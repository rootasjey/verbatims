import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  try {
    const body = await readBody(event)
    const message = String(body?.message || '').trim()
    if (!message) {
      throw createError({ statusCode: 400, statusMessage: 'Message is required' })
    }

    const result = await db.insert(schema.sponsorMessages).values({
      message,
      leadingIcon: body.leading_icon || null,
      trailingIcon: body.trailing_icon || null,
      url: body.url || null,
      type: body.type || 'internal',
      isActive: body.is_active !== undefined ? Boolean(body.is_active) : true,
      priority: typeof body.priority === 'number' ? body.priority : 0,
      startsAt: body.starts_at || null,
      endsAt: body.ends_at || null,
      maxViews: body.max_views || null,
    }).returning()

    if (!result || result.length === 0) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to create sponsor message' })
    }

    return { success: true, data: result[0] }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error creating sponsor message:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to create sponsor message' })
  }
})
