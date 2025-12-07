<template>
  <div class="frame flex flex-col h-full">
    <div class="flex-shrink-0 bg-gray-50 dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-700 pb-6 mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <NInput
            v-model="searchQuery"
            placeholder="Search tags by name, description, or category..."
            leading="i-ph-magnifying-glass"
            size="md"
            :loading="loading"
            :trailing="searchQuery ? 'i-ph-x' : undefined"
            :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
            @trailing="resetFilters"
          />
        </div>
        <div class="flex gap-2">
          <NSelect
            v-model="selectedSort"
            :items="sortOptions"
            placeholder="Sort by"
            size="sm"
            class="w-40"
            item-key="label"
            value-key="label"
          />
          <NButton btn="soft-blue" size="sm" @click="openCreate"> 
            <NIcon name="i-ph-plus" class="w-4 h-4 mr-2" />
            Create Tag
          </NButton>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <NIcon name="i-ph-hash" class="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tags</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ totalTags }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col">
      <!-- Bulk Actions -->
      <NCollapsible v-model:open="bulkOpen" class="px-4 py-2">
        <NCollapsibleContent>
          <div class="flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800 rounded-md px-3 py-2 border border-dashed border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-2 text-sm">
              <NIcon name="i-ph-check-square" class="w-4 h-4" />
              <span>{{ selectedIds.length }} selected</span>
            </div>
            <div class="flex items-center gap-2">
              <NButton size="xs" btn="ghost" @click="clearSelection">Clear</NButton>
              <NButton size="xs" btn="soft-red" :loading="bulkProcessing" @click="showBulkDeleteDialog = true">
                <NIcon name="i-ph-trash" class="w-3.5 h-3.5 mr-1" /> Delete selected
              </NButton>
            </div>
          </div>
        </NCollapsibleContent>
      </NCollapsible>

      <div class="flex-1 overflow-auto">
        <NTable
          :columns="tableColumns"
          :data="tags"
          :loading="loading"
          manual-pagination
          empty-text="No tags found"
          empty-icon="i-ph-hash"
        >
          <template #actions-header>
            <div class="flex items-center justify-center">
              <NTooltip :text="selectionMode ? 'Deactivate selection' : 'Activate selection'">
                <NButton icon btn="ghost-gray" size="2xs" :label="selectionMode ? 'i-ph-x' : 'i-solar-check-square-linear'" @click="toggleSelectionMode" />
              </NTooltip>
              <NTooltip class="ml-2" text="Select all on page">
                <NCheckbox :model-value="allSelectedOnPage" @update:model-value="selectAllOnPage" />
              </NTooltip>
            </div>
          </template>
          <template #actions-cell="{ cell }">
            <template v-if="!selectionMode">
              <NDropdownMenu :items="getTagActions(cell.row.original)">
                <NButton icon btn="ghost" size="sm" label="i-ph-dots-three-vertical" />
              </NDropdownMenu>
            </template>
            <template v-else>
              <div class="flex items-center justify-center">
                <NCheckbox :model-value="!!rowSelection[cell.row.original.id]" @update:model-value="v => setRowSelected(cell.row.original.id, !!v)" />
              </div>
            </template>
          </template>

          <template #name-cell="{ cell }">
            <div class="flex items-center gap-2 min-w-0">
              <span class="inline-block w-3 h-3 rounded border border-gray-200 dark:border-gray-700" :style="{ backgroundColor: cell.row.original.color }" />
              <span class="truncate text-sm font-medium">#{{ cell.row.original.name }}</span>
            </div>
          </template>

          <template #category-cell="{ cell }">
            <span class="text-xs text-gray-600 dark:text-gray-400">{{ cell.row.original.category || '—' }}</span>
          </template>

          <template #quotes-cell="{ cell }">
            <span class="text-sm">{{ cell.row.original.quotes_count || 0 }}</span>
          </template>

          <template #created-cell="{ cell }">
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatRelativeTime(cell.row.original.created_at) }}</span>
          </template>
        </NTable>
      </div>

      <div class="flex-shrink-0 flex items-center justify-between p-4">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Page {{ currentPage }} of {{ totalPages }} • {{ totalTags }} total tags
        </div>
        <NPagination v-model:page="currentPage" :total="totalTags" :items-per-page="pageSize" :sibling-count="2" show-edges size="sm" />
      </div>
    </div>
  </div>

  <AddTagDialog v-model="showAddDialog" :edit-tag="selectedTag" @tag-added="reloadAfterModal" @tag-updated="reloadAfterModal" />
  <DeleteTagDialog v-model="showDeleteDialog" :tag="tagToDelete" @tag-deleted="reloadAfterDelete" />

  <!-- Bulk Delete Confirmation -->
  <NDialog v-model:open="showBulkDeleteDialog">
    <NCard>
      <template #header>
        <h3 class="text-lg font-semibold">Delete {{ selectedIds.length }} {{ selectedIds.length === 1 ? 'Tag' : 'Tags' }}</h3>
      </template>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        You are about to delete {{ selectedIds.length }} {{ selectedIds.length === 1 ? 'tag' : 'tags' }}. This will remove them from associated quotes.
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <NButton btn="ghost" @click="showBulkDeleteDialog = false">Cancel</NButton>
          <NButton btn="soft-red" :loading="bulkProcessing" @click="confirmBulkDelete">Delete All</NButton>
        </div>
      </template>
    </NCard>
  </NDialog>
