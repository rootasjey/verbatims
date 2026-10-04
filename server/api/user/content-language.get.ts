import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

const supportedContentLanguages = ['all', 'en', 'fr', 'la']

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)
  const preference = await db.select({ language: schema.users.preferredContentLanguage })
    .from(schema.users)
    .where(eq(schema.users.id, user.id))
    .get()

  const language = preference?.language && supportedContentLanguages.includes(preference.language)
    ? preference.language
    : 'all'

  return { success: true, content_language: language }
})
