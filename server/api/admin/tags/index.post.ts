import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import { createTagSchema } from '../../../validation/schemas'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  try {
    const body = await readValidatedBody(event, createTagSchema.parse)
    const color = body.color || '#687FE5'

    const exists = await db.select({ id: schema.tags.id })
      .from(schema.tags)
      .where(sql`LOWER(${schema.tags.name}) = LOWER(${body.name})`)
      .limit(1)
    
    if (exists.length > 0) { 
      throwServer(409, 'Tag with this name already exists') 
    }

    const result = await db.insert(schema.tags).values({
      name: body.name,
      description: body.description ?? null,
      category: body.category ?? null,
      color
    }).returning()

    if (!result || result.length === 0) {
      throwServer(500, 'Failed to create tag')
    }

    return { success: true, data: result[0] }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error creating tag:', error)
    throwServer(500, 'Failed to create tag')
  }
})
