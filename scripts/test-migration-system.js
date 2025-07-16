#!/usr/bin/env node

/**
 * Comprehensive Migration System Test
 * Tests the new modular migration system to ensure all components work correctly.
 */

import { migrationRegistry } from '../server/utils/migration/core/MigrationRegistry.js'
import { existsSync } from 'fs'
import { join } from 'path'

class MigrationSystemTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    }
  }

  async runAllTests() {
    console.log('🧪 Starting Migration System Tests')
    console.log('='.repeat(50))

    try {
      await this.testRegistryInitialization()
      await this.testMigrationTypes()
      await this.testFileOrganization()
      await this.testReferencesMigration()
      await this.testAuthorsMigration()
      await this.testLegacyCompatibility()
      await this.testErrorHandling()

      this.printSummary()
      
      if (this.testResults.failed > 0) {
        process.exit(1)
      }

    } catch (error) {
      console.error('❌ Test suite failed:', error.message)
      process.exit(1)
    }
  }

  async testRegistryInitialization() {
    console.log('\n📋 Testing Migration Registry...')
    
    try {
      await migrationRegistry.initialize()
      const availableTypes = migrationRegistry.getAvailableTypes()
      
      this.assert(
        availableTypes.includes('references'),
        'Registry should include references migration'
      )
      
      this.assert(
        availableTypes.includes('authors'),
        'Registry should include authors migration'
      )
      
      this.assert(
        availableTypes.length >= 2,
        'Registry should have at least 2 migration types'
      )

      console.log('   ✅ Registry initialization passed')
      
    } catch (error) {
      this.fail('Registry initialization failed', error)
    }
  }

  async testMigrationTypes() {
    console.log('\n🔧 Testing Migration Type Creation...')
    
    try {
      // Test references migration creation
      const referencesMigration = migrationRegistry.createMigration('references', {
        dryRun: true,
        verbose: false
      })
      
      this.assert(
        referencesMigration.migrationType === 'references',
        'References migration should have correct type'
      )
      
      this.assert(
        referencesMigration.getTableName() === 'quote_references',
        'References migration should have correct table name'
      )

      // Test authors migration creation
      const authorsMigration = migrationRegistry.createMigration('authors', {
        dryRun: true,
        verbose: false
      })
      
      this.assert(
        authorsMigration.migrationType === 'authors',
        'Authors migration should have correct type'
      )
      
      this.assert(
        authorsMigration.getTableName() === 'authors',
        'Authors migration should have correct table name'
      )

      console.log('   ✅ Migration type creation passed')
      
    } catch (error) {
      this.fail('Migration type creation failed', error)
    }
  }

  async testFileOrganization() {
    console.log('\n📁 Testing File Organization...')
    
    try {
      const baseBackupDir = join(process.cwd(), 'server/database/backups')
      const referencesDir = join(baseBackupDir, 'references')
      const authorsDir = join(baseBackupDir, 'authors')
      
      this.assert(
        existsSync(baseBackupDir),
        'Base backup directory should exist'
      )
      
      this.assert(
        existsSync(referencesDir),
        'References directory should exist'
      )
      
      this.assert(
        existsSync(authorsDir),
        'Authors directory should exist'
      )

      // Check for organized files
      const { readdirSync } = await import('fs')
      const referencesFiles = readdirSync(referencesDir)
      const authorsFiles = readdirSync(authorsDir)
      
      this.assert(
        referencesFiles.some(file => file.includes('validation-report')),
        'References directory should contain validation reports'
      )
      
      this.assert(
        authorsFiles.some(file => file.includes('validation-report')),
        'Authors directory should contain validation reports'
      )

      console.log('   ✅ File organization passed')
      
    } catch (error) {
      this.fail('File organization test failed', error)
    }
  }

  async testReferencesMigration() {
    console.log('\n📚 Testing References Migration (Dry Run)...')
    
    try {
      const migration = migrationRegistry.createMigration('references', {
        dryRun: true,
        verbose: false,
        batchSize: 10
      })
      
      // Test data loading
      const sourceData = await migration.loadSourceData()
      this.assert(
        sourceData && typeof sourceData === 'object',
        'Should load source data successfully'
      )
      
      // Test transformation
      const transformedData = await migration.transformData(sourceData)
      this.assert(
        Array.isArray(transformedData),
        'Should return transformed data as array'
      )
      
      this.assert(
        transformedData.length > 0,
        'Should transform at least some records'
      )
      
      // Test validation
      const validationResult = await migration.validateData(transformedData)
      this.assert(
        validationResult && typeof validationResult === 'object',
        'Should return validation result'
      )
      
      this.assert(
        typeof validationResult.isValid === 'boolean',
        'Validation result should have isValid property'
      )

      console.log(`   ✅ References migration passed (${transformedData.length} records)`)
      
    } catch (error) {
      this.fail('References migration test failed', error)
    }
  }

  async testAuthorsMigration() {
    console.log('\n👥 Testing Authors Migration (Dry Run)...')
    
    try {
      const migration = migrationRegistry.createMigration('authors', {
        dryRun: true,
        verbose: false,
        batchSize: 10
      })
      
      // Test data loading
      const sourceData = await migration.loadSourceData()
      this.assert(
        sourceData && typeof sourceData === 'object',
        'Should load source data successfully'
      )
      
      // Test transformation
      const transformedData = await migration.transformData(sourceData)
      this.assert(
        Array.isArray(transformedData),
        'Should return transformed data as array'
      )
      
      this.assert(
        transformedData.length > 0,
        'Should transform at least some records'
      )
      
      // Test validation
      const validationResult = await migration.validateData(transformedData)
      this.assert(
        validationResult && typeof validationResult === 'object',
        'Should return validation result'
      )

      console.log(`   ✅ Authors migration passed (${transformedData.length} records)`)
      
    } catch (error) {
      this.fail('Authors migration test failed', error)
    }
  }

  async testLegacyCompatibility() {
    console.log('\n🔄 Testing Legacy Script Compatibility...')
    
    try {
      // Test that legacy script file exists
      const legacyScriptPath = join(process.cwd(), 'scripts/migrate-firebase-data.js')
      this.assert(
        existsSync(legacyScriptPath),
        'Legacy script should exist'
      )
      
      // Test that it imports without errors
      const { runLegacyMigration } = await import('../scripts/migrate-firebase-data.js')
      
      console.log('   ✅ Legacy compatibility passed')
      
    } catch (error) {
      this.fail('Legacy compatibility test failed', error)
    }
  }

  async testErrorHandling() {
    console.log('\n⚠️  Testing Error Handling...')
    
    try {
      // Test invalid migration type
      try {
        migrationRegistry.createMigration('invalid-type')
        this.fail('Should throw error for invalid migration type')
      } catch (error) {
        this.assert(
          error.message.includes('not registered'),
          'Should throw appropriate error for invalid type'
        )
      }
      
      // Test migration with invalid backup path
      try {
        const migration = migrationRegistry.createMigration('references', {
          backupPath: 'non-existent-file.json',
          dryRun: true
        })
        await migration.loadSourceData()
        this.fail('Should throw error for invalid backup path')
      } catch (error) {
        this.assert(
          error.message.includes('Failed to load'),
          'Should throw appropriate error for invalid backup path'
        )
      }

      console.log('   ✅ Error handling passed')
      
    } catch (error) {
      this.fail('Error handling test failed', error)
    }
  }

  assert(condition, message) {
    if (condition) {
      this.testResults.passed++
      this.testResults.tests.push({ status: 'PASS', message })
    } else {
      this.testResults.failed++
      this.testResults.tests.push({ status: 'FAIL', message })
      console.log(`   ❌ ${message}`)
    }
  }

  fail(message, error = null) {
    this.testResults.failed++
    this.testResults.tests.push({ 
      status: 'FAIL', 
      message,
      error: error?.message 
    })
    console.log(`   ❌ ${message}`)
    if (error) {
      console.log(`      Error: ${error.message}`)
    }
  }

  printSummary() {
    console.log('\n📊 Test Summary')
    console.log('='.repeat(30))
    console.log(`Total Tests: ${this.testResults.passed + this.testResults.failed}`)
    console.log(`Passed: ${this.testResults.passed}`)
    console.log(`Failed: ${this.testResults.failed}`)
    
    if (this.testResults.failed > 0) {
      console.log('\n❌ Failed Tests:')
      this.testResults.tests
        .filter(test => test.status === 'FAIL')
        .forEach((test, index) => {
          console.log(`${index + 1}. ${test.message}`)
          if (test.error) {
            console.log(`   Error: ${test.error}`)
          }
        })
    }
    
    const successRate = ((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)
    console.log(`\nSuccess Rate: ${successRate}%`)
    
    if (this.testResults.failed === 0) {
      console.log('\n🎉 All tests passed! Migration system is working correctly.')
    } else {
      console.log('\n⚠️  Some tests failed. Please review the issues above.')
    }
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new MigrationSystemTester()
  tester.runAllTests()
}

export { MigrationSystemTester }
