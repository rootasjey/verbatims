#!/usr/bin/env node

/**
 * Script to analyze Firebase JSON backup structure
 * Usage: node scripts/analyze-firebase-backup.js
 */

import { readFileSync } from 'fs'
import { join } from 'path'

const BACKUP_FILE = 'server/database/backups/references-1752639132.json'

function analyzeFirebaseBackup() {
  try {
    console.log('🔍 Analyzing Firebase backup structure...\n')
    
    // Read and parse the JSON file
    const filePath = join(process.cwd(), BACKUP_FILE)
    const rawData = readFileSync(filePath, 'utf-8')
    const backup = JSON.parse(rawData)
    
    console.log('📊 Backup Metadata:')
    console.log('- Format:', backup.meta?.format)
    console.log('- Version:', backup.meta?.version)
    console.log('- Project ID:', backup.meta?.projectId)
    console.log('- Resource Path:', backup.meta?.resourcePath?.join('/'))
    console.log('- Creation Time:', new Date(backup.meta?.creationTime * 1000).toISOString())
    console.log('- App:', backup.meta?.app)
    console.log()
    
    // Analyze the data structure
    const references = backup.data || {}
    const referenceIds = Object.keys(references)
    
    console.log('📈 Data Overview:')
    console.log('- Total References:', referenceIds.length)
    console.log()
    
    // Analyze field structure by examining all references
    const fieldAnalysis = {}
    const typeAnalysis = {}
    const languageDistribution = {}
    const primaryTypeDistribution = {}
    
    referenceIds.forEach(id => {
      const ref = references[id]
      
      // Track languages
      if (ref.language) {
        languageDistribution[ref.language] = (languageDistribution[ref.language] || 0) + 1
      }
      
      // Track primary types
      if (ref.type?.primary) {
        primaryTypeDistribution[ref.type.primary] = (primaryTypeDistribution[ref.type.primary] || 0) + 1
      }
      
      // Analyze all fields recursively
      analyzeFields(ref, '', fieldAnalysis, typeAnalysis)
    })
    
    console.log('🏷️  Field Analysis:')
    Object.entries(fieldAnalysis)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([field, count]) => {
        const percentage = ((count / referenceIds.length) * 100).toFixed(1)
        console.log(`- ${field}: ${count}/${referenceIds.length} (${percentage}%)`)
      })
    console.log()
    
    console.log('🔤 Data Types Found:')
    Object.entries(typeAnalysis)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([field, types]) => {
        console.log(`- ${field}: ${Array.from(types).join(', ')}`)
      })
    console.log()
    
    console.log('🌍 Language Distribution:')
    Object.entries(languageDistribution)
      .sort(([, a], [, b]) => b - a)
      .forEach(([lang, count]) => {
        const percentage = ((count / referenceIds.length) * 100).toFixed(1)
        console.log(`- ${lang}: ${count} (${percentage}%)`)
      })
    console.log()
    
    console.log('📚 Primary Type Distribution:')
    Object.entries(primaryTypeDistribution)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        const percentage = ((count / referenceIds.length) * 100).toFixed(1)
        console.log(`- ${type}: ${count} (${percentage}%)`)
      })
    console.log()
    
    // Show sample reference for structure understanding
    const sampleId = referenceIds[0]
    const sampleRef = references[sampleId]
    console.log('📋 Sample Reference Structure:')
    console.log('ID:', sampleId)
    console.log(JSON.stringify(sampleRef, null, 2))
    
  } catch (error) {
    console.error('❌ Error analyzing backup:', error.message)
    process.exit(1)
  }
}

function analyzeFields(obj, prefix, fieldAnalysis, typeAnalysis) {
  if (obj === null || obj === undefined) return
  
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    // Handle special Firebase timestamp objects
    if (obj.__time__) {
      const fieldName = prefix || 'timestamp'
      fieldAnalysis[fieldName] = (fieldAnalysis[fieldName] || 0) + 1
      if (!typeAnalysis[fieldName]) typeAnalysis[fieldName] = new Set()
      typeAnalysis[fieldName].add('firebase_timestamp')
      return
    }
    
    // Recursively analyze object properties
    Object.keys(obj).forEach(key => {
      const fieldName = prefix ? `${prefix}.${key}` : key
      fieldAnalysis[fieldName] = (fieldAnalysis[fieldName] || 0) + 1
      
      if (!typeAnalysis[fieldName]) typeAnalysis[fieldName] = new Set()
      
      const value = obj[key]
      if (value === null) {
        typeAnalysis[fieldName].add('null')
      } else if (Array.isArray(value)) {
        typeAnalysis[fieldName].add('array')
      } else if (typeof value === 'object' && value.__time__) {
        typeAnalysis[fieldName].add('firebase_timestamp')
      } else if (typeof value === 'object') {
        typeAnalysis[fieldName].add('object')
        analyzeFields(value, fieldName, fieldAnalysis, typeAnalysis)
      } else {
        typeAnalysis[fieldName].add(typeof value)
      }
    })
  }
}

// Run the analysis
analyzeFirebaseBackup()
