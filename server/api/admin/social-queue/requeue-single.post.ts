import { requeueSocialQueueItem } from '../../../utils/social-queue-api'

export default defineEventHandler(async (event) => {
  await requireModerator(event)

  const body = await readBody(event)
  const data = await requeueSocialQueueItem(Number(body?.id))

  return {
    success: true,
    data
  }
})
