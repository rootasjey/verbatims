import { db, schema } from 'hub:db'
import { sql, eq, and } from 'drizzle-orm'

/**
 * Admin API: Update Author
 * Updates an existing author with admin authentication
 */
export default defineEventHandler(async (event) => {
  try {
    // Check admin authentication
    const { user } = await requireUserSession(event)
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      throwServer(403, 'Admin or moderator access required')
    }

    const authorId = getRouterParam(event, 'id')!
    if (!authorId || isNaN(parseInt(authorId))) {
      throwServer(400, 'Invalid author ID')
    }

    const body = await readBody(event) as UpdateAuthorData

    // Check if author exists
    const existingAuthor = await db.select()
      .from(schema.authors)
      .where(eq(schema.authors.id, parseInt(authorId)))
      .get()

    if (!existingAuthor) {
      throwServer(404, 'Author not found')
    }

    // Validate required fields
    if (body.name !== undefined && (!body.name || !body.name.trim())) {
      throwServer(400, 'Author name is required')
    }

    if (body.name && body.name.trim() !== existingAuthor!.name) {
      const duplicateAuthor = await db.select()
        .from(schema.authors)
        .where(and(
          sql`LOWER(${schema.authors.name}) = LOWER(${body.name.trim()})`,
          sql`${schema.authors.id} != ${parseInt(authorId)}`
        ))
        .get()

      if (duplicateAuthor) {
        throwServer(409, 'An author with this name already exists')
      }
    }

    // Build update object
    const updateData: any = { updatedAt: sql`CURRENT_TIMESTAMP` }

    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.is_fictional !== undefined) updateData.isFictional = body.is_fictional
    if (body.birth_date !== undefined) updateData.birthDate = body.birth_date
    if (body.birth_location !== undefined) updateData.birthLocation = body.birth_location
    if (body.death_date !== undefined) updateData.deathDate = body.death_date
    if (body.death_location !== undefined) updateData.deathLocation = body.death_location
    if (body.job !== undefined) updateData.job = body.job
    if (body.description !== undefined) updateData.description = body.description
    if (body.socials !== undefined) updateData.socials = JSON.stringify(body.socials)

    if (body.image_url !== undefined) {
      const oldUrl = existingAuthor!.imageUrl
      const newUrl = body.image_url

      if (newUrl !== oldUrl) {
        // Delete old R2 image if it exists
        if (isR2ImageUrl(oldUrl!)) {
          await deleteImageByUrl(oldUrl!)
        }

        if (newUrl) {
          const storedUrl = await uploadAndStoreImage(newUrl, 'authors', parseInt(authorId))
          updateData.imageUrl = storedUrl || newUrl
        } else {
          updateData.imageUrl = null
        }
      }
      // If newUrl === oldUrl, no change needed — skip entirely
    }

    if (Object.keys(updateData).length === 1) { // Only updatedAt was added
      throwServer(400, 'No fields to update')
    }

    // Update author
    const updatedAuthor = await db.update(schema.authors)
      .set(updateData)
      .where(eq(schema.authors.id, parseInt(authorId!)))
      .returning()
      .get()

    return {
      success: true,
      data: updatedAuthor
    }

  } catch (error: any) {
    console.error('Error updating author:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throwServer(500, 'Internal server error')
  }
})
