import { setSocialQueueAutofillSettings } from '../../../utils/social-queue-autofill-config'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{ target?: unknown, lowWatermark?: unknown }>(event)
  const target = Number(body?.target)
  const lowWatermark = Number(body?.lowWatermark)

  if (!Number.isInteger(target) || target < 2 || target > 100) {
    throwServer(400, 'Target must be an integer between 2 and 100')
  }
  if (!Number.isInteger(lowWatermark) || lowWatermark < 1 || lowWatermark >= target) {
    throwServer(400, 'Low watermark must be an integer greater than 0 and lower than the target')
  }

  const config = await setSocialQueueAutofillSettings({ target, lowWatermark })

  return {
    success: true,
    data: {
      target: config.target,
      lowWatermark: config.lowWatermark,
      updatedAt: config.updatedAt
    }
  }
})
