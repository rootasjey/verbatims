<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="font-title text-size-12 font-bold text-gray-900 dark:text-white">
        Export Data
      </h1>
      <p class="-mt-4 font-body text-gray-600 dark:text-gray-400">
        Export data with filtering options in multiple formats using our step-by-step process
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

    <!-- Main Export Interface with Tabs -->
    <UTabs v-model="activeTab" :items="mainTabs" class="w-full">
      <template #content="{ item }">
        <!-- Data Export Tab (Quotes, References, Authors, Users) -->
        <div v-if="['quotes', 'references', 'authors', 'users'].includes(item.value)" class="pt-6">
          <!-- Step-by-Step Interface with Cards -->
          <div class="space-y-6">
            <!-- Step 1: Export Configuration -->
            <UCard class="border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20">
              <template #header>
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <span class="text-sm font-semibold text-primary-600 dark:text-primary-400">1</span>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-900 dark:text-white">Export Configuration</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Choose data type and format</p>
                  </div>
                </div>
              </template>

              <div class="space-y-6">
                <!-- Data Type Selection -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Data Type
                  </label>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <UButton
                      v-for="dataType in dataTypeOptions"
                      :key="dataType.value"
                      :btn="exportOptions.data_type.value === dataType.value ? 'solid-primary' : 'outline'"
                      :disabled="!dataType.available"
                      class="justify-start p-4 h-auto"
                      @click="selectDataType(dataType)"
                    >
                      <div class="flex flex-col items-start gap-1">
                        <div class="flex items-center gap-2">
                          <UIcon :name="dataType.icon" class="w-4 h-4" />
                          <span class="font-medium">{{ dataType.label }}</span>
                        </div>
                        <span class="text-xs opacity-75">{{ dataType.description }}</span>
                      </div>
                    </UButton>
                  </div>
                </div>

                <!-- Export Format -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <!-- Include Options -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Include Data
                  </label>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <UCheckbox
                      v-model="exportOptions.include_relations"
                      :label="getIncludeRelationsLabel()"
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
              </div>
            </UCard>

            <!-- Step 2: Filters -->
            <UCard class="border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20">
              <template #header>
                <UCollapsible>
                  <UCollapsibleTrigger class="w-full">
                    <div class="flex items-center justify-between w-full p-0">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <span class="text-sm font-semibold text-blue-600 dark:text-blue-400">2</span>
                        </div>
                        <div class="text-left">
                          <h3 class="font-semibold text-gray-900 dark:text-white">Filters</h3>
                          <p class="text-sm text-gray-600 dark:text-gray-400">Optional filtering criteria (click to expand)</p>
                        </div>
                      </div>
                      <UIcon name="i-ph-caret-down" class="w-5 h-5 text-gray-400 transition-transform ui-open:rotate-180" />
                    </div>
                  </UCollapsibleTrigger>

                  <UCollapsibleContent>
                    <div class="pt-4 space-y-6">
                      <!-- Dynamic Filters based on Data Type -->
                      <div v-if="exportOptions.data_type.value === 'quotes'">
                        <QuotesFilters
                          v-model="quotesFilters"
                          :status-options="statusOptions"
                          :language-options="languageOptions"
                        />
                      </div>

                      <div v-else-if="exportOptions.data_type.value === 'references'">
                        <ReferencesFilters
                          v-model="referencesFilters"
                          :primary-type-options="primaryTypeOptions"
                        />
                      </div>

                      <div v-else-if="exportOptions.data_type.value === 'authors'">
                        <AuthorsFilters
                          v-model="authorsFilters"
                        />
                      </div>

                      <div v-else-if="exportOptions.data_type.value === 'users'">
                        <div class="text-center py-8 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                          <UIcon name="i-ph-funnel" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p class="text-gray-600 dark:text-gray-400">
                            Filters for {{ exportOptions.data_type.label }} will be available soon
                          </p>
                        </div>
                      </div>
                    </div>
                  </UCollapsibleContent>
                </UCollapsible>
              </template>
            </UCard>

            <!-- Step 3: Preview Export -->
            <UCard class="border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20">
              <template #header>
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <span class="text-sm font-semibold text-green-600 dark:text-green-400">3</span>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-900 dark:text-white">Preview Export</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Review data before export</p>
                  </div>
                </div>
              </template>

              <div class="space-y-4">
                <div class="flex justify-start">
                  <UButton
                    btn="outline"
                    :disabled="state.isExporting || !exportOptions.format.value"
                    @click="validateExport"
                  >
                    <UIcon name="i-ph-magnifying-glass" />
                    Generate Preview
                  </UButton>
                </div>

                <!-- Export Preview Results -->
                <div v-if="state.previewData" class="border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div class="text-2xl font-bold text-gray-900 dark:text-white">
                          {{ state.previewData.estimated_count?.toLocaleString() || 0 }}
                        </div>
                        <div class="text-gray-600 dark:text-gray-400">Records</div>
                      </div>
                      <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div class="text-2xl font-bold text-gray-900 dark:text-white">
                          {{ formatFileSize(state.previewData.estimated_size || 0) }}
                        </div>
                        <div class="text-gray-600 dark:text-gray-400">Estimated Size</div>
                      </div>
                      <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div class="text-2xl font-bold text-gray-900 dark:text-white">
                          {{ exportOptions.format.label }}
                        </div>
                        <div class="text-gray-600 dark:text-gray-400">Format</div>
                      </div>
                    </div>

                    <div v-if="state.previewData.warnings.length > 0" class="space-y-2">
                      <h4 class="font-medium text-yellow-700 dark:text-yellow-300">Warnings:</h4>
                      <ul class="list-disc list-inside text-sm text-yellow-600 dark:text-yellow-400 space-y-1">
                        <li v-for="warning in state.previewData.warnings" :key="warning">{{ warning }}</li>
                      </ul>
                    </div>

                    <div v-if="state.previewData.errors.length > 0" class="space-y-2">
                      <h4 class="font-medium text-red-700 dark:text-red-300">Errors:</h4>
                      <ul class="list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1">
                        <li v-for="error in state.previewData.errors" :key="error">{{ error }}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </UCard>

            <!-- Step 4: Export Data -->
            <UCard class="border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20">
              <template #header>
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <span class="text-sm font-semibold text-purple-600 dark:text-purple-400">4</span>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-900 dark:text-white">Export Data</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Download your export</p>
                  </div>
                </div>
              </template>

              <div class="space-y-4">
                <div class="flex flex-col sm:flex-row gap-4">
                  <UButton
                    btn="solid-black"
                    :loading="state.isExporting"
                    :disabled="!exportOptions.format.value || state.isExporting"
                    @click="startExport"
                    class="flex-1"
                  >
                    <UIcon name="i-ph-download" />
                    {{ state.isExporting ? 'Exporting...' : 'Start Export' }}
                  </UButton>

                  <UButton
                    btn="ghost"
                    :disabled="state.isExporting"
                    @click="resetFilters"
                  >
                    <UIcon name="i-ph-arrow-clockwise" />
                    Reset All
                  </UButton>
                </div>

                <div class="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <UIcon name="i-ph-info" class="w-4 h-4 inline mr-2" />
                  Your export will be processed and downloaded automatically. Large exports may take a few moments.
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- Export History Tab -->
        <div v-else-if="item.value === 'history'" class="pt-6">
          <div class="space-y-6">
            <!-- Header with Actions -->
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Export History</h2>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  View and manage your previous exports
                </p>
              </div>
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
                  Clear All
                </UButton>
              </div>
            </div>

            <!-- Export History Content -->
            <UCard>
              <div v-if="state.isLoadingHistory" class="flex justify-center py-8">
                <UIcon name="i-ph-spinner" class="w-6 h-6 animate-spin" />
              </div>

              <div v-else-if="state.exportHistory.length === 0" class="text-center py-12">
                <UIcon name="i-ph-clock-countdown" class="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Export History
                </h3>
                <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Your export history will appear here once you start creating exports.
                </p>
                <UButton
                  btn="outline"
                  @click="activeTab = 'quotes'"
                >
                  <UIcon name="i-ph-download" />
                  Create Your First Export
                </UButton>
              </div>

              <div v-else class="export-history-container">
                <div class="overflow-x-auto">
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
                        class="text-size-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
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
                              btn="ghost"
                              size="xs"
                              @click="downloadExport(entry.id)"
                            >
                              <UIcon name="i-ph-download" />
                            </UButton>
                            <span v-else class="text-xs text-gray-400">Expired</span>
                            <UButton
                              btn="ghost"
                              size="xs"
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
              </div>
            </UCard>
          </div>
        </div>
      </template>
    </UTabs>

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
import QuotesFilters from '~/components/admin/export/QuotesFilters.vue'
import ReferencesFilters from '~/components/admin/export/ReferencesFilters.vue'
import AuthorsFilters from '~/components/admin/export/AuthorsFilters.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({
  title: 'Export Data - Admin'
})

