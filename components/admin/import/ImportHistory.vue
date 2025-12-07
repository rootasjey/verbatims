<template>
  <div class="pt-6">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Import History</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            View and manage your previous imports
          </p>
        </div>
        <div class="flex items-center gap-3">
          <NButton
            btn="light:soft dark:link-gray"
            size="sm"
            @click="refresh"
            :loading="loading"
          >
            <NIcon name="i-ph-arrow-clockwise" />
            Refresh
          </NButton>
          <NButton
            v-if="imports.length > 0"
            btn="light:soft-pink dark:link-pink"
            size="sm"
            :disabled="imports.length === 0"
            @click="showClearHistoryDialog = true"
          >
            <NIcon name="i-ph-trash" />
            Clear All
          </NButton>
        </div>
      </div>

      <div>
        <div v-if="loading && imports.length === 0" class="flex justify-center py-8">
          <NIcon name="i-ph-spinner" class="w-6 h-6 animate-spin" />
        </div>

        <div v-else-if="imports.length === 0" class="text-center py-12">
          <NIcon name="i-ph-clock-countdown" class="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 class="font-body text-size-8 font-medium text-gray-900 dark:text-white">
            No Import History
          </h3>
          <p class="font-body text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Your import history will appear here once you start importing data.
          </p>
        </div>

        <div v-else class="import-history-container flex flex-col">
          <NTable
            :columns="historyColumns"
            :data="imports"
            :loading="loading"
            manual-pagination
            empty-text="No import history"
            empty-icon="i-ph-clock-countdown"
          >
            <template #status-cell="{ cell }">
              <NBadge :color="getStatusColor(cell.row.original.status)" :label="cell.row.original.status.toUpperCase()" />
            </template>
            <template #data_type-cell="{ cell }">
              <NBadge color="gray" :label="(cell.row.original.data_type || 'unknown').toUpperCase()" />
            </template>
            <template #record_count-cell="{ cell }">
              <span class="text-gray-600 dark:text-gray-400">{{ cell.row.original.record_count }}</span>
            </template>
            <template #created_at-cell="{ cell }">
              <span class="text-gray-600 dark:text-gray-400">{{ formatDate(cell.row.original.created_at) }}</span>
            </template>
            <template #completed_at-cell="{ cell }">
              <span class="text-gray-600 dark:text-gray-400">{{ cell.row.original.completed_at ? formatDate(cell.row.original.completed_at) : 'N/A' }}</span>
            </template>
            <template #actions-cell="{ cell }">
              <NDropdown :items="getActionItems(cell.row.original)">
                <NButton icon btn="ghost" size="sm" label="i-ph-dots-three-vertical" />
              </NDropdown>
            </template>
          </NTable>

          <div class="flex-shrink-0 flex items-center justify-between mt-4 p-4 rounded-2 border">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              Page {{ currentPage }} of {{ totalPages }} • {{ pagination?.total || 0 }} total imports
            </div>
            <NPagination
              v-model:page="currentPage"
              :total="pagination?.total || 0"
              :items-per-page="pageSize"
              :sibling-count="2"
              show-edges
              size="sm"
              @update:page="loadImports"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <NModal v-model="showDetailsModal">
      <NCard v-if="selectedImport">
        <template #header>
          <h3 class="text-lg font-semibold">
            Import Details - {{ selectedImport.id }}
          </h3>
        </template>

        <div class="space-y-4">
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><strong>Status:</strong> {{ selectedImport.status }}</div>
            <div><strong>Type:</strong> {{ (selectedImport.data_type || 'unknown').toUpperCase() }}</div>
            <div><strong>Total Records:</strong> {{ selectedImport.record_count }}</div>
            <div><strong>Successful:</strong> {{ selectedImport.status === 'completed' ? selectedImport.record_count : 'N/A' }}</div>
            <div><strong>Failed:</strong> {{ selectedImport.status === 'failed' ? selectedImport.record_count : 'N/A' }}</div>
            <div><strong>Warnings:</strong> N/A</div>
          </div>

          <div v-if="importDetails && importDetails.warnings && importDetails.warnings.length > 0">
            <h4 class="font-medium text-yellow-600 mb-2">Warnings</h4>
            <div class="max-h-40 overflow-y-auto space-y-1">
              <div
                v-for="(warning, index) in importDetails?.warnings || []"
                :key="index"
                class="text-sm text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded"
              >
                {{ warning }}
              </div>
            </div>
          </div>

          <!-- Detailed errors -->
          <div v-if="importDetails && importDetails.errors && importDetails.errors.length > 0">
            <h4 class="font-medium text-red-600 mb-2">Errors</h4>
            <div class="max-h-40 overflow-y-auto space-y-1">
              <div
                v-for="(error, index) in importDetails?.errors || []"
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
                  <NBadge color="gray" :label="(file.metadata?.export_config?.data_type || 'unknown').toUpperCase()" />
                  <span class="truncate max-w-[50ch]" :title="file.file_path">{{ file.filename }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-500">{{ new Date(file.created_at).toLocaleString() }}</span>
                  <NButton size="xs" btn="ghost" :to="file.file_path" target="_blank">
                    <NIcon name="i-ph-download" />
                    Download
                  </NButton>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <NButton
              v-if="selectedImport.status === 'completed'"
              btn="outline"
              color="red"
              @click="rollbackImport"
            >
              Rollback
            </NButton>
            <NButton @click="showDetailsModal = false">Close</NButton>
          </div>
        </template>
      </NCard>
    </NModal>

    <NDialog v-model:open="showClearHistoryDialog">
      <NCard class="shadow-none border-none">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Clear All Import History</h3>
        </template>

        <div class="space-y-4">
          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to clear all import history? This action cannot be undone.
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-500">
            This will permanently delete {{ imports.length }} import history entries.
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <NButton btn="text-gray-600" @click="showClearHistoryDialog = false">Cancel</NButton>
            <NButton btn="link-red" @click="handleClearAllHistory">Clear All History</NButton>
          </div>
        </template>
      </NCard>
    </NDialog>
  </div>
</template><template #status-cell="{ cell }">
              <NBadge :color="getStatusColor(cell.row.original.status)" :label="cell.row.original.status.toUpperCase()" />
            </template>
            <template #data_type-cell="{ cell }">
              <NBadge color="gray" :label="(cell.row.original.data_type || 'unknown').toUpperCase()" />
            </template>
            <template #record_count-cell="{ cell }">
              <span class="text-gray-600 dark:text-gray-400">{{ cell.row.original.record_count }}</span>
            </template>
            <template #created_at-cell="{ cell }">
              <span class="text-gray-600 dark:text-gray-400">{{ formatDate(cell.row.original.created_at) }}</span>
            </template>
            <template #completed_at-cell="{ cell }">
              <span class="text-gray-600 dark:text-gray-400">{{ cell.row.original.completed_at ? formatDate(cell.row.original.completed_at) : 'N/A' }}</span>
            </template>
            <template #actions-cell="{ cell }">
              <NDropdown :items="getActionItems(cell.row.original)">
                <NButton icon btn="ghost" size="sm" label="i-ph-dots-three-vertical" />
              </NDropdown>
            </template>
          </UTable>

          <div class="flex-shrink-0 flex items-center justify-between mt-4 p-4 rounded-2 border">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              Page {{ currentPage }} of {{ totalPages }} • {{ pagination?.total || 0 }} total imports
            </div>
            <UPagination
              v-model:page="currentPage"
              :total="pagination?.total || 0"
              :items-per-page="pageSize"
              :sibling-count="2"
              show-edges
              size="sm"
              @update:page="loadImports"
            />
          </div>
        </div>
      </div>
    </div>

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
            <div><strong>Type:</strong> {{ (selectedImport.data_type || 'unknown').toUpperCase() }}</div>
            <div><strong>Total Records:</strong> {{ selectedImport.record_count }}</div>
            <div><strong>Successful:</strong> {{ selectedImport.status === 'completed' ? selectedImport.record_count : 'N/A' }}</div>
            <div><strong>Failed:</strong> {{ selectedImport.status === 'failed' ? selectedImport.record_count : 'N/A' }}</div>
            <div><strong>Warnings:</strong> N/A</div>
          </div>

          <div v-if="importDetails && importDetails.warnings && importDetails.warnings.length > 0">
            <h4 class="font-medium text-yellow-600 mb-2">Warnings</h4>
            <div class="max-h-40 overflow-y-auto space-y-1">
              <div
                v-for="(warning, index) in importDetails?.warnings || []"
                :key="index"
                class="text-sm text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded"
              >
                {{ warning }}
              </div>
            </div>
          </div>

          <!-- Detailed errors -->
          <div v-if="importDetails && importDetails.errors && importDetails.errors.length > 0">
            <h4 class="font-medium text-red-600 mb-2">Errors</h4>
            <div class="max-h-40 overflow-y-auto space-y-1">
              <div
                v-for="(error, index) in importDetails?.errors || []"
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
                  <UBadge color="gray" :label="(file.metadata?.export_config?.data_type || 'unknown').toUpperCase()" />
                  <span class="truncate max-w-[50ch]" :title="file.file_path">{{ file.filename }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-500">{{ new Date(file.created_at).toLocaleString() }}</span>
                  <UButton size="xs" btn="ghost" :to="file.file_path" target="_blank">
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
            <NButton
              v-if="selectedImport.status === 'completed'"
              btn="outline"
              color="red"
              @click="rollbackImport"
            >
              Rollback
            </NButton>
            <NButton @click="showDetailsModal = false">Close</NButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <UDialog v-model:open="showClearHistoryDialog">
      <UCard class="shadow-none border-none">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Clear All Import History</h3>
        </template>

        <div class="space-y-4">
          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to clear all import history? This action cannot be undone.
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-500">
            This will permanently delete {{ imports.length }} import history entries.
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <NButton btn="text-gray-600" @click="showClearHistoryDialog = false">Cancel</NButton>
            <NButton btn="link-red" @click="handleClearAllHistory">Clear All History</NButton>
          </div>
        </template>
      </UCard>
    </UDialog>
  </div>
</template>

<script lang="ts" setup>
import type {
  BackupFileWithMetadata,
  ExportHistoryEntryWithBackup,
  ImportProgress,
  ImportPagination,
} from '~/types'

const imports = ref<ExportHistoryEntryWithBackup[]>([])
const loading = ref<boolean>(false)
const showDetailsModal = ref<boolean>(false)
const selectedImport = ref<ExportHistoryEntryWithBackup | null>(null)
const importDetails = ref<ImportProgress | null>(null)
const importBackups = ref<BackupFileWithMetadata[]>([])
const showClearHistoryDialog = ref(false)

const pageSize = ref<number>(20)
const currentPage = ref<number>(1)
const pagination = ref<ImportPagination | null>(null)

const totalPages = computed(() => {
  if (!pagination.value) return 1
  return Math.ceil((pagination.value.total || 1) / pageSize.value)
})

const loadImports = async (): Promise<void> => {
  loading.value = true
  try {
    const params = {
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value,
    }
    const response = await $fetch<{
      data: {
        imports: ExportHistoryEntryWithBackup[]
        pagination: ImportPagination
      }
    }>('/api/admin/import/list', { params })
    imports.value = response.data.imports
    pagination.value = response.data.pagination
  } catch (error) {
    console.error('Failed to load imports:', error)
  } finally {
    loading.value = false
  }
}

const refresh = () => loadImports()

const viewDetails = async (importItem: ExportHistoryEntryWithBackup): Promise<void> => {
  selectedImport.value = importItem
  try {
    const [progressRes, backupsRes] = await Promise.all([
      $fetch<{ data: ImportProgress }>(`/api/admin/import/progress/${importItem.id}`),
      $fetch<{ data: { files: BackupFileWithMetadata[] } }>(`/api/admin/import/backups/${importItem.id}`)
    ])
    importDetails.value = progressRes.data
    importBackups.value = backupsRes?.data?.files || []
  } catch (error) {
    console.error('Failed to load import details:', error)
  }
  showDetailsModal.value = true
}

const rollbackImport = async (): Promise<void> => {
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

const handleClearAllHistory = async () => {
  // TODO: Implement API call to clear all import history
  showClearHistoryDialog.value = false
  await loadImports()
}

const getActionItems = (importItem: ExportHistoryEntryWithBackup) => {
  const items: Array<{ label: string; icon: string; onclick: () => void }> = []
  if (importItem.status === 'failed') {
    items.push({
      label: 'Retry Import',
      icon: 'i-ph-arrow-clockwise',
      onclick: () => retryImport(importItem.id)
    })
  }
  items.push({
    label: 'View Details',
    icon: 'i-ph-info',
    onclick: () => viewDetails(importItem)
  })
  items.push({
    label: 'Delete Record',
    icon: 'i-ph-trash',
    onclick: () => deleteImport(importItem.id)
  })
  return [items]
}

const retryImport = (importId: string): void => {
  // TODO: Implement retry logic
  console.log('Retry import:', importId)
}

const deleteImport = (importId: string): void => {
  // TODO: Implement delete logic
  console.log('Delete import:', importId)
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return 'blue'
    case 'processing': return 'yellow'
    case 'completed': return 'green'
    case 'failed': return 'red'
    default: return 'gray'
  }
}

const formatDate = (dateString: string | Date): string => {
  return new Date(dateString).toLocaleString()
}

const emit = defineEmits(['view-progress'])

onMounted(() => {
  loadImports()
})

const historyColumns = [
  { header: 'Status', accessorKey: 'status', enableSorting: false, meta: { una: { tableHead: 'w-24', tableCell: 'w-24' } } },
  { header: 'Type', accessorKey: 'data_type', enableSorting: false, meta: { una: { tableHead: 'w-32', tableCell: 'w-32' } } },
  { header: 'Records', accessorKey: 'record_count', enableSorting: false, meta: { una: { tableHead: 'w-28', tableCell: 'w-28' } } },
  { header: 'Started', accessorKey: 'created_at', enableSorting: false, meta: { una: { tableHead: 'w-36', tableCell: 'w-36' } } },
  { header: 'Completed', accessorKey: 'completed_at', enableSorting: false, meta: { una: { tableHead: 'w-36', tableCell: 'w-36' } } },
  { header: '', accessorKey: 'actions', enableSorting: false, meta: { una: { tableHead: 'w-6', tableCell: 'w-6' } } }
]
</script>

<style scoped>
.import-history-container {
  max-height: calc(100vh - 20rem);
  overflow-y: auto;
}
</style>
