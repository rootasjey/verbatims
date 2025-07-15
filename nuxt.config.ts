// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

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
    database: true,
    kv: true,
    blob: true,
    analytics: true
  },

  // Authentication configuration
  auth: {
    baseURL: process.env.AUTH_ORIGIN,
    providers: {
      github: {
        clientId: process.env.NUXT_OAUTH_GITHUB_CLIENT_ID,
        clientSecret: process.env.NUXT_OAUTH_GITHUB_CLIENT_SECRET
      },
      google: {
        clientId: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID,
        clientSecret: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET
      }
    }
  },

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

  // CSS configuration
  css: ['~/assets/css/main.css'],

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
  }
})