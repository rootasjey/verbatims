/**
 * Import Helper Utilities
 * Utilities for handling author/reference lookup and creation during imports
 */

interface FirestoreAuthor {
  id?: string
  name: string
  job?: string
  summary?: string
  is_fictional?: boolean
  birth?: {
    city?: string
    country?: string
    date?: { __time__: string }
  }
  death?: {
    city?: string
    country?: string
    date?: { __time__: string }
  }
  urls?: {
    image?: string
    wikipedia?: string
    [key: string]: string | undefined
  }
}

interface FirestoreReference {
  id?: string
  name: string
  language?: string
  summary?: string
  release?: {
    original?: { __time__: string }
  }
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
  firestoreAuthor: FirestoreAuthor
): Promise<AuthorLookupResult> {
  if (!firestoreAuthor.name?.trim()) {
    throw new Error('Author name is required')
  }

  const authorName = firestoreAuthor.name.trim()

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
  const birthDate = firestoreAuthor.birth?.date?.__time__ 
    ? new Date(firestoreAuthor.birth.date.__time__).toISOString().split('T')[0]
    : null

  const deathDate = firestoreAuthor.death?.date?.__time__
    ? new Date(firestoreAuthor.death.date.__time__).toISOString().split('T')[0]
    : null

  const birthLocation = [
    firestoreAuthor.birth?.city,
    firestoreAuthor.birth?.country
  ].filter(Boolean).join(', ') || null

  const deathLocation = [
    firestoreAuthor.death?.city,
    firestoreAuthor.death?.country
  ].filter(Boolean).join(', ') || null

  const result = await db.prepare(`
    INSERT INTO authors (
      name, description, job, is_fictional, birth_date, death_date,
      birth_location, death_location, image_url, views_count, likes_count, shares_count,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    authorName,
    firestoreAuthor.summary || null,
    firestoreAuthor.job || null,
    firestoreAuthor.is_fictional || false,
    birthDate,
    deathDate,
    birthLocation,
    deathLocation,
    firestoreAuthor.urls?.image || null,
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
  firestoreReference: FirestoreReference
): Promise<ReferenceLookupResult> {
  if (!firestoreReference.name?.trim()) {
    throw new Error('Reference name is required')
  }

  const referenceName = firestoreReference.name.trim()

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
  const releaseDate = firestoreReference.release?.original?.__time__
    ? new Date(firestoreReference.release.original.__time__).toISOString().split('T')[0]
    : null

  const result = await db.prepare(`
    INSERT INTO quote_references (
      name, original_language, release_date, description, primary_type, secondary_type,
      image_url, urls, views_count, likes_count, shares_count,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    referenceName,
    firestoreReference.language || 'en',
    releaseDate,
    firestoreReference.summary || null,
    'other', // Default primary_type since Firestore doesn't have this
    null,    // secondary_type
    firestoreReference.urls?.image || null,
    JSON.stringify(firestoreReference.urls || {}),
    0, // views_count
    0, // likes_count
    0  // shares_count
  ).run()

  return {
    id: result.meta.last_row_id as number,
    isNew: true
  }
}
