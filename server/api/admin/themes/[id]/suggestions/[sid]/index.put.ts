import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  try {
    const id = getRouterParam(event, 'id')!
    const sid = getRouterParam(event, 'sid')!
    if (!id || isNaN(parseInt(id)) || !sid || isNaN(parseInt(sid))) {
      throwServer(400, 'Invalid theme ID or suggestion ID')
    }
    const themeId = parseInt(id)
    const suggestionId = parseInt(sid)

    const body = await readBody(event)
    const action: string = body?.action || ''
    if (!['accepted', 'rejected'].includes(action)) {
      throwServer(400, 'Action must be "accepted" or "rejected"')
    }

    const suggestion = await db.select()
      .from(schema.entitySuggestions)
      .where(eq(schema.entitySuggestions.id, suggestionId))
      .limit(1)
      .get()

    if (!suggestion) {
      throwServer(404, 'Suggestion not found')
    }
    if (suggestion.status !== 'pending') {
      throwServer(400, `Suggestion already ${suggestion.status}`)
    }

    // If accepted, create the entity in the appropriate table
    if (action === 'accepted') {
      const value = suggestion.suggestedValue.trim()
      switch (suggestion.type) {
        case 'tag': {
          const existing = await db.select({ id: schema.tags.id })
            .from(schema.tags)
            .where(eq(schema.tags.name, value))
            .limit(1)
            .get()
          if (!existing) {
            await db.insert(schema.tags).values({ name: value })
          }
          break
        }
        case 'author': {
          const existing = await db.select({ id: schema.authors.id })
            .from(schema.authors)
            .where(eq(schema.authors.name, value))
            .limit(1)
            .get()
          if (!existing) {
            await db.insert(schema.authors).values({ name: value })
          }
          break
        }
        case 'reference': {
          const existing = await db.select({ id: schema.quoteReferences.id })
            .from(schema.quoteReferences)
            .where(eq(schema.quoteReferences.name, value))
            .limit(1)
            .get()
          if (!existing) {
            await db.insert(schema.quoteReferences).values({ name: value, primaryType: 'other' })
          }
          break
        }
      }
    }

    await db.update(schema.entitySuggestions)
      .set({
        status: action as any,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      })
      .where(eq(schema.entitySuggestions.id, suggestionId))

    return { success: true, data: { id: suggestionId, status: action } }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Error updating entity suggestion:', error)
    throwServer(500, 'Failed to update entity suggestion')
  }
})
