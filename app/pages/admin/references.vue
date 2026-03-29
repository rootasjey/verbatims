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
          v-for="reference in filteredReferences"
          :key="reference.id"
          class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
        >
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
              <img
                v-if="reference.image_url"
                :src="reference.image_url"
                :alt="reference.name"
                class="w-12 h-16 rounded object-cover"
              />
              <div
                v-else
                class="w-12 h-16 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
              >
                <NIcon :name="getTypeIcon(reference.primary_type)" class="w-6 h-6 text-gray-500" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 min-w-0">
                <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ reference.name }}
                </h3>
                <button
                  v-if="hasPendingEnrichment(reference)"
                  type="button"
                  class="inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-900/60"
                  :title="`${reference.enrichment_pending_count} pending enrichment suggestion(s)`"
                  @click="goToReferenceEnrichmentQueue(reference)"
                />
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {{ reference.primary_type.replace('_', ' ') }}
              </p>
              <p v-if="reference.secondary_type" class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ reference.secondary_type }}
              </p>
              <div class="flex items-center space-x-2 mt-1">
                <span v-if="hasPendingEnrichment(reference)" class="text-xs font-medium text-amber-700 dark:text-amber-300">
                  {{ reference.enrichment_pending_count }} suggestion{{ reference.enrichment_pending_count !== 1 ? 's' : '' }}
                </span>
                <span v-if="reference.release_date" class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatYear(reference.release_date) }}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ reference.quotes_count || 0 }} quotes
                </span>
              </div>
            </div>
          </div>
          <div class="mt-3 flex justify-end space-x-2">
            <NButton
              size="xs"
              btn="ghost"
              :loading="enrichmentLoading && enrichmentReferenceTarget?.id === reference.id"
              @click="openEnrichmentPreview(reference)"
            >
              <NIcon name="i-ph-magic-wand" class="w-3 h-3 mr-1" />
              Enrich
            </NButton>
            <NButton
              size="xs"
              btn="ghost"
              @click="editReference(reference)"
            >
              <NIcon name="i-ph-pencil" class="w-3 h-3 mr-1" />
              Edit
            </NButton>
            <NButton
              size="xs"
              btn="ghost"
              @click="viewReference(reference)"
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
      <div class="group references-table-container flex-1 overflow-auto">
        <NTable
          :columns="tableColumns"
          :data="filteredReferences"
          :loading="loading"
          manual-pagination
          empty-text="No references found"
          empty-icon="i-ph-book"
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
          
          <!-- Reference Column -->
          <template #reference-header>
            <div class="flex items-center gap-4">
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">References</h4>
              <div class="w-102">
                <NInput
                  v-model="searchQuery"
                  placeholder="Search references by title, description, or genre..."
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
          <template #reference-cell="{ cell }">
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <img
                  v-if="cell.row.original.image_url"
                  :src="cell.row.original.image_url"
                  :alt="cell.row.original.name"
                  class="w-8 h-10 rounded object-cover"
                />
                <div
                  v-else
                  class="w-8 h-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                >
                  <NIcon :name="getTypeIcon(cell.row.original.primary_type)" class="w-4 h-4 text-gray-500" />
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
                    @click="goToReferenceEnrichmentQueue(cell.row.original)"
                  />
                </div>
                <p v-if="cell.row.original.secondary_type" class="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {{ cell.row.original.secondary_type }}
                </p>
                <p v-if="hasPendingEnrichment(cell.row.original)" class="text-xs font-medium text-amber-700 dark:text-amber-300 truncate">
                  {{ cell.row.original.enrichment_pending_count }} pending suggestion{{ cell.row.original.enrichment_pending_count !== 1 ? 's' : '' }}
                </p>
              </div>
            </div>
          </template>

          <!-- Type Column -->
          <template #type-header>
            <div>
              <NSelect
                v-model="selectedTypeFilter"
                :items="typeFilterOptions"
                placeholder="All Types"
                size="sm"
                item-key="label"
                value-key="label"
              />
            </div>
          </template>
          <template #type-cell="{ cell }">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 capitalize">
              {{ cell.row.original.primary_type.replace('_', ' ') }}
            </span>
          </template>

          <!-- Release Date Column -->
          <template #release_date-cell="{ cell }">
            <span v-if="cell.row.original.release_date" class="text-sm text-gray-900 dark:text-white">
              {{ formatYear(cell.row.original.release_date) }}
            </span>
            <span v-else class="text-sm text-gray-500 dark:text-gray-400">—</span>
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
                        {{ totalReferences }} Total References
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
            <NDropdownMenu :items="getReferenceActions(cell.row.original)">
              <NButton
                icon
                btn="ghost-gray"
                size="xs"
                label="i-ph-dots-three-vertical"
                class="hover:bg-gray-200 dark:hover:bg-gray-700/50"
              />
            </NDropdownMenu>
          </template>
        </NTable>
      </div>

      <div class="flex-shrink-0 flex items-center justify-between p-4">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Page {{ currentPage }} of {{ totalPages }} • {{ totalReferences }} total references
        </div>
        <NPagination
          v-model:page="currentPage"
          :total="totalReferences"
          :items-per-page="pageSize"
          :sibling-count="2"
          show-edges
          size="sm"
          pagination-selected="solid-indigo"
        />
      </div>
    </div>
  </div>

  <AddReferenceDialog
    v-model="showAddReferenceDialog"
    :edit-reference="convertToQuoteReference(selectedReference)"
    @reference-added="onReferenceAdded"
    @reference-updated="onReferenceUpdated"
  />
  
  <DeleteReferenceDialog
    v-model="showDeleteReferenceDialog"
    :reference="referenceToDelete"
    @reference-deleted="onReferenceDeleted"
  />

  <AdminReferenceEnrichmentDialog
    :open="showEnrichmentDialog"
    :loading="enrichmentLoading"
    :applying="enrichmentApplying"
    :reference="convertToQuoteReference(enrichmentReferenceTarget) || null"
    :preview="enrichmentPreview"
    :job-id="enrichmentJobId"
    :selected-fields="selectedEnrichmentFields"
    @update:open="handleEnrichmentDialogOpenChange"
    @refresh="enrichmentReferenceTarget && openEnrichmentPreview(enrichmentReferenceTarget)"
    @promote-candidate="enrichmentReferenceTarget && openEnrichmentPreview(enrichmentReferenceTarget, $event)"
    @toggle-field="toggleEnrichmentField"
    @select-recommended="selectRecommendedEnrichmentFields"
    @apply="applySelectedEnrichment"
  />

  <!-- Bulk Delete Confirmation -->
  <NDialog v-model:open="showBulkDeleteDialog">
    <NCard>
      <template #header>
        <h3 class="text-lg font-semibold">Delete {{ selectedIds.length }} {{ selectedIds.length === 1 ? 'Reference' : 'References' }}</h3>
      </template>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        You are about to delete {{ selectedIds.length }} {{ selectedIds.length === 1 ? 'reference' : 'references' }}. This will also remove their associations from related quotes.
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
import { formatRelativeTime, parseDateInput } from '~/utils/time-formatter'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({
  title: 'References - Admin - Verbatims'
})

