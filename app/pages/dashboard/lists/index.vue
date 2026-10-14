<template>
  <div :aria-busy="loading">
    <!-- Header -->
    <div class="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div class="hidden md:block" aria-hidden="true" />
      <div class="hidden items-center justify-end gap-3 md:flex">
        <template v-if="hasLoadedOnce && (totalCollections > 0 || searchQuery.trim() || visibilityValue !== 'all')">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('search_placeholder') as string"
          class="h-10 w-52 rounded-md border border-gray-300 bg-white/50 px-3 font-sans text-sm text-gray-800 placeholder-gray-500 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:border-white/15 dark:bg-white/5 dark:text-gray-200 dark:placeholder-gray-400 dark:focus:border-gray-400 dark:focus:ring-white/10"
        />
        <NCombobox
          :model-value="visibilityOptions.find(o => o.value === visibilityValue) || visibilityOptions[0]"
          @update:model-value="(v: any) => { if (v) visibilityValue = v.value }"
          :items="visibilityOptions"
          by="value"
          :_combobox-list="{ class: 'min-w-[180px]' }"
          :_combobox-trigger="{
            btn: 'ghost-gray',
            size: 'sm',
            trailing: 'i-ph-caret-down',
            class: 'h-10 gap-2 rounded-md border border-gray-300 bg-white/50 px-3 text-sm font-medium text-gray-800 hover:bg-gray-100 dark:border-white/15 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10',
          }"
        >
          <template #trigger="{ modelValue }">
            <span class="whitespace-nowrap text-sm font-medium leading-none">{{ modelValue?.label }}</span>
          </template>
        </NCombobox>
        </template>
        <NTooltip v-if="filteredCollections.length" :content="String($t(selectionMode ? 'common.done' : 'select_button'))">
          <NButton
            icon
            btn="ghost-gray"
            size="sm"
            class="h-10 w-10 rounded-full"
            :label="selectionMode ? 'i-tabler-x' : 'i-tabler-checkbox'"
            :aria-label="String($t(selectionMode ? 'common.done' : 'select_button'))"
            :aria-pressed="selectionMode"
            @click="toggleSelectionMode"
          />
        </NTooltip>
        <NButton
          v-if="!isPristineEmpty"
          btn="solid-black"
          size="sm"
          trailing="i-tabler-playlist-add"
          class="gap-2 bg-gray-900 font-sans text-xs text-gray-50 transition-[transform,background-color] hover:bg-gray-700 active:scale-99 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
          @click="openCreateModal"
        >
          {{ $t('create_button') }}
        </NButton>
      </div>
      <div class="mt-5 space-y-3 md:hidden">
        <template v-if="hasLoadedOnce && (totalCollections > 0 || searchQuery.trim() || visibilityValue !== 'all')">
        <div class="flex w-full gap-2">
          <input
            v-model="searchQuery"
            type="text"
            :aria-label="$t('search_placeholder') as string"
            :placeholder="$t('search_placeholder') as string"
            class="h-10 min-w-0 flex-1 rounded-md border border-gray-300 bg-white/50 px-3 font-sans text-sm text-gray-800 placeholder-gray-500 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:border-white/15 dark:bg-white/5 dark:text-gray-200 dark:placeholder-gray-400 dark:focus:border-gray-400 dark:focus:ring-white/10"
          />
          <NButton icon btn="outline-gray" size="sm" label="i-ph-faders" class="h-10 w-10 shrink-0 rounded-md" :aria-label="String(pageT('open_filters'))" @click="mobileFiltersOpen = true" />
        </div>
        </template>
        <div v-if="!isPristineEmpty" class="flex w-full gap-2">
          <NTooltip v-if="filteredCollections.length" :content="String($t(selectionMode ? 'common.done' : 'select_button'))">
            <NButton
              icon
              btn="outline-gray"
              class="h-11 w-11 shrink-0 rounded-full"
              :label="selectionMode ? 'i-tabler-x' : 'i-tabler-checkbox'"
              :aria-label="String($t(selectionMode ? 'common.done' : 'select_button'))"
              :aria-pressed="selectionMode"
              @click="toggleSelectionMode"
            />
          </NTooltip>
          <NButton
            btn="solid-black"
            trailing="i-tabler-playlist-add"
            class="min-h-11 flex-1 justify-center gap-2 bg-gray-900 px-4 font-sans text-sm font-600 text-gray-50 transition-[transform,background-color] hover:bg-gray-700 active:scale-99 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
            @click="openCreateModal"
          >
            {{ $t('create_button') }}
          </NButton>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="divide-y divide-gray-100 dark:divide-gray-800">
      <div v-for="i in 5" :key="i" class="animate-pulse py-5">
        <div class="h-5 bg-gray-100 dark:bg-gray-800 rounded w-1/3 mb-3" />
        <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3 mb-2" />
        <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
      </div>
    </div>

    <!-- Empty -->
    <div
      v-else-if="filteredCollections.length === 0"
      class="text-center"
      :class="isPristineEmpty
        ? 'rounded-2xl bg-[#E6E4DD] px-5 py-14 dark:bg-[#17191e] sm:px-8 sm:py-20'
        : 'py-16'"
    >
      <DashboardEmptyStateCopy
        :heading="String(searchQuery ? pageT('empty_search_title') : pageT('empty_title'))"
        :description="String(searchQuery ? pageT('empty_search_desc') : pageT('empty_desc'))"
      />
      <NButton
        v-if="isPristineEmpty"
        btn="solid-black"
        trailing="i-tabler-playlist-add"
        class="mt-7 min-h-11 justify-center gap-2 rounded-md bg-gray-900 px-5 font-sans text-sm font-600 text-gray-50 transition-[transform,background-color] duration-150 hover:bg-gray-700 active:scale-96 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#E6E4DD] motion-reduce:transition-none motion-reduce:active:scale-100 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300 dark:focus-visible:ring-gray-300 dark:focus-visible:ring-offset-[#17191e]"
        @click="openCreateModal"
      >
        {{ $t('create_button') }}
      </NButton>
    </div>

    <!-- Feed -->
    <div v-else class="divide-y divide-gray-200/80 dark:divide-white/10">
      <div
        v-for="(collection, idx) in filteredCollections"
        :key="collection.id"
        class="group cursor-pointer rounded-lg px-3 py-6 transition-[padding,background-color] duration-200 hover:bg-black/[0.025] focus-within:bg-black/[0.025] dark:hover:bg-white/[0.035] dark:focus-within:bg-white/[0.035] sm:px-5 sm:py-8 animate-fade-in-up"
        :class="selectionMode
          ? rowSelection[collection.id] ? 'bg-black/[0.04] dark:bg-white/[0.06]' : 'bg-black/[0.015] dark:bg-white/[0.02]'
          : ''"
        :style="{ animationDelay: `${idx * 0.05}s` }"
        :data-dashboard-collection-row="collection.id"
        role="group"
        :aria-label="collection.name"
        :tabindex="selectionMode ? 0 : undefined"
        @click="!selectionMode && navigateToCollection(collection)"
        @click.capture="handleCollectionRowClick($event, collection.id)"
        @keydown.capture="handleCollectionRowKeydown($event, collection.id)"
      >
        <ContextMenu size="xs" native-on-modifier="ctrl" :items="getCollectionContextMenuActions(collection)">
          <div class="flex items-start transition-[gap] duration-200 ease-out motion-reduce:transition-none" :class="selectionMode ? 'gap-3' : 'gap-0'">
          <DashboardSelectionCheckbox
            :visible="selectionMode"
            :label="String($t('select_list', { name: collection.name }))"
            :model-value="!!rowSelection[collection.id]"
            @toggle="toggleCollection(collection.id)"
          />
          <div class="flex min-w-0 flex-1 items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
              <NuxtLink
                :to="`/dashboard/lists/${collection.id}`"
                data-selection-primary
                class="font-serif text-2xl font-500 leading-snug text-gray-900 transition-colors group-hover:text-gray-700 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700 dark:text-gray-100 dark:group-hover:text-gray-300 dark:focus-visible:outline-gray-300 sm:text-3xl"
                @click.stop
              >
                {{ collection.name }}
              </NuxtLink>
              <NTooltip :content="String(collection.isPublic ? $t('common.public') : $t('common.private'))">
                <span
                  class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors group-hover:bg-black/5 dark:text-gray-400 dark:group-hover:bg-white/10"
                  role="img"
                  :aria-label="String(collection.isPublic ? $t('common.public') : $t('common.private'))"
                >
                  <NIcon :name="collection.isPublic ? 'i-tabler-world' : 'i-tabler-lock'" class="h-4 w-4" />
                </span>
              </NTooltip>
            </div>

            <p v-if="collection.description" class="mt-2 max-w-3xl font-sans text-sm leading-relaxed text-gray-700 dark:text-gray-300 line-clamp-2">
              {{ collection.description }}
            </p>

            <div v-if="collection.preview_quotes?.length" class="mt-4 space-y-1 border-l border-gray-500/20 pl-3">
              <QuoteEditorialText
                v-for="quote in collection.preview_quotes.slice(0, 2)"
                :key="quote.id"
                :text="quote.name"
                class="quote-editorial-surface line-clamp-1 text-base text-gray-800 dark:text-gray-200"
              />
            </div>

            <div class="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-sm text-gray-500 dark:text-gray-400">
              <span>{{ collection.quotes_count || 0 }} {{ (collection.quotes_count || 0) === 1 ? $t('common.quote_singular') : $t('common.quote_plural') }}</span>
              <NTooltip v-if="collection.createdAt || collection.updatedAt" :content="formatCollectionDateTooltip(collection)">
                <time class="cursor-default decoration-gray-400/50 underline decoration-dotted underline-offset-4">
                  {{ collection.createdAt ? $t('common.created') : $t('common.updated') }} {{ formatCollectionDateRelative(collection) }}
                </time>
              </NTooltip>
            </div>
          </div>

          <div class="hidden md:flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <NDropdownMenu :items="getCollectionActions(collection)">
              <NButton
                icon
                btn="ghost-gray"
                size="xs"
                label="i-ph-dots-three-vertical"
                @click.stop
              />
            </NDropdownMenu>
          </div>
        </div>
          </div>
      </ContextMenu>
      </div>
    </div>

    <!-- Spacer for sticky footer -->
    <div v-if="totalPages > 1 || (hasLoadedOnce && selectionMode)" class="h-20" />

    <!-- Create / Edit Collection Modal -->
    <CollectionFormModal
      :key="formModalKey"
      v-model="showFormModal"
      :collection="selectedCollection"
      @saved="handleCollectionSaved"
    />

    <!-- Client-only modals (SSR incompatible due to reka-ui) -->
    <ClientOnly>
      <NDialog v-model="showDeleteModal">
        <NCard>
          <template #header>
            <h3 class="text-lg font-semibold">{{ $t('delete_dialog_title') }}</h3>
          </template>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            {{ $t('delete_dialog_body', { name: selectedCollection?.name || '' }) }}
          </p>
          <template #footer>
            <div class="flex justify-end space-x-3">
              <NButton btn="outline" @click="showDeleteModal = false">{{ $t('common.cancel') }}</NButton>
              <NButton color="red" :loading="deleting" @click="deleteCollection">{{ $t('common.delete') }}</NButton>
            </div>
          </template>
        </NCard>
      </NDialog>

      <CollectionActionsDrawer
        v-model:open="showActionsDrawer"
        :collection="selectedCollection"
        @view="handleViewFromDrawer"
        @edit="handleEditFromDrawer"
        @delete="handleDeleteFromDrawer"
      />
    </ClientOnly>

      <ClientOnly>
        <NDialog v-model="showBulkDeleteModal">
          <NCard>
            <template #header>
              <h3 class="text-lg font-semibold">{{ $t('delete_selected_title', { count: selectedCollections.length }) }}</h3>
            </template>
            <p class="mb-4 text-gray-600 dark:text-gray-400">
              {{ $t('delete_selected_body', { count: selectedCollections.length }) }}
            </p>
            <template #footer>
              <div class="flex justify-end gap-3">
                <NButton btn="outline" :disabled="bulkDeleting" @click="showBulkDeleteModal = false">{{ $t('common.cancel') }}</NButton>
                <NButton color="red" :loading="bulkDeleting" @click="deleteSelectedCollections">{{ $t('label_delete') }}</NButton>
              </div>
            </template>
          </NCard>
        </NDialog>
      </ClientOnly>

    <!-- Sticky Pagination Footer -->
    <div
      v-if="totalPages > 1 || (hasLoadedOnce && selectionMode)"
      class="fixed bottom-0 z-20 flex items-center justify-between gap-4 rounded-t-2xl border border-b-0 border-[#d8d4cb] bg-[#e7e4dd] px-5 py-3 shadow-[0_-6px_18px_rgba(12,10,9,0.06)] transition-[left,width] duration-300 ease-in-out dark:border-white/10 dark:bg-[#17191e] sm:px-8 lg:px-12"
      :style="{ left: footerLeftOffset + 'px', width: footerWidth }"
    >
      <span class="font-sans text-xs text-gray-500 dark:text-gray-400">
        Page
        <button
          class="rounded-md px-1.5 py-0.5 font-medium text-gray-800 transition-colors hover:bg-black/5 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white"
          @click="showPageJumpDialog = true"
        >
          {{ currentPage }}
        </button>
        of {{ totalPages }}
      </span>
      <DashboardBulkSelectionControls
        class="min-w-0 flex-1"
        :selection-mode="selectionMode"
        :selected-count="selectedCollections.length"
        :visible-count="filteredCollections.length"
        :actions="bulkSelectionActions"
        @toggle-visible="toggleSelectAllVisible"
        @clear="clearSelection"
        @exit-mode="exitSelectionMode"
        @action="handleBulkSelectionAction"
      />
      <div class="flex items-center gap-2">
        <NButton v-if="currentPage > 1" btn="outline-gray" size="sm" rounded="full" :aria-label="$t('common.previous') as string" class="px-2 font-sans text-xs transition-transform active:scale-98 sm:px-4" @click="currentPage = Math.max(1, currentPage - 1)">
          <NIcon name="i-tabler-arrow-left" class="h-4 w-4" /><span class="sr-only sm:not-sr-only">{{ $t('common.previous') }}</span>
        </NButton>
        <NButton v-if="currentPage < totalPages" btn="outline-gray" size="sm" rounded="full" :aria-label="$t('common.next') as string" class="px-2 font-sans text-xs transition-transform active:scale-98 sm:px-4" @click="currentPage = Math.min(totalPages, currentPage + 1)">
          <span class="sr-only sm:not-sr-only">{{ $t('common.next') }}</span><NIcon name="i-tabler-arrow-right" class="h-4 w-4" />
        </NButton>
      </div>
    </div>

    <!-- Page Jump Dialog -->
    <PageJumpDialog
      v-model="showPageJumpDialog"
      :total-pages="totalPages"
      @jump="onPageJump"
    />
    <ClientOnly>
      <DashboardMobileFiltersDrawer
        v-model:open="mobileFiltersOpen"
        v-model:filter-value="visibilityValue"
        :title="String(pageT('filter_title'))"
        :filter-label="String(pageT('visibility'))"
        :filter-options="visibilityOptions"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { formatDashboardQuoteDateRelative, formatDashboardQuoteDateTooltip } from '~/utils/dashboard-quote-date'

