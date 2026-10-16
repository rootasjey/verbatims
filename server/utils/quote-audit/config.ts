import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

const QUOTE_AUDIT_CONFIG_KEY = 'quote-audit:config:v1'

export type QuoteAuditMode = 'paused' | 'pilot' | 'continuous'
export type QuoteAuditCadence = 'weekdays' | 'weekly'

export interface QuoteAuditConfig {
  mode: QuoteAuditMode
  cadence: QuoteAuditCadence
  updatedAt: string | null
}

const DEFAULT_CONFIG: QuoteAuditConfig = {
  mode: 'paused',
  cadence: 'weekdays',
  updatedAt: null,
}

function parseConfig(raw: string | null | undefined): QuoteAuditConfig {
  if (!raw) return DEFAULT_CONFIG

  try {
    const value = JSON.parse(raw) as Record<string, unknown>
    return {
      mode: value.mode === 'pilot' || value.mode === 'continuous' ? value.mode : 'paused',
      cadence: value.cadence === 'weekly' ? 'weekly' : 'weekdays',
      updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
    }
  } catch {
    return DEFAULT_CONFIG
  }
}

export async function getQuoteAuditConfig(): Promise<QuoteAuditConfig> {
  const row = await db.select({ value: schema.settings.value })
    .from(schema.settings)
    .where(eq(schema.settings.key, QUOTE_AUDIT_CONFIG_KEY))
    .get()

  return parseConfig(row?.value)
}

export async function setQuoteAuditConfig(input: Pick<QuoteAuditConfig, 'mode' | 'cadence'>): Promise<QuoteAuditConfig> {
  const config: QuoteAuditConfig = {
    mode: input.mode,
    cadence: input.cadence,
    updatedAt: new Date().toISOString(),
  }

  await db.insert(schema.settings)
    .values({ key: QUOTE_AUDIT_CONFIG_KEY, value: JSON.stringify(config), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.settings.key,
      set: { value: JSON.stringify(config), updatedAt: new Date() },
    })
    .run()

  return config
}
