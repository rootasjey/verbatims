import { toggleLike } from '../../../../services/like.service'

defineRouteMeta({
  openAPI: {
    summary: 'Toggle like on an author',
    description: 'Likes or unlikes an author. Returns the new like state and updated count.',
    tags: ['Authors'],
    security: [{ apiKey: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    responses: {
      '200': { description: 'Like toggled' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  const authorId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(authorId)) throwServer(400, 'Invalid author ID')

  const result = await toggleLike('author', authorId, api.userId)

  return { success: true, data: result }
})
