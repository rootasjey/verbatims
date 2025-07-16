/**
 * Admin API: Data Quality Analysis
 * Performs comprehensive data quality analysis and returns detailed report
 */

import type { Severity, QualityIssue, QualityAnalysisResult } from '~/types/quality-analysis'

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

    // Run comprehensive quality analysis
    const qualityReport = await runQualityAnalysis(db)

    return {
      success: true,
      data: qualityReport
    }

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Quality analysis failed'
    })
  }
})

async function runQualityAnalysis(db: any): Promise<QualityAnalysisResult> {
  const issues: QualityIssue[] = []
  
  // Get total record count
  const totalRecords = await db.prepare('SELECT COUNT(*) as count FROM quote_references').first()
  const total = totalRecords.count

  // 1. Completeness Analysis
  const completenessIssues = await analyzeCompleteness(db, total)
  issues.push(...completenessIssues.issues)
  const completeness = completenessIssues.score

  // 2. Accuracy Analysis
  const accuracyIssues = await analyzeAccuracy(db, total)
  issues.push(...accuracyIssues.issues)
  const accuracy = accuracyIssues.score

  // 3. Consistency Analysis
  const consistencyIssues = await analyzeConsistency(db, total)
  issues.push(...consistencyIssues.issues)
  const consistency = consistencyIssues.score

  // 4. Uniqueness Analysis
  const uniquenessIssues = await analyzeUniqueness(db, total)
  issues.push(...uniquenessIssues.issues)

  // 5. Validity Analysis
  const validityIssues = await analyzeValidity(db, total)
  issues.push(...validityIssues.issues)

  // Calculate overall score
  const overallScore = Math.round((completeness + accuracy + consistency) / 3)

  // Sort issues by severity
  const severityOrder: Record<Severity, number> = { high: 3, medium: 2, low: 1 }
  issues.sort((a: QualityIssue, b: QualityIssue) => {
    return severityOrder[b.severity] - severityOrder[a.severity]
  })

  return {
    overallScore,
    completeness,
    accuracy,
    consistency,
    totalRecords: total,
    issues,
    analysisDate: new Date().toISOString(),
    recommendations: generateRecommendations(issues)
  }
}

async function analyzeCompleteness(db: any, total: number) {
  const issues: QualityIssue[] = []
  
  // Check for missing descriptions
  const missingDescriptions = await db.prepare(`
    SELECT COUNT(*) as count FROM quote_references 
    WHERE description IS NULL OR description = ''
  `).first()
  
  if (missingDescriptions.count > 0) {
    issues.push({
      severity: 'medium',
      title: 'Missing Descriptions',
      description: `${missingDescriptions.count} references lack descriptions`,
      count: missingDescriptions.count,
      percentage: Math.round((missingDescriptions.count / total) * 100)
    })
  }

  // Check for missing images
  const missingImages = await db.prepare(`
    SELECT COUNT(*) as count FROM quote_references 
    WHERE image_url IS NULL OR image_url = ''
  `).first()
  
  if (missingImages.count > 0) {
    issues.push({
      severity: 'low',
      title: 'Missing Images',
      description: `${missingImages.count} references lack image URLs`,
      count: missingImages.count,
      percentage: Math.round((missingImages.count / total) * 100)
    })
  }

  // Check for missing release dates
  const missingDates = await db.prepare(`
    SELECT COUNT(*) as count FROM quote_references 
    WHERE release_date IS NULL
  `).first()
  
  if (missingDates.count > 0) {
    issues.push({
      severity: 'low',
      title: 'Missing Release Dates',
      description: `${missingDates.count} references lack release dates`,
      count: missingDates.count,
      percentage: Math.round((missingDates.count / total) * 100)
    })
  }

  // Calculate completeness score
  const requiredFields = 4 // name, primary_type, description, image_url
  const completedFields = total * requiredFields - (missingDescriptions.count + missingImages.count)
  const maxPossible = total * requiredFields
  const score = maxPossible > 0 ? Math.round((completedFields / maxPossible) * 100) : 100

  return { issues, score }
}

