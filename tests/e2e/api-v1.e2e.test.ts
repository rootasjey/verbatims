import { describe, test, expect, beforeAll } from 'vitest'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'

const { seedTestDb } = await import('../../server/utils/__tests__/seed-e2e')
const testDb = await seedTestDb()

const apiKey = testDb.apiKey
const writeKey = testDb.writeKey
const noPermKey = testDb.noPermKey
const themeKey = testDb.themeKey
let adminCookie: string

process.env.TURSO_DATABASE_URL = `file:${testDb.dbPath}`
process.env.TURSO_AUTH_TOKEN = 'dummy'
process.env.NUXT_SESSION_PASSWORD = 'test-session-pw-32chars-1234567890abcdef'

await setup({
  server: true,
  setupTimeout: 120000,
  nuxtConfig: {
    nitro: { preset: 'node-server' },
    hub: { db: { dialect: 'sqlite', applyMigrationsDuringBuild: false, applyMigrationsDuringDev: false } },
  },
})

function headers() {
  return { headers: { Authorization: `Bearer ${apiKey}` } }
}

function adminHeaders() {
  return { headers: { cookie: adminCookie } }
}

function writeHeaders() {
  return { headers: { Authorization: `Bearer ${writeKey}` } }
}

function noPermHeaders() {
  return { headers: { Authorization: `Bearer ${noPermKey}` } }
}

function themeHeaders() {
  return { headers: { Authorization: `Bearer ${themeKey}` } }
}

// ── Auth ──

describe('POST /api/auth/login', () => {
  test('logs in as admin', async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@verbatims.cc', password: 'admin123!' }),
    })
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.user.role).toBe('admin')

    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toBeTruthy()
    adminCookie = setCookie!
  })

  test('rejects wrong password', async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@verbatims.cc', password: 'wrongpass' }),
    })
    expect(res.status).toBe(401)
  })
})

// ── Admin ──

describe('Admin routes', () => {
  test('GET /api/admin/stats returns dashboard stats', async () => {
    const res = await $fetch('/api/admin/stats', adminHeaders())
    expect(res.success).toBe(true)
    expect(res.data.quotes.total).toBeGreaterThanOrEqual(5)
    expect(res.data.authors.total).toBeGreaterThanOrEqual(3)
  })

  test('GET /api/admin/quotes/pending returns pending quotes', async () => {
    const res = await $fetch('/api/admin/quotes/pending', adminHeaders())
    expect(res.success).toBe(true)
    expect(res.data.length).toBeGreaterThanOrEqual(2)
  })

  test('POST /api/admin/quotes/6/moderate approves pending quote', async () => {
    const res = await $fetch('/api/admin/quotes/6/moderate', {
      ...adminHeaders(),
      method: 'POST',
      body: { action: 'approve' },
    })
    expect(res.success).toBe(true)
    expect(res.data.quote.status).toBe('approved')
  })

  test('POST /api/admin/quotes/7/moderate rejects pending quote', async () => {
    const res = await $fetch('/api/admin/quotes/7/moderate', {
      ...adminHeaders(),
      method: 'POST',
      body: { action: 'reject', rejection_reason: 'Duplicate' },
    })
    expect(res.success).toBe(true)
    expect(res.data.quote.status).toBe('rejected')
    expect(res.data.quote.rejection_reason).toBe('Duplicate')
  })

  test('POST /api/admin/tags creates a new tag', async () => {
    const res = await $fetch('/api/admin/tags', {
      ...adminHeaders(),
      method: 'POST',
      body: { name: 'test-tag-admin', color: '#FF0000' },
    })
    expect(res.success).toBe(true)
    expect(res.data.name).toBe('test-tag-admin')
  })

  test('POST /api/admin/tags rejects non-admin', async () => {
    const res = await fetch('/api/admin/tags', {
      ...headers(),
      method: 'POST',
      body: { name: 'should-not-work', color: '#000' },
    })
    expect(res.status).toBe(401)
  })

  test('POST /api/admin/authors creates a new author', async () => {
    const res = await $fetch('/api/admin/authors', {
      ...adminHeaders(),
      method: 'POST',
      body: { name: 'Seneca', is_fictional: false },
    })
    expect(res.success).toBe(true)
    expect(res.data.name).toBe('Seneca')
  })

  test('PUT /api/admin/authors/1 updates an author', async () => {
    const res = await $fetch('/api/admin/authors/1', {
      ...adminHeaders(),
      method: 'PUT',
      body: { name: 'Marcus Aurelius (Emperor)', job: 'Roman Emperor' },
    })
    expect(res.success).toBe(true)
    expect(res.data.job).toBe('Roman Emperor')
  })

  test('POST /api/admin/references creates a new reference', async () => {
    const res = await $fetch('/api/admin/references', {
      ...adminHeaders(),
      method: 'POST',
      body: { name: 'Letters from a Stoic', primary_type: 'book' },
    })
    expect(res.success).toBe(true)
    expect(res.data.name).toBe('Letters from a Stoic')
  })

  test('DELETE /api/admin/tags/3 deletes a tag', async () => {
    const res = await $fetch('/api/admin/tags/3', {
      ...adminHeaders(),
      method: 'DELETE',
    })
    expect(res.success).toBe(true)
    expect(res.data.deleted).toBe(true)
  })

  test('DELETE /api/admin/authors/3 deletes author with anonymize', async () => {
    const res = await $fetch('/api/admin/authors/3', {
      ...adminHeaders(),
      method: 'DELETE',
      body: { strategy: 'anonymize' },
    })
    expect(res.success).toBe(true)
    expect(res.data.quotesAffected).toBeGreaterThanOrEqual(1)
  })

  test('GET /api/admin/users returns paginated users', async () => {
    const res = await $fetch('/api/admin/users', adminHeaders())
    expect(res.success).toBe(true)
    expect(res.data.length).toBeGreaterThanOrEqual(1)
    expect(res.pagination.total).toBeGreaterThanOrEqual(1)
    expect(res.data[0]).toHaveProperty('name')
    expect(res.data[0]).toHaveProperty('role')
  })

  test('GET /api/admin/settings returns settings', async () => {
    const res = await $fetch('/api/admin/settings', adminHeaders())
    expect(res.success).toBe(true)
    expect(typeof res.data).toBe('object')
  })

  test('DELETE /api/quotes/5 deletes a draft quote as admin', async () => {
    const res = await $fetch('/api/quotes/5', {
      ...adminHeaders(),
      method: 'DELETE',
    })
    expect(res.success).toBe(true)

    const check = await $fetch('/api/admin/quotes/list', adminHeaders())
    expect(check.data.find((q: any) => q.id === 5)).toBeUndefined()
  })
})

