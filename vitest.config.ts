import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '~~': resolve(__dirname),
      '~': resolve(__dirname),
      '#shared': resolve(__dirname, 'shared'),
    },
  },
  test: {
    globals: true,
    include: ['server/utils/__tests__/**/*.test.ts'],
  },
})
