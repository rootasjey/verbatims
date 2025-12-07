<template>
  <div class="pt-6">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Export History</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            View and manage your previous exports
          </p>
        </div>
        <div class="flex items-center gap-3">
          <NButton
            btn="light:soft dark:link-gray"
            size="sm"
            @click="refresh"
          >
            <NIcon name="i-ph-arrow-clockwise" />
            Refresh
          </NButton>
          <NButton
            btn="light:soft-pink dark:link-pink"
            size="sm"
            :disabled="dataExport.state.exportHistory.length === 0"
            @click="showClearHistoryDialog = true"
          >
            <NIcon name="i-ph-trash" />
            Clear All
          </NButton>
        </div>
      </div>

      <div>
        <div v-if="dataExport.state.isLoadingHistory" class="flex justify-center py-8">
          <NIcon name="i-ph-spinner" class="w-6 h-6 animate-spin" />
        </div>

        <div v-else-if="dataExport.state.exportHistory.length === 0" class="text-center py-12">
          <NIcon name="i-ph-clock-countdown" class="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 class="font-body text-size-8 font-medium text-gray-900 dark:text-white">
            No Export History
          </h3>
          <p class="font-body text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Your export history will appear here once you start creating exports.
          </p>
          <NButton
            btn="soft-blue"
            @click="emit('go-to-export')"
          >
            <NIcon name="i-ph-download" />
            Create Your First Export
          </NButton>
        </div>

        <div v-else class="export-history-container flex flex-col">
          <NCollapsible v-model:open="bulkOpen">
            <NCollapsibleContent>
              <div class="flex-shrink-0 mb-4">
                <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ selectedEntries.length }} {{ selectedEntries.length === 1 ? 'entry' : 'entries' }} selected
                    </span>
                    <div class="flex items-center gap-3">
                      <NButton size="sm" btn="light:ghost-blue dark:link-blue" :loading="bulkDownloading" @click="bulkDownload">
                        <NIcon name="i-ph-download" />
                        Download Selected
                      </NButton>
                      <NButton size="sm" btn="light:ghost-pink dark:link-pink" :loading="bulkProcessing" @click="showBulkDeleteModal = true">
                        <NIcon name="i-ph-trash" />
                        Delete Selected
                      </NButton>
                      <NButton size="sm" btn="light:ghost dark:link-ghost" @click="clearSelection">
                        Clear Selection
                      </NButton>
                    </div>
                  </div>
                </div>
              </div>
            </NCollapsibleContent>
          </NCollapsible>

          <div class="flex-1 overflow-auto">
            <NTable
              :columns="historyColumns"
              :data="dataExport.state.exportHistory"
              :loading="dataExport.state.isLoadingHistory"
              manual-pagination
              empty-text="No export history"
              empty-icon="i-ph-clock-countdown"
            >
              <template #actions-header>
                <div class="flex items-center justify-center gap-1">
                  <template v-if="selectionMode">
                    <NTooltip text="Select all on page">
                      <NButton
                        icon
                        btn="ghost"
                        size="2xs"
                        label="i-ph-checks"
                        :disabled="allSelectedOnPage"
                        @click="selectAllOnPage"
                      />
                    </NTooltip>
                  </template>
                  <NTooltip :text="selectionMode ? 'Deactivate selection' : 'Activate selection'">
                    <NButton
                      icon
                      btn="ghost-gray"
                      size="2xs"
                      :label="selectionMode ? 'i-ph-x' : 'i-solar-check-square-linear'"
                      @click="toggleSelectionMode"
                    />
                  </NTooltip>
                </div>
              </template>

              <template #filename-cell="{ cell }">
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">{{ cell.row.original.filename }}</div>
                  <div v-if="cell.row.original.filters_applied" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Filters applied
                  </div>
                </div>
              </template>

              <template #format-cell="{ cell }">
                <NBadge
                  :label="cell.row.original.format.toUpperCase()"
                  :color="dataExport.getFormatColor(cell.row.original.format)"
                  badge="subtle"
                  size="xs"
                />
              </template>

              <template #records-cell="{ cell }">
                <span class="text-gray-600 dark:text-gray-400">{{ cell.row.original.record_count.toLocaleString() }}</span>
              </template>

              <template #size-cell="{ cell }">
                <span class="text-gray-600 dark:text-gray-400">{{ dataExport.formatFileSize(cell.row.original.file_size || 0) }}</span>
              </template>

              <template #storage-cell="{ cell }">
                <div class="flex items-center gap-2">
                  <NBadge
                    v-if="cell.row.original.backup_file"
                    :label="dataExport.getBackupStatusLabel(cell.row.original.backup_file.storage_status)"
                    :color="dataExport.getBackupStatusColor(cell.row.original.backup_file.storage_status)"
                    badge="subtle"
                    size="xs"
                  />
                  <NBadge
                    v-else
                    label="Legacy"
                    color="gray"
                    badge="subtle"
                    size="xs"
                  />
                  <NIcon
                    v-if="cell.row.original.backup_file && cell.row.original.backup_file.storage_status === 'stored'"
                    name="i-ph-cloud-check"
                    class="w-4 h-4 text-green-500"
                    title="Stored in R2"
                  />
                </div>
              </template>

              <template #user-cell="{ cell }">
                <span class="text-gray-600 dark:text-gray-400">{{ cell.row.original.user_name }}</span>
              </template>

              <template #created-cell="{ cell }">
                <span class="text-gray-600 dark:text-gray-400">{{ dataExport.formatDate(cell.row.original.created_at) }}</span>
              </template>

              <template #downloads-cell="{ cell }">
                <span class="text-gray-600 dark:text-gray-400">{{ cell.row.original.download_count }}</span>
              </template>

              <template #actions-cell="{ cell }">
                <template v-if="!selectionMode">
                  <NDropdownMenu :items="getEntryActions(cell.row.original)">
                    <NButton
                      icon
                      btn="ghost"
                      size="sm"
                      label="i-ph-dots-three-vertical"
                    />
                  </NDropdownMenu>
                </template>
                <template v-else>
                  <div class="flex items-center justify-center">
                    <NCheckbox
                      :model-value="!!rowSelection[cell.row.original.id]"
                      @update:model-value="val => setRowSelected(cell.row.original.id, val)"
                    />
                  </div>
                </template>
              </template>
            </NTable>
          </div>

          <div class="flex-shrink-0 flex items-center justify-between mt-4 p-4 rounded-2 border">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              Page {{ dataExport.state.historyPagination.page }} of {{ dataExport.state.historyPagination.totalPages }} • {{ dataExport.state.historyPagination.total }} total exports
            </div>
            <NPagination
              v-model:page="dataExport.state.historyPagination.page"
              :total="dataExport.state.historyPagination.total"
              :items-per-page="dataExport.state.historyPagination.limit"
              :sibling-count="2"
              show-edges
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>

    <NDialog v-model:open="showBulkDeleteModal">
      <NCard>
        <template #header>
          <h3 class="text-lg font-semibold">Delete {{ selectedEntries.length }} {{ selectedEntries.length === 1 ? 'Entry' : 'Entries' }}</h3>
        </template>

        <p class="text-gray-600 dark:text-gray-400 mb-4">
          You are about to delete {{ selectedEntries.length }} {{ selectedEntries.length === 1 ? 'export history entry' : 'export history entries' }}. This action cannot be undone.
        </p>

        <template #footer>
          <div class="flex justify-end space-x-3">
            <NButton btn="ghost" @click="showBulkDeleteModal = false">Cancel</NButton>
            <NButton color="red" :loading="bulkProcessing" @click="bulkDelete">Delete All</NButton>
          </div>
        </template>
      </NCard>
    </NDialog>

    <NDialog v-model:open="showClearHistoryDialog">
      <NCard class="shadow-none border-none">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Clear All Export History</h3>
        </template>

        <div class="space-y-4">
          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to clear all export history? This action cannot be undone.
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-500">
            This will permanently delete {{ dataExport.state.exportHistory.length }} export history entries.
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

    <NDialog v-model:open="showDeleteEntryDialog">
      <NCard class="shadow-none border-none">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Delete Export Entry</h3>
        </template>

        <div class="space-y-4">
          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this export history entry?
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-500">
            {{ deleteEntryData.filename }}
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <NButton btn="ghost" @click="showDeleteEntryDialog = false">Cancel</NButton>
            <NButton btn="solid" @click="handleDeleteEntry">Delete Entry</NButton>
          </div>
        </template>
      </NCard>
    </NDialog>
  </div>
