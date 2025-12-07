<template>
  <div class="space-y-6">
    <!-- Progress Card -->
    <NCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">Import Progress</h2>
          <NBadge
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
  <div class="flex flex-wrap items-center gap-3">
          <NButton
            v-if="progress.status === 'processing'"
            btn="outline"
            color="red"
            @click="cancelImport"
          >
            Cancel Import
          </NButton>

          <NButton
            v-if="progress.status === 'completed' && progress.failedRecords > 0"
            btn="outline"
            color="yellow"
            @click="showFailedRecords = true"
          >
            View Failed Records
          </NButton>

          <NButton
            v-if="progress.status === 'completed' && progress.failedRecords > 0"
            btn="soft-blue"
            @click="downloadUnresolved"
          >
            Download Unresolved Rows
          </NButton>

          <div v-if="progress.status === 'completed' && progress.failedRecords > 0" class="flex items-center gap-2">
            <span class="text-xs text-gray-500">Format</span>
            <NRadio
              v-model="reportFormat"
              :items="[
                { label: 'NDJSON', value: 'ndjson' },
                { label: 'CSV', value: 'csv' }
              ]"
              size="xs"
            />
          </div>

          <NButton
            v-if="progress.status === 'completed' && progress.failedRecords > 0"
            btn="soft-indigo"
            @click="downloadReport"
          >
            Download Report
          </NButton>

          <NButton
            v-if="progress.status === 'failed'"
            btn="outline"
            color="blue"
            @click="retryImport"
          >
            Retry Import
          </NButton>
        </div>
      </div>

      <div v-else class="text-center py-8">
        <NIcon name="i-ph-spinner" class="animate-spin text-2xl mb-2" />
        <p>Loading import progress...</p>
      </div>
    </NCard>

    <!-- Recent Errors -->
  <NCard v-if="recentErrors.length > 0">
      <template #header>
        <h3 class="text-lg font-semibold text-red-600">Recent Errors</h3>
      </template>
      
      <div class="space-y-2">
        <div
          v-for="(error, index) in recentErrors"
          :key="index"
          class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300"
        >
          {{ error }}
        </div>
        <div v-if="errorCount > recentErrors.length" class="text-sm text-gray-500">
          ... and {{ errorCount - recentErrors.length }} more errors
        </div>
      </div>
    </NCard>

    <!-- Recent Warnings -->
  <NCard v-if="recentWarnings.length > 0">
      <template #header>
        <h3 class="text-lg font-semibold text-yellow-600">Recent Warnings</h3>
      </template>
      
      <div class="space-y-2">
        <div
          v-for="(warning, index) in recentWarnings"
          :key="index"
          class="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-300"
        >
          {{ warning }}
        </div>
        <div v-if="warningCount > recentWarnings.length" class="text-sm text-gray-500">
          ... and {{ warningCount - recentWarnings.length }} more warnings
        </div>
      </div>
    </NCard>

    <!-- Failed Records Dialog -->
    <NDialog v-model:open="showFailedRecords">
      <NCard>
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
            <NButton @click="showFailedRecords = false">Close</NButton>
          </div>
        </template>
      </NCard>
    </NDialog>
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
  <div class="flex flex-wrap items-center gap-3">
          <NButton
            v-if="progress.status === 'processing'"
            btn="outline"
            color="red"
            @click="cancelImport"
          >
            Cancel Import
          </NButton>

          <NButton
            v-if="progress.status === 'completed' && progress.failedRecords > 0"
            btn="outline"
            color="yellow"
            @click="showFailedRecords = true"
          >
            View Failed Records
          </NButton>

          <NButton
            v-if="progress.status === 'completed' && progress.failedRecords > 0"
            btn="soft-blue"
            @click="downloadUnresolved"
          >
            Download Unresolved Rows
          </NButton>

          <div v-if="progress.status === 'completed' && progress.failedRecords > 0" class="flex items-center gap-2">
            <span class="text-xs text-gray-500">Format</span>
            <NRadio
              v-model="reportFormat"
              :items="[
                { label: 'NDJSON', value: 'ndjson' },
                { label: 'CSV', value: 'csv' }
              ]"
              size="xs"
            />
          </div>

          <NButton
            v-if="progress.status === 'completed' && progress.failedRecords > 0"
            btn="soft-indigo"
            @click="downloadReport"
          >
            Download Report
          </NButton>

          <NButton
            v-if="progress.status === 'failed'"
            btn="outline"
            color="blue"
            @click="retryImport"
          >
            Retry Import
          </NButton>
        </div>
      </div>

      <div v-else class="text-center py-8">
        <NIcon name="i-ph-spinner" class="animate-spin text-2xl mb-2" />
        <p>Loading import progress...</p>
      </div>
    </NCard>

    <!-- Recent Errors -->
  <NCard v-if="recentErrors.length > 0">
      <template #header>
        <h3 class="text-lg font-semibold text-red-600">Recent Errors</h3>
      </template>
      
      <div class="space-y-2">
        <div
          v-for="(error, index) in recentErrors"
          :key="index"
          class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300"
        >
          {{ error }}
        </div>
        <div v-if="errorCount > recentErrors.length" class="text-sm text-gray-500">
          ... and {{ errorCount - recentErrors.length }} more errors
        </div>
      </div>
    </NCard>

    <!-- Recent Warnings -->
  <NCard v-if="recentWarnings.length > 0">
      <template #header>
        <h3 class="text-lg font-semibold text-yellow-600">Recent Warnings</h3>
      </template>
      
      <div class="space-y-2">
        <div
          v-for="(warning, index) in recentWarnings"
          :key="index"
          class="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-300"
        >
          {{ warning }}
        </div>
        <div v-if="warningCount > recentWarnings.length" class="text-sm text-gray-500">
          ... and {{ warningCount - recentWarnings.length }} more warnings
        </div>
      </div>
    </NCard>

    <!-- Failed Records Dialog -->
    <NDialog v-model:open="showFailedRecords">
      <NCard>
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
            <NButton @click="showFailedRecords = false">Close</NButton>
          </div>
        </template>
      </NCard>
    </NDialog>
  </div>
