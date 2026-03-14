import { scheduleVerificationJobs } from '~/server/utils/enrichment/scheduler'
import { isEnrichmentEntityType } from '#shared/constants/enrichment'
import throwServer from '~/server/utils/throw-server'

interface ScheduleBody {
  entityType?: string
  entityId?: number
  entityIds?: number[]
  limitPerType?: number
  includeAuthors?: boolean
  includeReferences?: boolean
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || !['admin', 'moderator'].includes(session.user.role)) {
    throwServer(403, 'Admin access required')
  }

  const body = await readBody<ScheduleBody>(event)
  const entityIds = Array.isArray(body?.entityIds) ? body.entityIds.map(value => Number(value)).filter(Number.isInteger) : []
  const entityTypes = [] as Array<'author' | 'reference'>

  if (body?.entityType) {
    if (!isEnrichmentEntityType(body.entityType)) {
      throwServer(400, 'entityType must be author or reference')
    }

    entityTypes.push(body.entityType)
  } else {
    if (body?.includeAuthors !== false) entityTypes.push('author')
    if (body?.includeReferences === true) entityTypes.push('reference')
  }

  const entityIdsByType = body?.entityType
    ? {
        [body.entityType]: uniqueTargetIds([
          ...(Number.isInteger(Number(body?.entityId)) ? [Number(body?.entityId)] : []),
          ...entityIds,
        ])
      }
    : undefined

  const result = await scheduleVerificationJobs({
    entityTypes,
    entityIdsByType,
    limitPerType: Number.isInteger(Number(body?.limitPerType)) ? Number(body.limitPerType) : undefined,
    triggeredBy: 'manual',
    createdBy: session.user.id,
    reason: body?.entityType ? 'manual' : undefined,
  })

  return {
    success: true,
    message: result.totalEnqueued > 0
      ? `${result.totalEnqueued} verification job(s) queued`
      : 'No verification jobs were queued',
    data: result,
  }
})

function uniqueTargetIds(values: number[]) {
  return Array.from(new Set(values.filter(value => Number.isInteger(value) && value > 0)))
}