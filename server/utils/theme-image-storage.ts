import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq, or } from 'drizzle-orm'

const STAGING_PREFIX = 'images/theme-staging/'
const THEME_IMAGES_PREFIX = 'images/themes/'
const THEME_IMAGE_PATH = /^images\/(theme-staging|themes)\/[0-9a-f-]{36}\.(jpg|png|webp|gif|avif)$/i

export interface ThemeImageCommit {
  imageUrl: string | null
  mobileImageUrl: string | null
  stagedUrls: string[]
  promotedUrls: string[]
}

function themeImageKeyFromUrl(url: string | null | undefined, prefix: string): string | null {
  if (!url?.startsWith('/blob/')) return null
  const key = url.slice('/blob/'.length)
  return key.startsWith(prefix) && THEME_IMAGE_PATH.test(key) ? key : null
}

export function isStagedThemeImageUrl(url: string | null | undefined): boolean {
  return themeImageKeyFromUrl(url, STAGING_PREFIX) !== null
}

export async function deleteStagedThemeImage(url: string): Promise<void> {
  const key = themeImageKeyFromUrl(url, STAGING_PREFIX)
  if (!key) throwServer(400, 'Invalid staged theme image URL')
  await blob.delete(key)
}

export async function prepareThemeImageCommit(
  imageUrl: string | null,
  mobileImageUrl: string | null,
): Promise<ThemeImageCommit> {
  const commit: ThemeImageCommit = {
    imageUrl,
    mobileImageUrl,
    stagedUrls: [],
    promotedUrls: [],
  }

  try {
    for (const field of ['imageUrl', 'mobileImageUrl'] as const) {
      const sourceUrl = commit[field]
      const sourceKey = themeImageKeyFromUrl(sourceUrl, STAGING_PREFIX)
      if (!sourceKey) continue

      const image = await blob.get(sourceKey)
      if (!image) throwServer(400, 'Staged theme image no longer exists')

      const finalKey = sourceKey.replace(STAGING_PREFIX, THEME_IMAGES_PREFIX)
      await blob.put(finalKey, image, {
        contentType: image.type || 'image/jpeg',
        addRandomSuffix: false,
      })

      commit[field] = `/blob/${finalKey}`
      commit.stagedUrls.push(sourceUrl!)
      commit.promotedUrls.push(`/blob/${finalKey}`)
    }
    return commit
  } catch (error) {
    await rollbackThemeImageCommit(commit)
    throw error
  }
}

export async function rollbackThemeImageCommit(commit: ThemeImageCommit): Promise<void> {
  await Promise.allSettled(commit.promotedUrls.map(url => {
    const key = themeImageKeyFromUrl(url, THEME_IMAGES_PREFIX)
    return key ? blob.delete(key) : Promise.resolve()
  }))
}

export async function finishThemeImageCommit(commit: ThemeImageCommit): Promise<void> {
  await Promise.allSettled(commit.stagedUrls.map(url => deleteStagedThemeImage(url)))
}

export async function deleteThemeImageIfUnused(url: string | null | undefined): Promise<void> {
  const key = themeImageKeyFromUrl(url, THEME_IMAGES_PREFIX)
  if (!key) return

  try {
    const references = await db.select({ id: schema.themes.id })
      .from(schema.themes)
      .where(or(
        eq(schema.themes.imageUrl, url!),
        eq(schema.themes.mobileImageUrl, url!),
      ))
      .limit(1)

    if (references.length === 0) await blob.delete(key)
  } catch (error) {
    console.warn(`[theme-image-storage] Failed to delete unused image ${key}:`, error)
  }
}

export async function cleanupAbandonedThemeImages(maxAgeMs = 48 * 60 * 60 * 1000) {
  const cutoff = Date.now() - maxAgeMs
  let cursor: string | undefined
  let scanned = 0
  let deleted = 0
  let hasMore = true

  while (hasMore) {
    const page = await blob.list({ prefix: STAGING_PREFIX, limit: 1000, cursor })
    for (const item of page.blobs) {
      scanned++
      if (item.uploadedAt && item.uploadedAt.getTime() < cutoff) {
        await blob.delete(item.pathname)
        deleted++
      }
    }
    hasMore = page.hasMore
    cursor = page.cursor
  }

  return { scanned, deleted }
}
