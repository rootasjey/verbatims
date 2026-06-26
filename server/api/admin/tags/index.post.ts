import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  try {
    const body = await readBody(event)
    const name = String(body?.name || '').trim()
    const color = (body?.color as string) || '#687FE5'
    const description = (body?.description as string) || null
    const category = (body?.category as string) || null
    if (!name || name.length < 2) {
      throwServer(400, 'Tag name is required')
    }

    const exists = await db.select({ id: schema.tags.id })
      .from(schema.tags)
      .where(sql`LOWER(${schema.tags.name}) = LOWER(${name})`)
      .limit(1)
    
    if (exists.length > 0) { 
      throwServer(409, 'Tag with this name already exists') 
    }

    const result = await db.insert(schema.tags).values({
      name,
      description,
      category,
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
