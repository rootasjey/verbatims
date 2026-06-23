<template>
  <div>
    <!-- Editorial Header -->
    <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
            References
          </h1>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ totalReferences }} {{ totalReferences === 1 ? 'reference' : 'references' }}
          </p>
        </div>
        <div class="hidden md:flex items-center gap-3">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search references..."
            class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none w-48"
          />
          <select
            v-model="selectedTypeFilter"
            class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            <option v-for="opt in typeFilterOptions" :key="opt.value" :value="opt">{{ opt.label }}</option>
          </select>
          <select
            v-model="selectedSort"
            class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            <option v-for="opt in sortOptions" :key="opt.value" :value="opt">{{ opt.label }}</option>
          </select>
          <div class="flex items-center gap-1 border-l border-dashed border-gray-200 dark:border-gray-700 pl-3">
            <button :class="['font-sans text-xs px-2 py-1 transition-colors rounded-sm', !isCardView ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300']" @click="isCardView = false">Table</button>
            <button :class="['font-sans text-xs px-2 py-1 transition-colors rounded-sm', isCardView ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300']" @click="isCardView = true">Cards</button>
          </div>
        </div>
      </div>
      <div class="md:hidden mt-4 flex gap-2">
        <input v-model="searchQuery" type="text" placeholder="Search references..." class="flex-1 font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400" />
        <div class="flex items-center gap-1">
          <button :class="['font-sans text-xs px-2 py-1 transition-colors', !isCardView ? 'text-gray-900 dark:text-gray-100 border-b border-dashed border-gray-900 dark:border-gray-100' : 'text-gray-400 dark:text-gray-500']" @click="isCardView = false">Table</button>
          <button :class="['font-sans text-xs px-2 py-1 transition-colors', isCardView ? 'text-gray-900 dark:text-gray-100 border-b border-dashed border-gray-900 dark:border-gray-100' : 'text-gray-400 dark:text-gray-500']" @click="isCardView = true">Cards</button>
        </div>
      </div>
    </div>

    <!-- Card View -->
    <div v-if="isCardView">
      <div v-if="filteredReferences.length === 0" class="py-16 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-sm">
        <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">No references found</p>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div v-for="reference in filteredReferences" :key="reference.id" class="bg-white dark:bg-[#0C0A09] border border-dashed border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors rounded-sm">
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0">
              <img v-if="reference.image_url" :src="reference.image_url" :alt="reference.name" class="w-12 h-16 object-cover grayscale hover:grayscale-0 transition-all duration-300" />
              <div v-else class="w-12 h-16 bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><NIcon :name="getTypeIcon(reference.primary_type)" class="w-6 h-6 text-gray-500" /></div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 min-w-0">
                <h3 class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100 truncate">{{ reference.name }}</h3>
                <button v-if="hasPendingEnrichment(reference)" type="button" class="inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" :title="`${reference.enrichment_pending_count} pending enrichment suggestion(s)`" @click="goToReferenceEnrichmentQueue(reference)" />
              </div>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400 capitalize mt-0.5">{{ reference.primary_type.replace('_', ' ') }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span v-if="reference.release_date" class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ formatYear(reference.release_date) }}</span>
                <span class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ reference.quotes_count || 0 }} quotes</span>
              </div>
            </div>
          </div>
          <div class="mt-3 flex justify-end gap-2 border-t border-dashed border-gray-100 dark:border-gray-800 pt-3">
            <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" :disabled="enrichmentLoading && enrichmentReferenceTarget?.id === reference.id" @click="openEnrichmentPreview(reference)">Enrich</button>
            <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" @click="editReference(reference)">Edit</button>
            <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" @click="viewReference(reference)">View</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Table View -->
    <div v-else>
      <div v-if="selectedIds.length > 0" class="flex items-center gap-3 mb-4 pb-3 border-b border-dashed border-gray-200 dark:border-gray-700">
        <span class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ selectedIds.length }} selected</span>
        <button v-if="selectedIds.length === 2" class="font-sans text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors" @click="mergeSelectedReferences">Merge Selected</button>
        <button class="font-sans text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors" @click="showBulkDeleteDialog = true">Delete All</button>
        <button class="font-sans text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-auto" @click="clearSelection">Clear</button>
      </div>

      <div v-if="loading && !hasLoadedOnce" class="space-y-5">
        <div v-for="i in 5" :key="i" class="animate-pulse pb-5 border-b border-dashed border-gray-100 dark:border-gray-800">
          <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4 mb-2" /><div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
        </div>
      </div>

      <div v-else-if="hasLoadedOnce && filteredReferences.length === 0" class="py-16 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-sm">
        <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">No references found</p>
      </div>

      <div v-else-if="hasLoadedOnce" class="border border-dashed border-gray-200 dark:border-gray-700 rounded-sm overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0C0A09]">
              <th class="w-10 px-3 py-3 text-left"><NCheckbox checkbox="gray" :model-value="allSelected" @update:model-value="toggleAllSelection" /></th>
              <th class="px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Reference</th>
              <th class="w-28 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Type</th>
              <th class="w-20 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Year</th>
              <th class="w-20 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Quotes</th>
              <th class="w-28 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Created</th>
              <th class="w-10 px-3 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="(ref, idx) in filteredReferences" :key="ref.id" :data-highlighted="idx === highlightedRowIndex ? 'true' : undefined" :class="['animate-fade-in-up transition-colors group', { 'bg-[#FAFAF9] dark:bg-[#1C1B1A]': idx === highlightedRowIndex }, { 'bg-indigo-50/50 dark:bg-indigo-950/30': !!rowSelection[ref.id] }]" :style="{ animationDelay: `${idx * 0.03}s` }">
              <td class="px-3 py-3">
                <div :class="[Object.keys(rowSelection).length > 0 ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity']">
                  <NCheckbox checkbox="gray" :model-value="!!rowSelection[ref.id]" @click="e => handleRowCheckboxClick(e, idx, ref.id)" />
                </div>
              </td>
              <td class="px-3 py-3">
                <div class="flex items-center gap-3">
                  <div class="flex-shrink-0">
                    <img v-if="ref.image_url" :src="ref.image_url" :alt="ref.name" class="w-8 h-10 object-cover" />
                    <div v-else class="w-8 h-10 bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><NIcon :name="getTypeIcon(ref.primary_type)" class="w-4 h-4 text-gray-500" /></div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 min-w-0">
                      <p class="font-sans text-sm text-gray-900 dark:text-gray-100 truncate">{{ ref.name }}</p>
                      <button v-if="hasPendingEnrichment(ref)" type="button" class="inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" :title="`${ref.enrichment_pending_count} pending enrichment suggestion(s)`" @click="goToReferenceEnrichmentQueue(ref)" />
                    </div>
                    <p v-if="ref.secondary_type" class="font-sans text-xs text-gray-500 dark:text-gray-400 truncate">{{ ref.secondary_type }}</p>
                  </div>
                </div>
              </td>
              <td class="px-3 py-3"><span class="font-sans text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 capitalize">{{ ref.primary_type.replace('_', ' ') }}</span></td>
              <td class="px-3 py-3 font-sans text-sm text-gray-900 dark:text-gray-100">{{ ref.release_date ? formatYear(ref.release_date) : '&mdash;' }}</td>
              <td class="px-3 py-3 font-sans text-sm text-gray-900 dark:text-gray-100">{{ ref.quotes_count || 0 }}</td>
              <td class="px-3 py-3 font-sans text-xs text-gray-500 dark:text-gray-400">{{ formatRelativeTime(ref.created_at) }}</td>
              <td class="px-3 py-3">
                <NDropdownMenu :items="getReferenceActions(ref)">
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
            Page {{ currentPage }} of {{ totalPages }} &middot; {{ totalReferences }} {{ totalReferences === 1 ? 'reference' : 'references' }}
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

    <AddReferenceDialog v-model="showAddReferenceDialog" :edit-reference="convertToQuoteReference(selectedReference)" @reference-added="onReferenceAdded" @reference-updated="onReferenceUpdated" />
    <DeleteReferenceDialog v-model="showDeleteReferenceDialog" :reference="referenceToDelete" @reference-deleted="onReferenceDeleted" />
    <AdminReferenceEnrichmentDialog :open="showEnrichmentDialog" :loading="enrichmentLoading" :applying="enrichmentApplying" :reference="convertToQuoteReference(enrichmentReferenceTarget) || null" :preview="enrichmentPreview" :job-id="enrichmentJobId" :selected-fields="selectedEnrichmentFields" @update:open="handleEnrichmentDialogOpenChange" @refresh="enrichmentReferenceTarget && openEnrichmentPreview(enrichmentReferenceTarget)" @promote-candidate="enrichmentReferenceTarget && openEnrichmentPreview(enrichmentReferenceTarget, $event)" @toggle-field="toggleEnrichmentField" @select-recommended="selectRecommendedEnrichmentFields" @apply="applySelectedEnrichment" />
    <AdminEnrichmentConfigDialog :open="showEnrichmentConfigDialog" :loading="enrichmentConfigLoading" :saving="enrichmentConfigSaving" :updated-at="enrichmentConfigUpdatedAt" :form="enrichmentConfigForm" :sources="enrichmentConfigSources" @update:open="showEnrichmentConfigDialog = $event" @save="saveEnrichmentConfig" />

    <NDialog v-model:open="showBulkDeleteDialog">
      <template #header><h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">Delete {{ selectedIds.length }} {{ selectedIds.length === 1 ? 'Reference' : 'References' }}</h3></template>
      <p class="font-sans text-sm text-gray-600 dark:text-gray-400 mb-4">You are about to delete {{ selectedIds.length }} {{ selectedIds.length === 1 ? 'reference' : 'references' }}. This will also remove their associations from related quotes.</p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-3 py-1.5" @click="showBulkDeleteDialog = false">Cancel</button>
          <OutlinedButton variant="destructive" :loading="bulkProcessing" @click="confirmBulkDelete">Delete All</OutlinedButton>
        </div>
      </template>
    </NDialog>

    <MergeReferencesDialog v-model="showMergeDialog" :source-reference="referenceToMerge" :initial-target-reference="initialMergeTarget" @references-merged="onReferencesMerged" />
  </div>
