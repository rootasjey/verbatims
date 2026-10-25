import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { like, or } from 'drizzle-orm'

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
}

export function extFromContentType(contentType: string): string {
  return MIME_TO_EXT[contentType] || '.jpg'
}

export function isR2ImageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return url.startsWith('/blob/images/')
}

const IMAGES_PREFIX = 'images'
const IMAGE_UPLOADS_PREFIX = 'images/uploads/'
const DEFAULT_UPLOAD_RETENTION_MS = 90 * 24 * 60 * 60 * 1000

function imageUploadKeyFromUrl(url: string | null | undefined): string | null {
  if (!url?.startsWith('/blob/')) return null

  const key = url.slice('/blob/'.length).split(/[?#]/, 1)[0]
  return key?.startsWith(IMAGE_UPLOADS_PREFIX) ? key : null
}

async function getReferencedImageUploadKeys(): Promise<Set<string>> {
  const [authors, references, themes, reportedImages] = await Promise.all([
    db.select({ imageUrl: schema.authors.imageUrl })
      .from(schema.authors)
      .where(like(schema.authors.imageUrl, '/blob/images/uploads/%')),
    db.select({ imageUrl: schema.quoteReferences.imageUrl })
      .from(schema.quoteReferences)
      .where(like(schema.quoteReferences.imageUrl, '/blob/images/uploads/%')),
    db.select({ imageUrl: schema.themes.imageUrl, mobileImageUrl: schema.themes.mobileImageUrl })
      .from(schema.themes)
      .where(or(
        like(schema.themes.imageUrl, '/blob/images/uploads/%'),
        like(schema.themes.mobileImageUrl, '/blob/images/uploads/%'),
      )),
    db.select({ reportedImageUrl: schema.userMessages.reportedImageUrl })
      .from(schema.userMessages)
      .where(like(schema.userMessages.reportedImageUrl, '/blob/images/uploads/%')),
  ])

  const referencedKeys = new Set<string>()
  const urls = [
    ...authors.map(row => row.imageUrl),
    ...references.map(row => row.imageUrl),
    ...themes.flatMap(row => [row.imageUrl, row.mobileImageUrl]),
    ...reportedImages.map(row => row.reportedImageUrl),
  ]

  for (const url of urls) {
    const key = imageUploadKeyFromUrl(url)
    if (key) referencedKeys.add(key)
  }

  return referencedKeys
}

export async function cleanupAbandonedImageUploads(options: {
  maxAgeMs?: number
  dryRun?: boolean
} = {}) {
  const {
    maxAgeMs = DEFAULT_UPLOAD_RETENTION_MS,
    dryRun = true,
  } = options
  const cutoff = Date.now() - maxAgeMs
  const candidates: string[] = []
  let scanned = 0
  let tooRecent = 0
  let missingTimestamp = 0
  let referenced = 0
  let cursor: string | undefined
  let hasMore = true

  while (hasMore) {
    const page = await blob.list({ prefix: IMAGE_UPLOADS_PREFIX, limit: 1000, cursor })
    for (const item of page.blobs) {
      scanned++
      if (!item.uploadedAt) {
        missingTimestamp++
        continue
      }
      if (item.uploadedAt.getTime() >= cutoff) {
        tooRecent++
        continue
      }
      candidates.push(item.pathname)
    }
    hasMore = page.hasMore
    cursor = page.cursor
  }

  // Read references after the complete inventory so a partial listing never
  // leads to deletion and recently attached URLs are protected.
  const referencedKeys = await getReferencedImageUploadKeys()
  const deletableKeys = candidates.filter((key) => {
    if (referencedKeys.has(key)) {
      referenced++
      return false
    }
    return true
  })

  let deleted = 0
  if (!dryRun) {
    for (const key of deletableKeys) {
      await blob.delete(key)
      deleted++
    }
  }

  return {
    dryRun,
    scanned,
    tooRecent,
    missingTimestamp,
    referenced,
    candidates: deletableKeys.length,
    deleted,
  }
}

export async function uploadAndStoreImage(
  sourceUrl: string,
  entityType: 'authors' | 'references',
  entityId: number,
): Promise<string | null> {
  try {
    // If the image is already in R2, re-key it to the entity path
    if (isR2ImageUrl(sourceUrl)) {
      const sourceKey = sourceUrl.replace('/blob/', '')
      const existing = await blob.get(sourceKey)
      if (existing) {
        const data = await existing.arrayBuffer()
        const contentType = existing.type || 'image/jpeg'
        const ext = extFromContentType(contentType)
        const key = `${IMAGES_PREFIX}/${entityType}/${entityId}${ext}`
        await blob.put(key, data, { contentType, addRandomSuffix: false })
        return `/blob/${key}`
      }
      // Fallback: return original URL if blob can't be read
      return sourceUrl
    }

    const response = await fetch(sourceUrl, {
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) {
      console.warn(`[image-storage] Failed to fetch ${sourceUrl}: ${response.status}`)
      return null
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const ext = extFromContentType(contentType)
    const key = `${IMAGES_PREFIX}/${entityType}/${entityId}${ext}`
    const data = await response.arrayBuffer()

    await blob.put(key, data, {
      contentType,
      addRandomSuffix: false,
    })

    return `/blob/${key}`
  } catch (error) {
    console.warn(`[image-storage] Failed to store image from ${sourceUrl}:`, error)
    return null
  }
}

export async function deleteImageByUrl(imageUrl: string): Promise<void> {
  if (!isR2ImageUrl(imageUrl)) return

  const key = imageUrl.replace('/blob/', '')
  try {
    await blob.delete(key)
  } catch (error) {
    console.warn(`[image-storage] Failed to delete ${key}:`, error)
  }
}
