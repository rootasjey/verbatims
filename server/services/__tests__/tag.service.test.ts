import { vi, describe, it, expect, beforeEach } from 'vitest'
import { createTestDb } from '../../utils/__tests__/test-db'

let currentDb: ReturnType<typeof createTestDb>

vi.mock('hub:db', () => ({
  get db() { return currentDb.db },
  get schema() { return currentDb.schema },
}))

beforeEach(() => {
  currentDb = createTestDb()
})

describe('tag.service', () => {
  it('findTagById returns null for non-existent tag', async () => {
    const { findTagById } = await import('../tag.service')
    const result = await findTagById(999)
    expect(result).toBeUndefined()
  })

  it('createTag creates and findTagById retrieves a tag', async () => {
    const { createTag, findTagById } = await import('../tag.service')

    const tag = await createTag({ name: 'wisdom', color: '#3B82F6' })
    expect(tag.name).toBe('wisdom')

    const found = await findTagById(tag.id)
    expect(found).not.toBeNull()
    expect(found!.name).toBe('wisdom')
    expect(found!.color).toBe('#3B82F6')
  })

  it('findTagByName finds tag by name', async () => {
    const { createTag, findTagByName } = await import('../tag.service')

    await createTag({ name: 'philosophy' })
    const tag = await findTagByName('philosophy')
    expect(tag).not.toBeNull()
    expect(tag!.name).toBe('philosophy')
  })

  it('findTags returns paginated results', async () => {
    const { createTag, findTags } = await import('../tag.service')

    await createTag({ name: 'wisdom' })
    await createTag({ name: 'philosophy' })
    await createTag({ name: 'stoicism' })

    const result = await findTags({ page: 1, limit: 2 })

    expect(result.data).toHaveLength(2)
    expect(result.pagination.total).toBe(3)
    expect(result.pagination.hasMore).toBe(true)
  })

  it('findTags filters by search query', async () => {
    const { createTag, findTags } = await import('../tag.service')

    await createTag({ name: 'wisdom' })
    await createTag({ name: 'philosophy' })
    await createTag({ name: 'stoic-wisdom' })

    const result = await findTags({ search: 'wisdom' })

    expect(result.data).toHaveLength(2)
    expect(result.data.map(t => t.name)).toEqual(
      expect.arrayContaining(['wisdom', 'stoic-wisdom'])
    )
  })

  it('updateTag changes tag name and color', async () => {
    const { createTag, updateTag, findTagById } = await import('../tag.service')

    const tag = await createTag({ name: 'old-name' })
    await updateTag(tag.id, { name: 'new-name', color: '#10B981' })

    const updated = await findTagById(tag.id)
    expect(updated!.name).toBe('new-name')
    expect(updated!.color).toBe('#10B981')
  })

  it('deleteTag removes tag from database', async () => {
    const { createTag, deleteTag, findTagById } = await import('../tag.service')

    const tag = await createTag({ name: 'temporary' })
    await deleteTag(tag.id)

    const result = await findTagById(tag.id)
    expect(result).toBeUndefined()
  })
})
