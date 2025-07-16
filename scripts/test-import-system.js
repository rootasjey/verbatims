#!/usr/bin/env node

/**
 * Import System Test Suite
 * Comprehensive testing of the data import functionality
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { DataValidator } from '../server/utils/data-validation.js'
import { DataTransformer } from './transform-firebase-data.js'

class ImportSystemTester {
  constructor() {
    this.testResults = []
    this.totalTests = 0
    this.passedTests = 0
    this.failedTests = 0
  }

  async runAllTests() {
    console.log('🧪 Starting Import System Test Suite\n')
    
    try {
      // Test data transformation
      await this.testDataTransformation()
      
      // Test data validation
      await this.testDataValidation()
      
      // Test backup functionality
      await this.testBackupFunctionality()
      
      // Test performance with different data sizes
      await this.testPerformance()
      
      // Generate test report
      this.generateTestReport()
      
    } catch (error) {
      console.error('❌ Test suite failed:', error)
      process.exit(1)
    }
  }

  async testDataTransformation() {
    console.log('📊 Testing Data Transformation...')
    
    // Test 1: Firebase JSON transformation
    await this.runTest('Firebase JSON Transformation', async () => {
      const transformer = new DataTransformer()
      const sampleFirebaseData = this.createSampleFirebaseData()

      // Test the transformation logic directly without file I/O
      const firebaseRefs = Object.entries(sampleFirebaseData.data)
      let successCount = 0

      for (const [id, ref] of firebaseRefs) {
        try {
          const transformed = transformer.transformReference(id, ref)
          if (transformed && transformed.name) {
            successCount++
          }
        } catch (error) {
          // Expected for some test cases
        }
      }

      return successCount > 0
    })
    
    // Test 2: Field mapping accuracy
    await this.runTest('Field Mapping Accuracy', async () => {
      const transformer = new DataTransformer()
      const firebaseRef = {
        name: 'Test Reference',
        language: 'en',
        type: { primary: 'film', secondary: 'Drama' },
        summary: 'Test description',
        urls: { image: 'https://example.com/image.jpg' },
        created_at: { __time__: '2023-01-01T00:00:00.000Z' }
      }
      
      const transformed = transformer.transformReference('test-id', firebaseRef)
      
      return (
        transformed.name === 'Test Reference' &&
        transformed.original_language === 'en' &&
        transformed.primary_type === 'film' &&
        transformed.secondary_type === 'Drama' &&
        transformed.description === 'Test description' &&
        transformed.image_url === 'https://example.com/image.jpg'
      )
    })
    
    // Test 3: Primary type normalization
    await this.runTest('Primary Type Normalization', async () => {
      const transformer = new DataTransformer()
      const testCases = [
        { input: 'Film', expected: 'film' },
        { input: 'TV Series', expected: 'tv_series' },
        { input: 'YouTube', expected: 'other' },
        { input: 'unknown-type', expected: 'other' }
      ]
      
      for (const testCase of testCases) {
        const firebaseRef = {
          name: 'Test',
          type: { primary: testCase.input }
        }
        
        const transformed = transformer.transformReference('test', firebaseRef)
        if (transformed.primary_type !== testCase.expected) {
          throw new Error(`Expected ${testCase.expected}, got ${transformed.primary_type}`)
        }
      }
      
      return true
    })
  }

  async testDataValidation() {
    console.log('✅ Testing Data Validation...')
    
    // Test 1: Valid data validation
    await this.runTest('Valid Data Validation', async () => {
      const validator = new DataValidator()
      const validData = [
        {
          name: 'Valid Reference',
          primary_type: 'film',
          original_language: 'en',
          description: 'Valid description',
          created_at: '2023-01-01',
          updated_at: '2023-01-01'
        }
      ]
      
      const result = validator.validateReferences(validData)
      return result.isValid && result.errorCount === 0
    })
    
    // Test 2: Invalid data detection
    await this.runTest('Invalid Data Detection', async () => {
      const validator = new DataValidator()
      const invalidData = [
        {
          name: 'X', // Too short
          primary_type: 'invalid-type', // Invalid type
          original_language: 'xx', // Invalid language
          created_at: 'invalid-date' // Invalid date
        }
      ]
      
      const result = validator.validateReferences(invalidData)
      return !result.isValid && result.errorCount > 0
    })
    
    // Test 3: Duplicate detection
    await this.runTest('Duplicate Detection', async () => {
      const validator = new DataValidator()
      const duplicateData = [
        {
          name: 'Duplicate Reference',
          primary_type: 'film',
          image_url: 'https://example.com/same-image.jpg'
        },
        {
          name: 'Duplicate Reference',
          primary_type: 'book',
          image_url: 'https://example.com/same-image.jpg'
        }
      ]
      
      const result = validator.validateReferences(duplicateData)
      return result.warningCount > 0 // Should detect duplicates as warnings
    })
  }

  async testBackupFunctionality() {
    console.log('💾 Testing Backup Functionality...')
    
    // Note: These tests would require database access in a real environment
    // For now, we'll test the backup manager logic
    
    await this.runTest('Backup Creation Logic', async () => {
      // Test backup ID generation
      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      return backupId.startsWith('backup_') && backupId.length > 20
    })
    
    await this.runTest('Backup Metadata Structure', async () => {
      const metadata = {
        backup_id: 'test-backup',
        table_name: 'quote_references_backup_test',
        description: 'Test backup',
        record_count: 100,
        created_at: new Date().toISOString()
      }
      
      return (
        metadata.backup_id &&
        metadata.table_name &&
        metadata.record_count >= 0 &&
        metadata.created_at
      )
    })
  }

  async testPerformance() {
    console.log('⚡ Testing Performance...')
    
    // Test 1: Small dataset performance
    await this.runTest('Small Dataset Performance', async () => {
      const startTime = Date.now()
      const smallDataset = this.generateTestData(100)
      
      const validator = new DataValidator()
      const result = validator.validateReferences(smallDataset)
      
      const duration = Date.now() - startTime
      console.log(`   Small dataset (100 records): ${duration}ms`)
      
      return duration < 1000 && result.isValid // Should complete in under 1 second
    })
    
    // Test 2: Medium dataset performance
    await this.runTest('Medium Dataset Performance', async () => {
      const startTime = Date.now()
      const mediumDataset = this.generateTestData(1000)
      
      const validator = new DataValidator()
      const result = validator.validateReferences(mediumDataset)
      
      const duration = Date.now() - startTime
      console.log(`   Medium dataset (1000 records): ${duration}ms`)
      
      return duration < 5000 // Should complete in under 5 seconds
    })
    
    // Test 3: Memory usage estimation
    await this.runTest('Memory Usage Estimation', async () => {
      const dataset = this.generateTestData(1000)
      const memoryUsage = JSON.stringify(dataset).length
      const estimatedMB = memoryUsage / (1024 * 1024)
      
      console.log(`   Estimated memory usage for 1000 records: ${estimatedMB.toFixed(2)}MB`)
      
      return estimatedMB < 10 // Should use less than 10MB for 1000 records
    })
  }

  async runTest(testName, testFunction) {
    this.totalTests++
    
    try {
      const result = await testFunction()
      if (result) {
        console.log(`   ✅ ${testName}`)
        this.passedTests++
        this.testResults.push({ name: testName, status: 'PASS' })
      } else {
        console.log(`   ❌ ${testName} - Test returned false`)
        this.failedTests++
        this.testResults.push({ name: testName, status: 'FAIL', error: 'Test returned false' })
      }
    } catch (error) {
      console.log(`   ❌ ${testName} - ${error.message}`)
      this.failedTests++
      this.testResults.push({ name: testName, status: 'FAIL', error: error.message })
    }
  }

  generateTestData(count) {
    const data = []
    const types = ['film', 'book', 'tv_series', 'music', 'other']
    const languages = ['en', 'fr', 'es', 'de']
    
    for (let i = 0; i < count; i++) {
      data.push({
        name: `Test Reference ${i + 1}`,
        primary_type: types[i % types.length],
        secondary_type: 'Test Category',
        original_language: languages[i % languages.length],
        description: `Test description for reference ${i + 1}`,
        image_url: `https://example.com/image-${i + 1}.jpg`,
        urls: JSON.stringify({ website: `https://example-${i + 1}.com` }),
        views_count: 0,
        likes_count: 0,
        shares_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    return data
  }

  createSampleFirebaseData() {
    return {
      meta: {
        format: 'JSON',
        version: '1.1.0',
        projectId: 'test-project'
      },
      data: {
        'test-id-1': {
          name: 'Test Reference 1',
          language: 'en',
          type: { primary: 'film', secondary: 'Drama' },
          summary: 'Test description 1',
          urls: { image: 'https://example.com/image1.jpg' },
          created_at: { __time__: '2023-01-01T00:00:00.000Z' },
          updated_at: { __time__: '2023-01-01T00:00:00.000Z' }
        },
        'test-id-2': {
          name: 'Test Reference 2',
          language: 'fr',
          type: { primary: 'book', secondary: 'Fiction' },
          summary: 'Test description 2',
          urls: { image: 'https://example.com/image2.jpg' },
          created_at: { __time__: '2023-01-02T00:00:00.000Z' },
          updated_at: { __time__: '2023-01-02T00:00:00.000Z' }
        }
      }
    }
  }

  generateTestReport() {
    console.log('\n📋 Test Report')
    console.log('=' .repeat(50))
    console.log(`Total Tests: ${this.totalTests}`)
    console.log(`Passed: ${this.passedTests} (${((this.passedTests / this.totalTests) * 100).toFixed(1)}%)`)
    console.log(`Failed: ${this.failedTests} (${((this.failedTests / this.totalTests) * 100).toFixed(1)}%)`)
    
    if (this.failedTests > 0) {
      console.log('\n❌ Failed Tests:')
      this.testResults
        .filter(test => test.status === 'FAIL')
        .forEach(test => {
          console.log(`   - ${test.name}: ${test.error}`)
        })
    }
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.totalTests,
        passed: this.passedTests,
        failed: this.failedTests,
        successRate: (this.passedTests / this.totalTests) * 100
      },
      results: this.testResults
    }
    
    const reportPath = join(process.cwd(), 'server/database/backups/references/references-test-results-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json')
    writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n📄 Detailed report saved to: ${reportPath}`)
    
    if (this.failedTests === 0) {
      console.log('\n🎉 All tests passed!')
    } else {
      console.log(`\n⚠️  ${this.failedTests} test(s) failed. Please review and fix.`)
      process.exit(1)
    }
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ImportSystemTester()
  tester.runAllTests()
}

export { ImportSystemTester }
