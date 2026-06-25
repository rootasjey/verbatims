export interface ParsedTag {
  name: string
  color: string
}

export function parseTags(
  tagNames?: string | null,
  tagColors?: string | null,
): ParsedTag[] {
  if (!tagNames) return []
  const names = tagNames.split(',')
  const colors = tagColors ? tagColors.split(',') : []
  return names.map((name, index) => ({
    name: name.trim(),
    color: colors[index] || 'gray',
  }))
}