// Extended interface for dashboard collections with additional fields
interface DashboardCollection extends CollectionWithStats {
  preview_quotes?: Array<{ id: number; name: string; author?: { name: string } }>
  views_count?: number
  // Drizzle returns camelCase for JS property names even when SQL columns are snake_case
  isPublic?: boolean
  createdAt?: string | null
  updatedAt?: string | null
  userId?: number
}

definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

const { $t } = useI18n()
const { locale } = useI18nLocale()
const { user } = useUserSession()
const collectionsCount = useState<number | null>(`dashboard-collections-count-${String(user.value?.id ?? 'anonymous')}`, () => null)
const pageT = useI18n().$_t({ ...useRoute() })

const formatCollectionDateRelative = (collection: DashboardCollection) => {
  const date = collection.createdAt || collection.updatedAt
  return formatDashboardQuoteDateRelative({ createdAt: date }, 'draft', locale.value || 'en') || ''
}

const formatCollectionDateTooltip = (collection: DashboardCollection) => {
  const date = collection.createdAt || collection.updatedAt
  return formatDashboardQuoteDateTooltip({ createdAt: date }, 'draft', locale.value || 'en') || ''
}

useHead({
  title: $t('meta_title') as string
})

const pageHeader = usePageHeader()

onMounted(() => {
  pageHeader.setHeaderFromRoute()
})

