import { db, schema } from 'hub:db'
import { eq, and, ne, sql } from 'drizzle-orm'
import { updateTagSchema } from '../../../validation/schemas'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  try {
    const id = getRouterParam(event, 'id')!
    if (!id || isNaN(parseInt(id))) throwServer(400, 'Invalid tag ID')
    const tagId = parseInt(id)
    const body = await readValidatedBody(event, updateTagSchema.parse)

    const existing = await db.select()
      .from(schema.tags)
      .where(eq(schema.tags.id, tagId))
      .limit(1)
    
    if (!existing || existing.length === 0) throwServer(404, 'Tag not found')

    // If updating name, ensure uniqueness (case-insensitive) excluding current ID
    if (body.name) {
      const conflict = await db.select({ id: schema.tags.id })
        .from(schema.tags)
        .where(
          and(
            sql`LOWER(${schema.tags.name}) = LOWER(${body.name})`,
            ne(schema.tags.id, tagId)
          )
        )
        .limit(1)

      if (conflict.length > 0) { 
        throwServer(409, 'Tag with this name already exists') 
      }
    }

    const updates: Record<string, any> = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.description !== undefined) updates.description = body.description ?? null
    if (body.category !== undefined) updates.category = body.category ?? null
    if (body.color !== undefined) updates.color = body.color

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
    throwServer(500, 'Failed to update tag')
  }
})
