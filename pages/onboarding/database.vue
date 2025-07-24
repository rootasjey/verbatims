<template>
  <div class="min-h-screen light:bg-purple-100 flex items-center justify-center p-8">
    <div class="w-full">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="font-title text-size-6 font-600 line-height-none uppercase">Verbatims</h1>
        <h2 class="font-serif text-size-12 font-600">Initialize Database</h2>
        <p class="text-gray-600 dark:text-gray-400">
          Import quotes, authors, and references from backup files to populate your database.
        </p>
      </div>

      <!-- Progress Card -->
      <UCard class="p-6 max-w-2xl mx-auto">
        <!-- Overall Progress -->
        <div class="mb-6">
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-medium">Overall Progress</h3>
            <span class="text-sm text-gray-500">{{ completedSteps }}/{{ totalSteps }} completed</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-primary-500 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${(completedSteps / totalSteps) * 100}%` }"
            ></div>
          </div>
        </div>

        <!-- Import Steps -->
        <div class="space-y-4">
          <!-- Authors -->
          <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div class="flex items-center space-x-3">
              <UIcon 
                :name="getStepIcon('authors')" 
                :class="getStepIconClass('authors')"
                class="w-5 h-5"
              />
              <div>
                <h4 class="font-medium">Import Authors</h4>
                <p class="text-sm text-gray-500">{{ progress.authors.message }}</p>
              </div>
            </div>
            <div class="text-right">
              <div v-if="progress.authors.status === 'loading'" class="flex items-center space-x-2">
                <UIcon name="i-ph-spinner" class="w-4 h-4 animate-spin" />
                <span class="text-sm">{{ progress.authors.current }}/{{ progress.authors.total }}</span>
              </div>
              <div v-else-if="progress.authors.status === 'completed'" class="text-sm text-green-600">
                {{ progress.authors.imported }} imported
              </div>
              <div v-else-if="progress.authors.status === 'error'" class="text-sm text-red-600">
                Failed
              </div>
            </div>
          </div>

          <!-- References -->
          <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div class="flex items-center space-x-3">
              <UIcon 
                :name="getStepIcon('references')" 
                :class="getStepIconClass('references')"
                class="w-5 h-5"
              />
              <div>
                <h4 class="font-medium">Import References</h4>
                <p class="text-sm text-gray-500">{{ progress.references.message }}</p>
              </div>
            </div>
            <div class="text-right">
              <div v-if="progress.references.status === 'loading'" class="flex items-center space-x-2">
                <UIcon name="i-ph-spinner" class="w-4 h-4 animate-spin" />
                <span class="text-sm">{{ progress.references.current }}/{{ progress.references.total }}</span>
              </div>
              <div v-else-if="progress.references.status === 'completed'" class="text-sm text-green-600">
                {{ progress.references.imported }} imported
              </div>
              <div v-else-if="progress.references.status === 'error'" class="text-sm text-red-600">
                Failed
              </div>
            </div>
          </div>

          <!-- Quotes -->
          <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div class="flex items-center space-x-3">
              <UIcon 
                :name="getStepIcon('quotes')" 
                :class="getStepIconClass('quotes')"
                class="w-5 h-5"
              />
              <div>
                <h4 class="font-medium">Import Quotes</h4>
                <p class="text-sm text-gray-500">{{ progress.quotes.message }}</p>
              </div>
            </div>
            <div class="text-right">
              <div v-if="progress.quotes.status === 'loading'" class="flex items-center space-x-2">
                <UIcon name="i-ph-spinner" class="w-4 h-4 animate-spin" />
                <span class="text-sm">{{ progress.quotes.current }}/{{ progress.quotes.total }}</span>
              </div>
              <div v-else-if="progress.quotes.status === 'completed'" class="text-sm text-green-600">
                {{ progress.quotes.imported }} imported
              </div>
              <div v-else-if="progress.quotes.status === 'error'" class="text-sm text-red-600">
                Failed
              </div>
            </div>
          </div>
        </div>

        <!-- Error Messages -->
        <div v-if="errors.length > 0" class="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <h4 class="font-medium text-red-800 mb-2">Import Errors:</h4>
          <ul class="text-sm text-red-600 space-y-1">
            <li v-for="error in errors" :key="error">• {{ error }}</li>
          </ul>
        </div>

        <!-- Success Message -->
        <div v-if="isCompleted && errors.length === 0" class="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div class="flex items-center space-x-2">
            <UIcon name="i-ph-check-circle" class="w-5 h-5 text-green-600" />
            <p class="text-sm text-green-600 font-medium">
              Database initialization completed successfully! 
              {{ totalImported }} items imported.
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-6 flex justify-between items-center">
          <UButton btn="link" to="/onboarding/admin" class="p-0">
            ← Back to Admin Setup
          </UButton>
          
          <div class="flex space-x-3">
            <UButton
              v-if="!isStarted && !isCompleted"
              @click="startImport"
              :disabled="loading"
              :loading="loading"
              size="sm"
            >
              Start Import
            </UButton>
            
            <UButton
              v-if="isCompleted"
              @click="goToHome"
              size="sm"
            >
              Go to Application
            </UButton>
          </div>
        </div>

        <!-- Navigation Info -->
        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-500">Step 2 of 2</span>
            <span class="text-gray-500">Onboarding Complete</span>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup>
// SEO
useHead({
  title: 'Initialize Database - Verbatims Onboarding',
  meta: [
    { 
      name: 'description', 
      content: 'Initialize your Verbatims database with quotes, authors, and references.',
    }
  ]
})

// State
const loading = ref(false)
const isStarted = ref(false)
const isCompleted = ref(false)
const errors = ref([])

const progress = ref({
  authors: {
    status: 'pending', // pending, loading, completed, error
    message: 'Ready to import authors from backup files',
    current: 0,
    total: 0,
    imported: 0
  },
  references: {
    status: 'pending',
    message: 'Ready to import references from backup files',
    current: 0,
    total: 0,
    imported: 0
  },
  quotes: {
    status: 'pending',
    message: 'Ready to import quotes from backup files',
    current: 0,
    total: 0,
    imported: 0
  }
})

// Computed
const totalSteps = computed(() => 3)
const completedSteps = computed(() => {
  return Object.values(progress.value).filter(step => step.status === 'completed').length
})

const totalImported = computed(() => {
  return progress.value.authors.imported + 
         progress.value.references.imported + 
         progress.value.quotes.imported
})

// Helper functions
const getStepIcon = (step) => {
  const status = progress.value[step].status
  switch (status) {
    case 'completed': return 'i-ph-check-circle'
    case 'loading': return 'i-ph-spinner'
    case 'error': return 'i-ph-x-circle'
    default: return 'i-ph-circle'
  }
}

const getStepIconClass = (step) => {
  const status = progress.value[step].status
  switch (status) {
    case 'completed': return 'text-lime-400'
    case 'loading': return 'text-blue-500 animate-spin'
    case 'error': return 'text-pink-600'
    default: return 'text-gray-400'
  }
}

// Real-time progress tracking
let eventSource = null

// Import functions
const startImport = async () => {
  loading.value = true
  isStarted.value = true
  errors.value = []

  try {
    // Start import with async mode
    const response = await $fetch('/api/onboarding/database', {
      method: 'POST',
      query: { async: 'true' }
    })

    if (response.success && response.importId) {
      // Start real-time progress tracking
      startProgressTracking(response.importId)
    } else {
      errors.value.push(response.message || 'Failed to start import')
      loading.value = false
    }
  } catch (error) {
    console.error('Database import error:', error)
    errors.value.push(error.data?.message || 'Failed to start import')

    // Mark all as error
    progress.value.authors.status = 'error'
    progress.value.references.status = 'error'
    progress.value.quotes.status = 'error'

    loading.value = false
  }
}

// Start real-time progress tracking using Server-Sent Events
const startProgressTracking = (importId) => {
  // Close existing connection if any
  if (eventSource) {
    eventSource.close()
  }

  let reconnectAttempts = 0
  const maxReconnectAttempts = 3
  let reconnectTimeout = null

  const connect = () => {
    try {
      // Create new EventSource connection
      eventSource = new EventSource(`/api/onboarding/progress/${importId}`)

      eventSource.onopen = () => {
        console.log('Progress tracking connected')
        reconnectAttempts = 0 // Reset on successful connection
      }

      eventSource.addEventListener('progress', (event) => {
        try {
          const progressData = JSON.parse(event.data)
          updateProgressUI(progressData)
        } catch (error) {
          console.error('Failed to parse progress data:', error)
          errors.value.push('Failed to parse progress update')
        }
      })

      eventSource.addEventListener('heartbeat', (event) => {
        // Heartbeat received - connection is alive
        console.log('Heartbeat received')
      })

      eventSource.addEventListener('close', (event) => {
        console.log('Import completed, closing connection')
        eventSource.close()
        eventSource = null
      })

      eventSource.addEventListener('error', (event) => {
        try {
          const errorData = JSON.parse(event.data)
          console.error('Server error:', errorData)
          errors.value.push(errorData.message || 'Server error occurred')
        } catch (error) {
          console.error('Failed to parse error data:', error)
        }
      })

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error)

        if (eventSource.readyState === EventSource.CLOSED) {
          eventSource = null

          // Try to reconnect
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000) // Exponential backoff
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`)

            reconnectTimeout = setTimeout(() => {
              connect()
            }, delay)
          } else {
            console.log('Max reconnection attempts reached, falling back to polling')
            startPollingFallback(importId)
          }
        }
      }
    } catch (error) {
      console.error('Failed to create EventSource:', error)
      startPollingFallback(importId)
    }
  }

  // Start initial connection
  connect()

  // Cleanup function
  const cleanup = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
  }

  // Store cleanup function for later use
  window.cleanupProgressTracking = cleanup

  return cleanup
}

