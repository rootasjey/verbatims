import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  try {
    const body = await readBody(event)
    const name = String(body?.name || '').trim()
    const color = (body?.color as string) || '#687FE5'
    const description = (body?.description as string) || null
    const category = (body?.category as string) || null
    if (!name || name.length < 2) {
      throw createError({ statusCode: 400, statusMessage: 'Tag name is required' })
    }

    const exists = await db.select({ id: schema.tags.id })
      .from(schema.tags)
      .where(sql`LOWER(${schema.tags.name}) = LOWER(${name})`)
      .limit(1)
    
    if (exists.length > 0) { 
      throw createError({ statusCode: 409, statusMessage: 'Tag with this name already exists' }) 
    }

    const result = await db.insert(schema.tags).values({
      name,
      description,
      category,
      color
    }).returning()

    if (!result || result.length === 0) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to create tag' })
    }

    return { success: true, data: result[0] }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error creating tag:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to create tag' })
  }
})
