import { z } from 'zod'

export const validLanguages = [
  'en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'la', 'ar', 'ko',
] as const

const nullablePositiveInt = z.preprocess((val) => {
  if (val === null || val === undefined) return null
  const n = typeof val === 'number' ? val : Number(val)
  return Number.isFinite(n) && n > 0 ? n : null
}, z.number().int().positive().nullable())

const positiveInt = z.preprocess((val) => {
  const n = typeof val === 'number' ? val : Number(val)
  return Number.isFinite(n) && n > 0 ? n : undefined
}, z.number().int().positive())

const imageUrlField = z.string().refine(
  (val) => {
    if (val.startsWith('/blob/')) return true
    try { new URL(val); return true } catch { return false }
  },
  { message: 'Must be a valid URL or a /blob/ path' },
).optional().nullable()

const provenanceStatus = z.enum(['unverified', 'manually_verified', 'externally_verified', 'disputed'])

const quoteAttributionsPayloadSchema = z.array(z.object({
  author_id: nullablePositiveInt.optional().default(null),
  reference_id: nullablePositiveInt.optional().default(null),
  is_primary: z.boolean().optional().default(false),
  status: provenanceStatus.optional().default('unverified'),
  notes: z.string().max(5000).trim().optional().nullable(),
})).min(1).refine(
  attributions => attributions.filter(attribution => attribution.is_primary).length === 1,
  { message: 'A quote requires exactly one primary attribution' },
)

const attributionOrInlineEntity = (data: { attributions: Array<{ author_id: number | null, reference_id: number | null }>, new_author?: unknown, new_reference?: unknown }) =>
  data.attributions.every(attribution => attribution.author_id !== null || attribution.reference_id !== null)
    || !!data.new_author
    || !!data.new_reference

export const createQuoteSchema = z.object({
  name: z.string().min(2).max(4000).trim(),
  language: z.enum(validLanguages).optional(),
  attributions: quoteAttributionsPayloadSchema,
  new_author: z.object({
    name: z.string().min(1).max(200).trim(),
    is_fictional: z.boolean().optional().default(false),
    job: z.string().max(200).trim().optional().nullable(),
    description: z.string().max(5000).trim().optional().nullable(),
  }).optional(),
  new_reference: z.object({
    name: z.string().min(1).max(200).trim(),
    primary_type: z.string().min(1).max(100).trim().optional().default('other'),
    original_language: z.string().min(1).max(10).trim().optional().default('en'),
    description: z.string().max(5000).trim().optional().nullable(),
    release_date: z.string().max(50).trim().optional().nullable(),
  }).optional(),
  tags: z.array(z.union([z.number(), z.string()])).max(20).optional(),
}).strict().refine(attributionOrInlineEntity, { message: 'An attribution requires an author or reference' })

export const updateQuoteSchema = z.object({
  name: z.string().min(2).max(3000).trim().optional(),
  language: z.enum(validLanguages).optional(),
  source_type: z.string().max(100).trim().nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  attributions: quoteAttributionsPayloadSchema.optional(),
  new_author: z.object({
    name: z.string().min(1).max(200).trim(),
    is_fictional: z.boolean().optional().default(false),
  }).optional(),
  new_reference: z.object({
    name: z.string().min(1).max(200).trim(),
    primary_type: z.string().min(1).max(100).trim().optional().default('other'),
    original_language: z.string().min(1).max(10).trim().optional().default('en'),
  }).optional(),
}).strict().refine(
  data => !data.attributions || attributionOrInlineEntity({ ...data, attributions: data.attributions }),
  { message: 'An attribution requires an author or reference' },
)

export const createV1QuoteSchema = createQuoteSchema.strict()

export const updateV1QuoteSchema = updateQuoteSchema.strict()

const quoteAttributionFields = z.object({
  author_id: nullablePositiveInt.optional().default(null),
  reference_id: nullablePositiveInt.optional().default(null),
  is_primary: z.boolean().optional().default(false),
  status: provenanceStatus.optional().default('unverified'),
  notes: z.string().max(5000).trim().optional().nullable(),
})

