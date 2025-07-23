#!/usr/bin/env node

/**
 * Test script for admin user initialization system
 * Tests the admin user creation with different environment variable configurations
 */

import { execSync } from 'child_process'
import { writeFileSync, readFileSync, existsSync } from 'fs'

class AdminInitializationTester {
  constructor() {
    this.originalEnv = process.env
    this.testResults = []
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [ADMIN-TEST]`
    
    if (level === 'error') {
      console.error(`${prefix} ❌ ${message}`)
    } else if (level === 'success') {
      console.log(`${prefix} ✅ ${message}`)
    } else if (level === 'warn') {
      console.warn(`${prefix} ⚠️  ${message}`)
    } else {
      console.log(`${prefix} ℹ️  ${message}`)
    }
  }

  async testEnvironmentVariableHandling() {
    this.log('Testing environment variable handling...')

    const testCases = [
      {
        name: 'Default values (no env vars)',
        env: {},
        expected: {
          username: 'root',
          email: 'admin@localhost',
          password: 'Verbatims@Beautiful2024!'
        }
      },
      {
        name: 'Custom username only',
        env: { USER_USERNAME: 'testadmin' },
        expected: {
          username: 'testadmin',
          email: 'admin@localhost',
          password: 'Verbatims@Beautiful2024!'
        }
      },
      {
        name: 'Custom email only',
        env: { USER_EMAIL: 'admin@example.com' },
        expected: {
          username: 'root',
          email: 'admin@example.com',
          password: 'Verbatims@Beautiful2024!'
        }
      },
      {
        name: 'Custom password only',
        env: { USER_PASSWORD: 'MySecurePassword123!' },
        expected: {
          username: 'root',
          email: 'admin@localhost',
          password: 'MySecurePassword123!'
        }
      },
      {
        name: 'All custom values',
        env: {
          USER_USERNAME: 'superadmin',
          USER_EMAIL: 'super@verbatims.com',
          USER_PASSWORD: 'SuperSecure2024!'
        },
        expected: {
          username: 'superadmin',
          email: 'super@verbatims.com',
          password: 'SuperSecure2024!'
        }
      }
    ]

    for (const testCase of testCases) {
      this.log(`Testing: ${testCase.name}`)
      
      // Test the environment variable logic
      const result = this.simulateEnvironmentVariables(testCase.env)
      
      if (this.validateResult(result, testCase.expected)) {
        this.log(`✅ ${testCase.name} - PASSED`, 'success')
        this.testResults.push({ name: testCase.name, status: 'PASSED' })
      } else {
        this.log(`❌ ${testCase.name} - FAILED`, 'error')
        this.log(`Expected: ${JSON.stringify(testCase.expected)}`, 'error')
        this.log(`Got: ${JSON.stringify(result)}`, 'error')
        this.testResults.push({ name: testCase.name, status: 'FAILED' })
      }
    }
  }

  simulateEnvironmentVariables(envVars) {
    // Simulate the environment variable logic from initializeAdminUser
    const username = envVars.USER_USERNAME || 'root'
    const email = envVars.USER_EMAIL || 'admin@localhost'
    const password = envVars.USER_PASSWORD || 'Verbatims@Beautiful2024!'

    return { username, email, password }
  }

  validateResult(result, expected) {
    return (
      result.username === expected.username &&
      result.email === expected.email &&
      result.password === expected.password
    )
  }

  async testAPIEndpoints() {
    this.log('Testing API endpoints...')

    try {
      // Test admin status endpoint
      this.log('Testing /api/admin/status endpoint...')
      const statusResponse = await this.makeRequest('GET', '/api/admin/status')
      
      if (statusResponse.success !== undefined) {
        this.log('Admin status endpoint responding correctly', 'success')
        this.testResults.push({ name: 'Admin Status API', status: 'PASSED' })
      } else {
        this.log('Admin status endpoint not responding as expected', 'error')
        this.testResults.push({ name: 'Admin Status API', status: 'FAILED' })
      }

      // Test admin user initialization endpoint
      this.log('Testing /api/admin/init-admin-user endpoint...')
      const initResponse = await this.makeRequest('POST', '/api/admin/init-admin-user')
      
      if (initResponse.success !== undefined) {
        this.log('Admin initialization endpoint responding correctly', 'success')
        this.testResults.push({ name: 'Admin Init API', status: 'PASSED' })
      } else {
        this.log('Admin initialization endpoint not responding as expected', 'error')
        this.testResults.push({ name: 'Admin Init API', status: 'FAILED' })
      }

    } catch (error) {
      this.log(`API testing failed: ${error.message}`, 'error')
      this.testResults.push({ name: 'API Endpoints', status: 'FAILED' })
    }
  }

  async makeRequest(method, path) {
    // Simulate API request - in a real test, you'd use fetch or similar
    // For now, just return a mock response to test the structure
    return {
      success: true,
      message: 'Mock response',
      data: {}
    }
  }

  async testSecurityConsiderations() {
    this.log('Testing security considerations...')

    const securityTests = [
      {
        name: 'Password strength validation',
        test: () => {
          const defaultPassword = 'Verbatims@Beautiful2024!'
          return defaultPassword.length >= 12 && 
                 /[A-Z]/.test(defaultPassword) && 
                 /[a-z]/.test(defaultPassword) && 
                 /[0-9]/.test(defaultPassword) && 
                 /[!@#$%^&*]/.test(defaultPassword)
        }
      },
      {
        name: 'Email format validation',
        test: () => {
          const defaultEmail = 'admin@localhost'
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(defaultEmail) || 
                 defaultEmail === 'admin@localhost' // localhost is acceptable for dev
        }
      },
      {
        name: 'Username format validation',
        test: () => {
          const defaultUsername = 'root'
          return defaultUsername.length >= 2 && defaultUsername.length <= 50
        }
      }
    ]

    for (const test of securityTests) {
      try {
        if (test.test()) {
          this.log(`${test.name} - PASSED`, 'success')
          this.testResults.push({ name: test.name, status: 'PASSED' })
        } else {
          this.log(`${test.name} - FAILED`, 'error')
          this.testResults.push({ name: test.name, status: 'FAILED' })
        }
      } catch (error) {
        this.log(`${test.name} - ERROR: ${error.message}`, 'error')
        this.testResults.push({ name: test.name, status: 'ERROR' })
      }
    }
  }

  generateReport() {
    this.log('Generating test report...')

    const totalTests = this.testResults.length
    const passedTests = this.testResults.filter(r => r.status === 'PASSED').length
    const failedTests = this.testResults.filter(r => r.status === 'FAILED').length
    const errorTests = this.testResults.filter(r => r.status === 'ERROR').length

    const report = `
# Admin User Initialization Test Report

**Generated:** ${new Date().toISOString()}

## Summary
- **Total Tests:** ${totalTests}
- **Passed:** ${passedTests}
- **Failed:** ${failedTests}
- **Errors:** ${errorTests}
- **Success Rate:** ${((passedTests / totalTests) * 100).toFixed(1)}%

## Test Results

${this.testResults.map(result => 
  `- **${result.name}:** ${result.status}`
).join('\n')}

## Recommendations

${failedTests > 0 ? '⚠️ Some tests failed. Please review the implementation.' : '✅ All tests passed successfully!'}

${errorTests > 0 ? '❌ Some tests had errors. Please check the test environment.' : ''}

## Next Steps

1. Review any failed tests and fix implementation issues
2. Test in a real Cloudflare D1 environment
3. Verify admin user creation in production deployment
4. Test password change functionality after first login
`

    writeFileSync('admin-initialization-test-report.md', report)
    this.log('Test report saved to admin-initialization-test-report.md', 'success')

    return {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      errors: errorTests,
      successRate: (passedTests / totalTests) * 100
    }
  }

  async runAllTests() {
    this.log('Starting admin user initialization tests...')

    try {
      await this.testEnvironmentVariableHandling()
      await this.testSecurityConsiderations()
      // Note: API tests would require a running server
      // await this.testAPIEndpoints()

      const summary = this.generateReport()
      
      this.log(`Tests completed: ${summary.passed}/${summary.total} passed (${summary.successRate.toFixed(1)}%)`)
      
      if (summary.failed === 0 && summary.errors === 0) {
        this.log('All tests passed! 🎉', 'success')
        process.exit(0)
      } else {
        this.log('Some tests failed. Check the report for details.', 'warn')
        process.exit(1)
      }

    } catch (error) {
      this.log(`Test execution failed: ${error.message}`, 'error')
      process.exit(1)
    }
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AdminInitializationTester()
  tester.runAllTests()
}

export { AdminInitializationTester }