const loading = ref(true)
const hasLoadedOnce = ref(false)
const deleting = ref(false)
const bulkDeleting = ref(false)
const collections = ref<DashboardCollection[]>([])
const searchQuery = ref('')
const visibilityOptions = computed(() => [
  { label: $t('filter_all'), value: 'all' },
  { label: $t('filter_public'), value: 'public' },
  { label: $t('filter_private'), value: 'private' }
])

const visibilityValue = ref('all')
const mobileFiltersOpen = ref(false)
const currentPage = ref(1)
const totalPages = ref(0)
const totalCollections = ref(0)
const isPristineEmpty = computed(() =>
  hasLoadedOnce.value &&
  totalCollections.value === 0 &&
  !searchQuery.value.trim() &&
  visibilityValue.value === 'all'
)

const visibilityFilter = computed(() => {
  const option = visibilityOptions.value.find(o => o.value === visibilityValue.value)
  return option || visibilityOptions.value[0]
})

const showFormModal = ref(false)
const formModalKey = ref(0)
const showDeleteModal = ref(false)
const showBulkDeleteModal = ref(false)
const showActionsDrawer = ref(false)
const selectedCollection = ref<DashboardCollection | null>(null)
const selectionMode = ref(false)
const rowSelection = ref<Record<number, boolean>>({})
const selectedCollections = computed(() => Object.entries(rowSelection.value)
  .filter(([, selected]) => selected)
  .map(([id]) => Number(id)))
