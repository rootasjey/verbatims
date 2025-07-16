#!/usr/bin/env node

/**
 * Schema Mapping Analysis: Firebase JSON to SQL Schema
 * Compares Firebase backup structure with current quote_references table schema
 */

import { readFileSync } from 'fs'
import { join } from 'path'

// Current SQL schema for quote_references table
const SQL_SCHEMA = {
  id: { type: 'INTEGER', constraints: 'PRIMARY KEY AUTOINCREMENT' },
  name: { type: 'TEXT', constraints: 'NOT NULL CHECK (length(name) >= 2 AND length(name) <= 200)' },
  original_language: { type: 'TEXT', constraints: 'DEFAULT \'en\'' },
  release_date: { type: 'DATE', constraints: '' },
  description: { type: 'TEXT', constraints: '' },
  primary_type: { type: 'TEXT', constraints: 'NOT NULL CHECK (primary_type IN (\'film\', \'book\', \'tv_series\', \'music\', \'speech\', \'podcast\', \'interview\', \'documentary\', \'media_stream\', \'writings\', \'video_game\', \'other\'))' },
  secondary_type: { type: 'TEXT', constraints: '' },
  image_url: { type: 'TEXT', constraints: '' },
  urls: { type: 'TEXT', constraints: 'DEFAULT \'[]\' CHECK (json_valid(urls))' },
  imdb_id: { type: 'TEXT', constraints: '' },
  isbn: { type: 'TEXT', constraints: '' },
  spotify_id: { type: 'TEXT', constraints: '' },
  views_count: { type: 'INTEGER', constraints: 'DEFAULT 0' },
  likes_count: { type: 'INTEGER', constraints: 'DEFAULT 0' },
  shares_count: { type: 'INTEGER', constraints: 'DEFAULT 0' },
  created_at: { type: 'DATETIME', constraints: 'DEFAULT CURRENT_TIMESTAMP' },
  updated_at: { type: 'DATETIME', constraints: 'DEFAULT CURRENT_TIMESTAMP' }
}

// Firebase to SQL field mappings
const FIELD_MAPPINGS = {
  // Direct mappings
  'name': 'name',
  'language': 'original_language',
  'summary': 'description',
  'type.primary': 'primary_type',
  'type.secondary': 'secondary_type',
  'urls.image': 'image_url',
  'created_at': 'created_at',
  'updated_at': 'updated_at',
  
  // Complex mappings requiring transformation
  'release.original': 'release_date', // Firebase timestamp to DATE
  'urls': 'urls', // Object to JSON string
  
  // Fields that need extraction/derivation
  'urls.imdb': 'imdb_id', // Extract from URL
  'urls.spotify': 'spotify_id', // Extract from URL
  // isbn: needs to be derived or left null
  
  // Default values for missing fields
  'views_count': 0,
  'likes_count': 0,
  'shares_count': 0
}

// Primary type normalization mapping
const PRIMARY_TYPE_MAPPING = {
  // Normalize inconsistent primary types
  'Film': 'film',
  'film': 'film',
  'Movie': 'film',
  'TV series': 'tv_series',
  'TV Series': 'tv_series',
  'tv_series': 'tv_series',
  'TV Show': 'tv_series',
  'TV show': 'tv_series',
  'Streaming TV series': 'tv_series',
  'Animated series': 'tv_series',
  'Animated TV series': 'tv_series',
  'TV miniseries': 'tv_series',
  'Book': 'book',
  'book': 'book',
  'novel': 'book',
  'Novel series': 'book',
  'YouTube': 'other',
  'YouTube Channel': 'other',
  'YouTube channel': 'other',
  'YouTuber': 'other',
  'Twitch': 'other',
  'video': 'other',
  'Video game': 'other',
  'Video Game': 'other',
  'Video games': 'other',
  'music': 'music',
  'Music': 'music',
  'Podcast': 'podcast',
  'Conference': 'speech',
  'Public session': 'speech',
  'Interview': 'interview',
  'Poem': 'other',
  'Play': 'other',
  'play': 'other',
  'post': 'other',
  'article': 'other',
  'paper': 'other',
  'website': 'other',
  'Application': 'other',
  'Platform': 'other',
  'Event': 'other',
  'Content production': 'other',
  'Online Shop': 'other',
  'Letter': 'other',
  'Newspaper': 'other',
  'Daily newspaper': 'other',
  'Theatrical production': 'other',
  'Community': 'other',
  'Live stream': 'other',
  'Social Networking Platform': 'other',
  'Film series': 'other',
  'Company': 'other',
  'Radio show': 'other',
  'other': 'other'
}

