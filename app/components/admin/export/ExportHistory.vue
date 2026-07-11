<template>
  <div class="pt-6">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">{{ $ts('export_history.title') }}</h2>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ $ts('export_history.description') }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <OutlinedButton size="sm" @click="refresh">
            <NIcon name="i-ph-arrow-clockwise" />
            {{ $ts('common.refresh') }}
          </OutlinedButton>
          <OutlinedButton
            size="sm"
            variant="destructive"
            :disabled="dataExport.state.exportHistory.length === 0"
            @click="showClearHistoryDialog = true"
          >
            <NIcon name="i-ph-trash" />
            {{ $ts('export_history.clear_all') }}
          </OutlinedButton>
        </div>
      </div>

      <div>
        <div v-if="dataExport.state.isLoadingHistory" class="flex justify-center py-8">
          <NIcon name="i-ph-spinner" class="w-6 h-6 animate-spin" />
        </div>

        <div v-else-if="dataExport.state.exportHistory.length === 0" class="text-center py-12">
          <NIcon name="i-ph-clock-countdown" class="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">
            {{ $ts('export_history.no_history_title') }}
          </h3>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {{ $ts('export_history.no_history_desc') }}
          </p>
          <OutlinedButton @click="emit('go-to-export')">
            <NIcon name="i-ph-download" />
            {{ $ts('export_history.create_first') }}
          </OutlinedButton>
        </div>

        <div v-else class="export-history-container flex flex-col">
          <NCollapsible v-model:open="bulkOpen">
            <NCollapsibleContent>
              <div class="flex-shrink-0 mb-4">
                <div class="border border-dashed border-gray-200 dark:border-gray-700 p-4">
                  <div class="flex items-center justify-between">
                    <span class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100">
                      {{ selectedEntries.length === 1 ? $ts('export_history.entry_selected', { count: selectedEntries.length }) : $ts('export_history.entries_selected', { count: selectedEntries.length }) }}
                    </span>
                    <div class="flex items-center gap-3">
                      <OutlinedButton size="sm" :loading="bulkDownloading" @click="bulkDownload">
                        <NIcon name="i-ph-download" />
                        {{ $ts('export_history.download_selected') }}
                      </OutlinedButton>
                      <OutlinedButton size="sm" variant="destructive" :loading="bulkProcessing" @click="showBulkDeleteModal = true">
                        <NIcon name="i-ph-trash" />
                        {{ $ts('export_history.delete_selected') }}
                      </OutlinedButton>
                      <button
                        class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        @click="clearSelection"
                      >
                        {{ $ts('export_history.clear_selection') }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </NCollapsibleContent>
          </NCollapsible>

          <div class="flex-1 overflow-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr class="border-b border-dashed border-gray-200 dark:border-gray-700">
                  <th class="font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400 px-3 py-2 text-left w-6">
                    <div class="flex items-center justify-center gap-1">
                      <template v-if="selectionMode">
                        <NTooltip :text="$ts('export_history.select_all_page')">
                          <OutlinedButton size="sm" :disabled="allSelectedOnPage" @click="selectAllOnPage">
                            <NIcon name="i-ph-checks" />
                          </OutlinedButton>
                        </NTooltip>
                      </template>
                      <NTooltip :text="selectionMode ? $ts('export_history.deactivate_selection') : $ts('export_history.activate_selection')">
                        <OutlinedButton size="sm" @click="toggleSelectionMode">
                          <NIcon :name="selectionMode ? 'i-ph-x' : 'i-solar-check-square-linear'" />
                        </OutlinedButton>
                      </NTooltip>
                    </div>
                  </th>
                  <th class="font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400 px-3 py-2 text-left min-w-80">{{ $ts('export_history.filename') }}</th>
                  <th class="font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400 px-3 py-2 text-left w-24">{{ $ts('export_history.column_format') }}</th>
                  <th class="font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400 px-3 py-2 text-left w-28">{{ $ts('export_history.records') }}</th>
                  <th class="font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400 px-3 py-2 text-left w-24">{{ $ts('export_history.size') }}</th>
                  <th class="font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400 px-3 py-2 text-left w-36">{{ $ts('export_history.storage') }}</th>
                  <th class="font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400 px-3 py-2 text-left w-40">{{ $ts('export_history.user') }}</th>
                  <th class="font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400 px-3 py-2 text-left w-36">{{ $ts('export_history.created') }}</th>
                  <th class="font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400 px-3 py-2 text-left w-28">{{ $ts('export_history.downloads') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in dataExport.state.exportHistory" :key="entry.id" class="border-b border-dashed border-gray-100 dark:border-gray-800">
                  <td class="px-3 py-2">
                    <template v-if="!selectionMode">
                      <NDropdownMenu :items="getEntryActions(entry)">
                        <OutlinedButton size="sm">
                          <NIcon name="i-ph-dots-three-vertical" />
                        </OutlinedButton>
                      </NDropdownMenu>
                    </template>
                    <template v-else>
                      <input
                        type="checkbox"
                        class="accent-gray-700 dark:accent-gray-300"
                        :checked="!!rowSelection[entry.id]"
                        @change="setRowSelected(entry.id, ($event.target as HTMLInputElement).checked)"
                      />
                    </template>
                  </td>
                  <td class="px-3 py-2">
                    <div class="font-medium text-gray-900 dark:text-white">{{ entry.filename }}</div>
                    <div v-if="entry.filters_applied" class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">{{ $ts('export_history.filters_applied') }}</div>
                  </td>
                  <td class="px-3 py-2">
                    <NBadge
                      :label="entry.format.toUpperCase()"
                      :color="dataExport.getFormatColor(entry.format)"
                      badge="soft"
                      size="xs"
                    />
                  </td>
                  <td class="px-3 py-2 font-sans text-sm text-gray-600 dark:text-gray-400">{{ entry.record_count.toLocaleString() }}</td>
                  <td class="px-3 py-2 font-sans text-sm text-gray-600 dark:text-gray-400">{{ dataExport.formatFileSize(entry.file_size || 0) }}</td>
                  <td class="px-3 py-2">
                    <div class="flex items-center gap-2">
                      <NBadge
                        v-if="entry.backup_file"
                        :label="dataExport.getBackupStatusLabel(entry.backup_file.storage_status)"
                        :color="dataExport.getBackupStatusColor(entry.backup_file.storage_status)"
                        badge="soft"
                        size="xs"
                      />
                      <NBadge
                        v-else
                        :label="$ts('export_history.badge_legacy')"
                        color="gray"
                        badge="soft"
                        size="xs"
                      />
                      <NIcon
                        v-if="entry.backup_file && entry.backup_file.storage_status === 'stored'"
                        name="i-ph-cloud-check"
                        class="w-4 h-4 text-green-500"
                        :title="$ts('export_history.title_stored_r2')"
                      />
                    </div>
                  </td>
                  <td class="px-3 py-2 font-sans text-sm text-gray-600 dark:text-gray-400">{{ entry.user_name }}</td>
                  <td class="px-3 py-2 font-sans text-sm text-gray-600 dark:text-gray-400">{{ dataExport.formatDate(entry.created_at) }}</td>
                  <td class="px-3 py-2 font-sans text-sm text-gray-600 dark:text-gray-400">{{ entry.download_count }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex-shrink-0 flex items-center justify-between mt-4 p-4 border border-dashed border-gray-200 dark:border-gray-700">
            <div class="font-sans text-xs text-gray-500 dark:text-gray-400">
              {{ $ts('export_history.page_info', { page: dataExport.state.historyPagination.page, totalPages: dataExport.state.historyPagination.totalPages, total: dataExport.state.historyPagination.total }) }}
            </div>
            <div class="flex items-center gap-2">
              <OutlinedButton size="sm" :disabled="dataExport.state.historyPagination.page <= 1" @click="dataExport.state.historyPagination.page--">
                <NIcon name="i-ph-caret-left" />
                {{ $ts('common.previous') }}
              </OutlinedButton>
              <OutlinedButton size="sm" :disabled="dataExport.state.historyPagination.page >= dataExport.state.historyPagination.totalPages" @click="dataExport.state.historyPagination.page++">
                {{ $ts('common.next') }}
                <NIcon name="i-ph-caret-right" />
              </OutlinedButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <NDialog v-model:open="showBulkDeleteModal">
      <div class="border border-dashed border-gray-200 dark:border-gray-700 p-4">
        <h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100 mb-4">{{ $ts('export_history.bulk_delete_title', { count: selectedEntries.length }) }}</h3>

        <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mb-4">
          {{ $ts('export_history.bulk_delete_desc', { count: selectedEntries.length }) }}
        </p>

        <div class="flex justify-end space-x-3">
          <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" @click="showBulkDeleteModal = false">{{ $ts('export_history.bulk_delete_cancel') }}</button>
          <OutlinedButton variant="destructive" :loading="bulkProcessing" @click="bulkDelete">{{ $ts('export_history.bulk_delete_confirm') }}</OutlinedButton>
        </div>
      </div>
    </NDialog>

    <NDialog v-model:open="showClearHistoryDialog">
      <div class="border border-dashed border-gray-200 dark:border-gray-700 p-4">
        <h3 class="font-sans text-sm font-600 text-red-600 dark:text-red-400 mb-4">{{ $ts('export_history.clear_dialog_title') }}</h3>

        <div class="space-y-4">
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400">
            {{ $ts('export_history.clear_dialog_confirm') }}
          </p>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-500">
            {{ $ts('export_history.clear_dialog_delete_count', { count: dataExport.state.exportHistory.length }) }}
          </p>
        </div>

        <div class="flex justify-end gap-3 mt-4">
          <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" @click="showClearHistoryDialog = false">{{ $ts('export_history.clear_dialog_cancel') }}</button>
          <OutlinedButton variant="destructive" @click="handleClearAllHistory">{{ $ts('export_history.clear_dialog_confirm_button') }}</OutlinedButton>
        </div>
      </div>
    </NDialog>

    <NDialog v-model:open="showDeleteEntryDialog">
      <div class="border border-dashed border-gray-200 dark:border-gray-700 p-4">
        <h3 class="font-sans text-sm font-600 text-red-600 dark:text-red-400 mb-4">{{ $ts('export_history.delete_entry_title') }}</h3>

        <div class="space-y-4">
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400">
            {{ $ts('export_history.delete_entry_confirm') }}
          </p>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-500">
            {{ deleteEntryData.filename }}
          </p>
        </div>

        <div class="flex justify-end gap-3 mt-4">
          <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" @click="showDeleteEntryDialog = false">{{ $ts('export_history.delete_entry_cancel') }}</button>
          <OutlinedButton @click="handleDeleteEntry">{{ $ts('export_history.delete_entry_confirm_button') }}</OutlinedButton>
        </div>
      </div>
    </NDialog>
  </div>
</template>

<script setup lang="ts">
const { $t, $ts } = useI18n()

import { useDataExport } from '~/composables/useDataExport'

const emit = defineEmits<{ (e: 'go-to-export'): void }>()

const dataExport = useDataExport()
const { showErrorToast } = useErrorToast()

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
    items.push({ label: $ts('export_history.action_expired'), leading: 'i-ph-clock', disabled: true })
  } else {
    items.push({
      label: $ts('export_history.action_execute_query'),
      leading: 'i-ph-caret-double-right-duotone',
      onclick: () => dataExport.downloadExport(entry.id)
    })
  }

  if (entry.backup_file && entry.backup_file.storage_status === 'stored') {
    items.push({
      label: $ts('export_history.action_download'),
      leading: 'i-ph-download',
      onclick: () => dataExport.downloadBackup(entry.backup_file.id)
    })
  }

  if (items.length) items.push({})

  items.push({
    label: $ts('export_history.action_delete'),
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
    showErrorToast(error, { title: $ts('export_history.toast_bulk_delete_failed_title'), fallback: $ts('export_history.toast_bulk_delete_failed_fallback') })
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
  parts.push($ts('export_history.toast_bulk_download_downloaded', { count: success }))
  if (skipped) parts.push($ts('export_history.toast_bulk_download_skipped', { count: skipped }))
  if (failed) parts.push($ts('export_history.toast_bulk_download_failed', { count: failed }))

  useToast().toast({
    title: $ts('export_history.toast_bulk_download_title'),
    description: parts.join(', ') + '.',
    toast: 'outline-success',
  })

  bulkDownloading.value = false
}

const historyColumns = [
  { header: '', accessorKey: 'actions', enableSorting: false, meta: { una: { tableHead: 'w-6', tableCell: 'w-6' } } },
  { header: $ts('export_history.filename'), accessorKey: 'filename', enableSorting: false, meta: { una: { tableHead: 'min-w-80', tableCell: 'min-w-80' } } },
  { header: $ts('export_history.column_format'), accessorKey: 'format', enableSorting: false, meta: { una: { tableHead: 'w-24', tableCell: 'w-24' } } },
  { header: $ts('export_history.records'), accessorKey: 'records', enableSorting: false, meta: { una: { tableHead: 'w-28', tableCell: 'w-28' } } },
  { header: $ts('export_history.size'), accessorKey: 'size', enableSorting: false, meta: { una: { tableHead: 'w-24', tableCell: 'w-24' } } },
  { header: $ts('export_history.storage'), accessorKey: 'storage', enableSorting: false, meta: { una: { tableHead: 'w-36', tableCell: 'w-36' } } },
  { header: $ts('export_history.user'), accessorKey: 'user', enableSorting: false, meta: { una: { tableHead: 'w-40', tableCell: 'w-40' } } },
  { header: $ts('export_history.created'), accessorKey: 'created', enableSorting: false, meta: { una: { tableHead: 'w-36', tableCell: 'w-36' } } },
  { header: $ts('export_history.downloads'), accessorKey: 'downloads', enableSorting: false, meta: { una: { tableHead: 'w-28', tableCell: 'w-28' } } }
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
