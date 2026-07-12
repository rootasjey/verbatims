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
            {{ total }} {{ total === 1 ? 'message' : 'messages' }}
            <span v-if="activeCount > 0" class="text-green-600 dark:text-green-400">&middot; {{ activeCount }} {{ $t('status_active') }}</span>
          </p>
        </div>
        <div class="hidden md:flex items-center gap-3">
          <input v-model="searchQuery" type="text" :placeholder="$t('search_placeholder') as string" class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none w-48" />
          <select v-model="selectedSort" class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 cursor-pointer">
            <option v-for="opt in sortOptions" :key="opt.value" :value="opt">{{ opt.label }}</option>
          </select>
          <OutlinedButton @click="editingMessage = null; showDialog = true">{{ $t('add_button') }}</OutlinedButton>
        </div>
      </div>
      <div class="md:hidden mt-4">
        <input v-model="searchQuery" type="text" :placeholder="$t('search_placeholder') as string" class="w-full font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && messages.length === 0" class="space-y-5">
      <div v-for="i in 5" :key="i" class="animate-pulse pb-5 border-b border-dashed border-gray-100 dark:border-gray-800">
        <div class="h-4 bg-gray-100 dark:bg-gray-900 rounded w-3/4 mb-2" /><div class="h-3 bg-gray-100 dark:bg-gray-900 rounded w-1/4" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="messages.length === 0 && !loading" class="py-16 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-sm">
      <NIcon name="i-ph-megaphone" class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
      <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">{{ searchQuery ? $t('empty_search_title') : $t('empty_title') }}</p>
      <p class="font-sans text-sm text-gray-500 dark:text-gray-400">{{ searchQuery ? $t('empty_search_desc') : $t('empty_desc') }}</p>
    </div>

    <!-- Table -->
    <div v-else>
      <div v-if="selectedIds.length > 0" class="flex items-center gap-3 mb-4 pb-3 border-b border-dashed border-gray-200 dark:border-gray-700">
        <span class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ $t('common.selected_count', { count: selectedIds.length }) }}</span>
        <OutlinedButton size="sm" variant="destructive" @click="showBulkDeleteDialog = true">{{ $t('common.delete') }}</OutlinedButton>
        <button class="font-sans text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-auto" @click="clearSelection">{{ $t('common.clear') }}</button>
      </div>

      <div class="border border-dashed border-gray-200 dark:border-gray-700 rounded-sm overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0C0A09]">
              <th class="w-10 px-3 py-3 text-left"><NCheckbox checkbox="gray" :model-value="allSelected" @update:model-value="toggleAllSelection" /></th>
              <th class="px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_message') }}</th>
              <th class="w-24 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_status') }}</th>
              <th class="w-20 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_type') }}</th>
              <th class="w-16 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_priority') }}</th>
              <th class="w-44 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_schedule') }}</th>
              <th class="w-28 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_created') }}</th>
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
              <td class="px-3 py-3 max-w-md">
                <ContextMenu size="xs" native-on-modifier="ctrl" :items="getRowActions(msg)">
                  <button class="font-sans text-sm text-gray-900 dark:text-gray-100 line-clamp-2 text-left hover:text-primary dark:hover:text-primary-light transition-colors cursor-pointer w-full" @click="editMessage(msg)">
                    {{ msg.message }}
                  </button>
                </ContextMenu>
              </td>
              <td class="px-3 py-3">
                <NDropdownMenu :items="getStatusActions(msg)" :align="'start'">
                  <button class="flex items-center gap-1 font-sans text-xs px-1.5 py-0.5 cursor-pointer" :class="statusPillClass(getStatusText(msg))">
                    {{ getStatusText(msg) }}
                    <NIcon name="i-ph-caret-down" class="w-3 h-3" />
                  </button>
                </NDropdownMenu>
              </td>
              <td class="px-3 py-3"><span class="font-sans text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5">{{ msg.type }}</span></td>
              <td class="px-3 py-3 font-sans text-sm text-gray-900 dark:text-gray-100">{{ msg.priority }}</td>
              <td class="px-3 py-3">
                <div class="font-sans text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                  <div v-if="msg.startsAt">{{ $t('label_start') }} {{ formatDate(msg.startsAt) }}</div>
                  <div v-if="msg.endsAt">{{ $t('label_end') }} {{ formatDate(msg.endsAt) }}</div>
                  <div v-else class="text-gray-400">&mdash;</div>
                </div>
              </td>
              <td class="px-3 py-3 font-sans text-xs text-gray-500 dark:text-gray-400">{{ formatDate(msg.createdAt) }}</td>
              <td class="px-3 py-3">
                <NDropdownMenu :items="getRowActions(msg)">
                  <button @click.stop class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><NIcon name="i-ph-dots-three-vertical" class="w-4 h-4" /></button>
                </NDropdownMenu>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="h-20" />
    </div>

    <div
      v-if="totalPages > 1"
      class="fixed bottom-0 z-20 bg-[#FAFAF9] dark:bg-[#0C0A09] border-t border-dashed border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between shadow-sm transition-all duration-300 ease-in-out"
      :style="{ left: footerLeftOffset + 'px', width: footerWidth }"
    >
      <span class="font-sans text-xs text-gray-500 dark:text-gray-400">
        Page
        <button
          class="font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 underline underline-offset-2 decoration-dotted decoration-gray-300 dark:decoration-gray-600"
          @click="showPageJumpDialog = true"
        >
          {{ currentPage }}
        </button>
        of {{ totalPages }} &middot; {{ total }} {{ total === 1 ? 'message' : 'messages' }}
      </span>
      <div class="flex items-center gap-3">
        <OutlinedButton v-if="currentPage > 1" @click="currentPage = Math.max(1, currentPage - 1)">&larr; Previous</OutlinedButton>
        <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">This is the first page</span>
        <button
          class="font-sans text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm px-2.5 py-1.5 transition-colors"
          @click="showPageJumpDialog = true"
        >
          {{ currentPage }} / {{ totalPages }}
        </button>
        <OutlinedButton v-if="currentPage < totalPages" @click="currentPage = Math.min(totalPages, currentPage + 1)">Next &rarr;</OutlinedButton>
        <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">This is the last page</span>
      </div>
    </div>

    <AddSponsorMessageDialog v-model="showDialog" :edit-message="editingMessage" :active-count="activeCount" @saved="reload" />
    <DeleteSponsorMessageDialog v-model="showDeleteDialog" :message="deletingMessage" @deleted="handleDeleted" />

    <NDialog v-model:open="showRejectDialog">
      <template #header><h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">{{ $t('dialog_reject_title') }}</h3></template>
      <div class="space-y-3">
        <p class="font-sans text-sm text-gray-600 dark:text-gray-400">{{ $t('dialog_reject_body') }}</p>
        <p v-if="rejectingMessage" class="font-sans text-sm text-gray-900 dark:text-gray-100 italic border-l-2 border-red-300 pl-3">&ldquo;{{ rejectingMessage.message }}&rdquo;</p>
        <textarea
          v-model="rejectionReason"
          :placeholder="$t('dialog_reject_placeholder') as string"
          rows="3"
          class="w-full font-sans text-sm bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none resize-none"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-3 py-1.5" @click="showRejectDialog = false; rejectingMessage = null; rejectionReason = ''">{{ $t('common.cancel') }}</button>
          <OutlinedButton @click="confirmReject">{{ $t('dialog_reject_button') }}</OutlinedButton>
        </div>
      </template>
    </NDialog>

    <NDialog v-model:open="showBulkDeleteDialog">
      <template #header><h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">{{ $t('dialog_delete_title', { n: selectedIds.length, count: selectedIds.length }) }}</h3></template>
      <p class="font-sans text-sm text-gray-600 dark:text-gray-400 mb-4">{{ $t('dialog_delete_body', { n: selectedIds.length, count: selectedIds.length }) }}</p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-3 py-1.5" @click="showBulkDeleteDialog = false">{{ $t('common.cancel') }}</button>
          <OutlinedButton variant="destructive" :loading="bulkProcessing" @click="confirmBulkDelete">{{ $t('common.delete') }}</OutlinedButton>
        </div>
      </template>
    </NDialog>
    <PageJumpDialog
      v-model="showPageJumpDialog"
      :total-pages="totalPages"
      @jump="onPageJump"
    />
  </div>
