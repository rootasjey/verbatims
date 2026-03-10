<template>
  <div class="frame flex flex-col h-full">
    <div class="flex-1 flex flex-col">
      <div class="group flex-1 overflow-auto">
        <NTable
          :columns="tableColumns"
          :data="tags"
          :loading="loading"
          manual-pagination
          empty-text="No tags found"
          empty-icon="i-ph-hash"
        >
          <template #select-header>
            <div>
              <NCheckbox
                checkbox="gray"
                :model-value="allSelected"
                @update:model-value="toggleAllSelection"
              />
            </div>
          </template>

          <template #select-cell="{ cell }">
            <div class="items-center justify-center" :class="[
              Object.keys(rowSelection).length > 0 ? 'flex' : 'hidden',
              'group-hover:flex',
            ]">
              <NCheckbox
                checkbox="gray"
                :model-value="!!rowSelection[cell.row.original.id]"
                @click="e => handleRowCheckboxClick(e, cell.row.index, cell.row.original.id)"
              />
            </div>
          </template>

          <template #name-header>
            <div class="flex items-center gap-2">
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Name</h4>
              <div class="w-102">
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
              
              <div>
                <NSelect
                  v-model="selectedSort"
                  :items="sortOptions"
                  placeholder="Sort by"
                  size="sm"
                  item-key="label"
                  value-key="label"
                />
              </div>
            </div>
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


          <!-- Actions Column -->
          <template #actions-header>
            <div class="flex items-center justify-center space-x-1">
              <span v-if="selectedIds.length > 0">{{ selectedIds.length }}</span>
              <NTooltip :_tooltip-content="{
                class: 'py-2 light:bg-gray-100 dark:bg-gray-950 light:b-gray-2 dark:b-gray-9 shadow-lg dark:shadow-gray-800/50',
              }">
                <template #default>
                  <NIcon name="i-ph-info" class="mr-2 w-4 h-4 text-gray-500 dark:text-gray-400 cursor-pointer" />
                </template>
                <template #content>
                  <div class="space-y-2">
                    <div class="flex">
                      <NBadge badge="solid-gray" size="xs" icon="i-ph-selection-background" class="w-full">
                        {{ totalTags }} Total Tags
                      </NBadge>
                    </div>
                  </div>
                </template>
              </NTooltip>

              <NDropdownMenu :items="headerActions">
                <NButton size="xs" btn="ghost-gray" icon label="i-ph-caret-down" class="hover:bg-gray-200 dark:hover:bg-gray-900" />
              </NDropdownMenu>
            </div>
          </template>

          <template #actions-cell="{ cell }">
            <NDropdownMenu :items="getTagActions(cell.row.original)">
              <NButton icon btn="ghost-gray" size="xs" label="i-ph-dots-three-vertical" class="hover:bg-gray-200 dark:hover:bg-gray-700/50" />
            </NDropdownMenu>
          </template>
        </NTable>
      </div>

      <div class="flex-shrink-0 flex items-center justify-between p-4">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Page {{ currentPage }} of {{ totalPages }} • {{ totalTags }} total tags
        </div>
        <NPagination v-model:page="currentPage" :total="totalTags" :items-per-page="pageSize" :sibling-count="2" show-edges size="sm" pagination-selected="solid-indigo" />
      </div>
    </div>
  </div>

  <AddTagDialog v-model="showAddDialog" :edit-tag="selectedTag" @tag-added="reloadAfterModal" @tag-updated="reloadAfterModal" />
  <DeleteTagDialog v-model="showDeleteDialog" :tag="tagToDelete" @tag-deleted="reloadAfterDelete" />

  <NDialog v-model:open="showBackfillDialog">
    <template #header>
      <h3 class="text-lg font-semibold">Backfill Quote Tags</h3>
    </template>

    <div class="space-y-4">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Run the server-side matcher to assign tags to existing quotes.
      </p>

      <div>
        <label class="block text-sm font-medium mb-1">Status Scope</label>
        <NSelect
          v-model="backfillStatus"
          :items="backfillStatusOptions"
          item-key="label"
          value-key="label"
          size="sm"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <NCheckbox v-model="backfillOnlyUntagged" label="Only untagged quotes" />
        <NCheckbox v-model="backfillDryRun" label="Dry run (preview only)" />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <NInput v-model="backfillLimit" type="number" min="1" max="5000" placeholder="Limit (1-5000)" />
        <NCheckbox v-model="backfillResetExisting" label="Reset existing tags first" />
      </div>
    </div>

    <template #footer>
      <div class="mt-6 flex justify-end gap-3">
        <NButton btn="link-gray" :disabled="backfillProcessing" @click="showBackfillDialog = false">Cancel</NButton>
        <NButton btn="soft-blue" :loading="backfillProcessing" @click="triggerBackfill">
          Run Backfill
        </NButton>
      </div>
    </template>
  </NDialog>

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
import { formatRelativeTime } from '~/utils/time-formatter'

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

