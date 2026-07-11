<template>
  <div>
    <!-- Editorial Header -->
    <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
            {{ $t('title') }}
          </h1>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ totalTags }} {{ totalTags === 1 ? 'tag' : 'tags' }}
          </p>
        </div>
        <div class="hidden md:flex items-center gap-3">
          <input v-model="searchQuery" type="text" :placeholder="$t('search_placeholder') as string" class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none w-56" />
          <select v-model="selectedSort" class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 cursor-pointer">
            <option v-for="opt in sortOptions" :key="opt.value" :value="opt">{{ opt.label }}</option>
          </select>
          <OutlinedButton @click="showAddDialog = true">{{ $t('add_button') }}</OutlinedButton>
          <OutlinedButton @click="showBackfillDialog = true">{{ $t('backfill') }}</OutlinedButton>
        </div>
      </div>
      <div class="md:hidden mt-4">
        <input v-model="searchQuery" type="text" :placeholder="$t('search_placeholder_mobile') as string" class="w-full font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && tags.length === 0" class="space-y-5">
      <div v-for="i in 5" :key="i" class="animate-pulse pb-5 border-b border-dashed border-gray-100 dark:border-gray-800">
        <div class="h-4 bg-gray-100 dark:bg-gray-900 rounded w-3/4 mb-2" /><div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="tags.length === 0 && !loading" class="py-16 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-sm">
      <NIcon name="i-ph-hash" class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
      <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">{{ searchQuery ? $t('empty_search_title') : $t('empty_title') }}</p>
      <p class="font-sans text-sm text-gray-500 dark:text-gray-400">{{ searchQuery ? $t('empty_desc') : $t('empty_desc_default') }}</p>
    </div>

    <!-- Table -->
    <div v-else>
      <div v-if="selectedIds.length > 0" class="flex items-center gap-3 mb-4 pb-3 border-b border-dashed border-gray-200 dark:border-gray-700">
        <span class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ $t('common.selected_count', { count: selectedIds.length }) }}</span>
        <button class="font-sans text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors" @click="showBulkDeleteDialog = true">{{ $t('bulk_delete') }}</button>
        <button class="font-sans text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-auto" @click="clearSelection">{{ $t('common.clear') }}</button>
      </div>

      <div class="border border-dashed border-gray-200 dark:border-gray-700 rounded-sm overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0C0A09]">
              <th class="w-10 px-3 py-3 text-left"><NCheckbox checkbox="gray" :model-value="allSelected" @update:model-value="toggleAllSelection" /></th>
              <th class="px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_name') }}</th>
              <th class="w-40 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_category') }}</th>
              <th class="w-20 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_quotes') }}</th>
              <th class="w-28 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_created') }}</th>
              <th class="w-10 px-3 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="(tag, idx) in tags" :key="tag.id" :data-highlighted="idx === highlightedRowIndex ? 'true' : undefined" :class="['animate-fade-in-up transition-colors group', { 'bg-[#FAFAF9] dark:bg-[#1C1B1A]': idx === highlightedRowIndex }, { 'bg-indigo-50/50 dark:bg-indigo-950/30': !!rowSelection[tag.id] }]" :style="{ animationDelay: `${idx * 0.03}s` }">
              <td class="px-3 py-3">
                <div :class="[Object.keys(rowSelection).length > 0 ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity']">
                  <NCheckbox checkbox="gray" :model-value="!!rowSelection[tag.id]" @click="handleRowCheckboxClick($event, idx, tag.id)" />
                </div>
              </td>
              <td class="px-3 py-3">
                <div class="flex items-center gap-2 min-w-0">
                  <BlossomColorPicker :value="hexToBlossomValue(tag.color)" @change="(color) => updateTagColor(tag, color)" :colors="BLOSSOM_PALETTE" :show-alpha-slider="false" :core-size="18" :petal-size="18" class="relative top-0.6" />
                  <span class="group/tag relative inline-block px-2 overflow-hidden cursor-pointer shrink min-w-0 rounded-0" :style="{ '--hover-text': getContrastColor(tag.color) === 'white' ? '#FAFAF9' : '#0C0A09' }" @click="editTag(tag)">
                    <span class="tag-name relative z-1 truncate font-sans text-sm font-500 transition-colors duration-300">#{{ tag.name }}</span>
                    <span class="absolute inset-0 w-0 group-hover/tag:w-full transition-all duration-300 ease-out -z-0 rounded-0" :style="{ backgroundColor: tag.color }" />
                  </span>
                  <button class="font-sans text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-1 opacity-0 group-hover:opacity-100" @click.stop="navigateTo(`/tags/${encodeURIComponent(tag.name)}`)">{{ $t('action_view') }}</button>
                </div>
              </td>
              <td class="px-3 py-3 font-sans text-xs text-gray-600 dark:text-gray-400">{{ tag.category || '\u2014' }}</td>
              <td class="px-3 py-3 font-sans text-sm text-gray-900 dark:text-gray-100">{{ tag.quotes_count || 0 }}</td>
              <td class="px-3 py-3 font-sans text-xs text-gray-500 dark:text-gray-400">{{ formatRelativeTime(tag.created_at) }}</td>
              <td class="px-3 py-3">
                <NDropdownMenu :items="getTagActions(tag)">
                  <button @click.stop class="p-1 rounded-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><NIcon name="i-ph-dots-three-vertical" class="w-4 h-4" /></button>
                </NDropdownMenu>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="flex items-center justify-between pt-4">
        <span class="font-sans text-xs text-gray-500 dark:text-gray-400">
          {{ $t('common.page_of', { n: currentPage, m: totalPages }) }} &middot; {{ totalTags }} {{ totalTags === 1 ? 'tag' : 'tags' }}
        </span>
        <div class="flex items-center gap-3">
          <OutlinedButton v-if="currentPage > 1" @click="currentPage = Math.max(1, currentPage - 1)">&larr; {{ $t('common.previous') }}</OutlinedButton>
          <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">{{ $t('common.first_page') }}</span>
          <OutlinedButton v-if="currentPage < totalPages" @click="currentPage = Math.min(totalPages, currentPage + 1)">{{ $t('common.next') }} &rarr;</OutlinedButton>
          <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">{{ $t('common.last_page') }}</span>
        </div>
      </div>
      <div v-else class="pt-4 text-center">
        <span class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">{{ $t('common.no_more_pages') }}</span>
      </div>
    </div>

    <AddTagDialog v-model="showAddDialog" :edit-tag="selectedTag" @tag-added="reloadAfterModal" @tag-updated="reloadAfterModal" />
    <DeleteTagDialog v-model="showDeleteDialog" :tag="tagToDelete" @tag-deleted="reloadAfterDelete" />

    <NDialog v-model:open="showBackfillDialog">
      <template #header><h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">{{ $t('dialog_backfill_title') }}</h3></template>
      <div class="space-y-4">
        <p class="font-sans text-sm text-gray-600 dark:text-gray-400">{{ $t('dialog_backfill_desc') }}</p>
        <div>
          <label class="block font-sans text-sm text-gray-700 dark:text-gray-300 mb-1.5">{{ $t('dialog_backfill_status_scope') }}</label>
          <select v-model="backfillStatus" class="w-full font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 cursor-pointer focus:outline-none">
            <option v-for="opt in backfillStatusOptions" :key="opt.value" :value="opt">{{ opt.label }}</option>
          </select>
        </div>
        <label class="flex items-center gap-2 font-sans text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" v-model="backfillOnlyUntagged" class="accent-gray-700 dark:accent-gray-300" /> {{ $t('dialog_backfill_untagged') }}</label>
        <label class="flex items-center gap-2 font-sans text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" v-model="backfillDryRun" class="accent-gray-700 dark:accent-gray-300" /> {{ $t('dialog_backfill_dry_run') }}</label>
        <div class="flex items-center gap-3">
          <label class="font-sans text-sm text-gray-700 dark:text-gray-300">{{ $t('dialog_backfill_limit') }}</label>
          <input type="number" v-model.number="backfillLimit" :min="1" :max="5000" class="w-24 font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1 text-gray-900 dark:text-gray-100 focus:outline-none" />
          <label class="flex items-center gap-2 font-sans text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" v-model="backfillResetExisting" class="accent-gray-700 dark:accent-gray-300" /> {{ $t('dialog_backfill_reset') }}</label>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-3 py-1.5" :disabled="backfillProcessing" @click="showBackfillDialog = false">{{ $t('common.cancel') }}</button>
          <OutlinedButton :disabled="backfillProcessing" @click="triggerBackfill">{{ $t('dialog_backfill_run') }}</OutlinedButton>
        </div>
      </template>
    </NDialog>

    <NDialog v-model:open="showBulkDeleteDialog">
      <template #header><h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">{{ $t('dialog_delete_title', { n: selectedIds.length, count: selectedIds.length }) }}</h3></template>
      <p class="font-sans text-sm text-gray-600 dark:text-gray-400 mb-4">{{ $t('dialog_delete_body', { n: selectedIds.length, count: selectedIds.length }) }}</p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-3 py-1.5" @click="showBulkDeleteDialog = false">{{ $t('common.cancel') }}</button>
          <OutlinedButton variant="destructive" :loading="bulkProcessing" @click="confirmBulkDelete">{{ $t('bulk_delete') }}</OutlinedButton>
        </div>
      </template>
    </NDialog>
  </div>
