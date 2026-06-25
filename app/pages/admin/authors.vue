<template>
  <div>
    <!-- Editorial Header -->
    <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
            Authors
          </h1>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ totalAuthors }} {{ totalAuthors === 1 ? 'author' : 'authors' }}
          </p>
        </div>
        <div class="hidden md:flex items-center gap-3">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search authors..."
            class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none w-48"
          />
          <select
            v-model="selectedFictionalFilter"
            class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            <option v-for="opt in fictionalFilterOptions" :key="opt.value" :value="opt">{{ opt.label }}</option>
          </select>
          <select
            v-model="selectedSort"
            class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            <option v-for="opt in sortOptions" :key="opt.value" :value="opt">{{ opt.label }}</option>
          </select>
          <div class="flex items-center gap-1 border-l border-dashed border-gray-200 dark:border-gray-700 pl-3">
            <button
              :class="['font-sans text-xs px-2 py-1 transition-colors rounded-sm', !isCardView ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300']"
              @click="isCardView = false"
            >Table</button>
            <button
              :class="['font-sans text-xs px-2 py-1 transition-colors rounded-sm', isCardView ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300']"
              @click="isCardView = true"
            >Cards</button>
          </div>
        </div>
      </div>
      <div class="md:hidden mt-4 flex gap-2">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search authors..."
          class="flex-1 font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400"
        />
        <div class="flex items-center gap-1">
          <button
            :class="['font-sans text-xs px-2 py-1 transition-colors', !isCardView ? 'text-gray-900 dark:text-gray-100 border-b border-dashed border-gray-900 dark:border-gray-100' : 'text-gray-400 dark:text-gray-500']"
            @click="isCardView = false"
          >Table</button>
          <button
            :class="['font-sans text-xs px-2 py-1 transition-colors', isCardView ? 'text-gray-900 dark:text-gray-100 border-b border-dashed border-gray-900 dark:border-gray-100' : 'text-gray-400 dark:text-gray-500']"
            @click="isCardView = true"
          >Cards</button>
        </div>
      </div>
    </div>

    <!-- Card View -->
    <div v-if="isCardView">
      <div v-if="filteredAuthors.length === 0" class="py-16 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-sm">
        <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">No authors found</p>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="author in filteredAuthors"
          :key="author.id"
          class="bg-white dark:bg-[#0C0A09] border border-dashed border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors rounded-sm"
        >
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0">
              <img v-if="author.image_url" :src="author.image_url" :alt="author.name" class="w-12 h-12 rounded-full object-cover grayscale hover:grayscale-0 transition-all duration-300" />
              <div v-else class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <NIcon name="i-ph-user" class="w-6 h-6 text-gray-500" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 min-w-0">
                <h3 class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100 truncate">{{ author.name }}</h3>
                <button
                  v-if="hasPendingEnrichment(author)"
                  type="button"
                  class="inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"
                  :title="`${author.enrichment_pending_count} pending enrichment suggestion(s)`"
                  @click="goToAuthorEnrichmentQueue(author)"
                />
              </div>
              <p v-if="author.job" class="font-sans text-xs text-gray-500 dark:text-gray-400 truncate">{{ author.job }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span v-if="author.is_fictional" class="font-sans text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5">Fictional</span>
                <span class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ author.quotes_count || 0 }} quotes</span>
              </div>
            </div>
          </div>
          <div class="mt-3 flex justify-end gap-2 border-t border-dashed border-gray-100 dark:border-gray-800 pt-3">
            <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" :disabled="enrichmentLoading && enrichmentAuthorTarget?.id === author.id" @click="openEnrichmentPreview(author)">Enrich</button>
            <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" @click="editAuthor(author)">Edit</button>
            <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" @click="viewAuthor(author)">View</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Table View -->
    <div v-else>
      <!-- Bulk action bar -->
      <div v-if="selectedIds.length > 0" class="flex items-center gap-3 mb-4 pb-3 border-b border-dashed border-gray-200 dark:border-gray-700">
        <span class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ selectedIds.length }} selected</span>
        <button v-if="selectedIds.length === 2" class="font-sans text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors" @click="mergeSelectedAuthors">Merge Selected</button>
        <button class="font-sans text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors" @click="showBulkDeleteDialog = true">Delete All</button>
        <button class="font-sans text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-auto" @click="clearSelection">Clear</button>
      </div>

      <div v-if="loading && !hasLoadedOnce" class="space-y-5">
        <div v-for="i in 5" :key="i" class="animate-pulse pb-5 border-b border-dashed border-gray-100 dark:border-gray-800">
          <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4 mb-2" />
          <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
        </div>
      </div>

      <div v-else-if="hasLoadedOnce && filteredAuthors.length === 0" class="py-16 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-sm">
        <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">No authors found</p>
      </div>

      <div v-else-if="hasLoadedOnce" class="border border-dashed border-gray-200 dark:border-gray-700 rounded-sm overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0C0A09]">
              <th class="w-10 px-3 py-3 text-left"><NCheckbox checkbox="gray" :model-value="allSelected" @update:model-value="toggleAllSelection" /></th>
              <th class="px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Author</th>
              <th class="w-24 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Type</th>
              <th class="w-20 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Quotes</th>
              <th class="w-28 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Created</th>
              <th class="w-10 px-3 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr
              v-for="(author, idx) in filteredAuthors"
              :key="author.id"
              :data-highlighted="idx === highlightedRowIndex ? 'true' : undefined"
              :class="['animate-fade-in-up transition-colors group', { 'bg-[#FAFAF9] dark:bg-[#1C1B1A]': idx === highlightedRowIndex }, { 'bg-indigo-50/50 dark:bg-indigo-950/30': !!rowSelection[author.id] }]"
              :style="{ animationDelay: `${idx * 0.03}s` }"
            >
              <td class="px-3 py-3">
                <div :class="[Object.keys(rowSelection).length > 0 ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity']">
                  <NCheckbox checkbox="gray" :model-value="!!rowSelection[author.id]" @click="handleRowCheckboxClick($event, idx, author.id)" />
                </div>
              </td>
              <td class="px-3 py-3">
                <div class="flex items-center gap-3">
                  <div class="flex-shrink-0">
                    <img v-if="author.image_url" :src="author.image_url" :alt="author.name" class="w-8 h-8 rounded-full object-cover" />
                    <div v-else class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><NIcon name="i-ph-user" class="w-4 h-4 text-gray-500" /></div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 min-w-0">
                      <p class="font-sans text-sm text-gray-900 dark:text-gray-100 truncate">{{ author.name }}</p>
                      <button v-if="hasPendingEnrichment(author)" type="button" class="inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" :title="`${author.enrichment_pending_count} pending enrichment suggestion(s)`" @click="goToAuthorEnrichmentQueue(author)" />
                    </div>
                    <p v-if="author.job" class="font-sans text-xs text-gray-500 dark:text-gray-400 truncate">{{ author.job }}</p>
                  </div>
                </div>
              </td>
              <td class="px-3 py-3">
                <span v-if="author.is_fictional" class="font-sans text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5">Fictional</span>
                <span v-else class="font-sans text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5">Real</span>
              </td>
              <td class="px-3 py-3 font-sans text-sm text-gray-900 dark:text-gray-100">{{ author.quotes_count || 0 }}</td>
              <td class="px-3 py-3 font-sans text-xs text-gray-500 dark:text-gray-400">{{ formatRelativeTime(author.created_at) }}</td>
              <td class="px-3 py-3">
                <NDropdownMenu :items="getAuthorActions(author)">
                  <button @click.stop class="p-1 rounded-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><NIcon name="i-ph-dots-three-vertical" class="w-4 h-4" /></button>
                </NDropdownMenu>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="hasLoadedOnce">
        <div v-if="totalPages > 1" class="flex items-center justify-between pt-4">
          <span class="font-sans text-xs text-gray-500 dark:text-gray-400">
            Page {{ currentPage }} of {{ totalPages }} &middot; {{ totalAuthors }} {{ totalAuthors === 1 ? 'author' : 'authors' }}
          </span>
          <div class="flex items-center gap-3">
            <OutlinedButton v-if="currentPage > 1" @click="currentPage = Math.max(1, currentPage - 1)">&larr; Previous</OutlinedButton>
            <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">This is the first page</span>
            <OutlinedButton v-if="currentPage < totalPages" @click="currentPage = Math.min(totalPages, currentPage + 1)">Next &rarr;</OutlinedButton>
            <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">This is the last page</span>
          </div>
        </div>
        <div v-else class="pt-4 text-center">
          <span class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">No more pages to show</span>
        </div>
      </div>
    </div>

    <AddAuthorDialog v-model="showAddAuthorDialog" :edit-author="selectedAuthor" @author-added="onAuthorAdded" @author-updated="onAuthorUpdated" />
    <DeleteAuthorDialog v-model="showDeleteAuthorDialog" :author="authorToDelete" @author-deleted="onAuthorDeleted" />
    <AdminEnrichmentConfigDialog :open="showEnrichmentConfigDialog" :loading="enrichmentConfigLoading" :saving="enrichmentConfigSaving" :updated-at="enrichmentConfigUpdatedAt" :form="enrichmentConfigForm" :sources="enrichmentConfigSources" @update:open="showEnrichmentConfigDialog = $event" @save="saveEnrichmentConfig" />
    <AdminAuthorEnrichmentDialog :open="showEnrichmentDialog" :loading="enrichmentLoading" :applying="enrichmentApplying" :author="enrichmentAuthorTarget" :preview="enrichmentPreview" :job-id="enrichmentJobId" :selected-fields="selectedEnrichmentFields" @update:open="handleEnrichmentDialogOpenChange" @refresh="enrichmentAuthorTarget && openEnrichmentPreview(enrichmentAuthorTarget)" @promote-candidate="enrichmentAuthorTarget && openEnrichmentPreview(enrichmentAuthorTarget, $event)" @toggle-field="toggleEnrichmentField" @select-recommended="selectRecommendedEnrichmentFields" @apply="applySelectedEnrichment" />

    <NDialog v-model:open="showBulkDeleteDialog">
      <template #header><h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">Delete {{ selectedIds.length }} {{ selectedIds.length === 1 ? 'Author' : 'Authors' }}</h3></template>
      <div class="space-y-3">
        <p class="font-sans text-sm text-gray-600 dark:text-gray-400">You are about to delete {{ selectedIds.length }} {{ selectedIds.length === 1 ? 'author' : 'authors' }}. If they have related quotes, choose a strategy:</p>
        <div class="space-y-2">
          <label class="flex items-center gap-2 font-sans text-sm text-gray-700 dark:text-gray-300">
            <input type="radio" v-model="bulkDeleteStrategy" value="anonymize" class="accent-gray-700 dark:accent-gray-300" />
            Anonymize related quotes (keep quotes, remove author link)
          </label>
          <label class="flex items-center gap-2 font-sans text-sm text-gray-700 dark:text-gray-300">
            <input type="radio" v-model="bulkDeleteStrategy" value="delete" class="accent-gray-700 dark:accent-gray-300" />
            Delete related quotes (remove quotes and the author)
          </label>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-3 py-1.5" @click="showBulkDeleteDialog = false">Cancel</button>
          <OutlinedButton variant="destructive" :loading="bulkProcessing" @click="confirmBulkDelete">Delete All</OutlinedButton>
        </div>
      </template>
    </NDialog>

    <MergeAuthorsDialog v-model="showMergeDialog" :source-author="authorToMerge" :initial-target-author="initialMergeTarget" @authors-merged="onAuthorsMerged" />
  </div>
