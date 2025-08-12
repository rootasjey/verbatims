/**
 * Import Helper Utilities
 * Utilities for handling author/reference lookup and creation during imports
 */

interface ImportAuthor {
  id?: string
  name: string
  job?: string
  summary?: string
  description?: string
  is_fictional?: boolean
  birth_date?: string
  death_date?: string
  birth_location?: string
  death_location?: string
  image_url?: string
  urls?: {
    image?: string
    wikipedia?: string
    [key: string]: string | undefined
  }
}

interface ImportReference {
  id?: string
  name: string
  original_language?: string
  language?: string
  summary?: string
  description?: string
  primary_type?: string
  secondary_type?: string
  release_date?: string
  image_url?: string
  urls?: {
    image?: string
    [key: string]: string | undefined
  }
}

interface AuthorLookupResult {
  id: number
  isNew: boolean
}

interface ReferenceLookupResult {
  id: number
  isNew: boolean
}

/**
 * Find existing author by name or create new one
 */
export async function findOrCreateAuthor(
  db: any,
  authorData: ImportAuthor
): Promise<AuthorLookupResult> {
  if (!authorData.name?.trim()) {
    throw new Error('Author name is required')
  }

  const authorName = authorData.name.trim()

  // First, try to find existing author by name
  const existingAuthor = await db.prepare(`
    SELECT id FROM authors WHERE LOWER(name) = LOWER(?) LIMIT 1
  `).bind(authorName).first()

  if (existingAuthor) {
    return {
      id: existingAuthor.id,
      isNew: false
    }
  }

  // Create new author

  const result = await db.prepare(`
    INSERT INTO authors (
      name, description, job, is_fictional, birth_date, death_date,
      birth_location, death_location, image_url, views_count, likes_count, shares_count,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    authorName,
    authorData.summary || authorData.description || null,
    authorData.job || null,
    authorData.is_fictional || false,
    authorData.birth_date || null,
    authorData.death_date || null,
    authorData.birth_location || null,
    authorData.death_location || null,
    authorData.image_url || authorData.urls?.image || null,
    0, // views_count
    0, // likes_count
    0  // shares_count
  ).run()

  return {
    id: result.meta.last_row_id as number,
    isNew: true
  }
}

/**
 * Find existing reference by name or create new one
 */
export async function findOrCreateReference(
  db: any,
  referenceData: ImportReference
): Promise<ReferenceLookupResult> {
  if (!referenceData.name?.trim()) {
    throw new Error('Reference name is required')
  }

  const referenceName = referenceData.name.trim()

  // First, try to find existing reference by name
  const existingReference = await db.prepare(`
    SELECT id FROM quote_references WHERE LOWER(name) = LOWER(?) LIMIT 1
  `).bind(referenceName).first()

  if (existingReference) {
    return {
      id: existingReference.id,
      isNew: false
    }
  }

  // Create new reference

  const result = await db.prepare(`
    INSERT INTO quote_references (
      name, original_language, release_date, description, primary_type, secondary_type,
      image_url, urls, views_count, likes_count, shares_count,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    referenceName,
    referenceData.original_language || referenceData.language || 'en',
    referenceData.release_date || null,
    referenceData.summary || referenceData.description || null,
    referenceData.primary_type || 'other',
    referenceData.secondary_type || null,
    referenceData.image_url || referenceData.urls?.image || null,
    JSON.stringify(referenceData.urls || {}),
    0, // views_count
    0, // likes_count
    0  // shares_count
  ).run()

  return {
    id: result.meta.last_row_id as number,
    isNew: true
  }
}
