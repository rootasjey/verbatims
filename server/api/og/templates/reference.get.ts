export default defineEventHandler(async (event) => {
  const id = getQuery(event).id as string | undefined
  if (!id) { throwServer(400, 'id is required'); return }

  const locale = getOgLanguage(event)
  const reference = await getReferenceForOg(id, locale)
  if (!reference) { throwServer(404, 'Reference not found'); return }

  const prettyType = formatReferenceType(reference.primaryType, locale)
  const metadata = [prettyType, reference.secondaryType].filter(Boolean).join(' · ')
  const description = reference.description
    ? reference.description
    : locale === 'fr'
      ? `Découvrez les citations de ${reference.name} sur Verbatims.`
      : `Discover quotes from ${reference.name} on Verbatims.`

  const html = `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(`${reference.name} — Verbatims`)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="preload" href="/fonts/fraunces-8bfd3893.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/fonts/archivo-97a2c112.woff2" as="font" type="font/woff2" crossorigin>
    <style>
      @font-face {
        font-family: 'Fraunces';
        src: url('/fonts/fraunces-8bfd3893.woff2') format('woff2');
        font-weight: 400 800;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'Archivo';
        src: url('/fonts/archivo-97a2c112.woff2') format('woff2');
        font-weight: 400 700;
        font-style: normal;
        font-display: swap;
      }
      * { box-sizing: border-box; }
      html, body { width: 1200px; height: 630px; margin: 0; }
      body {
        background: #FAFAF9;
        color: #0C0A09;
        font-family: 'Archivo', Arial, sans-serif;
      }
      .frame {
        display: flex;
        width: 1200px;
        height: 630px;
        flex-direction: column;
        overflow: hidden;
        padding: 50px 74px 42px;
      }
      .brand {
        font-family: 'Fraunces', Georgia, serif;
        font-size: 30px;
        font-weight: 600;
        letter-spacing: -0.03em;
      }
      main {
        display: flex;
        flex: 1;
        align-items: center;
        gap: 44px;
        justify-content: center;
        padding: 24px 0;
      }
      .cover {
        width: 206px;
        height: 294px;
        flex: 0 0 206px;
        border-radius: 8px;
        object-fit: cover;
        background: #E7E5E4;
      }
      .content { min-width: 0; }
      h1 {
        margin: 0;
        font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
        font-size: ${getTitleFontSize(reference.name)}px;
        font-weight: 550;
        letter-spacing: -0.03em;
        line-height: 1.02;
        overflow-wrap: anywhere;
      }
      .metadata {
        margin: 18px 0 0;
        color: #78716C;
        font-size: 17px;
        line-height: 1.4;
      }
      .description {
        max-width: 860px;
        margin: 24px 0 0;
        color: #57534E;
        font-size: 22px;
        line-height: 1.4;
      }
    </style>
  </head>
  <body>
    <div class="frame" role="img" aria-label="${locale === 'fr' ? 'Image de partage d’une référence sur Verbatims' : 'Social share image for a reference on Verbatims'}">
      <main>
        ${reference.imageUrl ? `<img class="cover" src="${escapeHtml(reference.imageUrl)}" alt="${escapeHtml(reference.imageAlt || reference.name)}">` : ''}
        <section class="content">
          <h1>${escapeHtml(wrapTitle(reference.name, 74, locale))}</h1>
          <p class="metadata">${escapeHtml(metadata || (locale === 'fr' ? 'Référence' : 'Reference'))}</p>
          <p class="description">${escapeHtml(wrapBody(description, 150, locale))}</p>
        </section>
      </main>
      <footer class="brand">verbatims</footer>
    </div>
  </body>
</html>`

  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=600')
  return html
})

function formatReferenceType(type: string, locale: 'en' | 'fr'): string {
  const labels: Record<string, Record<'en' | 'fr', string>> = {
    book: { en: 'Book', fr: 'Livre' },
    film: { en: 'Film', fr: 'Film' },
    tv_series: { en: 'TV series', fr: 'Série TV' },
    music: { en: 'Music', fr: 'Musique' },
    speech: { en: 'Speech', fr: 'Discours' },
    podcast: { en: 'Podcast', fr: 'Podcast' },
    interview: { en: 'Interview', fr: 'Entretien' },
    documentary: { en: 'Documentary', fr: 'Documentaire' },
    media_stream: { en: 'Media stream', fr: 'Média en ligne' },
    writings: { en: 'Writings', fr: 'Écrits' },
    video_game: { en: 'Video game', fr: 'Jeu vidéo' },
    other: { en: 'Reference', fr: 'Référence' },
  }
  return labels[type]?.[locale] || (locale === 'fr' ? 'Référence' : 'Reference')
}

function wrapTitle(text: string, max: number, locale: 'en' | 'fr'): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return locale === 'fr' ? 'Référence inconnue' : 'Unknown Reference'
  return normalized.length > max ? normalized.slice(0, max - 1).trimEnd() + '…' : normalized
}

function wrapBody(text: string, max: number, locale: 'en' | 'fr'): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return locale === 'fr' ? 'Découvrez cette référence sur Verbatims.' : 'Discover this reference on Verbatims.'
  return normalized.length > max ? normalized.slice(0, max - 1).trimEnd() + '…' : normalized
}

function getTitleFontSize(title: string): number {
  if (title.length > 36) return 58
  if (title.length > 25) return 68
  if (title.length > 16) return 76
  return 84
}

function escapeHtml(val: string): string {
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
