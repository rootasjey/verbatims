<template>
  <div :aria-busy="loading">
    <!-- Header -->
    <div v-if="hasLoadedOnce && (totalQuotes > 0 || searchQuery.trim())" class="mb-6 flex justify-end">
      <div class="flex items-center gap-2">
        <Transition name="favourites-search">
          <input
            v-if="searchOpen"
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            :placeholder="$t('search_placeholder') as string"
            class="h-10 w-44 rounded-md border border-[#d2cfc6] bg-[#f0efe9] px-3 font-sans text-sm text-gray-800 placeholder-[#77756f] outline-none transition-[border-color,box-shadow] focus:border-gray-500 focus:ring-2 focus:ring-gray-900/10 dark:border-white/15 dark:bg-white/[0.06] dark:text-gray-200 dark:placeholder-gray-400 dark:focus:border-gray-400 dark:focus:ring-white/10 sm:w-52"
            @keydown.esc="closeSearch"
          />
        </Transition>
        <NButton
          v-if="!searchOpen"
          icon
          btn="ghost-gray"
          size="sm"
          label="i-tabler-search"
          class="h-10 w-10 rounded-md border border-[#d2cfc6] bg-[#f0efe9] text-gray-700 hover:bg-[#eae8e1] dark:border-white/15 dark:bg-white/[0.06] dark:text-gray-200 dark:hover:bg-white/10"
          :aria-label="$t('search_placeholder') as string"
          @click="openSearch"
        />
        <NButton
          v-else
          icon
          btn="ghost-gray"
          size="sm"
          label="i-tabler-x"
          class="h-10 w-10 rounded-md border border-[#d2cfc6] bg-[#f0efe9] text-gray-700 hover:bg-[#eae8e1] dark:border-white/15 dark:bg-white/[0.06] dark:text-gray-200 dark:hover:bg-white/10"
          :aria-label="$t('common.close') as string"
          @click="closeSearch"
        />
          <NCombobox
            class="favourites-sort"
            :model-value="sortOptions.find(o => o.value === sortValue) || sortOptions[0]"
            @update:model-value="(v: any) => { if (v) sortValue = v.value }"
            :items="sortOptions"
            by="value"
            :_combobox-list="{
              class: 'min-w-[180px]',
            }"
            :_combobox-trigger="{
              btn: 'ghost-gray',
              size: 'sm',
              trailing: '',
              ariaLabel: String(sortBy?.label ?? ''),
              class: 'h-10 w-10 justify-center rounded-md border border-[#d2cfc6] bg-[#f0efe9] p-0 text-gray-700 hover:bg-[#eae8e1] dark:border-white/15 dark:bg-white/[0.06] dark:text-gray-200 dark:hover:bg-white/10',
            }"
          >
            <template #label="{ item }">
              <span class="flex min-w-0 items-center gap-2.5">
                <NIcon :name="item.leading" class="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
                <span>{{ item.label }}</span>
              </span>
            </template>
            <template #trigger="{ modelValue }">
              <NIcon :name="modelValue?.leading || 'i-tabler-arrows-sort'" class="h-5 w-5" />
              <span class="sr-only">{{ modelValue?.label }}</span>
            </template>
          </NCombobox>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-6">
      <div v-for="i in 5" :key="i" class="animate-pulse pb-6 border-b border-dashed border-gray-100 dark:border-gray-800">
        <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4 mb-2" />
        <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-2" />
        <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredQuotes.length === 0" class="py-16 text-center">
      <DashboardEmptyStateCopy
        :heading="String(searchQuery ? pageT('empty_search_title') : pageT('empty_title'))"
        :description="String(searchQuery ? pageT('empty_search_desc') : pageT('empty_desc'))"
      />
      <NButton
        v-if="!searchQuery"
        to="/"
        btn="solid-black"
        trailing="i-tabler-sparkle-highlight"
        class="min-h-10 justify-center gap-2 rounded-1 bg-gray-900 px-4 font-sans text-sm font-600 text-gray-50 transition-[transform,background-color] duration-150 hover:bg-gray-700 active:scale-96 motion-reduce:active:scale-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300 dark:focus-visible:ring-gray-400 dark:focus-visible:ring-offset-[#17191e]"
      >
        {{ $t('empty_action') }}
      </NButton>
    </div>

    <!-- Feed -->
    <div v-else class="divide-y divide-stone-300/70 dark:divide-white/10">
      <div
        v-for="(quote, idx) in filteredQuotes"
        :key="quote.id"
        class="py-5 first:pt-0 last:pb-0 group animate-fade-in-up"
        :style="{ animationDelay: `${idx * 0.05}s` }"
      >
        <div class="flex items-start gap-4">
          <div class="flex-1 min-w-0">
            <NuxtLink :to="`/quotes/${quote.id}`" class="block">
            <ContextMenu size="xs" native-on-modifier="ctrl" :items="getQuoteActions(quote)">
              <blockquote class="line-clamp-2 font-serif text-lg leading-relaxed tracking-[-0.01em] text-gray-900 transition-colors group-hover:text-gray-700 dark:text-gray-100 dark:group-hover:text-gray-200 md:text-xl">
                {{ quote.name }}
              </blockquote>
            </ContextMenu>
            </NuxtLink>
            <div class="flex items-center gap-2 mt-2 flex-wrap">
              <ContextMenu v-if="quote.author?.name" size="xs" native-on-modifier="ctrl" :items="getAuthorActions(quote)">
                <NuxtLink
                  v-if="quote.author.id"
                  :to="`/authors/${quote.author.id}`"
                  class="font-sans text-sm font-500 text-gray-700 underline decoration-transparent underline-offset-4 transition-colors hover:text-gray-950 hover:decoration-current focus-visible:outline-none focus-visible:underline dark:text-gray-300 dark:hover:text-gray-100"
                  @click.stop
                >{{ quote.author.name }}</NuxtLink>
                <span v-else class="font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ quote.author.name }}</span>
              </ContextMenu>
              <span v-if="!quote.author?.name && quote.author_name" class="font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ quote.author_name }}</span>
              <span v-if="(quote.author?.name || quote.author_name) && (quote.reference?.name || quote.reference_name)" class="text-gray-300 dark:text-gray-600">·</span>
              <ContextMenu v-if="quote.reference?.name" size="xs" native-on-modifier="ctrl" :items="getReferenceActions(quote)">
                <NuxtLink
                  v-if="quote.reference.id"
                  :to="`/references/${quote.reference.id}`"
                  class="font-sans text-sm text-gray-600 underline decoration-transparent underline-offset-4 transition-colors hover:text-gray-900 hover:decoration-current focus-visible:outline-none focus-visible:underline dark:text-gray-400 dark:hover:text-gray-100"
                  @click.stop
                >{{ quote.reference.name }}</NuxtLink>
                <span v-else class="font-sans text-sm text-gray-600 dark:text-gray-400">{{ quote.reference.name }}</span>
              </ContextMenu>
              <span v-if="!quote.reference?.name && quote.reference_name" class="font-sans text-sm text-gray-600 dark:text-gray-400">{{ quote.reference_name }}</span>
              <template v-if="quote.liked_at">
                <span v-if="quote.author?.name || quote.author_name || quote.reference?.name || quote.reference_name" class="text-gray-300 dark:text-gray-600">·</span>
                <span class="font-sans text-sm text-gray-500 dark:text-gray-400">{{ $t('liked_prefix') }}{{ formatDate(quote.liked_at) }}</span>
              </template>
            </div>
          </div>
          <div class="hidden md:flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <NTooltip :content="$t('tooltip_add_to_collection') as string">
              <button @click.stop="handleAddToCollection(quote)" class="p-1.5 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                <NIcon name="i-ph-folder-plus" class="w-4 h-4" />
              </button>
            </NTooltip>
            <NTooltip :content="$t('tooltip_share') as string">
              <button @click.stop="handleShareQuote(quote)" class="p-1.5 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                <NIcon name="i-ph-share" class="w-4 h-4" />
              </button>
            </NTooltip>
            <NTooltip :content="$t('tooltip_remove') as string">
              <button @click.stop="handleUnlike(quote)" class="p-1.5 rounded-sm text-gray-500 transition-colors hover:bg-[#eee9e3] hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100">
                <NIcon name="i-ph-heart-break" class="w-4 h-4" />
              </button>
            </NTooltip>
          </div>
        </div>
      </div>
    </div>

    <!-- Add to Collection Modal -->
    <AddQuoteToCollectionModal
      v-if="selectedQuote"
      v-model="showAddQuoteToCollectionModal"
      :quote="selectedQuote"
      @added="handleAddedToCollection"
    />

    <!-- Sticky Pagination Footer -->
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
        of {{ totalPages }}
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

    <!-- Page Jump Dialog -->
    <PageJumpDialog
      v-model="showPageJumpDialog"
      :total-pages="totalPages"
      @jump="onPageJump"
    />
  </div>