</template>

<script setup lang="ts">
import { formatRelativeTime, parseDateInput } from '~/utils/time-formatter'
import { useAdminKeyboardShortcuts } from '~/composables/useAdminKeyboardShortcuts'
import { useTableKeyboardNav } from '~/composables/useTableKeyboardNav'

const { showErrorToast } = useErrorToast()

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'References - Admin - Verbatims' })

const loading = ref(false)
const hasLoadedOnce = ref(false)
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
const showMergeDialog = ref(false)
const referenceToMerge = ref<QuoteReferenceWithMetadata | null>(null)
const initialMergeTarget = ref<QuoteReferenceWithMetadata | null>(null)
const showEnrichmentDialog = ref(false)
const enrichmentLoading = ref(false)
const enrichmentApplying = ref(false)
const enrichmentReferenceTarget = ref<QuoteReferenceWithMetadata | null>(null)
const enrichmentPreview = ref<any | null>(null)
const enrichmentJobId = ref<number | null>(null)
const selectedEnrichmentFields = ref<string[]>([])
const showEnrichmentConfigDialog = ref(false)
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
const selectedIds = computed<number[]>(() => Object.entries(rowSelection.value).filter(([, v]) => !!v).map(([k]) => Number(k)))
watch(selectedIds, () => {}, { immediate: true })
const visibleIds = computed<number[]>(() => filteredReferences.value.map(r => r.id))
const allSelectedOnPage = computed<boolean>(() => visibleIds.value.length > 0 && visibleIds.value.every(id => !!rowSelection.value[id]))