</template>

<script setup lang="ts">
import { formatRelativeTime } from '~/utils/time-formatter'
import { useAdminKeyboardShortcuts } from '~/composables/useAdminKeyboardShortcuts'
import { useTableKeyboardNav } from '~/composables/useTableKeyboardNav'

const { showErrorToast } = useErrorToast()

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Authors - Admin - Verbatims' })

const loading = ref(false)
const hasLoadedOnce = ref(false)
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
const showMergeDialog = ref(false)
const authorToMerge = ref<Author | null>(null)
const initialMergeTarget = ref<Author | null>(null)
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
  scheduleEnabled: true, processEnabled: true, scheduleBatchSize: 25, processBatchSize: 3,
  authorStaleDays: 180, referenceStaleDays: 365, reviewGraceDays: 14,
  authorMatchMinScore: 60, referenceMatchMinScore: 58, ambiguousMatchGap: 5,
})

const rowSelection = ref<Record<number, boolean>>({})
const lastSelectedIndex = ref<number | null>(null)
const bulkProcessing = ref(false)
const showBulkDeleteDialog = ref(false)
const bulkDeleteStrategy = ref<'delete' | 'anonymize'>('anonymize')
const selectedIds = computed<number[]>(() => Object.entries(rowSelection.value).filter(([, v]) => !!v).map(([k]) => Number(k)))
watch(selectedIds, () => {}, { immediate: true })
const visibleIds = computed<number[]>(() => filteredAuthors.value.map(a => a.id))
const allSelectedOnPage = computed<boolean>(() => visibleIds.value.length > 0 && visibleIds.value.every(id => !!rowSelection.value[id]))

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
    if (v === true) filteredAuthors.value.forEach(a => { newSelection[a.id] = true })
    rowSelection.value = newSelection
    lastSelectedIndex.value = null
  }
})

