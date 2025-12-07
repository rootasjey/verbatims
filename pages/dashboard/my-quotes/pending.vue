<template>
  <div class="min-h-screen">
    <!-- Mobile: Pending List -->
    <div v-if="isMobile" class="mobile-pending-page bg-gray-50 dark:bg-[#0A0805] min-h-screen pb-24">
      <!-- Header -->
      <div 
        class="sticky top-10 z-10 bg-white dark:bg-[#0F0D0B] border-b rounded-6 border-gray-100 dark:border-gray-800 transition-all duration-300 ease-in-out"
        :class="{ 'shadow-sm': !showHeaderElements }"
      >
        <div class="px-4 transition-all duration-300 ease-in-out" :class="showHeaderElements ? 'py-5' : 'py-3'">
          <div class="mt-4 transition-all duration-300 ease-in-out" :class="{ 'mb-2': showHeaderElements }">
            <h1 
              class="overflow-hidden font-sans text-gray-900 dark:text-white transition-all duration-300 ease-in-out"
              :class="showHeaderElements ? 'text-4xl font-600' : 'text-2xl font-600'"
            >
              Pending Review
            </h1>
          </div>

          <!-- Search Bar with collapse animation -->
          <div 
            class="transition-all duration-300 ease-in-out overflow-hidden"
            :class="showHeaderElements ? 'mb-3 max-h-20 opacity-100' : 'max-h-0 opacity-0 mb-0'"
          >
            <NInput
              v-model="searchQuery"
              :placeholder="`Search among ${filteredQuotes.length} pending ${filteredQuotes.length === 1 ? 'quote' : 'quotes'}...`"
              leading="i-ph-magnifying-glass"
              size="lg"
              class="w-full"
              rounded="4"
              :trailing="searchQuery ? 'i-ph-x' : undefined"
              :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
              @trailing="searchQuery = ''"
            />
          </div>

          <!-- Filter Chips with collapse animation -->
          <div 
            class="transition-all duration-300 ease-in-out overflow-hidden"
            :class="showHeaderElements ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'"
          >
            <div class="flex items-center gap-2 overflow-x-auto py-2 -mx-1 px-1 scrollbar-hide">
              <NBadge
                :badge="sortBy.value === 'recent' ? 'soft-blue' : 'soft-gray'"
                class="cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs font-500 rounded-full transition-all hover:shadow-sm active:scale-95"
                @click="sortBy = { label: 'Most Recent', value: 'recent' }"
              >
                <NIcon name="i-ph-clock" class="w-3 h-3 mr-1.5" />
                Recent
              </NBadge>
              <NBadge
                :badge="sortBy.value === 'oldest' ? 'soft-pink' : 'soft-gray'"
                class="cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs font-500 rounded-full transition-all hover:shadow-sm active:scale-95"
                @click="sortBy = { label: 'Oldest First', value: 'oldest' }"
              >
                <NIcon name="i-ph-calendar-blank" class="w-3 h-3 mr-1.5" />
                Oldest
              </NBadge>
              <NBadge
                :badge="sortBy.value === 'author' ? 'soft-blue' : 'soft-gray'"
                class="cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs font-500 rounded-full transition-all hover:shadow-sm active:scale-95"
                @click="sortBy = { label: 'Author A-Z', value: 'author' }"
              >
                <NIcon name="i-ph-user" class="w-3 h-3 mr-1.5" />
                Author
              </NBadge>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading && !hasLoadedOnce" class="flex items-center justify-center py-12">
        <div class="flex items-center gap-3">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          <span class="text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredQuotes.length === 0" class="text-center py-16 px-4">
        <NIcon name="i-ph-clock" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-600 text-gray-900 dark:text-white mb-2">
          {{ searchQuery ? 'No matching pending quotes' : 'No pending quotes' }}
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search terms.' : 'Submit some quotes to see them here while they await review.' }}
        </p>
        <NButton v-if="!searchQuery" btn="solid-black" to="/dashboard/my-quotes/drafts">
          <NIcon name="i-ph-file-dashed" />
          <span>View Drafts</span>
        </NButton>
      </div>

      <!-- Results -->
      <div v-else class="px-3 pt-3 pb-6 space-y-3">
        <div class="px-1 pb-2 text-sm text-gray-500 dark:text-gray-400">
          {{ filteredQuotes.length }} {{ filteredQuotes.length === 1 ? 'pending quote' : 'pending quotes' }}
        </div>

        <div class="space-y-3">
          <QuoteListItem
            v-for="quote in processedMobileQuotes"
            :key="quote.id"
            :quote="quote"
            :actions="pendingQuoteActions"
            @view="viewQuote"
            @withdraw="withdrawQuote"
          />
        </div>

        <div v-if="hasMore" class="px-4 pt-6">
          <NButton
            :loading="loadingMore"
            btn="dark:solid-black"
            size="md"
            class="w-full hover:scale-101 active:scale-99 transition-transform duration-300 ease-in-out"
            @click="loadMore"
          >
            Load More
          </NButton>
        </div>
      </div>
    </div>

    <!-- Desktop: Existing Table View -->
    <div v-else class="flex flex-col h-full">
      <!-- Fixed Header Section -->
      <div class="pb-6 mb-6 flex-shrink-0 bg-gray-50 dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-700">

        <!-- Search and Filters -->
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <NInput
              v-model="searchQuery"
              placeholder="Search pending quotes..."
              leading="i-ph-magnifying-glass"
              size="md"
              :loading="loading"
              :trailing="searchQuery ? 'i-ph-x' : undefined"
              :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
              @trailing="resetFilters"
            />
          </div>
          <div class="w-full sm:w-48">
            <NSelect
              v-model="sortBy"
              :items="sortOptions"
              placeholder="Sort by"
              size="sm"
              item-key="label"
              value-key="label"
            />
          </div>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div v-if="selectedQuotes.length > 0" class="flex-shrink-0 mb-6">
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ selectedQuotes.length }} {{ selectedQuotes.length === 1 ? 'quote' : 'quotes' }} selected
            </span>
            <div class="flex items-center gap-3">
              <NButton size="sm" btn="soft-orange" :loading="bulkProcessing" @click="bulkWithdraw">
                <NIcon name="i-ph-arrow-counter-clockwise" />
                Withdraw Selected
              </NButton>
              <NButton size="sm" btn="ghost" @click="clearSelection">
                Clear Selection
              </NButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Scrollable Content Area -->
      <div class="flex-1 overflow-hidden">
        <!-- First-load Skeleton State -->
        <TableFirstLoadSkeleton
          v-if="!hasLoadedOnce && loading"
          :rows="pageSize"
          :col-classes="[
            'w-12',
            'min-w-80 flex-1',
            'w-40',
            'w-24',
            'w-28',
            'w-16'
          ]"
          :layout="['checkbox','multi','text','pill','date','dot']"
          :show-footer="true"
        />

        <!-- Empty State -->
        <div v-else-if="hasLoadedOnce && filteredQuotes.length === 0" class="text-center py-16">
          <NIcon name="i-ph-clock" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {{ searchQuery ? 'No matching pending quotes' : 'No pending quotes' }}
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            {{ searchQuery ? 'Try adjusting your search terms.' : 'Submit some quotes to see them here while they await review.' }}
          </p>
          <NButton v-if="!searchQuery" btn="solid-black" to="/dashboard/my-quotes/drafts">
            <NIcon name="i-ph-file-dashed" />
            <span>View Drafts</span>
          </NButton>
        </div>

        <!-- Quotes Table -->
        <div v-else class="flex-1 flex flex-col dark:bg-[#0C0A09]">
          <div class="quotes-table-container flex-1 overflow-auto">
            <NTable
              :columns="tableColumns"
              :data="filteredQuotes"
              :loading="loading"
              manual-pagination
              empty-text="No pending quotes found"
              empty-icon="i-ph-clock"
            >
              <!-- Actions Header: toggle selection mode -->
              <template #actions-header>
                <div class="flex items-center justify-center gap-1">
                  <template v-if="selectionMode">
                    <NTooltip text="Select all on page">
                      <NButton
                        icon
                        btn="ghost"
                        size="2xs"
                        label="i-ph-checks"
                        :disabled="allSelectedOnPage"
                        @click="selectAllOnPage"
                      />
                    </NTooltip>
                  </template>
                  <NTooltip :text="selectionMode ? 'Deactivate selection' : 'Activate selection'">
                    <NButton
                      icon
                      btn="ghost-gray"
                      size="2xs"
                      :label="selectionMode ? 'i-ph-x' : 'i-solar-check-square-linear'"
                      @click="toggleSelectionMode"
                    />
                  </NTooltip>
                </div>
              </template>

              <!-- Actions Column -->
              <template #actions-cell="{ cell }">
                <template v-if="!selectionMode">
                  <NDropdownMenu :items="getQuoteActions(cell.row.original)">
                    <NButton
                      icon
                      btn="ghost"
                      size="xs"
                      label="i-ph-dots-three-vertical"
                      :loading="withdrawingId === cell.row.original.id"
                      :disabled="withdrawingId === cell.row.original.id"
                    />
                  </NDropdownMenu>
                </template>
                <template v-else>
                  <div class="flex items-center justify-center">
                    <NCheckbox
                      :model-value="!!rowSelection[cell.row.original.id]"
                      @update:model-value="val => setRowSelected(cell.row.original.id, val)"
                    />
                  </div>
                </template>
              </template>

              <!-- Quote Column with text wrapping -->
              <template #quote-cell="{ cell }">
                <div class="max-w-md">
                  <blockquote
                    class="text-sm text-gray-900 dark:text-white leading-relaxed whitespace-normal break-words mb-2"
                    :title="cell.row.original.name"
                  >
                    {{ cell.row.original.name }}
                  </blockquote>
                  <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span v-if="cell.row.original.author?.name">{{ cell.row.original.author?.name }}</span>
                    <span v-if="cell.row.original.author?.name && cell.row.original.reference?.name">•</span>
                    <span v-if="cell.row.original.reference?.name">{{ cell.row.original.reference?.name }}</span>
                  </div>
                </div>
              </template>

              <!-- Author Column -->
              <template #author-cell="{ cell }">
                <div v-if="cell.row.original.author" class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <NIcon name="i-ph-user" class="w-4 h-4 mr-1 flex-shrink-0" />
                  <span class="truncate">{{ cell.row.original.author.name }}</span>
                </div>
                <span v-else class="text-sm text-gray-400">—</span>
              </template>

              <!-- Reference Column -->
              <template #reference-cell="{ cell }">
                <div v-if="cell.row.original.reference" class="flex items-center text-sm text-gray-600 dark:text-gray-400 max-w-32">
                  <NIcon name="i-ph-book" class="w-4 h-4 mr-1 flex-shrink-0" />
                  <span class="truncate">{{ cell.row.original.reference.name }}</span>
                </div>
                <span v-else class="text-sm text-gray-400">—</span>
              </template>

              <!-- Tags Column -->
              <template #tags-cell="{ cell }">
                <div v-if="cell.row.original.tags?.length" class="flex flex-wrap gap-1">
                  <NBadge
                    v-for="tag in cell.row.original.tags.slice(0, 2)"
                    :key="tag.id"
                    variant="subtle"
                    size="xs"
                  >
                    {{ tag.name }}
                  </NBadge>
                  <NBadge
                    v-if="cell.row.original.tags.length > 2"
                    variant="subtle"
                    size="xs"
                    color="gray"
                    :title="cell.row.original.tags.slice(2).map((tag: any) => tag.name).join(', ')"
                  >
                    +{{ cell.row.original.tags.length - 2 }}
                  </NBadge>
                </div>
                <span v-else class="text-sm text-gray-400">—</span>
              </template>

              <!-- Status Column -->
              <template #status-cell>
                <NBadge color="orange" variant="subtle" size="xs">
                  Pending
                </NBadge>
              </template>

              <!-- Date Column -->
              <template #date-cell="{ cell }">
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatDate(cell.row.original.created_at) }}
                </span>
              </template>
            </NTable>
          </div>

          <!-- Pagination -->
          <div class="flex-shrink-0 flex items-center justify-between pt-4">
            <div class="text-sm text-gray-500 dark:text-gray-400">
              <span>Page {{ currentPage }} of {{ totalPages }}</span>
            </div>

            <NPagination
              v-model:page="currentPage"
              :total="totalQuotes"
              :items-per-page="pageSize"
              :sibling-count="2"
              show-edges
              size="sm"
            />
          </div>
        </div>
      </div>

      <!-- Quote details dialog -->
      <AdminQuoteDetailDialog
        :quote="selectedDialogQuote"
        v-model:open="showQuoteDialog"
      />
    </div>
  </div>
