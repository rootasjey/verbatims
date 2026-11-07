import { normalizeTimecode } from '~~/shared/utils/timecode'

type LocatorState = {
  locatorType: QuoteSourceLocatorType | null
  locatorValue: string | null
}

type LocatorPatch = {
  locator_type?: QuoteSourceLocatorType | null
  locator_value?: string | null
}

export function resolveQuoteSourceLocator(current: LocatorState, patch: LocatorPatch): LocatorState {
  const locatorType = patch.locator_type !== undefined ? patch.locator_type : current.locatorType
  let locatorValue = patch.locator_value !== undefined ? patch.locator_value?.trim() || null : current.locatorValue

  if (patch.locator_type !== undefined && patch.locator_type !== current.locatorType && patch.locator_value === undefined) {
    locatorValue = null
  }

  if (Boolean(locatorType) !== Boolean(locatorValue)) {
    throwServer(400, 'A locator requires both a type and value')
  }

  if (locatorType === 'timecode' && locatorValue) {
    const normalized = normalizeTimecode(locatorValue)
    if (!normalized) throwServer(400, 'Use MM:SS or HH:MM:SS with seconds below 60')
    locatorValue = normalized
  }

  return { locatorType, locatorValue }
}
