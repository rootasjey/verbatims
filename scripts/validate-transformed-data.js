#!/usr/bin/env node

/**
 * Validation Script for Transformed Reference Data
 * Tests the transformed Firebase data against our validation rules
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { DataValidator } from '../server/utils/data-validation.js'

async function validateTransformedData() {
  try {
    console.log('🔍 Validating transformed reference data...\n')
    
    // Read transformed data
    const transformedPath = join(process.cwd(), 'server/database/backups/transformed-references.json')
    const transformedData = JSON.parse(readFileSync(transformedPath, 'utf-8'))
    
    console.log('📊 Data Overview:')
    console.log(`- Total references: ${transformedData.data.length}`)
    console.log(`- Transformation errors: ${transformedData.metadata.errors}`)
    console.log(`- Transformation warnings: ${transformedData.metadata.warnings}`)
    console.log()
    
    // Run validation
    const validator = new DataValidator()
    const validationResult = validator.validateReferences(transformedData.data)
    
    console.log('✅ Validation Results:')
    console.log(`- Status: ${validationResult.isValid ? '✅ VALID' : '❌ INVALID'}`)
    console.log(`- Validation errors: ${validationResult.errorCount}`)
    console.log(`- Validation warnings: ${validationResult.warningCount}`)
    console.log()
    
    // Show errors if any
    if (validationResult.errors.length > 0) {
      console.log('❌ Validation Errors:')
      validationResult.errors.slice(0, 10).forEach((error, index) => {
        console.log(`${index + 1}. ${error}`)
      })
      if (validationResult.errors.length > 10) {
        console.log(`... and ${validationResult.errors.length - 10} more errors`)
      }
      console.log()
    }
    
    // Show warnings if any
    if (validationResult.warnings.length > 0) {
      console.log('⚠️  Validation Warnings:')
      validationResult.warnings.slice(0, 10).forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`)
      })
      if (validationResult.warnings.length > 10) {
        console.log(`... and ${validationResult.warnings.length - 10} more warnings`)
      }
      console.log()
    }
    
    // Generate detailed validation report
    const report = validator.generateReport()
    const reportPath = join(process.cwd(), 'server/database/backups/references/references-validation-report-' + new Date().toISOString().replace(/[:.]/g, '-') + '.md')
    writeFileSync(reportPath, report)
    console.log(`📋 Detailed validation report saved to: ${reportPath}`)
    
    // Analyze data quality metrics
    console.log('\n📈 Data Quality Metrics:')
    analyzeDataQuality(transformedData.data)
    
    // Check readiness for import
    console.log('\n🚀 Import Readiness:')
    if (validationResult.isValid) {
      console.log('✅ Data is ready for import!')
      console.log('- All validation checks passed')
      console.log('- No critical errors found')
      if (validationResult.warningCount > 0) {
        console.log(`- ${validationResult.warningCount} warnings can be reviewed but don't block import`)
      }
    } else {
      console.log('❌ Data is NOT ready for import')
      console.log(`- ${validationResult.errorCount} critical errors must be fixed first`)
      console.log('- Please review and fix the errors before proceeding')
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message)
    process.exit(1)
  }
}

function analyzeDataQuality(references) {
  const metrics = {
    totalReferences: references.length,
    withDescription: 0,
    withImageUrl: 0,
    withReleaseDate: 0,
    byPrimaryType: {},
    byLanguage: {},
    averageDescriptionLength: 0,
    averageNameLength: 0
  }
  
  let totalDescriptionLength = 0
  let totalNameLength = 0
  
  references.forEach(ref => {
    // Count fields with data
    if (ref.description && ref.description.trim()) metrics.withDescription++
    if (ref.image_url && ref.image_url.trim()) metrics.withImageUrl++
    if (ref.release_date) metrics.withReleaseDate++
    
    // Track distributions
    if (ref.primary_type) {
      metrics.byPrimaryType[ref.primary_type] = (metrics.byPrimaryType[ref.primary_type] || 0) + 1
    }
    if (ref.original_language) {
      metrics.byLanguage[ref.original_language] = (metrics.byLanguage[ref.original_language] || 0) + 1
    }
    
    // Calculate lengths
    if (ref.description) totalDescriptionLength += ref.description.length
    if (ref.name) totalNameLength += ref.name.length
  })
  
  metrics.averageDescriptionLength = Math.round(totalDescriptionLength / metrics.withDescription) || 0
  metrics.averageNameLength = Math.round(totalNameLength / references.length)
  
  // Display metrics
  console.log(`- References with descriptions: ${metrics.withDescription}/${metrics.totalReferences} (${((metrics.withDescription/metrics.totalReferences)*100).toFixed(1)}%)`)
  console.log(`- References with images: ${metrics.withImageUrl}/${metrics.totalReferences} (${((metrics.withImageUrl/metrics.totalReferences)*100).toFixed(1)}%)`)
  console.log(`- References with release dates: ${metrics.withReleaseDate}/${metrics.totalReferences} (${((metrics.withReleaseDate/metrics.totalReferences)*100).toFixed(1)}%)`)
  console.log(`- References with IMDb IDs: ${metrics.withImdbId}/${metrics.totalReferences} (${((metrics.withImdbId/metrics.totalReferences)*100).toFixed(1)}%)`)
  console.log(`- Average name length: ${metrics.averageNameLength} characters`)
  console.log(`- Average description length: ${metrics.averageDescriptionLength} characters`)
  
  console.log('\n📚 Content Distribution:')
  Object.entries(metrics.byPrimaryType)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .forEach(([type, count]) => {
      const percentage = ((count / metrics.totalReferences) * 100).toFixed(1)
      console.log(`- ${type}: ${count} (${percentage}%)`)
    })
  
  console.log('\n🌍 Language Distribution:')
  Object.entries(metrics.byLanguage)
    .sort(([,a], [,b]) => b - a)
    .forEach(([lang, count]) => {
      const percentage = ((count / metrics.totalReferences) * 100).toFixed(1)
      console.log(`- ${lang}: ${count} (${percentage}%)`)
    })
}

// Run validation
validateTransformedData()
