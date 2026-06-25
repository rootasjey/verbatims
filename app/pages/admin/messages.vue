<template>
  <div>
    <!-- Editorial Header -->
    <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
            Messages
          </h1>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ totalMessages }} {{ totalMessages === 1 ? 'message' : 'messages' }}
          </p>
        </div>
        <div class="hidden md:flex items-center gap-3">
          <input v-model="searchQuery" type="text" placeholder="Search name, email, or message..." class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none w-56" />
          <select v-model="statusFilter" class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 cursor-pointer">
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt">{{ opt.label }}</option>
          </select>
          <select v-model="categoryFilter" class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 cursor-pointer">
            <option v-for="opt in categoryOptions" :key="opt.value" :value="opt">{{ opt.label }}</option>
          </select>
          <select v-model="targetFilter" class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 cursor-pointer">
            <option v-for="opt in targetOptions" :key="opt.value" :value="opt">{{ opt.label }}</option>
          </select>
        </div>
      </div>
      <div class="md:hidden mt-4 flex gap-2">
        <input v-model="searchQuery" type="text" placeholder="Search messages..." class="flex-1 font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none" />
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="!hasLoadedOnce && loading" class="space-y-5">
      <div v-for="i in 5" :key="i" class="animate-pulse pb-5 border-b border-dashed border-gray-100 dark:border-gray-800">
        <div class="h-4 bg-gray-100 dark:bg-gray-900 rounded w-3/4 mb-2" /><div class="h-3 bg-gray-100 dark:bg-gray-900 rounded w-1/4" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="hasLoadedOnce && messages.length === 0" class="py-16 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-sm">
      <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">No messages found</p>
    </div>

    <!-- Table -->
    <div v-else-if="hasLoadedOnce">
      <div v-if="selectedIds.length > 0" class="flex items-center gap-3 mb-4 pb-3 border-b border-dashed border-gray-200 dark:border-gray-700">
        <span class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ selectedIds.length }} selected</span>
        <OutlinedButton size="sm" @click="bulkSetStatus('triaged')">Mark Triaged</OutlinedButton>
        <OutlinedButton size="sm" variant="primary" @click="bulkSetStatus('resolved')">Mark Resolved</OutlinedButton>
        <OutlinedButton size="sm" variant="destructive" @click="bulkSetStatus('spam')">Mark Spam</OutlinedButton>
        <button class="font-sans text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-auto" @click="clearSelection">Clear</button>
      </div>

      <div class="border border-dashed border-gray-200 dark:border-gray-700 rounded-sm overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0C0A09]">
              <th class="w-10 px-3 py-3 text-left"><NCheckbox checkbox="gray" :model-value="allSelected" @update:model-value="toggleAllSelection" /></th>
              <th class="px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Message</th>
              <th class="w-24 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Category</th>
              <th class="w-24 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Target</th>
              <th class="w-24 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
              <th class="w-28 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</th>
              <th class="w-10 px-3 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="(msg, idx) in messages" :key="msg.id" :data-highlighted="idx === highlightedRowIndex ? 'true' : undefined" :class="['animate-fade-in-up transition-colors group', { 'bg-[#FAFAF9] dark:bg-[#1C1B1A]': idx === highlightedRowIndex }, { 'bg-indigo-50/50 dark:bg-indigo-950/30': !!rowSelection[msg.id] }]" :style="{ animationDelay: `${idx * 0.03}s` }">
              <td class="px-3 py-3">
                <div :class="[Object.keys(rowSelection).length > 0 ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity']">
                  <NCheckbox checkbox="gray" :model-value="!!rowSelection[msg.id]" @click="handleRowCheckboxClick($event, idx, msg.id)" />
                </div>
              </td>
              <td class="px-3 py-3 max-w-xl">
                <div class="font-sans text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap line-clamp-3">{{ truncate(msg.message, 280) }}</div>
                <div class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span class="capitalize">{{ msg.category }}</span>
                  <span v-if="msg.target_type !== 'general'"> &middot; {{ formatTarget(msg) }}</span>
                </div>
                <div class="flex items-center gap-2 border-t border-dashed border-gray-100 dark:border-gray-800 mt-2 pt-2">
                  <span class="font-sans text-xs font-500 italic text-gray-500 dark:text-gray-400">From:</span>
                  <span class="font-sans text-sm text-gray-900 dark:text-gray-100">{{ msg.user_name || msg.name || 'Anonymous' }}</span>
                  <span v-if="msg.user_email || msg.email" class="font-sans text-xs text-gray-500 dark:text-gray-400">({{ msg.user_email || msg.email }})</span>
                </div>
              </td>
              <td class="px-3 py-3"><span class="font-sans text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5">{{ msg.category }}</span></td>
              <td class="px-3 py-3"><span class="font-sans text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5">{{ msg.target_type }}</span></td>
              <td class="px-3 py-3">
                <div class="flex items-center gap-1">
                  <span class="font-sans text-xs px-1.5 py-0.5" :class="statusPillClass(msg.status)">{{ msg.status }}</span>
                  <NDropdownMenu :items="statusItems(msg)">
                    <button @click.stop class="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><NIcon name="i-ph-caret-down" class="w-3 h-3" /></button>
                  </NDropdownMenu>
                </div>
              </td>
              <td class="px-3 py-3 font-sans text-xs text-gray-500 dark:text-gray-400">{{ formatRelativeTime(msg.created_at) }}</td>
              <td class="px-3 py-3">
                <NDropdownMenu :items="rowActions(msg)">
                  <button @click.stop class="p-1 rounded-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><NIcon name="i-ph-dots-three-vertical" class="w-4 h-4" /></button>
                </NDropdownMenu>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between pt-4">
        <span class="font-sans text-xs text-gray-500 dark:text-gray-400">Page {{ currentPage }} of {{ totalPages }} &middot; {{ totalMessages }} {{ totalMessages === 1 ? 'message' : 'messages' }}</span>
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
</template>