</template>

<script setup lang="ts">
import type { ProcessedQuoteResult } from '~~/server/types'
import { getDateTimestamp } from '~/utils/time-formatter'
import { formatDate } from '~/utils/time-formatter'

definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

const { $t } = useI18n()

useHead({
  title: $t('meta_title') as string
})

const pageHeader = usePageHeader()

onMounted(() => {
  pageHeader.setHeaderFromRoute()
})

const { showErrorToast } = useErrorToast()
const { user } = useUserSession()
const favouritesCount = useState<number | null>(`dashboard-favourites-count-${String(user.value?.id ?? 'anonymous')}`, () => null)
const pageT = useI18n().$_t({ ...useRoute() })

interface LikedQuote extends QuoteWithMetadata {
  liked_at: string | null
  likes_count: number
  is_liked: boolean
  author_name?: string
  author_is_fictional?: boolean
  author_image_url?: string
  reference_name?: string
  reference_type?: string
  tags?: Array<{ id: number; name: string; color: string }>
}

const loading = ref(true)
const hasLoadedOnce = ref(false)
const quotes = ref<LikedQuote[]>([])
const searchQuery = ref('')
const searchOpen = ref(false)
const searchInput = ref<HTMLInputElement | null>(null)
const sortValue = ref('recent')
const currentPage = ref(1)
const totalPages = ref(0)
const totalQuotes = ref(0)

