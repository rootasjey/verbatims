import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import { createAuthorSchema } from '../../../validation/schemas'
import { saveAuthorTranslations } from '~~/server/utils/entity-translations'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireModerator(event)

    const body = await readValidatedBody(event, createAuthorSchema.parse)

    // Check if author with same name already exists
    const existingAuthor = await db.select()
      .from(schema.authors)
      .where(sql`LOWER(${schema.authors.name}) = LOWER(${body.name.trim()})`)
      .get()

    if (existingAuthor) {
      throwServer(409, 'An author with this name already exists')
    }

    // Insert author (without image URL — we'll upload to R2 first)
    const result = await db.insert(schema.authors)
      .values({
        name: body.name,
        isFictional: body.is_fictional,
        birthDate: body.birth_date ?? null,
        birthLocation: body.birth_location ?? null,
        deathDate: body.death_date ?? null,
        deathLocation: body.death_location ?? null,
        job: body.job ?? null,
        description: body.description ?? null,
        imageUrl: null,
        imageAlt: body.image_alt ?? null,
        imageCredit: body.image_credit ?? null,
        imageSourceUrl: body.image_source_url ?? null,
        imageLicense: body.image_license ?? null,
        imageDate: body.image_date ?? null,
        imageLocation: body.image_location ?? null,
        socials: JSON.stringify(body.socials || {}),
        viewsCount: 0,
        likesCount: 0,
        sharesCount: 0
      })
      .returning()
      .get()

    await saveAuthorTranslations(result.id, body.translations)

    let finalImageUrl: string | null = null
    if (body.image_url) {
      finalImageUrl = await uploadAndStoreImage(body.image_url, 'authors', result.id)
    }

    if (finalImageUrl) {
      const updated = await db.update(schema.authors)
        .set({ imageUrl: finalImageUrl })
        .where(eq(schema.authors.id, result.id))
        .returning()
        .get()

      return {
        success: true,
        data: updated
      }
    }

    return {
      success: true,
      data: result
    }

  } catch (error: any) {
    console.error('Error creating author:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throwServer(500, 'Internal server error')
  }
})