const allSelected = computed<boolean | 'indeterminate'>({
  get: () => { const total = filteredReferences.value.length; const count = selectedIds.value.length; if (total === 0) return false; if (count === total) return true; if (count > 0) return 'indeterminate'; return false },
  set: (v) => { const newSel: Record<number, boolean> = {}; if (v === true) filteredReferences.value.forEach(r => { newSel[r.id] = true }); rowSelection.value = newSel; lastSelectedIndex.value = null }
})

const toggleAllSelection = (v: boolean | 'indeterminate') => {
  if (v) { const newSel: Record<number, boolean> = {}; filteredReferences.value.forEach(r => { newSel[r.id] = true }); rowSelection.value = newSel }
  else { rowSelection.value = {} }
  lastSelectedIndex.value = null
}
const selectAllOnPage = () => { if (allSelectedOnPage.value) rowSelection.value = {}; else visibleIds.value.forEach(id => (rowSelection.value[id] = true)) }
const clearSelection = () => { rowSelection.value = {}; lastSelectedIndex.value = null }

const isAnyDialogOpen = computed(() => showAddReferenceDialog.value || showDeleteReferenceDialog.value || showEnrichmentDialog.value || showEnrichmentConfigDialog.value || showBulkDeleteDialog.value || showMergeDialog.value)

