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
    const rawStem = m[1]
    const ext = m[2] as 'json' | 'csv' | 'xml'

    // Normalize stem: keep hyphen and underscore variants supported via nameMap
    const canonical = nameMap[rawStem]
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
        result[canonical] = rows
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
    const block = m[1]
    const obj: any = {}
    const fieldRegex = /<([A-Za-z0-9_:-]+)>([\s\S]*?)<\/\1>/g
    let f: RegExpExecArray | null
    while ((f = fieldRegex.exec(block)) !== null) {
      const key = f[1]
      const val = f[2].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
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