</template>

<script setup lang="ts">
const { $t } = useI18n()

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: $t('meta_title') as string })
const { showErrorToast } = useErrorToast()

const loading = ref(false)
const messages = ref<any[]>([])
const total = ref(0)
const activeCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(50)
const searchQuery = ref('')

const showPageJumpDialog = ref(false)
const footerLeftOffset = ref(0)
const footerWidth = ref('100%')
const selectedSort = ref({ label: $t('sort_priority_high') as string, value: 'priority_desc' })

const showDialog = ref(false)
const editingMessage = ref<any | null>(null)
const showDeleteDialog = ref(false)
const deletingMessage = ref<{ id: number; message: string } | null>(null)

const rowSelection = ref<Record<number, boolean>>({})
const lastSelectedIndex = ref<number | null>(null)
const bulkProcessing = ref(false)
const showBulkDeleteDialog = ref(false)

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

const handleRowCheckboxClick = (event: MouseEvent, index: number, id: number) => {
  const currently = !!rowSelection.value[id]; const newVal = !currently
  if (event.shiftKey && lastSelectedIndex.value !== null) {
    const start = Math.min(lastSelectedIndex.value, index); const end = Math.max(lastSelectedIndex.value, index)
    for (let i = start; i <= end; i += 1) { const row = messages.value[i]; if (row) rowSelection.value[row.id] = newVal }
  } else { rowSelection.value[id] = newVal }
  lastSelectedIndex.value = index
}

