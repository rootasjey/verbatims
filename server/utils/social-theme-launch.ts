import { db, schema } from 'hub:db'
import { and, eq, inArray, sql } from 'drizzle-orm'
import type { SocialPlatform } from '#shared/constants/social'
import { getEnabledSocialPostingPlatforms } from './social-autopost'
import { prepareSocialCardAssets } from './social-card-assets'
import { themeMediaNeedsImmediatePreparation } from './social-publishing-schedule'

/** Create one announcement entry per connected provider for the theme's first launch. */
export async function enqueueThemeLaunch(themeId: number) {
  const theme = await db.select({
    id: schema.themes.id,
    isActive: schema.themes.isActive,
    scheduledStart: schema.themes.scheduledStart,
    scheduledEnd: schema.themes.scheduledEnd
  }).from(schema.themes).where(eq(schema.themes.id, themeId)).limit(1).get()

  if (!theme?.isActive) return { queued: 0 }

  const platforms = await getEnabledSocialPostingPlatforms()
  if (!platforms.length) return { queued: 0 }

  const now = new Date()
  const scheduledFor = theme.scheduledStart && theme.scheduledStart.getTime() > now.getTime()
    ? theme.scheduledStart
    : now
  if (theme.scheduledEnd && theme.scheduledEnd.getTime() <= scheduledFor.getTime()) return { queued: 0 }

  const [positions, beforeCount] = await Promise.all([
    Promise.all(platforms.map(async (platform) => {
      const maxPosition = await db.select({ value: sql<number>`COALESCE(MAX(${schema.socialQueue.position}), 0)` })
        .from(schema.socialQueue).where(eq(schema.socialQueue.platform, platform)).get()
      return Number(maxPosition?.value || 0)
    })),
    db.select({ value: sql<number>`COUNT(*)` })
      .from(schema.socialQueue)
      .where(and(
        eq(schema.socialQueue.contentType, 'theme'),
        eq(schema.socialQueue.sourceType, 'theme'),
        eq(schema.socialQueue.sourceId, themeId),
        inArray(schema.socialQueue.platform, platforms)
      )).get()
  ])

  const statements = platforms.map((platform, index) => db.insert(schema.socialQueue).values({
      quoteId: null,
      contentType: 'theme',
      sourceType: 'theme',
      sourceId: themeId,
      platform: platform as SocialPlatform,
      status: 'queued',
      position: positions[index]! + 1,
      scheduledFor,
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoNothing())
  if (statements.length) await db.batch(statements as any)

  const afterCount = await db.select({ value: sql<number>`COUNT(*)` })
    .from(schema.socialQueue)
    .where(and(
      eq(schema.socialQueue.contentType, 'theme'),
      eq(schema.socialQueue.sourceType, 'theme'),
      eq(schema.socialQueue.sourceId, themeId),
      inArray(schema.socialQueue.platform, platforms)
    )).get()
  const queued = Math.max(0, Number(afterCount?.value || 0) - Number(beforeCount?.value || 0))

  const preparedImmediately = queued > 0 && themeMediaNeedsImmediatePreparation(scheduledFor, now)
    ? await prepareSocialCardAssets({ sourceType: 'theme', sourceId: themeId })
    : null

  return { queued, preparedImmediately: preparedImmediately?.prepared || 0, mediaSkipped: preparedImmediately?.skipped || 0 }
}
