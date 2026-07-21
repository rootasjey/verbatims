import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    summary: 'Get a single author',
    description: 'Returns details of an author by ID.',
    tags: ['Authors'],
    security: [{ apiKey: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    responses: {
      '200': { description: 'Author details' },
      '404': { description: 'Author not found' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const authorId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(authorId)) throwServer(400, 'Invalid author ID')

  const author = await db
    .select({
      id: schema.authors.id,
      name: schema.authors.name,
      isFictional: schema.authors.isFictional,
      imageUrl: schema.authors.imageUrl,
      job: schema.authors.job,
      birthDate: schema.authors.birthDate,
      deathDate: schema.authors.deathDate,
      birthLocation: schema.authors.birthLocation,
      deathLocation: schema.authors.deathLocation,
      description: schema.authors.description,
      viewsCount: schema.authors.viewsCount,
      likesCount: schema.authors.likesCount,
      sharesCount: schema.authors.sharesCount,
      createdAt: schema.authors.createdAt,
      updatedAt: schema.authors.updatedAt,
    })
    .from(schema.authors)
    .where(eq(schema.authors.id, authorId))
    .get()

  if (!author) throwServer(404, 'Author not found')

  return {
    success: true,
    data: {
      id: author.id,
      name: author.name,
      fictional: author.isFictional,
      image_url: author.imageUrl,
      job: author.job,
      dates: {
        birth: author.birthDate,
        death: author.deathDate,
        birth_location: author.birthLocation,
        death_location: author.deathLocation,
      },
      description: author.description,
      stats: { views: author.viewsCount, likes: author.likesCount, shares: author.sharesCount },
      created_at: author.createdAt,
      updated_at: author.updatedAt,
    },
  }
})
