import { db, schema } from 'hub:db'
import { eq, inArray, sql } from 'drizzle-orm'

export interface CuratedTagDefinition {
  name: string
  description: string
  category: string
  color: string
  keywords: string[]
}

export const CURATED_TAGS: CuratedTagDefinition[] = [
  { name: 'love', description: 'Love, relationships, and attachment.', category: 'emotion', color: '#EF476F', keywords: ['love', 'amour', 'heart', 'coeur', 'romance', 'romantic', 'kiss', 'deserve', 'séparation', 'separation'] },
  { name: 'friendship', description: 'Friendship, bonds, and companionship.', category: 'relationships', color: '#F78C6B', keywords: ['friend', 'friends', 'friendship', 'ami', 'amitié', 'companionship'] },
  { name: 'family', description: 'Family, parents, and close relatives.', category: 'relationships', color: '#FFB703', keywords: ['family', 'mother', 'father', 'parent', 'parents', 'mère', 'mere', 'père', 'pere', 'sister', 'brother'] },
  { name: 'happiness', description: 'Happiness, joy, and gratitude.', category: 'emotion', color: '#FFD166', keywords: ['happiness', 'happy', 'joy', 'bonheur', 'heureux', 'gratitude', 'delight'] },
  { name: 'sadness', description: 'Sadness, grief, and loss.', category: 'emotion', color: '#577590', keywords: ['sad', 'sadness', 'grief', 'loss', 'hurt', 'suffering', 'suffer', 'souffrance', 'malheur', 'emptiness', 'absence'] },
  { name: 'anger', description: 'Anger, rage, and conflict emotions.', category: 'emotion', color: '#D62828', keywords: ['anger', 'angry', 'rage', 'colère', 'colere', 'wrath'] },
  { name: 'fear', description: 'Fear, anxiety, and courage against uncertainty.', category: 'emotion', color: '#6D597A', keywords: ['fear', 'afraid', 'anxiety', 'peur', 'craintes', 'uncertainty', 'incertitude', 'courage'] },
  { name: 'hope', description: 'Hope, optimism, and looking forward.', category: 'emotion', color: '#4CC9F0', keywords: ['hope', 'espoir', 'optimism', 'optimiste', 'future', 'avenir', 'light', 'lumière', 'lumiere'] },
  { name: 'resilience', description: 'Resilience, perseverance, and bouncing back.', category: 'growth', color: '#3A86FF', keywords: ['resilience', 'keep going', 'rebondir', 'tomber', 'fall', 'rise', 'relever', 'persist', 'persevere', 'impossible'] },
  { name: 'change', description: 'Change, impermanence, and adaptation.', category: 'growth', color: '#2A9D8F', keywords: ['change', 'changement', 'adapt', 'adapter', 'permanent', 'impermanent', 'nothing is permanent', 'toujours'] },
  { name: 'success', description: 'Success, achievement, and goals.', category: 'growth', color: '#06D6A0', keywords: ['success', 'réussir', 'reussir', 'goal', 'goals', 'objectif', 'ambition', 'accomplish', 'work', 'travail'] },
  { name: 'failure', description: 'Failure, mistakes, and learning through setbacks.', category: 'growth', color: '#8D99AE', keywords: ['failure', 'fail', 'mistake', 'échec', 'echec', 'wrong', 'regret', 'deception', 'disappointment'] },
  { name: 'motivation', description: 'Drive, action, and determination.', category: 'growth', color: '#43AA8B', keywords: ['motivation', 'motivate', 'action', 'discipline', 'determination', 'challenge', 'start', 'commencez', 'move'] },
  { name: 'wisdom', description: 'Wisdom, insight, and perspective.', category: 'mindset', color: '#F4A261', keywords: ['wisdom', 'wise', 'sagesse', 'insight', 'perspective', 'truth', 'vérité', 'verite', 'understand', 'comprendre'] },
  { name: 'mindfulness', description: 'Presence, awareness, and inner state.', category: 'mindset', color: '#00B4D8', keywords: ['mindfulness', 'present', 'présent', 'consciousness', 'conscience', 'meditation', 'moment', 'awareness'] },
  { name: 'identity', description: 'Self, identity, and personal meaning.', category: 'mindset', color: '#8338EC', keywords: ['identity', 'self', 'soi', 'who we are', 'qui l\'on est', 'ego', 'personality'] },
  { name: 'truth', description: 'Truth, honesty, and authenticity.', category: 'mindset', color: '#118AB2', keywords: ['truth', 'true', 'vérité', 'verite', 'honesty', 'authentic', 'mensonge', 'lie', 'secret'] },
  { name: 'philosophy', description: 'Philosophy, paradoxes, and meaning.', category: 'ideas', color: '#6C757D', keywords: ['philosophy', 'philosoph', 'paradox', 'meaning of life', 'sens de la vie', 'existence', 'question'] },
  { name: 'knowledge', description: 'Knowledge, learning, and education.', category: 'ideas', color: '#1982C4', keywords: ['knowledge', 'learn', 'learning', 'education', 'connaissance', 'intelligence', 'curious', 'curiosity', 'éduqué', 'teacher'] },
  { name: 'creativity', description: 'Creativity, imagination, and artistic expression.', category: 'ideas', color: '#9D4EDD', keywords: ['imagination', 'creative', 'creativity', 'art', 'artist', 'write', 'écrire', 'story', 'drama', 'film'] },
  { name: 'time', description: 'Time, past, present, and future.', category: 'existential', color: '#5E60CE', keywords: ['time', 'temps', 'past', 'présent', 'present', 'future', 'avenir', 'before', 'after'] },
  { name: 'life', description: 'Life, mortality, and existence.', category: 'existential', color: '#40916C', keywords: ['life', 'vie', 'living', 'vivre', 'death', 'mort', 'old age', 'vieillesse', 'exist'] },
  { name: 'freedom', description: 'Freedom, rights, and autonomy.', category: 'society', color: '#3A5A40', keywords: ['freedom', 'liberté', 'liberte', 'privacy', 'private', 'rights', 'autonomy'] },
  { name: 'justice', description: 'Justice, law, and fairness.', category: 'society', color: '#7F5539', keywords: ['justice', 'law', 'legal', 'injustice', 'judge', 'verdict'] },
  { name: 'power', description: 'Power, authority, and domination.', category: 'society', color: '#9D0208', keywords: ['power', 'tyrant', 'authority', 'politician', 'police', 'violence', 'orgueil', 'vanity'] },
  { name: 'society', description: 'Society, collective behavior, and culture.', category: 'society', color: '#457B9D', keywords: ['society', 'people', 'monde', 'culture', 'commerce', 'community', 'civil'] },
  { name: 'science', description: 'Science, reason, and scientific thinking.', category: 'knowledge', color: '#3F37C9', keywords: ['science', 'scientist', 'scientifique', 'reason', 'gravitation', 'matière', 'matter'] },
  { name: 'space', description: 'Space, universe, and cosmology.', category: 'knowledge', color: '#1D3557', keywords: ['space', 'universe', 'étoiles', 'etoiles', 'stars', 'infinity', 'big bang', 'cosmos', 'planète', 'planet'] },
  { name: 'technology', description: 'Technology and computing topics.', category: 'knowledge', color: '#0077B6', keywords: ['technology', 'computer', 'programming', 'computation', 'language of interaction', 'product'] },
  { name: 'humor', description: 'Humor, irony, and witty lines.', category: 'style', color: '#FF6B6B', keywords: ['funny', 'humor', 'joke', 'bazinga', 'd\'oh', 'chocolat', 'queue', 'idiots'] },
  { name: 'spirituality', description: 'Spirituality, faith, and transcendence.', category: 'mindset', color: '#A06CD5', keywords: ['faith', 'foi', 'god', 'dieu', 'soul', 'âme', 'ame', 'spirit', 'spiritual'] },
  { name: 'cinema', description: 'Quotes related to films and cinema culture.', category: 'media', color: '#FF6868', keywords: ['film', 'cinema', 'scene', 'director', 'actor', 'movie'] },
  { name: 'music', description: 'Quotes related to songs and music culture.', category: 'media', color: '#FF70A4', keywords: ['music', 'song', 'rock', 'sing', 'melody', 'guitar'] },
  { name: 'literature', description: 'Quotes related to books and writing culture.', category: 'media', color: '#6A994E', keywords: ['book', 'reading', 'read', 'poet', 'writer', 'novel', 'lire'] },
  { name: 'television', description: 'Quotes linked to TV and series culture.', category: 'media', color: '#3D5A80', keywords: ['television', 'tv', 'series', 'episode', 'show'] },
  { name: 'inspiration', description: 'General inspiring and uplifting messages.', category: 'emotion', color: '#FFDBB6', keywords: ['inspire', 'inspiration', 'dream', 'rêvé', 'rever', 'possible', 'believe', 'believe in'] }
]

