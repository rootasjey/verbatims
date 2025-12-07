<template>
  <div class="frame flex flex-col h-full">
    <div class="flex-shrink-0 bg-gray-50 dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-700 pb-6 mb-6">

      <!-- Search and Filters -->
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
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
        <div class="flex gap-2">
          <NSelect
            v-model="selectedTypeFilter"
            :items="typeFilterOptions"
            placeholder="All Types"
            size="sm"
            class="w-40"
            item-key="label"
            value-key="label"
          />
          <NSelect
            v-model="selectedSort"
            :items="sortOptions"
            placeholder="Sort by"
            size="sm"
            class="w-40"
            item-key="label"
            value-key="label"
          />
          <NButton
            btn="soft-blue"
            @click="showAddReferenceDialog = true"
            size="sm"
          >
            <NIcon name="i-ph-plus" class="w-4 h-4 mr-2" />
            Create Reference
          </NButton>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <NIcon name="i-ph-book" class="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total References</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ totalReferences }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <NIcon name="i-ph-film-strip" class="w-5 h-5 text-purple-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Films & TV</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ totalFilmsAndTV }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <NIcon name="i-ph-book-open" class="w-5 h-5 text-green-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Books</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ totalBooks }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <NIcon name="i-ph-quotes" class="w-5 h-5 text-orange-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Quotes</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ totalQuotes }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- View Toggle -->
      <div class="flex items-center justify-between mt-6">
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
              <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ reference.name }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {{ reference.primary_type.replace('_', ' ') }}
              </p>
              <p v-if="reference.secondary_type" class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ reference.secondary_type }}
              </p>
              <div class="flex items-center space-x-2 mt-1">
                <span v-if="reference.release_date" class="text-xs text-gray-500 dark:text-gray-400">
                  {{ new Date(reference.release_date).getFullYear() }}
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

      <!-- Scrollable Table Container -->
      <div class="references-table-container flex-1 overflow-auto">
        <NTable
          :columns="tableColumns"
          :data="filteredReferences"
          :loading="loading"
          manual-pagination
          empty-text="No references found"
          empty-icon="i-ph-book"
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
          <!-- Actions Column -->
          <template #actions-cell="{ cell }">
            <template v-if="!selectionMode">
              <NDropdownMenu :items="getReferenceActions(cell.row.original)">
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
                <NCheckbox :model-value="!!rowSelection[cell.row.original.id]" @update:model-value="v => setRowSelected(cell.row.original.id, !!v)" />
              </div>
            </template>
          </template>

          <!-- Reference Column -->
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
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ cell.row.original.name }}
                </p>
                <p v-if="cell.row.original.secondary_type" class="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {{ cell.row.original.secondary_type }}
                </p>
              </div>
            </div>
          </template>

          <!-- Type Column -->
          <template #type-cell="{ cell }">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 capitalize">
              {{ cell.row.original.primary_type.replace('_', ' ') }}
            </span>
          </template>

          <!-- Release Date Column -->
          <template #release_date-cell="{ cell }">
            <span v-if="cell.row.original.release_date" class="text-sm text-gray-900 dark:text-white">
              {{ new Date(cell.row.original.release_date).getFullYear() }}
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
</template><template #actions-header>
            <div class="flex items-center justify-center">
              <NTooltip :text="selectionMode ? 'Deactivate selection' : 'Activate selection'">
                <NButton icon btn="ghost-gray" size="2xs" :label="selectionMode ? 'i-ph-x' : 'i-solar-check-square-linear'" @click="toggleSelectionMode" />
              </NTooltip>
              <NTooltip class="ml-2" text="Select all on page">
                <NCheckbox :model-value="allSelectedOnPage" @update:model-value="selectAllOnPage" />
              </NTooltip>
            </div>
          </template>
          <!-- Actions Column -->
          <template #actions-cell="{ cell }">
            <template v-if="!selectionMode">
              <NDropdownMenu :items="getReferenceActions(cell.row.original)">
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
                <NCheckbox :model-value="!!rowSelection[cell.row.original.id]" @update:model-value="v => setRowSelected(cell.row.original.id, !!v)" />
              </div>
            </template>
          </template><template v-if="!selectionMode">
              <NDropdownMenu :items="getReferenceActions(cell.row.original)">
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
                <NCheckbox :model-value="!!rowSelection[cell.row.original.id]" @update:model-value="v => setRowSelected(cell.row.original.id, !!v)" />
              </div>
            </template>
          </template>

          <!-- Reference Column -->
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
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ cell.row.original.name }}
                </p>
                <p v-if="cell.row.original.secondary_type" class="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {{ cell.row.original.secondary_type }}
                </p>
              </div>
            </div>
          </template>

          <!-- Type Column -->
          <template #type-cell="{ cell }">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 capitalize">
              {{ cell.row.original.primary_type.replace('_', ' ') }}
            </span>
          </template>

          <!-- Release Date Column -->
          <template #release_date-cell="{ cell }">
            <span v-if="cell.row.original.release_date" class="text-sm text-gray-900 dark:text-white">
              {{ new Date(cell.row.original.release_date).getFullYear() }}
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
import type { QuoteReference, QuoteReferenceWithMetadata, QuoteReferencePrimaryType } from '~/types/quote-reference'

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

// Bulk selection state
const selectionMode = ref(false)
const rowSelection = ref<Record<number, boolean>>({})
const bulkOpen = ref(false)
const bulkProcessing = ref(false)
const showBulkDeleteDialog = ref(false)
const selectedIds = computed<number[]>(() => Object.entries(rowSelection.value).filter(([, v]) => !!v).map(([k]) => Number(k)))
watch(selectedIds, (ids) => { bulkOpen.value = ids.length > 0 }, { immediate: true })
const visibleIds = computed<number[]>(() => filteredReferences.value.map(r => r.id))
const allSelectedOnPage = computed<boolean>(() => visibleIds.value.length > 0 && visibleIds.value.every(id => !!rowSelection.value[id]))
const toggleSelectionMode = () => { selectionMode.value = !selectionMode.value; if (!selectionMode.value) rowSelection.value = {} }
const setRowSelected = (id: number, value: boolean) => { rowSelection.value[id] = value === true }
const selectAllOnPage = () => { if (allSelectedOnPage.value) rowSelection.value = {}; else visibleIds.value.forEach(id => (rowSelection.value[id] = true)) }
const clearSelection = () => { rowSelection.value = {}; selectionMode.value = false }

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
  }
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
}

const getReferenceActions = (reference: QuoteReferenceWithMetadata) => [
  {
    label: 'View Public Page',
    leading: 'i-ph-eye',
    onclick: () => viewReference(reference)
  },
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

const editReference = (reference: QuoteReferenceWithMetadata) => {
  selectedReference.value = reference
  showAddReferenceDialog.value = true
}

const deleteReference = async (reference: QuoteReferenceWithMetadata) => {
  referenceToDelete.value = reference
  showDeleteReferenceDialog.value = true
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
const convertToQuoteReference = (ref: QuoteReferenceWithMetadata | undefined): QuoteReference | undefined => {
  if (!ref) return undefined
  
  // Extract only the properties that belong to QuoteReference
  const { quotes_count, is_liked, ...quoteReference } = ref;
  
  return {
    ...quoteReference,
    urls: JSON.stringify(quoteReference.urls)
  }
}

// Utility function for relative time formatting
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`

  return date.toLocaleDateString()
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
  max-height: calc(100vh - 20rem);
}
</style>
