import { resolveEnrichmentConfig, updateEnrichmentConfigStore } from '../../../utils/enrichment/config'
import throwServer from '../../../utils/throw-server'

function normalizeBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  }
  return fallback
}

function normalizePositiveInt(value: unknown): number | undefined {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function normalizeScoreInt(value: unknown): number | undefined {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 100 ? parsed : undefined
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user || session.user.role !== 'admin') {
    throwServer(403, 'Admin access required')
  }

  const body = await readBody<Record<string, unknown>>(event)

  await updateEnrichmentConfigStore({
    scheduleEnabled: normalizeBoolean(body?.scheduleEnabled, true),
    processEnabled: normalizeBoolean(body?.processEnabled, true),
    scheduleBatchSize: normalizePositiveInt(body?.scheduleBatchSize),
    processBatchSize: normalizePositiveInt(body?.processBatchSize),
    authorStaleDays: normalizePositiveInt(body?.authorStaleDays),
    referenceStaleDays: normalizePositiveInt(body?.referenceStaleDays),
    reviewGraceDays: normalizePositiveInt(body?.reviewGraceDays),
    authorMatchMinScore: normalizeScoreInt(body?.authorMatchMinScore),
    referenceMatchMinScore: normalizeScoreInt(body?.referenceMatchMinScore),
    ambiguousMatchGap: normalizePositiveInt(body?.ambiguousMatchGap),
  })

  return {
    success: true,
    data: await resolveEnrichmentConfig(),
  }
})