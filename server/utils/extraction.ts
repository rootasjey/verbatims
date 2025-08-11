import { QuoteSearchResult } from "~/types"

/**
 * Extracts the author information from a given `QuoteSearchResult` object.
 *
 * @param quote - The quote search result containing author data.
 * @returns An object with author details (`id`, `name`, `is_fictional`, `image_url`),
 *          or `undefined` if `author_id` is not present.
 */
export function extractAuthor(quote: QuoteSearchResult) {
  if (!quote.author_id) return undefined
  return {
    id: quote.author_id,
    name: String(quote.author_name || ''),
    is_fictional: (quote as any).author_is_fictional,
    image_url: (quote as any).author_image_url
  }
}

/**
 * Extracts reference information from a `QuoteSearchResult` object.
 *
 * @param quote - The `QuoteSearchResult` object containing reference data.
 * @returns An object with `id`, `name`, and `type` properties if `reference_id` exists; otherwise, `undefined`.
 */
export function extractReference(quote: QuoteSearchResult) {
  if (!quote.reference_id) return undefined
  return {
    id: quote.reference_id,
    name: String(quote.reference_name || ''),
    type: (quote as any).reference_type as any
  }
}

/**
 * Extracts tag information from a `QuoteSearchResult` object.
 *
 * Splits the `tag_names` property by commas to get individual tag names,
 * and optionally splits the `tag_colors` property to get corresponding colors.
 * Returns an array of objects, each containing a tag `name` and its associated `color`.
 * If a color is not specified for a tag, defaults to `'gray'`.
 *
 * @param quote - The `QuoteSearchResult` object containing tag information.
 * @returns An array of tag objects with `name` and `color` properties.
 */
export function extractTags(quote: QuoteSearchResult) {
  if (!quote.tag_names) return []
  const names = quote.tag_names.split(',')
  const colors = ((quote as any).tag_colors ? (quote as any).tag_colors.split(',') : []) as string[]
  return names.map((name, i) => ({
    name,
    color: colors[i] || 'gray'
  }))
}

/**
 * Safely parses a value into an integer. If parsing fails or the result is not a finite number,
 * returns the provided default value.
 *
 * @param value - The value to parse as an integer.
 * @param defaultValue - The default value to return if parsing fails.
 * @returns The parsed integer if valid, otherwise the default value.
 */
export function parseIntSafe(value: any, defaultValue: number) {
  const n = parseInt(String(value || ''))
  return Number.isFinite(n) ? n : defaultValue
}
