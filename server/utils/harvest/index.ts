import type { HarvestSourceType } from '#shared/constants/harvest'
import type { HarvestAdapter } from './wikiquote'
import { WikiQuoteFrAdapter, WikiQuoteEnAdapter } from './wikiquote'

const adapters: Map<HarvestSourceType, HarvestAdapter> = new Map()

function initAdapters(): void {
  if (adapters.size > 0) return
  adapters.set('wikiquote-fr', new WikiQuoteFrAdapter())
  adapters.set('wikiquote-en', new WikiQuoteEnAdapter())
}

export function getHarvestAdapter(sourceType: HarvestSourceType): HarvestAdapter {
  initAdapters()
  const adapter = adapters.get(sourceType)
  if (!adapter) {
    throw new Error(`Unknown harvest source type: ${sourceType}`)
  }
  return adapter
}

export function getAllAdapters(): HarvestAdapter[] {
  initAdapters()
  return [...adapters.values()]
}

export function getAvailableSourceTypes(): HarvestSourceType[] {
  initAdapters()
  return [...adapters.keys()]
}