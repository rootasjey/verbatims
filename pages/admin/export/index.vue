<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="font-title text-size-12 font-bold text-gray-900 dark:text-white">
        Export Data
      </h1>
      <p class="-mt-4 font-body text-gray-600 dark:text-gray-400">
        Export quotes data with filtering options in multiple formats
      </p>
    </div>

    <!-- Success/Error Alerts -->
    <div class="mb-6 space-y-4">
      <UAlert
        v-if="successMessage"
        color="green"
        variant="soft"
        :title="successMessage"
        :close-button="{ icon: 'i-ph-x', color: 'gray', variant: 'link', padded: false }"
        @close="successMessage = ''"
      />

      <UAlert
        v-if="errorMessage"
        color="red"
        variant="soft"
        :title="errorMessage"
        :close-button="{ icon: 'i-ph-x', color: 'gray', variant: 'link', padded: false }"
        @close="errorMessage = ''"
      />
    </div>

    <!-- Export Configuration -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Export Options -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">Export Configuration</h2>
        </template>

        <div class="space-y-6">
          <!-- Export Format -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Export Format
            </label>
            <div>
              <USelect
                v-model="exportOptions.format"
                :items="formatOptions"
                item-key="value"
                value-key="value"
                placeholder="Select format"
              />
            </div>
          </div>

          <!-- Include Options -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Include Data
            </label>
            <div class="space-y-3">
              <UCheckbox
                v-model="exportOptions.include_relations"
                label="Include related data (author, reference, tags)"
              />
              <UCheckbox
                v-model="exportOptions.include_user_data"
                label="Include user information"
              />
              <UCheckbox
                v-model="exportOptions.include_moderation_data"
                label="Include moderation history"
              />
              <UCheckbox
                v-model="exportOptions.include_analytics"
                label="Include analytics (views, likes, shares)"
              />
              <UCheckbox
                v-model="exportOptions.include_metadata"
                label="Include export metadata"
              />
            </div>
          </div>

          <!-- Export Limit -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Record Limit (0 = no limit)
            </label>
            <UInput
              v-model.number="exportOptions.limit"
              type="number"
              min="0"
              placeholder="0"
            />
          </div>
        </div>
      </UCard>

      <!-- Filters -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">Filters</h2>
        </template>

        <div class="space-y-6">
          <!-- Status Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quote Status
            </label>
            <div>
              <USelect
                v-model="filters.status"
                :items="statusOptions"
                item-key="value"
                value-key="value"
                placeholder="All statuses"
                multiple
              />
            </div>
          </div>

          <!-- Language Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Language
            </label>
            <div>
              <USelect
                v-model="filters.language"
                :items="languageOptions"
                item-key="value"
                value-key="value"
                placeholder="All languages"
                multiple
              />
            </div>
          </div>

          <!-- Author Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Author Name (search)
            </label>
            <UInput
              v-model="filters.author_name"
              placeholder="Search by author name"
            />
          </div>

          <!-- Date Range -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <div class="grid grid-cols-2 gap-3">
              <UInput
                v-model="filters.date_range?.start"
                type="date"
                placeholder="Start date"
              />
              <UInput
                v-model="filters.date_range?.end"
                type="date"
                placeholder="End date"
              />
            </div>
          </div>

          <!-- Search -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quote Content Search
            </label>
            <UInput
              v-model="filters.search"
              placeholder="Search in quote content"
            />
          </div>

          <!-- Featured Only -->
          <div>
            <UCheckbox
              v-model="filters.featured_only"
              label="Featured quotes only"
            />
          </div>

          <!-- Analytics Filters -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Min Views
              </label>
              <UInput
                v-model.number="filters.min_views"
                type="number"
                min="0"
                placeholder="0"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Min Likes
              </label>
              <UInput
                v-model.number="filters.min_likes"
                type="number"
                min="0"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Export Actions -->
    <div class="mt-8 flex flex-col sm:flex-row gap-4">
      <UButton
        btn="outline"
        :disabled="isExporting"
        @click="validateExport"
      >
        <UIcon name="i-ph-magnifying-glass" />
        Preview Export
      </UButton>

      <UButton
        btn="solid-black"
        :loading="isExporting"
        :disabled="!exportOptions.format.value"
        @click="startExport"
      >
        <UIcon name="i-ph-download" />
        Export Data
      </UButton>

      <UButton
        btn="ghost"
        :disabled="isExporting"
        @click="resetFilters"
      >
        <UIcon name="i-ph-arrow-clockwise" />
        Reset Filters
      </UButton>
    </div>

    <!-- Export Preview -->
    <div v-if="previewData" class="mt-8">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Export Preview</h3>
        </template>

        <div class="space-y-4">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Estimated records:</strong> {{ previewData.estimated_count }}</p>
            <p><strong>Estimated size:</strong> {{ formatFileSize(previewData.estimated_size || 0) }}</p>
          </div>

          <div v-if="previewData.warnings.length > 0" class="space-y-2">
            <h4 class="font-medium text-yellow-700 dark:text-yellow-300">Warnings:</h4>
            <ul class="list-disc list-inside text-sm text-yellow-600 dark:text-yellow-400">
              <li v-for="warning in previewData.warnings" :key="warning">{{ warning }}</li>
            </ul>
          </div>

          <div v-if="previewData.errors.length > 0" class="space-y-2">
            <h4 class="font-medium text-red-700 dark:text-red-300">Errors:</h4>
            <ul class="list-disc list-inside text-sm text-red-600 dark:text-red-400">
              <li v-for="error in previewData.errors" :key="error">{{ error }}</li>
            </ul>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Export Progress Dialog -->
    <UDialog v-model="showProgressDialog">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Export in Progress</h3>
        </template>

        <div class="space-y-4">
          <div v-if="exportProgress">
            <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>{{ exportProgress.current_step || 'Processing...' }}</span>
              <span>{{ exportProgress.progress }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                class="bg-red-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${exportProgress.progress}%` }"
              />
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {{ exportProgress.processed_records || 0 }} / {{ exportProgress.total_records || 0 }} records
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton
              btn="ghost"
              :disabled="exportProgress?.status === 'processing'"
              @click="showProgressDialog = false"
            >
              Close
            </UButton>
          </div>
        </template>
      </UCard>
    </UDialog>

    <!-- Export History -->
    <div class="mt-12">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Export History</h2>
        <UButton
          btn="outline"
          size="sm"
          @click="loadExportHistory"
        >
          <UIcon name="i-ph-arrow-clockwise" />
          Refresh
        </UButton>
      </div>

      <UCard>
        <div v-if="isLoadingHistory" class="flex justify-center py-8">
          <UIcon name="i-ph-spinner" class="w-6 h-6 animate-spin" />
        </div>

        <div v-else-if="exportHistory.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
          No export history found
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Filename</th>
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Format</th>
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Records</th>
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Size</th>
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">User</th>
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Created</th>
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Downloads</th>
                <th class="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="entry in exportHistory"
                :key="entry.id"
                class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td class="py-3 px-4">
                  <div class="font-medium text-gray-900 dark:text-white">
                    {{ entry.filename }}
                  </div>
                  <div v-if="entry.filters_applied" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Filters applied
                  </div>
                </td>
                <td class="py-3 px-4">
                  <UBadge
                    :label="entry.format.toUpperCase()"
                    :color="getFormatColor(entry.format)"
                    variant="subtle"
                    size="xs"
                  />
                </td>
                <td class="py-3 px-4 text-gray-600 dark:text-gray-400">
                  {{ entry.record_count.toLocaleString() }}
                </td>
                <td class="py-3 px-4 text-gray-600 dark:text-gray-400">
                  {{ formatFileSize(entry.file_size || 0) }}
                </td>
                <td class="py-3 px-4 text-gray-600 dark:text-gray-400">
                  {{ entry.user_name }}
                </td>
                <td class="py-3 px-4 text-gray-600 dark:text-gray-400">
                  {{ formatDate(entry.created_at) }}
                </td>
                <td class="py-3 px-4 text-gray-600 dark:text-gray-400">
                  {{ entry.download_count }}
                </td>
                <td class="py-3 px-4">
                  <div class="flex items-center gap-2">
                    <UButton
                      v-if="!isExpired(entry.expires_at)"
                      btn="outline"
                      size="xs"
                      @click="downloadExport(entry.id)"
                    >
                      <UIcon name="i-ph-download" />
                      Download
                    </UButton>
                    <span v-else class="text-xs text-gray-400">Expired</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="historyPagination.totalPages > 1" class="flex justify-center mt-6">
          <div class="flex items-center gap-2">
            <UButton
              btn="outline"
              size="sm"
              :disabled="historyPagination.page === 1"
              @click="loadExportHistory(historyPagination.page - 1)"
            >
              Previous
            </UButton>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              Page {{ historyPagination.page }} of {{ historyPagination.totalPages }}
            </span>
            <UButton
              btn="outline"
              size="sm"
              :disabled="historyPagination.page === historyPagination.totalPages"
              @click="loadExportHistory(historyPagination.page + 1)"
            >
              Next
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ExportOptions, QuoteExportFilters, ExportValidation, ExportProgress, ExportHistoryEntry } from '~/types/export'