const setRowSelected = (id: number, value: boolean) => { rowSelection.value[id] = value === true }
const toggleAllSelection = (v: boolean | 'indeterminate') => {
  if (v) { const newSel: Record<number, boolean> = {}; filteredAuthors.value.forEach(a => { newSel[a.id] = true }); rowSelection.value = newSel }
  else { rowSelection.value = {} }
  lastSelectedIndex.value = null
}
const selectAllOnPage = () => { if (allSelectedOnPage.value) rowSelection.value = {}; else visibleIds.value.forEach(id => (rowSelection.value[id] = true)) }
const clearSelection = () => { rowSelection.value = {}; lastSelectedIndex.value = null }

const isAnyDialogOpen = computed(() =>
  showAddAuthorDialog.value || showDeleteAuthorDialog.value || showEnrichmentDialog.value || showEnrichmentConfigDialog.value || showBulkDeleteDialog.value || showMergeDialog.value
)

const { highlightedRowIndex, clearHighlight } = useTableKeyboardNav({
  visibleRowCount: () => filteredAuthors.value.length,
  onSelectRow: (index: number) => {
    const author = filteredAuthors.value[index]
    if (author) { rowSelection.value[author.id] = !rowSelection.value[author.id]; lastSelectedIndex.value = null }
  },
  isDialogOpen: () => isAnyDialogOpen.value,
  isDropdownOpen: () => isCardView.value
})

