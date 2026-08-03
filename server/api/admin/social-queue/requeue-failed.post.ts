import { requeueFailedSocialQueueItems } from '../../../utils/social-queue-api'

export default defineEventHandler(async (event) => {
  await requireModerator(event)

  const body = await readBody(event)
  const data = await requeueFailedSocialQueueItems(String(body?.platform || '').trim())

  return {
    success: true,
    data
  }
})
