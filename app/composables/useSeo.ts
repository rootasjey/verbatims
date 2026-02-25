interface SeoOptions {
  title: string
  description: string
  imagePath?: string
  imageAlt?: string
  type?: 'website' | 'article' | 'profile' | 'product'
  canonical?: string
}

export function useVerbatimsSeo(options: SeoOptions | (() => SeoOptions)) {
  const route = useRoute()
  const config = useRuntimeConfig()

  const configuredOrigin = (config.public as Record<string, unknown>).siteUrl
  const requestOrigin = resolveOrigin()
  const configuredBaseOrigin = typeof configuredOrigin === 'string' && configuredOrigin.length > 0
    ? configuredOrigin
    : requestOrigin
  const preferRequestOrigin = import.meta.server && isLocalOrigin(requestOrigin)
  const baseOrigin = preferRequestOrigin ? requestOrigin : configuredBaseOrigin
  const origin = baseOrigin.endsWith('/') ? baseOrigin.slice(0, -1) : baseOrigin
  const resolveOptions = () => (typeof options === 'function' ? (options as () => SeoOptions)() : options)

  useHead(() => {
    const current = resolveOptions()
    const canonical = current.canonical || `${origin}${route.fullPath}`

    let currentImage = current.imagePath
      ? (current.imagePath.startsWith('http') ? current.imagePath : `${origin}${current.imagePath}`)
      : `${origin}/images/verbatims.jpeg`

    const meta = [
      { name: 'description', content: current.description },
      { property: 'og:title', content: current.title },
      { property: 'og:description', content: current.description },
      { property: 'og:image', content: currentImage },
      { property: 'og:url', content: canonical },
      { property: 'og:type', content: current.type || 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: current.title },
      { name: 'twitter:description', content: current.description },
      { name: 'twitter:image', content: currentImage }
    ]

    if (current.imageAlt) {
      meta.push({ property: 'og:image:alt', content: current.imageAlt })
      meta.push({ name: 'twitter:image:alt', content: current.imageAlt })
    }

    return {
      title: current.title,
      link: [
        { rel: 'canonical', href: canonical }
      ],
      meta
    }
  })
}

function resolveOrigin(): string {
  if (import.meta.server) {
    const url = useRequestURL()
    return `${url.protocol}//${url.host}`
  }

  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin
  }

  return 'https://verbatims.cc'
}

function isLocalOrigin(origin: string): boolean {
  try {
    const hostname = new URL(origin).hostname
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0'
  } catch {
    return false
  }
}