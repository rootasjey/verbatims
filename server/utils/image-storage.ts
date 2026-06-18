import { blob } from 'hub:blob'

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

export async function uploadAndStoreImage(
  sourceUrl: string,
  entityType: 'authors' | 'references',
  entityId: number,
): Promise<string | null> {
  try {
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