<script lang="ts" setup>
import { formatRelativeTime } from '~/utils/time-formatter'
import { useAdminKeyboardShortcuts } from '~/composables/useAdminKeyboardShortcuts'
import { useTableKeyboardNav } from '~/composables/useTableKeyboardNav'
type MessageStatus = AdminUserMessage['status']

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Messages - Admin - Verbatims' })

const messages: Ref<AdminUserMessage[]> = ref([])
const loading = ref(true)
const hasLoadedOnce = ref(false)
const currentPage = ref(1)
const pageSize = ref(50)
const totalMessages = ref(0)
const totalPages = ref(0)
const bulkLoading = ref(false)

const searchQuery = ref('')
const statusFilter = ref({ label: 'All statuses', value: '' })
const categoryFilter = ref({ label: 'All categories', value: '' })
const targetFilter = ref({ label: 'All targets', value: '' })

const statusOptions = [
  { label: 'All statuses', value: '' },
  { label: 'New', value: 'new' }, { label: 'Triaged', value: 'triaged' },
  { label: 'Resolved', value: 'resolved' }, { label: 'Spam', value: 'spam' }
]

const categoryOptions = [
  { label: 'All categories', value: '' }, { label: 'Bug', value: 'bug' }, { label: 'Feature', value: 'feature' },
  { label: 'Feedback', value: 'feedback' }, { label: 'Content', value: 'content' }, { label: 'Other', value: 'other' }
]

const targetOptions = [
  { label: 'All targets', value: '' }, { label: 'General', value: 'general' }, { label: 'Quote', value: 'quote' },
  { label: 'Author', value: 'author' }, { label: 'Reference', value: 'reference' }
]

const rowSelection: Ref<Record<number, boolean>> = ref({})
const lastSelectedIndex = ref<number | null>(null)
const selectedIds = computed(() => Object.entries(rowSelection.value).filter(([, v]) => !!v).map(([k]) => Number(k)))

