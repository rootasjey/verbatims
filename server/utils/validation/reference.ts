import { z } from 'zod'

// Align with schema.sql primary_type and language constraints
export const validPrimaryTypes = [
  'film', 'book', 'tv_series', 'music', 'speech', 'podcast', 'interview', 'documentary',
  'media_stream', 'writings', 'video_game', 'other'
] as const

export const validLanguages = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh'] as const

export const ReferenceSchema = z.object({
  name: z.string().min(2).max(200),
  original_language: z.enum(validLanguages).optional(),
  // Allow nulls coming from exports while keeping field optional
  release_date: z.string().nullable().optional(), // ISO date preferred; allow string/null and defer strictness to importer
  description: z.string().max(5000).nullable().optional(),
  // Historically some exports might miss primary_type; accept missing and default to 'other'
  primary_type: z.enum(validPrimaryTypes).default('other').optional(),
  secondary_type: z.string().max(100).optional(),
  image_url: z.string().url().nullable().optional(),
  urls: z
    .union([
      z.array(z.string().url()), // export array format
      z.record(z.string().optional()), // object map format
      z.string() // JSON string; importer parses to object/array
    ])
    .nullable()
    .optional(),
  views_count: z.number().int().nonnegative().nullable().optional(),
  likes_count: z.number().int().nonnegative().nullable().optional(),
  shares_count: z.number().int().nonnegative().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type ReferenceInput = z.infer<typeof ReferenceSchema>

export const ReferencesArraySchema = z.array(ReferenceSchema).nonempty({ message: 'At least one reference is required' })

export function validateReferenceDataZod(data: unknown): {
  isValid: boolean
  errors: string[]
  warnings: string[]
  errorCount: number
  warningCount: number
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Normalize to array where possible
  const arrayData = Array.isArray(data) ? data : [data]

  try {
    // Parse every item with schema but collect errors robustly
    const parsed = [] as ReferenceInput[]

    for (const [index, item] of arrayData.entries()) {
      try {
        parsed.push(ReferenceSchema.parse(item))
      } catch (e: any) {
        const issueLines = (e?.issues || []).map((iss: any) => `Reference ${index + 1}: ${iss.path?.join('.') || ''} ${iss.message}`)
        if (issueLines.length) errors.push(...issueLines)
        else errors.push(`Reference ${index + 1}: Invalid reference data`)
      }
    }

    // Lightweight cross-record checks (duplicate names)
    const seen = new Map<string, number>()
    parsed.forEach((ref, idx) => {
      const key = ref.name.toLowerCase().trim()
      if (seen.has(key)) {
        warnings.push(`Potential duplicate: "${ref.name}" (indices ${seen.get(key)} and ${idx})`)
      } else {
        seen.set(key, idx)
      }
    })

  } catch (e: any) {
    errors.push('Validation failed: ' + (e.message || 'unknown error'))
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    errorCount: errors.length,
    warningCount: warnings.length,
  }
}