const openSearch = async () => {
  searchOpen.value = true
  await nextTick()
  searchInput.value?.focus()
}

const closeSearch = () => {
  searchQuery.value = ''
  searchOpen.value = false
}

const sortOptions = computed(() => [
  { label: $t('sort_most_recent'), value: 'recent', leading: 'i-tabler-clock-hour-12' },
  { label: $t('sort_oldest_first'), value: 'oldest', leading: 'i-tabler-hourglass-empty' },
  { label: $t('sort_most_popular'), value: 'popular', leading: 'i-tabler-stars' },
  { label: $t('sort_author_az'), value: 'author', leading: 'i-tabler-abc' }
])

const sortBy = computed(() => {
  const option = sortOptions.value.find(o => o.value === sortValue.value)
  return option || sortOptions.value[0]
})

const showAddQuoteToCollectionModal = ref(false)
const selectedQuote = ref<LikedQuote | null>(null)

const filteredQuotes = computed(() => {
  let filtered = [...quotes.value]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(quote =>
      quote.name.toLowerCase().includes(query) ||
      quote.author?.name?.toLowerCase().includes(query) ||
      quote.author_name?.toLowerCase().includes(query) ||
      quote.reference?.name?.toLowerCase().includes(query) ||
      quote.reference_name?.toLowerCase().includes(query)
    )
  }

  switch (sortBy.value?.value) {
    case 'oldest':
      filtered.sort((a, b) => getDateTimestamp(a.liked_at) - getDateTimestamp(b.liked_at))
      break
    case 'popular':
      filtered.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
      break
    case 'author':
      filtered.sort((a, b) => (a.author?.name || a.author_name || '').localeCompare(b.author?.name || b.author_name || ''))
      break
    default:
      filtered.sort((a, b) => getDateTimestamp(b.liked_at) - getDateTimestamp(a.liked_at))
  }

  return filtered
})