</template><template v-if="selectionMode">
                    <NTooltip text="Select all on page">
                      <NButton
                        icon
                        btn="ghost"
                        size="2xs"
                        label="i-ph-checks"
                        :disabled="allSelectedOnPage"
                        @click="selectAllOnPage"
                      />
                    </NTooltip>
                  </template>
                  <NTooltip :text="selectionMode ? 'Deactivate selection' : 'Activate selection'">
                    <NButton
                      icon
                      btn="ghost-gray"
                      size="2xs"
                      :label="selectionMode ? 'i-ph-x' : 'i-solar-check-square-linear'"
                      @click="toggleSelectionMode"
                    />
                  </NTooltip>
                </div>
              </template>

              <!-- Actions Column -->
              <template #actions-cell="{ cell }">
                <template v-if="!selectionMode">
                  <NDropdownMenu :items="getQuoteActions(cell.row.original)">
                    <NButton
                      icon
                      btn="ghost"
                      size="xs"
                      label="i-ph-dots-three-vertical"
                      :loading="withdrawingId === cell.row.original.id"
                      :disabled="withdrawingId === cell.row.original.id"
                    />
                  </NDropdownMenu>
                </template>
                <template v-else>
                  <div class="flex items-center justify-center">
                    <NCheckbox
                      :model-value="!!rowSelection[cell.row.original.id]"
                      @update:model-value="val => setRowSelected(cell.row.original.id, val)"
                    />
                  </div>
                </template>
              </template><template v-if="!selectionMode">
                  <NDropdownMenu :items="getQuoteActions(cell.row.original)">
                    <NButton
                      icon
                      btn="ghost"
                      size="xs"
                      label="i-ph-dots-three-vertical"
                      :loading="withdrawingId === cell.row.original.id"
                      :disabled="withdrawingId === cell.row.original.id"
                    />
                  </NDropdownMenu>
                </template>
                <template v-else>
                  <div class="flex items-center justify-center">
                    <NCheckbox
                      :model-value="!!rowSelection[cell.row.original.id]"
                      @update:model-value="val => setRowSelected(cell.row.original.id, val)"
                    />
                  </div>
                </template>
              </template>

              <!-- Quote Column with text wrapping -->
              <template #quote-cell="{ cell }">
                <div class="max-w-md">
                  <blockquote
                    class="text-sm text-gray-900 dark:text-white leading-relaxed whitespace-normal break-words mb-2"
                    :title="cell.row.original.name"
                  >
                    {{ cell.row.original.name }}
                  </blockquote>
                  <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span v-if="cell.row.original.author?.name">{{ cell.row.original.author?.name }}</span>
                    <span v-if="cell.row.original.author?.name && cell.row.original.reference?.name">•</span>
                    <span v-if="cell.row.original.reference?.name">{{ cell.row.original.reference?.name }}</span>
                  </div>
                </div>
              </template>

              <!-- Author Column -->
              <template #author-cell="{ cell }">
                <div v-if="cell.row.original.author" class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <NIcon name="i-ph-user" class="w-4 h-4 mr-1 flex-shrink-0" />
                  <span class="truncate">{{ cell.row.original.author.name }}</span>
                </div>
                <span v-else class="text-sm text-gray-400">—</span>
              </template>

              <!-- Reference Column -->
              <template #reference-cell="{ cell }">
                <div v-if="cell.row.original.reference" class="flex items-center text-sm text-gray-600 dark:text-gray-400 max-w-32">
                  <NIcon name="i-ph-book" class="w-4 h-4 mr-1 flex-shrink-0" />
                  <span class="truncate">{{ cell.row.original.reference.name }}</span>
                </div>
                <span v-else class="text-sm text-gray-400">—</span>
              </template>

              <!-- Tags Column -->
              <template #tags-cell="{ cell }">
                <div v-if="cell.row.original.tags?.length" class="flex flex-wrap gap-1">
                  <NBadge
                    v-for="tag in cell.row.original.tags.slice(0, 2)"
                    :key="tag.id"
                    variant="subtle"
                    size="xs"
                  >
                    {{ tag.name }}
                  </NBadge>
                  <NBadge
                    v-if="cell.row.original.tags.length > 2"
                    variant="subtle"
                    size="xs"
                    color="gray"
                    :title="cell.row.original.tags.slice(2).map((tag: any) => tag.name).join(', ')"
                  >
                    +{{ cell.row.original.tags.length - 2 }}
                  </NBadge>
                </div>
                <span v-else class="text-sm text-gray-400">—</span>
              </template>

              <!-- Status Column -->
              <template #status-cell>
                <NBadge color="orange" variant="subtle" size="xs">
                  Pending
                </NBadge>
              </template>

              <!-- Date Column -->
              <template #date-cell="{ cell }">
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatDate(cell.row.original.created_at) }}
                </span>
              </template>
            </NTable>
          </div>

          <!-- Pagination -->
          <div class="flex-shrink-0 flex items-center justify-between pt-4">
            <div class="text-sm text-gray-500 dark:text-gray-400">
              <span>Page {{ currentPage }} of {{ totalPages }}</span>
            </div>

            <NPagination
              v-model:page="currentPage"
              :total="totalQuotes"
              :items-per-page="pageSize"
              :sibling-count="2"
              show-edges
              size="sm"
            />
          </div>
        </div>
      </div>

      <!-- Quote details dialog -->
      <AdminQuoteDetailDialog
        :quote="selectedDialogQuote"
        v-model:open="showQuoteDialog"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProcessedQuoteResult } from '~/types'
