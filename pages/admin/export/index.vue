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
        v-if="state.successMessage"
        color="green"
        variant="soft"
        closable
        :title="state.successMessage"
        :close-button="{ icon: 'i-ph-x', color: 'gray', variant: 'link', padded: false }"
        @close="clearMessages"
      />

      <UAlert
        v-if="state.errorMessage"
        color="red"
        variant="soft"
        closable
        :title="state.errorMessage"
        :close-button="{ icon: 'i-ph-x', color: 'gray', variant: 'link', padded: false }"
        @close="clearMessages"
      />
    </div>

    <!-- Export Tabs -->
    <UTabs v-model="activeTab" :items="exportTabs" class="w-full">
      <template #content="{ item }">
        <!-- Quotes Export Tab -->
        <div v-if="item.value === 'quotes'" class="space-y-6 pt-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Export Options -->
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">Export Configuration</h3>
              </template>

              <div class="space-y-4">
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

            <!-- Quotes Filters -->
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">Filters</h3>
              </template>

              <div class="space-y-4">
                <!-- Status Filter -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quote Status
                  </label>
                  <div>
                    <USelect
                      v-model="quotesFilters.status"
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
                      v-model="quotesFilters.language"
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
                    v-model="quotesFilters.author_name"
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
                      v-model="quotesFilters.date_range.start"
                      type="date"
                      placeholder="Start date"
                    />
                    <UInput
                      v-model="quotesFilters.date_range.end"
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
                    v-model="quotesFilters.search"
                    placeholder="Search in quote content"
                  />
                </div>

                <!-- Featured Only -->
                <div>
                  <UCheckbox
                    v-model="quotesFilters.featured_only"
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
                      v-model.number="quotesFilters.min_views"
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
                      v-model.number="quotesFilters.min_likes"
                      type="number"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- References Export Tab -->
        <div v-else-if="item.value === 'references'" class="space-y-6 pt-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Export Options -->
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">Export Configuration</h3>
              </template>

              <div class="space-y-4">
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
                      label="Include quotes count"
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

            <!-- References Filters -->
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold">Filters</h3>
              </template>

              <div class="space-y-4">
                <!-- Primary Type Filter -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary Type
                  </label>
                  <div>
                    <USelect
                      v-model="referencesFilters.primary_type"
                      :items="primaryTypeOptions"
                      item-key="value"
                      value-key="value"
                      placeholder="All types"
                      multiple
                    />
                  </div>
                </div>

                <!-- Search -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reference Name (search)
                  </label>
                  <UInput
                    v-model="referencesFilters.search"
                    placeholder="Search by reference name"
                  />
                </div>

                <!-- Date Range -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date Range
                  </label>
                  <div class="grid grid-cols-2 gap-3">
                    <UInput
                      v-model="referencesFilters.date_range!.start"
                      type="date"
                      placeholder="Start date"
                    />
                    <UInput
                      v-model="referencesFilters.date_range!.end"
                      type="date"
                      placeholder="End date"
                    />
                  </div>
                </div>

                <!-- Analytics Filters -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Min Views
                    </label>
                    <UInput
                      v-model.number="referencesFilters.min_views"
                      type="number"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Min Quotes
                    </label>
                    <UInput
                      v-model.number="referencesFilters.min_quotes"
                      type="number"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- Authors Export Tab (Placeholder) -->
        <div v-else-if="item.value === 'authors'" class="space-y-4 pt-6">
          <div class="text-center py-12 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            <UIcon name="i-ph-user-circle" class="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 class="text-xl font-medium text-gray-900 dark:text-white mb-2">
              Authors Export
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Authors export functionality is coming soon. This will allow you to export author data with comprehensive filtering options.
            </p>
            <UButton btn="outline" disabled>
              <UIcon name="i-ph-clock" />
              Coming Soon
            </UButton>
          </div>
        </div>

        <!-- Users Export Tab (Placeholder) -->
        <div v-else-if="item.value === 'users'" class="space-y-4 pt-6">
          <div class="text-center py-12 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            <UIcon name="i-ph-users" class="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 class="text-xl font-medium text-gray-900 dark:text-white mb-2">
              Users Export
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Users export functionality is coming soon. This will allow you to export user data with privacy-compliant filtering options.
            </p>
            <UButton btn="outline" disabled>
              <UIcon name="i-ph-clock" />
              Coming Soon
            </UButton>
          </div>
        </div>
      </template>
    </UTabs>

    <!-- Export Actions -->
    <div class="mt-8 flex flex-col sm:flex-row gap-4">
      <UButton
        btn="outline"
        :disabled="state.isExporting"
        @click="validateExport"
      >
        <UIcon name="i-ph-magnifying-glass" />
        Preview Export
      </UButton>

      <UButton
        btn="solid-black"
        :loading="state.isExporting"
        :disabled="!exportOptions.format.value"
        @click="startExport"
      >
        <UIcon name="i-ph-download" />
        Export Data
      </UButton>

      <UButton
        btn="ghost"
        :disabled="state.isExporting"
        @click="resetFilters"
      >
        <UIcon name="i-ph-arrow-clockwise" />
        Reset Filters
      </UButton>
    </div>

    <!-- Export Preview -->
    <div v-if="state.previewData" class="mt-8">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Export Preview</h3>
        </template>

        <div class="space-y-4">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Estimated records:</strong> {{ state.previewData.estimated_count }}</p>
            <p><strong>Estimated size:</strong> {{ formatFileSize(state.previewData.estimated_size || 0) }}</p>
          </div>

          <div v-if="state.previewData.warnings.length > 0" class="space-y-2">
            <h4 class="font-medium text-yellow-700 dark:text-yellow-300">Warnings:</h4>
            <ul class="list-disc list-inside text-sm text-yellow-600 dark:text-yellow-400">
              <li v-for="warning in state.previewData.warnings" :key="warning">{{ warning }}</li>
            </ul>
          </div>

          <div v-if="state.previewData.errors.length > 0" class="space-y-2">
            <h4 class="font-medium text-red-700 dark:text-red-300">Errors:</h4>
            <ul class="list-disc list-inside text-sm text-red-600 dark:text-red-400">
              <li v-for="error in state.previewData.errors" :key="error">{{ error }}</li>
            </ul>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Export Progress Dialog -->
    <UDialog v-model:open="state.showProgressDialog">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Export in Progress</h3>
        </template>

        <div class="space-y-4">
          <div class="text-center py-8">
            <UIcon name="i-ph-spinner" class="w-8 h-8 animate-spin text-red-600 mx-auto mb-4" />
            <p class="text-gray-600 dark:text-gray-400">
              Processing export... This may take a few moments.
            </p>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton
              btn="ghost"
              :disabled="state.isExporting"
              @click="closeProgressDialog"
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
        <div class="flex items-center gap-3">
          <UButton
            btn="outline"
            size="sm"
            @click="loadExportHistory"
          >
            <UIcon name="i-ph-arrow-clockwise" />
            Refresh
          </UButton>
          <UButton
            btn="outline"
            size="sm"
            color="red"
            :disabled="state.exportHistory.length === 0"
            @click="showClearHistoryDialog = true"
          >
            <UIcon name="i-ph-trash" />
            Clear All History
          </UButton>
        </div>
      </div>

      <UCard>
        <div v-if="state.isLoadingHistory" class="flex justify-center py-8">
          <UIcon name="i-ph-spinner" class="w-6 h-6 animate-spin" />
        </div>

        <div v-else-if="state.exportHistory.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
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
                v-for="entry in state.exportHistory"
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
                    <UButton
                      btn="outline"
                      size="xs"
                      color="red"
                      @click="confirmDeleteEntry(entry.id, entry.filename)"
                    >
                      <UIcon name="i-ph-trash" />
                    </UButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="state.historyPagination.totalPages > 1" class="flex justify-center mt-6">
          <div class="flex items-center gap-2">
            <UButton
              btn="outline"
              size="sm"
              :disabled="state.historyPagination.page === 1"
              @click="loadExportHistory(state.historyPagination.page - 1)"
            >
              Previous
            </UButton>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              Page {{ state.historyPagination.page }} of {{ state.historyPagination.totalPages }}
            </span>
            <UButton
              btn="outline"
              size="sm"
              :disabled="state.historyPagination.page === state.historyPagination.totalPages"
              @click="loadExportHistory(state.historyPagination.page + 1)"
            >
              Next
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Clear All History Confirmation Dialog -->
    <UDialog v-model:open="showClearHistoryDialog">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Clear All Export History</h3>
        </template>

        <div class="space-y-4">
          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to clear all export history? This action cannot be undone.
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-500">
            This will permanently delete {{ state.exportHistory.length }} export history entries.
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              btn="ghost"
              @click="showClearHistoryDialog = false"
            >
              Cancel
            </UButton>
            <UButton
              btn="solid"
              color="red"
              @click="handleClearAllHistory"
            >
              Clear All History
            </UButton>
          </div>
        </template>
      </UCard>
    </UDialog>

    <!-- Delete Entry Confirmation Dialog -->
    <UDialog v-model:open="showDeleteEntryDialog">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Delete Export Entry</h3>
        </template>

        <div class="space-y-4">
          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this export history entry?
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-500 font-mono">
            {{ deleteEntryData.filename }}
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              btn="ghost"
              @click="showDeleteEntryDialog = false"
            >
              Cancel
            </UButton>
            <UButton
              btn="solid"
              color="red"
              @click="handleDeleteEntry"
            >
              Delete Entry
            </UButton>
          </div>
        </template>
      </UCard>
    </UDialog>
  </div>
