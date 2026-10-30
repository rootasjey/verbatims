import { createHash } from 'node:crypto'
import { and, asc, eq, isNull, inArray, sql } from 'drizzle-orm'
import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { hubBrowser } from './browser'
import { verbatimsSocialPublishableSourceResolver } from './social-autopost-verbatims'
import { minimalCardStyles, socialCardTemplates, themeCardStyles } from './social-card-templates'
const baseSiteUrl = String(process.env.NUXT_PUBLIC_SITE_URL || 'https://verbatims.cc').replace(/\/$/, '')

interface PendingSocialSource {
  contentType: 'spotlight' | 'theme'
  sourceType: 'author' | 'reference' | 'theme'
  sourceId: number
}

interface PrepareSocialCardAssetsOptions {
  sourceType?: PendingSocialSource['sourceType']
  sourceId?: number
}

export async function prepareSocialCardAssets(options: PrepareSocialCardAssetsOptions = {}) {
  const conditions = [
    inArray(schema.socialQueue.contentType, ['spotlight', 'theme']),
    eq(schema.socialQueue.status, 'queued'),
    isNull(schema.socialQueue.mediaUrl)
  ]
  if (options.sourceType) conditions.push(eq(schema.socialQueue.sourceType, options.sourceType))
  if (options.sourceId) conditions.push(eq(schema.socialQueue.sourceId, options.sourceId))

  const pending = await db.select({
    contentType: schema.socialQueue.contentType,
    sourceType: schema.socialQueue.sourceType,
    sourceId: schema.socialQueue.sourceId
  })
    .from(schema.socialQueue)
    .where(and(...conditions))
    .groupBy(schema.socialQueue.contentType, schema.socialQueue.sourceType, schema.socialQueue.sourceId)
    .orderBy(
      asc(sql`MIN(${schema.socialQueue.scheduledFor})`),
      asc(sql`MIN(${schema.socialQueue.position})`),
      asc(schema.socialQueue.sourceId)
    )
    .limit(20)

  let prepared = 0
  let skipped = 0
  for (const source of pending as PendingSocialSource[]) {
    const url = await renderSocialCard(source).catch((error) => {
      console.error(`[social:prepare-media] Failed to render ${source.sourceType}:${source.sourceId}`, error)
      return ''
    })
    await db.update(schema.socialQueue)
      .set({ mediaUrl: url, updatedAt: new Date() })
      .where(and(
        eq(schema.socialQueue.contentType, source.contentType),
        eq(schema.socialQueue.sourceType, source.sourceType),
        eq(schema.socialQueue.sourceId, source.sourceId),
        eq(schema.socialQueue.status, 'queued'),
        isNull(schema.socialQueue.mediaUrl)
      ))
    if (url) prepared++
    else skipped++
  }
  return { prepared, skipped, examined: pending.length }
}

async function renderSocialCard(source: PendingSocialSource): Promise<string> {
  const resolved = await verbatimsSocialPublishableSourceResolver.resolveSource({
    sourceType: source.sourceType,
    sourceId: source.sourceId,
    baseSiteUrl,
    platform: 'x'
  })
  if (!resolved?.media?.url) return ''

  const templateName = source.sourceType as keyof typeof socialCardTemplates
  const content = source.contentType === 'theme'
    ? await getThemeCardCopy(source.sourceId, resolved.content.title || 'Verbatims')
    : {
        title: resolved.content.title || 'Verbatims',
        date: '',
        headline: resolved.content.title || 'Verbatims'
      }
  const imageUrl = /^https?:\/\//i.test(resolved.media.url)
    ? resolved.media.url
    : `${baseSiteUrl}/${resolved.media.url.replace(/^\//, '')}`
  const sourceHtml = socialCardTemplates[templateName]
  const style = source.contentType === 'theme' ? themeCardStyles : minimalCardStyles
  const html = fillTemplate(sourceHtml.replace('<link rel="stylesheet" href="../templates/minimal.css">', `<style>${style}</style>`)
    .replace('<link rel="stylesheet" href="../templates/theme.css">', `<style>${style}</style>`), {
      DOCUMENT_TITLE: content.title,
      TITLE: content.title,
      HEADLINE: content.headline,
      IMAGE_SRC: imageUrl,
      IMAGE_ALT: resolved.media.alt || content.title,
      IMAGE_POSITION: 'center center',
      DATE_HIDDEN: content.date ? '' : ' hidden',
      DATE: content.date,
      PHRASE_HTML: ''
    })
  const keyHash = createHash('sha256').update(JSON.stringify({ source, imageUrl, title: content.title, date: content.date, version: 1 })).digest('hex').slice(0, 16)
  const key = `social-cards/${source.contentType}/${source.sourceType}-${source.sourceId}-${keyHash}.png`
  const existing = await blob.head(key)
  if (!existing) {
    const { browser, page } = await hubBrowser({ keepAlive: 60, autoCleanup: false })
    try {
      await page.setViewport({ width: 1200, height: 1200, deviceScaleFactor: 1 })
      await page.setContent(html, { waitUntil: 'networkidle2', timeout: 45000 })
      await page.evaluate(() => document.fonts.ready)
      const image = await page.screenshot({ type: 'png' })
      const imageData = new Uint8Array(image.byteLength)
      imageData.set(image)
      await blob.put(key, new Blob([imageData.buffer], { type: 'image/png' }), { contentType: 'image/png', addRandomSuffix: false })
    } finally {
      await page.close().catch(() => {})
      await browser.disconnect().catch(() => {})
    }
  }
  return `/blob/${key}`
}

async function getThemeCardCopy(themeId: number, title: string) {
  const theme = await db.select({
    language: schema.themes.language,
    scheduledStart: schema.themes.scheduledStart,
    scheduledEnd: schema.themes.scheduledEnd
  }).from(schema.themes).where(eq(schema.themes.id, themeId)).limit(1).get()
  const language = theme?.language || 'en'
  const locale = language === 'fr' ? 'fr-FR' : 'en-US'
  const dateFormatter = new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  const start = theme?.scheduledStart ? dateFormatter.format(theme.scheduledStart) : ''
  const end = theme?.scheduledEnd ? dateFormatter.format(theme.scheduledEnd) : ''
  const date = start && end ? `${start} – ${end}` : start || end
  return {
    title,
    date,
    headline: language === 'fr' ? `Découvrez le thème ${title}` : `Discover our ${title} theme`
  }
}

function fillTemplate(template: string, values: Record<string, string>) {
  const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
  const result = template
    .replace(/\{\{\{([A-Z_]+)\}\}\}/g, (_match, key: string) => key === 'PHRASE_HTML' ? values[key] || '' : escapeHtml(values[key] || ''))
    .replace(/\{\{([A-Z_]+)\}\}/g, (_match, key: string) => escapeHtml(values[key] || ''))
  if (/\{\{\{?[A-Z_]+\}\}\}?/.test(result)) throw new Error('Social card template has an unresolved placeholder')
  return result
}