import type { QuoteWithRelations, AdminQuote } from '~/types/quote'

// Extended interface for dashboard quotes with additional fields
interface DashboardQuote extends QuoteWithRelations {
  approved_at?: string | null
  tags?: Array<{ id: number; name: string; color: string }>
}

definePageMeta({
  layout: false,
  middleware: 'auth'
})

useHead({
  title: 'Pending Review - Dashboard - Verbatims'
})
const languageStore = useLanguageStore()
const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()

const loading = ref(true)
const loadingMore = ref(false)
const hasLoadedOnce = ref(false)
const bulkProcessing = ref(false)
const quotes = ref<DashboardQuote[]>([])
const searchQuery = ref('')
const sortBy = ref({ label: 'Most Recent', value: 'recent' })
const currentPage = ref(1)
const pageSize = ref(50)
const totalQuotes = ref(0)
const totalPages = ref(0)
const hasMore = ref(false)
// Custom selection mode
const selectionMode = ref(false)

// Scroll header state (mobile)
const scrollY = ref(0)
const lastScrollY = ref(0)
const isScrollingDown = ref(false)
const showHeaderElements = ref(true)

const handleScroll = () => {
  if (!isMobile.value) return
  scrollY.value = window.scrollY
  const scrollThreshold = 50
  if (scrollY.value > lastScrollY.value && scrollY.value > scrollThreshold) {
    isScrollingDown.value = true
    showHeaderElements.value = false
  } else if (scrollY.value < lastScrollY.value || scrollY.value <= scrollThreshold) {
    isScrollingDown.value = false
    showHeaderElements.value = true
  }
  lastScrollY.value = scrollY.value
}