// SEO and permissions
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({
  title: 'Export Data - Admin'
})

// Reactive state
const isExporting = ref(false)
const showProgressDialog = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const previewData = ref<ExportValidation | null>(null)
const exportProgress = ref<ExportProgress | null>(null)

// Export history
const exportHistory = ref<ExportHistoryEntry[]>([])
const isLoadingHistory = ref(false)
const historyPagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasMore: false
})

// Export options
const exportOptions = ref({
  format: { label: 'JSON', value: 'json' },
  data_type: 'quotes',
  include_relations: true,
  include_user_data: false,
  include_moderation_data: false,
  include_analytics: true,
  include_metadata: false,
  limit: 0
})

// Filters
const filters = ref<QuoteExportFilters>({
  status: [],
  language: [],
  author_name: '',
  date_range: {
    start: '',
    end: ''
  },
  search: '',
  featured_only: false,
  min_views: 0,
  min_likes: 0
})

// Options for selects
const formatOptions = [
  { label: 'JSON', value: 'json' },
  { label: 'CSV', value: 'csv' },
  { label: 'XML', value: 'xml' }
]

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' }
]

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'Spanish', value: 'es' },
  { label: 'German', value: 'de' },
  { label: 'Italian', value: 'it' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Russian', value: 'ru' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Chinese', value: 'zh' }
]