const highlightedAuthor = computed<Author | null>(() => {
  if (highlightedRowIndex.value === null) return null
  return filteredAuthors.value[highlightedRowIndex.value] ?? null
})

useAdminKeyboardShortcuts({
  selectAllOnPage, clearSelection, hasSelection: () => selectedIds.value.length > 0,
  isDialogOpen: () => isAnyDialogOpen.value, isDropdownOpen: () => isCardView.value,
  onDelete: () => { showBulkDeleteDialog.value = true },
  onConfirmDialog: () => { if (showBulkDeleteDialog.value) confirmBulkDelete() },
  highlightedRowIndex: () => highlightedRowIndex.value,
  onSingleEdit: () => { if (highlightedAuthor.value) editAuthor(highlightedAuthor.value) },
  onSingleView: () => { if (highlightedAuthor.value) viewAuthor(highlightedAuthor.value) },
  onSingleDelete: () => { if (highlightedAuthor.value) deleteAuthor(highlightedAuthor.value) }
})

const handleRowCheckboxClick = (event: MouseEvent, index: number, id: number) => {
  const currently = !!rowSelection.value[id]
  const newVal = !currently
  if (event.shiftKey && lastSelectedIndex.value !== null) {
    const start = Math.min(lastSelectedIndex.value, index)
    const end = Math.max(lastSelectedIndex.value, index)
    for (let i = start; i <= end; i += 1) { const row = filteredAuthors.value[i]; if (row) rowSelection.value[row.id] = newVal }
  } else { rowSelection.value[id] = newVal }
  lastSelectedIndex.value = index
}

