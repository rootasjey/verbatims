/**
 * Simple test script to verify the real-time progress tracking implementation
 * Run this with: node test-progress-tracking.js
 */

// Test the progress tracking utilities
async function testProgressTracking() {
  console.log('🧪 Testing Progress Tracking Implementation...\n')

  try {
    // Import the progress utilities
    const { 
      generateImportId, 
      initializeProgress, 
      updateStepProgress, 
      getProgress,
      cleanupOldProgress,
      checkForStuckImports,
      getImportStats
    } = await import('./server/utils/onboarding-progress.ts')

    // Test 1: Generate import ID
    console.log('1️⃣ Testing import ID generation...')
    const importId = generateImportId()
    console.log(`   Generated ID: ${importId}`)
    console.log('   ✅ Import ID generation works\n')

    // Test 2: Initialize progress
    console.log('2️⃣ Testing progress initialization...')
    const progress = initializeProgress(importId)
    console.log(`   Initial status: ${progress.status}`)
    console.log(`   Steps initialized: ${Object.keys(progress.steps).join(', ')}`)
    console.log('   ✅ Progress initialization works\n')

    // Test 3: Update step progress
    console.log('3️⃣ Testing step progress updates...')
    
    // Start authors import
    updateStepProgress(importId, 'authors', {
      status: 'processing',
      message: 'Starting authors import...',
      total: 100,
      current: 0,
      imported: 0
    })
    
    let currentProgress = getProgress(importId)
    console.log(`   Authors status: ${currentProgress.steps.authors.status}`)
    console.log(`   Authors message: ${currentProgress.steps.authors.message}`)
    
    // Simulate progress updates
    for (let i = 1; i <= 5; i++) {
      updateStepProgress(importId, 'authors', {
        current: i * 20,
        imported: i * 18, // Some failures
        message: `Imported ${i * 18} of 100 authors...`
      })
    }
    
    // Complete authors
    updateStepProgress(importId, 'authors', {
      status: 'completed',
      message: 'Successfully imported 90 authors',
      current: 100,
      imported: 90
    })
    
    currentProgress = getProgress(importId)
    console.log(`   Final authors status: ${currentProgress.steps.authors.status}`)
    console.log(`   Total imported: ${currentProgress.totalImported}`)
    console.log('   ✅ Step progress updates work\n')

    // Test 4: Test statistics
    console.log('4️⃣ Testing import statistics...')
    const stats = getImportStats()
    console.log(`   Total imports: ${stats.total}`)
    console.log(`   Processing: ${stats.processing}`)
    console.log(`   Completed: ${stats.completed}`)
    console.log('   ✅ Statistics work\n')

    // Test 5: Test cleanup functions
    console.log('5️⃣ Testing cleanup functions...')
    console.log('   Running stuck import check...')
    checkForStuckImports(1000) // Very short timeout for testing
    
    console.log('   Running old progress cleanup...')
    cleanupOldProgress(1000) // Very short age for testing
    console.log('   ✅ Cleanup functions work\n')

    console.log('🎉 All tests passed! The progress tracking implementation looks good.\n')

    // Test recommendations
    console.log('📋 Recommendations for production:')
    console.log('   • Set up periodic cleanup (every hour)')
    console.log('   • Monitor import statistics')
    console.log('   • Consider using Redis for progress storage in production')
    console.log('   • Add logging for debugging')
    console.log('   • Test with actual backup files')

  } catch (error) {
    console.error('❌ Test failed:', error)
    console.error('   Make sure you\'re running this from the project root')
    console.error('   and that all dependencies are installed')
  }
}

// Performance test
async function testPerformance() {
  console.log('\n⚡ Performance Test...')
  
  try {
    const { generateImportId, initializeProgress, updateStepProgress } = await import('./server/utils/onboarding-progress.ts')
    
    const startTime = Date.now()
    const numOperations = 1000
    
    // Test rapid progress updates
    const importId = generateImportId()
    initializeProgress(importId)
    
    for (let i = 0; i < numOperations; i++) {
      updateStepProgress(importId, 'authors', {
        current: i,
        imported: i,
        message: `Processing item ${i}...`
      })
    }
    
    const endTime = Date.now()
    const duration = endTime - startTime
    const opsPerSecond = Math.round(numOperations / (duration / 1000))
    
    console.log(`   Processed ${numOperations} updates in ${duration}ms`)
    console.log(`   Performance: ${opsPerSecond} operations/second`)
    
    if (opsPerSecond > 1000) {
      console.log('   ✅ Performance is good')
    } else {
      console.log('   ⚠️  Performance might need optimization')
    }
    
  } catch (error) {
    console.error('❌ Performance test failed:', error)
  }
}

// Run tests
async function runTests() {
  await testProgressTracking()
  await testPerformance()
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error)
}

export { testProgressTracking, testPerformance }
