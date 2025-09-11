<template>
  <div class="space-y-6">
    <!-- Summary Stats -->
    <div v-if="summary" class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div class="text-2xl font-bold">{{ summary.total }}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Total Imports</div>
      </div>
      <div class="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div class="text-2xl font-bold text-green-600">{{ summary.completed }}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Completed</div>
      </div>
      <div class="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <div class="text-2xl font-bold text-yellow-600">{{ summary.processing }}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Processing</div>
      </div>
      <div class="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div class="text-2xl font-bold text-red-600">{{ summary.failed }}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Failed</div>
      </div>
      <div class="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div class="text-2xl font-bold text-blue-600">{{ summary.totalRecordsImported }}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Records Imported</div>
      </div>
    </div>

    <!-- Filters -->
    <UCard>
      <div class="flex flex-wrap gap-4 items-center">
        <div>
          <label class="block text-sm font-medium mb-1">Status Filter</label>
          <USelect
            v-model="statusFilter"
            :options="statusOptions"
            placeholder="All statuses"
            @change="loadImports"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">Records per page</label>
          <USelect
            v-model="pageSize"
            :options="pageSizeOptions"
            @change="loadImports"
          />
        </div>
        
        <div class="flex-1"></div>
        
        <UButton
          icon
          label="i-ph-arrow-clockwise"
          @click="loadImports"
          :loading="loading"
        >
          Refresh
        </UButton>
      </div>
    </UCard>

    <!-- Import List -->
    <UCard>
      <template #header>
        <h2 class="text-xl font-semibold">Import History</h2>
      </template>

      <div v-if="loading && imports.length === 0" class="text-center py-8">
        <UIcon name="i-ph-spinner" class="animate-spin text-2xl mb-2" />
        <p>Loading import history...</p>
      </div>

      <div v-else-if="imports.length === 0" class="text-center py-8 text-gray-500">
        No imports found.
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="importItem in imports"
          :key="importItem.id"
          class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <UBadge
                  :color="getStatusColor(importItem.status)"
                  :label="importItem.status.toUpperCase()"
                />
                <UBadge
                  color="gray"
                  :label="(importItem.dataType || 'unknown').toUpperCase()"
                />
                <span class="text-sm text-gray-500">{{ importItem.id }}</span>
              </div>
              
              <div class="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-3">
                <div>
                  <span class="font-medium">Total Records:</span>
                  {{ importItem.totalRecords }}
                </div>
                <div>
                  <span class="font-medium">Success:</span>
                  <span class="text-green-600">{{ importItem.successfulRecords }}</span>
                </div>
                <div>
                  <span class="font-medium">Failed:</span>
                  <span class="text-red-600">{{ importItem.failedRecords }}</span>
                </div>
                <div>
                  <span class="font-medium">Warnings:</span>
                  <span class="text-yellow-600">{{ importItem.warningCount }}</span>
                </div>
                <div>
                  <span class="font-medium">Duration:</span>
                  {{ formatDuration(importItem.duration) }}
                </div>
              </div>
              
              <div class="flex items-center gap-4 text-sm text-gray-500">
                <span>Started: {{ formatDate(importItem.startedAt) }}</span>
                <span v-if="importItem.completedAt">
                  Completed: {{ formatDate(importItem.completedAt) }}
                </span>
              </div>
              
              <!-- Progress Bar for Active Imports -->
              <div v-if="importItem.status === 'processing'" class="mt-3">
                <div class="flex justify-between text-xs mb-1">
                  <span>Progress</span>
                  <span>{{ importItem.progressPercentage }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-1">
                  <div
                    class="bg-primary-600 h-1 rounded-full transition-all duration-300"
                    :style="{ width: `${importItem.progressPercentage}%` }"
                  ></div>
                </div>
              </div>
            </div>
            
            <div class="flex gap-2 ml-4">
              <UButton
                v-if="importItem.status === 'processing'"
                size="sm"
                btn="outline"
                @click="viewProgress(importItem.id)"
              >
                View Progress
              </UButton>

              <UButton
                v-if="importItem.status === 'completed' && importItem.failedRecords > 0"
                size="sm"
                btn="outline"
                color="yellow"
                @click="viewDetails(importItem)"
              >
                View Issues
              </UButton>

              <UButton
                v-if="importItem.status === 'failed'"
                size="sm"
                btn="outline"
                color="red"
                @click="viewDetails(importItem)"
              >
                View Errors
              </UButton>

              <UDropdown :items="getActionItems(importItem)">
                <UButton
                  size="sm"
                  btn="ghost"
                  icon
                  label="i-ph-dots-three-vertical"
                />
              </UDropdown>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.total > pageSize" class="flex justify-center mt-6">
        <UPagination
          v-model:page="currentPage"
          :items-per-page="pageSize"
          :total="pagination.total"
          @update:page="loadImports"
        />
      </div>
    </UCard>

    <!-- Details Modal -->
    <UModal v-model="showDetailsModal">
      <UCard v-if="selectedImport">
        <template #header>
          <h3 class="text-lg font-semibold">
            Import Details - {{ selectedImport.id }}
          </h3>
        </template>

        <div class="space-y-4">
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><strong>Status:</strong> {{ selectedImport.status }}</div>
            <div><strong>Type:</strong> {{ (selectedImport.dataType || 'unknown').toUpperCase() }}</div>
            <div><strong>Total Records:</strong> {{ selectedImport.totalRecords }}</div>
            <div><strong>Successful:</strong> {{ selectedImport.successfulRecords }}</div>
            <div><strong>Failed:</strong> {{ selectedImport.failedRecords }}</div>
            <div><strong>Warnings:</strong> {{ selectedImport.warningCount }}</div>
          </div>

          <div v-if="importDetails?.warnings?.length > 0">
            <h4 class="font-medium text-yellow-600 mb-2">Warnings</h4>
            <div class="max-h-40 overflow-y-auto space-y-1">
              <div
                v-for="(warning, index) in importDetails.warnings"
                :key="index"
                class="text-sm text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded"
              >
                {{ warning }}
              </div>
            </div>
          </div>

          <!-- Detailed errors -->
          <div v-if="importDetails?.errors?.length > 0">
            <h4 class="font-medium text-red-600 mb-2">Errors</h4>
            <div class="max-h-40 overflow-y-auto space-y-1">
              <div
                v-for="(error, index) in importDetails.errors"
                :key="index"
                class="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded"
              >
                {{ error }}
              </div>
            </div>
          </div>

          <!-- Backup snapshots linked to this import -->
          <div>
            <h4 class="font-medium mb-2">Backup Snapshots</h4>
            <div v-if="importBackups.length === 0" class="text-sm text-gray-500">No backups found for this import.</div>
            <ul v-else class="space-y-2">
              <li v-for="file in importBackups" :key="file.id" class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <UBadge color="gray" :label="(file.metadata?.data_type || 'unknown').toUpperCase()" />
                  <span class="truncate max-w-[50ch]" :title="file.file_path">{{ file.filename }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-500">{{ new Date(file.created_at).toLocaleString() }}</span>
                  <UButton size="xs" btn="ghost" :to="file.downloadUrl" target="_blank">
                    <UIcon name="i-ph-download" />
                    Download
                  </UButton>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              v-if="selectedImport.status === 'completed'"
              btn="outline"
              color="red"
              @click="rollbackImport"
            >
              Rollback
            </UButton>
            <UButton @click="showDetailsModal = false">Close</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
// Data
const imports = ref([])
const summary = ref(null)
const loading = ref(false)
const statusFilter = ref('')
const pageSize = ref(20)
const currentPage = ref(1)
const pagination = ref(null)
const showDetailsModal = ref(false)
const selectedImport = ref(null)
const importDetails = ref(null)
const importBackups = ref([])

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' }
]

const pageSizeOptions = [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
  { label: '100', value: 100 }
]

// Methods
const loadImports = async () => {
  loading.value = true
  
  try {
    const params = {
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value
    }
    
    if (statusFilter.value) {
      params.status = statusFilter.value
    }
    
    const response = await $fetch('/api/admin/import/list', { params })
    imports.value = response.data.imports
    summary.value = response.data.summary
    pagination.value = response.data.pagination
    
  } catch (error) {
    console.error('Failed to load imports:', error)
  } finally {
    loading.value = false
  }
}

const viewProgress = (importId) => {
  // Emit event to parent to switch to progress tab
  emit('view-progress', importId)
}

const viewDetails = async (importItem) => {
  selectedImport.value = importItem

  try {
    const [progressRes, backupsRes] = await Promise.all([
      $fetch(`/api/admin/import/progress/${importItem.id}`),
      $fetch(`/api/admin/import/backups/${importItem.id}`)
    ])
    importDetails.value = progressRes.data
    importBackups.value = backupsRes?.data?.files || []
  } catch (error) {
    console.error('Failed to load import details:', error)
  }

  showDetailsModal.value = true
}

const rollbackImport = async () => {
  if (!selectedImport.value) return
  
  try {
    const confirmed = confirm('Are you sure you want to rollback this import? This action cannot be undone.')
    if (!confirmed) return
    
    await $fetch('/api/admin/import/rollback', {
      method: 'POST',
      body: {
        backupId: selectedImport.value.id,
        confirmRollback: true
      }
    })
    
    showDetailsModal.value = false
    await loadImports()
    
  } catch (error) {
    console.error('Failed to rollback import:', error)
  }
}

const getActionItems = (importItem) => {
  const items = []
  
  if (importItem.status === 'failed') {
    items.push({
      label: 'Retry Import',
      icon: 'i-ph-arrow-clockwise',
      onclick: () => retryImport(importItem.id)
    })
  }
  
  items.push({
    label: 'Delete Record',
    icon: 'i-ph-trash',
    onclick: () => deleteImport(importItem.id)
  })
  
  return [items]
}

const retryImport = (importId) => {
  // TODO: Implement retry logic
  console.log('Retry import:', importId)
}

const deleteImport = (importId) => {
  // TODO: Implement delete logic
  console.log('Delete import:', importId)
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
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

// Emits
const emit = defineEmits(['view-progress'])

// Lifecycle
onMounted(() => {
  loadImports()
})
</script>
