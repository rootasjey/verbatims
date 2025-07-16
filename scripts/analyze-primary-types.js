#!/usr/bin/env node

/**
 * Analyze Primary Types Distribution
 * Analyzes the transformed references data to show distribution of primary types
 */

import { readFileSync } from 'fs'
import { join } from 'path'

function analyzePrimaryTypes() {
  try {
    // Read the transformed data
    const transformedPath = join(process.cwd(), 'server/database/backups/transformed-references.json')
    const transformedData = JSON.parse(readFileSync(transformedPath, 'utf-8'))
    
    console.log('=== PRIMARY TYPES DISTRIBUTION ANALYSIS ===\n')
    console.log(`Total references: ${transformedData.metadata.totalReferences}`)
    console.log(`Successful transformations: ${transformedData.metadata.successfulTransformations}`)
    console.log(`Warnings: ${transformedData.metadata.warnings}\n`)
    
    // Count primary types
    const primaryTypeCounts = {}
    const examplesByType = {}
    
    transformedData.data.forEach(ref => {
      const primaryType = ref.primary_type
      primaryTypeCounts[primaryType] = (primaryTypeCounts[primaryType] || 0) + 1
      
      // Store examples for each type (max 3)
      if (!examplesByType[primaryType]) {
        examplesByType[primaryType] = []
      }
      if (examplesByType[primaryType].length < 3) {
        examplesByType[primaryType].push(ref.name)
      }
    })
    
    // Sort by count (descending)
    const sortedTypes = Object.entries(primaryTypeCounts)
      .sort(([,a], [,b]) => b - a)
    
    console.log('PRIMARY TYPE DISTRIBUTION:')
    console.log('=' .repeat(50))
    
    sortedTypes.forEach(([type, count]) => {
      const percentage = ((count / transformedData.metadata.totalReferences) * 100).toFixed(1)
      console.log(`${type.toUpperCase().padEnd(15)} ${count.toString().padStart(3)} (${percentage}%)`)
      
      // Show examples
      if (examplesByType[type]) {
        examplesByType[type].forEach(example => {
          console.log(`  • ${example}`)
        })
      }
      console.log()
    })
    
    // Show new categories specifically
    const newCategories = ['media_stream', 'writings', 'video_game']
    const newCategoriesTotal = newCategories.reduce((sum, type) => sum + (primaryTypeCounts[type] || 0), 0)
    
    console.log('NEW CATEGORIES IMPACT:')
    console.log('=' .repeat(50))
    console.log(`Total references in new categories: ${newCategoriesTotal}`)
    console.log(`Percentage of total: ${((newCategoriesTotal / transformedData.metadata.totalReferences) * 100).toFixed(1)}%`)
    console.log(`Reduction in "other" category: ${newCategoriesTotal} references moved to specific categories\n`)
    
    newCategories.forEach(type => {
      if (primaryTypeCounts[type]) {
        console.log(`${type}: ${primaryTypeCounts[type]} references`)
      }
    })
    
  } catch (error) {
    console.error('Error analyzing primary types:', error.message)
    process.exit(1)
  }
}

// Run analysis
analyzePrimaryTypes()
