/**
 * Admin API: Data Management Statistics
 * Returns comprehensive statistics for the data management dashboard
 */

export default defineEventHandler(async (event) => {
  try {
    // Check admin permissions
    const { user } = await requireUserSession(event)
    if (!user || user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }

    const db = hubDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database not available'
      })
    }

    // Get reference statistics
    const referenceStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_references,
        COUNT(CASE WHEN description IS NOT NULL AND description != '' THEN 1 END) as with_description,
        COUNT(CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 1 END) as with_image,
        COUNT(CASE WHEN release_date IS NOT NULL THEN 1 END) as with_release_date,
        AVG(views_count) as avg_views,
        AVG(likes_count) as avg_likes
      FROM quote_references
    `).first()

    if (!referenceStats) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to get reference stats'
      })
    }

    // Get recent imports count
    const recentImports = await db.prepare(`
      SELECT COUNT(*) as count 
      FROM backup_metadata 
      WHERE created_at > datetime('now', '-30 days')
    `).first()

    if (!recentImports) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to get recent imports count'
      })
    }

    // Get backup statistics
    const backupStats = await db.prepare(`
      SELECT COUNT(*) as total_backups
      FROM backup_metadata 
      WHERE is_active = TRUE
    `).first()

    if (!backupStats) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to get backup stats'
      })
    }

    // Calculate data quality score
    const qualityMetrics = {
      completeness: calculateCompleteness(referenceStats),
      accuracy: await calculateAccuracy(db),
      consistency: await calculateConsistency(db)
    }
    
    const dataQualityScore = Math.round(
      (qualityMetrics.completeness + qualityMetrics.accuracy + qualityMetrics.consistency) / 3
    )

    // Get content distribution
    const contentDistribution = await db.prepare(`
      SELECT primary_type, COUNT(*) as count
      FROM quote_references
      GROUP BY primary_type
      ORDER BY count DESC
    `).all()

    // Get language distribution
    const languageDistribution = await db.prepare(`
      SELECT original_language, COUNT(*) as count
      FROM quote_references
      GROUP BY original_language
      ORDER BY count DESC
    `).all()

    return {
      success: true,
      data: {
        totalReferences: referenceStats.total_references,
        recentImports: recentImports.count,
        totalBackups: backupStats.total_backups,
        dataQualityScore,
        qualityMetrics,
        contentDistribution,
        languageDistribution,
        completenessStats: {
          withDescription: referenceStats.with_description,
          withImage: referenceStats.with_image,
          withReleaseDate: referenceStats.with_release_date
        },
        engagementStats: {
          averageViews: Math.round(Number(referenceStats.avg_views) || 0),
          averageLikes: Math.round(Number(referenceStats.avg_likes) || 0)
        }
      }
    }

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to get data management stats'
    })
  }
})

function calculateCompleteness(stats: any): number {
  const totalFields = 3 // description, image, release_date
  const completedFields = [
    stats.with_description,
    stats.with_image,
    stats.with_release_date,
  ].reduce((sum, count) => sum + count, 0)
  
  const maxPossible = stats.total_references * totalFields
  return maxPossible > 0 ? Math.round((completedFields / maxPossible) * 100) : 0
}

async function calculateAccuracy(db: any): Promise<number> {
  // Check for data accuracy issues
  const issues = await Promise.all([
    // Invalid URLs
    db.prepare(`
      SELECT COUNT(*) as count FROM quote_references 
      WHERE image_url IS NOT NULL AND image_url != '' 
      AND image_url NOT LIKE 'http%'
    `).first(),
    
    // Invalid dates (future dates)
    db.prepare(`
      SELECT COUNT(*) as count FROM quote_references 
      WHERE release_date > date('now')
    `).first(),
    
    // Invalid primary types
    db.prepare(`
      SELECT COUNT(*) as count FROM quote_references 
      WHERE primary_type NOT IN ('film', 'book', 'tv_series', 'music', 'speech', 'podcast', 'interview', 'documentary', 'other')
    `).first()
  ])
  
  const totalIssues = issues.reduce((sum, issue) => sum + issue.count, 0)
  const totalRecords = await db.prepare('SELECT COUNT(*) as count FROM quote_references').first()
  
  return totalRecords.count > 0 ? Math.max(0, Math.round(((totalRecords.count - totalIssues) / totalRecords.count) * 100)) : 100
}

async function calculateConsistency(db: any): Promise<number> {
  // Check for consistency issues
  const issues = await Promise.all([
    // Inconsistent naming patterns
    db.prepare(`
      SELECT COUNT(*) as count FROM quote_references 
      WHERE name != TRIM(name) OR name LIKE '%  %'
    `).first(),
    
    // Inconsistent language codes
    db.prepare(`
      SELECT COUNT(*) as count FROM quote_references 
      WHERE original_language NOT IN ('en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh')
    `).first(),
    
    // Missing secondary types for certain primary types
    db.prepare(`
      SELECT COUNT(*) as count FROM quote_references 
      WHERE primary_type IN ('film', 'tv_series') 
      AND (secondary_type IS NULL OR secondary_type = '')
    `).first()
  ])
  
  const totalIssues = issues.reduce((sum, issue) => sum + issue.count, 0)
  const totalRecords = await db.prepare('SELECT COUNT(*) as count FROM quote_references').first()
  
  return totalRecords.count > 0 ? Math.max(0, Math.round(((totalRecords.count - totalIssues) / totalRecords.count) * 100)) : 100
}
