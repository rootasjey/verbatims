export default defineEventHandler(async (event) => {
  const id = getQuery(event).id as string | undefined
  if (!id) { throwServer(400, 'id is required'); return }

  const author = await getAuthorForOg(id)
  if (!author) { throwServer(404, 'Author not found'); return }

  const role = author.isFictional ? 'Fictional Character' : 'Author'
  const subtitle = [role, author.job].filter(Boolean).join(' • ')
  const description = author.description
    ? author.description
    : `Discover quotes by ${author.name} on Verbatims.`

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(`${author.name} — Verbatims`)}</title>
    <meta name="description" content="${escapeHtml(description)}">
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
        --bg-start: #0B1220;
        --bg-end: #000000;
        --fg: #f8fafc;
        --fg-dim: rgba(248, 250, 252, 0.82);
        --chip: rgba(248, 250, 252, 0.18);
      }
      html, body { margin: 0; padding: 0; height: 100%; }
      body {
        width: 1200px;
        height: 630px;
        background: radial-gradient(1200px 630px at 100% 0, rgba(60, 130, 246, 0.22), transparent 55%),
                    linear-gradient(180deg, var(--bg-start), var(--bg-end));
        color: var(--fg);
        font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .card { width: 960px; height: 500px; display: flex; flex-direction: column; justify-content: center; }
      .chip {
        display: inline-flex;
        width: fit-content;
        margin-bottom: 22px;
        padding: 8px 14px;
        border-radius: 9999px;
        background: var(--chip);
        font-size: 20px;
        font-weight: 600;
      }
      h1 {
        margin: 0;
        font-size: 70px;
        font-weight: 700;
        letter-spacing: -1px;
        line-height: 1.1;
        font-family: 'Gambetta', Georgia, 'Times New Roman', serif;
      }
      p {
        margin: 24px 0 0;
        font-size: 28px;
        line-height: 1.3;
        color: var(--fg-dim);
      }
      .brand {
        margin-top: 26px;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: 6px;
        text-transform: uppercase;
        color: rgba(248, 250, 252, 0.65);
      }
    </style>
  </head>
  <body>
    <div class="card" role="img" aria-label="Social share image for an author on Verbatims">
      <span class="chip">${escapeHtml(subtitle || 'Author')}</span>
      <h1>${escapeHtml(wrapTitle(author.name, 72))}</h1>
      <p>${escapeHtml(wrapBody(description, 150))}</p>
      <div class="brand">verbatims.cc</div>
    </div>
  </body>
</html>`

  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=600')
  return html
})

function wrapTitle(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return 'Unknown Author'
  return normalized.length > max ? normalized.slice(0, max - 1).trimEnd() + '…' : normalized
}

function wrapBody(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return 'Discover this author on Verbatims.'
  return normalized.length > max ? normalized.slice(0, max - 1).trimEnd() + '…' : normalized
}

function escapeHtml(val: string): string {
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
