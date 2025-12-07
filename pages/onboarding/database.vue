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
      <NCard class="p-6 max-w-2xl mx-auto">
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
          <!-- Users -->
          <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div class="flex items-center space-x-3">
              <NIcon 
                :name="getStepIcon('users')" 
                :class="getStepIconClass('users')"
                class="w-5 h-5"
              />
              <div>
                <h4 class="font-medium">Import Users</h4>
                <p class="text-sm text-gray-500">{{ progress.users.message }}</p>
              </div>
            </div>
            <div class="text-right">
              <div v-if="progress.users.status === 'loading' || progress.users.status === 'processing'" class="flex items-center space-x-2">
                <NIcon name="i-ph-spinner" class="w-4 h-4 animate-spin" />
                <span class="text-sm">{{ progress.users.current }}/{{ progress.users.total }}</span>
              </div>
              <div v-else-if="progress.users.status === 'completed'" class="text-sm text-green-600">
                {{ progress.users.imported }} imported
              </div>
              <div v-else-if="progress.users.status === 'error' || progress.users.status === 'failed'" class="text-sm text-red-600">
                Failed
              </div>
            </div>
          </div>
          <!-- Authors -->
          <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div class="flex items-center space-x-3">
              <NIcon 
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
                <NIcon name="i-ph-spinner" class="w-4 h-4 animate-spin" />
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
              <NIcon 
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
                <NIcon name="i-ph-spinner" class="w-4 h-4 animate-spin" />
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

          <!-- Tags -->
          <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div class="flex items-center space-x-3">
              <NIcon 
                :name="getStepIcon('tags')" 
                :class="getStepIconClass('tags')"
                class="w-5 h-5"
              />
              <div>
                <h4 class="font-medium">Import Tags</h4>
                <p class="text-sm text-gray-500">{{ progress.tags.message }}</p>
              </div>
            </div>
            <div class="text-right">
              <div v-if="progress.tags.status === 'loading' || progress.tags.status === 'processing'" class="flex items-center space-x-2">
                <NIcon name="i-ph-spinner" class="w-4 h-4 animate-spin" />
                <span class="text-sm">{{ progress.tags.current }}/{{ progress.tags.total }}</span>
              </div>
              <div v-else-if="progress.tags.status === 'completed'" class="text-sm text-green-600">
                {{ progress.tags.imported }} imported
              </div>
              <div v-else-if="progress.tags.status === 'error' || progress.tags.status === 'failed'" class="text-sm text-red-600">
                Failed
              </div>
            </div>
          </div>

          <!-- Quotes -->
          <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div class="flex items-center space-x-3">
              <NIcon 
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
              <div v-if="progress.quotes.status === 'loading' || progress.quotes.status === 'processing'" class="flex items-center space-x-2">
                <NIcon name="i-ph-spinner" class="w-4 h-4 animate-spin" />
                <span class="text-sm">{{ progress.quotes.current }}/{{ progress.quotes.total }}</span>
              </div>
              <div v-else-if="progress.quotes.status === 'completed'" class="text-sm text-green-600">
                {{ progress.quotes.imported }} imported
              </div>
              <div v-else-if="progress.quotes.status === 'error' || progress.quotes.status === 'failed'" class="text-sm text-red-600">
                Failed
              </div>
            </div>
          </div>

          <!-- Related Data (Extras) -->
          <div v-if="hasExtras" class="p-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            <div class="flex items-center gap-2 mb-2">
              <NIcon name="i-ph-database" class="w-5 h-5 text-primary-500" />
              <h4 class="font-medium">Related Data</h4>
            </div>
            <ul class="mt-1 grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
              <li v-for="item in extrasList" :key="item.key" class="flex items-center justify-between">
                <span>{{ item.label }}</span>
                <span class="font-medium text-gray-900 dark:text-gray-100">{{ item.value }}</span>
              </li>
            </ul>
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
            <NIcon name="i-ph-check-circle" class="w-5 h-5 text-green-600" />
            <p class="text-sm text-green-600 font-medium">
              Database initialization completed successfully! 
              {{ totalImported }} items imported.
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-12">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">Import from ZIP</label>
          <input type="file" accept=".zip" @change="handleFileChange" />
        </div>

        <div class="mt-2 flex justify-between items-center">
          <NButton btn="link" to="/onboarding/admin" class="p-0">
            ← Back to Admin Setup
          </NButton>
          
          <div class="flex space-x-3">
            <NButton
              v-if="!isStarted && !isCompleted"
              @click="startImport"
              :disabled="loading"
              :loading="loading"
              size="sm"
            >
              Start Import
            </NButton>
            
            <NButton
              v-if="isCompleted"
              @click="goToHome"
              size="sm"
            >
              Go to Application
            </NButton>
          </div>
        </div>
      </div>

        <!-- Navigation Info -->
        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-500">Step 2 of 2</span>
            <span class="text-gray-500">Onboarding Complete</span>
          </div>
        </div>
      </NCard>
    </div>
  </div>
