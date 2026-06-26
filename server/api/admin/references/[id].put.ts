import { db, schema } from 'hub:db'
import { sql, eq, and } from 'drizzle-orm'
import { updateReferenceSchema } from '../../../validation/schemas'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireModerator(event)

    const referenceId = getRouterParam(event, 'id')!
    if (!referenceId || isNaN(parseInt(referenceId))) {
      throwServer(400, 'Invalid reference ID')
    }

    const body = await readValidatedBody(event, updateReferenceSchema.parse)

    const existingReference = await db.select()
      .from(schema.quoteReferences)
      .where(eq(schema.quoteReferences.id, parseInt(referenceId)))
      .get()

    if (!existingReference) {
      throwServer(404, 'Reference not found')
    }

    // Check if another reference with same name already exists (excluding current reference)
    if (body.name && body.name !== existingReference.name) {
      const duplicateReference = await db.select()
        .from(schema.quoteReferences)
        .where(and(
          sql`LOWER(${schema.quoteReferences.name}) = LOWER(${body.name.trim()})`,
          sql`${schema.quoteReferences.id} != ${parseInt(referenceId)}`
        ))
        .get()

      if (duplicateReference) {
        throwServer(409, 'A reference with this name already exists')
      }
    }

    // Build update object
    const updateData: any = { updatedAt: sql`CURRENT_TIMESTAMP` }

    if (body.name !== undefined) updateData.name = body.name
    if (body.original_language !== undefined) updateData.originalLanguage = body.original_language
    if (body.release_date !== undefined) updateData.releaseDate = body.release_date
    if (body.description !== undefined) updateData.description = body.description
    if (body.primary_type !== undefined) updateData.primaryType = body.primary_type
    if (body.secondary_type !== undefined) updateData.secondaryType = body.secondary_type
    if (body.urls !== undefined) updateData.urls = JSON.stringify(body.urls)

    // Handle image URL changes (upload external images to R2)
    if (body.image_url !== undefined) {
      const oldUrl = existingReference!.imageUrl
      const newUrl = body.image_url

      if (newUrl !== oldUrl) {
        // Delete old R2 image if it exists
        if (isR2ImageUrl(oldUrl!)) {
          await deleteImageByUrl(oldUrl!)
        }

        if (newUrl) {
          const storedUrl = await uploadAndStoreImage(newUrl, 'references', parseInt(referenceId))
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

    // Update reference
    const updatedReference = await db.update(schema.quoteReferences)
      .set(updateData)
      .where(eq(schema.quoteReferences.id, parseInt(referenceId)))
      .returning()
      .get()

    return {
      success: true,
      data: updatedReference
    }

  } catch (error: any) {
    console.error('Error updating reference:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throwServer(500, 'Internal server error')
  }
})
