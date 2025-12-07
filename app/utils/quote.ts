/**
 * Return the English display name for a given language code.
 *
 * Looks up the provided short language code in an internal mapping (for example
 * "en" → "English", "fr" → "French"). If the code is not present in the map,
 * the function falls back to returning the input code converted to uppercase,
 * providing a readable fallback for unknown or custom codes.
 *
 * Supported codes: en, fr, es, de, it, pt, ru, ja, zh
 *
 * @param code - The language code to resolve (typically a two-letter ISO code).
 * @returns The human-readable language name in English if known; otherwise the uppercased input code.
 *
 * @example
 * getLanguageName('en'); // 'English'
 * getLanguageName('zz'); // 'ZZ'
 */
export const getLanguageName = (code: string) => {
  const languages: Record<string, string> = {
    en: 'English',
    fr: 'French',
    es: 'Spanish',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    ja: 'Japanese',
    zh: 'Chinese'
  }
  return languages[code] || code.toUpperCase()
}

/**
 * Formats a number into a human-readable string using suffixes for thousands and millions.
 *
 * - If num >= 1_000_000, returns (num / 1_000_000).toFixed(1) + 'M'
 * - Else if num >= 1_000, returns (num / 1_000).toFixed(1) + 'K'
 * - Otherwise returns num.toString()
 *
 * @param num - The numeric value to format.
 * @returns A string representation with a single decimal place for K/M ranges (e.g., "1.5K", "2.0M") or the plain number as a string for smaller values.
 *
 * @remarks
 * - Negative numbers and values below 1,000 are returned using num.toString().
 * - Values at the exact thresholds produce one decimal digit (e.g., 1000 -> "1.0K", 1000000 -> "1.0M").
 *
 * @example
 * formatNumber(1500); // "1.5K"
 *
 * @example
 * formatNumber(2500000); // "2.5M"
 *
 * @example
 * formatNumber(999); // "999"
 */
export const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}