</template>

<script lang="ts" setup>
// Types to fix implicit any and index signature issues
type StepStatus = 'pending' | 'loading' | 'completed' | 'error' | 'processing' | 'failed'
type StepKey = 'users' | 'authors' | 'references' | 'tags' | 'quotes'

interface StepProgress {
  status: StepStatus
  message: string
  current: number
  total: number
  imported: number
}

type ProgressRecord = Record<StepKey, StepProgress>

interface Extras {
  user_collections: number
  collection_quotes: number
  user_likes: number
  user_sessions: number
  user_messages: number
  quote_reports: number
  quote_views: number
  author_views: number
  reference_views: number
}

interface ProgressUpdate {
  steps?: Partial<Record<StepKey, Partial<StepProgress>>>
  totalImported?: number
  extras?: Partial<Extras>
  status?: 'completed' | 'failed' | 'running'
  errors?: string[]
}

interface StartImportResponse {
  success: boolean
  importId?: string
  message?: string
}

interface ProgressAPIResponse {
  success: boolean
  data: ProgressUpdate & { status: 'completed' | 'failed' | 'running' }
}

interface StatusAPIResponse {
  success: boolean
  data: { needsOnboarding: boolean }
}

declare global {
  interface Window {
    cleanupProgressTracking?: () => void
    cleanupPolling?: () => void
  }
}

useHead({
  title: 'Initialize Database - Verbatims Onboarding',
  meta: [
    { 
      name: 'description', 
      content: 'Initialize your Verbatims database with quotes, authors, and references.',
    }
  ]
})

definePageMeta({
  middleware: 'admin'
})

const loading = ref(false)
const isStarted = ref(false)
const isCompleted = ref(false)
const errors = ref<string[]>([])
const serverTotalImported = ref<number | null>(null)
const extras = reactive<Extras>({
  user_collections: 0,
  collection_quotes: 0,
  user_likes: 0,
  user_sessions: 0,
  user_messages: 0,
  quote_reports: 0,
  quote_views: 0,
  author_views: 0,
  reference_views: 0,
})

