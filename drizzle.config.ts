import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './server/db/schema.ts',
  out: './.data/db/migrations/sqlite',
  dbCredentials: {
    url: './.data/db/sqlite.db',
  },
})
