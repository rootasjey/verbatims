import { toggleLike } from '../../../../services/like.service'

defineRouteMeta({
  openAPI: {
    summary: 'Toggle like on a reference',
    description: 'Likes or unlikes a reference. Returns the new like state and updated count.',
    tags: ['References'],
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
  const refId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(refId)) throwServer(400, 'Invalid reference ID')

  const result = await toggleLike('reference', refId, api.userId)

  return { success: true, data: result }
})