</template>

<script setup lang="ts">
import { formatRelativeTime } from '~/utils/time-formatter'
import { useAdminKeyboardShortcuts } from '~/composables/useAdminKeyboardShortcuts'
import { useTableKeyboardNav } from '~/composables/useTableKeyboardNav'
import { BlossomColorPicker } from '@dayflow/blossom-color-picker-vue'
import type { BlossomColorPickerColor } from '@dayflow/blossom-color-picker-vue'
import { hexToBlossomValue, getContrastColor, BLOSSOM_PALETTE } from '~/utils/color'
import { useColorPickerEscape } from '~/composables/useColorPickerEscape'
import { navigateTo } from 'nuxt/app'

const { showErrorToast } = useErrorToast()

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $t } = useI18n()

useHead({ title: $t('meta_title') as string })

const loading = ref(false)
const tags = ref<any[]>([])
const totalTags = ref(0)
const currentPage = ref(1)
const pageSize = ref(50)
const searchQuery = ref('')
const selectedSort = ref({ label: 'Name A-Z', value: 'name_asc' })

useColorPickerEscape()

const showAddDialog = ref(false)
const selectedTag = ref<Tag | null>(null)
const showDeleteDialog = ref(false)
const tagToDelete = ref<Pick<Tag,'id'|'name'> | null>(null)