</template><template #actions-header>
                <div class="flex items-center justify-center gap-1">
                  <template v-if="selectionMode">
                    <NTooltip text="Select all on page">
                      <NButton
                        icon
                        btn="ghost"
                        size="2xs"
                        label="i-ph-checks"
                        :disabled="allSelectedOnPage"
                        @click="selectAllOnPage"
                      />
                    </NTooltip>
                  </template>
                  <NTooltip :text="selectionMode ? 'Deactivate selection' : 'Activate selection'">
                    <NButton
                      icon
                      btn="ghost-gray"
                      size="2xs"
                      :label="selectionMode ? 'i-ph-x' : 'i-solar-check-square-linear'"
                      @click="toggleSelectionMode"
                    />
                  </NTooltip>
                </div>
              </template><template v-if="selectionMode">
                    <NTooltip text="Select all on page">
                      <NButton
                        icon
                        btn="ghost"
                        size="2xs"
                        label="i-ph-checks"
                        :disabled="allSelectedOnPage"
                        @click="selectAllOnPage"
                      />
                    </NTooltip>
                  </template>
                  <NTooltip :text="selectionMode ? 'Deactivate selection' : 'Activate selection'">
                    <NButton
                      icon
                      btn="ghost-gray"
                      size="2xs"
                      :label="selectionMode ? 'i-ph-x' : 'i-solar-check-square-linear'"
                      @click="toggleSelectionMode"
                    />
                  </NTooltip>
                </div>
              </template>

              <template #filename-cell="{ cell }">
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">{{ cell.row.original.filename }}</div>
                  <div v-if="cell.row.original.filters_applied" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Filters applied
                  </div>
                </div>
              </template>

              <template #format-cell="{ cell }">
                <NBadge
                  :label="cell.row.original.format.toUpperCase()"
                  :color="dataExport.getFormatColor(cell.row.original.format)"
                  badge="subtle"
                  size="xs"
                />
              </template>

              <template #records-cell="{ cell }">
                <span class="text-gray-600 dark:text-gray-400">{{ cell.row.original.record_count.toLocaleString() }}</span>
              </template>

              <template #size-cell="{ cell }">
                <span class="text-gray-600 dark:text-gray-400">{{ dataExport.formatFileSize(cell.row.original.file_size || 0) }}</span>
              </template>

              <template #storage-cell="{ cell }">
                <div class="flex items-center gap-2">
                  <NBadge
                    v-if="cell.row.original.backup_file"
                    :label="dataExport.getBackupStatusLabel(cell.row.original.backup_file.storage_status)"
                    :color="dataExport.getBackupStatusColor(cell.row.original.backup_file.storage_status)"
                    badge="subtle"
                    size="xs"
                  />
                  <NBadge
                    v-else
                    label="Legacy"
                    color="gray"
                    badge="subtle"
                    size="xs"
                  />
                  <NIcon
                    v-if="cell.row.original.backup_file && cell.row.original.backup_file.storage_status === 'stored'"
                    name="i-ph-cloud-check"
                    class="w-4 h-4 text-green-500"
                    title="Stored in R2"
                  />
                </div>
              </template>

              <template #user-cell="{ cell }">
                <span class="text-gray-600 dark:text-gray-400">{{ cell.row.original.user_name }}</span>
              </template>

              <template #created-cell="{ cell }">
                <span class="text-gray-600 dark:text-gray-400">{{ dataExport.formatDate(cell.row.original.created_at) }}</span>
              </template>

              <template #downloads-cell="{ cell }">
                <span class="text-gray-600 dark:text-gray-400">{{ cell.row.original.download_count }}</span>
              </template>

              <template #actions-cell="{ cell }">
                <template v-if="!selectionMode">
                  <NDropdownMenu :items="getEntryActions(cell.row.original)">
                    <NButton
                      icon
                      btn="ghost"
                      size="sm"
                      label="i-ph-dots-three-vertical"
                    />
                  </NDropdownMenu>
                </template>
                <template v-else>
                  <div class="flex items-center justify-center">
                    <NCheckbox
                      :model-value="!!rowSelection[cell.row.original.id]"
                      @update:model-value="val => setRowSelected(cell.row.original.id, val)"
                    />
                  </div>
                </template>
              </template><template v-if="!selectionMode">
                  <NDropdownMenu :items="getEntryActions(cell.row.original)">
                    <NButton
                      icon
                      btn="ghost"
                      size="sm"
                      label="i-ph-dots-three-vertical"
                    />
                  </NDropdownMenu>
                </template>
                <template v-else>
                  <div class="flex items-center justify-center">
                    <NCheckbox
                      :model-value="!!rowSelection[cell.row.original.id]"
                      @update:model-value="val => setRowSelected(cell.row.original.id, val)"
                    />
                  </div>
                </template>
              </template>
            </NTable>
          </div>

          <div class="flex-shrink-0 flex items-center justify-between mt-4 p-4 rounded-2 border">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              Page {{ dataExport.state.historyPagination.page }} of {{ dataExport.state.historyPagination.totalPages }} • {{ dataExport.state.historyPagination.total }} total exports
            </div>
            <NPagination
              v-model:page="dataExport.state.historyPagination.page"
              :total="dataExport.state.historyPagination.total"
              :items-per-page="dataExport.state.historyPagination.limit"
              :sibling-count="2"
              show-edges
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>

    <NDialog v-model:open="showBulkDeleteModal">
      <NCard>
        <template #header>
          <h3 class="text-lg font-semibold">Delete {{ selectedEntries.length }} {{ selectedEntries.length === 1 ? 'Entry' : 'Entries' }}</h3>
        </template>

        <p class="text-gray-600 dark:text-gray-400 mb-4">
          You are about to delete {{ selectedEntries.length }} {{ selectedEntries.length === 1 ? 'export history entry' : 'export history entries' }}. This action cannot be undone.
        </p>

        <template #footer>
          <div class="flex justify-end space-x-3">
            <NButton btn="ghost" @click="showBulkDeleteModal = false">Cancel</NButton>
            <NButton color="red" :loading="bulkProcessing" @click="bulkDelete">Delete All</NButton>
          </div>
        </template>
      </NCard>
    </NDialog>

    <NDialog v-model:open="showClearHistoryDialog">
      <NCard class="shadow-none border-none">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Clear All Export History</h3>
        </template>

        <div class="space-y-4">
          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to clear all export history? This action cannot be undone.
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-500">
            This will permanently delete {{ dataExport.state.exportHistory.length }} export history entries.
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

    <NDialog v-model:open="showDeleteEntryDialog">
      <NCard class="shadow-none border-none">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Delete Export Entry</h3>
        </template>

        <div class="space-y-4">
          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this export history entry?
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-500">
            {{ deleteEntryData.filename }}
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <NButton btn="ghost" @click="showDeleteEntryDialog = false">Cancel</NButton>
            <NButton btn="solid" @click="handleDeleteEntry">Delete Entry</NButton>
          </div>
        </template>
      </NCard>
    </NDialog>
  </div>