async function analyzeAccuracy(db: any, total: number) {
  const issues: QualityIssue[] = []
  
  // Check for invalid URLs
  const invalidUrls = await db.prepare(`
    SELECT COUNT(*) as count FROM quote_references 
    WHERE image_url IS NOT NULL AND image_url != '' 
    AND image_url NOT LIKE 'http%'
  `).first()
  
  if (invalidUrls.count > 0) {
    issues.push({
      severity: 'high',
      title: 'Invalid Image URLs',
      description: `${invalidUrls.count} references have malformed image URLs`,
      count: invalidUrls.count
    })
  }

  // Check for future release dates
  const futureDates = await db.prepare(`
    SELECT COUNT(*) as count FROM quote_references 
    WHERE release_date > date('now')
  `).first()
  
  if (futureDates.count > 0) {
    issues.push({
      severity: 'medium',
      title: 'Future Release Dates',
      description: `${futureDates.count} references have release dates in the future`,
      count: futureDates.count
    })
  }

  // Check for invalid primary types
  const invalidTypes = await db.prepare(`
    SELECT COUNT(*) as count FROM quote_references 
    WHERE primary_type NOT IN ('film', 'book', 'tv_series', 'music', 'speech', 'podcast', 'interview', 'documentary', 'other')
  `).first()
  
  if (invalidTypes.count > 0) {
    issues.push({
      severity: 'high',
      title: 'Invalid Primary Types',
      description: `${invalidTypes.count} references have invalid primary types`,
      count: invalidTypes.count
    })
  }

  // Calculate accuracy score
  const totalIssues = invalidUrls.count + futureDates.count + invalidTypes.count
  const score = total > 0 ? Math.max(0, Math.round(((total - totalIssues) / total) * 100)) : 100

  return { issues, score }
}

async function analyzeConsistency(db: any, total: number) {
  const issues: QualityIssue[] = []
  
  // Check for inconsistent naming (leading/trailing spaces, multiple spaces)
  const inconsistentNames = await db.prepare(`
    SELECT COUNT(*) as count FROM quote_references 
    WHERE name != TRIM(name) OR name LIKE '%  %'
  `).first()
  
  if (inconsistentNames.count > 0) {
    issues.push({
      severity: 'medium',
      title: 'Inconsistent Naming',
      description: `${inconsistentNames.count} references have inconsistent naming (extra spaces)`,
      count: inconsistentNames.count
    })
  }

  // Check for inconsistent language codes
  const inconsistentLanguages = await db.prepare(`
    SELECT COUNT(*) as count FROM quote_references 
    WHERE original_language NOT IN ('en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh')
  `).first()
  
  if (inconsistentLanguages.count > 0) {
    issues.push({
      severity: 'medium',
      title: 'Inconsistent Language Codes',
      description: `${inconsistentLanguages.count} references use non-standard language codes`,
      count: inconsistentLanguages.count
    })
  }

  // Check for missing secondary types where expected
  const missingSecondaryTypes = await db.prepare(`
    SELECT COUNT(*) as count FROM quote_references 
    WHERE primary_type IN ('film', 'tv_series') 
    AND (secondary_type IS NULL OR secondary_type = '')
  `).first()
  
  if (missingSecondaryTypes.count > 0) {
    issues.push({
      severity: 'low',
      title: 'Missing Secondary Types',
      description: `${missingSecondaryTypes.count} films/TV series lack secondary type classification`,
      count: missingSecondaryTypes.count
    })
  }

  // Calculate consistency score
  const totalIssues = inconsistentNames.count + inconsistentLanguages.count + missingSecondaryTypes.count
  const score = total > 0 ? Math.max(0, Math.round(((total - totalIssues) / total) * 100)) : 100

  return { issues, score }
}