const allSelected = computed<boolean | 'indeterminate'>({
  get: () => { const total = messages.value.length; const count = selectedIds.value.length; if (total === 0) return false; if (count === total) return true; if (count > 0) return 'indeterminate'; return false },
  set: (v) => { const newSel: Record<number, boolean> = {}; if (v === true) messages.value.forEach(m => { newSel[m.id] = true }); rowSelection.value = newSel; lastSelectedIndex.value = null }
})

const toggleAllSelection = (v: boolean | 'indeterminate') => {
  if (v) { const newSel: Record<number, boolean> = {}; messages.value.forEach(m => { newSel[m.id] = true }); rowSelection.value = newSel }
  else { rowSelection.value = {} }
  lastSelectedIndex.value = null
}

const loadMessages = async (page = 1) => {
  loading.value = true
  try {
    const params = { page, limit: pageSize.value, status: statusFilter.value?.value, category: categoryFilter.value?.value || undefined, target_type: targetFilter.value?.value || undefined, search: searchQuery.value || undefined }
    const res = await $fetch('/api/admin/messages', { query: params })
    messages.value = res.data || []; totalMessages.value = res.pagination?.total || 0; totalPages.value = res.pagination?.totalPages || 0; pageSize.value = res.pagination?.limit || pageSize.value
    rowSelection.value = {}; lastSelectedIndex.value = null; clearHighlight(); currentPage.value = page
  } catch (err) { console.error('Failed to load messages', err) }
  finally { loading.value = false; hasLoadedOnce.value = true }
}

const resetFilters = () => {
  searchQuery.value = ''; statusFilter.value = { label: 'All statuses', value: '' }
  categoryFilter.value = { label: 'All categories', value: '' }; targetFilter.value = { label: 'All targets', value: '' }
  currentPage.value = 1; rowSelection.value = {}; lastSelectedIndex.value = null
}

watchDebounced([searchQuery, statusFilter, categoryFilter, targetFilter], () => { currentPage.value = 1; loadMessages(1) }, { debounce: 300 })
watch(currentPage, () => { loadMessages(currentPage.value) })

const truncate = (t: string, n: number): string => t?.length > n ? t.slice(0, n) + '\u2026' : t
const formatTarget = (row: AdminUserMessage) => row.target_type === 'quote' ? `Quote: ${truncate(row.target_label, 40)}` : row.target_type === 'author' ? `Author: ${row.target_label}` : row.target_type === 'reference' ? `Reference: ${row.target_label}` : 'General'

const statusPillClass = (status: string) => {
  switch (status) {
    case 'new': return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
    case 'triaged': return 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
    case 'resolved': return 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
    case 'spam': return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
    default: return 'text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
  }
}

const setStatus = async (row: AdminUserMessage, status: MessageStatus) => {
  try { await $fetch(`/api/admin/messages/${row.id}/status`, { method: 'POST', body: { status } }); row.status = status }
  catch (err) { console.error('Failed to set status', err) }
}

const statusItems = (row: AdminUserMessage) => ([
  { label: 'New', leading: 'i-ph-star-four-duotone', onclick: () => setStatus(row, 'new') },
  { label: 'Triaged', leading: 'i-ph-play-duotone', onclick: () => setStatus(row, 'triaged') },
  { label: 'Resolved', leading: 'i-ph-check', onclick: () => setStatus(row, 'resolved') },
  { label: 'Spam', leading: 'i-ph-warning', onclick: () => setStatus(row, 'spam') }
])