const loading = ref(false)
const references = ref<QuoteReferenceWithMetadata[]>([])
const totalReferences = ref(0)
const currentPage = ref(1)
const pageSize = ref(50)
const searchQuery = ref('')
const selectedTypeFilter = ref({ label: 'All Types', value: '' })
const selectedSort = ref({ label: 'Name A-Z', value: 'name_asc' })
const isCardView = ref(false)
const showAddReferenceDialog = ref(false)
const selectedReference = ref<QuoteReferenceWithMetadata | undefined>()
const showDeleteReferenceDialog = ref(false)
const referenceToDelete = ref<QuoteReferenceWithMetadata | null>(null)
const showEnrichmentDialog = ref(false)
const enrichmentLoading = ref(false)
const enrichmentApplying = ref(false)
const enrichmentReferenceTarget = ref<QuoteReferenceWithMetadata | null>(null)
const enrichmentPreview = ref<any | null>(null)
const enrichmentJobId = ref<number | null>(null)
const selectedEnrichmentFields = ref<string[]>([])

// Bulk selection state
const selectionMode = ref(false)
const rowSelection = ref<Record<number, boolean>>({})
const lastSelectedIndex = ref<number | null>(null)
const bulkOpen = ref(false)
const bulkProcessing = ref(false)
const showBulkDeleteDialog = ref(false)
const selectedIds = computed<number[]>(() => Object.entries(rowSelection.value).filter(([, v]) => !!v).map(([k]) => Number(k)))
watch(selectedIds, (ids) => { bulkOpen.value = ids.length > 0 }, { immediate: true })
const visibleIds = computed<number[]>(() => filteredReferences.value.map(r => r.id))
const allSelectedOnPage = computed<boolean>(() => visibleIds.value.length > 0 && visibleIds.value.every(id => !!rowSelection.value[id]))