const clearSelection = () => { rowSelection.value = {}; lastSelectedIndex.value = null }
const selectAllOnPage = () => {
  const allSel = messages.value.length > 0 && messages.value.every(m => !!rowSelection.value[m.id])
  if (allSel) rowSelection.value = {}
  else messages.value.forEach(m => (rowSelection.value[m.id] = true))
}

const { highlightedRowIndex, clearHighlight } = useTableKeyboardNav({
  visibleRowCount: () => messages.value.length,
  onSelectRow: (index: number) => { const msg = messages.value[index]; if (msg) { rowSelection.value[msg.id] = !rowSelection.value[msg.id]; lastSelectedIndex.value = null } },
  isDialogOpen: () => false, isDropdownOpen: () => false
})

const sortOptions = computed(() => [
  { label: $t('sort_priority_high') as string, value: 'priority_desc' }, { label: $t('sort_priority_low') as string, value: 'priority_asc' },
  { label: $t('sort_most_recent') as string, value: 'created_at_desc' }, { label: $t('sort_oldest_first') as string, value: 'created_at_asc' },
])

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const toMs = (val: any) => val ? new Date(val).getTime() : 0

const formatDate = (ts: number | string | null | undefined) => {
  if (!ts) return '\u2014'
  const d = new Date(ts)
  if (isNaN(d.getTime())) return '\u2014'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const getStatusText = (msg: any) => {
  if (msg.status === 'pending') return $t('status_pending') as string
  if (msg.status === 'rejected') return $t('status_rejected') as string
  if (msg.status === 'approved') {
    const now = Date.now()
    if (msg.startsAt && toMs(msg.startsAt) > now) return $t('status_scheduled') as string
    if (msg.endsAt && toMs(msg.endsAt) < now) return $t('status_expired') as string
    return $t('status_active') as string
  }
  return $t('status_pending') as string
}

const statusPillClass = (status: string) => {
  switch (status) {
    case 'Active': return 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
    case 'Scheduled': return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
    case 'Expired': return 'text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
    case 'Pending': return 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
    case 'Rejected': return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
    default: return 'text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
  }
}

const getRowActions = (msg: any) => [
  { label: $t('dropdown_edit') as string, leading: 'i-ph-pencil', onclick: () => editMessage(msg) },
  {}, { label: $t('dropdown_delete') as string, leading: 'i-ph-trash', onclick: () => { deletingMessage.value = { id: msg.id, message: msg.message }; showDeleteDialog.value = true } }
]

const editMessage = (msg: any) => {
  editingMessage.value = msg
  showDialog.value = true
}

const showRejectDialog = ref(false)
const rejectingMessage = ref<any | null>(null)
const rejectionReason = ref('')

const openRejectDialog = (msg: any) => {
  rejectingMessage.value = msg
  rejectionReason.value = ''
  showRejectDialog.value = true
}

const getStatusActions = (msg: any) => {
  const actions = []
  if (msg.status !== 'approved') {
    actions.push({ label: $t('dropdown_approve') as string, onclick: () => changeStatus(msg, 'approved') })
  }
  if (msg.status !== 'pending') {
    actions.push({ label: $t('dropdown_mark_pending') as string, onclick: () => changeStatus(msg, 'pending') })
  }
  if (msg.status !== 'rejected') {
    actions.push({ label: $t('dropdown_reject') as string, onclick: () => openRejectDialog(msg) })
  }
  return actions
}

const changeStatus = async (msg: any, newStatus: string, reason?: string) => {
  try {
    const payload: any = { status: newStatus }
    if (newStatus === 'approved') {
      if (!msg.startsAt) {
        const now = new Date()
        payload.starts_at = now.toISOString()
        if (!msg.endsAt) {
          const endsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          payload.ends_at = endsAt.toISOString()
        }
      }
    }
    if (newStatus === 'rejected' && reason) {
      payload.rejection_reason = reason
    }
    await $fetch(`/api/admin/sponsors/${msg.id}`, { method: 'PUT', body: payload })
    loadMessages()
  } catch (e) {
    showErrorToast(e, $t('error_status') as string)
  }
}

const confirmReject = () => {
  if (!rejectingMessage.value) return
  changeStatus(rejectingMessage.value, 'rejected', rejectionReason.value)
  showRejectDialog.value = false
  rejectingMessage.value = null
  rejectionReason.value = ''
}

const loadMessages = async () => {
  try {
    loading.value = true
    const sortValue = selectedSort.value.value; const lastUnderscoreIndex = sortValue.lastIndexOf('_')
    const sortBy = sortValue.substring(0, lastUnderscoreIndex); const sortOrder = sortValue.substring(lastUnderscoreIndex + 1).toUpperCase()
    const res: any = await $fetch('/api/admin/sponsors', { query: { page: currentPage.value, limit: pageSize.value, search: searchQuery.value || undefined, sort_by: sortBy, sort_order: sortOrder } })
    messages.value = res.data?.sponsors || []; total.value = res.pagination?.total || 0; activeCount.value = res.data?.activeCount || 0
    rowSelection.value = {}; lastSelectedIndex.value = null
  } catch (e) { console.error('Failed to load sponsor messages', e); showErrorToast(e, $t('error_load') as string) }
  finally { loading.value = false }
}

const resetFilters = () => { searchQuery.value = ''; selectedSort.value = sortOptions.value[0]!; currentPage.value = 1; rowSelection.value = {}; lastSelectedIndex.value = null }
const reload = () => { showDialog.value = false; editingMessage.value = null; loadMessages() }
const handleDeleted = () => { showDeleteDialog.value = false; deletingMessage.value = null; if (messages.value.length <= 1 && currentPage.value > 1) currentPage.value -= 1; loadMessages() }

const confirmBulkDelete = async () => {
  if (selectedIds.value.length === 0) return
  bulkProcessing.value = true
  try {
    const ids = [...selectedIds.value]
    const results = await Promise.allSettled(ids.map(id => $fetch(`/api/admin/sponsors/${id}`, { method: 'DELETE' })))
    const failed = results.filter(r => r.status === 'rejected').length; const succeeded = results.length - failed
    if (failed) useToast().toast({ toast: 'outline-warning', title: $t('toast_bulk_deleted', { n: succeeded, s: succeeded !== 1 ? 's' : '' }) as string, description: `${failed} ${$t('toast_bulk_deleted_failed')}` })
  } catch (e) { showErrorToast(e, $t('toast_bulk_delete_failed') as string) }
  finally { bulkProcessing.value = false; showBulkDeleteDialog.value = false; rowSelection.value = {}; lastSelectedIndex.value = null; loadMessages() }
}

const onPageJump = (page: number) => {
  currentPage.value = page
}

let footerObserver: ResizeObserver | null = null

const updateFooterPosition = () => {
  const mainEl = document.querySelector('main')
  if (!mainEl) {
    footerLeftOffset.value = 0
    footerWidth.value = '100%'
    return
  }
  const rect = mainEl.getBoundingClientRect()
  footerLeftOffset.value = rect.left
  footerWidth.value = `${rect.width}px`
}

onMounted(() => {
  updateFooterPosition()
  footerObserver = new ResizeObserver(updateFooterPosition)
  const mainEl = document.querySelector('main')
  if (mainEl) footerObserver.observe(mainEl)
  window.addEventListener('resize', updateFooterPosition)
})

onUnmounted(() => {
  if (footerObserver) footerObserver.disconnect()
  window.removeEventListener('resize', updateFooterPosition)
})

watchDebounced([currentPage, searchQuery, selectedSort], () => { loadMessages() }, { debounce: 300 })
onMounted(() => { loadMessages() })
</script>

<style scoped>
@keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in-up { animation: fade-in-up 0.5s ease-out both; }
.line-clamp-2 { display: -webkit-box; line-clamp: 2; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>
