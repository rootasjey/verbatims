import { kv } from 'hub:kv'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { resolveLocalizedField, getThemeTranslations } from '~~/server/utils/theme'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')?.replace(/\.png$/, '')
  if (!slug) throwServer(400, 'Theme slug is required')

  const theme = await db.select({
    id: schema.themes.id,
    slug: schema.themes.slug,
    name: schema.themes.name,
    description: schema.themes.description,
    imageUrl: schema.themes.imageUrl,
    updatedAt: schema.themes.updatedAt,
  })
    .from(schema.themes)
    .where(eq(schema.themes.slug, slug))
    .limit(1)
    .get()

  if (!theme) throwServer(404, 'Theme not found')

  const locale = getQuery(event).locale === 'fr' ? 'fr' : 'en'
  const translations = await getThemeTranslations(theme.id)
  const localized = resolveLocalizedField(translations, locale, theme.name, theme.description)
  const config = useRuntimeConfig()
  const version = `${String(config.public.ogStyleVersion || '1')}:brand-footer-v1:cover-shadow-v1`
  const hash = await sha1(JSON.stringify({
    slug,
    name: localized.name,
    description: localized.description,
    imageUrl: theme.imageUrl,
    locale,
    updatedAt: theme.updatedAt?.getTime() ?? null,
    version,
  }))
  const latestKey = `og:home:${slug}:${locale}:latest`
  const imageKey = `og:home:${slug}:${locale}:${hash}.png`
  const latest = await kv.get<string>(latestKey)
  const cached = await kv.get<string>(imageKey)
  if (cached) {
    setImageHeaders(event, hash)
    return base64ToUint8(cached)
  }

  const origin = getRequestURL(event).origin
  const templateUrl = new URL('/api/og/templates/home', origin)
  templateUrl.searchParams.set('title', localized.name)
  templateUrl.searchParams.set('description', localized.description || '')
  templateUrl.searchParams.set('image', theme.imageUrl || '')
  templateUrl.searchParams.set('locale', locale)

  const { page } = await hubBrowser(event)
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 })
  await page.goto(templateUrl.toString(), { waitUntil: 'networkidle0', timeout: 15000 })
  const png = await page.screenshot({ type: 'png' }) as Buffer
  await kv.set(imageKey, uint8ToBase64(new Uint8Array(png)))
  if (latest && latest !== hash) await kv.del(`og:home:${slug}:${locale}:${latest}.png`)
  await kv.set(latestKey, hash)
  setImageHeaders(event, hash)
  return png
})

function setImageHeaders(event: H3Event, hash: string): void {
  setHeader(event, 'Content-Type', 'image/png')
  setHeader(event, 'ETag', `W/"${hash}"`)
  setHeader(event, 'Cache-Control', 'public, max-age=300, s-maxage=600')
}

async function sha1(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}