// computed helper for header checkbox (select all on current page)
const allSelected = computed<boolean | 'indeterminate'>({
  get: () => {
    const total = filteredReferences.value.length
    const count = selectedIds.value.length
    if (total === 0) return false
    if (count === total) return true
    if (count > 0) return 'indeterminate'
    return false
  },
  set: (v) => {
    const newSelection: Record<number, boolean> = {}
    if (v === true) {
      filteredReferences.value.forEach(r => { newSelection[r.id] = true })
    }
    rowSelection.value = newSelection
    lastSelectedIndex.value = null // reset range anchor when toggling all
  }
})

const toggleSelectionMode = () => { selectionMode.value = !selectionMode.value; if (!selectionMode.value) rowSelection.value = {}; lastSelectedIndex.value = null }
const setRowSelected = (id: number, value: boolean) => { rowSelection.value[id] = value === true }

// toggles the header checkbox state (select/deselect all on current page)
const toggleAllSelection = (v: boolean | 'indeterminate') => {
  if (v) {
    const newSelection: Record<number, boolean> = {}
    filteredReferences.value.forEach(r => { newSelection[r.id] = true })
    rowSelection.value = newSelection
  } else {
    rowSelection.value = {}
  }
  lastSelectedIndex.value = null
}

const selectAllOnPage = () => { if (allSelectedOnPage.value) rowSelection.value = {}; else visibleIds.value.forEach(id => (rowSelection.value[id] = true)) }
const clearSelection = () => { rowSelection.value = {}; selectionMode.value = false; lastSelectedIndex.value = null }

// handle shift‑click range selection on the table rows
const handleRowCheckboxClick = (event: MouseEvent, index: number, id: number) => {
  const currently = !!rowSelection.value[id]
  const newVal = !currently

  if (event.shiftKey && lastSelectedIndex.value !== null) {
    const start = Math.min(lastSelectedIndex.value, index)
    const end = Math.max(lastSelectedIndex.value, index)
    for (let i = start; i <= end; i += 1) {
      const row = filteredReferences.value[i]
      if (row) rowSelection.value[row.id] = newVal
    }
  } else {
    rowSelection.value[id] = newVal
  }

  lastSelectedIndex.value = index
}

const typeFilterOptions = [
  { label: 'All Types', value: '' },
  { label: 'Books', value: 'book' },
  { label: 'Films', value: 'film' },
  { label: 'TV Series', value: 'tv_series' },
  { label: 'Music', value: 'music' },
  { label: 'Speeches', value: 'speech' },
  { label: 'Podcasts', value: 'podcast' },
  { label: 'Interviews', value: 'interview' },
  { label: 'Documentaries', value: 'documentary' },
  { label: 'Media Streams', value: 'media_stream' },
  { label: 'Writings', value: 'writings' },
  { label: 'Video Games', value: 'video_game' },
  { label: 'Other', value: 'other' }
]

const sortOptions = [
  { label: 'Name A-Z', value: 'name_asc' },
  { label: 'Name Z-A', value: 'name_desc' },
  { label: 'Most Recent', value: 'created_desc' },
  { label: 'Oldest First', value: 'created_asc' },
  { label: 'Release Date (Newest)', value: 'release_date_desc' },
  { label: 'Release Date (Oldest)', value: 'release_date_asc' },
  { label: 'Most Quotes', value: 'quotes_desc' },
  { label: 'Most Liked', value: 'likes_desc' }
]

// header dropdown actions (depends on selection state)
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
    label: 'Add New Reference',
    leading: 'i-ph-plus',
    onclick: () => { showAddReferenceDialog.value = true }
  })
  actions.push({})
  actions.push({
    label: 'Refresh',
    leading: 'i-ph-arrows-clockwise',
    onclick: () => loadReferences()
  })
  actions.push({
    label: 'Reset Filters',
    leading: 'i-ph-x',
    onclick: () => resetFilters()
  })
  return actions
})

const totalPages = computed(() => Math.ceil(totalReferences.value / pageSize.value))

const totalFilmsAndTV = computed(() => {
  return references.value.filter(ref => ['film', 'tv_series', 'documentary'].includes(ref.primary_type)).length
})