const allVisibleSelected = computed(() => filteredCollections.value.length > 0
  && filteredCollections.value.every(collection => rowSelection.value[collection.id]))
const { showErrorToast } = useErrorToast()
const bulkSelectionActions = computed(() => [
  { key: 'delete', label: String($t('delete_selected_action')), icon: 'i-tabler-trash', disabled: bulkDeleting.value }
])

const filteredCollections = computed(() => {
  let filtered = [...collections.value]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(collection =>
      collection.name.toLowerCase().includes(query) ||
      collection.description?.toLowerCase().includes(query)
    )
  }

  if (visibilityFilter.value?.value !== 'all') {
    filtered = filtered.filter(collection =>
      visibilityFilter.value?.value === 'public' ? collection.isPublic : !collection.isPublic
    )
  }

  return filtered
})

const loadCollections = async () => {
  try {
    loading.value = true
    const response = await $fetch<{
      success: boolean
      data: { results: DashboardCollection[] }
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }>('/api/dashboard/collections', {
      query: { page: currentPage.value, limit: 12 }
    })

    collections.value = response.data?.results || []
    totalCollections.value = response.pagination?.total ?? 0
    collectionsCount.value = totalCollections.value
    totalPages.value = response.pagination?.totalPages ?? 1
  } catch (error) {
    console.error('Failed to load collections:', error)
  } finally {
    loading.value = false
    hasLoadedOnce.value = true
  }
}

