import { findExistingLike } from '../../../../services/like.service'

defineRouteMeta({
  openAPI: {
    summary: 'Check like status on an author',
    description: 'Returns whether the authenticated user has liked this author.',
    tags: ['Authors'],
    security: [{ apiKey: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    responses: {
      '200': { description: 'Like status' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const authorId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(authorId)) throwServer(400, 'Invalid author ID')

  const api = event.context.api
  const like = await findExistingLike('author', authorId, api.userId)

  return { success: true, data: { isLiked: !!like } }
})