</template>
          <template #actions-cell="{ cell }">
            <template v-if="!selectionMode">
              <NDropdownMenu :items="getTagActions(cell.row.original)">
                <NButton icon btn="ghost" size="sm" label="i-ph-dots-three-vertical" />
              </NDropdownMenu>
            </template>
            <template v-else>
              <div class="flex items-center justify-center">
                <NCheckbox :model-value="!!rowSelection[cell.row.original.id]" @update:model-value="v => setRowSelected(cell.row.original.id, !!v)" />
              </div>
            </template>
          </template><template v-if="!selectionMode">
              <NDropdownMenu :items="getTagActions(cell.row.original)">
                <NButton icon btn="ghost" size="sm" label="i-ph-dots-three-vertical" />
              </NDropdownMenu>
            </template>
            <template v-else>
              <div class="flex items-center justify-center">
                <NCheckbox :model-value="!!rowSelection[cell.row.original.id]" @update:model-value="v => setRowSelected(cell.row.original.id, !!v)" />
              </div>
            </template>
          </template>

          <template #name-cell="{ cell }">
            <div class="flex items-center gap-2 min-w-0">
              <span class="inline-block w-3 h-3 rounded border border-gray-200 dark:border-gray-700" :style="{ backgroundColor: cell.row.original.color }" />
              <span class="truncate text-sm font-medium">#{{ cell.row.original.name }}</span>
            </div>
          </template>

          <template #category-cell="{ cell }">
            <span class="text-xs text-gray-600 dark:text-gray-400">{{ cell.row.original.category || '—' }}</span>
          </template>

          <template #quotes-cell="{ cell }">
            <span class="text-sm">{{ cell.row.original.quotes_count || 0 }}</span>
          </template>

          <template #created-cell="{ cell }">
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatRelativeTime(cell.row.original.created_at) }}</span>
          </template>
        </NTable>
      </div>

      <div class="flex-shrink-0 flex items-center justify-between p-4">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Page {{ currentPage }} of {{ totalPages }} • {{ totalTags }} total tags
        </div>
        <NPagination v-model:page="currentPage" :total="totalTags" :items-per-page="pageSize" :sibling-count="2" show-edges size="sm" />
      </div>
    </div>
  </div>

  <AddTagDialog v-model="showAddDialog" :edit-tag="selectedTag" @tag-added="reloadAfterModal" @tag-updated="reloadAfterModal" />
  <DeleteTagDialog v-model="showDeleteDialog" :tag="tagToDelete" @tag-deleted="reloadAfterDelete" />

  <!-- Bulk Delete Confirmation -->
  <NDialog v-model:open="showBulkDeleteDialog">
    <NCard>
      <template #header>
        <h3 class="text-lg font-semibold">Delete {{ selectedIds.length }} {{ selectedIds.length === 1 ? 'Tag' : 'Tags' }}</h3>
      </template>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        You are about to delete {{ selectedIds.length }} {{ selectedIds.length === 1 ? 'tag' : 'tags' }}. This will remove them from associated quotes.
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <NButton btn="ghost" @click="showBulkDeleteDialog = false">Cancel</NButton>
          <NButton btn="soft-red" :loading="bulkProcessing" @click="confirmBulkDelete">Delete All</NButton>
        </div>
      </template>
    </NCard>
  </NDialog>
</template>

<script setup lang="ts">
import type { Tag } from '~/types/tag'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Tags - Admin - Verbatims' })

const loading = ref(false)
const tags = ref<any[]>([])
const totalTags = ref(0)
const currentPage = ref(1)
const pageSize = ref(50)
const searchQuery = ref('')
const selectedSort = ref({ label: 'Name A-Z', value: 'name_asc' })

const showAddDialog = ref(false)
const selectedTag = ref<Tag | null>(null)
const showDeleteDialog = ref(false)
const tagToDelete = ref<Pick<Tag,'id'|'name'> | null>(null)
const selectionMode = ref(false)
const rowSelection = ref<Record<number, boolean>>({})
const bulkOpen = ref(false)
const bulkProcessing = ref(false)
const showBulkDeleteDialog = ref(false)

const selectedIds = computed<number[]>(() => Object.entries(rowSelection.value).filter(([, v]) => !!v).map(([k]) => Number(k)))
watch(selectedIds, (ids) => { bulkOpen.value = ids.length > 0 }, { immediate: true })
const visibleIds = computed<number[]>(() => tags.value.map(t => t.id))
const allSelectedOnPage = computed<boolean>(() => visibleIds.value.length > 0 && visibleIds.value.every(id => !!rowSelection.value[id]))