const clearSelection = () => {
  rowSelection.value = {}
}

watch(currentPage, () => {
  clearSelection()
  loadCollections()
})

watch([searchQuery, visibilityValue], clearSelection)

const exitSelectionMode = () => {
  selectionMode.value = false
  clearSelection()
}

const toggleSelectionMode = () => {
  if (selectionMode.value) exitSelectionMode()
  else selectionMode.value = true
}

const selectCollection = (id: number) => {
  selectionMode.value = true
  clearSelection()
  rowSelection.value[id] = true
}

const toggleCollection = (id: number) => {
  if (!selectionMode.value) return
  rowSelection.value[id] = !rowSelection.value[id]
  if (selectedCollections.value.length === 0) exitSelectionMode()
}

const toggleSelectAllVisible = () => {
  if (allVisibleSelected.value) {
    clearSelection()
    exitSelectionMode()
    return
  }
  for (const collection of filteredCollections.value) rowSelection.value[collection.id] = true
}

const handleCollectionRowClick = (event: MouseEvent, id: number) => {
  if (!selectionMode.value) return
  const target = event.target as Element | null
  if (!target || target.closest('[data-selection-ignore]')) return
  const primaryLink = !!target.closest('[data-selection-primary]')
  const otherInteractive = !!target.closest('a, button, input, select, [role="button"]') && !primaryLink
  if (otherInteractive) return
  event.preventDefault()
  event.stopPropagation()
  toggleCollection(id)
}

