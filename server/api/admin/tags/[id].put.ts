import { db, schema } from 'hub:db'
import { eq, and, ne, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  try {
    const id = getRouterParam(event, 'id')
    if (!id || isNaN(parseInt(id))) throw createError({ statusCode: 400, statusMessage: 'Invalid tag ID' })
    const tagId = parseInt(id)
    const body = await readBody(event)

    const existing = await db.select()
      .from(schema.tags)
      .where(eq(schema.tags.id, tagId))
      .limit(1)
    
    if (!existing || existing.length === 0) throw createError({ statusCode: 404, statusMessage: 'Tag not found' })

    // If updating name, ensure uniqueness (case-insensitive) excluding current ID
    if (typeof body.name === 'string' && body.name.trim()) {
      const nameTrimmed = body.name.trim()
      const conflict = await db.select({ id: schema.tags.id })
        .from(schema.tags)
        .where(
          and(
            sql`LOWER(${schema.tags.name}) = LOWER(${nameTrimmed})`,
            ne(schema.tags.id, tagId)
          )
        )
        .limit(1)

      if (conflict.length > 0) { 
        throw createError({ statusCode: 409, statusMessage: 'Tag with this name already exists' }) 
      }
    }

    const updates: any = {}
    if (typeof body.name === 'string' && body.name.trim()) { 
      updates.name = body.name.trim() 
    }
    if (typeof body.description === 'string' || body.description === null) { 
      updates.description = body.description ?? null 
    }
    if (typeof body.category === 'string' || body.category === null) { 
      updates.category = body.category ?? null 
    }
    if (typeof body.color === 'string' && body.color.trim()) { 
      updates.color = body.color.trim() 
    }

    if (Object.keys(updates).length === 0) {
      return { success: true, data: existing[0] }
    }

    await db.update(schema.tags)
      .set(updates)
      .where(eq(schema.tags.id, tagId))

    const updated = await db.select()
      .from(schema.tags)
      .where(eq(schema.tags.id, tagId))
      .limit(1)
    
    return { success: true, data: updated[0] }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error updating tag:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to update tag' })
  }
})