const totalBooks = computed(() => {
  return references.value.filter(ref => ref.primary_type === 'book').length
})

const totalQuotes = computed(() => {
  return references.value.reduce((sum, reference) => sum + ((reference as any).quotes_count || 0), 0)
})

const filteredReferences = computed(() => references.value)

const tableColumns = [
  { header: '', accessorKey: 'select', enableSorting: false, meta: { una: { tableHead: 'w-6', tableCell: 'w-6' } } },
  {
    header: 'Reference',
    accessorKey: 'reference',
    enableSorting: false,
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
        tableHead: 'w-32',
        tableCell: 'w-32'
      }
    }
  },
  {
    header: 'Release',
    accessorKey: 'release_date',
    enableSorting: false,
    meta: {
      una: {
        tableHead: 'w-20',
        tableCell: 'w-20'
      }
    }
  },
  {
    header: 'Quotes',
    accessorKey: 'quotes',
    enableSorting: false,
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

  {
    header: '',
    accessorKey: 'actions',
    enableSorting: false,
    meta: {
      una: {
        tableHead: 'w-16',
        tableCell: 'w-16'
      }
    }
  },
]

const getTypeIcon = (type: QuoteReferencePrimaryType) => {
  const iconMap = {
    book: 'i-ph-book',
    film: 'i-ph-film-strip',
    tv_series: 'i-ph-television',
    music: 'i-ph-music-note',
    speech: 'i-ph-microphone',
    podcast: 'i-ph-microphone-stage',
    interview: 'i-ph-chat-circle',
    documentary: 'i-ph-video-camera',
    media_stream: 'i-ph-play-circle',
    writings: 'i-ph-article',
    video_game: 'i-ph-game-controller',
    other: 'i-ph-file'
  }
  return iconMap[type] || 'i-ph-file'
}