const progress = ref<ProgressRecord>({
  users: {
    status: 'pending', // pending, loading, completed, error, processing, failed
    message: 'Ready to import users from backup',
    current: 0,
    total: 0,
    imported: 0
  },
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
  tags: {
    status: 'pending',
    message: 'Ready to import tags from backup',
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

const totalSteps = computed(() => 5)
const completedSteps = computed(() => {
  return (Object.values(progress.value) as StepProgress[]).filter(step => step.status === 'completed').length
})

const totalImported = computed(() => {
  // Prefer server-provided aggregate which includes users, tags, and optional datasets
  if (typeof serverTotalImported.value === 'number' && serverTotalImported.value >= 0) {
    return serverTotalImported.value
  }
  // Fallback: sum core steps locally
  return progress.value.users.imported +
         progress.value.tags.imported +
         progress.value.authors.imported +
         progress.value.references.imported +
         progress.value.quotes.imported
})

const hasExtras = computed(() => (Object.values(extras) as number[]).some(v => v > 0))
const extrasList = computed(() => {
  const labels: Record<keyof Extras, string> = {
    user_collections: 'User Collections',
    collection_quotes: 'Collection-Quote Links',
    user_likes: 'User Likes',
    user_sessions: 'User Sessions',
    user_messages: 'User Messages',
    quote_reports: 'Quote Reports',
    quote_views: 'Quote Views',
    author_views: 'Author Views',
    reference_views: 'Reference Views',
  }
  return (Object.keys(extras) as (keyof Extras)[])
    .filter((k) => extras[k] > 0)
    .map((k) => ({ key: k as string, label: labels[k] || (k as string), value: extras[k] }))
})

// Helper functions
const getStepIcon = (step: StepKey) => {
  const status = progress.value[step].status
  switch (status) {
    case 'completed': return 'i-ph-check-circle'
    case 'loading': return 'i-ph-spinner'
    case 'processing': return 'i-ph-spinner'
    case 'error': return 'i-ph-x-circle'
    case 'failed': return 'i-ph-x-circle'
    default: return 'i-ph-circle'
  }
}

const getStepIconClass = (step: StepKey) => {
  const status = progress.value[step].status
  switch (status) {
    case 'completed': return 'text-lime-400'
    case 'loading': return 'text-blue-500 animate-spin'
    case 'processing': return 'text-blue-500 animate-spin'
    case 'error': return 'text-pink-600'
    case 'failed': return 'text-pink-600'
    default: return 'text-gray-400'
  }
}

// Real-time progress tracking
let eventSource: EventSource | null = null

// Import functions
let zipFile: File | null = null
const handleFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement | null
  if (input && input.files && input.files.length > 0) {
    zipFile = input.files[0]
  } else {
    zipFile = null
  }
}

const startImport = async () => {
  loading.value = true
  isStarted.value = true
  errors.value = []

  try {
    // Start import with async mode; send zip file if provided
    let response: StartImportResponse
    if (zipFile) {
      const form = new FormData()
      form.append('file', zipFile)
      form.append('async', 'true')
      response = await $fetch<StartImportResponse>('/api/onboarding/database', {
        method: 'POST',
        body: form
      })
    } else {
      response = await $fetch<StartImportResponse>('/api/onboarding/database', {
        method: 'POST',
        query: { async: 'true' }
      })
    }

    if (response.success && response.importId) {
      // Start real-time progress tracking
      startProgressTracking(response.importId)
    } else {
      errors.value.push(response.message || 'Failed to start import')
      loading.value = false
    }
  } catch (error: any) {
    console.error('Database import error:', error)
    errors.value.push(error?.data?.message || 'Failed to start import')

    // Mark all as error
    progress.value.authors.status = 'error'
    progress.value.references.status = 'error'
    progress.value.quotes.status = 'error'

    loading.value = false
  }
}

// Start real-time progress tracking using Server-Sent Events
const startProgressTracking = (importId: string) => {
  // Close existing connection if any
  if (eventSource) {
    eventSource.close()
  }

  let reconnectAttempts = 0
  const maxReconnectAttempts = 3
  let reconnectTimeout: number | null = null

  const connect = () => {
    try {
      // Create new EventSource connection
      eventSource = new EventSource(`/api/onboarding/progress/${importId}`)

      eventSource.onopen = () => {
        console.log('Progress tracking connected')
        reconnectAttempts = 0 // Reset on successful connection
      }

      eventSource.addEventListener('progress', (event: MessageEvent) => {
        try {
          const progressData = JSON.parse(event.data)
          updateProgressUI(progressData)
        } catch (error) {
          console.error('Failed to parse progress data:', error)
          errors.value.push('Failed to parse progress update')
        }
      })

      eventSource.addEventListener('heartbeat', (_event) => {
        // Heartbeat received - connection is alive
        console.log('Heartbeat received')
      })

      eventSource.addEventListener('close', (_event) => {
        console.log('Import completed, closing connection')
        eventSource?.close()
        eventSource = null
      })

      eventSource.addEventListener('error', (event: any) => {
        try {
          const errorData = JSON.parse(event.data)
          console.error('Server error:', errorData)
          errors.value.push(errorData.message || 'Server error occurred')
        } catch (error) {
          console.error('Failed to parse error data:', error)
        }
      })

      eventSource.onerror = (error: Event) => {
        console.error('EventSource error:', error)

        const es = eventSource
        if (es && es.readyState === EventSource.CLOSED) {
          eventSource = null

          // Try to reconnect
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000) // Exponential backoff
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`)

            reconnectTimeout = window.setTimeout(() => {
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
    if (reconnectTimeout !== null) {
      window.clearTimeout(reconnectTimeout)
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
const updateProgressUI = (progressData: ProgressUpdate) => {
  // Update individual steps
  if (progressData.steps) {
    (Object.keys(progressData.steps) as StepKey[]).forEach(stepName => {
      if (progress.value[stepName] && progressData.steps) {
        Object.assign(progress.value[stepName], progressData.steps[stepName]!)
      }
    })
  }

  // Update aggregate total imported when provided by the server
  if (typeof progressData.totalImported === 'number') {
    serverTotalImported.value = progressData.totalImported
  }

  // Update extras when provided
  if (progressData.extras && typeof progressData.extras === 'object') {
    ;(Object.keys(extras) as (keyof Extras)[]).forEach((k) => {
      const val = progressData.extras?.[k]
      if (typeof val === 'number') {
        extras[k] = val
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
const startPollingFallback = (importId: string) => {
  console.log('Starting polling fallback for import:', importId)

  let pollAttempts = 0
  const maxPollAttempts = 150 // 5 minutes at 2-second intervals
  let pollInterval: number | null = null

  const poll = async () => {
    try {
      pollAttempts++

      const response = await $fetch<ProgressAPIResponse>(`/api/onboarding/progress/${importId}`)

      if (response.success) {
        updateProgressUI(response.data)

        if (response.data.status === 'completed' || response.data.status === 'failed') {
          console.log('Import finished, stopping polling')
          if (pollInterval !== null) window.clearInterval(pollInterval)
          return
        }
      } else {
        console.error('Polling response error:', response)
        errors.value.push('Failed to get import progress')
      }

      // Check if we've exceeded max attempts
      if (pollAttempts >= maxPollAttempts) {
        console.error('Polling timeout - max attempts reached')
        if (pollInterval !== null) window.clearInterval(pollInterval)
        errors.value.push('Import progress tracking timed out')
        loading.value = false
      }

    } catch (error: any) {
      console.error('Polling error:', error)

      // If it's a network error, continue trying for a bit
      if (pollAttempts < 10) {
        console.log('Network error, will retry...')
        return
      }

      // Too many failures, give up
      if (pollInterval !== null) window.clearInterval(pollInterval)
      errors.value.push('Lost connection to import progress')
      loading.value = false
    }
  }

  // Start polling immediately, then every 2 seconds
  poll()
  pollInterval = window.setInterval(poll, 2000)

  // Store cleanup function
  window.cleanupPolling = () => {
    if (pollInterval !== null) {
      window.clearInterval(pollInterval)
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
    const status = await $fetch<StatusAPIResponse>('/api/onboarding/status')
    if (status.success && !status.data.needsOnboarding) {
      await navigateTo('/')
    }
    // If admin is missing, we still allow importing users via ZIP, so no redirect here
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
