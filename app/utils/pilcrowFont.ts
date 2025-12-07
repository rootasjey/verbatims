// Shared client-side utility for embedding Pilcrow Rounded font for DOM-to-image exports
// Provides data-URL @font-face construction, head injection, and inline subtree injection.

let cachedStyleText: string | null = null
const FONT_STYLE_ID = 'pilcrow-rounded-inline-style'

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

export async function buildPilcrowStyleText(): Promise<string> {
  if (cachedStyleText) return cachedStyleText
  try {
    const [woff2, woff] = await Promise.all([
      toDataUrl('/fonts/ab83153e.woff2', 'font/woff2'),
      toDataUrl('/fonts/9bf19bbb.woff', 'font/woff').catch(() => null as string | null),
    ])
    const src = `src: url(${woff2}) format('woff2')${woff ? `, url(${woff}) format('woff')` : ''};`
    cachedStyleText = `@font-face { font-family: 'Pilcrow Rounded'; font-style: normal; font-weight: 400; font-display: swap; ${src} }
@font-face { font-family: 'Pilcrow Rounded'; font-style: normal; font-weight: 600; font-display: swap; ${src} }`
  } catch (e) {
    // Fallback to relative URLs if data URL building fails
    cachedStyleText = `@font-face { font-family: 'Pilcrow Rounded'; font-style: normal; font-weight: 400; font-display: swap; src: url(/fonts/ab83153e.woff2) format('woff2'), url(/fonts/9bf19bbb.woff) format('woff'); }
@font-face { font-family: 'Pilcrow Rounded'; font-style: normal; font-weight: 600; font-display: swap; src: url(/fonts/ab83153e.woff2) format('woff2'), url(/fonts/9bf19bbb.woff) format('woff'); }`
  }
  return cachedStyleText
}

export async function ensurePilcrowFont(): Promise<void> {
  if (!isClient()) return
  try {
    if (!document.getElementById(FONT_STYLE_ID)) {
      const style = document.createElement('style')
      style.id = FONT_STYLE_ID
      style.textContent = await buildPilcrowStyleText()
      document.head.appendChild(style)
    }
    if ((document as any).fonts && 'load' in (document as any).fonts) {
      await Promise.allSettled([
        (document as any).fonts.load("400 16px 'Pilcrow Rounded'"),
        (document as any).fonts.load("600 16px 'Pilcrow Rounded'"),
      ])
    }
  } catch (e) {
    // swallow; consumers still proceed with fallbacks
    console.warn('ensurePilcrowFont warning', e)
  }
}

export async function injectPilcrowInlineInto(rootEl: HTMLElement): Promise<void> {
  if (!isClient() || !rootEl) return
  const style = document.createElement('style')
  style.textContent = await buildPilcrowStyleText()
  rootEl.prepend(style)
}
