import type { z } from '~/types''zod'

export const TagSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  category: z.string().max(120).optional(),
  color: z.string().regex(/^#?[0-9A-Fa-f]{3,8}$/).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type TagInput = z.infer<typeof TagSchema>

export function validateTagDataZod(data: unknown): {
  isValid: boolean
  errors: string[]
  warnings: string[]
  errorCount: number
  warningCount: number
} {
  const errors: string[] = []
  const warnings: string[] = []

  const arrayData = Array.isArray(data) ? data : [data]
  const parsed: TagInput[] = []

  for (const [index, item] of arrayData.entries()) {
    try { parsed.push(TagSchema.parse(item)) }
    catch (e: any) {
      const issueLines = (e?.issues || []).map((iss: any) => `Tag ${index + 1}: ${iss.path?.join('.') || ''} ${iss.message}`)
      if (issueLines.length) errors.push(...issueLines)
      else errors.push(`Tag ${index + 1}: Invalid tag data`)
    }
  }

  // Duplicate name warnings
  const seen = new Map<string, number>()
  parsed.forEach((t, idx) => {
    const key = (t.name || '').toLowerCase().trim()
    if (!key) return
    if (seen.has(key)) warnings.push(`Potential duplicate tag: "${t.name}" (indices ${seen.get(key)} and ${idx})`)
    else seen.set(key, idx)
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    errorCount: errors.length,
    warningCount: warnings.length
  }
}