// ── API v1 (unchanged) ──

describe('GET /api/v1/me', () => {
  test('returns API key info', async () => {
    const res = await $fetch('/api/v1/me', headers())
    expect(res.success).toBe(true)
    expect(res.data.key_id).toBeGreaterThan(0)
    expect(res.data.name).toBe('Test Key')
  })
})

describe('GET /api/v1/tags', () => {
  test('returns tags list', async () => {
    const res = await $fetch('/api/v1/tags', headers())
    expect(res.success).toBe(true)
    expect(res.data.length).toBeGreaterThanOrEqual(3)
    expect(res.data[0]).toHaveProperty('name')
    expect(res.data[0]).toHaveProperty('color')
  })
})

describe('GET /api/v1/quotes', () => {
  test('returns paginated quotes', async () => {
    const res = await $fetch('/api/v1/quotes', headers())
    expect(res.success).toBe(true)
    expect(res.data.length).toBeGreaterThanOrEqual(4)
    expect(res.pagination.total).toBeGreaterThanOrEqual(4)
    expect(res.data[0]).toHaveProperty('content')
    expect(res.data[0]).toHaveProperty('author')
    expect(res.data[0]).toHaveProperty('tags')
  })

  test('filters by language', async () => {
    const res = await $fetch('/api/v1/quotes?language=fr', headers())
    expect(res.data).toHaveLength(1)
    expect(res.data[0].language).toBe('fr')
  })

  test('filters by author_id', async () => {
    const res = await $fetch('/api/v1/quotes?author_id=2', headers())
    expect(res.data).toHaveLength(2)
    expect(res.data.every((q: any) => q.author?.id === 2)).toBe(true)
  })

  test('respects page and limit', async () => {
    const res = await $fetch('/api/v1/quotes?page=1&limit=2', headers())
    expect(res.data).toHaveLength(2)
    expect(res.pagination.hasMore).toBe(true)
  })
})

describe('GET /api/v1/quotes/[id]', () => {
  test('returns single quote with tags', async () => {
    const res = await $fetch('/api/v1/quotes/1', headers())
    expect(res.success).toBe(true)
    expect(res.data.content).toContain('happiness')
    expect(res.data.tags.length).toBeGreaterThanOrEqual(1)
    expect(res.data.author.name).toContain('Marcus Aurelius')
    expect(res.data.reference.name).toBe('Meditations')
  })

  test('returns 404 for non-existent quote', async () => {
    const res = await fetch('/api/v1/quotes/999', headers())
    expect(res.status).toBe(404)
  })

  test('returns 404 for draft quote', async () => {
    const res = await fetch('/api/v1/quotes/5', headers())
    expect(res.status).toBe(404)
  })
})

describe('GET /api/v1/authors', () => {
  test('returns paginated authors', async () => {
    const res = await $fetch('/api/v1/authors', headers())
    expect(res.success).toBe(true)
    expect(res.data.length).toBeGreaterThanOrEqual(3)
    expect(res.data[0]).toHaveProperty('name')
    expect(res.data[0]).toHaveProperty('stats')
  })

  test('filters by search', async () => {
    const res = await $fetch('/api/v1/authors?search=camus', headers())
    expect(res.data).toHaveLength(1)
    expect(res.data[0].name).toBe('Albert Camus')
  })
})

