// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  // App configuration
  app: {
    head: {
      title: 'Verbatims - Universal Quotes Database',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'A comprehensive, user-generated quotes database with moderation capabilities' }
      ]
    }
  },

  modules: [
    '@nuxt/image',
    '@nuxt/test-utils',
    '@pinia/nuxt',
    '@nuxthub/core',
    'nuxt-auth-utils',
    '@una-ui/nuxt'
  ],

  // NuxtHub configuration
  hub: {
    analytics: true,
    blob: true,
    cache: true,
    database: true,
    kv: true,
  },

  // CSS configuration
  // css: ['~/assets/css/main.css'],

  // Runtime config
  runtimeConfig: {
    // Private keys (only available on server-side)
    authSecret: process.env.NUXT_AUTH_SECRET,

    // Public keys (exposed to client-side)
    public: {
      authUrl: process.env.NUXT_AUTH_ORIGIN || 'http://localhost:3000'
    }
  },

  // Image optimization
  image: {
    cloudflare: {
      baseURL: 'https://verbatims.pages.dev'
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
          DEFAULT: '#687FE5',
          50: '#F4F5FF',
          100: '#E9EDFF',
          200: '#DDE2FF',
          300: '#CDD4FF',
          400: '#BCC7FF',
          500: '#687FE5',
          600: '#576ED3',
          700: '#4659B7',
          800: '#2E3E93',
          900: '#161F70',
        },
      },
    },
  },
  una: {
    prefix: "U",
    themeable: true,
  },
})