</template>

<script setup lang="ts">
import { useDataExport } from '~/composables/useDataExport'

const emit = defineEmits<{ (e: 'go-to-export'): void }>()

const dataExport = useDataExport()

const selectionMode = ref(false)
const bulkOpen = ref(false)
const rowSelection = ref<Record<string, boolean>>({})
const showBulkDeleteModal = ref(false)
const bulkProcessing = ref(false)
const bulkDownloading = ref(false)

const showClearHistoryDialog = ref(false)
const showDeleteEntryDialog = ref(false)
const deleteEntryData = ref<{ id: string; filename: string }>({ id: '', filename: '' })

const selectedEntries = computed<string[]>(() => Object
  .entries(rowSelection.value)
  .filter(([, v]) => !!v)
  .map(([k]) => k)
)

watch(selectedEntries, (ids) => {
  bulkOpen.value = ids.length > 0
}, { immediate: true })

const clearSelection = () => { rowSelection.value = {} }

const toggleSelectionMode = () => {
  selectionMode.value = !selectionMode.value
  if (!selectionMode.value) clearSelection()
}

const setRowSelected = (id: string, value: boolean | 'indeterminate') => {
  rowSelection.value[id] = value === true
}

const visibleIds = computed<string[]>(() => dataExport.state.exportHistory.map((e: any) => e.id))
const allSelectedOnPage = computed<boolean>(() =>
  visibleIds.value.length > 0 && visibleIds.value.every(id => !!rowSelection.value[id])
)