// Methods
const validateExport = async () => {
  try {
    errorMessage.value = ''

    const response = await $fetch('/api/admin/export/validate', {
      method: 'POST',
      body: {
        ...exportOptions.value,
        format: exportOptions.value.format.value, // Extract the actual format value
        filters: filters.value
      }
    })

    previewData.value = response.data

    if (!response.data.valid) {
      errorMessage.value = 'Export validation failed. Please check the errors below.'
    }

  } catch (error: any) {
    console.error('Export validation failed:', error)
    errorMessage.value = error.data?.message || 'Failed to validate export'
  }
}

const startExport = async () => {
  try {
    isExporting.value = true
    showProgressDialog.value = true
    errorMessage.value = ''
    successMessage.value = ''

    // Show toast notification
    const { toast } = useToast()

    // Start the export
    const response = await $fetch('/api/admin/export/quotes', {
      method: 'POST',
      body: {
        ...exportOptions.value,
        format: exportOptions.value.format.value, // Extract the actual format value
        filters: filters.value
      }
    })

    if (response.success) {
      // If content is included directly (small exports)
      if (response.data.content && response.data.mimeType) {
        downloadContent(response.data.content, response.data.filename, response.data.mimeType)
        successMessage.value = `Export completed successfully! ${response.data.record_count} records exported.`
        toast({
          title: 'Export Completed',
          description: `Successfully exported ${response.data.record_count} records`
        })
      } else {
        // For larger exports, redirect to download URL
        window.open(response.data.download_url, '_blank')
        successMessage.value = `Export completed successfully! ${response.data.record_count} records exported. Download started.`
        toast({
          title: 'Export Completed',
          description: `Successfully exported ${response.data.record_count} records. Download started.`
        })
      }

      // Reset preview data and reload history
      previewData.value = null
      loadExportHistory()
    }

  } catch (error: any) {
    console.error('Export failed:', error)
    const errorMsg = error.data?.message || 'Export failed'
    errorMessage.value = errorMsg

    toast({
      title: 'Export Failed',
      description: errorMsg
    })
  } finally {
    isExporting.value = false
    showProgressDialog.value = false
  }
}

const resetFilters = () => {
  filters.value = {
    status: [],
    language: [],
    author_name: '',
    date_range: {
      start: '',
      end: ''
    },
    search: '',
    featured_only: false,
    min_views: 0,
    min_likes: 0
  }
  previewData.value = null
  errorMessage.value = ''
  successMessage.value = ''
}

const downloadContent = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Export history methods
const loadExportHistory = async (page = 1) => {
  try {
    isLoadingHistory.value = true

    const response = await $fetch('/api/admin/export/history', {
      query: {
        page,
        limit: historyPagination.value.limit
      }
    })

    if (response.success) {
      exportHistory.value = response.data
      historyPagination.value = {
        ...historyPagination.value,
        ...response.pagination
      }
    }

  } catch (error: any) {
    console.error('Failed to load export history:', error)
    errorMessage.value = 'Failed to load export history'
  } finally {
    isLoadingHistory.value = false
  }
}

const downloadExport = async (exportId: string) => {
  try {
    window.open(`/api/admin/export/download/${exportId}`, '_blank')

    const { toast } = useToast()
    toast({
      title: 'Download Started',
      description: 'Export download has been initiated'
    })
  } catch (error: any) {
    console.error('Failed to download export:', error)
    errorMessage.value = 'Failed to download export'

    const { toast } = useToast()
    toast({
      title: 'Download Failed',
      description: 'Failed to start export download'
    })
  }
}

const getFormatColor = (format: string) => {
  const colors = {
    json: 'blue',
    csv: 'green',
    xml: 'orange'
  }
  return colors[format as keyof typeof colors] || 'gray'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const isExpired = (expiresAt: string | undefined) => {
  if (!expiresAt) return true
  return new Date(expiresAt) <= new Date()
}

// Clean up filters on mount and load export history
onMounted(() => {
  // Remove empty values from filters
  Object.keys(filters.value).forEach(key => {
    const value = (filters.value as any)[key]
    if (Array.isArray(value) && value.length === 0) {
      delete (filters.value as any)[key]
    } else if (value === '' || value === 0) {
      delete (filters.value as any)[key]
    }
  })

  // Load export history
  loadExportHistory()
})
</script>