function analyzeSchemaMapping() {
  console.log('🔄 Analyzing Schema Mapping: Firebase JSON → SQL\n')
  
  // Read Firebase backup
  const backupPath = join(process.cwd(), 'server/database/backups/references-1752639132.json')
  const backup = JSON.parse(readFileSync(backupPath, 'utf-8'))
  const references = backup.data || {}
  
  console.log('📋 Field Mapping Analysis:\n')
  
  // Analyze each SQL field
  Object.entries(SQL_SCHEMA).forEach(([sqlField, sqlConfig]) => {
    console.log(`🔹 ${sqlField} (${sqlConfig.type})`)
    
    const mapping = Object.entries(FIELD_MAPPINGS).find(([, target]) => target === sqlField)
    
    if (mapping) {
      const [firebaseField] = mapping
      console.log(`   ✅ Maps from: ${firebaseField}`)
      
      // Analyze data availability
      const sampleValues = Object.values(references).slice(0, 5).map(ref => {
        return getNestedValue(ref, firebaseField)
      }).filter(v => v !== undefined && v !== null && v !== '')
      
      if (sampleValues.length > 0) {
        console.log(`   📊 Sample values: ${sampleValues.slice(0, 3).map(v => JSON.stringify(v)).join(', ')}`)
      } else {
        console.log(`   ⚠️  No sample values found`)
      }
    } else {
      console.log(`   ❌ No direct mapping found`)
      
      // Check if it's a default value
      if (typeof FIELD_MAPPINGS[sqlField] === 'number') {
        console.log(`   🔧 Will use default value: ${FIELD_MAPPINGS[sqlField]}`)
      }
    }
    console.log()
  })
  
  console.log('🏷️  Primary Type Normalization:\n')
  
  // Analyze primary types that need normalization
  const primaryTypes = new Set()
  Object.values(references).forEach(ref => {
    if (ref.type?.primary) {
      primaryTypes.add(ref.type.primary)
    }
  })
  
  const unmappedTypes = []
  Array.from(primaryTypes).sort().forEach(type => {
    const normalized = PRIMARY_TYPE_MAPPING[type]
    if (normalized) {
      console.log(`✅ "${type}" → "${normalized}"`)
    } else {
      console.log(`❌ "${type}" → UNMAPPED`)
      unmappedTypes.push(type)
    }
  })
  
  if (unmappedTypes.length > 0) {
    console.log(`\n⚠️  Unmapped primary types found: ${unmappedTypes.length}`)
    console.log('These will need to be handled in the transformation script.')
  }
  
  console.log('\n🔍 Data Quality Issues:\n')
  
  // Analyze potential data quality issues
  const issues = []
  Object.values(references).forEach((ref, index) => {
    const refId = Object.keys(references)[index]
    
    // Check for missing required fields
    if (!ref.name || ref.name.trim().length < 2) {
      issues.push(`${refId}: Invalid name "${ref.name}"`)
    }
    
    if (!ref.type?.primary) {
      issues.push(`${refId}: Missing primary type`)
    }
    
    // Check name length constraint
    if (ref.name && ref.name.length > 200) {
      issues.push(`${refId}: Name too long (${ref.name.length} chars)`)
    }
  })
  
  console.log(`Found ${issues.length} potential data quality issues:`)
  issues.slice(0, 10).forEach(issue => console.log(`- ${issue}`))
  if (issues.length > 10) {
    console.log(`... and ${issues.length - 10} more`)
  }
  
  console.log('\n📊 Transformation Summary:\n')
  console.log(`- Total references to migrate: ${Object.keys(references).length}`)
  console.log(`- Fields requiring transformation: ${Object.keys(FIELD_MAPPINGS).length}`)
  console.log(`- Primary types requiring normalization: ${Object.keys(PRIMARY_TYPE_MAPPING).length}`)
  console.log(`- Data quality issues: ${issues.length}`)
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object') {
      if (current[key] && current[key].__time__) {
        return current[key].__time__
      }
      return current[key]
    }
    return undefined
  }, obj)
}

// Run the analysis
analyzeSchemaMapping()