const selectAllOnPage = () => { visibleIds.value.forEach(id => { rowSelection.value[id] = true }) }

const confirmDeleteEntry = (exportId: string, filename: string) => {
  deleteEntryData.value = { id: exportId, filename }
  showDeleteEntryDialog.value = true
}

const handleDeleteEntry = async () => {
  await dataExport.deleteExportHistoryEntry(deleteEntryData.value.id)
  showDeleteEntryDialog.value = false
  deleteEntryData.value = { id: '', filename: '' }
}

const handleClearAllHistory = async () => {
  await dataExport.clearAllExportHistory()
  showClearHistoryDialog.value = false
}

const getEntryActions = (entry: any) => {
  const items: any[] = []

  if (dataExport.isExpired(entry.expires_at)) {
    items.push({ label: 'Expired', leading: 'i-ph-clock', disabled: true })
  } else {
    items.push({
      label: 'Execute Query',
      leading: 'i-ph-caret-double-right-duotone',
      onclick: () => dataExport.downloadExport(entry.id)
    })
  }

  if (entry.backup_file && entry.backup_file.storage_status === 'stored') {
    items.push({
      label: 'Download',
      leading: 'i-ph-download',
      onclick: () => dataExport.downloadBackup(entry.backup_file.id)
    })
  }

  if (items.length) items.push({})

  items.push({
    label: 'Delete',
    leading: 'i-ph-trash',
    onclick: () => confirmDeleteEntry(entry.id, entry.filename)
  })

  return items
}

