import { findExistingLike } from '../../../../services/like.service'

defineRouteMeta({
  openAPI: {
    summary: 'Check like status on a reference',
    description: 'Returns whether the authenticated user has liked this reference.',
    tags: ['References'],
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
  const refId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(refId)) throwServer(400, 'Invalid reference ID')

  const api = event.context.api
  const like = await findExistingLike('reference', refId, api.userId)

  return { success: true, data: { isLiked: !!like } }
})
