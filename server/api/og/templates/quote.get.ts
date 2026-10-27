export default defineEventHandler(async (event) => {
  const id = getQuery(event).id as string | undefined
  if (!id) { throwServer(400, 'id is required'); return }

  const locale = getOgLanguage(event)
  const quote = await getApprovedQuoteForOg(id, locale)
  if (!quote) { throwServer(404, 'Quote not found'); return }

  // Inline, minimal HTML for deterministic screenshot (no client JS/CSS frameworks)
  const title = locale === 'fr' ? 'Verbatims — Citation' : 'Verbatims — Quote'
  const metaAuthor = quote.authorName ? `— ${quote.authorName}` : ''
  const metaRef = quote.referenceName
    ? ` (${locale === 'fr' ? 'source : ' : 'from '}${quote.referenceName})`
    : ''
  const description = `${quote.text} ${metaAuthor}${metaRef}`.trim()
  const quoteFontSize = getQuoteFontSize(quote.text.length)

  const html = `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
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
        flex-direction: column;
        justify-content: center;
        padding: 24px 0;
      }
      .quote-mark {
        color: #A8A29E;
        font-family: 'Fraunces', Georgia, serif;
        font-size: 62px;
        line-height: 0.7;
      }
      blockquote {
        max-width: 1052px;
        margin: 22px 0 0;
        font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
        font-size: ${quoteFontSize}px;
        font-weight: 550;
        letter-spacing: -0.025em;
        line-height: 1.15;
      }
      .attribution {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 8px 24px;
        margin-top: 24px;
      }
      .author { color: #44403C; font-size: 20px; line-height: 1.4; }
      .source { color: #78716C; font-size: 15px; line-height: 1.4; }
    </style>
  </head>
  <body>
    <div class="frame" role="img" aria-label="${locale === 'fr' ? 'Image de partage d’une citation sur Verbatims' : 'Social share image for a quote on Verbatims'}">
      <main>
        <span class="quote-mark" aria-hidden="true">“</span>
        <blockquote>${escapeHtml(wrapQuoteText(quote.text, locale))}</blockquote>
        <div class="attribution">
          ${quote.authorName ? `<span class="author">${escapeHtml(metaAuthor)}</span>` : ''}
          ${quote.referenceName ? `<span class="source">${locale === 'fr' ? 'Source :' : 'From'} ${escapeHtml(quote.referenceName)}</span>` : ''}
        </div>
      </main>
      <footer class="brand">verbatims</footer>
    </div>
  </body>
</html>`

  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=600')
  return html
})

function wrapQuoteText(text: string, locale: 'en' | 'fr'): string {
  const sanitized = text.replace(/\s+/g, ' ').trim()
  if (!sanitized) return locale === 'fr' ? 'Aucune citation disponible' : 'No quote available'
  // Soft limit the length to keep within 2-3 lines visually; screenshot is fixed size
  const max = 220
  return sanitized.length > max ? sanitized.slice(0, max - 1).trimEnd() + '…' : sanitized
}

function getQuoteFontSize(length: number): number {
  if (length > 170) return 38
  if (length > 110) return 44
  return 50
}

function escapeHtml(val: string): string {
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
