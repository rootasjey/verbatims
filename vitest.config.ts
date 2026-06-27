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
    include: [
      'server/utils/__tests__/**/*.test.ts',
      'server/services/__tests__/**/*.test.ts',
    ],
    server: {
      deps: {
        inline: ['@libsql/client'],
      },
    },
  },
})
