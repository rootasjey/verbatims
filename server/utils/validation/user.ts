import type { z } from '~/types''zod'
import type { validLanguages } from '~/types''./reference'

export const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(70).optional(),
  password: z.string().min(0).optional(),
  avatar_url: z.string().url().nullable().optional(),
  role: z.enum(['user','moderator','admin']).optional(),
  is_active: z.boolean().optional(),
  email_verified: z.boolean().optional(),
  biography: z.string().max(5000).nullable().optional(),
  job: z.string().max(200).nullable().optional(),
  language: z.enum(validLanguages).optional(),
  location: z.string().max(200).optional(),
  socials: z.union([z.array(z.any()), z.record(z.any()), z.string()]).optional(),
  last_login_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type UserInput = z.infer<typeof UserSchema>

export function validateUserDataZod(data: unknown): {
  isValid: boolean
  errors: string[]
  warnings: string[]
  errorCount: number
  warningCount: number
} {
  const errors: string[] = []
  const warnings: string[] = []

  const arrayData = Array.isArray(data) ? data : [data]
  const parsed: UserInput[] = []

  for (const [index, item] of arrayData.entries()) {
    try { parsed.push(UserSchema.parse(item)) }
    catch (e: any) {
      const issueLines = (e?.issues || []).map((iss: any) => `User ${index + 1}: ${iss.path?.join('.') || ''} ${iss.message}`)
      if (issueLines.length) errors.push(...issueLines)
      else errors.push(`User ${index + 1}: Invalid user data`)
    }
  }

  // Duplicate email warnings
  const seen = new Map<string, number>()
  parsed.forEach((u, idx) => {
    const key = (u.email || '').toLowerCase().trim()
    if (!key) return
    if (seen.has(key)) warnings.push(`Potential duplicate user email: "${u.email}" (indices ${seen.get(key)} and ${idx})`)
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