const bulkDelete = async () => {
  if (selectedEntries.value.length === 0) return

  try {
    bulkProcessing.value = true
    const ids = [...selectedEntries.value]
    const batchSize = 5

    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize)
      await Promise.all(batch.map(id => dataExport.deleteExportHistoryEntry(id)))
    }

    rowSelection.value = {}
    showBulkDeleteModal.value = false
  } catch (error) {
    console.error('Failed to bulk delete export history entries:', error)
    useToast().toast({
      toast: 'error',
      title: 'Bulk Delete Failed',
      description: 'Please try again.'
    })
  } finally {
    bulkProcessing.value = false
  }
}

const bulkDownload = async () => {
  if (selectedEntries.value.length === 0) return
  
  bulkDownloading.value = true
  let success = 0
  let skipped = 0
  let failed = 0

  const entriesById = new Map<string, any>(
    dataExport.state.exportHistory.map((e: any) => [e.id as string, e])
  )

  for (const id of selectedEntries.value) {
    const entry = entriesById.get(id)
    if (!entry) { skipped++; continue; }

    try {
      if (entry.backup_file && entry.backup_file.storage_status === 'stored') {
        await dataExport.downloadBackup(entry.backup_file.id)
        success++
      } else if (!dataExport.isExpired(entry.expires_at)) {
        await dataExport.downloadExport(entry.id)
        success++
      } else { skipped++ } // Expired and no backup available

      // Small delay to avoid overwhelming the browser/network
      await new Promise(resolve => setTimeout(resolve, 150))
    } catch (e) {
      console.error('Download failed for entry', id, e)
      failed++
    }
  }

  const parts = [] as string[]
  parts.push(`${success} downloaded`)
  if (skipped) parts.push(`${skipped} skipped`)
  if (failed) parts.push(`${failed} failed`)

  toast({
    title: 'Bulk download complete',
    description: parts.join(', ') + '.',
  })
  
  bulkDownloading.value = false
}

const historyColumns = [
  { header: '', accessorKey: 'actions', enableSorting: false, meta: { una: { tableHead: 'w-6', tableCell: 'w-6' } } },
  { header: 'Filename', accessorKey: 'filename', enableSorting: false, meta: { una: { tableHead: 'min-w-80', tableCell: 'min-w-80' } } },
  { header: 'Format', accessorKey: 'format', enableSorting: false, meta: { una: { tableHead: 'w-24', tableCell: 'w-24' } } },
  { header: 'Records', accessorKey: 'records', enableSorting: false, meta: { una: { tableHead: 'w-28', tableCell: 'w-28' } } },
  { header: 'Size', accessorKey: 'size', enableSorting: false, meta: { una: { tableHead: 'w-24', tableCell: 'w-24' } } },
  { header: 'Storage', accessorKey: 'storage', enableSorting: false, meta: { una: { tableHead: 'w-36', tableCell: 'w-36' } } },
  { header: 'User', accessorKey: 'user', enableSorting: false, meta: { una: { tableHead: 'w-40', tableCell: 'w-40' } } },
  { header: 'Created', accessorKey: 'created', enableSorting: false, meta: { una: { tableHead: 'w-36', tableCell: 'w-36' } } },
  { header: 'Downloads', accessorKey: 'downloads', enableSorting: false, meta: { una: { tableHead: 'w-28', tableCell: 'w-28' } } }
]

const refresh = () => dataExport.loadExportHistory(dataExport.state.historyPagination.page)

watch(
  () => dataExport.state.historyPagination.page,
  (page) => { dataExport.loadExportHistory(page as number) }
)

onMounted(() => {
  if (!dataExport.state.exportHistory.length) dataExport.loadExportHistory()
})
</script>

<style scoped>
.export-history-container {
  max-height: calc(100vh - 20rem);
  overflow-y: auto;
}
</style>
