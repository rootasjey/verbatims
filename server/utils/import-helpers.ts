import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

/**
 * Import Helper Utilities
 * Utilities for handling author/reference lookup and creation during imports
 */

/**
 * Decodes a base64 string to Uint8Array (Node.js and browser compatible)
 */
export function base64ToUint8(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(base64, 'base64'))
  const binary = atob(base64)
  const u8 = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) u8[i] = binary.charCodeAt(i)
  return u8
}

/**
 * Parses ZIP import entries into a normalized bundle and warnings array.
 * Accepts the entries object from unzipSync, and strFromU8 for decoding.
 */
export function parseZipImportEntries(entries: Record<string, Uint8Array>, strFromU8: (u8: Uint8Array) => string): { bundle: Record<string, any[]>; warnings: string[] } {
  // Initialize all supported collections so counts work even if missing
  const result: Record<string, any[]> = {
    // core
    references: [], authors: [], tags: [], users: [], quotes: [],
    // relations and activity
    quote_tags: [], user_likes: [], user_collections: [], collection_quotes: [], user_sessions: [], user_messages: [], quote_reports: [], quote_views: [], author_views: [], reference_views: [],
  }
  const warnings: string[] = []

  // Map normalized basenames to canonical bundle keys
  const nameMap: Record<string, keyof typeof result> = {
    // core
    'quotes': 'quotes',
    'authors': 'authors',
    'references': 'references',
    'quote_references': 'references',
    'users': 'users',
    'tags': 'tags',
    // relations and activity (accept hyphen/underscore forms)
    'quote_tags': 'quote_tags',
    'quote-tags': 'quote_tags',
    'user_likes': 'user_likes',
    'user-likes': 'user_likes',
    'user_collections': 'user_collections',
    'user-collections': 'user_collections',
    'collection_quotes': 'collection_quotes',
    'collection-quotes': 'collection_quotes',
    'user_sessions': 'user_sessions',
    'user-sessions': 'user_sessions',
    'user_messages': 'user_messages',
    'user-messages': 'user_messages',
    'quote_reports': 'quote_reports',
    'quote-reports': 'quote_reports',
    'quote_views': 'quote_views',
    'quote-views': 'quote_views',
    'author_views': 'author_views',
    'author-views': 'author_views',
    'reference_views': 'reference_views',
    'reference-views': 'reference_views',
  }

  for (const [name, data] of Object.entries(entries)) {
    const base = name.split('/').pop() || name
    const lower = base.toLowerCase()
    const m = lower.match(/^(.*)\.(json|csv|xml)$/)
    if (!m) { warnings.push(`Skipped unknown file: ${name}`); continue }
    const rawStem = String(m[1] ?? '')
    const ext = m[2] as 'json' | 'csv' | 'xml'

    // Normalize stem: keep hyphen and underscore variants supported via nameMap
    const canonical = nameMap[rawStem] as (keyof typeof result) | undefined
    if (!canonical) { warnings.push(`Skipped unknown file: ${name}`); continue }

    const text = strFromU8(data as Uint8Array)
    try {
      let rows: any[] = []
      if (ext === 'json') {
        const parsed = JSON.parse(text)
        rows = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.data) ? parsed.data : [])
      } else if (ext === 'csv') {
        rows = parseCSV(text)
      } else if (ext === 'xml') {
        const singular = String(canonical).replace(/s$/, '')
        rows = parseXMLFlat(text, singular)
      }

      if (Array.isArray(rows)) {
        // canonical is guaranteed to be present because we checked above, but narrow its type for TS
        const canonicalKey = canonical as keyof typeof result
        result[canonicalKey] = rows
      } else {
        warnings.push(`File did not parse to array: ${name}`)
      }
    } catch (e: any) {
      warnings.push(`Failed to parse ${name}: ${e.message}`)
    }
  }

  return { bundle: result, warnings }
}

/**
 * Parses a CSV string into an array of objects (handles quoted fields)
 */
