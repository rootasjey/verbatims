// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  app: {
    head: {
      title: 'Verbatims - Universal Quotes Service',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'A comprehensive, user-generated quotes service' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
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
    analytics: true,
    blob: true,
    cache: true,
    database: true,
    kv: true,
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