</template>

<script setup lang="ts">
import type { ImportProgress as BaseImportProgress } from '~/types'

// Extend server ImportProgress with optional UI-only fields we render
type UiImportProgress = BaseImportProgress & {
  progressPercentage?: number
  estimatedTimeRemaining?: number
  duration?: number
  errorCount?: number
  warningCount?: number
  recentErrors?: string[]
  recentWarnings?: string[]
}

const normalizeProgress = (p: any): UiImportProgress => {
  const recentErrors = Array.isArray(p?.recentErrors) ? p.recentErrors : []
  const recentWarnings = Array.isArray(p?.recentWarnings) ? p.recentWarnings : []
  const total = typeof p?.totalRecords === 'number' ? p.totalRecords : 0
  const processed = typeof p?.processedRecords === 'number' ? p.processedRecords : 0
  const computedPct = total > 0 ? Math.min(100, Math.max(0, Math.round((processed / total) * 100))) : undefined

  // Derive duration if not provided
  let duration: number | undefined = p?.duration
  try {
    const started = p?.startedAt ? new Date(p.startedAt).getTime() : undefined
    const completed = p?.completedAt ? new Date(p.completedAt).getTime() : undefined
    if (typeof duration !== 'number' && started) {
      const now = completed ?? Date.now()
      duration = Math.max(0, now - started)
    }
  } catch {}

  return {
    ...(p || {}),
    progressPercentage: typeof p?.progressPercentage === 'number' ? p.progressPercentage : computedPct,
    duration,
    recentErrors,
    recentWarnings,
    errorCount: typeof p?.errorCount === 'number' ? p.errorCount : (typeof p?.failedRecords === 'number' ? p.failedRecords : recentErrors.length),
    warningCount: typeof p?.warningCount === 'number' ? p.warningCount : recentWarnings.length,
  }
}
const props = defineProps({
  importId: {
    type: String,
    required: true
  }
})
const emit = defineEmits([
  'finished',    // when status becomes completed or failed
  'not-found'    // when the progress endpoint returns 404 / missing
])
const progress = ref<UiImportProgress | null>(null)
const showFailedRecords = ref<boolean>(false)
const allErrors = ref<string[]>([])
const polling = ref<ReturnType<typeof setInterval> | null>(null)
const esRef = ref<EventSource | null>(null)
const fetchAbort = ref<AbortController | null>(null)
const previousStatus = ref<UiImportProgress['status'] | null>(null)

const toast = () => useToast()

const startSSE = () => {
  if (esRef.value) return
  try {
    const es = new EventSource(`/api/admin/import/progress/${props.importId}`)
    esRef.value = es

    let gotEvent = false

    const handleProgress = (ev: MessageEvent) => {
      try {
        gotEvent = true
  const data = JSON.parse(ev.data)
  progress.value = normalizeProgress(data)
        // Stop polling if SSE active
        if (polling.value) { clearInterval(polling.value); polling.value = null }
        if (data?.status === 'completed' || data?.status === 'failed') {
          try { es.close() } catch {}
          esRef.value = null
        }
      } catch {}
    }

    // Server emits named events ("progress", "heartbeat", "close"). Listen explicitly.
    es.addEventListener('progress', handleProgress)
    // Fallback in case server ever emits default message events
    es.onmessage = handleProgress

    es.addEventListener('heartbeat', () => {
      // Keep-alive event from server
      gotEvent = true
    })

    es.addEventListener('close', (ev) => {
      try { es.close() } catch {}
      esRef.value = null
    })

    es.onerror = () => {
      // Fallback to polling
      try { es.close() } catch {}
      esRef.value = null
      if (isActive.value && !polling.value) {
        polling.value = setInterval(fetchProgress, 2000)
      }
    }

    // If no SSE message arrives shortly after connection, start polling as a safety net
    setTimeout(() => {
      if (!gotEvent && isActive.value && !polling.value) {
        polling.value = setInterval(fetchProgress, 2000)
      }
    }, 1500)
  } catch (e) {
    // Fallback to polling if EventSource fails to construct
    if (isActive.value && !polling.value) polling.value = setInterval(fetchProgress, 2000)
  }
}