const { highlightedRowIndex, clearHighlight } = useTableKeyboardNav({
  visibleRowCount: () => filteredReferences.value.length,
  onSelectRow: (index: number) => { const ref = filteredReferences.value[index]; if (ref) { rowSelection.value[ref.id] = !rowSelection.value[ref.id]; lastSelectedIndex.value = null } },
  isDialogOpen: () => isAnyDialogOpen.value,
  isDropdownOpen: () => isCardView.value
})

const highlightedReference = computed<QuoteReferenceWithMetadata | null>(() => {
  if (highlightedRowIndex.value === null) return null
  return filteredReferences.value[highlightedRowIndex.value] ?? null
})

useAdminKeyboardShortcuts({
  selectAllOnPage, clearSelection, hasSelection: () => selectedIds.value.length > 0,
  isDialogOpen: () => isAnyDialogOpen.value, isDropdownOpen: () => isCardView.value,
  onDelete: () => { showBulkDeleteDialog.value = true },
  onConfirmDialog: () => { if (showBulkDeleteDialog.value) confirmBulkDelete() },
  highlightedRowIndex: () => highlightedRowIndex.value,
  onSingleEdit: () => { if (highlightedReference.value) editReference(highlightedReference.value) },
  onSingleView: () => { if (highlightedReference.value) viewReference(highlightedReference.value) },
  onSingleDelete: () => { if (highlightedReference.value) deleteReference(highlightedReference.value) }
})

const handleRowCheckboxClick = (event: MouseEvent, index: number, id: number) => {
  const currently = !!rowSelection.value[id]; const newVal = !currently
  if (event.shiftKey && lastSelectedIndex.value !== null) {
    const start = Math.min(lastSelectedIndex.value, index); const end = Math.max(lastSelectedIndex.value, index)
    for (let i = start; i <= end; i += 1) { const row = filteredReferences.value[i]; if (row) rowSelection.value[row.id] = newVal }
  } else { rowSelection.value[id] = newVal }
  lastSelectedIndex.value = index
}

const typeFilterOptions = [
  { label: 'All Types', value: '' }, { label: 'Books', value: 'book' }, { label: 'Films', value: 'film' }, { label: 'TV Series', value: 'tv_series' },
  { label: 'Music', value: 'music' }, { label: 'Speeches', value: 'speech' }, { label: 'Podcasts', value: 'podcast' },
  { label: 'Interviews', value: 'interview' }, { label: 'Documentaries', value: 'documentary' }, { label: 'Media Streams', value: 'media_stream' },
  { label: 'Writings', value: 'writings' }, { label: 'Video Games', value: 'video_game' }, { label: 'Other', value: 'other' }
]

const sortOptions = [
  { label: 'Name A-Z', value: 'name_asc' }, { label: 'Name Z-A', value: 'name_desc' },
  { label: 'Most Recent', value: 'created_desc' }, { label: 'Oldest First', value: 'created_asc' },
  { label: 'Release Date (Newest)', value: 'release_date_desc' }, { label: 'Release Date (Oldest)', value: 'release_date_asc' },
  { label: 'Most Quotes', value: 'quotes_desc' }, { label: 'Most Liked', value: 'likes_desc' }
]

const totalPages = computed(() => Math.ceil(totalReferences.value / pageSize.value))
const filteredReferences = computed(() => references.value)

const getTypeIcon = (type: QuoteReferencePrimaryType) => {
  const iconMap: Record<string, string> = { book: 'i-ph-book', film: 'i-ph-film-strip', tv_series: 'i-ph-television', music: 'i-ph-music-note', speech: 'i-ph-microphone', podcast: 'i-ph-microphone-stage', interview: 'i-ph-chat-circle', documentary: 'i-ph-video-camera', media_stream: 'i-ph-play-circle', writings: 'i-ph-article', video_game: 'i-ph-game-controller', other: 'i-ph-file' }
  return iconMap[type] || 'i-ph-file'
}