const rowSelection = ref<Record<number, boolean>>({})
const lastSelectedIndex = ref<number | null>(null)
const bulkProcessing = ref(false)
const showBulkDeleteDialog = ref(false)

const showBackfillDialog = ref(false)
const backfillProcessing = ref(false)
const backfillDryRun = ref(true)
const backfillOnlyUntagged = ref(true)
const backfillResetExisting = ref(false)
const backfillLimit = ref(2000)
const backfillStatus = ref({ label: 'Approved quotes', value: 'approved' })

const selectedIds = computed<number[]>(() => Object.entries(rowSelection.value).filter(([, v]) => !!v).map(([k]) => Number(k)))

const clearSelection = () => { rowSelection.value = {}; lastSelectedIndex.value = null }
const selectAllOnPage = () => {
  const allSelected = tags.value.length > 0 && tags.value.every(t => !!rowSelection.value[t.id])
  if (allSelected) rowSelection.value = {}
  else tags.value.forEach(t => (rowSelection.value[t.id] = true))
}

const allSelected = computed<boolean | 'indeterminate'>({
  get: () => { const total = tags.value.length; const count = selectedIds.value.length; if (total === 0) return false; if (count === total) return true; if (count > 0) return 'indeterminate'; return false },
  set: (v) => { const newSelection: Record<number, boolean> = {}; if (v === true) tags.value.forEach(t => { newSelection[t.id] = true }); rowSelection.value = newSelection; lastSelectedIndex.value = null }
})