const showQuoteDialog = ref(false)
const selectedDialogQuote = ref<AdminQuote | null>(null)
// Track a single in-progress withdraw (optional)
const withdrawingId = ref<number | null>(null)
// Local row selection state
const rowSelection = ref<Record<string, boolean>>({})
// Derive selected quote ids
const selectedQuotes = computed<number[]>(() => Object
  .entries(rowSelection.value)
  .filter(([, v]) => !!v)
  .map(([k]) => Number(k)))

const sortOptions = [
  { label: 'Most Recent', value: 'recent' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Author A-Z', value: 'author' }
]

const pendingQuoteActions = [
  {
    label: 'View',
    leading: 'i-ph-eye'
  },
  { divider: true } as any,
  {
    label: 'Withdraw',
    leading: 'i-ph-arrow-counter-clockwise'
  }
]
// Visible ids based on current filteredQuotes page
const visibleIds = computed<number[]>(() => filteredQuotes.value.map(q => q.id))
const allSelectedOnPage = computed<boolean>(() =>
  visibleIds.value.length > 0 && visibleIds.value.every(id => !!rowSelection.value[id])
)

const filteredQuotes = computed(() => {
  const list = [...quotes.value]
  switch (sortBy.value.value) {
    case 'oldest':
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      break
    case 'author':
      list.sort((a, b) => (a.author?.name || '').localeCompare(b.author?.name || ''))
      break
    default:
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  return list
})

const processedMobileQuotes = computed<ProcessedQuoteResult[]>(() => {
  return filteredQuotes.value.map((q: any) => ({
    ...q,
    result_type: 'quote',
    author_name: q.author_name ?? q.author?.name,
    author_is_fictional: q.author_is_fictional ?? q.author?.is_fictional,
    author_image_url: q.author_image_url ?? q.author?.image_url,
    reference_name: q.reference_name ?? q.reference?.name,
    reference_type: q.reference_type ?? q.reference?.type,
    tags: q.tags ?? [],
    author: q.author || (q.author_name ? { id: q.author_id, name: q.author_name, is_fictional: q.author_is_fictional, image_url: q.author_image_url } : undefined),
    reference: q.reference || (q.reference_name ? { id: q.reference_id, name: q.reference_name, type: q.reference_type } : undefined),
  }))
})

const tableColumns = [
  { header: '', accessorKey: 'actions', enableSorting: false, meta: { una: { tableHead: 'w-6', tableCell: 'w-6' } } },
  { header: 'Quote', accessorKey: 'quote', enableSorting: false, meta: { una: { tableHead: 'min-w-80', tableCell: 'min-w-80' } } },
  { header: 'Author', accessorKey: 'author', enableSorting: false, meta: { una: { tableHead: 'w-40', tableCell: 'w-40' } } },
  { header: 'Reference', accessorKey: 'reference', enableSorting: false, meta: { una: { tableHead: 'w-40', tableCell: 'w-40' } } },
  { header: 'Tags', accessorKey: 'tags', enableSorting: false, meta: { una: { tableHead: 'w-32', tableCell: 'w-32' } } },
  { header: 'Status', accessorKey: 'status', enableSorting: false, meta: { una: { tableHead: 'w-24', tableCell: 'w-24' } } },
  { header: 'Submitted', accessorKey: 'date', enableSorting: false, meta: { una: { tableHead: 'w-28', tableCell: 'w-28' } } }
]

const loadPendingQuotes = async (page = 1) => {
  try {
    if (page === 1) loading.value = true
    if (page > 1) loadingMore.value = true
    const queryParams: any = { page, limit: pageSize.value, status: 'pending' }
    if (languageStore.currentLanguageValue !== 'all') {
      queryParams.language = languageStore.currentLanguageValue
    }
    if (searchQuery.value) {
      queryParams.search = searchQuery.value
    }
    const response = await $fetch('/api/dashboard/submissions', { query: queryParams })
    const data = (response as any)?.data || []
    if (isMobile.value && page > 1) {
      quotes.value.push(...data)
    } else {
      quotes.value = data
      rowSelection.value = {}
    }
    totalQuotes.value = response.pagination?.total || 0
    pageSize.value = response.pagination?.limit || pageSize.value
    totalPages.value = response.pagination?.totalPages || Math.ceil((response.pagination?.total || 0) / (response.pagination?.limit || pageSize.value))
    currentPage.value = page
    hasMore.value = (response as any)?.pagination?.hasMore ?? (currentPage.value < totalPages.value)
  } catch (error) {
    console.error('Failed to load pending quotes:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
    hasLoadedOnce.value = true
  }
}

const getQuoteActions = (quote: DashboardQuote) => [
  {
    label: 'View Details',
    leading: 'i-ph-eye',
    onclick: () => viewQuote(quote)
  },
  {}, // Divider
  {
    label: 'Withdraw',
    leading: 'i-ph-arrow-counter-clockwise',
    disabled: withdrawingId.value === quote.id,
    onclick: () => withdrawQuote(quote)
  }
]

const viewQuote = (quote: DashboardQuote) => {
  selectedDialogQuote.value = quote as unknown as AdminQuote
  showQuoteDialog.value = true
}

const withdrawQuote = async (quote: DashboardQuote) => {
  const { toast } = useToast()
  try {
    withdrawingId.value = quote.id
    await $fetch(`/api/quotes/${quote.id}/withdraw`, { method: 'POST' } as any)
    quotes.value = quotes.value.filter(q => q.id !== quote.id)
  } catch (error) {
    console.error('Failed to withdraw quote:', error)
    toast({ title: 'Withdraw failed', description: 'Please try again.' })
  } finally {
    withdrawingId.value = null
  }
}

const clearSelection = () => {
  rowSelection.value = {}
}

const toggleSelectionMode = () => {
  selectionMode.value = !selectionMode.value
  if (!selectionMode.value) clearSelection()
}

const setRowSelected = (id: number, value: boolean | 'indeterminate') => {
  rowSelection.value[id] = value === true
}

const selectAllOnPage = () => {
  visibleIds.value.forEach(id => (rowSelection.value[id] = true))
}

// Keyboard shortcut: Cmd/Ctrl + A to select all (only when selection mode is active)
const onKeydown = (e: KeyboardEvent) => {
  if (!selectionMode.value) return
  const isMac = navigator.platform.toLowerCase().includes('mac')
  const metaPressed = isMac ? e.metaKey : e.ctrlKey
  if (metaPressed && (e.key === 'a' || e.key === 'A')) {
    e.preventDefault()
    selectAllOnPage()
  }
}

const bulkWithdraw = async () => {
  if (selectedQuotes.value.length === 0) return
  const { toast } = useToast()
  try {
    bulkProcessing.value = true
    const ids = [...selectedQuotes.value]
    await $fetch('/api/quotes/withdraw', {
      method: 'POST',
      body: { ids }
    })

    quotes.value = quotes.value.filter(q => !ids.includes(q.id))
    rowSelection.value = {}
  } catch (error) {
    console.error('Failed to bulk withdraw:', error)
    const { toast } = useToast()
    toast({ title: 'Bulk withdraw failed', description: 'Please try again.' })
  } finally {
    bulkProcessing.value = false
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  sortBy.value.value = 'recent'
  currentPage.value = 1
  loadPendingQuotes(1)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

watch(currentPage, () => {
  // Desktop paginated table only
  if (!isMobile.value) {
    loadPendingQuotes(currentPage.value)
  }
})

watchDebounced([searchQuery, sortBy], () => {
  currentPage.value = 1
  loadPendingQuotes(1)
}, { debounce: 300 })

onMounted(() => {
  setPageLayout(currentLayout.value)
  loadPendingQuotes()
  window.addEventListener('keydown', onKeydown)
  // Add mobile scroll listener
  if (isMobile.value) {
    window.addEventListener('scroll', handleScroll, { passive: true })
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  if (isMobile.value) {
    window.removeEventListener('scroll', handleScroll)
  }
})

watch(currentLayout, (newLayout) => {
  setPageLayout(newLayout)
})

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  await loadPendingQuotes(currentPage.value + 1)
}
</script>

<style scoped>
.quotes-table-container {
  max-height: calc(100vh - 22rem);
}

.mobile-pending-page {
  /* Ensure proper spacing for mobile layout */
  min-height: calc(100vh - 80px); /* Account for bottom navigation */
}
</style>
