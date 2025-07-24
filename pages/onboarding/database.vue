<template>
  <div class="min-h-screen light:bg-purple-100 flex items-center justify-center p-8">
    <div class="w-full">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="font-title text-size-6 font-600 line-height-none uppercase">Verbatims</h1>
        <h2 class="font-text text-size-12 font-600">Initialize Database</h2>
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
    { name: 'description', content: 'Initialize your Verbatims database with quotes, authors, and references.' }
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
    case 'completed': return 'text-green-600'
    case 'loading': return 'text-blue-600 animate-spin'
    case 'error': return 'text-red-600'
    default: return 'text-gray-400'
  }
}

// Import functions
const startImport = async () => {
  loading.value = true
  isStarted.value = true
  errors.value = []

  try {
    const response = await $fetch('/api/onboarding/database', {
      method: 'POST'
    })

    if (response.success) {
      // Update progress based on response
      if (response.data) {
        progress.value.authors.imported = response.data.authors || 0
        progress.value.references.imported = response.data.references || 0
        progress.value.quotes.imported = response.data.quotes || 0
        
        // Mark all as completed
        progress.value.authors.status = 'completed'
        progress.value.authors.message = `Successfully imported ${response.data.authors || 0} authors`
        
        progress.value.references.status = 'completed'
        progress.value.references.message = `Successfully imported ${response.data.references || 0} references`
        
        progress.value.quotes.status = 'completed'
        progress.value.quotes.message = `Successfully imported ${response.data.quotes || 0} quotes`
      }
      
      isCompleted.value = true
    } else {
      errors.value.push(response.message || 'Import failed')
    }
  } catch (error) {
    console.error('Database import error:', error)
    errors.value.push(error.data?.message || 'Failed to import database')
    
    // Mark all as error
    progress.value.authors.status = 'error'
    progress.value.references.status = 'error'
    progress.value.quotes.status = 'error'
  } finally {
    loading.value = false
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
</script>
