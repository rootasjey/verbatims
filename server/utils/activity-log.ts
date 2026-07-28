import type { H3Event } from 'h3'
import { db, schema } from 'hub:db'

export interface ActivityLogParams {
  type: ActivityType
  userId?: number | null
  targetId?: number | null
  targetType: TargetType
  metadata?: Record<string, unknown>
}

export async function logActivity(event: H3Event, params: ActivityLogParams) {
  const source = (event.context as any)?.source ?? 'web'
  await db.insert(schema.activityLogs).values({
    type: params.type,
    userId: params.userId ?? null,
    targetId: params.targetId ?? null,
    targetType: params.targetType,
    metadata: JSON.stringify(params.metadata ?? {}),
    source: event.context?.source ?? 'web',
  }).run()
}

export type ActivityType =
  | 'quote_created'
  | 'quote_submitted'
  | 'quote_moderated'
  | 'quote_edited'
  | 'quote_deleted'
  | 'quote_unpublished'
  | 'author_created'
  | 'author_edited'
  | 'author_deleted'
  | 'reference_created'
  | 'reference_edited'
  | 'reference_deleted'
  | 'user_registered'
  | 'export_run'

export type TargetType = 'quote' | 'author' | 'reference' | 'user'
