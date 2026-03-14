<template>
  <div class="frame flex flex-col h-full">
    <div class="flex-shrink-0 bg-gray-50 dark:bg-[#0C0A09] mb-3">
      <!-- View Toggle -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">View:</span>
          <NToggle
            v-model="isCardView"
            :label="isCardView ? 'i-ph-squares-four' : 'i-ph-table'"
            size="sm"
          />
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ isCardView ? 'Card View' : 'Table View' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Card View -->
    <div v-if="isCardView" class="flex-1 overflow-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <div
          v-for="author in filteredAuthors"
          :key="author.id"
          class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
        >
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
              <img
                v-if="author.image_url"
                :src="author.image_url"
                :alt="author.name"
                class="w-12 h-12 rounded-full object-cover"
              />
              <div
                v-else
                class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
              >
                <NIcon name="i-ph-user" class="w-6 h-6 text-gray-500" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 min-w-0">
                <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ author.name }}
                </h3>
                <button
                  v-if="hasPendingEnrichment(author)"
                  type="button"
                  class="inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-900/60"
                  :title="`${author.enrichment_pending_count} pending enrichment suggestion(s)`"
                  @click="goToAuthorEnrichmentQueue(author)"
                />
              </div>
              <p v-if="author.job" class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ author.job }}
              </p>
              <div class="flex items-center space-x-2 mt-1">
                <span v-if="author.is_fictional" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                  Fictional
                </span>
                <span v-if="hasPendingEnrichment(author)" class="text-xs font-medium text-amber-700 dark:text-amber-300">
                  {{ author.enrichment_pending_count }} suggestion{{ author.enrichment_pending_count !== 1 ? 's' : '' }}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ author.quotes_count || 0 }} quotes
                </span>
              </div>
            </div>
          </div>
          <div class="mt-3 flex justify-end space-x-2">
            <NButton
              size="xs"
              btn="ghost"
              :loading="enrichmentLoading && enrichmentAuthorTarget?.id === author.id"
              @click="openEnrichmentPreview(author)"
            >
              <NIcon name="i-ph-magic-wand" class="w-3 h-3 mr-1" />
              Enrich
            </NButton>
            <NButton
              size="xs"
              btn="ghost"
              @click="editAuthor(author)"
            >
              <NIcon name="i-ph-pencil" class="w-3 h-3 mr-1" />
              Edit
            </NButton>
            <NButton
              size="xs"
              btn="ghost"
              @click="viewAuthor(author)"
            >
              <NIcon name="i-ph-eye" class="w-3 h-3 mr-1" />
              View
            </NButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Table View -->
    <div v-else class="flex-1 flex flex-col bg-white dark:bg-[#0C0A09]">
      <!-- Scrollable Table Container -->
      <div class="group authors-table-container flex-1 overflow-auto">
        <NTable
          :columns="tableColumns"
          :data="filteredAuthors"
          :loading="loading"
          manual-pagination
          empty-text="No authors found"
          empty-icon="i-ph-user"
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

          <template #author-header>
            <div class="flex items-center gap-4">
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Authors</h4>
              <div class="w-102">
                <NInput
                  v-model="searchQuery"
                  placeholder="Search authors by name, job, or description..."
                  leading="i-ph-magnifying-glass"
                  size="md"
                  :loading="loading"
                  :trailing="searchQuery ? 'i-ph-x' : undefined"
                  :una="{
                    inputTrailing: 'pointer-events-auto cursor-pointer',
                  }"
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

          <template #type-header>
            <div>
              <NSelect
                v-model="selectedFictionalFilter"
                :items="fictionalFilterOptions"
                placeholder="All Types"
                size="sm"
                item-key="label"
                value-key="label"
              />
            </div>
          </template>

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
                        {{ totalAuthors }} Total Authors
                      </NBadge>
                    </div>
                    <div class="flex">
                      <NBadge badge="solid-purple" size="xs" icon="i-ph-mask-happy" class="w-full">
                        {{ totalFictional }} Fictional
                      </NBadge>
                    </div>
                    <div class="flex">
                      <NBadge badge="solid-green" size="xs" icon="i-ph-quotes" class="w-full">
                        {{ totalQuotes }} Quotes
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
            <NDropdownMenu :items="getAuthorActions(cell.row.original)">
              <NButton
                icon
                btn="ghost-gray"
                size="xs"
                label="i-ph-dots-three-vertical"
                class="hover:bg-gray-200 dark:hover:bg-gray-700/50"
              />
            </NDropdownMenu>
          </template>

          <!-- Author Column -->
          <template #author-cell="{ cell }">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <img
                  v-if="cell.row.original.image_url"
                  :src="cell.row.original.image_url"
                  :alt="cell.row.original.name"
                  class="w-8 h-8 rounded-full object-cover"
                />
                <div
                  v-else
                  class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                >
                  <NIcon name="i-ph-user" class="w-4 h-4 text-gray-500" />
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ cell.row.original.name }}
                  </p>
                  <button
                    v-if="hasPendingEnrichment(cell.row.original)"
                    type="button"
                    class="inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-900/60"
                    :title="`${cell.row.original.enrichment_pending_count} pending enrichment suggestion(s)`"
                    @click="goToAuthorEnrichmentQueue(cell.row.original)"
                  />
                </div>
                <p v-if="cell.row.original.job" class="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {{ cell.row.original.job }}
                </p>
                <p v-if="hasPendingEnrichment(cell.row.original)" class="text-xs font-medium text-amber-700 dark:text-amber-300 truncate">
                  {{ cell.row.original.enrichment_pending_count }} pending suggestion{{ cell.row.original.enrichment_pending_count !== 1 ? 's' : '' }}
                </p>
              </div>
            </div>
          </template>

          <!-- Type Column -->
          <template #type-cell="{ cell }">
            <span v-if="cell.row.original.is_fictional" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
              Fictional
            </span>
            <span v-else class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
              Real
            </span>
          </template>

          <!-- Quotes Column -->
          <template #quotes-cell="{ cell }">
            <span class="text-sm text-gray-900 dark:text-white">
              {{ cell.row.original.quotes_count || 0 }}
            </span>
          </template>

          <!-- Created Column -->
          <template #created-cell="{ cell }">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatRelativeTime(cell.row.original.created_at) }}
            </span>
          </template>
        </NTable>
      </div>

      <div class="flex-shrink-0 flex items-center justify-between p-4">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Page {{ currentPage }} of {{ totalPages }} • {{ totalAuthors }} total authors
        </div>
        <NPagination
          v-model:page="currentPage"
          :total="totalAuthors"
          :items-per-page="pageSize"
          :sibling-count="2"
          show-edges
          size="sm"
        />
      </div>
    </div>
  </div>

  <AddAuthorDialog
    v-model="showAddAuthorDialog"
    :edit-author="selectedAuthor"
    @author-added="onAuthorAdded"
    @author-updated="onAuthorUpdated"
  />
  
  <DeleteAuthorDialog
    v-model="showDeleteAuthorDialog"
    :author="authorToDelete"
    @author-deleted="onAuthorDeleted"
  />

  <AdminEnrichmentConfigDialog
    :open="showEnrichmentConfigDialog"
    :loading="enrichmentConfigLoading"
    :saving="enrichmentConfigSaving"
    :updated-at="enrichmentConfigUpdatedAt"
    :form="enrichmentConfigForm"
    :sources="enrichmentConfigSources"
    @update:open="showEnrichmentConfigDialog = $event"
    @save="saveEnrichmentConfig"
  />

  <AdminAuthorEnrichmentDialog
    :open="showEnrichmentDialog"
    :loading="enrichmentLoading"
    :applying="enrichmentApplying"
    :author="enrichmentAuthorTarget"
    :preview="enrichmentPreview"
    :job-id="enrichmentJobId"
    :selected-fields="selectedEnrichmentFields"
    @update:open="handleEnrichmentDialogOpenChange"
    @refresh="enrichmentAuthorTarget && openEnrichmentPreview(enrichmentAuthorTarget)"
    @toggle-field="toggleEnrichmentField"
    @select-recommended="selectRecommendedEnrichmentFields"
    @apply="applySelectedEnrichment"
  />

  <!-- Bulk Delete Confirmation -->
  <NDialog v-model:open="showBulkDeleteDialog">
    <NCard>
      <template #header>
        <h3 class="text-lg font-semibold">Delete {{ selectedIds.length }} {{ selectedIds.length === 1 ? 'Author' : 'Authors' }}</h3>
      </template>
      <div class="space-y-3">
        <p class="text-gray-600 dark:text-gray-400">
          You are about to delete {{ selectedIds.length }} {{ selectedIds.length === 1 ? 'author' : 'authors' }}. If they have related quotes, choose a strategy:
        </p>
        <NRadioGroup
          v-model="bulkDeleteStrategy"
          :items="[
            { label: 'Anonymize related quotes (keep quotes, remove author link)', value: 'anonymize' },
            { label: 'Delete related quotes (remove quotes and the author)', value: 'delete' }
          ]"
        />
      </div>
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

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({
  title: 'Authors - Admin - Verbatims'
})

