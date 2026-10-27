export default defineEventHandler(async (event) => {
  const id = getQuery(event).id as string | undefined
  if (!id) { throwServer(400, 'id is required'); return }

  const locale = getOgLanguage(event)
  const author = await getAuthorForOg(id, locale)
  if (!author) { throwServer(404, 'Author not found'); return }

  const role = locale === 'fr'
    ? author.isFictional ? 'Personnage fictif' : 'Auteur'
    : author.isFictional ? 'Fictional Character' : 'Author'
  const metadata = [role, author.job].filter(Boolean).join(' · ')
  const description = author.description
    ? author.description
    : locale === 'fr'
      ? `Découvrez les citations de ${author.name} sur Verbatims.`
      : `Discover quotes by ${author.name} on Verbatims.`

  const html = `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(`${author.name} — Verbatims`)}</title>
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
        gap: 42px;
        justify-content: center;
        padding: 24px 0;
      }
      .portrait {
        width: 196px;
        height: 196px;
        flex: 0 0 196px;
        border-radius: 50%;
        object-fit: cover;
        background: #E7E5E4;
      }
      .content { min-width: 0; }
      h1 {
        margin: 0;
        font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
        font-size: ${getTitleFontSize(author.name)}px;
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
    <div class="frame" role="img" aria-label="${locale === 'fr' ? 'Image de partage d’un auteur sur Verbatims' : 'Social share image for an author on Verbatims'}">
      <main>
        ${author.imageUrl ? `<img class="portrait" src="${escapeHtml(author.imageUrl)}" alt="${escapeHtml(author.imageAlt || (locale === 'fr' ? `Portrait de ${author.name}` : `Portrait of ${author.name}`))}">` : ''}
        <section class="content">
          <h1>${escapeHtml(wrapTitle(author.name, 72, locale))}</h1>
          <p class="metadata">${escapeHtml(metadata || role)}</p>
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

function wrapTitle(text: string, max: number, locale: 'en' | 'fr'): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return locale === 'fr' ? 'Auteur inconnu' : 'Unknown Author'
  return normalized.length > max ? normalized.slice(0, max - 1).trimEnd() + '…' : normalized
}

function wrapBody(text: string, max: number, locale: 'en' | 'fr'): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return locale === 'fr' ? 'Découvrez cet auteur sur Verbatims.' : 'Discover this author on Verbatims.'
  return normalized.length > max ? normalized.slice(0, max - 1).trimEnd() + '…' : normalized
}

function getTitleFontSize(title: string): number {
  if (title.length > 42) return 60
  if (title.length > 28) return 70
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