// multi-select state
const rowSelection = ref<Record<number, boolean>>({})
const lastSelectedIndex = ref<number | null>(null)
const bulkOpen = ref(false)
const bulkProcessing = ref(false)
const showBulkDeleteDialog = ref(false)

const showBackfillDialog = ref(false)
const backfillProcessing = ref(false)
const backfillDryRun = ref(true)
const backfillOnlyUntagged = ref(true)
const backfillResetExisting = ref(false)
const backfillLimit = ref('2000')
const backfillStatus = ref({ label: 'Approved quotes', value: 'approved' })

const selectedIds = computed<number[]>(() => Object.entries(rowSelection.value).filter(([, v]) => !!v).map(([k]) => Number(k)))
watch(selectedIds, (ids) => { bulkOpen.value = ids.length > 0 }, { immediate: true })

const clearSelection = () => {
  rowSelection.value = {}
  lastSelectedIndex.value = null
} 

const sortOptions = [
  { label: 'Name A-Z', value: 'name_asc' },
  { label: 'Name Z-A', value: 'name_desc' },
  { label: 'Most Recent', value: 'created_at_desc' },
  { label: 'Oldest First', value: 'created_at_asc' },
  { label: 'Most Quotes', value: 'quotes_desc' }
]

const backfillStatusOptions = [
  { label: 'Approved quotes', value: 'approved' },
  { label: 'Pending quotes', value: 'pending' },
  { label: 'Draft quotes', value: 'draft' },
  { label: 'Rejected quotes', value: 'rejected' },
  { label: 'All quotes', value: 'all' }
]

const tableColumns = [
  { header: '', accessorKey: 'select', enableSorting: false, meta: { una: { tableHead: 'w-6', tableCell: 'w-6' } } },
  { header: 'Name', accessorKey: 'name', enableSorting: false, meta: { una: { tableHead: 'min-w-48', tableCell: 'min-w-48' } } },
  { header: 'Category', accessorKey: 'category', enableSorting: false, meta: { una: { tableHead: 'w-40', tableCell: 'w-40' } } },
  { header: 'Quotes', accessorKey: 'quotes', enableSorting: false, meta: { una: { tableHead: 'w-20', tableCell: 'w-20' } } },
  { header: 'Created', accessorKey: 'created', enableSorting: false, meta: { una: { tableHead: 'w-32', tableCell: 'w-32' } } },
  { header: '', accessorKey: 'actions', enableSorting: false, meta: { una: { tableHead: 'w-16', tableCell: 'w-16' } } },
]

const totalPages = computed(() => Math.ceil(totalTags.value / pageSize.value))