const loading = ref(false)
const authors = ref<Author[]>([])
const totalAuthors = ref(0)
const currentPage = ref(1)
const pageSize = ref(50)
const searchQuery = ref('')
const selectedFictionalFilter = ref({ label: 'All Types', value: '' })
const selectedSort = ref({ label: 'Name A-Z', value: 'name_asc' })
const isCardView = ref(false)
const showAddAuthorDialog = ref(false)
const selectedAuthor = ref<Author | undefined>()
const showDeleteAuthorDialog = ref(false)
const authorToDelete = ref<Author | null>(null)
const showEnrichmentDialog = ref(false)
const showEnrichmentConfigDialog = ref(false)
const enrichmentLoading = ref(false)
const enrichmentApplying = ref(false)
const enrichmentAuthorTarget = ref<Author | null>(null)
const enrichmentPreview = ref<any | null>(null)
const enrichmentJobId = ref<number | null>(null)
const selectedEnrichmentFields = ref<string[]>([])
const enrichmentConfigLoading = ref(false)
const enrichmentConfigSaving = ref(false)
const enrichmentConfigUpdatedAt = ref<string | null>(null)
const enrichmentConfigSources = ref<Record<string, 'kv' | 'env' | 'default' | 'none'>>({})
const enrichmentConfigForm = reactive({
  scheduleEnabled: true,
  processEnabled: true,
  scheduleBatchSize: '25',
  processBatchSize: '3',
  authorStaleDays: '180',
  referenceStaleDays: '365',
  reviewGraceDays: '14',
})

