import { describe, test, expect, beforeAll } from 'vitest'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'

let apiKey: string
let adminCookie: string

beforeAll(async () => {
  const { seedTestDb } = await import('../../server/utils/__tests__/seed-e2e')
  const testDb = await seedTestDb()
  apiKey = testDb.apiKey
  process.env.TURSO_DATABASE_URL = `file:${testDb.dbPath}`
  process.env.TURSO_AUTH_TOKEN = 'dummy'
  process.env.NUXT_SESSION_PASSWORD = 'test-session-pw-32chars-1234567890abcdef'
})

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
