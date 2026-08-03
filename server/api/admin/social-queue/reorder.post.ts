import { reorderSocialQueueItem } from '../../../utils/social-queue-api'

export default defineEventHandler(async (event) => {
  await requireModerator(event)

  const body = await readBody(event)
  const data = await reorderSocialQueueItem({
    id: Number(body?.id),
    direction: body?.direction || '',
    beforeId: body?.beforeId
  })

  return {
    success: true,
    data
  }
})