const toggleAllSelection = (v: boolean | 'indeterminate') => {
  if (v) { const newSel: Record<number, boolean> = {}; tags.value.forEach(t => { newSel[t.id] = true }); rowSelection.value = newSel }
  else { rowSelection.value = {} }
  lastSelectedIndex.value = null
}

const isAnyDialogOpen = computed(() => showAddDialog.value || showDeleteDialog.value || showBulkDeleteDialog.value || showBackfillDialog.value)

const { highlightedRowIndex, clearHighlight } = useTableKeyboardNav({
  visibleRowCount: () => tags.value.length,
  onSelectRow: (index: number) => { const tag = tags.value[index]; if (tag) { rowSelection.value[tag.id] = !rowSelection.value[tag.id]; lastSelectedIndex.value = null } },
  isDialogOpen: () => isAnyDialogOpen.value,
  isDropdownOpen: () => false
})

const highlightedTag = computed<any | null>(() => { if (highlightedRowIndex.value === null) return null; return tags.value[highlightedRowIndex.value] ?? null })

useAdminKeyboardShortcuts({
  selectAllOnPage, clearSelection, hasSelection: () => selectedIds.value.length > 0,
  isDialogOpen: () => isAnyDialogOpen.value, isDropdownOpen: () => false,
  onDelete: () => { showBulkDeleteDialog.value = true },
  onConfirmDialog: () => { if (showBulkDeleteDialog.value) confirmBulkDelete() },
  highlightedRowIndex: () => highlightedRowIndex.value,
  onSingleEdit: () => { if (highlightedTag.value) { selectedTag.value = highlightedTag.value; showAddDialog.value = true } },
  onSingleView: () => { if (highlightedTag.value) navigateTo(`/tags/${encodeURIComponent(highlightedTag.value.name)}`) },
  onSingleDelete: () => { if (highlightedTag.value) { tagToDelete.value = highlightedTag.value; showDeleteDialog.value = true } }
})

const sortOptions = [
  { label: 'Name A-Z', value: 'name_asc' }, { label: 'Name Z-A', value: 'name_desc' },
  { label: 'Most Recent', value: 'created_at_desc' }, { label: 'Oldest First', value: 'created_at_asc' },
  { label: 'Most Quotes', value: 'quotes_desc' }
]

const backfillStatusOptions = [
  { label: 'Approved quotes', value: 'approved' }, { label: 'Pending quotes', value: 'pending' },
  { label: 'Draft quotes', value: 'draft' }, { label: 'Rejected quotes', value: 'rejected' }, { label: 'All quotes', value: 'all' }
]

const totalPages = computed(() => Math.ceil(totalTags.value / pageSize.value))

const handleRowCheckboxClick = (event: MouseEvent, index: number, id: number) => {
  const currently = !!rowSelection.value[id]; const newVal = !currently
  if (event.shiftKey && lastSelectedIndex.value !== null) {
    const start = Math.min(lastSelectedIndex.value, index); const end = Math.max(lastSelectedIndex.value, index)
    for (let i = start; i <= end; i += 1) { const row = tags.value[i]; if (row) rowSelection.value[row.id] = newVal }
  } else { rowSelection.value[id] = newVal }
  lastSelectedIndex.value = index
}

const loadTags = async () => {
  try {
    loading.value = true
    const sortValue = selectedSort.value.value; const lastUnderscoreIndex = sortValue.lastIndexOf('_')
    const sortBy = sortValue.substring(0, lastUnderscoreIndex); const sortOrder = sortValue.substring(lastUnderscoreIndex + 1).toUpperCase()
    const res = await $fetch('/api/admin/tags', { query: { page: currentPage.value, limit: pageSize.value, search: searchQuery.value || undefined, sort_by: sortBy, sort_order: sortOrder } })
    tags.value = res?.data || []; totalTags.value = res?.pagination?.total || 0
    rowSelection.value = {}; lastSelectedIndex.value = null; clearHighlight()
  } catch (e) { showErrorToast(e, $t('error_load') as string) }
  finally { loading.value = false }
}

