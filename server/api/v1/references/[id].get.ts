import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const refId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(refId)) throwServer(400, 'Invalid reference ID')

  const ref = await db
    .select({
      id: schema.quoteReferences.id,
      name: schema.quoteReferences.name,
      primaryType: schema.quoteReferences.primaryType,
      secondaryType: schema.quoteReferences.secondaryType,
      imageUrl: schema.quoteReferences.imageUrl,
      releaseDate: schema.quoteReferences.releaseDate,
      originalLanguage: schema.quoteReferences.originalLanguage,
      description: schema.quoteReferences.description,
      urls: schema.quoteReferences.urls,
      viewsCount: schema.quoteReferences.viewsCount,
      likesCount: schema.quoteReferences.likesCount,
      sharesCount: schema.quoteReferences.sharesCount,
      createdAt: schema.quoteReferences.createdAt,
      updatedAt: schema.quoteReferences.updatedAt,
    })
    .from(schema.quoteReferences)
    .where(eq(schema.quoteReferences.id, refId))
    .get()

  if (!ref) throwServer(404, 'Reference not found')

  return {
    success: true,
    data: {
      id: ref.id,
      name: ref.name,
      type: ref.primaryType,
      secondary_type: ref.secondaryType,
      image_url: ref.imageUrl,
      release_date: ref.releaseDate,
      language: ref.originalLanguage,
      description: ref.description,
      urls: ref.urls ? JSON.parse(ref.urls) : [],
      stats: { views: ref.viewsCount, likes: ref.likesCount, shares: ref.sharesCount },
      created_at: ref.createdAt,
      updated_at: ref.updatedAt,
    },
  }
})
