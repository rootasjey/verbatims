import { getCollectionOgPreview } from '~~/server/utils/og-collection'

export default defineEventHandler(async (event) => {
  const id = Number(getQuery(event).id)
  if (!Number.isSafeInteger(id) || id < 1) throwServer(400, 'Invalid list ID')
  const preview = await getCollectionOgPreview(id)
  if (!preview) throwServer(404, 'List not found')

  const locale = getQuery(event).locale === 'fr' ? 'fr' : 'en'
  const isPublic = preview.isPublic
  const title = isPublic ? preview.name || (locale === 'fr' ? 'Sélection de citations' : 'Saved quotes') : (locale === 'fr' ? 'Liste privée' : 'Private list')
  const description = isPublic
    ? `${preview.quoteCount} ${locale === 'fr' ? (preview.quoteCount === 1 ? 'citation' : 'citations') : (preview.quoteCount === 1 ? 'quote' : 'quotes')} ${locale === 'fr' ? 'dans cette sélection.' : 'collected on Verbatims.'}`
    : (locale === 'fr' ? 'Cette liste est privée.' : 'This list is private.')
  const quoteMarkup = isPublic
    ? preview.quotes.map((quote) => {
      const attribution = [quote.author, quote.reference].filter(Boolean).join(' · ')
      return `<article class="quote"><p>${escapeHtml(quote.text)}</p>${attribution ? `<span>${escapeHtml(attribution)}</span>` : ''}</article>`
    }).join('')
    : `<div class="private-mark"><div class="lock"></div><span>${locale === 'fr' ? 'LISTE PRIVÉE' : 'PRIVATE LIST'}</span></div>`
  const content = isPublic && preview.quotes.length
    ? quoteMarkup
    : isPublic
      ? `<p class="empty">${locale === 'fr' ? 'Une sélection de citations mémorables.' : 'A collection of memorable quotes.'}</p>`
      : quoteMarkup

  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=600')
  return `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preload" href="/fonts/fraunces-8bfd3893.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/archivo-97a2c112.woff2" as="font" type="font/woff2" crossorigin>
<style>
@font-face{font-family:Fraunces;src:url('/fonts/fraunces-8bfd3893.woff2') format('woff2');font-weight:400 800}
@font-face{font-family:Archivo;src:url('/fonts/archivo-97a2c112.woff2') format('woff2');font-weight:400 700}
*{box-sizing:border-box}html,body{width:100%;height:100%;margin:0}body{background:#FAFAF9;color:#0C0A09;font-family:Archivo,Arial,sans-serif}
.frame{display:flex;width:1200px;height:630px;flex-direction:column;overflow:hidden;padding:54px 74px 42px}.brand{font-family:Fraunces,Georgia,serif;font-size:30px;font-weight:600;letter-spacing:-1px}
main{display:flex;flex:1;align-items:center;gap:52px;padding:26px 0 30px}.copy{width:40%;flex-shrink:0}h1{display:-webkit-box;overflow:hidden;margin:0;font-family:Fraunces,Georgia,serif;font-size:62px;font-weight:550;letter-spacing:-.04em;line-height:1.02;overflow-wrap:anywhere;-webkit-box-orient:vertical;-webkit-line-clamp:3}.description{margin:20px 0 0;color:#57534E;font-size:18px;line-height:1.45}
.quotes{display:flex;min-width:0;flex:1;flex-direction:column;justify-content:center;gap:0;border-left:1px solid #D6D3D1;padding-left:44px}.quote{padding:12px 0 13px;border-bottom:1px solid #E7E5E4}.quote:last-child{border-bottom:0}.quote p{display:-webkit-box;overflow:hidden;margin:0;color:#292524;font-family:Fraunces,Georgia,serif;font-size:23px;line-height:1.22;-webkit-box-orient:vertical;-webkit-line-clamp:2}.quote span{display:block;overflow:hidden;margin-top:6px;color:#78716C;font-size:13px;text-overflow:ellipsis;white-space:nowrap}.empty{color:#78716C;font-family:Fraunces,Georgia,serif;font-size:25px}.private-mark{display:flex;min-height:190px;align-items:center;flex-direction:column;justify-content:center;gap:18px;color:#78716C;letter-spacing:.14em;font-size:13px;font-weight:600}.lock{position:relative;width:42px;height:34px;margin-top:18px;border:1.5px solid #A8A29E;border-radius:5px}.lock:before{position:absolute;top:-24px;left:8px;width:22px;height:24px;border:1.5px solid #A8A29E;border-bottom:0;border-radius:14px 14px 0 0;content:''}footer{color:#78716C;font-size:15px;letter-spacing:.02em}
</style></head><body><div class="frame" role="img" aria-label="${escapeHtml(title)}. ${escapeHtml(description)}"><div class="brand">verbatims</div><main><section class="copy"><h1>${escapeHtml(title)}</h1><p class="description">${escapeHtml(description)}</p></section><section class="quotes">${content}</section></main><footer>verbatims.cc</footer></div></body></html>`
})

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
