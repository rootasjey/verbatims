/**
 * References Transformer
 * Specialized transformer for quote references migration with
 * references-specific transformation logic and field mappings.
 */

import { BaseTransformer } from './BaseTransformer.js'

export class ReferencesTransformer extends BaseTransformer {
  constructor() {
    super('references')
    
    // Primary type mapping from Firebase to SQL schema
    this.primaryTypeMapping = {
      'movie': 'film',
      'movies': 'film',
      'cinema': 'film',
      'film': 'film',
      'tv': 'tv_series',
      'television': 'tv_series',
      'tv_series': 'tv_series',
      'series': 'tv_series',
      'show': 'tv_series',
      'book': 'book',
      'books': 'book',
      'novel': 'book',
      'literature': 'book',
      'music': 'music',
      'song': 'music',
      'album': 'music',
      'track': 'music',
      'speech': 'speech',
      'talk': 'speech',
      'lecture': 'speech',
      'podcast': 'podcast',
      'podcasts': 'podcast',
      'interview': 'interview',
      'interviews': 'interview',
      'documentary': 'documentary',
      'documentaries': 'documentary',
      'doc': 'documentary',
      'media_stream': 'media_stream',
      'stream': 'media_stream',
      'streaming': 'media_stream',
      'youtube': 'media_stream',
      'video': 'media_stream',
      'writings': 'writings',
      'writing': 'writings',
      'article': 'writings',
      'essay': 'writings',
      'blog': 'writings',
      'video_game': 'video_game',
      'videogame': 'video_game',
      'game': 'video_game',
      'gaming': 'video_game',
      'other': 'other'
    }

    this.validPrimaryTypes = [
      'film', 'book', 'tv_series', 'music', 'speech', 'podcast',
      'interview', 'documentary', 'media_stream', 'writings',
      'video_game', 'other'
    ]
  }

  /**
   * Custom transformation logic for references
   */
  async transformRecordCustom(firebaseId, firebaseRecord, sqlRecord) {
    // Normalize primary type
    sqlRecord.primary_type = this.normalizePrimaryType(firebaseRecord.type?.primary || 'other')
    
    // Transform dates
    sqlRecord.release_date = this.transformDate(firebaseRecord.release?.original)
    sqlRecord.created_at = this.transformDate(firebaseRecord.created_at)
    sqlRecord.updated_at = this.transformDate(firebaseRecord.updated_at)
    
    // Transform URLs object
    sqlRecord.urls = this.transformUrls(firebaseRecord.urls || {})
    
    // Handle image URL (common issue in Firebase data)
    sqlRecord.image_url = this.transformImageUrl(firebaseRecord.urls?.image || firebaseRecord.urls?.imageName)
    
    // Ensure required fields have values
    sqlRecord.name = (firebaseRecord.name || '').trim().substring(0, 200)
    sqlRecord.original_language = firebaseRecord.language || 'en'
    sqlRecord.description = firebaseRecord.summary || ''
    sqlRecord.secondary_type = firebaseRecord.type?.secondary || ''
    
    // Set default values for counters
    sqlRecord.views_count = 0
    sqlRecord.likes_count = 0
    sqlRecord.shares_count = 0
    
    return sqlRecord
  }

  /**
   * Normalize primary type using mapping
   */
  normalizePrimaryType(primaryType) {
    if (!primaryType) return 'other'
    
    const normalized = primaryType.toString().toLowerCase().trim()
    const mapped = this.primaryTypeMapping[normalized]
    
    if (mapped && this.validPrimaryTypes.includes(mapped)) {
      return mapped
    }
    
    // If no mapping found, check if it's already a valid type
    if (this.validPrimaryTypes.includes(normalized)) {
      return normalized
    }
    
    this.warnings.push(`Unknown primary type "${primaryType}", defaulting to "other"`)
    return 'other'
  }

  /**
   * Transform date values (handles Firebase timestamp format)
   */
  transformDate(dateValue) {
    if (!dateValue) return null
    
    // Handle Firebase timestamp objects
    if (dateValue._seconds) {
      return new Date(dateValue._seconds * 1000).toISOString()
    }
    
    // Handle string dates
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue)
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }
    }
    
    // Handle numeric timestamps
    if (typeof dateValue === 'number') {
      const date = new Date(dateValue)
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }
    }
    
    return null
  }

  /**
   * Transform URLs object to JSON string
   */
  transformUrls(urlsObject) {
    if (!urlsObject || typeof urlsObject !== 'object') {
      return '[]'
    }
    
    // Convert URLs object to array format for consistency
    const urlsArray = []
    
    Object.entries(urlsObject).forEach(([key, value]) => {
      if (value && typeof value === 'string' && value.trim()) {
        // Skip image URLs as they're handled separately
        if (key !== 'image' && key !== 'imageName') {
          urlsArray.push({
            type: key,
            url: value.trim()
          })
        }
      }
    })
    
    return JSON.stringify(urlsArray)
  }

  /**
   * Extract IMDB ID from URL
   */
  extractImdbId(imdbUrl) {
    if (!imdbUrl) return null
    
    // Handle direct IMDB ID
    if (/^tt\d{7,}$/.test(imdbUrl)) {
      return imdbUrl
    }
    
    // Extract from IMDB URL
    const match = imdbUrl.match(/\/title\/(tt\d{7,})\//i)
    return match ? match[1] : null
  }

  /**
   * Extract Spotify ID from URL
   */
  extractSpotifyId(spotifyUrl) {
    if (!spotifyUrl) return null
    
    // Handle direct Spotify ID
    if (/^[a-zA-Z0-9]{22}$/.test(spotifyUrl)) {
      return spotifyUrl
    }
    
    // Extract from Spotify URL
    const match = spotifyUrl.match(/\/(?:track|album|playlist)\/([a-zA-Z0-9]{22})/i)
    return match ? match[1] : null
  }

  /**
   * Transform image URL (handle common Firebase storage issues)
   */
  transformImageUrl(imageValue) {
    if (!imageValue) return ''
    
    const imageStr = imageValue.toString().trim()
    
    // If it's already a valid URL, return as-is
    if (imageStr.startsWith('http://') || imageStr.startsWith('https://')) {
      return imageStr
    }
    
    // If it's just a filename, it's likely from Firebase storage
    // Log as warning since these need to be handled separately
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(imageStr)) {
      this.warnings.push(`Image filename detected (needs Firebase storage URL): ${imageStr}`)
      return imageStr // Keep the filename for now
    }
    
    return imageStr
  }

  /**
   * Generate CSV output for references
   */
  async generateCSV(data, outputPath) {
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
    
    const { writeFileSync } = await import('fs')
    writeFileSync(outputPath, csvContent)
    this.log(`CSV file generated: ${outputPath}`)
  }

  /**
   * Generate SQL INSERT statements for references
   */
  async generateSQL(data, outputPath) {
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
    
    sqlStatements.push('')
    sqlStatements.push('COMMIT;')
    
    const { writeFileSync } = await import('fs')
    writeFileSync(outputPath, sqlStatements.join('\n'))
    this.log(`SQL file generated: ${outputPath}`)
  }

  /**
   * Escape SQL string values
   */
  escapeSql(value) {
    if (!value) return ''
    return String(value).replace(/'/g, "''")
  }
}