// Bulk selection state (multi‑select column)
const rowSelection = ref<Record<number, boolean>>({})
const lastSelectedIndex = ref<number | null>(null)
const bulkProcessing = ref(false)
const showBulkDeleteDialog = ref(false)
const bulkDeleteStrategy = ref<'delete' | 'anonymize'>('anonymize')
const selectedIds = computed<number[]>(() => Object.entries(rowSelection.value).filter(([, v]) => !!v).map(([k]) => Number(k)))
watch(selectedIds, (ids) => { /* headerActions reacts to this */ }, { immediate: true })
const visibleIds = computed<number[]>(() => filteredAuthors.value.map(a => a.id))
const allSelectedOnPage = computed<boolean>(() => visibleIds.value.length > 0 && visibleIds.value.every(id => !!rowSelection.value[id]))

// computed helper for header checkbox (select all on current page)
const allSelected = computed<boolean | 'indeterminate'>({
  get: () => {
    const total = filteredAuthors.value.length
    const count = selectedIds.value.length
    if (total === 0) return false
    if (count === total) return true
    if (count > 0) return 'indeterminate'
    return false
  },
  set: (v) => {
    const newSelection: Record<number, boolean> = {}
    if (v === true) {
      filteredAuthors.value.forEach(a => { newSelection[a.id] = true })
    }
    rowSelection.value = newSelection
    lastSelectedIndex.value = null
  }
})

