import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(import.meta.url), '..')

export default defineConfig({
  resolve: {
    alias: {
      '~~': root,
      '~': root,
      '#shared': resolve(root, 'shared'),
    },
  },
  test: {
    globals: true,
    testTimeout: 300000,
    include: ['tests/e2e/**/*.e2e.test.ts'],
    server: {
      deps: {
        inline: ['@libsql/client'],
      },
    },
  },
})
