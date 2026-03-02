export default defineEventHandler(async (event) => {
  const id = getQuery(event).id as string | undefined
  if (!id) { throwServer(400, 'id is required'); return }

  const quote = await getApprovedQuoteForOg(id)
  if (!quote) { throwServer(404, 'Quote not found'); return }

  const author = quote.authorName || 'Unknown author'
  const reference = quote.referenceName || ''

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verbatims — Social Quote</title>
    <link rel="preload" href="/fonts/b22137e4.woff2" as="font" type="font/woff2" crossorigin>
    <style>
      @font-face {
        font-family: 'Gambetta';
        src: url('/fonts/b22137e4.woff2') format('woff2'),
             url('/fonts/b41f87c0.ttf') format('truetype');
        font-weight: 400 800;
        font-style: normal;
        font-display: swap;
      }

      :root {
        --bg: #F3F4F6;
        --rim: #0BA6DF;
        --text: #111827;
        --muted: #374151;
      }

      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
      }

      body {
        width: 1080px;
        height: 1080px;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .card {
        box-sizing: border-box;
        width: 1080px;
        height: 1080px;
        border: 18px solid var(--rim);
        border-radius: 36px;
        background: var(--bg);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 84px 72px 72px;
        text-align: center;
      }

      blockquote {
        margin: 0;
        color: var(--text);
        font-family: 'Gambetta', Georgia, 'Times New Roman', serif;
        line-height: 1.08;
        letter-spacing: -0.4px;
        font-size: ${getQuoteFontSize(quote.text)}px;
      }

      .meta {
        margin-top: 56px;
        color: var(--text);
      }

      .author {
        font-size: 44px;
        font-weight: 700;
      }

      .reference {
        margin-top: 10px;
        border-top: 2px solid #D1D5DB;
        padding-top: 10px;
        font-size: 32px;
        color: var(--muted);
      }
    </style>
  </head>
  <body>
    <div class="card" role="img" aria-label="Square social quote image">
      <blockquote>${escapeHtml(wrapQuoteText(quote.text))}</blockquote>
      <div class="meta">
        <div class="author">${escapeHtml(author)}</div>
        ${reference ? `<div class="reference">${escapeHtml(reference)}</div>` : ''}
      </div>
    </div>
  </body>
</html>`

  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=600')
  return html
})

function wrapQuoteText(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return 'No quote available'
  const max = 320
  return normalized.length > max ? `${normalized.slice(0, max - 1).trimEnd()}…` : normalized
}

function getQuoteFontSize(text: string): number {
  const len = text.trim().length
  if (len > 240) return 58
  if (len > 180) return 64
  if (len > 120) return 72
  if (len > 80) return 84
  return 92
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
