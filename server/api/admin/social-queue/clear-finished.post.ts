import { clearSocialQueue } from '../../../utils/social-queue-api'

export default defineEventHandler(async (event) => {
  await requireModerator(event)

  const body = await readBody(event)
  const data = await clearSocialQueue({
    platform: String(body?.platform || '').trim(),
    confirm: Boolean(body?.confirm),
    scope: 'finished'
  })

  return {
    success: true,
    data
  }
})
