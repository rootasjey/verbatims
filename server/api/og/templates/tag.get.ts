import { getTagForOg } from '~~/server/utils/og'

export default defineEventHandler(async (event) => {
  const id = getQuery(event).id as string | undefined
  if (!id) {
    throwServer(400, 'id is required')
    return
  }

  const tag = await getTagForOg(id)
  if (!tag) {
    throwServer(404, 'Tag not found')
    return
  }

  const accentColor = normalizeAccentColor(tag.color)
  const titleSize = getTitleSize(tag.name)
  const quoteLabel = tag.quoteCount === 1 ? 'quote' : 'quotes'
  const count = tag.quoteCount.toLocaleString('en-US')
  const quoteText = tag.featuredQuote ? getQuoteExcerpt(tag.featuredQuote.text) : undefined
  const attribution = [tag.featuredQuote?.authorName, tag.featuredQuote?.referenceName]
    .filter(Boolean)
    .join(' · ')
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(`${tag.name} — Verbatims`)}</title>
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
      html, body { width: 100%; height: 100%; margin: 0; }
      body {
        background: #FAFAF9;
        color: #0C0A09;
        font-family: 'Archivo', Arial, sans-serif;
      }
      .frame {
        position: relative;
        display: flex;
        width: 1200px;
        height: 630px;
        flex-direction: column;
        overflow: hidden;
        padding: 54px 74px 42px;
      }
      .brand {
        position: relative;
        z-index: 1;
        font-family: 'Fraunces', Georgia, serif;
        font-size: 30px;
        font-weight: 600;
        letter-spacing: -1px;
      }
      .hash-mark {
        position: absolute;
        top: 50%;
        right: 50px;
        transform: translateY(-56%);
        color: ${accentColor};
        font-family: 'Fraunces', Georgia, serif;
        font-size: 420px;
        font-weight: 500;
        line-height: 0.8;
        opacity: 0.08;
        user-select: none;
      }
      main {
        position: relative;
        z-index: 1;
        display: flex;
        flex: 1;
        align-items: center;
        gap: 54px;
        padding: 24px 0 30px;
      }
      .tag-details {
        display: flex;
        width: 38%;
        flex-direction: column;
        justify-content: center;
      }
      h1 {
        margin: 0;
        font-family: 'Fraunces', Georgia, serif;
        font-size: ${titleSize}px;
        font-weight: 550;
        letter-spacing: -0.045em;
        line-height: 0.98;
        overflow-wrap: anywhere;
      }
      .count {
        display: flex;
        align-items: baseline;
        gap: 9px;
        margin: 26px 0 0;
        color: #57534E;
        font-size: 25px;
        font-weight: 400;
      }
      .count strong {
        color: #0C0A09;
        font-size: 28px;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
      }
      .quote {
        display: flex;
        min-width: 0;
        flex: 1;
        flex-direction: column;
        justify-content: center;
        align-self: stretch;
        border-left: 1px solid #D6D3D1;
        padding: 6px 0 6px 48px;
      }
      .quote-mark {
        margin: 0 0 10px;
        color: ${accentColor};
        font-family: 'Fraunces', Georgia, serif;
        font-size: 68px;
        line-height: 0.7;
      }
      blockquote {
        margin: 0;
        font-family: 'Fraunces', Georgia, serif;
        font-size: 37px;
        font-weight: 450;
        letter-spacing: -0.025em;
        line-height: 1.15;
        overflow-wrap: anywhere;
      }
      .attribution {
        margin: 22px 0 0;
        color: #78716C;
        font-size: 16px;
        line-height: 1.4;
      }
      footer {
        position: relative;
        z-index: 1;
        color: #78716C;
        font-size: 15px;
        letter-spacing: 0.02em;
      }
    </style>
  </head>
  <body>
    <div class="frame" role="img" aria-label="Tag ${escapeHtml(tag.name)} with ${count} ${quoteLabel} on Verbatims">
      <div class="brand">verbatims</div>
      <div class="hash-mark" aria-hidden="true">#</div>
      <main>
        <section class="tag-details">
          <h1>${escapeHtml(tag.name)}</h1>
          <p class="count"><strong>${count}</strong><span>${quoteLabel}</span></p>
        </section>
        ${quoteText ? `<section class="quote" aria-label="Featured quote">
          <p class="quote-mark" aria-hidden="true">“</p>
          <blockquote>${escapeHtml(quoteText)}</blockquote>
          ${attribution ? `<p class="attribution">— ${escapeHtml(attribution)}</p>` : ''}
        </section>` : ''}
      </main>
      <footer>verbatims.cc</footer>
    </div>
  </body>
</html>`

  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=600')
  return html
})

function normalizeAccentColor(color?: string): string {
  return color && /^#[\da-f]{6}$/i.test(color) ? color : '#3C82F6'
}

function getTitleSize(title: string): number {
  const length = Array.from(title).length
  if (length > 34) return 66
  if (length > 24) return 78
  return 96
}

function getQuoteExcerpt(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  const maximumLength = 150
  if (normalized.length <= maximumLength) return normalized

  const excerpt = normalized.slice(0, maximumLength - 1)
  const lastSpace = excerpt.lastIndexOf(' ')
  return `${excerpt.slice(0, lastSpace > 90 ? lastSpace : excerpt.length).trimEnd()}…`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