const fictionalFilterOptions = [
  { label: 'All Types', value: '' },
  { label: 'Real People', value: 'false' },
  { label: 'Fictional Characters', value: 'true' }
]

const sortOptions = [
  { label: 'Name A-Z', value: 'name_asc' }, { label: 'Name Z-A', value: 'name_desc' },
  { label: 'Most Recent', value: 'created_desc' }, { label: 'Oldest First', value: 'created_asc' },
  { label: 'Most Quotes', value: 'quotes_desc' }, { label: 'Most Liked', value: 'likes_desc' }
]

const totalPages = computed(() => Math.ceil(totalAuthors.value / pageSize.value))
const totalFictional = computed(() => authors.value.filter(author => author.is_fictional).length)
const totalQuotes = computed(() => authors.value.reduce((sum, author) => sum + ((author as any).quotes_count || 0), 0))
const filteredAuthors = computed(() => authors.value)

const loadAuthors = async () => {
  try {
    loading.value = true
    const sortValue = selectedSort.value.value
    const lastUnderscoreIndex = sortValue.lastIndexOf('_')
    const sortBy = sortValue.substring(0, lastUnderscoreIndex)
    const sortOrder = sortValue.substring(lastUnderscoreIndex + 1)
    const response = await $fetch('/api/admin/authors', {
      query: { page: currentPage.value, limit: pageSize.value, search: searchQuery.value || undefined, is_fictional: selectedFictionalFilter.value.value || undefined, sort_by: sortBy, sort_order: sortOrder.toUpperCase() }
    })
    authors.value = response.data || []
    totalAuthors.value = response.pagination?.total || 0
    rowSelection.value = {}; lastSelectedIndex.value = null; clearHighlight()
  } catch (error) { showErrorToast(error, 'Failed to load authors') }
  finally { loading.value = false; hasLoadedOnce.value = true }
}

const resetFilters = () => {
  searchQuery.value = ''; selectedFictionalFilter.value = fictionalFilterOptions[0]
  selectedSort.value = sortOptions[0]; currentPage.value = 1; rowSelection.value = {}; lastSelectedIndex.value = null
}

const getAuthorActions = (author: Author) => [
  { label: 'View Public Page', leading: 'i-ph-eye', onclick: () => viewAuthor(author) },
  { label: 'Edit Author', leading: 'i-ph-pencil', onclick: () => editAuthor(author) },
  { label: 'Preview enrichment', leading: 'i-ph-magic-wand', onclick: () => openEnrichmentPreview(author) },
  ...(hasPendingEnrichment(author) ? [{ label: 'Open enrichment queue', leading: 'i-ph-bell-ringing', onclick: () => goToAuthorEnrichmentQueue(author) }] : []),
  {}, { label: 'Merge into…', leading: 'i-ph-git-merge', onclick: () => mergeAuthor(author) },
  { label: 'Delete Author', leading: 'i-ph-trash', onclick: () => deleteAuthor(author) }
]

const viewAuthor = (author: Author) => navigateTo(`/authors/${author.id}`)
const hasPendingEnrichment = (author: Author) => Number(author.enrichment_pending_count || 0) > 0
const goToAuthorEnrichmentQueue = (author: Author) => navigateTo({ path: '/admin/enrichment', query: { entityType: 'author', entityId: String(author.id), status: 'completed' } })

const editAuthor = async (author: Author) => {
  selectedAuthor.value = author; showAddAuthorDialog.value = true
  try {
    const response = await $fetch<any>(`/api/admin/authors/${author.id}`)
    if (response.data) selectedAuthor.value = response.data
  } catch (error) { console.error('Failed to load full author details:', error) }
}