// Update UI based on progress data
const updateProgressUI = (progressData) => {
  // Update individual steps
  if (progressData.steps) {
    Object.keys(progressData.steps).forEach(stepName => {
      if (progress.value[stepName]) {
        Object.assign(progress.value[stepName], progressData.steps[stepName])
      }
    })
  }

  // Update overall status
  if (progressData.status === 'completed') {
    isCompleted.value = true
    loading.value = false
  } else if (progressData.status === 'failed') {
    loading.value = false
    if (progressData.errors && progressData.errors.length > 0) {
      errors.value.push(...progressData.errors)
    }
  }
}

// Fallback polling mechanism if SSE fails
const startPollingFallback = (importId) => {
  console.log('Starting polling fallback for import:', importId)

  let pollAttempts = 0
  const maxPollAttempts = 150 // 5 minutes at 2-second intervals
  let pollInterval = null

  const poll = async () => {
    try {
      pollAttempts++

      const response = await $fetch(`/api/onboarding/progress/${importId}`)

      if (response.success) {
        updateProgressUI(response.data)

        if (response.data.status === 'completed' || response.data.status === 'failed') {
          console.log('Import finished, stopping polling')
          if (pollInterval) clearInterval(pollInterval)
          return
        }
      } else {
        console.error('Polling response error:', response)
        errors.value.push('Failed to get import progress')
      }

      // Check if we've exceeded max attempts
      if (pollAttempts >= maxPollAttempts) {
        console.error('Polling timeout - max attempts reached')
        if (pollInterval) clearInterval(pollInterval)
        errors.value.push('Import progress tracking timed out')
        loading.value = false
      }

    } catch (error) {
      console.error('Polling error:', error)

      // If it's a network error, continue trying for a bit
      if (pollAttempts < 10) {
        console.log('Network error, will retry...')
        return
      }

      // Too many failures, give up
      if (pollInterval) clearInterval(pollInterval)
      errors.value.push('Lost connection to import progress')
      loading.value = false
    }
  }

  // Start polling immediately, then every 2 seconds
  poll()
  pollInterval = setInterval(poll, 2000)

  // Store cleanup function
  window.cleanupPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }
}

const goToHome = async () => {
  await navigateTo('/')
}

// Check if we should be here
onMounted(async () => {
  try {
    const status = await $fetch('/api/onboarding/status')
    if (status.success && !status.data.needsOnboarding) {
      // Already onboarded, redirect to home
      await navigateTo('/')
    } else if (status.data.step === 'admin_user') {
      // Need to create admin user first
      await navigateTo('/onboarding/admin')
    }
  } catch (error) {
    console.error('Failed to check onboarding status:', error)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  // Clean up EventSource
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }

  // Clean up any stored cleanup functions
  if (window.cleanupProgressTracking) {
    window.cleanupProgressTracking()
    delete window.cleanupProgressTracking
  }

  if (window.cleanupPolling) {
    window.cleanupPolling()
    delete window.cleanupPolling
  }
})
</script>
