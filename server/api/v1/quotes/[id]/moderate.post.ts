import { db, schema } from 'hub:db'
import { eq, and } from 'drizzle-orm'
import { moderateQuoteSchema } from '../../../../validation/schemas'
import { autoTagQuoteById } from '~~/server/utils/tagging'
import { logActivity } from '~~/server/utils/activity-log'

defineRouteMeta({
  openAPI: {
    summary: 'Moderate a quote',
    description: 'Approve or reject a pending quote. Requires moderator or admin role.',
    tags: ['Quotes', 'Moderation'],
    security: [{ apiKey: ['write:quotes'] }],
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['action'],
            properties: {
              action: { type: 'string', enum: ['approve', 'reject'] },
              rejection_reason: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
    responses: {
      '200': { description: 'Quote moderated successfully' },
      '400': { description: 'Invalid request' },
      '403': { description: 'Moderator or admin access required' },
      '404': { description: 'Quote not found or not pending' },
    },
  },
})

export default defineEventHandler(async (event) => {
  const api = event.context.api
  requireApiPermission(api, 'write:quotes')

  if (api.userRole !== 'admin' && api.userRole !== 'moderator') {
    throwServer(403, 'Moderator or admin access required')
  }

  const quoteId = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(quoteId)) throwServer(400, 'Invalid quote ID')

  const body = await readValidatedBody(event, moderateQuoteSchema.parse)

  const quote = await db.select()
    .from(schema.quotes)
    .where(and(
      eq(schema.quotes.id, quoteId),
      eq(schema.quotes.status, 'pending')
    ))
    .get()

  if (!quote) throwServer(404, 'Quote not found or not pending moderation')

  const newStatus = body.action === 'approve' ? 'approved' : 'rejected'

  await db.update(schema.quotes)
    .set({
      status: newStatus,
      moderatorId: api.userId,
      moderatedAt: new Date(),
      rejectionReason: body.action === 'reject' ? (body.rejection_reason || '').trim() : null,
      updatedAt: new Date(),
    })
    .where(eq(schema.quotes.id, quoteId))
    .run()

  await logActivity(event, { type: 'quote_moderated', userId: api.userId, targetId: quoteId, targetType: 'quote', metadata: { new_status: newStatus, previous_status: 'pending', action: body.action, rejection_reason: body.rejection_reason } })

  let autoTagResult: { matchedTagNames: string[], attachedCount: number } | null = null
  if (body.action === 'approve') {
    autoTagResult = await autoTagQuoteById(
      quote.id,
      quote.name,
      quote.language || undefined
    )
  }

  return {
    success: true,
    data: {
      id: quote.id,
      status: newStatus,
      auto_tagging: autoTagResult,
    },
    message: `Quote ${body.action === 'approve' ? 'approved' : 'rejected'} successfully`,
  }
})
