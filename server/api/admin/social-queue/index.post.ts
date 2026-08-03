import { addQuotesToQueue } from '../../../utils/social-queue-api'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  const body = await readBody(event)
  const inserted = await addQuotesToQueue({
    quoteIds: body?.quoteIds,
    platform: body?.platform || 'x',
    scheduledFor: body?.scheduledFor || null,
    createdBy: user.id
  })

  return {
    success: true,
    data: inserted,
    count: inserted.length
  }
})
