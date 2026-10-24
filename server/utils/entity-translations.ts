import { and, eq, inArray } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { db, schema } from 'hub:db'
import { chunkForD1Bindings } from './d1-parameter-batching'

export const CONTENT_LANGUAGES = ['en', 'fr'] as const
export type ContentLanguage = typeof CONTENT_LANGUAGES[number]

export function getContentLanguage(event: H3Event): ContentLanguage {
  const queryLanguage = getQuery(event).language
  const cookieLanguage = getCookie(event, 'verbatims-locale')
  const language = typeof queryLanguage === 'string' ? queryLanguage : cookieLanguage
  return CONTENT_LANGUAGES.includes(language as ContentLanguage) ? language as ContentLanguage : 'en'
}

export async function getAuthorTranslations(authorId: number) {
  return db.select().from(schema.authorTranslations)
    .where(eq(schema.authorTranslations.authorId, authorId)).all()
}

export async function getReferenceTranslations(referenceId: number) {
  return db.select().from(schema.referenceTranslations)
    .where(eq(schema.referenceTranslations.referenceId, referenceId)).all()
}

export async function localizeAuthors<T extends { id: number; job?: string | null; description?: string | null }>(rows: T[], language: ContentLanguage): Promise<T[]> {
  if (!rows.length) return rows

  const translations: (typeof schema.authorTranslations.$inferSelect)[] = []
  for (const authorIds of chunkForD1Bindings(rows.map(row => row.id), 1, 1)) {
    const batchTranslations = await db.select().from(schema.authorTranslations)
      .where(and(inArray(schema.authorTranslations.authorId, authorIds), eq(schema.authorTranslations.language, language))).all()
    translations.push(...batchTranslations)
  }

  const byId = new Map(translations.map(row => [row.authorId, row]))
  return rows.map(row => {
    const translation = byId.get(row.id)
    return {
      ...row,
      job: translation?.job || row.job,
      description: translation?.description || row.description,
    }
  })
}

export async function localizeReferences<T extends { id: number; name?: string | null; description?: string | null }>(rows: T[], language: ContentLanguage): Promise<T[]> {
  if (!rows.length) return rows

  const translations: (typeof schema.referenceTranslations.$inferSelect)[] = []
  for (const referenceIds of chunkForD1Bindings(rows.map(row => row.id), 1, 1)) {
    const batchTranslations = await db.select().from(schema.referenceTranslations)
      .where(and(inArray(schema.referenceTranslations.referenceId, referenceIds), eq(schema.referenceTranslations.language, language))).all()
    translations.push(...batchTranslations)
  }

  const byId = new Map(translations.map(row => [row.referenceId, row]))
  return rows.map(row => {
    const translation = byId.get(row.id)
    return {
      ...row,
      name: translation?.name || row.name,
      description: translation?.description || row.description,
    }
  })
}

export async function saveAuthorTranslations(authorId: number, translations: Record<string, { job?: string | null; description?: string | null }> | undefined) {
  if (!translations) return
  for (const language of CONTENT_LANGUAGES) {
    const value = translations[language]
    if (!value) continue
    const job = value.job?.trim() || null
    const description = value.description?.trim() || null
    if (!job && !description) {
      await db.delete(schema.authorTranslations).where(and(
        eq(schema.authorTranslations.authorId, authorId),
        eq(schema.authorTranslations.language, language),
      ))
      continue
    }
    await db.insert(schema.authorTranslations).values({ authorId, language, job, description })
      .onConflictDoUpdate({
        target: [schema.authorTranslations.authorId, schema.authorTranslations.language],
        set: { job, description },
      })
  }
}

export async function saveReferenceTranslations(referenceId: number, translations: Record<string, { name?: string | null; description?: string | null }> | undefined) {
  if (!translations) return
  for (const language of CONTENT_LANGUAGES) {
    const value = translations[language]
    if (!value) continue
    const name = value.name?.trim() || null
    const description = value.description?.trim() || null
    if (!name && !description) {
      await db.delete(schema.referenceTranslations).where(and(
        eq(schema.referenceTranslations.referenceId, referenceId),
        eq(schema.referenceTranslations.language, language),
      ))
      continue
    }
    await db.insert(schema.referenceTranslations).values({ referenceId, language, name, description })
      .onConflictDoUpdate({
        target: [schema.referenceTranslations.referenceId, schema.referenceTranslations.language],
        set: { name, description },
      })
  }
}
