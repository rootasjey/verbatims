import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import { createReferenceSchema } from '../../../validation/schemas'
import { logActivity } from '~~/server/utils/activity-log'
import { uploadAndStoreImage } from '~~/server/utils/image-storage'

defineRouteMeta({
  openAPI: {
    summary: 'Create a reference',
    description: 'Creates a new reference. Requires moderator or admin role.',
    tags: ['References'],
    security: [{ apiKey: ['write:references'] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name', 'primary_type'],
            properties: {
              name: { type: 'string' },
              primary_type: { type: 'string', description: 'Type of reference (e.g. film, book, game)' },
              secondary_type: { type: 'string', nullable: true },
              description: { type: 'string', nullable: true },
              release_date: { type: 'string', nullable: true },
              original_language: { type: 'string', nullable: true },
              image_url: { type: 'string', nullable: true },
              image_credit_status: { type: 'string', enum: ['creator_known', 'source_known', 'unknown'], nullable: true },
              image_license_status: { type: 'string', enum: ['documented', 'undocumented', 'territory_limited'], nullable: true },
              urls: { type: 'object', additionalProperties: true, nullable: true, description: 'External URLs' },
            },
          },
        },
      },
    },
    responses: {
      '201': { description: 'Reference created' },
      '403': { description: 'Insufficient role' },
      '409': { description: 'Reference with this name already exists' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiPermission(api, 'write:references')
  requireApiKeyRole(api, 'admin', 'moderator')

  const body = await readValidatedBody(event, createReferenceSchema.parse)

  const existingReference = await db.select()
    .from(schema.quoteReferences)
    .where(sql`LOWER(${schema.quoteReferences.name}) = LOWER(${body.name.trim()})`)
    .get()

  if (existingReference) throwServer(409, 'A reference with this name already exists')

  const result = await db.insert(schema.quoteReferences)
    .values({
      name: body.name,
      originalLanguage: body.original_language || 'en',
      releaseDate: body.release_date ?? null,
      description: body.description ?? null,
      primaryType: body.primary_type as any,
      secondaryType: body.secondary_type ?? null,
      imageUrl: body.image_url ?? null,
      imageAlt: body.image_alt ?? null,
      imageCredit: body.image_credit ?? null,
      imageCreditStatus: body.image_credit_status ?? null,
      imageSourceUrl: body.image_source_url ?? null,
      imageLicense: body.image_license ?? null,
      imageLicenseStatus: body.image_license_status ?? null,
      imageDate: body.image_date ?? null,
      imageLocation: body.image_location ?? null,
      urls: JSON.stringify(body.urls || {}),
      viewsCount: 0,
      likesCount: 0,
      sharesCount: 0,
    } as any)
    .returning()
    .get()

  let imageUrl = result.imageUrl
  if (body.image_url) {
    const storedUrl = await uploadAndStoreImage(body.image_url, 'references', result.id)
    if (storedUrl && storedUrl !== result.imageUrl) {
      await db.update(schema.quoteReferences)
        .set({ imageUrl: storedUrl, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(schema.quoteReferences.id, result.id))
        .run()
      imageUrl = storedUrl
    }
  }

  await logActivity(event, { type: 'reference_created', userId: api.userId, targetId: result.id, targetType: 'reference', metadata: { name: result.name } })

  return {
    success: true,
    data: {
      id: result.id,
      name: result.name,
      type: result.primaryType,
      secondary_type: result.secondaryType,
      image_url: imageUrl,
      image_alt: result.imageAlt,
      image_credit: result.imageCredit,
      image_credit_status: result.imageCreditStatus,
      image_source_url: result.imageSourceUrl,
      image_license: result.imageLicense,
      image_license_status: result.imageLicenseStatus,
      release_date: result.releaseDate,
      language: result.originalLanguage,
      description: result.description,
      urls: result.urls ? JSON.parse(result.urls) : [],
      stats: { views: result.viewsCount, likes: result.likesCount, shares: result.sharesCount },
      created_at: result.createdAt,
      updated_at: result.updatedAt,
    },
    message: 'Reference created successfully',
  }
})
