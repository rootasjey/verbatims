import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../../db/schema'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export type TestDb = {
  db: ReturnType<typeof drizzle>
  schema: typeof schema
}

export function createTestDb(): TestDb {
  const client = createClient({ url: ':memory:' })

  const schemaPath = resolve(__dirname, '../../db/migrations/schema.sql')
  const raw = readFileSync(schemaPath, 'utf-8')
  const statements = raw
    .split('\n')
    .filter(line => !line.startsWith('--') && !line.startsWith('-->'))
    .join('\n')

  client.executeMultiple(statements)

  const db = drizzle(client)

  return { db, schema }
}

export function seedUser(db: TestDb['db'], overrides?: Partial<typeof schema.users.$inferInsert>) {
  return db.insert(schema.users).values({
    email: 'test@verbatims.cc',
    name: 'Test User',
    password: 'hashed_password',
    role: 'user',
    language: 'en',
    ...overrides,
  })
}

export function seedAuthor(db: TestDb['db'], overrides?: Partial<typeof schema.authors.$inferInsert>) {
  return db.insert(schema.authors).values({
    name: 'Test Author',
    isFictional: false,
    ...overrides,
  })
}

export function seedReference(db: TestDb['db'], overrides?: Partial<typeof schema.quoteReferences.$inferInsert>) {
  return db.insert(schema.quoteReferences).values({
    name: 'Test Reference',
    primaryType: 'book',
    ...overrides,
  })
}

export function seedQuote(db: TestDb['db'], overrides?: Partial<typeof schema.quotes.$inferInsert>) {
  return db.insert(schema.quotes).values({
    name: 'Test quote content.',
    language: 'en',
    status: 'approved',
    userId: 1,
    ...overrides,
  })
}

export function seedTag(db: TestDb['db'], overrides?: Partial<typeof schema.tags.$inferInsert>) {
  return db.insert(schema.tags).values({
    name: 'test-tag',
    color: '#3B82F6',
    ...overrides,
  })
}

export function seedApiKey(db: TestDb['db'], overrides?: Partial<typeof schema.apiKeys.$inferInsert>) {
  return db.insert(schema.apiKeys).values({
    userId: 1,
    name: 'Test Key',
    keyHash: 'abc123',
    keyPrefix: 'vbt_testab',
    tier: 'free',
    permissions: '["read"]',
    readRateLimit: 1000,
    readWindowSec: 3600,
    isActive: true,
    ...overrides,
  })
}
