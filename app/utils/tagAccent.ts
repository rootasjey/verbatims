type TagLike = { color?: string | null }

const toTagColors = (tags?: TagLike[] | null): string[] => {
  if (!Array.isArray(tags)) return []

  return tags
    .map(tag => tag.color?.trim())
    .filter((color): color is string => Boolean(color))
}

export const getTopicBorderStyle = (tags?: TagLike[] | null) => {
  const colors = toTagColors(tags)

  if (colors.length === 0) return undefined

  if (colors.length === 1) {
    return {
      '--topic-border-color': colors[0],
      '--topic-border-image': 'none',
      '--topic-border-image-slice': '1'
    }
  }

  return {
    '--topic-border-color': 'transparent',
    '--topic-border-image-slice': '1',
    '--topic-border-image': `linear-gradient(135deg, ${colors.join(', ')})`
  }
}