export function parseCSV(text: string): any[] {
  const lines = text.split(/\r?\n/).filter(l => l.length > 0)
  if (lines.length === 0) return []
  const headers = [] as string[]
  ;(function parseHeader() {
    const hline = lines.shift() as string
    let cur = ''
    let inQ = false
    for (let i = 0; i < hline.length; i++) {
      const ch = hline[i]
      if (ch === '"') inQ = !inQ
      else if (ch === ',' && !inQ) { headers.push(cur.replace(/^"|"$/g, '').replace(/""/g, '"')); cur = '' }
      else cur += ch
    }
    headers.push(cur.replace(/^"|"$/g, '').replace(/""/g, '"'))
  })()
  const rows: any[] = []
  for (const line of lines) {
    let cur = ''
    let inQ = false
    const cols: string[] = []
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') inQ = !inQ
      else if (ch === ',' && !inQ) { cols.push(cur.replace(/^"|"$/g, '').replace(/""/g, '"')); cur = '' }
      else cur += ch
    }
    cols.push(cur.replace(/^"|"$/g, '').replace(/""/g, '"'))
    const obj: any = {}
    headers.forEach((h, idx) => obj[h] = cols[idx] ?? '')
    rows.push(obj)
  }
  return rows
}

/**
 * Parses a flat XML string into an array of objects (for simple import formats)
 */
export function parseXMLFlat(text: string, itemTag: string): any[] {
  const items: any[] = []
  const itemRegex = new RegExp(`<${itemTag}>([\s\S]*?)<\/${itemTag}>`, 'g')
  let m: RegExpExecArray | null
  while ((m = itemRegex.exec(text)) !== null) {
    const block = String(m[1] ?? '')
    const obj: any = {}
    const fieldRegex = /<([A-Za-z0-9_:-]+)>([\s\S]*?)<\/\1>/g
    let f: RegExpExecArray | null
    while ((f = fieldRegex.exec(block)) !== null) {
      // coerce groups to strings to avoid undefined index types
      const key = String(f[1] ?? '')
      const val = String(f[2] ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      obj[key] = val
    }
    items.push(obj)
  }
  return items
}

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
  authorData: ImportAuthor
): Promise<AuthorLookupResult> {
  if (!authorData.name?.trim()) {
    throw new Error('Author name is required')
  }

  const authorName = authorData.name.trim()

  // First, try to find existing author by name
  const existingAuthor = await db.select({ id: schema.authors.id })
    .from(schema.authors)
    .where(sql`LOWER(${schema.authors.name}) = LOWER(${authorName})`)
    .limit(1)
    .get()

  if (existingAuthor) {
    return {
      id: existingAuthor.id,
      isNew: false
    }
  }

  // Create new author
  const result = await db.insert(schema.authors).values({
    name: authorName,
    description: authorData.summary || authorData.description || null,
    job: authorData.job || null,
    isFictional: authorData.is_fictional || false,
    birthDate: authorData.birth_date || null,
    deathDate: authorData.death_date || null,
    birthLocation: authorData.birth_location || null,
    deathLocation: authorData.death_location || null,
    imageUrl: authorData.image_url || authorData.urls?.image || null,
    viewsCount: 0,
    likesCount: 0,
    sharesCount: 0
  }).returning({ id: schema.authors.id }).get()

  return {
    id: result.id,
    isNew: true
  }
}

/**
 * Find existing reference by name or create new one
 */
export async function findOrCreateReference(
  referenceData: ImportReference
): Promise<ReferenceLookupResult> {
  if (!referenceData.name?.trim()) {
    throw new Error('Reference name is required')
  }

  const referenceName = referenceData.name.trim()

  // First, try to find existing reference by name
  const existingReference = await db.select({ id: schema.quoteReferences.id })
    .from(schema.quoteReferences)
    .where(sql`LOWER(${schema.quoteReferences.name}) = LOWER(${referenceName})`)
    .limit(1)
    .get()

  if (existingReference) {
    return {
      id: existingReference.id,
      isNew: false
    }
  }

  // Create new reference
  const result = await db.insert(schema.quoteReferences).values({
    name: referenceName,
    originalLanguage: referenceData.original_language || referenceData.language || 'en',
    releaseDate: referenceData.release_date || null,
    description: referenceData.summary || referenceData.description || null,
    primaryType: (referenceData.primary_type as any) || 'other',
    secondaryType: referenceData.secondary_type || null,
    imageUrl: referenceData.image_url || referenceData.urls?.image || null,
    urls: JSON.stringify(referenceData.urls || {}),
    viewsCount: 0,
    likesCount: 0,
    sharesCount: 0
  }).returning({ id: schema.quoteReferences.id }).get()

  return {
    id: result.id,
    isNew: true
  }
}