const loadReferences = async () => {
  try {
    loading.value = true

    // Parse sort option - handle compound sort keys like 'release_date_desc'
    const sortValue = selectedSort.value.value
    const lastUnderscoreIndex = sortValue.lastIndexOf('_')
    const sortBy = sortValue.substring(0, lastUnderscoreIndex)
    const sortOrder = sortValue.substring(lastUnderscoreIndex + 1)

    const response = await $fetch('/api/admin/references', {
      query: {
        page: currentPage.value,
        limit: pageSize.value,
        search: searchQuery.value || undefined,
        primary_type: selectedTypeFilter.value.value || undefined,
        sort_by: sortBy,
        sort_order: sortOrder.toUpperCase()
      }
    })

    references.value = response.data || []
    totalReferences.value = response.pagination?.total || 0
    // clear selection when data refreshes
    rowSelection.value = {}
    lastSelectedIndex.value = null
  } catch (error) {
    console.error('Failed to load references:', error)
    useToast().toast({
      title: 'Error',
      description: 'Failed to load references',
      toast: 'error'
    })
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedTypeFilter.value = typeFilterOptions[0]
  selectedSort.value = sortOptions[0]
  currentPage.value = 1
  // clear multi-select when filters change
  rowSelection.value = {}
  lastSelectedIndex.value = null
}

const getReferenceActions = (reference: QuoteReferenceWithMetadata) => [
  {
    label: 'View Public Page',
    leading: 'i-ph-eye',
    onclick: () => viewReference(reference)
  },
  {
    label: 'Preview enrichment',
    leading: 'i-ph-magic-wand',
    onclick: () => openEnrichmentPreview(reference)
  },
  ...(hasPendingEnrichment(reference)
    ? [{
        label: 'Open enrichment queue',
        leading: 'i-ph-bell-ringing',
        onclick: () => goToReferenceEnrichmentQueue(reference)
      }]
    : []),
  {
    label: 'Edit Reference',
    leading: 'i-ph-pencil',
    onclick: () => editReference(reference)
  },
  {},
  {
    label: 'Delete Reference',
    leading: 'i-ph-trash',
    onclick: () => deleteReference(reference)
  }
]

const viewReference = (reference: QuoteReferenceWithMetadata) => {
  navigateTo(`/references/${reference.id}`)
}

const hasPendingEnrichment = (reference: QuoteReferenceWithMetadata) => Number(reference.enrichment_pending_count || 0) > 0

const goToReferenceEnrichmentQueue = (reference: QuoteReferenceWithMetadata) => {
  navigateTo({
    path: '/admin/enrichment',
    query: {
      entityType: 'reference',
      entityId: String(reference.id),
      status: 'completed',
    }
  })
}

const editReference = (reference: QuoteReferenceWithMetadata) => {
  selectedReference.value = reference
  showAddReferenceDialog.value = true
}

const deleteReference = async (reference: QuoteReferenceWithMetadata) => {
  referenceToDelete.value = reference
  showDeleteReferenceDialog.value = true
}

const openEnrichmentPreview = async (reference: QuoteReferenceWithMetadata, preferredExternalId?: string) => {
  enrichmentReferenceTarget.value = reference
  enrichmentLoading.value = true
  showEnrichmentDialog.value = true

  try {
    const previewUrl = `/api/admin/enrichment/references/${reference.id}/preview` as string
    const response = await ($fetch as any)(previewUrl, {
      method: 'POST',
      body: preferredExternalId ? { preferredExternalId } : undefined,
    }) as { data?: { job?: any, preview?: any } }

    enrichmentPreview.value = response.data?.preview || null
    enrichmentJobId.value = response.data?.job?.id || null
    selectedEnrichmentFields.value = enrichmentPreview.value?.proposals
      ?.filter((proposal: any) => proposal.recommended)
      ?.map((proposal: any) => proposal.field) || []

    if (!enrichmentPreview.value) {
      useToast().toast({
        title: 'No preview available',
        description: 'This reference could not be enriched automatically right now.',
        toast: 'warning'
      })
    }
  } catch (error: any) {
    console.error('Failed to build enrichment preview:', error)
    useToast().toast({
      title: 'Enrichment preview failed',
      description: error?.data?.statusMessage || error?.message || 'Could not build the reference preview.',
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
  enrichmentReferenceTarget.value = null
}

const handleEnrichmentDialogOpenChange = (open: boolean) => {
  if (!open) {
    closeEnrichmentDialog()
    return
  }

  showEnrichmentDialog.value = true
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
      description: `${selectedEnrichmentFields.value.length} field(s) were updated on the reference record.`,
      toast: 'success'
    })

    closeEnrichmentDialog()
    loadReferences()
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

const onReferenceAdded = () => {
  showAddReferenceDialog.value = false
  selectedReference.value = undefined
  loadReferences()
}

const onReferenceUpdated = () => {
  showAddReferenceDialog.value = false
  selectedReference.value = undefined
  loadReferences()
}

const onReferenceDeleted = () => {
  showDeleteReferenceDialog.value = false
  referenceToDelete.value = null
  if (references.value.length <= 1 && currentPage.value > 1) {
    currentPage.value = currentPage.value - 1
  }
  loadReferences()
}

const confirmBulkDelete = async () => {
  if (selectedIds.value.length === 0) return
  bulkProcessing.value = true
  try {
    const ids = [...selectedIds.value]
    const results = await Promise.allSettled(
      ids.map(id => $fetch(`/api/admin/references/${id}`, { method: 'DELETE' }))
    )
    const failed = results.filter(r => r.status === 'rejected').length
    const succeeded = results.length - failed
    useToast().toast({ toast: failed ? 'warning' : 'success', title: `Deleted ${succeeded} reference${succeeded !== 1 ? 's' : ''}`, description: failed ? `${failed} failed` : undefined })
  } catch (e) {
    useToast().toast({ toast: 'error', title: 'Bulk delete failed' })
  } finally {
    bulkProcessing.value = false
    showBulkDeleteDialog.value = false
    rowSelection.value = {}
    selectionMode.value = false
    loadReferences()
  }
}

// Utility function to convert QuoteReferenceWithMetadata to QuoteReference
const convertToQuoteReference = (ref: QuoteReferenceWithMetadata | null | undefined): QuoteReference | undefined => {
  if (!ref) return undefined
  
  // Extract only the properties that belong to QuoteReference
  const { quotes_count, is_liked, ...quoteReference } = ref;
  
  return {
    ...quoteReference,
    urls: JSON.stringify(quoteReference.urls)
  }
}

const formatYear = (dateString: string | null | undefined) => {
  const date = parseDateInput(dateString)
  if (!date) return '—'
  return String(date.getFullYear())
}

watchDebounced([currentPage, searchQuery, selectedTypeFilter, selectedSort], () => {
  loadReferences()
}, { debounce: 300 })

onMounted(() => {
  loadReferences()
})
</script>

<style scoped>
.references-table-container {
  max-height: calc(100vh - 13rem);
}
</style>
