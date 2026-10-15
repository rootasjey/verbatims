<template>
  <div class="pt-6">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">{{ $ts('import_history.title') }}</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ $ts('import_history.description') }}
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
            {{ $ts('common.refresh') }}
          </NButton>
          <NButton
            v-if="deletableCount > 0"
            btn="light:soft-pink dark:link-pink"
            size="sm"
            @click="openClearHistoryDialog"
          >
            <NIcon name="i-ph-trash" />
            {{ $ts('import_history.clear_finished') }}
          </NButton>
        </div>
      </div>

      <p v-if="historyError" role="alert" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
        {{ historyError }}
      </p>

      <div>
        <div v-if="loading && imports.length === 0" class="flex justify-center py-8">
          <NIcon name="i-ph-spinner" class="w-6 h-6 animate-spin" />
        </div>

        <div v-else-if="imports.length === 0" class="text-center py-12">
          <NIcon name="i-ph-clock-countdown" class="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 class="font-body text-size-8 font-medium text-gray-900 dark:text-white">
            {{ $ts('import_history.no_history_title') }}
          </h3>
          <p class="font-body text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {{ $ts('import_history.no_history_desc') }}
          </p>
        </div>

        <div v-else class="import-history-container flex flex-col">
          <NTable
            :columns="historyColumns"
            :data="imports"
            :loading="loading"
            manual-pagination
            :empty-text="$ts('import_history.empty_text')"
            empty-icon="i-ph-clock-countdown"
          >
            <template #status-cell="{ cell }">
              <NBadge :color="getStatusColor(cell.row.original.status)" :label="cell.row.original.status.toUpperCase()" />
            </template>
            <template #dataType-cell="{ cell }">
              <NBadge color="gray" :label="(cell.row.original.dataType || 'unknown').toUpperCase()" />
            </template>
            <template #totalRecords-cell="{ cell }">
              <span class="text-gray-600 dark:text-gray-400">{{ cell.row.original.totalRecords }}</span>
            </template>
            <template #startedAt-cell="{ cell }">
              <span class="text-gray-600 dark:text-gray-400">{{ formatDate(cell.row.original.startedAt) }}</span>
            </template>
            <template #completedAt-cell="{ cell }">
              <span class="text-gray-600 dark:text-gray-400">{{ cell.row.original.completedAt ? formatDate(cell.row.original.completedAt) : $ts('common.na') }}</span>
            </template>
            <template #actions-cell="{ cell }">
              <NDropdown :items="getActionItems(cell.row.original)">
                <NButton icon btn="ghost" size="sm" label="i-ph-dots-three-vertical" />
              </NDropdown>
            </template>
          </NTable>

          <div class="flex-shrink-0 flex items-center justify-between mt-4 p-4 rounded-2 border">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {{ $ts('import_history.page_info', { page: currentPage, totalPages: totalPages, total: pagination?.total || 0 }) }}
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
            {{ $ts('import_history.details_title', { id: selectedImport.id }) }}
          </h3>
        </template>

        <div class="space-y-4">
          <p v-if="detailsError" role="alert" class="text-sm text-amber-700 dark:text-amber-300">{{ detailsError }}</p>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><strong>{{ $ts('import_history.details_status') }}</strong> {{ selectedImport.status }}</div>
            <div><strong>{{ $ts('import_history.details_type') }}</strong> {{ (selectedImport.dataType || $ts('common.unknown')).toUpperCase() }}</div>
            <div><strong>{{ $ts('import_history.details_total_records') }}</strong> {{ selectedImport.totalRecords }}</div>
            <div><strong>{{ $ts('import_history.details_successful') }}</strong> {{ selectedImport.successfulRecords }}</div>
            <div><strong>{{ $ts('import_history.details_failed') }}</strong> {{ selectedImport.failedRecords }}</div>
            <div><strong>{{ $ts('import_history.details_warnings') }}</strong> {{ selectedImport.warningCount }}</div>
          </div>

          <div v-if="importDetails && importDetails.warnings && importDetails.warnings.length > 0">
            <h4 class="font-medium text-yellow-600 mb-2">{{ $ts('import_history.warnings_subheading') }}</h4>
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
            <h4 class="font-medium text-red-600 mb-2">{{ $ts('import_history.errors_subheading') }}</h4>
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

          <!-- Original import data and reports linked to this import -->
          <div>
            <h4 class="font-medium mb-2">{{ $ts('import_history.import_files') }}</h4>
            <p class="mb-3 text-sm text-gray-500 dark:text-gray-400">{{ $ts('import_history.import_files_note') }}</p>
            <div v-if="importBackups.length === 0" class="text-sm text-gray-500">{{ $ts('import_history.no_backups') }}</div>
            <ul v-else class="space-y-2">
              <li v-for="file in importBackups" :key="file.id" class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <NBadge color="gray" :label="(file.metadata?.data_type || 'unknown').toUpperCase()" />
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ file.metadata?.kind === 'import-report' ? $ts('import_history.report_file') : $ts('import_history.source_file') }}
                  </span>
                  <span class="truncate max-w-[50ch]" :title="file.file_path">{{ file.filename }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-500">{{ formatDateTime(file.created_at) }}</span>
                  <NButton size="xs" btn="ghost" :to="file.downloadUrl" target="_blank">
                    <NIcon name="i-ph-download" />
                    {{ $ts('import_history.download') }}
                  </NButton>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <NButton @click="showDetailsModal = false">{{ $ts('common.close') }}</NButton>
          </div>
        </template>
      </NCard>
    </NModal>

    <NDialog v-model:open="showClearHistoryDialog">
      <NCard class="shadow-none border-none">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">{{ $ts('import_history.clear_dialog_title') }}</h3>
        </template>

        <div class="space-y-4">
          <p class="text-gray-600 dark:text-gray-400">
            {{ $ts('import_history.clear_dialog_confirm') }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-500">
            {{ $ts('import_history.clear_dialog_delete_count', { count: deletableCount }) }}
          </p>
          <p v-if="clearError" role="alert" class="text-sm text-red-600 dark:text-red-400">{{ clearError }}</p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <NButton btn="text-gray-600" @click="showClearHistoryDialog = false">{{ $ts('common.cancel') }}</NButton>
            <NButton btn="link-red" :loading="clearing" :disabled="clearing || deleting" @click="handleClearAllHistory">{{ $ts('import_history.clear_dialog_confirm_button') }}</NButton>
          </div>
        </template>
      </NCard>
    </NDialog>

    <NDialog v-model:open="showDeleteDialog">
      <NCard class="shadow-none border-none">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">{{ $ts('import_history.delete_dialog_title') }}</h3>
        </template>

        <div class="space-y-3">
          <p class="text-gray-600 dark:text-gray-400">{{ $ts('import_history.delete_dialog_confirm') }}</p>
          <p v-if="deleteError" role="alert" class="text-sm text-red-600 dark:text-red-400">{{ deleteError }}</p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <NButton btn="text-gray-600" @click="showDeleteDialog = false">{{ $ts('common.cancel') }}</NButton>
            <NButton btn="link-red" :loading="deleting" @click="confirmDeleteImport">{{ $ts('import_history.delete_dialog_confirm_button') }}</NButton>
          </div>
        </template>
      </NCard>
    </NDialog>
  </div>
</template>

<script lang="ts" setup>
import type { ImportPagination, ImportProgress } from '~~/server/types'

const { $ts } = useI18n()
import { formatDateTime } from '~/utils/time-formatter'

interface ImportHistoryEntry {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  totalRecords: number
  processedRecords: number
  successfulRecords: number
  failedRecords: number
  errorCount: number
  warningCount: number
  progressPercentage: number
  duration: number
  startedAt: string | Date
  completedAt: string | Date | null
  dataType: string
  filename: string | null
  format: string
}

interface ImportHistoryFile {
  id: number
  filename: string
  file_path: string
  file_size: number | null
  compressed_size: number | null
  compression_type: string | null
  storage_status: string | null
  created_at: string | Date
  expires_at: string | Date | null
  metadata: { kind?: string; data_type?: string } | null
  downloadUrl: string
}

const imports = ref<ImportHistoryEntry[]>([])
const loading = ref<boolean>(false)
const showDetailsModal = ref<boolean>(false)
const selectedImport = ref<ImportHistoryEntry | null>(null)
const importDetails = ref<ImportProgress | null>(null)
const importBackups = ref<ImportHistoryFile[]>([])
const showClearHistoryDialog = ref(false)
const showDeleteDialog = ref(false)
const clearing = ref(false)
const deleting = ref(false)
const deleteTarget = ref<ImportHistoryEntry | null>(null)
const deleteError = ref('')
const detailsError = ref('')
const clearError = ref('')
const historyError = ref('')
const deletableCount = ref(0)

const pageSize = ref<number>(20)
const currentPage = ref<number>(1)
const pagination = ref<ImportPagination | null>(null)

const totalPages = computed(() => {
  if (!pagination.value) return 1
  return Math.ceil((pagination.value.total || 1) / pageSize.value)
})

const loadImports = async (): Promise<void> => {
  loading.value = true
  historyError.value = ''
  try {
    const params = {
      limit: pageSize.value,
      offset: (currentPage.value - 1) * pageSize.value,
    }
    const response = await $fetch<{
      data: {
        imports: ImportHistoryEntry[]
        pagination: ImportPagination
        summary: { deletableCount: number }
      }
    }>('/api/admin/import/list', { params })
    imports.value = response.data.imports
    pagination.value = response.data.pagination
    deletableCount.value = response.data.summary.deletableCount
  } catch (error) {
    console.error('Failed to load imports:', error)
    historyError.value = $ts('import_history.load_failed')
  } finally {
    loading.value = false
  }
}

const refresh = () => loadImports()

const viewDetails = async (importItem: ImportHistoryEntry): Promise<void> => {
  selectedImport.value = importItem
  importDetails.value = null
  importBackups.value = []
  detailsError.value = ''
  const [progressResult, backupsResult] = await Promise.allSettled([
    $fetch<{ data: ImportProgress }>(`/api/admin/import/progress/${encodeURIComponent(importItem.id)}`),
    $fetch<{ data: { files: ImportHistoryFile[] } }>(`/api/admin/import/backups/${encodeURIComponent(importItem.id)}`)
  ])
  if (progressResult.status === 'fulfilled') importDetails.value = progressResult.value.data
  if (backupsResult.status === 'fulfilled') importBackups.value = backupsResult.value.data.files
  if (progressResult.status === 'rejected' || backupsResult.status === 'rejected') {
    detailsError.value = $ts('import_history.details_load_failed')
  }
  showDetailsModal.value = true
}

const openClearHistoryDialog = (): void => {
  clearError.value = ''
  showClearHistoryDialog.value = true
}

const handleClearAllHistory = async (): Promise<void> => {
  if (clearing.value || deleting.value) return
  clearing.value = true
  try {
    const response = await $fetch<{
      success: boolean
      data: { deletedImports: number; failedImports: string[] }
    }>('/api/admin/import/history', { method: 'DELETE', body: { confirm: true } })
    showClearHistoryDialog.value = false
    currentPage.value = 1
    await loadImports()
    if (!response.success) {
      historyError.value = $ts('import_history.clear_partial', {
        deleted: response.data.deletedImports,
        failed: response.data.failedImports.length,
      })
    }
  } catch (error) {
    clearError.value = $ts('import_history.clear_failed')
  } finally {
    clearing.value = false
  }
}

const getActionItems = (importItem: ImportHistoryEntry) => {
  const items: Array<{ label: string; icon: string; onclick: () => void }> = []
  items.push({
    label: $ts('import_history.action_view_details'),
    icon: 'i-ph-info',
    onclick: () => viewDetails(importItem)
  })
  if (importItem.status === 'completed' || importItem.status === 'failed') {
    items.push({
      label: $ts('import_history.action_delete_record'),
      icon: 'i-ph-trash',
      onclick: () => requestDeleteImport(importItem)
    })
  }
  return [items]
}

const requestDeleteImport = (importItem: ImportHistoryEntry): void => {
  deleteTarget.value = importItem
  deleteError.value = ''
  showDeleteDialog.value = true
}

const confirmDeleteImport = async (): Promise<void> => {
  if (!deleteTarget.value || deleting.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await $fetch(`/api/admin/import/${encodeURIComponent(deleteTarget.value.id)}`, { method: 'DELETE' })
    showDeleteDialog.value = false
    if (imports.value.length === 1 && currentPage.value > 1) currentPage.value--
    deleteTarget.value = null
    await loadImports()
  } catch (error) {
    deleteError.value = $ts('import_history.delete_failed')
  } finally {
    deleting.value = false
  }
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
  return formatDateTime(dateString)
}

onMounted(() => {
  loadImports()
})

const historyColumns = [
  { header: $ts('import_history.column_status'), accessorKey: 'status', enableSorting: false, meta: { una: { tableHead: 'w-24', tableCell: 'w-24' } } },
  { header: $ts('import_history.column_type'), accessorKey: 'dataType', enableSorting: false, meta: { una: { tableHead: 'w-32', tableCell: 'w-32' } } },
  { header: $ts('import_history.column_records'), accessorKey: 'totalRecords', enableSorting: false, meta: { una: { tableHead: 'w-28', tableCell: 'w-28' } } },
  { header: $ts('import_history.column_started'), accessorKey: 'startedAt', enableSorting: false, meta: { una: { tableHead: 'w-36', tableCell: 'w-36' } } },
  { header: $ts('import_history.column_completed'), accessorKey: 'completedAt', enableSorting: false, meta: { una: { tableHead: 'w-36', tableCell: 'w-36' } } },
  { header: '', accessorKey: 'actions', enableSorting: false, meta: { una: { tableHead: 'w-6', tableCell: 'w-6' } } }
]
</script>

<style scoped>
.import-history-container {
  max-height: calc(100vh - 20rem);
  overflow-y: auto;
}
</style>
