<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="space-y-6">
      <div class="animate-pulse">
        <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/4 mb-4" />
        <div class="h-8 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-3" />
        <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-2/3 mb-6" />
        <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
      </div>
      <div class="space-y-5">
        <div v-for="i in 4" :key="i" class="animate-pulse pb-5 border-b border-dashed border-gray-100 dark:border-gray-800">
          <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4 mb-2" />
          <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="!collection" class="py-16 text-center">
      <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">{{ $t('error_title') }}</p>
      <p class="font-sans text-sm text-gray-500 dark:text-gray-400 mb-6">{{ $t('error_desc') }}</p>
      <NuxtLink to="/dashboard/lists" class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors border-b border-dashed border-gray-300 dark:border-gray-600 pb-0.5">
        &larr; {{ $t('back_to_lists') }}
      </NuxtLink>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Header -->
      <div class="mb-8">
        <NuxtLink to="/dashboard/lists" class="mb-4 inline-flex items-center gap-1 font-sans text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
          &larr; {{ $t('back_to_lists') }}
        </NuxtLink>

        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h2 class="font-serif text-2xl font-500 leading-tight text-gray-900 dark:text-gray-100 sm:text-3xl break-words">
                {{ collection.name }}
              </h2>
              <span
                v-if="collection.is_public"
                class="hidden md:inline font-sans text-xs text-green-600 dark:text-green-400 flex-shrink-0"
              >
                {{ $t('common.public') }}
              </span>
              <span
                v-else
                class="hidden md:inline font-sans text-xs text-gray-400 dark:text-gray-500 flex-shrink-0"
              >
                {{ $t('common.private') }}
              </span>
            </div>

            <p v-if="collection.description" class="font-sans text-sm text-gray-500 dark:text-gray-400 mb-3 leading-relaxed max-w-2xl">
              {{ collection.description }}
            </p>

            <div class="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
              <span>{{ collection.quotes_count || 0 }} {{ (collection.quotes_count || 0) === 1 ? $t('common.quote_singular') : $t('common.quote_plural') }}</span>
              <span class="text-gray-200 dark:text-gray-700">·</span>
              <span>{{ $t('common.created') }} {{ formatDate(collection.created_at) }}</span>
              <span v-if="collection.updated_at" class="text-gray-200 dark:text-gray-700">·</span>
              <span v-if="collection.updated_at">{{ $t('common.updated') }} {{ formatDate(collection.updated_at) }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <button
              @click="shareCollection"
              class="hidden md:inline-flex items-center gap-1.5 font-sans text-xs text-gray-600 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-sm"
            >
              {{ $t('button_share') }}
            </button>
            <NDropdownMenu :items="collectionActions">
              <NButton icon btn="ghost" size="xs" label="i-ph-dots-three-vertical" @click.stop />
            </NDropdownMenu>
          </div>
        </div>

        <div class="md:hidden mt-3 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
          <span
            class="font-sans"
            :class="collection.is_public ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'"
          >
            {{ collection.is_public ? $t('common.public') : $t('common.private') }}
          </span>
          <span class="text-gray-200 dark:text-gray-700">·</span>
          <button @click="shareCollection" class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">{{ $t('button_share') }}</button>
        </div>
      </div>

      <!-- Empty -->
      <div v-if="!collection.quotes?.length" class="py-16 text-center">
        <p class="font-serif text-xl font-200 text-gray-400 dark:text-gray-500 mb-2">{{ $t('empty_title') }}</p>
        <p class="font-sans text-sm text-gray-500 dark:text-gray-400">{{ $t('empty_desc') }}</p>
      </div>

      <!-- Quotes Feed -->
      <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
        <ContextMenu
          v-for="(quote, idx) in collection.quotes"
          :key="quote.id"
          size="xs"
          native-on-modifier="ctrl"
          trigger-as="div"
          wrapper-class="w-full"
          :items="getQuoteActions(quote, idx)"
        >
        <div
          class="py-5 first:pt-0 last:pb-0 group animate-fade-in-up"
          :class="[selectionMode ? 'px-2 rounded-md transition-colors hover:bg-black/[0.025] dark:hover:bg-white/[0.035]' : '', selectionMode && rowSelection[quote.id] ? 'bg-black/[0.035] dark:bg-white/[0.05]' : '']"
          :data-dashboard-quote-row="quote.id"
          :data-dashboard-selection-row="selectionMode ? quote.id : undefined"
          :tabindex="selectionMode ? 0 : -1"
          :style="{ animationDelay: `${idx * 0.05}s` }"
          @pointerdown="!selectionMode && longPress.start($event, quote)"
          @pointermove="longPress.move($event)"
          @pointerup="longPress.end"
          @pointercancel="longPress.end"
          @contextmenu.capture="handleCollectionContextMenu($event, quote)"
          @click.capture="handleCollectionRowClick($event, idx, quote.id)"
          @keydown.capture="quoteKeyboard.handleRowKeydown($event, idx, quote.id)"
        >
          <div class="flex items-start transition-[gap] duration-200 ease-out motion-reduce:transition-none" :class="selectionMode ? 'gap-3' : 'gap-4'">
            <DashboardSelectionCheckbox
              :visible="selectionMode"
              :label="String($t('common.select_quote', { quote: quote.name }))"
              :model-value="!!rowSelection[quote.id]"
              @toggle="toggleQuote(idx, quote.id, $event.shiftKey)"
            />
            <NuxtLink :to="`/quotes/${quote.id}`" data-selection-primary class="quote-editorial-link flex-1 min-w-0 block">
              <QuoteEditorialText :text="quote.name" class="line-clamp-2 text-lg tracking-[-0.01em] md:text-xl" />
              <div class="flex items-center gap-2 mt-2 flex-wrap">
                <span class="font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ (quote as any).author?.name || (quote as any).author_name || $t('common.unknown') }}</span>
                <span v-if="(quote as any).reference?.name || (quote as any).reference_name" class="text-gray-300 dark:text-gray-600">·</span>
                <span v-if="(quote as any).reference?.name || (quote as any).reference_name" class="font-sans text-sm text-gray-600 dark:text-gray-400">{{ (quote as any).reference?.name || (quote as any).reference_name }}</span>
                <span class="text-gray-300 dark:text-gray-600">·</span>
                <span class="font-sans text-sm text-gray-500 dark:text-gray-400">{{ $t('common.added') }} {{ formatDate(quote.added_at) }}</span>
              </div>
            </NuxtLink>
            <div v-if="!selectionMode" class="hidden md:flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
              <NTooltip :content="$t('tooltip_share') as string">
                <button @click.stop="handleShareQuote(quote)" class="p-1.5 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  <NIcon name="i-ph-share" class="w-4 h-4" />
                </button>
              </NTooltip>
              <NTooltip :content="$t('tooltip_remove') as string">
                <button @click.stop="handleRemoveFromCollection(quote)" class="p-1.5 rounded-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                  <NIcon name="i-ph-x" class="w-4 h-4" />
                </button>
              </NTooltip>
            </div>
            <button
              v-if="!selectionMode"
              type="button"
              class="sr-only rounded-md p-2 focus:not-sr-only focus:absolute focus:z-10 focus:bg-[#e7e4dd] focus:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 dark:focus:bg-[#17191e] dark:focus:text-gray-100"
              :aria-label="$t('components.quote_actions.quick_actions') as string"
              @click.stop="openMobileQuoteActions(quote)"
            >
              <NIcon name="i-ph-dots-three" class="h-5 w-5" />
            </button>
          </div>
        </div>
        </ContextMenu>
      </div>

      <!-- Spacer for sticky footer -->
      <div v-if="totalPages > 1 || selectionMode" class="h-20" />
    </div>
  </div>

  <!-- Sticky Pagination Footer -->
  <div
    v-if="totalPages > 1 || selectionMode"
    data-dashboard-pagination-bar
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
      :selected-count="selectedQuotes.length"
      :visible-count="collection?.quotes?.length ?? 0"
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
    <DashboardQuoteActionsDrawer
      v-model:open="mobileActionsOpen"
      :quote-text="mobileActionQuote?.name"
      :actions="mobileActionItems"
    />
  </ClientOnly>
</template>

<script lang="ts" setup>
import { formatDate } from '~/utils/time-formatter'

definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

const { $t } = useI18n()
const route = useRoute()
const collectionId = computed(() => String(route.params.id))
const { showErrorToast } = useErrorToast()
const pageHeader = usePageHeader()

onMounted(() => {
  pageHeader.setHeaderFromRoute()
})

const collection = ref<CollectionWithQuotes | null>(null)
const quoteKeyboard = useDashboardQuoteSelection(computed(() => collection.value?.quotes ?? []))
const {
  selectionMode,
  rowSelection,
  selectedQuotes,
  clearSelection,
  exitSelectionMode,
  selectQuote,
  toggleQuote,
  toggleSelectAllVisible,
  handleRowClickCapture,
  handleRowKeydown
} = quoteKeyboard
const bulkMutationPending = ref(false)
const bulkSelectionActions = computed(() => [
  { key: 'remove', label: String($t('tooltip_remove')), icon: 'i-tabler-folder-minus', disabled: bulkMutationPending.value }
])

  const pageTitle = computed(() => collection.value
    ? String($t('meta_title', { name: collection.value.name }))
    : String($t('meta_fallback')))
  const pageDesc = computed(() => collection.value?.description || String($t('meta_desc')))

  useHead({
    title: pageTitle,
    meta: [
      { name: 'description', content: pageDesc }
    ]
  })

const loading = ref(true)
const currentPage = ref(1)
const totalPages = ref(0)
const mobileActionsOpen = ref(false)
const mobileActionQuote = ref<any>(null)
const openMobileQuoteActions = (quote: any) => {
  mobileActionQuote.value = quote
  mobileActionsOpen.value = true
}
const mobileActionItems = computed(() => {
  if (!mobileActionQuote.value) return []
  const index = collection.value?.quotes?.findIndex(quote => quote.id === mobileActionQuote.value.id) ?? -1
  return getQuoteActions(mobileActionQuote.value, index)
})
const longPress = useDashboardLongPress(openMobileQuoteActions)
const handleCollectionRowClick = (event: MouseEvent, index: number, id: number) => {
  longPress.suppressLongPressClick(event)
  if (selectionMode.value) handleRowClickCapture(event, index, id)
}
const handleCollectionContextMenu = (event: MouseEvent, quote: any) => {
  if (selectionMode.value) {
    event.preventDefault()
    event.stopPropagation()
    return
  }
  longPress.handleContextMenu(event, quote)
}

const getQuoteActions = (quote: any, index: number) => [
  ...(!selectionMode.value ? [{
    label: $t('common.select_this_quote') as string,
    leading: 'i-tabler-checkbox',
    onclick: () => { if (index >= 0) selectQuote(index, quote.id) }
  }, {}] : []),
  { label: $t('tooltip_share') as string, leading: 'i-ph-share', onclick: () => handleShareQuote(quote) },
  {},
  { label: $t('tooltip_remove') as string, leading: 'i-ph-x', onclick: () => handleRemoveFromCollection(quote) }
]

const loadCollection = async () => {
  try {
    loading.value = true

    const response = await $fetch<any>(`/api/collections/${collectionId.value}` as const, {
      query: {
        page: currentPage.value,
        limit: 12
      }
    })

    collection.value = response.data as unknown as CollectionWithQuotes
    totalPages.value = response.data?.pagination?.totalPages ?? 1
  } catch (error) {
    console.error('Failed to load collection:', error)
    collection.value = null
  } finally {
    loading.value = false
  }
}

watch(currentPage, () => {
  clearSelection()
  loadCollection()
})

const shareCollection = async () => {
  if (!collection.value) return

  try {
    const shareText = $t('share_text', { name: collection.value.name })
    const shareData = {
      title: `${collection.value.name} - Verbatims Collection`,
      text: shareText as string,
      url: window.location.href
    }

    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`)
      useToast().toast({
        title: $t('toast_collection_shared') as string,
        description: $t('toast_collection_shared_desc') as string,
        toast: 'soft-success',
      })
    }
  } catch (error) {
    console.error('Failed to share collection:', error)
  }
}

const collectionActions = computed(() => ([
  {
    label: $t('dropdown_copy_link') as string,
    leading: 'i-ph-link',
    onclick: async () => {
      try {
        await navigator.clipboard.writeText(window.location.href)
        useToast().toast({ title: $t('toast_link_copied') as string, description: $t('toast_url_copied') as string, toast: 'soft-success' })
      } catch (error) {
        console.error('Failed to copy link:', error)
      }
    }
  }
]))

const handleShareQuote = (quote: any) => {
  const authorName = quote.author?.name || quote.author_name
  const text = `"${quote.name}"${authorName ? ` - ${authorName}` : ''}`
  if (navigator.share) {
    navigator.share({
      title: $t('share_title') as string,
      text,
      url: `${window.location.origin}/quotes/${quote.id}`
    })
  } else {
    navigator.clipboard.writeText(text)
    useToast().toast({ title: $t('toast_copied_clipboard') as string, toast: 'outline-success' })
  }
}

const handleRemoveFromCollection = async (quote: any) => {
  if (!confirm($t('confirm_remove') as string)) return

  try {
    await $fetch(`/api/collections/${collectionId.value}/quotes/${quote.id}`, {
      method: 'DELETE'
    })

    if (collection.value) {
      collection.value.quotes = collection.value.quotes?.filter((q: any) => q.id !== quote.id) || []
      if (collection.value.quotes_count) {
        collection.value.quotes_count--
      }
    }
  } catch (error) {
    console.error('Failed to remove quote:', error)
    showErrorToast(error, $t('error_remove') as string)
  }
}

const handleBulkSelectionAction = async (action: string) => {
  if (action !== 'remove' || selectedQuotes.value.length === 0 || bulkMutationPending.value) return
  if (!confirm($t('confirm_remove') as string)) return
  try {
    bulkMutationPending.value = true
    await $fetch(`/api/collections/${collectionId.value}/quotes/bulk`, {
      method: 'DELETE',
      body: { quoteIds: [...selectedQuotes.value] }
    })
    clearSelection()
    await loadCollection()
    if (currentPage.value > totalPages.value) {
      currentPage.value = Math.max(1, totalPages.value)
    }
  } catch (error) {
    showErrorToast(error, String($t('error_remove')))
  } finally {
    bulkMutationPending.value = false
  }
}

const showPageJumpDialog = ref(false)

const onPageJump = (page: number) => {
  currentPage.value = page
}

const footerLeftOffset = ref(0)
const footerWidth = ref('100%')

useAdminKeyboardShortcuts({
  selectAllOnPage: () => quoteKeyboard.selectAllVisible(),
  clearSelection,
  hasSelection: () => selectedQuotes.value.length > 0,
  isSelectionMode: () => selectionMode.value,
  onEscapeSelection: exitSelectionMode,
  isDialogOpen: () => mobileActionsOpen.value || showPageJumpDialog.value,
  isDropdownOpen: () => false,
  customKeys: {
    r: () => { void handleBulkSelectionAction('remove') }
  }
})

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
  loadCollection()
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

.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
