#!/usr/bin/env node

/**
 * Export-Import Round-Trip Test Suite
 * Tests the complete export → import → verify integrity workflow
 * to ensure compatibility between current export and import systems
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { DataValidator } from '../server/utils/data-validation.js'

class ExportImportTester {
  constructor() {
    this.testResults = []
    this.totalTests = 0
    this.passedTests = 0
    this.failedTests = 0
  }

  async runAllTests() {
    console.log('🔄 Starting Export-Import Round-Trip Test Suite\n')
    
    try {
      // Test 1: JSON format round-trip
      await this.testJSONRoundTrip()
      
      // Test 2: CSV format round-trip
      await this.testCSVRoundTrip()
      
      // Test 3: Schema compatibility
      await this.testSchemaCompatibility()
      
      // Test 4: Field mapping validation
      await this.testFieldMapping()
      
      // Test 5: URLs field format handling
      await this.testURLsFieldHandling()
      
      // Generate test report
      this.generateTestReport()
      
    } catch (error) {
      console.error('❌ Test suite failed:', error)
      process.exit(1)
    }
  }

  async testJSONRoundTrip() {
    console.log('📄 Testing JSON Round-Trip Compatibility...')

    // Test 1: Export format JSON validation
    await this.runTest('Export JSON Format Validation', async () => {
      const exportFormatData = this.createExportFormatData()
      const validator = new DataValidator()
      const result = validator.validateReferences(exportFormatData)

      return result.isValid && result.errorCount === 0
    })

    // Test 2: Missing optional fields handling
    await this.runTest('Missing Optional Fields Handling', async () => {
      const minimalExportData = [{
        id: 1,
        name: 'Test Reference',
        primary_type: 'film',
        views_count: 0,
        likes_count: 0,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
        // Missing: original_language, shares_count, secondary_type, description, etc.
      }]
      
      const validator = new DataValidator()
      const result = validator.validateReferences(minimalExportData)
      
      return result.isValid
    })

    // Test 3: URLs array format handling
    await this.runTest('URLs Array Format Handling', async () => {
      const dataWithUrlsArray = [{
        id: 1,
        name: 'Test Reference',
        primary_type: 'film',
        urls: ['https://example.com', 'https://imdb.com/title/123'],
        views_count: 0,
        likes_count: 0,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      }]
      
      const validator = new DataValidator()
      const result = validator.validateReferences(dataWithUrlsArray)
      
      return result.isValid && result.errorCount === 0
    })
  }

  async testCSVRoundTrip() {
    console.log('📊 Testing CSV Round-Trip Compatibility...')

    // Test 1: CSV parsing with export format
    await this.runTest('CSV Export Format Parsing', async () => {
      const csvData = this.createExportFormatCSV()
      
      // Simulate the CSV parsing logic from the import API
      const lines = csvData.trim().split('\n')
      const headers = this.parseCSVLine(lines[0])
      
      const expectedHeaders = [
        'id', 'name', 'primary_type', 'secondary_type', 'description',
        'release_date', 'image_url', 'urls', 'views_count', 'likes_count', 'created_at', 'updated_at'
      ]
      
      return headers.length > 0 && expectedHeaders.some(h => headers.includes(h))
    })

    // Test 2: CSV field type conversion
    await this.runTest('CSV Field Type Conversion', async () => {
      const csvLine = '"1","Test Film","film","Drama","A test film","2023-01-01","https://example.com/image.jpg","[""https://example.com""]","100","50","2023-01-01T00:00:00.000Z","2023-01-01T00:00:00.000Z"'
      const headers = ['id', 'name', 'primary_type', 'secondary_type', 'description', 'release_date', 'image_url', 'urls', 'views_count', 'likes_count', 'created_at', 'updated_at']
      
      const values = this.parseCSVLine(csvLine)
      const obj = {}
      
      headers.forEach((header, index) => {
        const value = values[index] || null
        
        if (header === 'urls' && value && value !== '{}' && value !== '') {
          try {
            obj[header] = JSON.parse(value)
          } catch {
            obj[header] = value
          }
        } else if (['views_count', 'likes_count'].includes(header)) {
          obj[header] = value && value !== '' ? parseInt(value, 10) : 0
        } else {
          obj[header] = value
        }
      })
      
      return obj.views_count === 100 && obj.likes_count === 50 && Array.isArray(obj.urls)
    })
  }

  async testSchemaCompatibility() {
    console.log('🔍 Testing Schema Compatibility...')

    // Test 1: All export fields are handled by import
    await this.runTest('Export Fields Import Compatibility', async () => {
      const exportData = this.createCompleteExportData()
      const validator = new DataValidator()
      const result = validator.validateReferences(exportData)
      
      // Should have no critical errors, only warnings for missing optional fields
      return result.errorCount === 0
    })

    // Test 2: Required fields validation
    await this.runTest('Required Fields Validation', async () => {
      const invalidData = [{
        id: 1,
        // Missing required 'name' field
        primary_type: 'film',
        views_count: 0,
        likes_count: 0
      }]
      
      const validator = new DataValidator()
      const result = validator.validateReferences(invalidData)
      
      return !result.isValid && result.errorCount > 0
    })
  }

  async testFieldMapping() {
    console.log('🗺️ Testing Field Mapping...')

    // Test 1: Field name consistency
    await this.runTest('Field Name Consistency', async () => {
      const exportData = [{
        id: 1,
        name: 'Test Reference',
        primary_type: 'film',
        secondary_type: 'Drama',
        description: 'Test description',
        release_date: '2023-01-01',
        image_url: 'https://example.com/image.jpg',
        urls: ['https://example.com'],
        views_count: 100,
        likes_count: 50,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      }]
      
      const validator = new DataValidator()
      const result = validator.validateReferences(exportData)

      return result.isValid && result.errorCount === 0
    })
  }

  async testURLsFieldHandling() {
    console.log('🔗 Testing URLs Field Format Handling...')

    // Test 1: Array format (export format)
    await this.runTest('URLs Array Format', async () => {
      const data = [{ 
        name: 'Test', 
        primary_type: 'film', 
        urls: ['https://example.com', 'https://imdb.com'] 
      }]
      const validator = new DataValidator()
      const result = validator.validateReferences(data)
      return result.isValid
    })

    // Test 2: JSON string format (legacy format)
    await this.runTest('URLs JSON String Format', async () => {
      const data = [{ 
        name: 'Test', 
        primary_type: 'film', 
        urls: '{"website": "https://example.com", "imdb": "https://imdb.com"}' 
      }]
      const validator = new DataValidator()
      const result = validator.validateReferences(data)
      return result.isValid
    })

    // Test 3: Object format (direct object)
    await this.runTest('URLs Object Format', async () => {
      const data = [{ 
        name: 'Test', 
        primary_type: 'film', 
        urls: { website: 'https://example.com', imdb: 'https://imdb.com' }
      }]
      const validator = new DataValidator()
      const result = validator.validateReferences(data)
      return result.isValid
    })
  }

  // Helper methods
  createExportFormatData() {
    return [
      {
        id: 1,
        name: 'The Matrix',
        primary_type: 'film',
        secondary_type: 'Science Fiction',
        description: 'A computer hacker learns from mysterious rebels about the true nature of his reality.',
        release_date: '1999-03-31',
        image_url: 'https://example.com/matrix.jpg',
        urls: ['https://imdb.com/title/tt0133093', 'https://example.com/matrix'],
        views_count: 1500,
        likes_count: 250,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
        quotes_count: 15
      },
      {
        id: 2,
        name: 'Inception',
        primary_type: 'film',
        secondary_type: 'Thriller',
        description: 'A thief who steals corporate secrets through dream-sharing technology.',
        release_date: '2010-07-16',
        image_url: 'https://example.com/inception.jpg',
        urls: ['https://imdb.com/title/tt1375666'],
        views_count: 2000,
        likes_count: 400,
        created_at: '2023-01-02T00:00:00.000Z',
        updated_at: '2023-01-02T00:00:00.000Z',
        quotes_count: 22
      }
    ]
  }

  createCompleteExportData() {
    return [{
      id: 1,
      name: 'Complete Reference',
      primary_type: 'film',
      secondary_type: 'Drama',
      description: 'A complete reference with all export fields',
      release_date: '2023-01-01',
      image_url: 'https://example.com/image.jpg',
      urls: ['https://example.com', 'https://imdb.com'],
      views_count: 100,
      likes_count: 50,
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-01T00:00:00.000Z',
      quotes_count: 10
    }]
  }

  createExportFormatCSV() {
    return `id,name,primary_type,secondary_type,description,release_date,image_url,urls,views_count,likes_count,created_at,updated_at
1,"The Matrix","film","Science Fiction","A computer hacker learns about reality","1999-03-31","https://example.com/matrix.jpg","[""https://imdb.com/title/tt0133093""]",1500,250,"2023-01-01T00:00:00.000Z","2023-01-01T00:00:00.000Z"
2,"Inception","film","Thriller","A thief in dreams","2010-07-16","https://example.com/inception.jpg","[""https://imdb.com/title/tt1375666""]",2000,400,"2023-01-02T00:00:00.000Z","2023-01-02T00:00:00.000Z"`
  }

  // CSV parsing helper (copied from import logic)
  parseCSVLine(line) {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
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

  generateTestReport() {
    console.log('\n📋 Export-Import Round-Trip Test Report')
    console.log('=' .repeat(60))
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
      testType: 'export-import-roundtrip',
      summary: {
        total: this.totalTests,
        passed: this.passedTests,
        failed: this.failedTests,
        successRate: (this.passedTests / this.totalTests) * 100
      },
      results: this.testResults
    }
    
    const reportPath = join(process.cwd(), 'server/database/backups/export-import-test-results-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json')
    writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\n📄 Detailed report saved to: ${reportPath}`)
    
    if (this.failedTests === 0) {
      console.log('\n🎉 All export-import round-trip tests passed!')
    } else {
      console.log(`\n⚠️  ${this.failedTests} test(s) failed. Please review and fix.`)
      process.exit(1)
    }
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ExportImportTester()
  tester.runAllTests()
}

export { ExportImportTester }
