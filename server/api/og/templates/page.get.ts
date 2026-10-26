type OgPageSlug = 'search' | 'presskit'

const pages: Record<OgPageSlug, { title: string; eyebrow: string; description: string }> = {
  search: {
    title: 'Search',
    eyebrow: 'Explore the collection',
    description: 'Find quotes by words, authors, or sources.',
  },
  presskit: {
    title: 'Press kit',
    eyebrow: 'Verbatims identity',
    description: 'Logos and brand assets, ready to share.',
  },
}

export default defineEventHandler((event) => {
  const slug = getQuery(event).slug as string | undefined
  if (!slug || !Object.hasOwn(pages, slug)) {
    throwServer(404, 'OG page not found')
    return
  }

  const page = pages[slug as OgPageSlug]
  const visual = slug === 'search' ? getSearchVisual() : getPresskitVisual()
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(`${page.title} — Verbatims`)}</title>
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
        display: flex;
        width: 1200px;
        height: 630px;
        flex-direction: column;
        overflow: hidden;
        padding: 54px 74px 42px;
      }
      .brand {
        font-family: 'Fraunces', Georgia, serif;
        font-size: 30px;
        font-weight: 600;
        letter-spacing: -1px;
      }
      main {
        display: flex;
        flex: 1;
        align-items: center;
        gap: 54px;
        padding: 30px 0;
      }
      .copy {
        width: 43%;
        flex-shrink: 0;
      }
      .eyebrow {
        margin: 0 0 18px;
        color: #78716C;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      h1 {
        margin: 0;
        font-family: 'Fraunces', Georgia, serif;
        font-size: 88px;
        font-weight: 550;
        letter-spacing: -0.045em;
        line-height: 0.98;
      }
      .description {
        max-width: 430px;
        margin: 22px 0 0;
        color: #57534E;
        font-size: 22px;
        line-height: 1.4;
      }
      .visual {
        display: flex;
        min-width: 0;
        flex: 1;
        flex-direction: column;
        justify-content: center;
        border-left: 1px solid #D6D3D1;
        padding-left: 48px;
      }
      .search-field {
        display: flex;
        height: 84px;
        align-items: center;
        gap: 18px;
        border-bottom: 1px solid #A8A29E;
        color: #78716C;
        font-size: 22px;
      }
      .search-icon {
        width: 27px;
        height: 27px;
        flex-shrink: 0;
        color: #3C82F6;
      }
      .search-categories {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 26px;
        color: #57534E;
        font-size: 16px;
      }
      .search-categories span + span::before {
        content: '·';
        margin-right: 12px;
        color: #FAA533;
      }
      .logo-previews {
        display: flex;
        min-width: 0;
        align-items: center;
        gap: 20px;
      }
      .logo-previews img {
        display: block;
        width: 100%;
        min-width: 0;
        border-radius: 3px;
        object-fit: contain;
      }
      .logo-bar { min-width: 0; flex: 1; }
      .logo-monogram { width: 190px; max-width: 190px; flex-shrink: 0; }
      footer {
        color: #78716C;
        font-size: 15px;
        letter-spacing: 0.02em;
      }
    </style>
  </head>
  <body>
    <div class="frame" role="img" aria-label="${escapeHtml(`${page.title}. ${page.description}`)}">
      <div class="brand">verbatims</div>
      <main>
        <section class="copy">
          <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>
          <h1>${escapeHtml(page.title)}</h1>
          <p class="description">${escapeHtml(page.description)}</p>
        </section>
        <section class="visual" aria-hidden="true">${visual}</section>
      </main>
      <footer>verbatims.cc</footer>
    </div>
  </body>
</html>`

  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=600')
  return html
})

function getSearchVisual(): string {
  return `<div class="search-field">
    <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8"></circle>
      <path d="m16 16 4.2 4.2"></path>
    </svg>
    <span>A quote, an author, or a source</span>
  </div>
  <div class="search-categories"><span>Quotes</span><span>Authors</span><span>Sources</span></div>`
}

function getPresskitVisual(): string {
  return `<div class="logo-previews">
    <img class="logo-bar" src="/images/verbatims-bar.png" alt="">
    <img class="logo-monogram" src="/images/vbt.png" alt="">
  </div>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