const setRowSelected = (id: number, value: boolean) => { rowSelection.value[id] = value === true }
const toggleAllSelection = (v: boolean | 'indeterminate') => {
  if (v) {
    const newSelection: Record<number, boolean> = {}
    filteredAuthors.value.forEach(a => { newSelection[a.id] = true })
    rowSelection.value = newSelection
  } else {
    rowSelection.value = {}
  }
  lastSelectedIndex.value = null
}

const selectAllOnPage = () => { if (allSelectedOnPage.value) rowSelection.value = {}; else visibleIds.value.forEach(id => (rowSelection.value[id] = true)) }
const clearSelection = () => { rowSelection.value = {}; lastSelectedIndex.value = null }

// shift‑click support
const handleRowCheckboxClick = (event: MouseEvent, index: number, id: number) => {
  const currently = !!rowSelection.value[id]
  const newVal = !currently

  if (event.shiftKey && lastSelectedIndex.value !== null) {
    const start = Math.min(lastSelectedIndex.value, index)
    const end = Math.max(lastSelectedIndex.value, index)
    for (let i = start; i <= end; i += 1) {
      const row = filteredAuthors.value[i]
      if (row) rowSelection.value[row.id] = newVal
    }
  } else {
    rowSelection.value[id] = newVal
  }

  lastSelectedIndex.value = index
} 

const fictionalFilterOptions = [
  { label: 'All Types', value: '' },
  { label: 'Real People', value: 'false' },
  { label: 'Fictional Characters', value: 'true' }
]

const sortOptions = [
  { label: 'Name A-Z', value: 'name_asc' },
  { label: 'Name Z-A', value: 'name_desc' },
  { label: 'Most Recent', value: 'created_desc' },
  { label: 'Oldest First', value: 'created_asc' },
  { label: 'Most Quotes', value: 'quotes_desc' },
  { label: 'Most Liked', value: 'likes_desc' }
]

const headerActions = computed(() => {
  const actions: any[] = []
  if (selectedIds.value.length > 0) {
    actions.push({
      label: 'Delete Selected',
      leading: 'i-ph-trash',
      onclick: () => { showBulkDeleteDialog.value = true }
    })
  }
  if (actions.length > 0) actions.push({})
  actions.push({
    label: 'Add New Author',
    leading: 'i-ph-plus',
    onclick: () => { showAddAuthorDialog.value = true }
  })
  actions.push({})
  actions.push({
    label: 'Enrichment settings',
    leading: 'i-ph-sliders-horizontal',
    onclick: () => openEnrichmentConfigDialog()
  })
  actions.push({
    label: 'Refresh',
    leading: 'i-ph-arrows-clockwise',
    onclick: () => loadAuthors()
  })
  actions.push({
    label: 'Reset Filters',
    leading: 'i-ph-x',
    onclick: () => resetFilters()
  })
  return actions
})

const totalPages = computed(() => Math.ceil(totalAuthors.value / pageSize.value))

const totalFictional = computed(() => {
  return authors.value.filter(author => author.is_fictional).length
})

const totalQuotes = computed(() => {
  return authors.value.reduce((sum, author) => sum + ((author as any).quotes_count || 0), 0)
})

const filteredAuthors = computed(() => authors.value)

