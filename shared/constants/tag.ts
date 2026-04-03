export const DEFAULT_TAG_BORDER_COLOR = '#0BA6DF'

export type TagColorLike = {
  color?: string | null
} | null | undefined

const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

export function normalizeTagColor(color?: string | null, fallback = DEFAULT_TAG_BORDER_COLOR): string {
  const trimmed = color?.trim()
  if (!trimmed) return fallback
  return HEX_COLOR_PATTERN.test(trimmed) ? trimmed : fallback
}

export function getRandomTagBorderColor(tags?: TagColorLike[] | null, fallback = DEFAULT_TAG_BORDER_COLOR): string {
  const colors = tags
    ?.map(tag => tag?.color?.trim())
    .filter((color): color is string => Boolean(color) && HEX_COLOR_PATTERN.test(color))
    ?? []

  if (!colors.length) return fallback

  const index = Math.floor(Math.random() * colors.length)
  return normalizeTagColor(colors[index], fallback)
}