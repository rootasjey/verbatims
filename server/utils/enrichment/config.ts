import { useStorage } from 'nitropack/runtime/internal/storage'

const ENRICHMENT_CONFIG_KEY = 'enrichment:config:v1'

type Source = 'kv' | 'env' | 'default' | 'none'

export interface EnrichmentConfigStore {
  updatedAt: string
  scheduleEnabled?: boolean
  processEnabled?: boolean
  scheduleBatchSize?: number
  processBatchSize?: number
  authorStaleDays?: number
  referenceStaleDays?: number
  reviewGraceDays?: number
}

export interface ResolvedEnrichmentConfig {
  updatedAt: string | null
  values: {
    scheduleEnabled: boolean
    processEnabled: boolean
    scheduleBatchSize: number
    processBatchSize: number
    authorStaleDays: number
    referenceStaleDays: number
    reviewGraceDays: number
  }
  sources: Record<keyof ResolvedEnrichmentConfig['values'], Source>
}

function getKvStorage() {
  return useStorage('kv')
}

function getRuntimeConfigSafe() {
  try {
    return useRuntimeConfig() as Record<string, any>
  } catch {
    return undefined
  }
}

function normalizeStoredConfig(raw: unknown): EnrichmentConfigStore | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Record<string, unknown>

  return {
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
    scheduleEnabled: typeof value.scheduleEnabled === 'boolean' ? value.scheduleEnabled : undefined,
    processEnabled: typeof value.processEnabled === 'boolean' ? value.processEnabled : undefined,
    scheduleBatchSize: normalizePositiveInt(value.scheduleBatchSize),
    processBatchSize: normalizePositiveInt(value.processBatchSize),
    authorStaleDays: normalizePositiveInt(value.authorStaleDays),
    referenceStaleDays: normalizePositiveInt(value.referenceStaleDays),
    reviewGraceDays: normalizePositiveInt(value.reviewGraceDays),
  }
}

export async function getEnrichmentConfigStore(): Promise<EnrichmentConfigStore | null> {
  try {
    const raw = await getKvStorage().getItem<EnrichmentConfigStore>(ENRICHMENT_CONFIG_KEY)
    return normalizeStoredConfig(raw)
  } catch {
    return null
  }
}

export async function setEnrichmentConfigStore(next: EnrichmentConfigStore) {
  await getKvStorage().setItem(ENRICHMENT_CONFIG_KEY, {
    ...next,
    updatedAt: new Date().toISOString(),
  })
}

export async function updateEnrichmentConfigStore(input: Partial<EnrichmentConfigStore>) {
  const stored = await getEnrichmentConfigStore()
  const next: EnrichmentConfigStore = {
    updatedAt: stored?.updatedAt || new Date().toISOString(),
    scheduleEnabled: typeof input.scheduleEnabled === 'boolean' ? input.scheduleEnabled : stored?.scheduleEnabled,
    processEnabled: typeof input.processEnabled === 'boolean' ? input.processEnabled : stored?.processEnabled,
    scheduleBatchSize: normalizePositiveInt(input.scheduleBatchSize) ?? stored?.scheduleBatchSize,
    processBatchSize: normalizePositiveInt(input.processBatchSize) ?? stored?.processBatchSize,
    authorStaleDays: normalizePositiveInt(input.authorStaleDays) ?? stored?.authorStaleDays,
    referenceStaleDays: normalizePositiveInt(input.referenceStaleDays) ?? stored?.referenceStaleDays,
    reviewGraceDays: normalizePositiveInt(input.reviewGraceDays) ?? stored?.reviewGraceDays,
  }

  await setEnrichmentConfigStore(next)
  return next
}

export async function resolveEnrichmentConfig(): Promise<ResolvedEnrichmentConfig> {
  const stored = await getEnrichmentConfigStore()
  const runtimeConfig = getRuntimeConfigSafe()

  const scheduleEnabled = resolveBooleanField(stored?.scheduleEnabled, runtimeConfig?.dataVerificationCronEnabled, true)
  const processEnabled = resolveBooleanField(stored?.processEnabled, runtimeConfig?.dataVerificationProcessEnabled, true)
  const scheduleBatchSize = resolveNumberField(stored?.scheduleBatchSize, runtimeConfig?.dataVerificationBatchSize, 25)
  const processBatchSize = resolveNumberField(stored?.processBatchSize, runtimeConfig?.dataVerificationProcessBatchSize, 3)
  const authorStaleDays = resolveNumberField(stored?.authorStaleDays, runtimeConfig?.dataVerificationAuthorStaleDays, 180)
  const referenceStaleDays = resolveNumberField(stored?.referenceStaleDays, runtimeConfig?.dataVerificationReferenceStaleDays, 365)
  const reviewGraceDays = resolveNumberField(stored?.reviewGraceDays, runtimeConfig?.dataVerificationReviewGraceDays, 14)

  return {
    updatedAt: stored?.updatedAt || null,
    values: {
      scheduleEnabled: scheduleEnabled.value,
      processEnabled: processEnabled.value,
      scheduleBatchSize: scheduleBatchSize.value,
      processBatchSize: processBatchSize.value,
      authorStaleDays: authorStaleDays.value,
      referenceStaleDays: referenceStaleDays.value,
      reviewGraceDays: reviewGraceDays.value,
    },
    sources: {
      scheduleEnabled: scheduleEnabled.source,
      processEnabled: processEnabled.source,
      scheduleBatchSize: scheduleBatchSize.source,
      processBatchSize: processBatchSize.source,
      authorStaleDays: authorStaleDays.source,
      referenceStaleDays: referenceStaleDays.source,
      reviewGraceDays: reviewGraceDays.source,
    }
  }
}

function resolveBooleanField(kv: boolean | undefined, envRaw: string | undefined, fallback: boolean) {
  if (typeof kv === 'boolean') return { value: kv, source: 'kv' as const }
  const env = parseBooleanEnv(envRaw)
  if (typeof env === 'boolean') return { value: env, source: 'env' as const }
  return { value: fallback, source: 'default' as const }
}

function resolveNumberField(kv: number | undefined, envRaw: string | undefined, fallback: number) {
  if (typeof kv === 'number' && Number.isFinite(kv) && kv > 0) {
    return { value: kv, source: 'kv' as const }
  }

  const env = normalizePositiveInt(envRaw)
  if (typeof env === 'number') {
    return { value: env, source: 'env' as const }
  }

  return { value: fallback, source: 'default' as const }
}

function parseBooleanEnv(raw: string | undefined): boolean | null {
  if (typeof raw !== 'string') return null
  const normalized = raw.trim().toLowerCase()
  if (!normalized) return null
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  return null
}

function normalizePositiveInt(value: unknown): number | undefined {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}