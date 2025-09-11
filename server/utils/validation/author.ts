import { z } from 'zod'
import { validLanguages } from './reference'

export const AuthorSchema = z.object({
  name: z.string().min(2).max(200),
  is_fictional: z.boolean().optional(),
  birth_date: z.string().optional(),
  birth_location: z.string().optional(),
  death_date: z.string().optional(),
  death_location: z.string().optional(),
  job: z.string().optional(),
  description: z.string().max(5000).optional(),
  image_url: z.string().url().optional(),
  socials: z.union([z.array(z.any()), z.record(z.any()), z.string()]).optional(),
  views_count: z.number().int().nonnegative().optional(),
  likes_count: z.number().int().nonnegative().optional(),
  shares_count: z.number().int().nonnegative().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type AuthorInput = z.infer<typeof AuthorSchema>

export const AuthorsArraySchema = z.array(AuthorSchema).nonempty({ message: 'At least one author is required' })

export function validateAuthorDataZod(data: unknown): {
  isValid: boolean
  errors: string[]
  warnings: string[]
  errorCount: number
  warningCount: number
} {
  const errors: string[] = []
  const warnings: string[] = []

  const arrayData = Array.isArray(data) ? data : [data]

  const parsed: AuthorInput[] = []
  for (const [index, item] of arrayData.entries()) {
    try { parsed.push(AuthorSchema.parse(item)) }
    catch (e: any) {
      const issueLines = (e?.issues || []).map((iss: any) => `Author ${index + 1}: ${iss.path?.join('.') || ''} ${iss.message}`)
      if (issueLines.length) errors.push(...issueLines)
      else errors.push(`Author ${index + 1}: Invalid author data`)
    }
  }

  // Duplicate name warnings
  const seen = new Map<string, number>()
  parsed.forEach((a, idx) => {
    const key = (a.name || '').toLowerCase().trim()
    if (!key) return
    if (seen.has(key)) warnings.push(`Potential duplicate author: "${a.name}" (indices ${seen.get(key)} and ${idx})`)
    else seen.set(key, idx)
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    errorCount: errors.length,
    warningCount: warnings.length,
  }
}