const deleteAuthor = async (author: Author) => { authorToDelete.value = author; showDeleteAuthorDialog.value = true }
const mergeAuthor = async (author: Author) => { authorToMerge.value = author; initialMergeTarget.value = null; showMergeDialog.value = true }
const mergeSelectedAuthors = () => {
  const ids = selectedIds.value
  if (ids.length !== 2) return
  const [first, second] = ids
  const a = filteredAuthors.value.find(a => a.id === first)
  const b = filteredAuthors.value.find(a => a.id === second)
  if (!a || !b) return
  authorToMerge.value = a
  initialMergeTarget.value = b
  showMergeDialog.value = true
}
const onAuthorsMerged = () => { showMergeDialog.value = false; authorToMerge.value = null; initialMergeTarget.value = null; loadAuthors() }

const openEnrichmentPreview = async (author: Author, preferredExternalId?: string) => {
  enrichmentAuthorTarget.value = author; enrichmentLoading.value = true; showEnrichmentDialog.value = true
  try {
    const previewUrl = `/api/admin/enrichment/authors/${author.id}/preview` as string
    const response = await ($fetch as any)(previewUrl, { method: 'POST', body: preferredExternalId ? { preferredExternalId } : undefined }) as { data?: { job?: any, preview?: any } }
    if (enrichmentAuthorTarget.value?.id !== author.id) return
    enrichmentPreview.value = response.data?.preview || null; enrichmentJobId.value = response.data?.job?.id || null
    selectedEnrichmentFields.value = enrichmentPreview.value?.proposals?.filter((p: any) => p.recommended)?.map((p: any) => p.field) || []
    if (!enrichmentPreview.value) useToast().toast({ title: 'No preview available', description: 'This author could not be enriched automatically right now.', toast: 'outline-warning' })
  } catch (error: any) {
    if (enrichmentAuthorTarget.value?.id !== author.id) return
    showErrorToast(error, 'Enrichment preview failed'); showEnrichmentDialog.value = false
  } finally { enrichmentLoading.value = false }
}

const toggleEnrichmentField = (field: string, value: boolean | 'indeterminate') => {
  if (value === true) { if (!selectedEnrichmentFields.value.includes(field)) selectedEnrichmentFields.value = [...selectedEnrichmentFields.value, field]; return }
  selectedEnrichmentFields.value = selectedEnrichmentFields.value.filter(item => item !== field)
}
const selectRecommendedEnrichmentFields = () => {
  selectedEnrichmentFields.value = enrichmentPreview.value?.proposals?.filter((p: any) => p.recommended)?.map((p: any) => p.field) || []
}
const closeEnrichmentDialog = () => { showEnrichmentDialog.value = false; enrichmentPreview.value = null; enrichmentJobId.value = null; selectedEnrichmentFields.value = []; enrichmentAuthorTarget.value = null }
const handleEnrichmentDialogOpenChange = (open: boolean) => { if (!open) { closeEnrichmentDialog(); return }; showEnrichmentDialog.value = true }

const openEnrichmentConfigDialog = async () => {
  enrichmentConfigLoading.value = true; showEnrichmentConfigDialog.value = true
  try {
    const configUrl = '/api/admin/enrichment/config' as string
    const response = await ($fetch as any)(configUrl) as { data?: { updatedAt: string | null; values: Record<string, string | number | boolean>; sources: Record<string, 'kv' | 'env' | 'default' | 'none'> } }
    enrichmentConfigUpdatedAt.value = response.data?.updatedAt || null; enrichmentConfigSources.value = response.data?.sources || {}
    enrichmentConfigForm.scheduleEnabled = Boolean(response.data?.values?.scheduleEnabled); enrichmentConfigForm.processEnabled = Boolean(response.data?.values?.processEnabled)
    enrichmentConfigForm.scheduleBatchSize = Number(response.data?.values?.scheduleBatchSize ?? 25); enrichmentConfigForm.processBatchSize = Number(response.data?.values?.processBatchSize ?? 3)
    enrichmentConfigForm.authorStaleDays = Number(response.data?.values?.authorStaleDays ?? 180); enrichmentConfigForm.referenceStaleDays = Number(response.data?.values?.referenceStaleDays ?? 365)
    enrichmentConfigForm.reviewGraceDays = Number(response.data?.values?.reviewGraceDays ?? 14); enrichmentConfigForm.authorMatchMinScore = Number(response.data?.values?.authorMatchMinScore ?? 60)
    enrichmentConfigForm.referenceMatchMinScore = Number(response.data?.values?.referenceMatchMinScore ?? 58); enrichmentConfigForm.ambiguousMatchGap = Number(response.data?.values?.ambiguousMatchGap ?? 5)
  } catch (error: any) { showErrorToast(error, 'Failed to load settings'); showEnrichmentConfigDialog.value = false }
  finally { enrichmentConfigLoading.value = false }
}