const handleCollectionRowKeydown = (event: KeyboardEvent, id: number) => {
  if (!selectionMode.value || (event.key !== ' ' && event.key !== 'Spacebar' && event.key !== 'Enter')) return
  const target = event.target as Element | null
  if (target?.closest('[data-selection-ignore], button, input, select, textarea, [contenteditable="true"]')) return
  event.preventDefault()
  event.stopPropagation()
  toggleCollection(id)
}

const navigateToCollection = (collection: DashboardCollection) => {
  navigateTo(`/dashboard/lists/${collection.id}`)
}

const getCollectionActions = (collection: DashboardCollection) => [
  {
    label: $t('label_edit') as string,
    leading: 'i-ph-pencil',
    onclick: () => editCollection(collection)
  },
  {
    label: $t('label_delete') as string,
    leading: 'i-ph-trash',
    onclick: () => confirmDelete(collection)
  },
]

const getCollectionContextMenuActions = (collection: DashboardCollection) => [
  ...(!selectionMode.value ? [{
    label: $t('select_this_list', { name: collection.name }) as string,
    leading: 'i-tabler-checkbox',
    onclick: () => selectCollection(collection.id)
  }, {}] : []),
  {
    label: $t('action_view') as string,
    leading: 'i-ph-eye',
    onclick: () => navigateToCollection(collection)
  },
  {},
  {
    label: $t('label_edit') as string,
    leading: 'i-ph-pencil',
    onclick: () => editCollection(collection)
  },
  {
    label: $t('label_delete') as string,
    leading: 'i-ph-trash',
    onclick: () => confirmDelete(collection)
  }
]

const openCreateModal = () => {
  selectedCollection.value = null
  showFormModal.value = true
}

const editCollection = (collection: DashboardCollection) => {
  selectedCollection.value = collection
  formModalKey.value++
  showFormModal.value = true
}

const confirmDelete = (collection: DashboardCollection) => {
  selectedCollection.value = collection
  showDeleteModal.value = true
}

