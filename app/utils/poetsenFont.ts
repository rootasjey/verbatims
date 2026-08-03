// Shared client-side utility for embedding Poetsen One font for DOM-to-image exports
// Provides data-URL @font-face construction, head injection, and inline subtree injection.

let cachedStyleText: string | null = null
const FONT_STYLE_ID = 'poetsen-one-inline-style'

function isClient() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as any)
  }
  return btoa(binary)
}

async function toDataUrl(path: string, mime?: string): Promise<string> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to fetch: ${path}`)
  const buf = await res.arrayBuffer()
  const b64 = arrayBufferToBase64(buf)
  const type = mime || (path.endsWith('.woff2') ? 'font/woff2' : path.endsWith('.woff') ? 'font/woff' : 'application/octet-stream')
  return `data:${type};base64,${b64}`
}

export async function buildPoetsenStyleText(): Promise<string> {
  if (cachedStyleText) return cachedStyleText
  try {
    const woff2 = await toDataUrl('/fonts/poetsenone-cbe208f0.woff2', 'font/woff2')
    const src = `src: url(${woff2}) format('woff2');`
    cachedStyleText = `@font-face { font-family: 'Poetsen One'; font-style: normal; font-weight: 400; font-display: swap; ${src} }
@font-face { font-family: 'Poetsen One'; font-style: normal; font-weight: 600; font-display: swap; ${src} }`
  } catch (e) {
    // Fallback to relative URLs if data URL building fails
    cachedStyleText = `@font-face { font-family: 'Poetsen One'; font-style: normal; font-weight: 400; font-display: swap; src: url(/fonts/poetsenone-cbe208f0.woff2) format('woff2'); }
@font-face { font-family: 'Poetsen One'; font-style: normal; font-weight: 600; font-display: swap; src: url(/fonts/poetsenone-cbe208f0.woff2) format('woff2'); }`
  }
  return cachedStyleText
}

export async function ensurePoetsenFont(): Promise<void> {
  if (!isClient()) return
  try {
    if (!document.getElementById(FONT_STYLE_ID)) {
      const style = document.createElement('style')
      style.id = FONT_STYLE_ID
      style.textContent = await buildPoetsenStyleText()
      document.head.appendChild(style)
    }
    if ((document as any).fonts && 'load' in (document as any).fonts) {
      await Promise.allSettled([
        (document as any).fonts.load("400 16px 'Poetsen One'"),
        (document as any).fonts.load("600 16px 'Poetsen One'"),
      ])
    }
  } catch (e) {
    // swallow; consumers still proceed with fallbacks
    console.warn('ensurePoetsenFont warning', e)
  }
}

export async function injectPoetsenInlineInto(rootEl: HTMLElement): Promise<void> {
  if (!isClient() || !rootEl) return
  const style = document.createElement('style')
  style.textContent = await buildPoetsenStyleText()
  rootEl.prepend(style)
}