const rowActions = (row: AdminUserMessage) => ([
  { label: 'Copy details', leading: 'i-ph-copy', onclick: async () => { const summary = `From: ${row.user_name || row.name || 'Anonymous'} <${row.user_email || row.email || ''}>\nCategory: ${row.category}\nTarget: ${row.target_type}${row.target_label ? ` (${row.target_label})` : ''}\nTags: ${(row.tags || []).join(', ')}\nMessage: ${row.message}`; try { await navigator.clipboard.writeText(summary) } catch {} } },
  {}, { label: 'Mark triaged', leading: 'i-ph-play-duotone', onclick: () => setStatus(row, 'triaged') },
  { label: 'Mark resolved', leading: 'i-ph-check', onclick: () => setStatus(row, 'resolved') },
  { label: 'Mark spam', leading: 'i-ph-warning', onclick: () => setStatus(row, 'spam') }
])

const handleRowCheckboxClick = (event: MouseEvent, index: number, id: number) => {
  const currently = !!rowSelection.value[id]; const newVal = !currently
  if (event.shiftKey && lastSelectedIndex.value !== null) {
    const start = Math.min(lastSelectedIndex.value, index); const end = Math.max(lastSelectedIndex.value, index)
    for (let i = start; i <= end; i += 1) { const row = messages.value[i]; if (row) rowSelection.value[row.id] = newVal }
  } else { rowSelection.value[id] = newVal }
  lastSelectedIndex.value = index
}

const bulkSetStatus = async (status: MessageStatus) => {
  if (!selectedIds.value.length) return
  try {
    bulkLoading.value = true
    await $fetch('/api/admin/messages/bulk-status', { method: 'POST', body: { ids: selectedIds.value, status } })
    messages.value.forEach(m => { if (selectedIds.value.includes(m.id)) m.status = status })
    rowSelection.value = {}; lastSelectedIndex.value = null
  } catch (err) { console.error('Failed bulk set status', err) }
  finally { bulkLoading.value = false }
}

const selectAllOnPage = () => {
  const allSel = messages.value.length > 0 && messages.value.every(m => !!rowSelection.value[m.id])
  if (allSel) rowSelection.value = {}
  else messages.value.forEach(m => (rowSelection.value[m.id] = true))
}

const clearSelection = () => { rowSelection.value = {}; lastSelectedIndex.value = null }
const isAnyDialogOpen = computed(() => false)

const { highlightedRowIndex, clearHighlight } = useTableKeyboardNav({
  visibleRowCount: () => messages.value.length,
  onSelectRow: (index: number) => { const msg = messages.value[index]; if (msg) { rowSelection.value[msg.id] = !rowSelection.value[msg.id]; lastSelectedIndex.value = null } },
  isDialogOpen: () => isAnyDialogOpen.value, isDropdownOpen: () => false
})

const highlightedMessage = computed<AdminUserMessage | null>(() => { if (highlightedRowIndex.value === null) return null; return messages.value[highlightedRowIndex.value] ?? null })

useAdminKeyboardShortcuts({
  selectAllOnPage, clearSelection, hasSelection: () => selectedIds.value.length > 0,
  isDialogOpen: () => isAnyDialogOpen.value, isDropdownOpen: () => false,
  customKeys: { t: () => bulkSetStatus('triaged'), r: () => bulkSetStatus('resolved'), s: () => bulkSetStatus('spam') },
  highlightedRowIndex: () => highlightedRowIndex.value,
  customSingleKeys: { t: () => { if (highlightedMessage.value) setStatus(highlightedMessage.value, 'triaged') }, r: () => { if (highlightedMessage.value) setStatus(highlightedMessage.value, 'resolved') }, s: () => { if (highlightedMessage.value) setStatus(highlightedMessage.value, 'spam') } }
})

const newCount = computed(() => messages.value.filter(m => m.status === 'new').length)
const authenticatedCount = computed(() => messages.value.filter(m => !!m.user_id).length)

onMounted(() => { loadMessages() })
</script>

<style scoped>
@keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in-up { animation: fade-in-up 0.5s ease-out both; }
.line-clamp-3 { display: -webkit-box; line-clamp: 3; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
</style>
