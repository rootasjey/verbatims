import { db, schema } from 'hub:db'
import { eq, count, sum, avg, sql, desc } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireModerator(event)
    
    // Get overall system statistics
    const [
      quotesStats,
      usersStats,
      authorsStats,
      referencesStats,
      collectionsStats,
      likesStats,
      viewsStats
    ] = await Promise.all([
      // Quotes statistics
      db.select({
        total: count(),
        approved: sum(sql`CASE WHEN ${schema.quotes.status} = 'approved' THEN 1 ELSE 0 END`),
        draft: sum(sql`CASE WHEN ${schema.quotes.status} = 'draft' THEN 1 ELSE 0 END`),
        pending: sum(sql`CASE WHEN ${schema.quotes.status} = 'pending' THEN 1 ELSE 0 END`),
        rejected: sum(sql`CASE WHEN ${schema.quotes.status} = 'rejected' THEN 1 ELSE 0 END`),
        harvested: sum(sql`CASE WHEN ${schema.quotes.status} = 'harvested' THEN 1 ELSE 0 END`),
        featured: sum(sql`CASE WHEN ${schema.quotes.isFeatured} = 1 THEN 1 ELSE 0 END`),
        total_likes: sum(schema.quotes.likesCount),
        total_views: sum(schema.quotes.viewsCount),
        total_shares: sum(schema.quotes.sharesCount)
      }).from(schema.quotes),
      
      // Users statistics
      db.select({
        total: count(),
        active: sum(sql`CASE WHEN ${schema.users.isActive} = 1 THEN 1 ELSE 0 END`),
        admins: sum(sql`CASE WHEN ${schema.users.role} = 'admin' THEN 1 ELSE 0 END`),
        moderators: sum(sql`CASE WHEN ${schema.users.role} = 'moderator' THEN 1 ELSE 0 END`),
        verified: sum(sql`CASE WHEN ${schema.users.emailVerified} = 1 THEN 1 ELSE 0 END`)
      }).from(schema.users),
      
      // Authors statistics
      db.select({
        total: count(),
        fictional: sum(sql`CASE WHEN ${schema.authors.isFictional} = 1 THEN 1 ELSE 0 END`),
        total_likes: sum(schema.authors.likesCount),
        total_views: sum(schema.authors.viewsCount)
      }).from(schema.authors),
      
      // References statistics
      db.select({
        total: count(),
        types: sql<number>`COUNT(DISTINCT ${schema.quoteReferences.primaryType})`,
        total_likes: sum(schema.quoteReferences.likesCount),
        total_views: sum(schema.quoteReferences.viewsCount)
      }).from(schema.quoteReferences),
      
      // Collections statistics
      db.select({
        total: count(),
        public_collections: sum(sql`CASE WHEN ${schema.userCollections.isPublic} = 1 THEN 1 ELSE 0 END`),
        avg_quotes_per_collection: sql<number>`AVG(quote_counts.quotes)`
      })
      .from(schema.userCollections)
      .leftJoin(
        sql`(
          SELECT collection_id, COUNT(*) as quotes
          FROM collection_quotes
          GROUP BY collection_id
        ) quote_counts`,
        sql`${schema.userCollections.id} = quote_counts.collection_id`
      ),
      
      // Likes statistics
      db.select({
        total: count(),
        unique_users: sql<number>`COUNT(DISTINCT ${schema.userLikes.userId})`,
        quote_likes: sum(sql`CASE WHEN ${schema.userLikes.likeableType} = 'quote' THEN 1 ELSE 0 END`),
        author_likes: sum(sql`CASE WHEN ${schema.userLikes.likeableType} = 'author' THEN 1 ELSE 0 END`),
        reference_likes: sum(sql`CASE WHEN ${schema.userLikes.likeableType} = 'reference' THEN 1 ELSE 0 END`)
      }).from(schema.userLikes),
      
      // Views statistics
      db.select({
        total: count(),
        unique_users: sql<number>`COUNT(DISTINCT ${schema.quoteViews.userId})`,
        unique_ips: sql<number>`COUNT(DISTINCT ${schema.quoteViews.ipAddress})`
      }).from(schema.quoteViews)
    ])
    
    // Get recent activity (last 30 days)
    const thirtyDaysAgoSec = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60
    const mods = alias(schema.users, 'mods')

    const [recentQuotes, recentModerations, recentUsers] = await Promise.all([
      // Recent quote submissions
      db.select({
        id: schema.quotes.id,
        name: schema.quotes.name,
        status: schema.quotes.status,
        createdAt: sql<number>`unixepoch(${schema.quotes.createdAt})`,
        userName: schema.users.name,
        userAvatar: schema.users.avatarUrl,
        authorName: schema.authors.name
      })
        .from(schema.quotes)
        .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
        .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
        .where(sql`unixepoch(${schema.quotes.createdAt}) >= ${thirtyDaysAgoSec}`)
        .orderBy(desc(sql`unixepoch(${schema.quotes.createdAt})`))
        .limit(20),

      // Recent moderation actions
      db.select({
        id: schema.quotes.id,
        name: schema.quotes.name,
        status: schema.quotes.status,
        moderatedAt: sql<number | null>`unixepoch(${schema.quotes.moderatedAt})`,
        moderatorName: mods.name,
        moderatorAvatar: mods.avatarUrl,
        userName: schema.users.name
      })
        .from(schema.quotes)
        .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
        .leftJoin(mods, eq(schema.quotes.moderatorId, mods.id))
        .where(sql`unixepoch(${schema.quotes.moderatedAt}) >= ${thirtyDaysAgoSec}`)
        .orderBy(desc(sql`unixepoch(${schema.quotes.moderatedAt})`))
        .limit(20),

      // Recent user registrations
      db.select({
        id: schema.users.id,
        name: schema.users.name,
        avatarUrl: schema.users.avatarUrl,
        role: schema.users.role,
        createdAt: sql<number>`unixepoch(${schema.users.createdAt})`
      })
        .from(schema.users)
        .where(sql`unixepoch(${schema.users.createdAt}) >= ${thirtyDaysAgoSec}`)
        .orderBy(desc(sql`unixepoch(${schema.users.createdAt})`))
        .limit(20)
    ])

    const allActivities: Array<{
      type: string
      action: string
      description: string
      user_name: string
      user_avatar: string | null
      secondary_info: string | null
      timestamp: number
      quote_id?: number
      quote_status?: string | null
    }> = []

    recentQuotes.forEach((q) => {
      allActivities.push({
        type: 'quote_submitted',
        action: 'Submitted quote',
        description: q.name,
        user_name: q.userName || 'Unknown',
        user_avatar: q.userAvatar,
        secondary_info: q.authorName ? `by ${q.authorName}` : null,
        timestamp: q.createdAt * 1000,
        quote_id: q.id,
        quote_status: q.status
      })
    })

    recentModerations.forEach((m) => {
      if (!m.moderatedAt) return
      allActivities.push({
        type: 'quote_moderated',
        action: m.status === 'approved' ? 'Approved quote' : 'Rejected quote',
        description: m.name,
        user_name: m.moderatorName || m.userName || 'Unknown',
        user_avatar: m.moderatorAvatar,
        secondary_info: m.status,
        timestamp: m.moderatedAt * 1000,
        quote_id: m.id,
        quote_status: m.status
      })
    })

    recentUsers.forEach((u) => {
      allActivities.push({
        type: 'user_registered',
        action: 'New user registered',
        description: u.name,
        user_name: u.name,
        user_avatar: u.avatarUrl,
        secondary_info: u.role,
        timestamp: u.createdAt * 1000
      })
    })

    allActivities.sort((a, b) => b.timestamp - a.timestamp)
    const recentActivity = allActivities.slice(0, 30)
    
    // Get top contributors
    const topContributors = await db.select({
      id: schema.users.id,
      name: schema.users.name,
      avatar_url: schema.users.avatarUrl,
      quote_count: count(schema.quotes.id),
      total_likes: sum(schema.quotes.likesCount)
    })
    .from(schema.users)
    .leftJoin(schema.quotes, sql`${schema.users.id} = ${schema.quotes.userId} AND ${schema.quotes.status} = 'approved'`)
    .groupBy(schema.users.id)
    .having(sql`COUNT(${schema.quotes.id}) > 0`)
    .orderBy(desc(count(schema.quotes.id)), desc(sum(schema.quotes.likesCount)))
    .limit(10)
    
    return {
      success: true,
      data: {
        quotes: {
          total: Number(quotesStats[0]?.total) || 0,
          approved: Number(quotesStats[0]?.approved) || 0,
          draft: Number(quotesStats[0]?.draft) || 0,
          pending: Number(quotesStats[0]?.pending) || 0,
          rejected: Number(quotesStats[0]?.rejected) || 0,
          harvested: Number(quotesStats[0]?.harvested) || 0,
          featured: Number(quotesStats[0]?.featured) || 0,
          total_likes: Number(quotesStats[0]?.total_likes) || 0,
          total_views: Number(quotesStats[0]?.total_views) || 0,
          total_shares: Number(quotesStats[0]?.total_shares) || 0
        },
        users: {
          total: Number(usersStats[0]?.total) || 0,
          active: Number(usersStats[0]?.active) || 0,
          admins: Number(usersStats[0]?.admins) || 0,
          moderators: Number(usersStats[0]?.moderators) || 0,
          verified: Number(usersStats[0]?.verified) || 0
        },
        authors: {
          total: Number(authorsStats[0]?.total) || 0,
          fictional: Number(authorsStats[0]?.fictional) || 0,
          total_likes: Number(authorsStats[0]?.total_likes) || 0,
          total_views: Number(authorsStats[0]?.total_views) || 0
        },
        references: {
          total: Number(referencesStats[0]?.total) || 0,
          types: Number(referencesStats[0]?.types) || 0,
          total_likes: Number(referencesStats[0]?.total_likes) || 0,
          total_views: Number(referencesStats[0]?.total_views) || 0
        },
        collections: {
          total: Number(collectionsStats[0]?.total) || 0,
          public: Number(collectionsStats[0]?.public_collections) || 0,
          avg_quotes: Math.round(Number(collectionsStats[0]?.avg_quotes_per_collection) || 0)
        },
        likes: {
          total: Number(likesStats[0]?.total) || 0,
          unique_users: Number(likesStats[0]?.unique_users) || 0,
          quote_likes: Number(likesStats[0]?.quote_likes) || 0,
          author_likes: Number(likesStats[0]?.author_likes) || 0,
          reference_likes: Number(likesStats[0]?.reference_likes) || 0
        },
        views: {
          total: Number(viewsStats[0]?.total) || 0,
          unique_users: Number(viewsStats[0]?.unique_users) || 0,
          unique_ips: Number(viewsStats[0]?.unique_ips) || 0
        },
        recent_activity: recentActivity,
        top_contributors: topContributors
      }
    }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Admin stats error:', error)
    throwServer(500, 'Failed to fetch admin statistics')
  }
})
