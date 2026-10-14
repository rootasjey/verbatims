import { describe, expect, it } from 'vitest'
import { themeManifestSchema } from '../theme-manifest'

const manifest = {
  schema_version: 1,
  slug: 'quiet-courage',
  name: 'Quiet Courage',
  description: 'A manually curated theme.',
  language: 'en',
  filters: [{ type: 'tag_name', value: 'courage' }],
}

describe('theme manifest', () => {
  it('accepts a versioned theme and applies a safe filter default', () => {
    expect(themeManifestSchema.parse(manifest)).toMatchObject({
      ...manifest,
      filters: [{ type: 'tag_name', value: 'courage', match_mode: 'any' }],
    })
    expect(themeManifestSchema.parse(manifest)).not.toHaveProperty('translations')
  })

  it('rejects invalid slugs and unsupported filter types', () => {
    expect(themeManifestSchema.safeParse({ ...manifest, slug: '../unsafe' }).success).toBe(false)
    expect(themeManifestSchema.safeParse({ ...manifest, filters: [{ type: 'generated', value: 'anything' }] }).success).toBe(false)
  })

  it('rejects unknown fields rather than silently dropping them', () => {
    expect(themeManifestSchema.safeParse({ ...manifest, activate: true }).success).toBe(false)
  })

  it('rejects duplicate filters and translation languages', () => {
    expect(themeManifestSchema.safeParse({
      ...manifest,
      filters: [{ type: 'tag_name', value: 'courage' }, { type: 'tag_name', value: 'Courage' }],
    }).success).toBe(false)
    expect(themeManifestSchema.safeParse({
      ...manifest,
      translations: [
        { language: 'fr', name: 'Courage tranquille' },
        { language: 'FR', name: 'Courage calme' },
      ],
    }).success).toBe(false)
  })

  it('accepts homepage copy in theme translations', () => {
    expect(themeManifestSchema.parse({
      ...manifest,
      translations: [{ language: 'en', name: 'Quiet Courage', home_copy: { title: 'Small acts' } }],
    }).translations?.[0]?.home_copy).toEqual({ title: 'Small acts' })
  })
})
