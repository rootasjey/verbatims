import extratorUna from '@una-ui/extractor-vue-script'
import presetUna from '@una-ui/preset'
import prefixes from '@una-ui/preset/prefixes'
import presetAnimations from 'unocss-preset-animations'
import { createLocalFontProcessor } from '@unocss/preset-web-fonts/local'

import {
  presetAttributify,
  presetIcons,
  presetWebFonts,
  presetWind3,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default {
  presets: [
    presetWind3(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
    presetWebFonts({
      provider: 'fontshare',
      fonts: {
        body: 'Nunito',
        sans: 'General Sans',
        serif: 'Gambetta',
        subtitle: 'Pilcrow rounded',
        title: 'Khand',
      },
      processors: [
        createLocalFontProcessor({
          cacheDir: 'node_modules/.cache/unocss/fonts',
          fontAssetsDir: 'public/fonts',
          fontServeBaseUrl: '/fonts',
        }),
      ],
    }),
    presetUna(),
    presetAnimations(),
  ],
  shortcuts: [
    {
      "btn-glowing": "from-primary-500 via-primary-600 to-primary-700 bg-gradient-to-r text-white shadow-lg shadow-primary-500/50 hover:bg-gradient-to-br dark:shadow-lg dark:shadow-primary-800/80 dark:focus:ring-primary-800",
      "btn-glowing-outline": "border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white dark:border-primary-500 dark:text-primary-500 dark:hover:bg-primary-500 dark:hover:text-white",
      "dp-menu-trigger": "color-white absolute top-1 right-1 p-1 ring-0 invisible group-hover:visible rounded-lg backdrop-blur-md bg-white/20 dark:bg-black/60  hover:bg-white/40 dark:hover:bg-black/80 hover:scale-110 active:scale-99 transition b-0",
      "dp-menu-trigger-text": "p-0 px-2 h-auto b-none underline underline-dashed decoration-offset-4 text-gray-500 dark:text-gray-400 hover:bg-transparent hover:decoration-blue-500",
      "image-resizer-container": "absolute h-32px w-32px bottom-1 right-1 rounded-lg backdrop-blur-md bg-white/20 dark:bg-black/60 hover:bg-white/40 dark:hover:bg-black/80 invisible group-hover:visible flex justify-center items-center",
      "image-resizer": "i-ph-arrow-down-right-duotone invisible group-hover:visible z-2 hover:scale-110 active:scale-99 transition",
      // Override UnaUI's generated white variant which uses invalid white-* shade utilities
      // This maps the "soft" button style to sensible white/gray colors for both themes
      "btn-soft-white": "bg-white text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-200 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800 dark:focus-visible:ring-gray-700",
      // Fix invalid generated utilities for text variant with gray-600
      // Prevents: text-gray-600-600, hover:text-gray-600-500, focus-visible:ring-gray-600-600
      "btn-text-gray-600": "text-gray-600 hover:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 dark:text-gray-400 dark:hover:text-gray-300 dark:focus-visible:ring-gray-400",
      // Provide a sane link-style "ghost" color mapping (ghost is not a color token)
      // Prevents: text-ghost-600 and focus-visible:ring-ghost-600
      "btn-link-ghost": "text-gray-600 underline underline-offset-4 decoration-gray-400 hover:text-gray-700 hover:decoration-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 dark:text-gray-400 dark:hover:text-gray-300 dark:focus-visible:ring-gray-400",
    },
  ],
  extractors: [
    extratorUna({
      prefixes,
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
}