const curatedByLowerName = new Map(CURATED_TAGS.map(tag => [tag.name.toLowerCase(), tag]))

const textToSearch = (quoteText: string, language?: string) => {
  const normalized = (quoteText || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  return `${normalized} ${(language || '').toLowerCase()}`
}

const matchesKeyword = (haystack: string, keyword: string) => {
  const escaped = keyword
    .toLowerCase()
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const normalizedKeyword = escaped
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  return new RegExp(`(^|[^a-z0-9])${normalizedKeyword}([^a-z0-9]|$)`, 'i').test(haystack)
}

export const getCuratedTagNames = () => CURATED_TAGS.map(tag => tag.name)

export const isCuratedTagName = (tagName: string) => curatedByLowerName.has((tagName || '').trim().toLowerCase())

export const matchCuratedTagsForQuote = (quoteText: string, language?: string): string[] => {
  const haystack = textToSearch(quoteText, language)
  const matched = new Set<string>()

  for (const tag of CURATED_TAGS) {
    if (tag.keywords.some(keyword => matchesKeyword(haystack, keyword))) {
      matched.add(tag.name)
    }
  }

  if (matched.has('cinema') || matched.has('music') || matched.has('television') || matched.has('literature')) {
    matched.add('creativity')
  }

  if (matched.has('space') || matched.has('science')) {
    matched.add('knowledge')
  }

  if (matched.has('justice') || matched.has('power')) {
    matched.add('society')
  }

  return Array.from(matched).slice(0, 6)
}

export const ensureCuratedTagsExist = async () => {
  const existing = await db.select({
    id: schema.tags.id,
    name: schema.tags.name
  }).from(schema.tags)

  const existingByLowerName = new Map(existing.map(tag => [tag.name.toLowerCase(), tag.id]))
  const created: string[] = []

  for (const tag of CURATED_TAGS) {
    if (!existingByLowerName.has(tag.name.toLowerCase())) {
      const inserted = await db.insert(schema.tags).values({
        name: tag.name,
        description: tag.description,
        category: tag.category,
        color: tag.color
      }).returning({ id: schema.tags.id }).get()

      existingByLowerName.set(tag.name.toLowerCase(), inserted.id)
      created.push(tag.name)
    }
  }

  const refreshed = await db.select({
    id: schema.tags.id,
    name: schema.tags.name
  }).from(schema.tags)

  return {
    created,
    idsByLowerName: new Map(refreshed.map(tag => [tag.name.toLowerCase(), tag.id]))
  }
}

export const autoTagQuoteById = async (quoteId: number, quoteText: string, language?: string) => {
  const matchedTagNames = matchCuratedTagsForQuote(quoteText, language)
  if (!matchedTagNames.length) {
    return { matchedTagNames, attachedCount: 0 }
  }

  const { idsByLowerName } = await ensureCuratedTagsExist()
  const tagIds = matchedTagNames
    .map(name => idsByLowerName.get(name.toLowerCase()))
    .filter((value): value is number => typeof value === 'number')

  if (!tagIds.length) {
    return { matchedTagNames, attachedCount: 0 }
  }

  await db.insert(schema.quoteTags)
    .values(tagIds.map(tagId => ({ quoteId, tagId })))
    .onConflictDoNothing()
    .run()

  const attachedCountResult = await db.get<{ total: number }>(sql`
    SELECT COUNT(*) AS total
    FROM ${schema.quoteTags}
    WHERE ${schema.quoteTags.quoteId} = ${quoteId}
      AND ${inArray(schema.quoteTags.tagId, tagIds)}
  `)

  return {
    matchedTagNames,
    attachedCount: Number(attachedCountResult?.total || 0)
  }
}

export const getTagById = async (tagId: number) => {
  return db.select({
    id: schema.tags.id,
    name: schema.tags.name,
    color: schema.tags.color
  })
    .from(schema.tags)
    .where(eq(schema.tags.id, tagId))
    .get()
}