export const createQuoteAttributionSchema = quoteAttributionFields.refine(
  data => data.author_id !== null || data.reference_id !== null,
  { message: 'An attribution requires an author or reference' },
)

export const updateQuoteAttributionSchema = quoteAttributionFields.partial()

export const createQuoteSourceSchema = z.object({
  attribution_id: positiveInt,
  source_type: z.string().min(1).max(100).trim(),
  source_url: z.string().url().optional().nullable(),
  label: z.string().max(200).trim().optional().nullable(),
  verification_status: provenanceStatus.optional().default('unverified'),
  notes: z.string().max(5000).trim().optional().nullable(),
  is_primary: z.boolean().optional().default(false),
})

export const updateQuoteSourceSchema = createQuoteSourceSchema.partial()

export const moderateQuoteSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejection_reason: z.string().max(2000).trim().optional().nullable(),
})

export const createCollectionSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(500).trim().optional().nullable(),
  is_public: z.boolean().optional().default(true),
})

export const updateCollectionSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  description: z.string().max(500).trim().optional().nullable(),
  is_public: z.boolean().optional(),
})

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  bio: z.string().max(5000).trim().optional().nullable(),
})

export const createAuthorSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  is_fictional: z.boolean().optional().default(false),
  job: z.string().max(200).trim().optional().nullable(),
  description: z.string().max(5000).trim().optional().nullable(),
  birth_date: z.string().max(50).trim().optional().nullable(),
  birth_location: z.string().max(200).trim().optional().nullable(),
  death_date: z.string().max(50).trim().optional().nullable(),
  death_location: z.string().max(200).trim().optional().nullable(),
  image_url: imageUrlField,
  socials: z.record(z.string(), z.string()).optional().nullable(),
})

export const createReferenceSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  primary_type: z.string().min(1).max(100).trim(),
  secondary_type: z.string().max(100).trim().optional().nullable(),
  description: z.string().max(5000).trim().optional().nullable(),
  release_date: z.string().max(50).trim().optional().nullable(),
  original_language: z.enum(validLanguages).optional().nullable(),
  image_url: imageUrlField,
  urls: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const createTagSchema = z.object({
  name: z.string().min(1).max(120).trim(),
  color: z.string().regex(/^#?[0-9A-Fa-f]{3,8}$/, 'Invalid hex color').optional().nullable(),
  description: z.string().max(2000).trim().optional().nullable(),
  category: z.string().max(120).trim().optional().nullable(),
})

export const updateTagSchema = z.object({
  name: z.string().min(1).max(120).trim().optional(),
  color: z.string().regex(/^#?[0-9A-Fa-f]{3,8}$/, 'Invalid hex color').optional().nullable(),
  description: z.string().max(2000).trim().optional().nullable(),
  category: z.string().max(120).trim().optional().nullable(),
})

export const updateAuthorSchema = z.object({
  name: z.string().min(2).max(200).trim().optional(),
  is_fictional: z.boolean().optional(),
  job: z.string().max(200).trim().optional().nullable(),
  description: z.string().max(5000).trim().optional().nullable(),
  birth_date: z.string().max(50).trim().optional().nullable(),
  birth_location: z.string().max(200).trim().optional().nullable(),
  death_date: z.string().max(50).trim().optional().nullable(),
  death_location: z.string().max(200).trim().optional().nullable(),
  image_url: imageUrlField,
  socials: z.record(z.string(), z.string()).optional().nullable(),
})

export const updateReferenceSchema = z.object({
  name: z.string().min(2).max(200).trim().optional(),
  primary_type: z.string().min(1).max(100).trim().optional(),
  secondary_type: z.string().max(100).trim().optional().nullable(),
  description: z.string().max(5000).trim().optional().nullable(),
  release_date: z.string().max(50).trim().optional().nullable(),
  original_language: z.enum(validLanguages).optional().nullable(),
  image_url: imageUrlField,
  urls: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
})
