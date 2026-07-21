import { createClient } from '@libsql/client'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sha256 } from '@noble/hashes/sha2.js'
import { scrypt } from '@noble/hashes/scrypt.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = resolve(__dirname, '../../../.data/test.db')

function hashKey(key: string): string {
  const hash = sha256(new TextEncoder().encode(key))
  return Array.from(hash).map((b: number) => b.toString(16).padStart(2, '0')).join('')
}

function toBase64(data: Uint8Array): string {
  if (typeof Buffer !== 'undefined') return Buffer.from(data).toString('base64')
  let binary = ''
  for (const byte of data) binary += String.fromCharCode(byte)
  return btoa(binary)
}

async function hashPassword(plain: string): Promise<string> {
  const salt = new Uint8Array(16)
  crypto.getRandomValues(salt)
  const derived = scrypt(new TextEncoder().encode(plain), salt, { N: 16384, r: 8, p: 1, dkLen: 64 })
  return `$scrypt$n=16384,r=8,p=1$${toBase64(salt)}$${toBase64(derived)}`
}

export async function seedTestDb() {
  const client = createClient({ url: `file:${DB_PATH}` })

  const schemaPath = resolve(__dirname, '../../db/migrations/schema.sql')
  const raw = readFileSync(schemaPath, 'utf-8')
  const statements = raw
    .split('\n')
    .filter(line => !line.startsWith('--') && !line.startsWith('-->'))
    .join('\n')
  client.executeMultiple(statements)

  for (const table of ['social_posts', 'social_queue', 'api_key_usage_logs', 'api_keys', 'quote_tags', 'quote_views', 'author_views', 'reference_views', 'user_likes', 'quotes', 'tags', 'quote_references', 'authors', 'users']) {
    client.execute(`DELETE FROM ${table}`)
  }

  const apiKey = 'vbt_testkey0000000000000000000000000000000000'
  const keyHash = hashKey(apiKey)
  const writeKey = 'vbt_writekey0000000000000000000000000000000000'
  const writeKeyHash = hashKey(writeKey)
  const noPermKey = 'vbt_nopermkey00000000000000000000000000000000'
  const noPermKeyHash = hashKey(noPermKey)
  const adminPw = await hashPassword('admin123!')

  client.executeMultiple(`
    INSERT INTO users (id, email, name, password, role, language) VALUES (1, 'test@verbatims.cc', 'Test User', '${adminPw}', 'admin', 'en');
    INSERT INTO api_keys (user_id, name, key_hash, key_prefix, permissions, read_rate_limit, read_window_sec, write_rate_limit, write_window_sec, is_active) VALUES (1, 'Test Key', '${keyHash}', 'vbt_testke', '["read"]', 1000, 3600, 1000, 3600, 1);
    INSERT INTO api_keys (user_id, name, key_hash, key_prefix, permissions, read_rate_limit, read_window_sec, write_rate_limit, write_window_sec, is_active) VALUES (1, 'Write Key', '${writeKeyHash}', 'vbt_writek', '["read","write:quotes","write:authors","write:references","write:collections"]', 1000, 3600, 1000, 3600, 1);
    INSERT INTO api_keys (user_id, name, key_hash, key_prefix, permissions, read_rate_limit, read_window_sec, write_rate_limit, write_window_sec, is_active) VALUES (1, 'No Perm Key', '${noPermKeyHash}', 'vbt_noperm', '["read"]', 1000, 3600, 1000, 3600, 1);

    INSERT INTO authors (id, name, is_fictional) VALUES (1, 'Marcus Aurelius', 0), (2, 'Albert Camus', 0), (3, 'Friedrich Nietzsche', 0);
    INSERT INTO quote_references (id, name, primary_type) VALUES (1, 'Meditations', 'book'), (2, 'The Stranger', 'book'), (3, 'Thus Spoke Zarathustra', 'book');
    INSERT INTO tags (id, name, color) VALUES (1, 'wisdom', '#3B82F6'), (2, 'philosophy', '#10B981'), (3, 'stoicism', '#F59E0B');

    INSERT INTO quotes (id, name, language, author_id, reference_id, user_id, status, likes_count, views_count) VALUES (1, 'The happiness of your life depends upon the quality of your thoughts.', 'en', 1, 1, 1, 'approved', 42, 100);
    INSERT INTO quotes (id, name, language, author_id, user_id, status) VALUES (2, 'In the midst of winter, I found there was, within me, an invincible summer.', 'en', 2, 1, 'approved');
    INSERT INTO quotes (id, name, language, author_id, user_id, status) VALUES (3, 'God is dead.', 'en', 3, 1, 'approved');
    INSERT INTO quotes (id, name, language, author_id, user_id, status) VALUES (4, 'La vraie générosité envers l''avenir consiste à tout donner au présent.', 'fr', 2, 1, 'approved');
    INSERT INTO quotes (id, name, language, user_id, status) VALUES (5, 'This is a draft quote not yet approved.', 'en', 1, 'draft');
    INSERT INTO quotes (id, name, language, author_id, user_id, status) VALUES (6, 'A pending quote awaiting moderation.', 'en', 1, 1, 'pending');
    INSERT INTO quotes (id, name, language, author_id, user_id, status) VALUES (7, 'Another pending quote.', 'en', 2, 1, 'pending');

    INSERT INTO quote_tags (quote_id, tag_id) VALUES (1, 1), (1, 2), (1, 3), (2, 2), (3, 2);

    INSERT INTO social_queue (id, quote_id, source_type, source_id, platform, status, position) VALUES (1, 1, 'quote', 1, 'bluesky', 'queued', 0);
    INSERT INTO social_queue (id, quote_id, source_type, source_id, platform, status, position) VALUES (2, 2, 'quote', 2, 'bluesky', 'queued', 1);
    INSERT INTO social_queue (id, quote_id, source_type, source_id, platform, status, position) VALUES (3, 3, 'quote', 3, 'bluesky', 'posted', 2);
  `)

  client.close()
  return { dbPath: DB_PATH, apiKey, writeKey, noPermKey }
}

if (process.argv[1] && process.argv[1].includes('seed-e2e')) {
  seedTestDb().then(({ dbPath, apiKey }) => {
    console.log(`Seeded: ${dbPath}`)
    console.log(`API Key: ${apiKey}`)
  })
}
