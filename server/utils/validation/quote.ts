import { z } from 'zod'
import { validLanguages } from './reference'

// Accept common boolean-ish inputs (true/false, 1/0, yes/no, y/n, strings)
const booleanish = z.preprocess((val) => {
  if (typeof val === 'boolean') return val
  if (typeof val === 'number') return val === 1 ? true : val === 0 ? false : val
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase()
    if (['1','true','yes','y'].includes(s)) return true
    if (['0','false','no','n',''].includes(s)) return false
  }
  return val
}, z.boolean())

export const QuoteSchema = z.object({
  name: z.string().min(1).max(5000),
  language: z.enum(validLanguages).optional(),
  author_id: z.number().int().positive().nullable().optional(),
  author_name: z.string().optional(),
  reference_id: z.number().int().positive().nullable().optional(),
  reference_name: z.string().optional(),
  user_id: z.number().int().positive().optional(),
  user_email: z.string().email().optional(),
  status: z.enum(['draft','pending','approved','rejected']).optional(),
  moderator_id: z.number().int().positive().nullable().optional(),
  moderated_at: z.string().nullable().optional(),
  rejection_reason: z.string().nullable().optional(),
  views_count: z.number().int().nonnegative().optional(),
  likes_count: z.number().int().nonnegative().optional(),
  shares_count: z.number().int().nonnegative().optional(),
  is_featured: booleanish.optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type QuoteInput = z.infer<typeof QuoteSchema>

export function validateQuoteDataZod(data: unknown): {
  isValid: boolean
  errors: string[]
  warnings: string[]
  errorCount: number
  warningCount: number
} {
  const errors: string[] = []
  const warnings: string[] = []

  const arrayData = Array.isArray(data) ? data : [data]
  const parsed: QuoteInput[] = []

  for (const [index, item] of arrayData.entries()) {
    try { parsed.push(QuoteSchema.parse(item)) }
    catch (e: any) {
      const issueLines = (e?.issues || []).map((iss: any) => `Quote ${index + 1}: ${iss.path?.join('.') || ''} ${iss.message}`)
      if (issueLines.length) errors.push(...issueLines)
      else errors.push(`Quote ${index + 1}: Invalid quote data`)
    }
  }

  // Duplicate content warnings (same name + author_name + reference_name)
  const seen = new Map<string, number>()
  parsed.forEach((q, idx) => {
    const key = `${(q.name||'').trim().slice(0,200).toLowerCase()}|${(q.author_name||'').toLowerCase()}|${(q.reference_name||'').toLowerCase()}`
    if (!key.trim()) return
    if (seen.has(key)) warnings.push(`Potential duplicate quote: indices ${seen.get(key)} and ${idx}`)
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

