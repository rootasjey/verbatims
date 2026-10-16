import { useStorage } from 'nitropack/runtime/internal/storage'
import type { SocialPlatform } from '#shared/constants/social'

const STORAGE_KEY = 'social:queue:autofill:v1'

export type SocialQueueAutofillOutcome = 'refilled' | 'partial' | 'above-threshold' | 'no-quotes' | 'error'

export interface SocialQueueAutofillPlatformRun {
  queuedBefore: number
  queuedAfter: number
  added: number
  outcome: SocialQueueAutofillOutcome
}

export interface SocialQueueAutofillConfig {
  target: number
  lowWatermark: number
  updatedAt: string
  lastRunAt: string | null
  lastRunByPlatform: Partial<Record<SocialPlatform, SocialQueueAutofillPlatformRun>>
}

const DEFAULT_CONFIG: SocialQueueAutofillConfig = {
  target: 30,
  lowWatermark: 10,
  updatedAt: new Date(0).toISOString(),
  lastRunAt: null,
  lastRunByPlatform: {}
}

function getKvStorage() {
  return useStorage('kv')
}

function normalizeRun(value: unknown): SocialQueueAutofillPlatformRun | undefined {
  if (!value || typeof value !== 'object') return undefined
  const raw = value as Record<string, unknown>
  const outcomes: SocialQueueAutofillOutcome[] = ['refilled', 'partial', 'above-threshold', 'no-quotes', 'error']
  if (!outcomes.includes(raw.outcome as SocialQueueAutofillOutcome)) return undefined

  return {
    queuedBefore: Math.max(0, Math.floor(Number(raw.queuedBefore) || 0)),
    queuedAfter: Math.max(0, Math.floor(Number(raw.queuedAfter) || 0)),
    added: Math.max(0, Math.floor(Number(raw.added) || 0)),
    outcome: raw.outcome as SocialQueueAutofillOutcome
  }
}

function normalizeConfig(value: unknown): SocialQueueAutofillConfig | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const target = Number(raw.target)
  const lowWatermark = Number(raw.lowWatermark)
  if (!Number.isInteger(target) || target < 2 || target > 100) return null
  if (!Number.isInteger(lowWatermark) || lowWatermark < 1 || lowWatermark >= target) return null

  const lastRunByPlatform: SocialQueueAutofillConfig['lastRunByPlatform'] = {}
  if (raw.lastRunByPlatform && typeof raw.lastRunByPlatform === 'object') {
    for (const [platform, run] of Object.entries(raw.lastRunByPlatform)) {
      if (['bluesky', 'threads', 'facebook', 'instagram'].includes(platform)) {
        const normalized = normalizeRun(run)
        if (normalized) lastRunByPlatform[platform as SocialPlatform] = normalized
      }
    }
  }

  return {
    target,
    lowWatermark,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : DEFAULT_CONFIG.updatedAt,
    lastRunAt: typeof raw.lastRunAt === 'string' ? raw.lastRunAt : null,
    lastRunByPlatform
  }
}

export async function getSocialQueueAutofillConfig(): Promise<SocialQueueAutofillConfig> {
  const raw = await getKvStorage().getItem<unknown>(STORAGE_KEY)
  return normalizeConfig(raw) || { ...DEFAULT_CONFIG, lastRunByPlatform: {} }
}

export async function setSocialQueueAutofillSettings(input: { target: number, lowWatermark: number }) {
  const current = await getSocialQueueAutofillConfig()
  const next: SocialQueueAutofillConfig = {
    ...current,
    target: input.target,
    lowWatermark: input.lowWatermark,
    updatedAt: new Date().toISOString()
  }

  await getKvStorage().setItem(STORAGE_KEY, next)
  return next
}

export async function recordSocialQueueAutofillRun(input: {
  ranAt: string
  platforms: Partial<Record<SocialPlatform, SocialQueueAutofillPlatformRun>>
}) {
  const current = await getSocialQueueAutofillConfig()
  const next: SocialQueueAutofillConfig = {
    ...current,
    lastRunAt: input.ranAt,
    lastRunByPlatform: input.platforms
  }

  await getKvStorage().setItem(STORAGE_KEY, next)
  return next
}
