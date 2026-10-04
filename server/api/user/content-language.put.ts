import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

const supportedContentLanguages = ['all', 'en', 'fr', 'la']

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)
  const body = await readBody<{ content_language?: string }>(event)
  const contentLanguage = body?.content_language

  if (!contentLanguage || !supportedContentLanguages.includes(contentLanguage)) {
    throwServer(400, `Invalid content language. Must be one of: ${supportedContentLanguages.join(', ')}`)
  }

  await db.update(schema.users)
    .set({ preferredContentLanguage: contentLanguage, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id))

  const session = await getUserSession(event)
  if (session.user) {
    await setUserSession(event, {
      ...session,
      user: { ...session.user, content_language: contentLanguage },
    })
  }

  return { success: true, content_language: contentLanguage }
})
