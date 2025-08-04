<template>
  <div class="space-y-6">
    <!-- Progress Card -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">Import Progress</h2>
          <UBadge
            :color="getStatusColor(progress?.status)"
            :label="progress?.status?.toUpperCase() || 'UNKNOWN'"
          />
        </div>
      </template>

      <div v-if="progress" class="space-y-6">
        <!-- Progress Bar -->
        <div>
          <div class="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{{ progress.progressPercentage }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-primary-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${progress.progressPercentage}%` }"
            ></div>
          </div>
        </div>

        <!-- Statistics Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="text-2xl font-bold">{{ progress.totalRecords }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Total</div>
          </div>
          <div class="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">{{ progress.processedRecords }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Processed</div>
          </div>
          <div class="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div class="text-2xl font-bold text-green-600">{{ progress.successfulRecords }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Success</div>
          </div>
          <div class="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div class="text-2xl font-bold text-red-600">{{ progress.failedRecords }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Failed</div>
          </div>
        </div>

        <!-- Quote Import Specific Stats -->
        <div v-if="progress.createdAuthors !== undefined || progress.createdReferences !== undefined" class="mt-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Created During Import</h4>
          <div class="grid grid-cols-2 gap-4">
            <div v-if="progress.createdAuthors !== undefined" class="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div class="text-xl font-bold text-blue-600">{{ progress.createdAuthors }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">New Authors</div>
            </div>
            <div v-if="progress.createdReferences !== undefined" class="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div class="text-xl font-bold text-purple-600">{{ progress.createdReferences }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">New References</div>
            </div>
          </div>
        </div>

        <!-- Time Information -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span class="font-medium">Started:</span>
            {{ formatDate(progress.startedAt) }}
          </div>
          <div v-if="progress.completedAt">
            <span class="font-medium">Completed:</span>
            {{ formatDate(progress.completedAt) }}
          </div>
          <div>
            <span class="font-medium">Duration:</span>
            {{ formatDuration(progress.duration) }}
          </div>
          <div v-if="progress.estimatedTimeRemaining && progress.status === 'processing'">
            <span class="font-medium">ETA:</span>
            {{ formatDuration(progress.estimatedTimeRemaining) }}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
          <UButton
            v-if="progress.status === 'processing'"
            btn="outline"
            color="red"
            @click="cancelImport"
          >
            Cancel Import
          </UButton>

          <UButton
            v-if="progress.status === 'completed' && progress.failedRecords > 0"
            btn="outline"
            color="yellow"
            @click="showFailedRecords = true"
          >
            View Failed Records
          </UButton>

          <UButton
            v-if="progress.status === 'failed'"
            btn="outline"
            color="blue"
            @click="retryImport"
          >
            Retry Import
          </UButton>
        </div>
      </div>

      <div v-else class="text-center py-8">
        <UIcon name="i-ph-spinner" class="animate-spin text-2xl mb-2" />
        <p>Loading import progress...</p>
      </div>
    </UCard>

    <!-- Recent Errors -->
    <UCard v-if="progress?.recentErrors?.length > 0">
      <template #header>
        <h3 class="text-lg font-semibold text-red-600">Recent Errors</h3>
      </template>
      
      <div class="space-y-2">
        <div
          v-for="(error, index) in progress.recentErrors"
          :key="index"
          class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300"
        >
          {{ error }}
        </div>
        <div v-if="progress.errorCount > progress.recentErrors.length" class="text-sm text-gray-500">
          ... and {{ progress.errorCount - progress.recentErrors.length }} more errors
        </div>
      </div>
    </UCard>

    <!-- Recent Warnings -->
    <UCard v-if="progress?.recentWarnings?.length > 0">
      <template #header>
        <h3 class="text-lg font-semibold text-yellow-600">Recent Warnings</h3>
      </template>
      
      <div class="space-y-2">
        <div
          v-for="(warning, index) in progress.recentWarnings"
          :key="index"
          class="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-300"
        >
          {{ warning }}
        </div>
        <div v-if="progress.warningCount > progress.recentWarnings.length" class="text-sm text-gray-500">
          ... and {{ progress.warningCount - progress.recentWarnings.length }} more warnings
        </div>
      </div>
    </UCard>

    <!-- Failed Records Modal -->
    <UModal v-model="showFailedRecords">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Failed Records</h3>
        </template>
        
        <div class="space-y-2 max-h-96 overflow-y-auto">
          <div
            v-for="(error, index) in allErrors"
            :key="index"
            class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm"
          >
            {{ error }}
          </div>
        </div>
        
        <template #footer>
          <div class="flex justify-end">
            <UButton @click="showFailedRecords = false">Close</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
const props = defineProps({
  importId: {
    type: String,
    required: true
  }
})

// Data
const progress = ref(null)
const showFailedRecords = ref(false)
const allErrors = ref([])
const polling = ref(null)

// Computed
const isActive = computed(() => {
  return progress.value?.status === 'processing' || progress.value?.status === 'pending'
})

// Methods
const fetchProgress = async () => {
  try {
    const response = await $fetch(`/api/admin/import/progress/${props.importId}`)
    progress.value = response.data
    
    // Stop polling if import is complete
    if (!isActive.value && polling.value) {
      clearInterval(polling.value)
      polling.value = null
    }
  } catch (error) {
    console.error('Failed to fetch progress:', error)
    if (polling.value) {
      clearInterval(polling.value)
      polling.value = null
    }
  }
}

const cancelImport = async () => {
  try {
    await $fetch(`/api/admin/import/cancel/${props.importId}`, { method: 'POST' })
    await fetchProgress()
  } catch (error) {
    console.error('Failed to cancel import:', error)
  }
}

const retryImport = async () => {
  // TODO: Implement retry logic
  console.log('Retry import not implemented yet')
}

const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'blue'
    case 'processing': return 'yellow'
    case 'completed': return 'green'
    case 'failed': return 'red'
    default: return 'gray'
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString()
}

const formatDuration = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

// Lifecycle
onMounted(() => {
  fetchProgress()
  
  // Start polling if import is active
  if (isActive.value) {
    polling.value = setInterval(fetchProgress, 2000) // Poll every 2 seconds
  }
})

onUnmounted(() => {
  if (polling.value) {
    clearInterval(polling.value)
  }
})

// Watch for status changes to start/stop polling
watch(isActive, (newValue) => {
  if (newValue && !polling.value) {
    polling.value = setInterval(fetchProgress, 2000)
  } else if (!newValue && polling.value) {
    clearInterval(polling.value)
    polling.value = null
  }
})
</script>
