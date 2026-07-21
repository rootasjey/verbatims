import { findExistingLike } from '../../../../services/like.service'

defineRouteMeta({
  openAPI: {
    summary: 'Check like status on a quote',
    description: 'Returns whether the authenticated user has liked this quote.',
    tags: ['Quotes'],
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
  const quoteId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(quoteId)) throwServer(400, 'Invalid quote ID')

  const api = event.context.api
  const like = await findExistingLike('quote', quoteId, api.userId)

  return { success: true, data: { isLiked: !!like } }
})