const loadReferences = async () => {
  try {
    loading.value = true
    const sortValue = selectedSort.value.value; const lastUnderscoreIndex = sortValue.lastIndexOf('_')
    const sortBy = sortValue.substring(0, lastUnderscoreIndex); const sortOrder = sortValue.substring(lastUnderscoreIndex + 1)
    const response = await $fetch('/api/admin/references', {
      query: { page: currentPage.value, limit: pageSize.value, search: searchQuery.value || undefined, primary_type: selectedTypeFilter.value.value || undefined, sort_by: sortBy, sort_order: sortOrder.toUpperCase() }
    })
    references.value = response.data || []; totalReferences.value = response.pagination?.total || 0
    rowSelection.value = {}; lastSelectedIndex.value = null; clearHighlight()
  } catch (error) { showErrorToast(error, 'Failed to load references') }
  finally { loading.value = false; hasLoadedOnce.value = true }
}

const resetFilters = () => {
  searchQuery.value = ''; selectedTypeFilter.value = typeFilterOptions[0]; selectedSort.value = sortOptions[0]
  currentPage.value = 1; rowSelection.value = {}; lastSelectedIndex.value = null
}

const getReferenceActions = (reference: QuoteReferenceWithMetadata) => [
  { label: 'View Public Page', leading: 'i-ph-eye', onclick: () => viewReference(reference) },
  { label: 'Preview enrichment', leading: 'i-ph-magic-wand', onclick: () => openEnrichmentPreview(reference) },
  ...(hasPendingEnrichment(reference) ? [{ label: 'Open enrichment queue', leading: 'i-ph-bell-ringing', onclick: () => goToReferenceEnrichmentQueue(reference) }] : []),
  { label: 'Edit Reference', leading: 'i-ph-pencil', onclick: () => editReference(reference) },
  {}, { label: 'Merge into…', leading: 'i-ph-git-merge', onclick: () => mergeReference(reference) },
  { label: 'Delete Reference', leading: 'i-ph-trash', onclick: () => deleteReference(reference) }
]

const viewReference = (reference: QuoteReferenceWithMetadata) => navigateTo(`/references/${reference.id}`)
const hasPendingEnrichment = (reference: QuoteReferenceWithMetadata) => Number(reference.enrichment_pending_count || 0) > 0
const goToReferenceEnrichmentQueue = (reference: QuoteReferenceWithMetadata) => navigateTo({ path: '/admin/enrichment', query: { entityType: 'reference', entityId: String(reference.id), status: 'completed' } })
const editReference = (reference: QuoteReferenceWithMetadata) => { selectedReference.value = reference; showAddReferenceDialog.value = true }
const deleteReference = async (reference: QuoteReferenceWithMetadata) => { referenceToDelete.value = reference; showDeleteReferenceDialog.value = true }
const mergeReference = async (reference: QuoteReferenceWithMetadata) => { referenceToMerge.value = reference; initialMergeTarget.value = null; showMergeDialog.value = true }
const mergeSelectedReferences = () => {
  const ids = selectedIds.value
  if (ids.length !== 2) return
  const [first, second] = ids
  const a = filteredReferences.value.find(r => r.id === first)
  const b = filteredReferences.value.find(r => r.id === second)
  if (!a || !b) return
  referenceToMerge.value = a
  initialMergeTarget.value = b
  showMergeDialog.value = true
}
const onReferencesMerged = () => { showMergeDialog.value = false; referenceToMerge.value = null; initialMergeTarget.value = null; loadReferences() }

const openEnrichmentPreview = async (reference: QuoteReferenceWithMetadata, preferredExternalId?: string) => {
  enrichmentReferenceTarget.value = reference; enrichmentLoading.value = true; showEnrichmentDialog.value = true
  try {
    const previewUrl = `/api/admin/enrichment/references/${reference.id}/preview` as string
    const response = await ($fetch as any)(previewUrl, { method: 'POST', body: preferredExternalId ? { preferredExternalId } : undefined }) as { data?: { job?: any, preview?: any } }
    enrichmentPreview.value = response.data?.preview || null; enrichmentJobId.value = response.data?.job?.id || null
    selectedEnrichmentFields.value = enrichmentPreview.value?.proposals?.filter((p: any) => p.recommended)?.map((p: any) => p.field) || []
    if (!enrichmentPreview.value) useToast().toast({ title: 'No preview available', description: 'This reference could not be enriched automatically right now.', toast: 'outline-warning' })
  } catch (error: any) { showErrorToast(error, 'Enrichment preview failed'); showEnrichmentDialog.value = false }
  finally { enrichmentLoading.value = false }
}

