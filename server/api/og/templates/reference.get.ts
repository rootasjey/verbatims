export default defineEventHandler(async (event) => {
  const id = getQuery(event).id as string | undefined
  if (!id) { throwServer(400, 'id is required'); return }

  const reference = await getReferenceForOg(id)
  if (!reference) { throwServer(404, 'Reference not found'); return }

  const prettyType = formatReferenceType(reference.primaryType)
  const subtitle = [prettyType, reference.secondaryType].filter(Boolean).join(' • ')
  const description = reference.description
    ? reference.description
    : `Discover quotes from ${reference.name} on Verbatims.`

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(`${reference.name} — Verbatims`)}</title>
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
        --bg-start: #101420;
        --bg-end: #000000;
        --fg: #f8fafc;
        --fg-dim: rgba(248, 250, 252, 0.82);
        --chip: rgba(250, 165, 51, 0.2);
      }
      html, body { margin: 0; padding: 0; height: 100%; }
      body {
        width: 1200px;
        height: 630px;
        background: radial-gradient(1000px 500px at 0 100%, rgba(250, 165, 51, 0.18), transparent 55%),
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
        font-size: 64px;
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
    <div class="card" role="img" aria-label="Social share image for a reference on Verbatims">
      <span class="chip">${escapeHtml(subtitle || 'Reference')}</span>
      <h1>${escapeHtml(wrapTitle(reference.name, 74))}</h1>
      <p>${escapeHtml(wrapBody(description, 150))}</p>
      <div class="brand">verbatims.cc</div>
    </div>
  </body>
</html>`

  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=600')
  return html
})

function formatReferenceType(type: string): string {
  if (!type) return 'Reference'
  return type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function wrapTitle(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return 'Unknown Reference'
  return normalized.length > max ? normalized.slice(0, max - 1).trimEnd() + '…' : normalized
}

function wrapBody(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return 'Discover this reference on Verbatims.'
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
