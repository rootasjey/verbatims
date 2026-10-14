import { z } from 'zod'

const themeLanguageSchema = z.enum(['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'la'])

export const themeManifestSchema = z.object({
  schema_version: z.literal(1),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).nullable().optional(),
  language: themeLanguageSchema.nullable().optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  config: z.record(z.string(), z.unknown()).nullable().optional(),
  translations: z.array(z.object({
    language: themeLanguageSchema,
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(1000).nullable().optional(),
    home_copy: z.record(z.string(), z.unknown()).nullable().optional(),
  }).strict()).max(20).optional(),
  filters: z.array(z.object({
    type: z.enum(['keyword', 'tag_name', 'author_name', 'reference_name', 'author_id', 'reference_id', 'language']),
    value: z.string().trim().min(1).max(200),
    match_mode: z.enum(['any', 'all']).default('any'),
  }).strict()).max(80),
}).strict().superRefine((manifest, context) => {
  const filterKeys = new Set<string>()
  for (const [index, filter] of manifest.filters.entries()) {
    const key = `${filter.type}:${filter.value.toLowerCase()}`
    if (filterKeys.has(key)) {
      context.addIssue({ code: 'custom', path: ['filters', index], message: 'Duplicate filter' })
    }
    filterKeys.add(key)
  }

  const languages = new Set<string>()
  for (const [index, translation] of (manifest.translations ?? []).entries()) {
    const language = translation.language.toLowerCase()
    if (languages.has(language)) {
      context.addIssue({ code: 'custom', path: ['translations', index, 'language'], message: 'Duplicate translation language' })
    }
    languages.add(language)
  }
})

export type ThemeManifestInput = z.input<typeof themeManifestSchema>
export type ThemeManifest = z.output<typeof themeManifestSchema>