const toggleSelectionMode = () => { selectionMode.value = !selectionMode.value; if (!selectionMode.value) rowSelection.value = {} }
const setRowSelected = (id: number, value: boolean) => { rowSelection.value[id] = value === true }
const selectAllOnPage = () => { if (allSelectedOnPage.value) rowSelection.value = {}; else visibleIds.value.forEach(id => (rowSelection.value[id] = true)) }
const clearSelection = () => { rowSelection.value = {}; selectionMode.value = false }

const sortOptions = [
  { label: 'Name A-Z', value: 'name_asc' },
  { label: 'Name Z-A', value: 'name_desc' },
  { label: 'Most Recent', value: 'created_at_desc' },
  { label: 'Oldest First', value: 'created_at_asc' },
  { label: 'Most Quotes', value: 'quotes_desc' }
]

const tableColumns = [
  { header: '', accessorKey: 'actions', enableSorting: false, meta: { una: { tableHead: 'w-16', tableCell: 'w-16' } } },
  { header: 'Name', accessorKey: 'name', enableSorting: false, meta: { una: { tableHead: 'min-w-48', tableCell: 'min-w-48' } } },
  { header: 'Category', accessorKey: 'category', enableSorting: false, meta: { una: { tableHead: 'w-40', tableCell: 'w-40' } } },
  { header: 'Quotes', accessorKey: 'quotes', enableSorting: false, meta: { una: { tableHead: 'w-20', tableCell: 'w-20' } } },
  { header: 'Created', accessorKey: 'created', enableSorting: false, meta: { una: { tableHead: 'w-32', tableCell: 'w-32' } } }
]

const totalPages = computed(() => Math.ceil(totalTags.value / pageSize.value))

const loadTags = async () => {
  try {
    loading.value = true
    const sortValue = selectedSort.value.value
    const lastUnderscoreIndex = sortValue.lastIndexOf('_')
    const sortBy = sortValue.substring(0, lastUnderscoreIndex)
    const sortOrder = sortValue.substring(lastUnderscoreIndex + 1).toUpperCase()

    const res = await $fetch('/api/admin/tags', {
      query: {
        page: currentPage.value,
        limit: pageSize.value,
        search: searchQuery.value || undefined,
        sort_by: sortBy,
        sort_order: sortOrder
      }
    })
    tags.value = res.data || []
    totalTags.value = res.pagination?.total || 0
  } catch (e) {
    console.error('Failed to load tags', e)
    useToast().toast({ toast: 'error', title: 'Error', description: 'Failed to load tags' })
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedSort.value = sortOptions[0]
  currentPage.value = 1
}

const getTagActions = (tag: any) => [
  { label: 'View Public Page', leading: 'i-ph-eye', onclick: () => navigateTo(`/tags/${encodeURIComponent(tag.name)}`) },
  { label: 'Edit Tag', leading: 'i-ph-pencil', onclick: () => { selectedTag.value = tag; showAddDialog.value = true } },
  {},
  { label: 'Delete Tag', leading: 'i-ph-trash', onclick: () => { tagToDelete.value = tag; showDeleteDialog.value = true } }
]

const openCreate = () => { selectedTag.value = null; showAddDialog.value = true }
const reloadAfterModal = () => { showAddDialog.value = false; selectedTag.value = null; loadTags() }
const reloadAfterDelete = () => {
  showDeleteDialog.value = false
  tagToDelete.value = null
  if (tags.value.length <= 1 && currentPage.value > 1) currentPage.value = currentPage.value - 1
  loadTags()
}

const confirmBulkDelete = async () => {
  if (selectedIds.value.length === 0) return
  bulkProcessing.value = true
  try {
    const ids = [...selectedIds.value]
    const results = await Promise.allSettled(ids.map(id => $fetch(`/api/admin/tags/${id}`, { method: 'DELETE' })))
    const failed = results.filter(r => r.status === 'rejected').length
    const succeeded = results.length - failed
    useToast().toast({ toast: failed ? 'warning' : 'success', title: `Deleted ${succeeded} tag${succeeded !== 1 ? 's' : ''}`, description: failed ? `${failed} failed` : undefined })
  } catch (e) {
    useToast().toast({ toast: 'error', title: 'Bulk delete failed' })
  } finally {
    bulkProcessing.value = false
    showBulkDeleteDialog.value = false
    rowSelection.value = {}
    selectionMode.value = false
    loadTags()
  }
}

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString()
}

watchDebounced([currentPage, searchQuery, selectedSort], () => { loadTags() }, { debounce: 300 })
onMounted(() => { loadTags() })
</script>

<style scoped>
.frame { min-height: calc(100vh - 8rem) }
</style>