const saveEnrichmentConfig = async (form: typeof enrichmentConfigForm) => {
  enrichmentConfigSaving.value = true
  try {
    const configUrl = '/api/admin/enrichment/config' as string
    const response = await ($fetch as any)(configUrl, { method: 'POST', body: { scheduleEnabled: form.scheduleEnabled, processEnabled: form.processEnabled, scheduleBatchSize: Number(form.scheduleBatchSize), processBatchSize: Number(form.processBatchSize), authorStaleDays: Number(form.authorStaleDays), referenceStaleDays: Number(form.referenceStaleDays), reviewGraceDays: Number(form.reviewGraceDays), authorMatchMinScore: Number(form.authorMatchMinScore), referenceMatchMinScore: Number(form.referenceMatchMinScore), ambiguousMatchGap: Number(form.ambiguousMatchGap) } }) as { data?: { updatedAt: string | null; values: Record<string, string | number | boolean>; sources: Record<string, 'kv' | 'env' | 'default' | 'none'> } }
    enrichmentConfigUpdatedAt.value = response.data?.updatedAt || null; enrichmentConfigSources.value = response.data?.sources || {}
    useToast().toast({ title: 'Enrichment settings saved', description: 'KV overrides are now active for the enrichment scheduler and processor.', toast: 'soft-success' })
    showEnrichmentConfigDialog.value = false
  } catch (error: any) { showErrorToast(error, 'Save failed') }
  finally { enrichmentConfigSaving.value = false }
}

const applySelectedEnrichment = async () => {
  if (!enrichmentJobId.value || selectedEnrichmentFields.value.length === 0) return
  enrichmentApplying.value = true
  try {
    await $fetch(`/api/admin/enrichment/jobs/${enrichmentJobId.value}/apply`, { method: 'POST', body: { fields: selectedEnrichmentFields.value } })
    closeEnrichmentDialog(); loadAuthors()
  } catch (error: any) { showErrorToast(error, 'Apply failed') }
  finally { enrichmentApplying.value = false }
}

const onAuthorAdded = () => { showAddAuthorDialog.value = false; selectedAuthor.value = undefined; loadAuthors() }
const onAuthorUpdated = () => { showAddAuthorDialog.value = false; selectedAuthor.value = undefined; loadAuthors() }
const onAuthorDeleted = () => { showDeleteAuthorDialog.value = false; authorToDelete.value = null; if (authors.value.length <= 1 && currentPage.value > 1) currentPage.value = currentPage.value - 1; loadAuthors() }

watchDebounced([currentPage, searchQuery, selectedFictionalFilter, selectedSort], () => { loadAuthors() }, { debounce: 300 })
onMounted(() => { loadAuthors() })

const confirmBulkDelete = async () => {
  if (selectedIds.value.length === 0) return
  bulkProcessing.value = true
  try {
    const ids = [...selectedIds.value]
    const results = await Promise.allSettled(ids.map(id => $fetch(`/api/admin/authors/${id}`, { method: 'DELETE', body: { strategy: bulkDeleteStrategy.value } })))
    const failed = results.filter(r => r.status === 'rejected').length
    const succeeded = results.length - failed
    useToast().toast({ toast: failed ? 'outline-warning' : 'soft-success', title: `Deleted ${succeeded} author${succeeded !== 1 ? 's' : ''}`, description: failed ? `${failed} failed` : undefined })
  } catch (e) { showErrorToast(e, 'Bulk delete failed') }
  finally { bulkProcessing.value = false; showBulkDeleteDialog.value = false; rowSelection.value = {}; lastSelectedIndex.value = null; loadAuthors() }
}
</script>

<style scoped>
@keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in-up { animation: fade-in-up 0.5s ease-out both; }
</style>
