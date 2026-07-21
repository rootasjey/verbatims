import { getRandomTagBorderColor } from '#shared/constants/tag'

type BgType = 'solid' | 'transparent' | 'author-image' | 'reference-image'
type Theme = 'light' | 'dark'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = query.id as string | undefined
  if (!id) { throwServer(400, 'id is required'); return }

  const background = (query.background as BgType) || 'solid'
  const theme = (query.theme as Theme) || 'light'

  const quote = await getApprovedQuoteForOg(id)
  if (!quote) { throwServer(404, 'Quote not found'); return }

  const author = quote.authorName || 'Unknown author'
  const reference = quote.referenceName || ''
  const rimColor = getRandomTagBorderColor(quote.tags)

  // Resolve background image URL with cascading fallback:
  // author-image → try author → try reference → solid
  // reference-image → try reference → try author → solid
  let bgImageUrl = ''
  if (background === 'author-image') {
    bgImageUrl = quote.authorImageUrl || quote.referenceImageUrl || ''
  } else if (background === 'reference-image') {
    bgImageUrl = quote.referenceImageUrl || quote.authorImageUrl || ''
  }

  const hasPhoto = !!bgImageUrl

  const isDark = theme === 'dark' || hasPhoto

  const bgColor = background === 'transparent' ? 'transparent' : isDark ? '#0C0A09' : '#F3F4F6'
  const textColor = isDark ? '#FFFFFF' : '#111827'
  const mutedColor = isDark ? '#D1D5DB' : '#374151'
  const borderStyle = hasPhoto ? 'border: 0' : `border: 18px solid ${rimColor}`

  // Show author avatar only if author has an image AND it's not used as the background
  const showAuthorAvatar = !!quote.authorImageUrl && bgImageUrl !== quote.authorImageUrl
  const authorImageHtml = showAuthorAvatar
    ? `<div class="avatar-wrap"><img src="${escapeHtml(quote.authorImageUrl!)}" alt="" class="avatar" /></div>`
    : ''

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verbatims — Social Quote</title>
    <style>
      @font-face {
        font-family: 'Gambetta';
        src: url('/fonts/b22137e4.woff2') format('woff2'),
             url('/fonts/b41f87c0.ttf') format('truetype');
        font-weight: 400 800;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: 'Pilcrow Rounded';
        src: url('/fonts/ab83153e.woff2') format('woff2');
        font-weight: 400 600;
        font-style: normal;
        font-display: swap;
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
        ${borderStyle}
        border-radius: 36px;
        background: ${bgColor};
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 84px 72px 72px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }

      ${hasPhoto ? `
      .card-bg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .card-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.65) 40%, rgba(0,0,0,0.1) 100%);
      }
      ` : ''}

      .content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
      }

      blockquote {
        margin: 0;
        color: ${textColor};
        font-family: 'Gambetta', Georgia, 'Times New Roman', serif;
        line-height: 1.08;
        letter-spacing: -0.4px;
        font-size: ${getQuoteFontSize(quote.text)}px;
      }

      .meta {
        margin-top: 56px;
        display: flex;
        flex-direction: column;
        align-items: center;
        color: ${textColor};
      }

      .avatar-wrap {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        overflow: hidden;
        border: 4px solid ${rimColor};
        margin-bottom: 20px;
      }

      .avatar {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .author {
        font-size: 44px;
        font-weight: 700;
        font-family: 'Pilcrow Rounded', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;
      }

      .reference {
        margin-top: 10px;
        border-top: 2px solid ${hasPhoto ? 'rgba(255,255,255,0.2)' : '#D1D5DB'};
        padding-top: 10px;
        font-size: 32px;
        color: ${mutedColor};
        font-family: 'Pilcrow Rounded', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;
      }
    </style>
  </head>
  <body>
    <div class="card" role="img" aria-label="Square social quote image">
      ${hasPhoto ? `<img src="${escapeHtml(bgImageUrl)}" alt="" class="card-bg" /><div class="card-overlay"></div>` : ''}
      <div class="content">
        <blockquote>${escapeHtml(wrapQuoteText(quote.text))}</blockquote>
        <div class="meta">
          ${authorImageHtml}
          <div class="author">${escapeHtml(author)}</div>
          ${reference ? `<div class="reference">${escapeHtml(reference)}</div>` : ''}
        </div>
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
