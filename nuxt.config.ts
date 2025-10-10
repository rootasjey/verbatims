// https://nuxt.com/docs/api/configuration/nuxt-config
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

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

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

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

  hub: {
    blob: true,
    cache: true,
    database: true,
    kv: true,
    browser: true,
  },

  nitro: {
    experimental: {
      wasm: true
    },
    ignore: ['scripts/**']
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
          DEFAULT: '#0BA6DF',
          50: '#E6F7FB',
          100: '#C1EAF3',
          200: '#99DCEB',
          300: '#69B8E0',
          400: '#34A3D8',
          500: '#0BA6DF',
          600: '#0A8CC1',
          700: '#0574A3',
          800: '#006B8F',
          900: '#005377',
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
    prefix: "U",
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
  alias: {
    'NIcon': '~/components/NIcon.vue'
  },
})