// Computed
const isActive = computed<boolean>(() => {
  const s = progress.value?.status
  return s === 'processing' || s === 'pending'
})

// Methods
const fetchProgress = async (): Promise<void> => {
  try {
    // Abort previous in-flight request to avoid overlaps
    if (fetchAbort.value) {
      try { fetchAbort.value.abort() } catch {}
    }
    fetchAbort.value = new AbortController()
    const response = await $fetch<{ data: UiImportProgress }>(`/api/admin/import/progress/${props.importId}` , {
      signal: fetchAbort.value.signal
    })
  progress.value = normalizeProgress(response.data)
    
    // Stop polling if import is complete
    if (!isActive.value && polling.value) {
      clearInterval(polling.value)
      polling.value = null
    }
  } catch (error: any) {
    // Ignore intentional aborts
    if (error?.name === 'AbortError') return
    // If not found, notify parent so it can clear persisted state
    const statusCode = getErrorStatusCode(error)
    if (statusCode === 404) {
      emit('not-found')
      toast().toast({
        title: 'Import Not Found',
        description: 'This import may have finished or expired.',
        toast: 'warning',
      })
    } else {
      console.error('Failed to fetch progress:', error)
    }
    if (polling.value) {
      clearInterval(polling.value)
      polling.value = null
    }
  }
}

const getErrorStatusCode = (err: any): number | undefined => {
  return err?.statusCode ?? err?.status ?? err?.response?.status ?? err?.data?.statusCode ?? undefined
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

const downloadUnresolved = async () => {
  try {
    const id = props.importId
    const url = `/api/admin/import/unresolved/${id}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to download unresolved rows: ${res.status}`)
    const blob = await res.blob()
    const a = document.createElement('a')
    const objectUrl = URL.createObjectURL(blob)
    a.href = objectUrl
    a.download = `unresolved-${id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(objectUrl)
  } catch (e) {
    console.error(e)
  }
}

const downloadReport = async () => {
  try {
    const id = props.importId
    const fmt = reportFormat
    const url = `/api/admin/import/report/${id}?format=${fmt}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to download report: ${res.status}`)
    const blob = await res.blob()
    const a = document.createElement('a')
    const objectUrl = URL.createObjectURL(blob)
    a.href = objectUrl
    a.download = `import-report-${id}.${fmt}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(objectUrl)
  } catch (e) {
    console.error(e)
  }
}

const getStatusColor = (status: UiImportProgress['status'] | undefined): string => {
  switch (status) {
    case 'pending': return 'blue'
    case 'processing': return 'yellow'
    case 'completed': return 'green'
    case 'failed': return 'red'
    default: return 'gray'
  }
}

const formatDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString()
}

const formatDuration = (milliseconds?: number): string => {
  if (!milliseconds || milliseconds < 0) return '0s'
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
  startSSE()
  if (isActive.value && !polling.value && !esRef.value) {
    polling.value = setInterval(fetchProgress, 2000)
  }
})

onUnmounted(() => {
  if (polling.value) clearInterval(polling.value)
  if (esRef.value) { try { esRef.value.close() } catch {} esRef.value = null }
  if (fetchAbort.value) { try { fetchAbort.value.abort() } catch {} fetchAbort.value = null }
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

// Watch for completion to emit and toast once
watch(
  () => progress.value?.status,
  (newStatus: UiImportProgress['status'] | undefined) => {
    if (!newStatus) return
    if (previousStatus.value === newStatus) return
    previousStatus.value = newStatus
    if (newStatus === 'completed') {
      toast().toast({ title: 'Import Completed', description: 'Your data import has finished successfully.', toast: 'success' })
      emit('finished', { status: 'completed' })
    } else if (newStatus === 'failed') {
      toast().toast({ title: 'Import Failed', description: 'The import encountered errors and stopped.', toast: 'error' })
      emit('finished', { status: 'failed' })
    }
  }
)

// Safe computed collections for template
const recentErrors = computed<string[]>(() => progress.value?.recentErrors ?? [])
const recentWarnings = computed<string[]>(() => progress.value?.recentWarnings ?? [])
const errorCount = computed<number>(() => progress.value?.errorCount ?? 0)
const warningCount = computed<number>(() => progress.value?.warningCount ?? 0)

// Report format toggle (persist lightweight in-memory per session)
const reportFormat = ref<'ndjson' | 'csv'>('ndjson')
</script>
