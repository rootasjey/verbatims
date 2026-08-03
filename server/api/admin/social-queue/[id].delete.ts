import { deleteSocialQueueItem } from '../../../utils/social-queue-api'

export default defineEventHandler(async (event) => {
  await requireModerator(event)

  const id = Number(getRouterParam(event, 'id'))
  const data = await deleteSocialQueueItem(id)

  return {
    success: true,
    data
  }
})