const headerActions = computed(() => {
  const actions = []
  if (selectedIds.value.length > 0) {
    actions.push({
      label: 'Delete Selected',
      leading: 'i-ph-trash',
      onclick: () => { showBulkDeleteDialog.value = true }
    })
  }

  if (actions.length > 0) actions.push({}) // divider
  actions.push({
    label: 'Add New Tag',
    leading: 'i-ph-plus',
    onclick: () => { showAddDialog.value = true }
  })
  actions.push({
    label: 'Backfill Tags',
    leading: 'i-ph-arrows-clockwise',
    onclick: () => { showBackfillDialog.value = true }
  })
  actions.push({})
  actions.push({
    label: 'Refresh',
    leading: 'i-ph-arrows-clockwise',
    onclick: () => loadTags()
  })
  actions.push({
    label: 'Reset Filters',
    leading: 'i-ph-x',
    onclick: () => resetFilters()
  })
  return actions
})

const allSelected = computed<boolean | 'indeterminate'>({
  get: () => {
    const total = tags.value.length
    const count = selectedIds.value.length
    if (total === 0) return false
    if (count === total) return true
    if (count > 0) return 'indeterminate'
    return false
  },
  set: (v) => {
    const newSelection: Record<number, boolean> = {}
    if (v === true) {
      tags.value.forEach(t => { newSelection[t.id] = true })
    }
    rowSelection.value = newSelection
    lastSelectedIndex.value = null // reset range anchor when toggling all
  }
})

const toggleAllSelection = (v: boolean | 'indeterminate') => {
  if (v) {
    const newSelection: Record<number, boolean> = {}
    tags.value.forEach(t => { newSelection[t.id] = true })
    rowSelection.value = newSelection
  } else {
    rowSelection.value = {}
  }
  lastSelectedIndex.value = null
}

const handleRowCheckboxClick = (event: MouseEvent, index: number, id: number) => {
  const currently = !!rowSelection.value[id]
  const newVal = !currently

  if (event.shiftKey && lastSelectedIndex.value !== null) {
    const start = Math.min(lastSelectedIndex.value, index)
    const end = Math.max(lastSelectedIndex.value, index)
    for (let i = start; i <= end; i += 1) {
      const row = tags.value[i]
      if (row) rowSelection.value[row.id] = newVal
    }
  } else {
    rowSelection.value[id] = newVal
  }

  lastSelectedIndex.value = index
}

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
    // clear any existing selection when data refreshes
    rowSelection.value = {}
    lastSelectedIndex.value = null
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
  // clear multi-select when filters change
  rowSelection.value = {}
  lastSelectedIndex.value = null
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
    lastSelectedIndex.value = null
    loadTags()
  }
}

const triggerBackfill = async () => {
  backfillProcessing.value = true
  try {
    const response: any = await $fetch('/api/admin/quotes/backfill-tags', {
      method: 'POST',
      body: {
        dryRun: backfillDryRun.value,
        status: backfillStatus.value.value,
        onlyUntagged: backfillOnlyUntagged.value,
        resetExisting: backfillResetExisting.value,
        limit: Math.min(Math.max(parseInt(backfillLimit.value || '2000') || 2000, 1), 5000)
      }
    })

    const scanned = response?.results?.quotes_scanned ?? 0
    const matched = response?.results?.quotes_with_matches ?? 0
    const linksAttempted = response?.results?.links_attempted ?? 0

    useToast().toast({
      toast: 'success',
      title: backfillDryRun.value ? 'Backfill dry-run complete' : 'Backfill completed',
      description: `${scanned} scanned · ${matched} matched · ${linksAttempted} link attempts`
    })

    showBackfillDialog.value = false
    await loadTags()
  } catch (error) {
    console.error('Backfill trigger failed', error)
    useToast().toast({
      toast: 'error',
      title: 'Backfill failed',
      description: 'Unable to run tag backfill.'
    })
  } finally {
    backfillProcessing.value = false
  }
}

watchDebounced([currentPage, searchQuery, selectedSort], () => { loadTags() }, { debounce: 300 })
onMounted(() => { loadTags() })
</script>

<style scoped>
.frame { min-height: calc(100vh - 8rem) }
</style>