const toggleEnrichmentField = (field: string, value: boolean | 'indeterminate') => {
  if (value === true) { if (!selectedEnrichmentFields.value.includes(field)) selectedEnrichmentFields.value = [...selectedEnrichmentFields.value, field]; return }
  selectedEnrichmentFields.value = selectedEnrichmentFields.value.filter(item => item !== field)
}
const selectRecommendedEnrichmentFields = () => { selectedEnrichmentFields.value = enrichmentPreview.value?.proposals?.filter((p: any) => p.recommended)?.map((p: any) => p.field) || [] }
const closeEnrichmentDialog = () => { showEnrichmentDialog.value = false; enrichmentPreview.value = null; enrichmentJobId.value = null; selectedEnrichmentFields.value = []; enrichmentReferenceTarget.value = null }
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
    useToast().toast({ title: 'Enrichment settings saved', description: 'KV overrides are now active for the enrichment scheduler and processor.', toast: 'soft-success' }); showEnrichmentConfigDialog.value = false
  } catch (error: any) { showErrorToast(error, 'Save failed') }
  finally { enrichmentConfigSaving.value = false }
}

const applySelectedEnrichment = async () => {
  if (!enrichmentJobId.value || selectedEnrichmentFields.value.length === 0) return
  enrichmentApplying.value = true
  try { await $fetch(`/api/admin/enrichment/jobs/${enrichmentJobId.value}/apply`, { method: 'POST', body: { fields: selectedEnrichmentFields.value } }); closeEnrichmentDialog(); loadReferences() }
  catch (error: any) { showErrorToast(error, 'Apply failed') }
  finally { enrichmentApplying.value = false }
}

const onReferenceAdded = () => { showAddReferenceDialog.value = false; selectedReference.value = undefined; loadReferences() }
const onReferenceUpdated = () => { showAddReferenceDialog.value = false; selectedReference.value = undefined; loadReferences() }
const onReferenceDeleted = () => { showDeleteReferenceDialog.value = false; referenceToDelete.value = null; if (references.value.length <= 1 && currentPage.value > 1) currentPage.value = currentPage.value - 1; loadReferences() }

const convertToQuoteReference = (ref: QuoteReferenceWithMetadata | null | undefined): QuoteReference | undefined => {
  if (!ref) return undefined; const { quotes_count, is_liked, ...quoteReference } = ref; return { ...quoteReference, urls: JSON.stringify(quoteReference.urls) }
}

const formatYear = (dateString: string | null | undefined) => { const date = parseDateInput(dateString); if (!date) return '\u2014'; return String(date.getFullYear()) }

watchDebounced([currentPage, searchQuery, selectedTypeFilter, selectedSort], () => { loadReferences() }, { debounce: 300 })
onMounted(() => { loadReferences() })

const confirmBulkDelete = async () => {
  if (selectedIds.value.length === 0) return
  bulkProcessing.value = true
  try {
    const ids = [...selectedIds.value]
    const results = await Promise.allSettled(ids.map(id => $fetch(`/api/admin/references/${id}`, { method: 'DELETE' })))
    const failed = results.filter(r => r.status === 'rejected').length; const succeeded = results.length - failed
    useToast().toast({ toast: failed ? 'outline-warning' : 'soft-success', title: `Deleted ${succeeded} reference${succeeded !== 1 ? 's' : ''}`, description: failed ? `${failed} failed` : undefined })
  } catch (e) { showErrorToast(e, 'Bulk delete failed') }
  finally { bulkProcessing.value = false; showBulkDeleteDialog.value = false; rowSelection.value = {}; loadReferences() }
}
</script>

<style scoped>
@keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in-up { animation: fade-in-up 0.5s ease-out both; }
</style>
