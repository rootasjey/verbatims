export default defineEventHandler((event) => {
  const query = getQuery(event)
  const locale = query.locale === 'fr' ? 'fr' : 'en'
  const title = escapeHtml(String(query.title || 'Verbatims'))
  const description = escapeHtml(String(query.description || 'Share memorable quotes with their sources.'))
  const image = safeImageUrl(String(query.image || ''), getRequestURL(event).origin)
  const imageCredit = String(query.imageCredit || '').trim()
  const imageCreditLabel = image && imageCredit
    ? `<p class="image-credit">${locale === 'fr' ? 'Illustration : ' : 'Illustration by '}${escapeHtml(imageCredit)}</p>`
    : ''
  const imageMarkup = image
    ? `<img class="theme-image" src="${escapeHtml(image)}" alt="">`
    : '<div class="theme-image theme-placeholder" aria-hidden="true"><span>“</span></div>'

  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=600')
  return `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="preload" href="/fonts/fraunces-8bfd3893.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/fonts/archivo-97a2c112.woff2" as="font" type="font/woff2" crossorigin>
    <style>
      @font-face { font-family: Fraunces; src: url('/fonts/fraunces-8bfd3893.woff2') format('woff2'); font-weight: 400 800; }
      @font-face { font-family: Archivo; src: url('/fonts/archivo-97a2c112.woff2') format('woff2'); font-weight: 400 700; }
      * { box-sizing: border-box; }
      html, body { width: 100%; height: 100%; margin: 0; }
      body { background: #FAFAF9; color: #0C0A09; font-family: Archivo, Arial, sans-serif; }
      .frame { display: flex; width: 1200px; height: 630px; flex-direction: column; overflow: hidden; padding: 54px 74px 42px; }
      .brand { font-family: Fraunces, Georgia, serif; font-size: 30px; font-weight: 600; letter-spacing: -1px; }
      main { display: flex; flex: 1; align-items: center; gap: 56px; padding: 30px 0; }
      .copy { width: 47%; flex-shrink: 0; }
      h1 { display: -webkit-box; overflow: hidden; margin: 0; font-family: Fraunces, Georgia, serif; font-size: 68px; font-weight: 550; letter-spacing: -0.04em; line-height: 1.02; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
      .description { display: -webkit-box; overflow: hidden; max-width: 490px; margin: 24px 0 0; color: #57534E; font-size: 21px; line-height: 1.45; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
      .visual { display: flex; min-width: 0; flex: 1; flex-direction: column; align-self: stretch; gap: 12px; border-left: 1px solid #D6D3D1; padding: 8px 0 8px 48px; }
      .theme-image { display: block; min-height: 0; width: 100%; flex: 1; border-radius: 14px; object-fit: cover; background: #E8E5DC; box-shadow: 0 18px 34px -15px rgba(28, 25, 23, 0.36); }
      .image-credit { display: -webkit-box; overflow: hidden; flex-shrink: 0; margin: 0; color: #78716C; font-size: 14px; line-height: 1.35; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
      .theme-placeholder { display: grid; place-items: center; color: #78716C; font-family: Fraunces, Georgia, serif; font-size: 160px; }
    </style>
  </head>
  <body><div class="frame" role="img" aria-label="${title} — ${description}">
    <main><section class="copy"><h1>${title}</h1><p class="description">${description}</p></section><section class="visual" aria-hidden="true">${imageMarkup}${imageCreditLabel}</section></main>
    <footer class="brand">verbatims</footer>
  </div></body>
</html>`
})

function safeImageUrl(value: string, origin: string): string {
  try {
    const parsed = new URL(value, origin)
    return parsed.protocol === 'https:' || parsed.origin === origin ? parsed.toString() : ''
  } catch {
    return ''
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
