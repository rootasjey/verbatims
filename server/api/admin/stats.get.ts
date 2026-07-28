import { db, schema } from 'hub:db'
import { eq, count, sum, avg, sql, desc } from 'drizzle-orm'

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
    
    // Get recent activity from activity_logs
    function parseMetadata(raw: string | null): Record<string, unknown> | null {
      if (!raw) return null
      try { return JSON.parse(raw) } catch { return null }
    }

    // Get recent activity from activity_logs
    const rawActivities = await db.select({
      id: schema.activityLogs.id,
      type: schema.activityLogs.type,
      userId: schema.activityLogs.userId,
      targetId: schema.activityLogs.targetId,
      targetType: schema.activityLogs.targetType,
      metadata: schema.activityLogs.metadata,
      source: schema.activityLogs.source,
      createdAt: schema.activityLogs.createdAt,
      userName: schema.users.name,
      userAvatar: schema.users.avatarUrl,
    })
      .from(schema.activityLogs)
      .leftJoin(schema.users, eq(schema.activityLogs.userId, schema.users.id))
      .orderBy(desc(schema.activityLogs.createdAt))
      .limit(30)

    const recentActivity = rawActivities.map((a) => {
      const meta = parseMetadata(a.metadata)
      const base = {
        user_name: a.userName || 'Unknown',
        user_avatar: a.userAvatar,
        timestamp: a.createdAt ? new Date(a.createdAt).getTime() : 0,
        target_id: a.targetId,
        target_type: a.targetType,
        quote_status: null as string | null,
        secondary_info: null as string | null,
        description: '',
        action: '',
        type: a.type,
        source: a.source,
      }

      switch (a.type) {
        case 'quote_created':
          return { ...base, action: 'Created quote', description: meta?.name || '', secondary_info: meta?.author_name ? `by ${meta.author_name}` : null, quote_status: meta?.status || 'draft' }
        case 'quote_submitted':
          return { ...base, action: 'Submitted quote', description: meta?.name || '', secondary_info: meta?.author_name ? `by ${meta.author_name}` : null, quote_status: 'pending' }
        case 'quote_moderated':
          return { ...base, action: meta?.action === 'approve' ? 'Approved quote' : 'Rejected quote', description: meta?.name || '', secondary_info: meta?.new_status || '', quote_status: meta?.new_status || null }
        case 'quote_edited':
          return { ...base, action: 'Edited quote', description: meta?.name || '', quote_status: meta?.status || null }
        case 'quote_deleted':
          return { ...base, action: 'Deleted quote', description: meta?.name || 'Quote' }
        case 'quote_unpublished':
          return { ...base, action: 'Unpublished quote', description: meta?.name || '' }
        case 'author_created':
          return { ...base, action: 'Created author', description: meta?.name || '' }
        case 'author_edited':
          return { ...base, action: 'Edited author', description: meta?.name || '' }
        case 'author_deleted':
          return { ...base, action: 'Deleted author', description: meta?.name || '' }
        case 'reference_created':
          return { ...base, action: 'Created reference', description: meta?.name || '' }
        case 'reference_edited':
          return { ...base, action: 'Edited reference', description: meta?.name || '' }
        case 'reference_deleted':
          return { ...base, action: 'Deleted reference', description: meta?.name || '' }
        case 'user_registered':
          return { ...base, action: 'New user registered', description: meta?.name || a.userName || '', secondary_info: meta?.role || 'user' }
        case 'export_run':
          return { ...base, action: 'Export', description: `Exported ${meta?.data_type || 'data'}`, secondary_info: meta?.format || '' }
        default:
          return { ...base, action: a.type }
      }
    })
    
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
