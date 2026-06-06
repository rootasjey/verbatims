import { db, schema } from 'hub:db'
import { eq, desc, sql } from 'drizzle-orm'

export default defineEventHandler(async () => {
  const rows = await db.select({
    id: schema.sponsorMessages.id,
    message: schema.sponsorMessages.message,
    leadingIcon: schema.sponsorMessages.leadingIcon,
    trailingIcon: schema.sponsorMessages.trailingIcon,
    url: schema.sponsorMessages.url,
    type: schema.sponsorMessages.type,
    priority: schema.sponsorMessages.priority,
    startsAt: schema.sponsorMessages.startsAt,
    endsAt: schema.sponsorMessages.endsAt,
  })
    .from(schema.sponsorMessages)
    .where(eq(schema.sponsorMessages.isActive, true))
    .orderBy(desc(schema.sponsorMessages.priority), sql`RANDOM()`)
    .limit(50)

  const now = Date.now()
  const active = rows.filter((r) => {
    if (r.startsAt && new Date(r.startsAt).getTime() > now) return false
    if (r.endsAt && new Date(r.endsAt).getTime() < now) return false
    return true
  })

  return { data: active }
})
