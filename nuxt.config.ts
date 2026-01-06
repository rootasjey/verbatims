// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'

export default defineNuxtConfig({
  compatibilityDate: '2025-12-31',
  devtools: { enabled: false }, // Disabled due to Drizzle Studio bug in @nuxthub/core@0.10.4

  app: {
    head: {
      title: 'Verbatims - Modern Quotes Service',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'A comprehensive, user-generated quotes service' },
        
        // Open Graph / Facebook
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Verbatims' },
        { property: 'og:title', content: 'Verbatims - Modern Quotes Service' },
        { property: 'og:description', content: 'Discover inspiring quotes from films, books, games, and more. A comprehensive, user-generated quotes database with moderation capabilities.' },
        { property: 'og:image', content: '/api/og/default.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:url', content: 'https://verbatims.cc' },
        
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Verbatims - Modern Quotes Service' },
        { name: 'twitter:description', content: 'Discover inspiring quotes from films, books, games, and more. A comprehensive, user-generated quotes database with moderation capabilities.' },
        { name: 'twitter:image', content: '/api/og/default.png' },
        
        // Additional meta tags
        { name: 'theme-color', content: '#0BA6DF' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/images/favicon-192.png' },
        { rel: 'canonical', href: 'https://verbatims.cc' }
      ]
    }
  },

  modules: [
    '@nuxt/image',
    '@nuxt/test-utils',
    '@pinia/nuxt',
    '@nuxthub/core',
    'nuxt-auth-utils',
    '@una-ui/nuxt',
    '@vueuse/nuxt',
  ],

  typescript: {
    strict: false
  },

  hub: {
    blob: true,
    cache: true,
    db: 'sqlite',
    kv: true,
  },

  nitro: {
    preset: 'cloudflare-module',
    experimental: {
      wasm: true
    },
    ignore: ['scripts/**'],
    alias: {
      '~/server': resolve(dirname(fileURLToPath(import.meta.url)), 'server'),
      '~/shared': resolve(dirname(fileURLToPath(import.meta.url)), 'shared')
    }
  },

  // css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Private keys (only available on server-side)
    authSecret: process.env.NUXT_AUTH_SECRET,

    // Public keys (exposed to client-side)
    public: {
      authUrl: process.env.NUXT_AUTH_ORIGIN || 'http://localhost:3000',
      // Injected at build time; used in UI (About, header, footer)
      appVersion: computeVersion(),
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://verbatims.cc',
      // Bump to invalidate all previously rendered OG images
      ogStyleVersion: process.env.NUXT_PUBLIC_OG_STYLE_VERSION || '1'
    }
  },

  // Image optimization
  image: {
    provider: 'cloudflare',
    cloudflare: {
      baseURL: 'https://verbatims.cc'
    }
  },
  
  unocss: {
    preflight: true,
    icons: {
      scale: 1.0,
      extraProperties: {
        "display": "inline-block",
        "vertical-align": "middle",
      },
    },
    theme: {
      colors: {
        primary: {
          DEFAULT: '#3C82F6',
          50: '#E6F2FA',
          100: '#C3E4F5',
          200: '#99D1F0',
          300: '#66BFFB',
          400: '#34AEEF',
          500: '#3C82F6',
          600: '#0D89C8',
          700: '#007AAD',
          800: '#006488',
          900: '#004D66',
        },
        secondary: {
          DEFAULT: '#FAA533',
          50: '#FFF3E6',
          100: '#FEE0B8',
          200: '#FDC78A',
          300: '#FDB15A',
          400: '#FF9A1F',
          500: '#FAA533',
          600: '#E88C00',
          700: '#B84217',
          800: '#993715',
          900: '#7A2C12',
        },
      },
    },
  },
  una: {
    // switched prefix from U -> N so Una UI components become <N...>
    // (we also remove the explicit NIcon alias later to avoid a naming collision)
    prefix: "N",
    themeable: true,
  },

  components: {
    global: true,
    dirs: [
      {
        path: '~/components',
        global: true
      }
    ]
  },

  // Component aliases for automatic resolution
  // NOTE: removed the explicit `NIcon` alias because Una UI will supply `NIcon`
  // after switching the prefix to `N`. If you need a local app-specific icon
  // component, create a different name (e.g. `AppIcon`) to avoid collision.
  alias: {
  },
})

function computeVersion(): string {
  // Prefer latest git tag like v1.2.3; fallback to package.json version
  try {
    const tag = execSync("git describe --tags --match 'v[0-9]*.[0-9]*.[0-9]*' --abbrev=0", {
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString().trim()
    return tag.replace(/^v/, '')
  } catch {}

  try {
    const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8') as unknown as string)
    return pkg.version || '0.0.0'
  } catch {}

  return '0.0.0'
}