describe('GET /api/v1/authors/[id]', () => {
  test('returns single author', async () => {
    const res = await $fetch('/api/v1/authors/1', headers())
    expect(res.success).toBe(true)
    expect(res.data.name).toContain('Marcus Aurelius')
    expect(res.data.fictional).toBe(false)
  })

  test('returns 404 for non-existent author', async () => {
    const res = await fetch('/api/v1/authors/999', headers())
    expect(res.status).toBe(404)
  })
})

describe('GET /api/v1/references', () => {
  test('returns paginated references', async () => {
    const res = await $fetch('/api/v1/references', headers())
    expect(res.success).toBe(true)
    expect(res.data.length).toBeGreaterThanOrEqual(3)
    expect(res.data[0]).toHaveProperty('type')
  })
})

describe('GET /api/v1/references/[id]', () => {
  test('returns single reference', async () => {
    const res = await $fetch('/api/v1/references/1', headers())
    expect(res.success).toBe(true)
    expect(res.data.name).toBe('Meditations')
    expect(res.data.type).toBe('book')
  })

  test('returns 404 for non-existent reference', async () => {
    const res = await fetch('/api/v1/references/999', headers())
    expect(res.status).toBe(404)
  })
})

describe('GET /api/v1/random', () => {
  test('returns random quotes', async () => {
    const res = await $fetch('/api/v1/random?limit=2', headers())
    expect(res.success).toBe(true)
    expect(res.data).toHaveLength(2)
    expect(res.data[0]).toHaveProperty('content')
  })
})

describe('GET /api/v1/search', () => {
  test('returns 400 without query', async () => {
    const res = await fetch('/api/v1/search', headers())
    expect(res.status).toBe(400)
  })

  test('returns 400 for short query', async () => {
    const res = await fetch('/api/v1/search?q=x', headers())
    expect(res.status).toBe(400)
  })

  test('searches quotes by text', async () => {
    const res = await $fetch('/api/v1/search?q=happiness', headers())
    expect(res.success).toBe(true)
    expect(res.data).toHaveLength(1)
    expect(res.data[0].content).toContain('happiness')
  })

  test('searches quotes by author name', async () => {
    const res = await $fetch('/api/v1/search?q=camus', headers())
    expect(res.success).toBe(true)
    expect(res.data.length).toBeGreaterThanOrEqual(1)
  })

  test('searches authors by type', async () => {
    const res = await $fetch('/api/v1/search?q=marcus&type=authors', headers())
    expect(res.success).toBe(true)
    expect(res.data[0].type).toBe('author')
  })

  test('searches references by type', async () => {
    const res = await $fetch('/api/v1/search?q=medit&type=references', headers())
    expect(res.success).toBe(true)
    expect(res.data[0].entity_type).toBe('reference')
  })
})

describe('GET /api/admin/social-queue', () => {
  test('returns queue items with correct response shape', async () => {
    const res = await $fetch('/api/admin/social-queue?platform=bluesky', adminHeaders())
    expect(res.success).toBe(true)
    expect(res.data).toBeTypeOf('object')
    expect(Array.isArray(res.data.queue)).toBe(true)
    expect(res.data.queue.length).toBeGreaterThanOrEqual(2)
    for (const item of res.data.queue) {
      expect(item.id).toBeTypeOf('number')
      expect(item.position).toBeTypeOf('number')
      expect(item.status).toBeTypeOf('string')
    }
    expect(res.data.stats).toBeTypeOf('object')
    expect(res.data.stats).toHaveProperty('queued')
    expect(res.data.stats).toHaveProperty('posted')
    expect(res.pagination).toBeTypeOf('object')
    expect(res.pagination.total).toBe(3)
  })
})

// ── V1 Write Endpoints ──

describe('POST /api/v1/quotes', () => {
  const quoteBody = { name: 'Test quote from E2E test.', language: 'en' }

  test('creates a quote as draft', async () => {
    const res = await $fetch('/api/v1/quotes', {
      ...writeHeaders(),
      method: 'POST',
      body: quoteBody,
    })
    expect(res.success).toBe(true)
    expect(res.data.content).toBe('Test quote from E2E test.')
    expect(res.data.language).toBe('en')
    expect(res.data.tags).toEqual([])
    expect(res.message).toContain('created as draft')
  })

  test('returns 400 with missing name', async () => {
    const res = await fetch('/api/v1/quotes', {
      ...writeHeaders(),
      method: 'POST',
      headers: { ...writeHeaders().headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'fr' }),
    })
    expect(res.status).toBe(400)
  })

  test('returns 409 for duplicate quote', async () => {
    const res = await fetch('/api/v1/quotes', {
      ...writeHeaders(),
      method: 'POST',
      headers: { ...writeHeaders().headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test quote from E2E test.', language: 'en' }),
    })
    expect(res.status).toBe(409)
  })

  test('returns 403 for read-only API key', async () => {
    const res = await fetch('/api/v1/quotes', {
      ...noPermHeaders(),
      method: 'POST',
      headers: { ...noPermHeaders().headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Should not work.', language: 'en' }),
    })
    expect(res.status).toBe(403)
  })

  test('returns 401 without auth', async () => {
    const res = await fetch('/api/v1/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quoteBody),
    })
    expect(res.status).toBe(401)
  })

  test('creates quote with author and reference IDs', async () => {
    const res = await $fetch('/api/v1/quotes', {
      ...writeHeaders(),
      method: 'POST',
      body: { name: 'Quote with author ref.', language: 'en', author_id: 1, reference_id: 1 },
    })
    expect(res.success).toBe(true)
    expect(res.data.author?.id).toBe(1)
    expect(res.data.reference?.id).toBe(1)
  })

  test('creates quote with inline new_author', async () => {
    const res = await $fetch('/api/v1/quotes', {
      ...writeHeaders(),
      method: 'POST',
      body: { name: 'Quote with new author.', language: 'en', new_author: { name: 'Epictetus' } },
    })
    expect(res.success).toBe(true)
    expect(res.data.author?.name).toBe('Epictetus')
  })
})