const resetFilters = () => { searchQuery.value = ''; selectedSort.value = sortOptions[0]!; currentPage.value = 1; rowSelection.value = {}; lastSelectedIndex.value = null }

const getTagActions = (tag: any) => [
  { label: $t('dropdown_view_public') as string, leading: 'i-ph-eye', onclick: () => navigateTo(`/tags/${encodeURIComponent(tag.name)}`) },
  { label: $t('dropdown_edit') as string, leading: 'i-ph-pencil', onclick: () => { selectedTag.value = tag; showAddDialog.value = true } },
  {}, { label: $t('dropdown_delete') as string, leading: 'i-ph-trash', onclick: () => { tagToDelete.value = tag; showDeleteDialog.value = true } }
]

const editTag = (tag: any) => { selectedTag.value = tag; showAddDialog.value = true }

const updateTagColor = async (tag: any, color: BlossomColorPickerColor) => {
  const prev = tag.color; tag.color = color.hex
  try { await $fetch(`/api/admin/tags/${tag.id}`, { method: 'PUT', body: { color: color.hex } }) }
  catch (e) { tag.color = prev; showErrorToast(e, $t('error_color') as string) }
}

const reloadAfterModal = () => { showAddDialog.value = false; selectedTag.value = null; loadTags() }
const reloadAfterDelete = () => { showDeleteDialog.value = false; tagToDelete.value = null; if (tags.value.length <= 1 && currentPage.value > 1) currentPage.value = currentPage.value - 1; loadTags() }

const confirmBulkDelete = async () => {
  if (selectedIds.value.length === 0) return
  bulkProcessing.value = true
  try {
    const ids = [...selectedIds.value]
    const results = await Promise.allSettled(ids.map(id => $fetch(`/api/admin/tags/${id}`, { method: 'DELETE' })))
    const failed = results.filter(r => r.status === 'rejected').length; const succeeded = results.length - failed
    useToast().toast({ toast: failed ? 'outline-warning' : 'soft-success', title: $t('toast_bulk_deleted', { n: succeeded, s: succeeded !== 1 ? 's' : '' }) as string, description: failed ? `${failed} failed` : undefined })
  } catch (e) { showErrorToast(e, $t('toast_bulk_delete_failed') as string) }
  finally { bulkProcessing.value = false; showBulkDeleteDialog.value = false; rowSelection.value = {}; lastSelectedIndex.value = null; loadTags() }
}

const triggerBackfill = async () => {
  backfillProcessing.value = true
  try {
    const response: any = await $fetch('/api/admin/quotes/backfill-tags', { method: 'POST', body: { dryRun: backfillDryRun.value, status: backfillStatus.value.value, onlyUntagged: backfillOnlyUntagged.value, resetExisting: backfillResetExisting.value, limit: Math.min(Math.max(backfillLimit.value ?? 2000, 1), 5000) } })
    const scanned = response?.results?.quotes_scanned ?? 0; const matched = response?.results?.quotes_with_matches ?? 0; const linksAttempted = response?.results?.links_attempted ?? 0
    useToast().toast({ toast: 'soft-success', title: (backfillDryRun.value ? $t('toast_backfill_dry') : $t('toast_backfill_complete')) as string, description: `${scanned} ${$t('toast_backfill_scanned')} &middot; ${matched} ${$t('toast_backfill_matched')} &middot; ${linksAttempted} ${$t('toast_backfill_links')}` })
    showBackfillDialog.value = false; await loadTags()
  } catch (error) { showErrorToast(error, $t('toast_backfill_failed') as string) }
  finally { backfillProcessing.value = false }
}

watchDebounced([currentPage, searchQuery, selectedSort], () => { loadTags() }, { debounce: 300 })
onMounted(() => { loadTags() })
</script>

<style scoped>
@keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in-up { animation: fade-in-up 0.5s ease-out both; }
.group\/tag:hover .tag-name { color: var(--hover-text); }
</style>
