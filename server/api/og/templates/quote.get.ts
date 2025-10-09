import { getApprovedQuoteForOg } from '~/server/utils/og'

export default defineEventHandler(async (event) => {
  const id = getQuery(event).id as string | undefined
  if (!id) { throwServer(400, 'id is required'); return }

  const quote = await getApprovedQuoteForOg(id)
  if (!quote) { throwServer(404, 'Quote not found'); return }

  // Inline, minimal HTML for deterministic screenshot (no client JS/CSS frameworks)
  const title = 'Verbatims — Quote'
  const metaAuthor = quote.authorName ? `— ${quote.authorName}` : ''
  const metaRef = quote.referenceName ? ` (${quote.referenceName})` : ''
  const description = `${quote.text} ${metaAuthor}${metaRef}`.trim()

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="preload" href="/fonts/b22137e4.woff2" as="font" type="font/woff2" crossorigin>
    <style>
      /* Self-hosted font for reliability in OG rendering */
      @font-face {
        font-family: 'Gambetta';
        src: url('/fonts/b22137e4.woff2') format('woff2'),
             url('/fonts/b41f87c0.ttf') format('truetype');
        font-weight: 400 800; /* allow synthetic bolds if single weight */
        font-style: normal;
        font-display: swap;
      }
      :root {
        --bg-start: #0B1220;
        --bg-end: #000000;
        --fg: #f8fafc;
        --fg-dim: rgba(248, 250, 252, 0.85);
        --brand: rgba(248, 250, 252, 0.65);
      }
      html, body { margin: 0; padding: 0; height: 100%; }
      body {
        width: 1200px; height: 630px;
        background: radial-gradient(1200px 630px at 0 0, var(--bg-end), transparent 60%),
                    linear-gradient(180deg, var(--bg-start), var(--bg-end));
        color: var(--fg);
        font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        display: flex; align-items: center; justify-content: center;
      }
      .card { width: 960px; height: 480px; display: flex; flex-direction: column; justify-content: center; }
      blockquote {
        margin: 0 0 24px 0; font-size: 54px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2;
        font-family: 'Gambetta', Georgia, 'Times New Roman', serif;
        color: var(--fg);
      }
      .meta { font-size: 28px; font-weight: 200; color: var(--fg-dim); margin-top: 8px; }
      .brand { margin-top: 20px; font-size: 18px; font-weight: 700; letter-spacing: 6px; text-transform: uppercase; color: var(--brand); }
    </style>
  </head>
  <body>
    <div class="card" role="img" aria-label="Social share image for a quote on Verbatims">
      <blockquote>“${escapeHtml(wrapQuoteText(quote.text))}”</blockquote>
      <div class="meta">${escapeHtml([quote.authorName ? `— ${quote.authorName}` : '', quote.referenceName ? `from ${quote.referenceName}` : ''].filter(Boolean).join(' '))}</div>
      <div class="brand">verbatims.cc</div>
    </div>
  </body>
</html>`

  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=600')
  return html
})

function wrapQuoteText(text: string): string {
  const sanitized = text.replace(/\s+/g, ' ').trim()
  if (!sanitized) return 'No quote available'
  // Soft limit the length to keep within 2-3 lines visually; screenshot is fixed size
  const max = 220
  return sanitized.length > max ? sanitized.slice(0, max - 1).trimEnd() + '…' : sanitized
}

function escapeHtml(val: string): string {
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