describe('PUT /api/v1/quotes/[id]', () => {
  test('updates a quote', async () => {
    const created = await $fetch('/api/v1/quotes', {
      ...writeHeaders(),
      method: 'POST',
      body: { name: 'Quote to update.', language: 'en' },
    })
    const res = await $fetch(`/api/v1/quotes/${created.data.id}`, {
      ...writeHeaders(),
      method: 'PUT',
      body: { name: 'Updated quote content!' },
    })
    expect(res.success).toBe(true)
    expect(res.data.content).toBe('Updated quote content!')
  })

  test('returns 404 for non-existent quote', async () => {
    const res = await fetch('/api/v1/quotes/99999', {
      ...writeHeaders(),
      method: 'PUT',
      headers: { ...writeHeaders().headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Nope.' }),
    })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/v1/quotes/[id]', () => {
  test('deletes own quote', async () => {
    const created = await $fetch('/api/v1/quotes', {
      ...writeHeaders(),
      method: 'POST',
      body: { name: 'Quote to delete.', language: 'en' },
    })
    const res = await $fetch(`/api/v1/quotes/${created.data.id}`, {
      ...writeHeaders(),
      method: 'DELETE',
    })
    expect(res.success).toBe(true)
    expect(res.message).toContain('deleted')
  })

  test('returns 404 for already deleted quote', async () => {
    const created = await $fetch('/api/v1/quotes', {
      ...writeHeaders(),
      method: 'POST',
      body: { name: 'Another to delete.', language: 'en' },
    })
    await $fetch(`/api/v1/quotes/${created.data.id}`, {
      ...writeHeaders(),
      method: 'DELETE',
    })
    const res = await fetch(`/api/v1/quotes/${created.data.id}`, {
      ...writeHeaders(),
      method: 'DELETE',
    })
    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/authors', () => {
  test('creates an author (admin key)', async () => {
    const res = await $fetch('/api/v1/authors', {
      ...writeHeaders(),
      method: 'POST',
      body: { name: 'Seneca the Younger' },
    })
    expect(res.success).toBe(true)
    expect(res.data.name).toBe('Seneca the Younger')
    expect(res.data.fictional).toBe(false)
  })

  test('returns 409 for duplicate name', async () => {
    const res = await fetch('/api/v1/authors', {
      ...writeHeaders(),
      method: 'POST',
      headers: { ...writeHeaders().headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Albert Camus' }),
    })
    expect(res.status).toBe(409)
  })

  test('returns 400 with missing name', async () => {
    const res = await fetch('/api/v1/authors', {
      ...writeHeaders(),
      method: 'POST',
      headers: { ...writeHeaders().headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_fictional: true }),
    })
    expect(res.status).toBe(400)
  })
})

describe('PUT /api/v1/authors/[id]', () => {
  test('updates an author', async () => {
    const created = await $fetch('/api/v1/authors', {
      ...writeHeaders(),
      method: 'POST',
      body: { name: 'Author to update' },
    })
    const res = await $fetch(`/api/v1/authors/${created.data.id}`, {
      ...writeHeaders(),
      method: 'PUT',
      body: { name: 'Updated Author', job: 'Philosopher' },
    })
    expect(res.success).toBe(true)
    expect(res.data.name).toBe('Updated Author')
    expect(res.data.job).toBe('Philosopher')
  })

  test('returns 404 for non-existent author', async () => {
    const res = await fetch('/api/v1/authors/99999', {
      ...writeHeaders(),
      method: 'PUT',
      headers: { ...writeHeaders().headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Nope' }),
    })
    expect(res.status).toBe(404)
  })

  test('returns 409 for duplicate name', async () => {
    const res = await fetch('/api/v1/authors/1', {
      ...writeHeaders(),
      method: 'PUT',
      headers: { ...writeHeaders().headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Albert Camus' }),
    })
    expect(res.status).toBe(409)
  })

  test('returns 403 for read-only API key', async () => {
    const res = await fetch('/api/v1/authors/1', {
      ...noPermHeaders(),
      method: 'PUT',
      headers: { ...noPermHeaders().headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Should not work' }),
    })
    expect(res.status).toBe(403)
  })
})

describe('PUT /api/v1/references/[id]', () => {
  test('updates a reference', async () => {
    const created = await $fetch('/api/v1/references', {
      ...writeHeaders(),
      method: 'POST',
      body: { name: 'Reference to update', primary_type: 'book' },
    })
    const res = await $fetch(`/api/v1/references/${created.data.id}`, {
      ...writeHeaders(),
      method: 'PUT',
      body: { name: 'Updated Reference', description: 'A great book' },
    })
    expect(res.success).toBe(true)
    expect(res.data.name).toBe('Updated Reference')
    expect(res.data.description).toBe('A great book')
  })

  test('returns 404 for non-existent reference', async () => {
    const res = await fetch('/api/v1/references/99999', {
      ...writeHeaders(),
      method: 'PUT',
      headers: { ...writeHeaders().headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Nope' }),
    })
    expect(res.status).toBe(404)
  })

  test('returns 409 for duplicate name', async () => {
    const res = await fetch('/api/v1/references/2', {
      ...writeHeaders(),
      method: 'PUT',
      headers: { ...writeHeaders().headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Meditations' }),
    })
    expect(res.status).toBe(409)
  })

  test('returns 403 for read-only API key', async () => {
    const res = await fetch('/api/v1/references/1', {
      ...noPermHeaders(),
      method: 'PUT',
      headers: { ...noPermHeaders().headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Should not work' }),
    })
    expect(res.status).toBe(403)
  })
})

describe('POST /api/v1/references', () => {
  test('creates a reference (admin key)', async () => {
    const res = await $fetch('/api/v1/references', {
      ...writeHeaders(),
      method: 'POST',
      body: { name: 'On the Shortness of Life', primary_type: 'book' },
    })
    expect(res.success).toBe(true)
    expect(res.data.name).toBe('On the Shortness of Life')
    expect(res.data.type).toBe('book')
  })

  test('returns 409 for duplicate name', async () => {
    const res = await fetch('/api/v1/references', {
      ...writeHeaders(),
      method: 'POST',
      headers: { ...writeHeaders().headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Meditations', primary_type: 'book' }),
    })
    expect(res.status).toBe(409)
  })
})

// ── V1 Theme Endpoints ──

describe('GET /api/v1/themes', () => {
  test('lists themes (empty)', async () => {
    const res = await $fetch('/api/v1/themes', themeHeaders())
    expect(res.success).toBe(true)
    expect(res.data).toEqual([])
    expect(res.pagination.total).toBe(0)
  })

  test('returns 403 with read-only key', async () => {
    const res = await fetch('/api/v1/themes', noPermHeaders())
    expect(res.status).toBe(403)
  })

  test('returns 401 without auth', async () => {
    const res = await fetch('/api/v1/themes')
    expect(res.status).toBe(401)
  })
})

describe('POST /api/v1/themes', () => {
  const themeSlug = `test-theme-${Date.now()}`
  let createdId: number

  test('creates a theme', async () => {
    const res = await $fetch('/api/v1/themes', {
      ...themeHeaders(),
      method: 'POST',
      body: {
        slug: themeSlug,
        name: 'Test Theme',
        description: 'A test theme for E2E.',
        language: 'en',
        priority: 10,
      },
    })
    expect(res.success).toBe(true)
    expect(res.data.slug).toBe(themeSlug)
    expect(res.data.name).toBe('Test Theme')
    expect(res.data.priority).toBe(10)
    createdId = res.data.id
  })

  test('returns 409 for duplicate slug', async () => {
    const res = await fetch('/api/v1/themes', {
      ...themeHeaders(),
      method: 'POST',
      headers: { ...themeHeaders().headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: themeSlug, name: 'Duplicate' }),
    })
    expect(res.status).toBe(409)
  })

  test('returns 400 without slug', async () => {
    const res = await fetch('/api/v1/themes', {
      ...themeHeaders(),
      method: 'POST',
      headers: { ...themeHeaders().headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'No Slug' }),
    })
    expect(res.status).toBe(400)
  })

  test('lists themes (one item)', async () => {
    const res = await $fetch('/api/v1/themes', themeHeaders())
    expect(res.data).toHaveLength(1)
    expect(res.data[0].slug).toBe(themeSlug)
    expect(res.pagination.total).toBe(1)
  })
})

describe('GET /api/v1/themes/[id]', () => {
  let themeId: number

  test('returns theme with filters and translations', async () => {
    const slug = `get-test-${Date.now()}`
    const created = await $fetch('/api/v1/themes', {
      ...themeHeaders(),
      method: 'POST',
      body: { slug, name: 'Get Test' },
    })
    themeId = created.data.id
    const res = await $fetch(`/api/v1/themes/${themeId}`, themeHeaders())
    expect(res.success).toBe(true)
    expect(res.data.id).toBe(themeId)
    expect(res.data.filters).toEqual([])
    expect(res.data.translations).toEqual([])
  })

  test('returns 404 for non-existent theme', async () => {
    const res = await fetch('/api/v1/themes/99999', themeHeaders())
    expect(res.status).toBe(404)
  })

  test('returns 400 for invalid ID', async () => {
    const res = await fetch('/api/v1/themes/abc', themeHeaders())
    expect(res.status).toBe(400)
  })
})

describe('PUT /api/v1/themes/[id]', () => {
  let themeId: number

  test('updates a theme', async () => {
    const slug = `put-test-${Date.now()}`
    const created = await $fetch('/api/v1/themes', {
      ...themeHeaders(),
      method: 'POST',
      body: { slug, name: 'Put Test' },
    })
    themeId = created.data.id
    const res = await $fetch(`/api/v1/themes/${themeId}`, {
      ...themeHeaders(),
      method: 'PUT',
      body: { name: 'Updated Name', priority: 5 },
    })
    expect(res.success).toBe(true)
    expect(res.data.name).toBe('Updated Name')
  })

  test('returns 404 for non-existent theme', async () => {
    const res = await fetch('/api/v1/themes/99999', {
      ...themeHeaders(),
      method: 'PUT',
      headers: { ...themeHeaders().headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Nope' }),
    })
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/v1/themes/[id]/activate', () => {
  let themeId: number

  test('activates a theme', async () => {
    const slug = `activate-test-${Date.now()}`
    const created = await $fetch('/api/v1/themes', {
      ...themeHeaders(),
      method: 'POST',
      body: { slug, name: 'Activate Test' },
    })
    themeId = created.data.id
    const res = await $fetch(`/api/v1/themes/${themeId}/activate`, {
      ...themeHeaders(),
      method: 'PUT',
      body: { is_active: true },
    })
    expect(res.success).toBe(true)
    expect(res.data.is_active).toBe(true)
  })

  test('deactivates a theme', async () => {
    const res = await $fetch(`/api/v1/themes/${themeId}/activate`, {
      ...themeHeaders(),
      method: 'PUT',
      body: { is_active: false },
    })
    expect(res.data.is_active).toBe(false)
  })
})

describe('PUT /api/v1/themes/[id]/default', () => {
  test('sets a theme as default', async () => {
    const slug = `default-test-${Date.now()}`
    const created = await $fetch('/api/v1/themes', {
      ...themeHeaders(),
      method: 'POST',
      body: { slug, name: 'Default Test' },
    })
    const res = await $fetch(`/api/v1/themes/${created.data.id}/default`, {
      ...themeHeaders(),
      method: 'PUT',
      body: { is_default: true },
    })
    expect(res.success).toBe(true)
    expect(res.data.is_default).toBe(true)
  })
})

describe('POST /api/v1/themes/[id]/filters', () => {
  let themeId: number

  test('adds a tag_name filter', async () => {
    const slug = `filter-test-${Date.now()}`
    const created = await $fetch('/api/v1/themes', {
      ...themeHeaders(),
      method: 'POST',
      body: { slug, name: 'Filter Test' },
    })
    themeId = created.data.id
    const res = await $fetch(`/api/v1/themes/${themeId}/filters`, {
      ...themeHeaders(),
      method: 'POST',
      body: { type: 'tag_name', value: 'wisdom' },
    })
    expect(res.success).toBe(true)
    expect(res.data.type).toBe('tag_name')
    expect(res.data.value).toBe('wisdom')
  })

  test('adds a keyword filter', async () => {
    const res = await $fetch(`/api/v1/themes/${themeId}/filters`, {
      ...themeHeaders(),
      method: 'POST',
      body: { type: 'keyword', value: 'life' },
    })
    expect(res.success).toBe(true)
    expect(res.data.type).toBe('keyword')
  })

  test('returns 400 for invalid filter type', async () => {
    const res = await fetch(`/api/v1/themes/${themeId}/filters`, {
      ...themeHeaders(),
      method: 'POST',
      headers: { ...themeHeaders().headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'invalid_type', value: 'test' }),
    })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/v1/themes/[id]/filters/[fid]', () => {
  test('deletes a filter', async () => {
    const slug = `del-filter-${Date.now()}`
    const created = await $fetch('/api/v1/themes', {
      ...themeHeaders(),
      method: 'POST',
      body: { slug, name: 'Del Filter Test' },
    })
    const themeId = created.data.id
    await $fetch(`/api/v1/themes/${themeId}/filters`, {
      ...themeHeaders(),
      method: 'POST',
      body: { type: 'keyword', value: 'test-delete' },
    })
    const theme = await $fetch(`/api/v1/themes/${themeId}`, themeHeaders())
    const fid = theme.data.filters[0].id
    const res = await $fetch(`/api/v1/themes/${themeId}/filters/${fid}`, {
      ...themeHeaders(),
      method: 'DELETE',
    })
    expect(res.success).toBe(true)
    expect(res.data.deleted).toBe(true)
  })
})

describe('DELETE /api/v1/themes/[id]', () => {
  let themeId: number

  test('deletes a theme', async () => {
    const slug = `delete-test-${Date.now()}`
    const created = await $fetch('/api/v1/themes', {
      ...themeHeaders(),
      method: 'POST',
      body: { slug, name: 'Delete Test' },
    })
    themeId = created.data.id
    const res = await $fetch(`/api/v1/themes/${themeId}`, {
      ...themeHeaders(),
      method: 'DELETE',
    })
    expect(res.success).toBe(true)
    expect(res.data.deleted).toBe(true)
  })

  test('returns 404 for deleted theme', async () => {
    const res = await fetch(`/api/v1/themes/${themeId}`, themeHeaders())
    expect(res.status).toBe(404)
  })
})

describe('GET /api/v1/themes/[id]/suggestions', () => {
  test('returns suggestions list (empty)', async () => {
    const slug = `suggest-${Date.now()}`
    const created = await $fetch('/api/v1/themes', {
      ...themeHeaders(),
      method: 'POST',
      body: { slug, name: 'Suggest Test' },
    })
    const res = await $fetch(`/api/v1/themes/${created.data.id}/suggestions`, themeHeaders())
    expect(res.success).toBe(true)
    expect(res.data).toEqual([])
  })
})

describe('GET /api/v1/themes/filter-suggestions', () => {
  test('searches for tags', async () => {
    const res = await $fetch('/api/v1/themes/filter-suggestions?q=wis&type=tag_name', themeHeaders())
    expect(res.success).toBe(true)
    expect(res.data.length).toBeGreaterThanOrEqual(1)
    expect(res.data[0].value).toBe('wisdom')
  })

  test('returns empty for short query', async () => {
    const res = await $fetch('/api/v1/themes/filter-suggestions?q=&type=tag_name', themeHeaders())
    expect(res.data).toEqual([])
  })

  test('searches authors', async () => {
    const res = await $fetch('/api/v1/themes/filter-suggestions?q=marcus&type=author_name', themeHeaders())
    expect(res.success).toBe(true)
    expect(res.data[0].value).toContain('Marcus')
  })
})

describe('POST /api/v1/themes/filter-recommendations', () => {
  test('returns recommendations for tag filters', async () => {
    const res = await $fetch('/api/v1/themes/filter-recommendations', {
      ...themeHeaders(),
      method: 'POST',
      body: { name: 'Wisdom', filters: [{ type: 'tag_name', value: 'wisdom' }] },
    })
    expect(res.success).toBe(true)
    expect(Array.isArray(res.data)).toBe(true)
  })
})

describe('POST /api/v1/themes with scheduling', () => {
  test('creates a theme with scheduled dates', async () => {
    const slug = `sched-test-${Date.now()}`
    const res = await $fetch('/api/v1/themes', {
      ...themeHeaders(),
      method: 'POST',
      body: {
        slug,
        name: 'Scheduled Test',
        scheduled_start: '2026-08-01',
        scheduled_end: '2026-08-31',
      },
    })
    expect(res.success).toBe(true)
    const theme = await $fetch(`/api/v1/themes/${res.data.id}`, themeHeaders())
    expect(theme.success).toBe(true)
    expect(theme.data.scheduledStart).not.toBeNull()
    expect(theme.data.scheduledEnd).not.toBeNull()
    const sStart = new Date(theme.data.scheduledStart)
    const sEnd = new Date(theme.data.scheduledEnd)
    expect(sStart.getTime()).not.toBeNaN()
    expect(sStart.getUTCFullYear()).toBe(2026)
    expect(sStart.getUTCMonth()).toBe(7)
    expect(sEnd.getTime()).not.toBeNaN()
    expect(sEnd.getUTCFullYear()).toBe(2026)
    expect(sEnd.getUTCMonth()).toBe(7)
  })
})

describe('GET /api/v1/themes/[id]/feed', () => {
  test('returns feed for a theme', async () => {
    const slug = `feed-test-${Date.now()}`
    const created = await $fetch('/api/v1/themes', {
      ...themeHeaders(),
      method: 'POST',
      body: { slug, name: 'Feed Test' },
    })
    const themeId = created.data.id
    await $fetch(`/api/v1/themes/${themeId}/filters`, {
      ...themeHeaders(),
      method: 'POST',
      body: { type: 'tag_name', value: 'wisdom' },
    })
    const res = await $fetch(`/api/v1/themes/${themeId}/feed`, themeHeaders())
    expect(res.success).toBe(true)
    expect(res.data).toHaveProperty('theme')
    expect(res.data).toHaveProperty('quotes')
    expect(res.data).toHaveProperty('authors')
    expect(res.data).toHaveProperty('references')
    expect(res.data).toHaveProperty('total')
  })

  test('returns 404 for non-existent theme', async () => {
    const res = await fetch('/api/v1/themes/99999/feed', themeHeaders())
    expect(res.status).toBe(404)
  })
})

describe('GET /api/v1/themes/[id]/filters', () => {
  test('lists filters for a theme', async () => {
    const slug = `filters-get-${Date.now()}`
    const created = await $fetch('/api/v1/themes', {
      ...themeHeaders(),
      method: 'POST',
      body: { slug, name: 'Filters Get Test' },
    })
    const themeId = created.data.id
    await $fetch(`/api/v1/themes/${themeId}/filters`, {
      ...themeHeaders(),
      method: 'POST',
      body: { type: 'keyword', value: 'life' },
    })
    const res = await $fetch(`/api/v1/themes/${themeId}/filters`, themeHeaders())
    expect(res.success).toBe(true)
    expect(res.data).toHaveLength(1)
    expect(res.data[0].type).toBe('keyword')
    expect(res.data[0].value).toBe('life')
  })

  test('returns empty array when no filters', async () => {
    const slug = `filters-empty-${Date.now()}`
    const created = await $fetch('/api/v1/themes', {
      ...themeHeaders(),
      method: 'POST',
      body: { slug, name: 'Filters Empty' },
    })
    const res = await $fetch(`/api/v1/themes/${created.data.id}/filters`, themeHeaders())
    expect(res.data).toEqual([])
  })

  test('returns 404 for non-existent theme', async () => {
    const res = await fetch('/api/v1/themes/99999/filters', themeHeaders())
    expect(res.status).toBe(404)
  })
})

describe('GET /api/v1/quotes/[id]/tags', () => {
  test('returns tags for a quote', async () => {
    const res = await $fetch('/api/v1/quotes/1/tags', writeHeaders())
    expect(res.success).toBe(true)
    expect(res.data.length).toBeGreaterThanOrEqual(2)
    const names = res.data.map((t: any) => t.name)
    expect(names).toContain('wisdom')
    expect(names).toContain('philosophy')
  })

  test('returns empty array for quote with no tags', async () => {
    const res = await $fetch('/api/v1/quotes/4/tags', writeHeaders())
    expect(res.success).toBe(true)
    expect(res.data).toEqual([])
  })

  test('returns 404 for non-existent quote', async () => {
    const res = await fetch('/api/v1/quotes/99999/tags', writeHeaders())
    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/quotes/[id]/tags', () => {
  let draftId: number

  test('adds a tag by ID to own draft', async () => {
    const created = await $fetch('/api/v1/quotes', {
      ...writeHeaders(),
      method: 'POST',
      body: { name: 'Draft for tag test' },
    })
    draftId = created.data.id
    const res = await $fetch(`/api/v1/quotes/${draftId}/tags`, {
      ...writeHeaders(),
      method: 'POST',
      body: { tagId: 1 },
    })
    expect(res.success).toBe(true)
    expect(res.data.id).toBe(1)
    const tags = await $fetch(`/api/v1/quotes/${draftId}/tags`, writeHeaders())
    const names = tags.data.map((t: any) => t.name)
    expect(names).toContain('wisdom')
  })

  test('returns 403 with read-only key', async () => {
    const res = await fetch(`/api/v1/quotes/${draftId}/tags`, {
      ...noPermHeaders(),
      method: 'POST',
      headers: { ...noPermHeaders().headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId: 1 }),
    })
    expect(res.status).toBe(403)
  })

  test('returns 400 without tagId or name', async () => {
    const res = await fetch(`/api/v1/quotes/${draftId}/tags`, {
      ...writeHeaders(),
      method: 'POST',
      headers: { ...writeHeaders().headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/v1/quotes/[id]/tags/[tagId]', () => {
  let draftId: number

  test('removes a tag from own draft', async () => {
    const created = await $fetch('/api/v1/quotes', {
      ...writeHeaders(),
      method: 'POST',
      body: { name: 'Draft for delete tag test' },
    })
    draftId = created.data.id
    await $fetch(`/api/v1/quotes/${draftId}/tags`, {
      ...writeHeaders(),
      method: 'POST',
      body: { tagId: 2 },
    })
    const res = await fetch(`/api/v1/quotes/${draftId}/tags/2`, {
      ...writeHeaders(),
      method: 'DELETE',
    })
    expect(res.status).toBe(200)
    const tags = await $fetch(`/api/v1/quotes/${draftId}/tags`, writeHeaders())
    const names = tags.data.map((t: any) => t.name)
    expect(names).not.toContain('philosophy')
  })

  test('returns 403 with read-only key', async () => {
    const res = await fetch(`/api/v1/quotes/${draftId}/tags/1`, {
      ...noPermHeaders(),
      method: 'DELETE',
    })
    expect(res.status).toBe(403)
  })
})

describe('Auth errors', () => {
  test('returns 401 without Authorization header', async () => {
    const res = await fetch('/api/v1/tags')
    expect(res.status).toBe(401)
  })

  test('returns 401 with invalid key', async () => {
    const res = await fetch('/api/v1/tags', {
      headers: { Authorization: 'Bearer vbt_invalid0000000000000000000000000000000' },
    })
    expect(res.status).toBe(401)
  })
})