const {
  state,
  exportOptions,
  quotesFilters,
  referencesFilters,
  authorsFilters,
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

const mainTabs = [
  { name: 'Quotes', value: 'quotes', icon: 'i-ph-quotes' },
  { name: 'References', value: 'references', icon: 'i-ph-book' },
  { name: 'Authors', value: 'authors', icon: 'i-ph-user-circle' },
  { name: 'Users', value: 'users', icon: 'i-ph-users' },
  {
    name: 'Export History',
    value: 'history',
    icon: 'i-ph-clock-countdown',
    class: 'border-l border-gray-200 dark:border-gray-700 ml-2 pl-2'
  }
]

// Data type options with availability status
const dataTypeOptions = [
  {
    label: 'Quotes',
    value: 'quotes',
    icon: 'i-ph-quotes',
    description: 'Export quote data',
    available: true
  },
  {
    label: 'References',
    value: 'references',
    icon: 'i-ph-book',
    description: 'Export reference data',
    available: true
  },
  {
    label: 'Authors',
    value: 'authors',
    icon: 'i-ph-user-circle',
    description: 'Export author data',
    available: true
  },
  {
    label: 'Users',
    value: 'users',
    icon: 'i-ph-users',
    description: 'Export user data',
    available: false
  }
]

// Dialog management
const showClearHistoryDialog = ref(false)
const showDeleteEntryDialog = ref(false)
const deleteEntryData = ref({ id: '', filename: '' })

// Methods for new UI
const selectDataType = (dataType: any) => {
  if (!dataType.available) return

  exportOptions.value.data_type = {
    label: dataType.label,
    value: dataType.value
  }

  // Clear preview when changing data type
  state.previewData = null
  clearMessages()
}

const getIncludeRelationsLabel = () => {
  const dataType = exportOptions.value.data_type.value
  switch (dataType) {
    case 'quotes':
      return 'Include related data (author, reference, tags)'
    case 'references':
      return 'Include quotes count'
    case 'authors':
      return 'Include quotes count'
    case 'users':
      return 'Include collection data'
    default:
      return 'Include related data'
  }
}

// Watch for tab changes to update export data type and clear state
watch(activeTab, (newTabValue) => {
  const selectedTab = mainTabs.find((tab: any) => tab.value === newTabValue)
  if (selectedTab && selectedTab.value !== 'history') {
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

<style scoped>
.export-history-container {
  max-width: calc(100vw - 20rem);
  max-height: calc(100vh - 20rem);
  overflow-y: auto;
}

/* Custom tab styling for Export History */
:deep(.una-tabs-list) {
  border-bottom: 1px solid theme('colors.gray.200');
}

:deep(.dark .una-tabs-list) {
  border-bottom-color: theme('colors.gray.700');
}

/* Accordion step styling */
:deep(.accordion-item) {
  transition: all 0.2s ease;
}

:deep(.accordion-item:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.dark .accordion-item:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
