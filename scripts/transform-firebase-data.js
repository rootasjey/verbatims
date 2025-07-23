#!/usr/bin/env node

/**
 * Firebase to SQL Data Transformation Script
 * Transforms Firebase JSON backup to SQL-compatible format for quote_references table
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Primary type normalization mapping
const PRIMARY_TYPE_MAPPING = {
  // Film and movie content
  'Film': 'film', 'film': 'film', 'Movie': 'film',
  'Film series': 'film',

  // TV series and shows
  'TV series': 'tv_series', 'TV Series': 'tv_series', 'tv_series': 'tv_series',
  'TV Show': 'tv_series', 'TV show': 'tv_series', 'Streaming TV series': 'tv_series',
  'Animated series': 'tv_series', 'Animated TV series': 'tv_series', 'TV miniseries': 'tv_series',

  // Books and literature
  'Book': 'book', 'book': 'book', 'novel': 'book', 'Novel series': 'book',

  // Media streaming content
  'YouTube': 'media_stream', 'YouTube Channel': 'media_stream', 'YouTube channel': 'media_stream', 'YouTuber': 'media_stream',
  'Twitch': 'media_stream', 'Live stream': 'media_stream', 'Radio show': 'media_stream',
  'Content production': 'media_stream', 'Platform': 'media_stream', 'Social Networking Platform': 'media_stream',
  'Theatrical production': 'media_stream', 'video': 'media_stream',

  // Video games
  'Video game': 'video_game', 'Video Game': 'video_game', 'Video games': 'video_game',

  // Written/published content
  'Poem': 'writings', 'Play': 'writings', 'play': 'writings', 'article': 'writings',
  'paper': 'writings', 'website': 'writings', 'post': 'writings', 'Letter': 'writings',
  'Newspaper': 'writings', 'Daily newspaper': 'writings',

  // Music content
  'music': 'music', 'Music': 'music',

  // Audio content
  'Podcast': 'podcast',

  // Speech and presentations
  'Conference': 'speech', 'Public session': 'speech',

  // Interviews
  'Interview': 'interview',

  // Other/miscellaneous
  'Application': 'other', 'Event': 'other', 'Online Shop': 'other',
  'Community': 'other', 'Company': 'other', 'other': 'other'
}

// Valid primary types for SQL schema
const VALID_PRIMARY_TYPES = ['film', 'book', 'tv_series', 'music', 'speech', 'podcast', 'interview', 'documentary', 'media_stream', 'writings', 'video_game', 'other']

class DataTransformer {
  constructor() {
    this.transformationLog = []
    this.errors = []
    this.warnings = []
  }

  log(message, type = 'info') {
    const entry = { timestamp: new Date().toISOString(), type, message }
    this.transformationLog.push(entry)
    console.log(`[${type.toUpperCase()}] ${message}`)
  }

  transformFirebaseData(inputPath, outputPath) {
    try {
      this.log('Starting Firebase data transformation...')
      
      // Read Firebase backup
      const backup = JSON.parse(readFileSync(inputPath, 'utf-8'))
      const firebaseReferences = backup.data || {}
      
      this.log(`Found ${Object.keys(firebaseReferences).length} references to transform`)
      
      // Transform each reference
      const transformedReferences = []
      let successCount = 0
      let errorCount = 0
      
      Object.entries(firebaseReferences).forEach(([firebaseId, firebaseRef]) => {
        try {
          const transformed = this.transformReference(firebaseId, firebaseRef)
          if (transformed) {
            transformedReferences.push(transformed)
            successCount++
          }
        } catch (error) {
          this.log(`Error transforming reference ${firebaseId}: ${error.message}`, 'error')
          this.errors.push({ firebaseId, error: error.message })
          errorCount++
        }
      })
      
      // Generate output
      const output = {
        metadata: {
          source: 'Firebase backup',
          sourceFile: inputPath,
          transformedAt: new Date().toISOString(),
          totalReferences: Object.keys(firebaseReferences).length,
          successfulTransformations: successCount,
          errors: errorCount,
          warnings: this.warnings.length
        },
        transformationLog: this.transformationLog,
        errors: this.errors,
        warnings: this.warnings,
        data: transformedReferences
      }
      
      // Write output files
      writeFileSync(outputPath, JSON.stringify(output, null, 2))
      
      // Also create a CSV version for easy import
      const csvPath = outputPath.replace('.json', '.csv')
      this.generateCSV(transformedReferences, csvPath)
      
      // Generate SQL INSERT statements
      const sqlPath = outputPath.replace('.json', '.sql')
      this.generateSQL(transformedReferences, sqlPath)
      
      this.log(`Transformation complete!`)
      this.log(`- JSON output: ${outputPath}`)
      this.log(`- CSV output: ${csvPath}`)
      this.log(`- SQL output: ${sqlPath}`)
      this.log(`- Success: ${successCount}, Errors: ${errorCount}, Warnings: ${this.warnings.length}`)
      
      return output
      
    } catch (error) {
      this.log(`Fatal error during transformation: ${error.message}`, 'error')
      throw error
    }
  }

  transformReference(firebaseId, firebaseRef) {
    // Validate required fields
    if (!firebaseRef.name || firebaseRef.name.trim().length < 2) {
      throw new Error('Invalid or missing name')
    }
    
    if (firebaseRef.name.length > 200) {
      this.warnings.push({ firebaseId, warning: `Name truncated from ${firebaseRef.name.length} to 200 characters` })
    }
    
    // Transform primary type
    let primaryType = firebaseRef.type?.primary || ''
    if (!primaryType) {
      this.warnings.push({ firebaseId, warning: 'Missing primary type, defaulting to "other"' })
      primaryType = 'other'
    }
    
    const normalizedPrimaryType = PRIMARY_TYPE_MAPPING[primaryType] || 'other'
    if (!VALID_PRIMARY_TYPES.includes(normalizedPrimaryType)) {
      this.warnings.push({ firebaseId, warning: `Unknown primary type "${primaryType}", defaulting to "other"` })
      primaryType = 'other'
    } else {
      primaryType = normalizedPrimaryType
    }
    
    // Transform dates
    const releaseDate = this.transformDate(firebaseRef.release?.original)
    const createdAt = this.transformDate(firebaseRef.created_at)
    const updatedAt = this.transformDate(firebaseRef.updated_at)
    
    // Transform URLs object
    const urls = this.transformUrls(firebaseRef.urls || {})
    
    // Extract specific IDs from URLs
    const imdbId = this.extractImdbId(firebaseRef.urls?.imdb)
    const spotifyId = this.extractSpotifyId(firebaseRef.urls?.spotify)
    
    return {
      // Note: id will be auto-generated by database
      firebase_id: firebaseId, // Keep for reference
      name: firebaseRef.name.trim().substring(0, 200),
      original_language: firebaseRef.language || 'en',
      release_date: releaseDate,
      description: firebaseRef.summary || '',
      primary_type: primaryType,
      secondary_type: firebaseRef.type?.secondary || '',
      image_url: firebaseRef.urls?.image || '',
      urls: JSON.stringify(urls),
      views_count: 0,
      likes_count: 0,
      shares_count: 0,
      created_at: createdAt,
      updated_at: updatedAt
    }
  }

  transformDate(firebaseTimestamp) {
    if (!firebaseTimestamp) return null
    
    try {
      if (firebaseTimestamp.__time__) {
        return new Date(firebaseTimestamp.__time__).toISOString().split('T')[0]
      }
      if (typeof firebaseTimestamp === 'string') {
        return new Date(firebaseTimestamp).toISOString().split('T')[0]
      }
      if (typeof firebaseTimestamp === 'number') {
        return new Date(firebaseTimestamp).toISOString().split('T')[0]
      }
    } catch (error) {
      this.warnings.push({ warning: `Invalid date format: ${JSON.stringify(firebaseTimestamp)}` })
    }
    
    return null
  }

  transformUrls(firebaseUrls) {
    // Clean up URLs object, removing empty strings and normalizing structure
    const cleanUrls = {}
    
    Object.entries(firebaseUrls).forEach(([key, value]) => {
      if (value && typeof value === 'string' && value.trim() !== '') {
        cleanUrls[key] = value.trim()
      }
    })
    
    return cleanUrls
  }

  extractImdbId(imdbUrl) {
    if (!imdbUrl || typeof imdbUrl !== 'string') return null
    
    // Extract IMDb ID from URL patterns like:
    // https://www.imdb.com/title/tt1234567/
    const match = imdbUrl.match(/\/title\/(tt\d+)/)
    return match ? match[1] : null
  }

  extractSpotifyId(spotifyUrl) {
    if (!spotifyUrl || typeof spotifyUrl !== 'string') return null
    
    // Extract Spotify ID from URL patterns
    const match = spotifyUrl.match(/spotify\.com\/(?:track|album|playlist)\/([a-zA-Z0-9]+)/)
    return match ? match[1] : null
  }

  generateCSV(data, outputPath) {
    const headers = [
      'firebase_id', 'name', 'original_language', 'release_date', 'description',
      'primary_type', 'secondary_type', 'image_url', 'urls',
      'views_count', 'likes_count', 'shares_count', 'created_at', 'updated_at'
    ]
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header] || ''
        // Escape CSV values
        return `"${String(value).replace(/"/g, '""')}"`
      }).join(','))
    ].join('\n')
    
    writeFileSync(outputPath, csvContent)
    this.log(`CSV file generated: ${outputPath}`)
  }

  generateSQL(data, outputPath) {
    const sqlStatements = [
      '-- Firebase References Import',
      '-- Generated at: ' + new Date().toISOString(),
      '',
      'BEGIN TRANSACTION;',
      ''
    ]
    
    data.forEach(row => {
      const values = [
        `'${this.escapeSql(row.name)}'`,
        `'${row.original_language}'`,
        row.release_date ? `'${row.release_date}'` : 'NULL',
        `'${this.escapeSql(row.description)}'`,
        `'${row.primary_type}'`,
        `'${this.escapeSql(row.secondary_type)}'`,
        `'${this.escapeSql(row.image_url)}'`,
        `'${this.escapeSql(row.urls)}'`,
        row.views_count,
        row.likes_count,
        row.shares_count,
        `'${row.created_at}'`,
        `'${row.updated_at}'`
      ]
      
      sqlStatements.push(
        `INSERT INTO quote_references (name, original_language, release_date, description, primary_type, secondary_type, image_url, urls, views_count, likes_count, shares_count, created_at, updated_at) VALUES (${values.join(', ')});`
      )
    })
    
    sqlStatements.push('', 'COMMIT;')
    
    writeFileSync(outputPath, sqlStatements.join('\n'))
    this.log(`SQL file generated: ${outputPath}`)
  }

  escapeSql(str) {
    if (!str) return ''
    return String(str).replace(/'/g, "''")
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const transformer = new DataTransformer()
  const inputPath = join(process.cwd(), 'server/database/backups/references-1752639132.json')
  const outputPath = join(process.cwd(), 'server/database/backups/transformed-references.json')
  
  try {
    transformer.transformFirebaseData(inputPath, outputPath)
  } catch (error) {
    console.error('Transformation failed:', error)
    process.exit(1)
  }
}

export { DataTransformer }