const loadFavourites = async () => {
  try {
    loading.value = true
    const response = await $fetch<{
      data: LikedQuote[]
      pagination: { total: number; limit: number; totalPages: number }
    }>('/api/dashboard/liked-quotes', {
      query: { page: currentPage.value, limit: 20 }
    })

    quotes.value = response?.data || []
    totalQuotes.value = response?.pagination?.total ?? 0
    favouritesCount.value = totalQuotes.value
    totalPages.value = response?.pagination?.totalPages ?? 1
  } catch (error) {
    console.error('Failed to load favourites:', error)
  } finally {
    loading.value = false
    hasLoadedOnce.value = true
  }
}

watch(currentPage, () => {
  loadFavourites()
})

const getQuoteActions = (quote: any) => [
  {
    label: $t('tooltip_add_to_collection') as string,
    leading: 'i-ph-folder-plus',
    onclick: () => handleAddToCollection(quote)
  },
  {},
  {
    label: $t('tooltip_share') as string,
    leading: 'i-ph-share',
    onclick: () => handleShareQuote(quote)
  },
  {},
  {
    label: $t('tooltip_remove') as string,
    leading: 'i-ph-heart-break',
    onclick: () => handleUnlike(quote)
  }
]

const getAuthorActions = (quote: any) => {
  const author = quote.author
  const authorId = author?.id
  if (!author?.name || !authorId) return []
  return [
    { label: $t('action_view_author_page') as string, leading: 'i-ph-eye', onclick: () => navigateTo(`/authors/${authorId}`) },
    { label: $t('action_share') as string, leading: 'i-ph-share', onclick: () => shareAuthor(authorId) }
  ]
}

const getReferenceActions = (quote: any) => {
  const reference = quote.reference
  const referenceId = reference?.id
  if (!reference?.name || !referenceId) return []
  return [
    { label: $t('action_view_reference_page') as string, leading: 'i-ph-eye', onclick: () => navigateTo(`/references/${referenceId}`) },
    { label: $t('action_share') as string, leading: 'i-ph-share', onclick: () => shareReference(referenceId) }
  ]
}

const shareAuthor = (authorId: number) => {
  const url = `${window.location.origin}/authors/${authorId}`
  navigator.clipboard.writeText(url)
  useToast().toast({ title: $t('action_share') as string, description: $t('common.copied_to_clipboard') as string, toast: 'outline-success' })
}

const shareReference = (referenceId: number) => {
  const url = `${window.location.origin}/references/${referenceId}`
  navigator.clipboard.writeText(url)
  useToast().toast({ title: $t('action_share') as string, description: $t('common.copied_to_clipboard') as string, toast: 'outline-success' })
}

const handleUnlike = async (quote: LikedQuote) => {
  try {
    await $fetch(`/api/quotes/${quote.id}/like`, { method: 'POST' })
    quotes.value = quotes.value.filter(q => q.id !== quote.id)
  } catch (e) {
    console.error('Failed to unlike:', e)
    showErrorToast(e, $t('error_remove') as string)
  }
}

const handleShareQuote = (quote: LikedQuote) => {
  const text = `"${quote.name}"${quote.author?.name || quote.author_name ? ` - ${quote.author?.name || quote.author_name}` : ''}`
  if (navigator.share) {
    navigator.share({ title: $t('share_title') as string, text, url: `${window.location.origin}/quotes/${quote.id}` })
  } else {
    navigator.clipboard.writeText(text)
    useToast().toast({ title: $t('common.copied_to_clipboard') as string, toast: 'outline-success' })
  }
}

const handleAddToCollection = (quote: LikedQuote) => {
  selectedQuote.value = quote
  showAddQuoteToCollectionModal.value = true
}

const handleAddedToCollection = () => {
  showAddQuoteToCollectionModal.value = false
  selectedQuote.value = null
}

const showPageJumpDialog = ref(false)

const onPageJump = (page: number) => {
  currentPage.value = page
}

const footerLeftOffset = ref(0)
const footerWidth = ref('100%')

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
  loadFavourites()
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

:global(.favourites-sort) {
  width: max-content;
}

:global(.favourites-sort [data-slot='combobox-anchor']),
:global(.favourites-sort [data-slot='combobox-trigger']) {
  width: 2.5rem !important;
  min-width: 2.5rem !important;
}

:global(.favourites-sort .combobox-trigger-trailing) {
  display: none !important;
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