const tableColumns = [
  { header: '', accessorKey: 'select', enableSorting: false, meta: { una: { tableHead: 'w-6', tableCell: 'w-6' } } },
  {
    header: 'Author',
    accessorKey: 'author',
    enableSorting: true,
    meta: {
      una: {
        tableHead: 'min-w-60',
        tableCell: 'min-w-60'
      }
    }
  },
  {
    header: 'Type',
    accessorKey: 'type',
    enableSorting: false,
    meta: {
      una: {
        tableHead: 'w-24',
        tableCell: 'w-24'
      }
    }
  },
  {
    header: 'Quotes',
    accessorKey: 'quotes',
    enableSorting: true,
    meta: {
      una: {
        tableHead: 'w-20',
        tableCell: 'w-20'
      }
    }
  },
  {
    header: 'Created',
    accessorKey: 'created',
    enableSorting: false,
    meta: {
      una: {
        tableHead: 'w-32',
        tableCell: 'w-32'
      }
    }
  },
  { header: '', accessorKey: 'actions', enableSorting: false, meta: { una: { tableHead: 'w-16', tableCell: 'w-16' } } }
]

const loadAuthors = async () => {
  try {
    loading.value = true

    // Parse sort option - handle compound sort keys like 'release_date_desc'
    const sortValue = selectedSort.value.value
    const lastUnderscoreIndex = sortValue.lastIndexOf('_')
    const sortBy = sortValue.substring(0, lastUnderscoreIndex)
    const sortOrder = sortValue.substring(lastUnderscoreIndex + 1)

    const response = await $fetch('/api/admin/authors', {
      query: {
        page: currentPage.value,
        limit: pageSize.value,
        search: searchQuery.value || undefined,
        is_fictional: selectedFictionalFilter.value.value || undefined,
        sort_by: sortBy,
        sort_order: sortOrder.toUpperCase()
      }
    })

    authors.value = response.data || []
    totalAuthors.value = response.pagination?.total || 0
    // clear selection when data refreshes
    rowSelection.value = {}
    lastSelectedIndex.value = null
  } catch (error) {
    console.error('Failed to load authors:', error)
    useToast().toast({
      title: 'Error',
      description: 'Failed to load authors',
      toast: 'error'
    })
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedFictionalFilter.value = fictionalFilterOptions[0]
  selectedSort.value = sortOptions[0]
  currentPage.value = 1
  rowSelection.value = {}
  lastSelectedIndex.value = null
}

const getAuthorActions = (author: Author) => [
  {
    label: 'View Public Page',
    leading: 'i-ph-eye',
    onclick: () => viewAuthor(author)
  },
  {
    label: 'Edit Author',
    leading: 'i-ph-pencil',
    onclick: () => editAuthor(author)
  },
  {
    label: 'Preview enrichment',
    leading: 'i-ph-magic-wand',
    onclick: () => openEnrichmentPreview(author)
  },
  ...(hasPendingEnrichment(author)
    ? [{
        label: 'Open enrichment queue',
        leading: 'i-ph-bell-ringing',
        onclick: () => goToAuthorEnrichmentQueue(author)
      }]
    : []),
  {},
  {
    label: 'Delete Author',
    leading: 'i-ph-trash',
    onclick: () => deleteAuthor(author)
  }
]

const viewAuthor = (author: Author) => {
  navigateTo(`/authors/${author.id}`)
}

const hasPendingEnrichment = (author: Author) => Number(author.enrichment_pending_count || 0) > 0

const goToAuthorEnrichmentQueue = (author: Author) => {
  navigateTo({
    path: '/admin/enrichment',
    query: {
      entityType: 'author',
      entityId: String(author.id),
      status: 'completed',
    }
  })
}

const editAuthor = async (author: Author) => {
  selectedAuthor.value = author
  showAddAuthorDialog.value = true

  try {
    const response = await $fetch<any>(`/api/admin/authors/${author.id}`)
    if (response.data) {
      selectedAuthor.value = response.data
    }
  } catch (error) {
    console.error('Failed to load full author details:', error)
  }
}

const deleteAuthor = async (author: Author) => {
  authorToDelete.value = author
  showDeleteAuthorDialog.value = true
}

const openEnrichmentPreview = async (author: Author) => {
  enrichmentAuthorTarget.value = author
  enrichmentLoading.value = true
  showEnrichmentDialog.value = true

  try {
    const response = await $fetch(`/api/admin/enrichment/authors/${author.id}/preview`, {
      method: 'POST'
    }) as { data?: { job?: any, preview?: any } }

    enrichmentPreview.value = response.data?.preview || null
    enrichmentJobId.value = response.data?.job?.id || null
    selectedEnrichmentFields.value = enrichmentPreview.value?.proposals
      ?.filter((proposal: any) => proposal.recommended)
      ?.map((proposal: any) => proposal.field) || []

    if (!enrichmentPreview.value) {
      useToast().toast({
        title: 'No preview available',
        description: 'This author could not be enriched automatically right now.',
        toast: 'warning'
      })
    }
  } catch (error: any) {
    console.error('Failed to build enrichment preview:', error)
    useToast().toast({
      title: 'Enrichment preview failed',
      description: error?.data?.statusMessage || error?.message || 'Could not build the author preview.',
      toast: 'error'
    })
    showEnrichmentDialog.value = false
  } finally {
    enrichmentLoading.value = false
  }
}

const toggleEnrichmentField = (field: string, value: boolean | 'indeterminate') => {
  if (value === true) {
    if (!selectedEnrichmentFields.value.includes(field)) {
      selectedEnrichmentFields.value = [...selectedEnrichmentFields.value, field]
    }
    return
  }

  selectedEnrichmentFields.value = selectedEnrichmentFields.value.filter(item => item !== field)
}

const selectRecommendedEnrichmentFields = () => {
  selectedEnrichmentFields.value = enrichmentPreview.value?.proposals
    ?.filter((proposal: any) => proposal.recommended)
    ?.map((proposal: any) => proposal.field) || []
}

const closeEnrichmentDialog = () => {
  showEnrichmentDialog.value = false
  enrichmentPreview.value = null
  enrichmentJobId.value = null
  selectedEnrichmentFields.value = []
  enrichmentAuthorTarget.value = null
}

const handleEnrichmentDialogOpenChange = (open: boolean) => {
  if (!open) {
    closeEnrichmentDialog()
    return
  }

  showEnrichmentDialog.value = true
}

const openEnrichmentConfigDialog = async () => {
  enrichmentConfigLoading.value = true
  showEnrichmentConfigDialog.value = true

  try {
    const response = await $fetch('/api/admin/enrichment/config') as {
      data?: {
        updatedAt: string | null
        values: Record<string, string | number | boolean>
        sources: Record<string, 'kv' | 'env' | 'default' | 'none'>
      }
    }

    enrichmentConfigUpdatedAt.value = response.data?.updatedAt || null
    enrichmentConfigSources.value = response.data?.sources || {}
    enrichmentConfigForm.scheduleEnabled = Boolean(response.data?.values?.scheduleEnabled)
    enrichmentConfigForm.processEnabled = Boolean(response.data?.values?.processEnabled)
    enrichmentConfigForm.scheduleBatchSize = String(response.data?.values?.scheduleBatchSize || '25')
    enrichmentConfigForm.processBatchSize = String(response.data?.values?.processBatchSize || '3')
    enrichmentConfigForm.authorStaleDays = String(response.data?.values?.authorStaleDays || '180')
    enrichmentConfigForm.referenceStaleDays = String(response.data?.values?.referenceStaleDays || '365')
    enrichmentConfigForm.reviewGraceDays = String(response.data?.values?.reviewGraceDays || '14')
  } catch (error: any) {
    useToast().toast({
      title: 'Failed to load settings',
      description: error?.data?.statusMessage || error?.message || 'Could not load enrichment settings.',
      toast: 'error'
    })
    showEnrichmentConfigDialog.value = false
  } finally {
    enrichmentConfigLoading.value = false
  }
}

const saveEnrichmentConfig = async (form: typeof enrichmentConfigForm) => {
  enrichmentConfigSaving.value = true
  try {
    const response = await $fetch('/api/admin/enrichment/config', {
      method: 'POST',
      body: {
        scheduleEnabled: form.scheduleEnabled,
        processEnabled: form.processEnabled,
        scheduleBatchSize: Number(form.scheduleBatchSize),
        processBatchSize: Number(form.processBatchSize),
        authorStaleDays: Number(form.authorStaleDays),
        referenceStaleDays: Number(form.referenceStaleDays),
        reviewGraceDays: Number(form.reviewGraceDays),
      }
    }) as {
      data?: {
        updatedAt: string | null
        values: Record<string, string | number | boolean>
        sources: Record<string, 'kv' | 'env' | 'default' | 'none'>
      }
    }

    enrichmentConfigUpdatedAt.value = response.data?.updatedAt || null
    enrichmentConfigSources.value = response.data?.sources || {}
    useToast().toast({
      title: 'Enrichment settings saved',
      description: 'KV overrides are now active for the enrichment scheduler and processor.',
      toast: 'success'
    })
    showEnrichmentConfigDialog.value = false
  } catch (error: any) {
    useToast().toast({
      title: 'Save failed',
      description: error?.data?.statusMessage || error?.message || 'Could not save enrichment settings.',
      toast: 'error'
    })
  } finally {
    enrichmentConfigSaving.value = false
  }
}

const applySelectedEnrichment = async () => {
  if (!enrichmentJobId.value || selectedEnrichmentFields.value.length === 0) return

  enrichmentApplying.value = true
  try {
    await $fetch(`/api/admin/enrichment/jobs/${enrichmentJobId.value}/apply`, {
      method: 'POST',
      body: {
        fields: selectedEnrichmentFields.value,
      }
    })

    useToast().toast({
      title: 'Enrichment applied',
      description: `${selectedEnrichmentFields.value.length} field(s) were updated on the author record.`,
      toast: 'success'
    })

    closeEnrichmentDialog()
    loadAuthors()
  } catch (error: any) {
    console.error('Failed to apply enrichment preview:', error)
    useToast().toast({
      title: 'Apply failed',
      description: error?.data?.statusMessage || error?.message || 'Could not apply the selected fields.',
      toast: 'error'
    })
  } finally {
    enrichmentApplying.value = false
  }
}

const onAuthorAdded = () => {
  showAddAuthorDialog.value = false
  selectedAuthor.value = undefined
  loadAuthors()
}

const onAuthorUpdated = () => {
  showAddAuthorDialog.value = false
  selectedAuthor.value = undefined
  loadAuthors()
}

const onAuthorDeleted = () => {
  showDeleteAuthorDialog.value = false
  authorToDelete.value = null
  // Reset to first page if current page becomes empty
  if (authors.value.length <= 1 && currentPage.value > 1) {
    currentPage.value = currentPage.value - 1
  }
  loadAuthors()
}

watchDebounced([currentPage, searchQuery, selectedFictionalFilter, selectedSort], () => {
  loadAuthors()
}, { debounce: 300 })

onMounted(() => {
  loadAuthors()
})

const confirmBulkDelete = async () => {
  if (selectedIds.value.length === 0) return
  bulkProcessing.value = true
  try {
    const ids = [...selectedIds.value]
    const results = await Promise.allSettled(
      ids.map(id => $fetch(`/api/admin/authors/${id}`, { method: 'DELETE', body: { strategy: bulkDeleteStrategy.value } }))
    )
    const failed = results.filter(r => r.status === 'rejected').length
    const succeeded = results.length - failed
    useToast().toast({ toast: failed ? 'warning' : 'success', title: `Deleted ${succeeded} author${succeeded !== 1 ? 's' : ''}`, description: failed ? `${failed} failed` : undefined })
  } catch (e) {
    useToast().toast({ toast: 'error', title: 'Bulk delete failed' })
  } finally {
    bulkProcessing.value = false
    showBulkDeleteDialog.value = false
    rowSelection.value = {}
    lastSelectedIndex.value = null
    loadAuthors()
  }
}
</script>

<style scoped>
.authors-table-container {
  max-height: calc(100vh - 13rem);
}
</style>