const deleteCollection = async () => {
  if (!selectedCollection.value) return

  deleting.value = true
  try {
    await $fetch(`/api/collections/${selectedCollection.value.id}`, {
      method: 'DELETE'
    } as any)

    collections.value = collections.value.filter(c => c.id !== selectedCollection.value?.id)
    totalCollections.value = Math.max(0, totalCollections.value - 1)
    collectionsCount.value = totalCollections.value
    showDeleteModal.value = false
    selectedCollection.value = null
  } catch (error) {
    console.error('Failed to delete collection:', error)
  } finally {
    deleting.value = false
  }
}

const handleBulkSelectionAction = (action: string) => {
  if (action === 'delete' && selectedCollections.value.length > 0 && !bulkDeleting.value) {
    showBulkDeleteModal.value = true
  }
}

const deleteSelectedCollections = async () => {
  const ids = [...selectedCollections.value]
  if (!ids.length || bulkDeleting.value) return

  bulkDeleting.value = true
  try {
    await $fetch('/api/collections/bulk', {
      method: 'DELETE',
      body: { collectionIds: ids }
    })

    collections.value = collections.value.filter(collection => !ids.includes(collection.id))
    const remainingTotal = Math.max(0, totalCollections.value - ids.length)
    const nextTotalPages = Math.max(1, Math.ceil(remainingTotal / 12))
    totalCollections.value = remainingTotal
    collectionsCount.value = remainingTotal
    showBulkDeleteModal.value = false
    exitSelectionMode()
    if (currentPage.value > nextTotalPages) currentPage.value = nextTotalPages
    else if (collections.value.length < Math.min(12, remainingTotal)) await loadCollections()
  } catch (error) {
    showErrorToast(error, String($t('delete_selected_error')))
  } finally {
    bulkDeleting.value = false
  }
}

const handleCollectionSaved = (collection: DashboardCollection) => {
  const index = collections.value.findIndex(c => c.id === collection.id)
  if (index !== -1) {
    collections.value[index] = collection
  } else {
    collections.value.unshift(collection)
    totalCollections.value += 1
    collectionsCount.value = totalCollections.value
  }
  showFormModal.value = false
  selectedCollection.value = null
}

const handleCollectionLongPress = (collection: DashboardCollection) => {
  selectedCollection.value = collection
  showActionsDrawer.value = true
}

const handleViewFromDrawer = () => {
  if (selectedCollection.value) {
    navigateToCollection(selectedCollection.value)
  }
}

const handleEditFromDrawer = () => {
  formModalKey.value++
  showFormModal.value = true
}

const handleDeleteFromDrawer = () => {
  showDeleteModal.value = true
}

const showPageJumpDialog = ref(false)

const onPageJump = (page: number) => {
  currentPage.value = page
}

const footerLeftOffset = ref(0)
const footerWidth = ref('100%')

let footerObserver: ResizeObserver | null = null

const updateFooterPosition = () => {
  const panelEl = document.querySelector('.dashboard-data-panel-shell')
  if (!panelEl) {
    footerLeftOffset.value = 0
    footerWidth.value = '100%'
    return
  }
  const rect = panelEl.getBoundingClientRect()
  footerLeftOffset.value = rect.left
  footerWidth.value = `${rect.width}px`
}

onMounted(() => {
  loadCollections()
  updateFooterPosition()
  footerObserver = new ResizeObserver(updateFooterPosition)
  const panelEl = document.querySelector('.dashboard-data-panel-shell')
  if (panelEl) footerObserver.observe(panelEl)
  window.addEventListener('resize', updateFooterPosition)
})

onUnmounted(() => {
  if (footerObserver) footerObserver.disconnect()
  window.removeEventListener('resize', updateFooterPosition)
})
</script>

<style scoped>
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out both;
}

.line-clamp-1 {
  display: -webkit-box;
  line-clamp: 1;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
