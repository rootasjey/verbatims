import { addRandomQuotesToQueue } from '../../../utils/social-queue-api'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireModerator(event)

    const body = await readBody(event)
    const inserted = await addRandomQuotesToQueue({
      platform: body?.platform || 'x',
      count: body?.count || 5,
      language: body?.language || '',
      createdBy: user.id
    })

    return {
      success: true,
      data: inserted,
      count: inserted.length
    }
  }
  catch (err: any) {
    console.error('Error adding random quotes to social queue:', err)
    const originalMessage = err?.message || err?.statusMessage || ''
    const detail = err?.cause?.message || err?.data?.message || ''
    const combined = [originalMessage, detail].filter(Boolean).join(': ')
    throwServer(500, combined || 'Failed to add random quotes to social queue', {
      data: { originalError: err?.message || String(err) }
    })
  }
})