</template>

<script setup lang="ts">
// SEO and permissions
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({
  title: 'Export Data - Admin'
})

// Use the data export composable
const {
  state,
  exportOptions,
  quotesFilters,
  referencesFilters,
  formatOptions,
  statusOptions,
  languageOptions,
  primaryTypeOptions,
  validateExport,
  startExport,
  resetFilters,
  loadExportHistory,
  downloadExport,
  deleteExportHistoryEntry,
  clearAllExportHistory,
  formatFileSize,
  getFormatColor,
  formatDate,
  isExpired
} = useDataExport()

// Tab management
const activeTab = ref('quotes')

const exportTabs = [
  { name: 'Quotes', value: 'quotes', icon: 'i-ph-quotes' },
  { name: 'References', value: 'references', icon: 'i-ph-book' },
  { name: 'Authors', value: 'authors', icon: 'i-ph-user-circle' },
  { name: 'Users', value: 'users', icon: 'i-ph-users' }
]

// Dialog management
const showClearHistoryDialog = ref(false)
const showDeleteEntryDialog = ref(false)
const deleteEntryData = ref({ id: '', filename: '' })

// Watch for tab changes to update export data type and clear state
watch(activeTab, (newTabValue) => {
  const selectedTab = exportTabs.find(tab => tab.value === newTabValue)
  if (selectedTab) {
    exportOptions.value.data_type = {
      label: selectedTab.name,
      value: selectedTab.value as any
    }
  }

  // Clear alerts and preview when switching tabs
  clearMessages()
  state.previewData = null
})

// State management helpers
const clearMessages = () => {
  state.successMessage = ''
  state.errorMessage = ''
}

const closeProgressDialog = () => {
  state.showProgressDialog = false
}

// Export history management
const confirmDeleteEntry = (exportId: string, filename: string) => {
  deleteEntryData.value = { id: exportId, filename }
  showDeleteEntryDialog.value = true
}

const handleDeleteEntry = async () => {
  await deleteExportHistoryEntry(deleteEntryData.value.id)
  showDeleteEntryDialog.value = false
  deleteEntryData.value = { id: '', filename: '' }
}

const handleClearAllHistory = async () => {
  await clearAllExportHistory()
  showClearHistoryDialog.value = false
}

// Load export history on mount
onMounted(() => {
  loadExportHistory()
})
</script>
