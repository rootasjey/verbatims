import { getSocialQueueAutofillOverview } from '../../../utils/social-queue-replenish'

export default defineEventHandler(async (event) => {
  await requireModerator(event)

  return {
    success: true,
    data: await getSocialQueueAutofillOverview()
  }
})