async function analyzeUniqueness(db: any, _total: number) {
  const issues: QualityIssue[] = []
  
  // Check for duplicate names
  const duplicateNames = await db.prepare(`
    SELECT name, COUNT(*) as count 
    FROM quote_references 
    GROUP BY LOWER(TRIM(name)) 
    HAVING count > 1
  `).all()
  
  if (duplicateNames.length > 0) {
    const totalDuplicates = duplicateNames.reduce((sum: any, dup: { count: any }) => sum + dup.count - 1, 0)
    issues.push({
      severity: 'medium',
      title: 'Duplicate Names',
      description: `${totalDuplicates} references have duplicate names`,
      count: totalDuplicates,
      details: duplicateNames.slice(0, 5).map((dup: { name: any; count: any }) => `"${dup.name}" (${dup.count} times)`)
    })
  }

  // Check for duplicate image URLs
  const duplicateImages = await db.prepare(`
    SELECT image_url, COUNT(*) as count 
    FROM quote_references 
    WHERE image_url IS NOT NULL AND image_url != ''
    GROUP BY image_url 
    HAVING count > 1
  `).all()
  
  if (duplicateImages.length > 0) {
    const totalDuplicates = duplicateImages.reduce((sum: any, dup: { count: any }) => sum + dup.count - 1, 0)
    issues.push({
      severity: 'low',
      title: 'Duplicate Images',
      description: `${totalDuplicates} references share the same image URL`,
      count: totalDuplicates
    })
  }

  return { issues }
}

async function analyzeValidity(db: any, _total: number) {
  const issues: QualityIssue[] = []
  
  // Check for very short names
  const shortNames = await db.prepare(`
    SELECT COUNT(*) as count FROM quote_references 
    WHERE LENGTH(name) < 3
  `).first()
  
  if (shortNames.count > 0) {
    issues.push({
      severity: 'high',
      title: 'Very Short Names',
      description: `${shortNames.count} references have names shorter than 3 characters`,
      count: shortNames.count
    })
  }

  // Check for very long names
  const longNames = await db.prepare(`
    SELECT COUNT(*) as count FROM quote_references 
    WHERE LENGTH(name) > 200
  `).first()
  
  if (longNames.count > 0) {
    issues.push({
      severity: 'medium',
      title: 'Very Long Names',
      description: `${longNames.count} references have names longer than 200 characters`,
      count: longNames.count
    })
  }

  // Check for invalid JSON in urls field
  const invalidJson = await db.prepare(`
    SELECT COUNT(*) as count FROM quote_references 
    WHERE urls IS NOT NULL AND urls != '' AND urls != '{}'
    AND NOT json_valid(urls)
  `).first()
  
  if (invalidJson.count > 0) {
    issues.push({
      severity: 'high',
      title: 'Invalid JSON in URLs',
      description: `${invalidJson.count} references have malformed JSON in URLs field`,
      count: invalidJson.count
    })
  }

  return { issues }
}

function generateRecommendations(issues: QualityIssue[]): string[] {
  const recommendations: string[] = []
  
  const highSeverityIssues = issues.filter(issue => issue.severity === 'high')
  const mediumSeverityIssues = issues.filter(issue => issue.severity === 'medium')
  
  if (highSeverityIssues.length > 0) {
    recommendations.push('🔴 Address high-severity issues immediately to prevent data corruption')
  }
  
  if (mediumSeverityIssues.length > 0) {
    recommendations.push('🟡 Review medium-severity issues to improve data quality')
  }
  
  // Specific recommendations based on issue types
  if (issues.some(issue => issue.title.includes('Missing'))) {
    recommendations.push('📝 Consider implementing required field validation for new entries')
  }
  
  if (issues.some(issue => issue.title.includes('Duplicate'))) {
    recommendations.push('🔍 Implement duplicate detection during data entry')
  }
  
  if (issues.some(issue => issue.title.includes('Invalid'))) {
    recommendations.push('✅ Add input validation to prevent invalid data entry')
  }
  
  if (issues.some(issue => issue.title.includes('Inconsistent'))) {
    recommendations.push('🔧 Standardize data entry processes and formats')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✨ Data quality is excellent! Continue monitoring regularly')
  }
  
  return recommendations
}
