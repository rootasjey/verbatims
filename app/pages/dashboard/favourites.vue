<template>
  <div>
    <!-- Header -->
    <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
            {{ $t('title') }}
          </h1>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ totalQuotes }} {{ $t('liked_prefix') }}{{ totalQuotes === 1 ? $t('common.quote_singular') : $t('common.quote_plural') }}
          </p>
        </div>
        <div class="hidden md:flex items-center gap-4">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('search_placeholder') as string"
            class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none w-48"
          />
          <select
            v-model="sortValue"
            class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
      </div>
      <div class="md:hidden mt-4">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('search_placeholder') as string"
          class="w-full font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400"
        />
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
      <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">
        {{ searchQuery ? $t('empty_search_title') : $t('empty_title') }}
      </p>
      <p class="font-sans text-sm text-gray-500 dark:text-gray-400 mb-6">
        {{ searchQuery ? $t('empty_search_desc') : $t('empty_desc') }}
      </p>
      <NuxtLink v-if="!searchQuery" to="/"
        class="inline-flex items-center gap-1.5 font-sans text-xs text-gray-700 dark:text-gray-300 border border-dashed border-gray-300 dark:border-gray-600 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-sm"
      >
        {{ $t('empty_action') }} &rarr;
      </NuxtLink>
    </div>

    <!-- Feed -->
    <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
      <div
        v-for="(quote, idx) in filteredQuotes"
        :key="quote.id"
        class="py-5 first:pt-0 last:pb-0 group animate-fade-in-up"
        :style="{ animationDelay: `${idx * 0.05}s` }"
      >
        <div class="flex items-start gap-4">
          <NuxtLink :to="`/quotes/${quote.id}`" class="flex-1 min-w-0 block">
            <ContextMenu size="xs" native-on-modifier="ctrl" :items="getQuoteActions(quote)">
              <blockquote class="font-body text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed line-clamp-2 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                &ldquo;{{ quote.name }}&rdquo;
              </blockquote>
            </ContextMenu>
            <div class="flex items-center gap-2 mt-2 flex-wrap">
              <ContextMenu v-if="quote.author?.name" size="xs" native-on-modifier="ctrl" :items="getAuthorActions(quote)">
                <span class="font-sans text-xs text-gray-600 dark:text-gray-400 font-500">{{ quote.author.name }}</span>
              </ContextMenu>
              <span v-if="!quote.author?.name && quote.author_name" class="font-sans text-xs text-gray-600 dark:text-gray-400 font-500">{{ quote.author_name }}</span>
              <span v-if="(quote.author?.name || quote.author_name) && (quote.reference?.name || quote.reference_name)" class="text-gray-300 dark:text-gray-600">·</span>
              <ContextMenu v-if="quote.reference?.name" size="xs" native-on-modifier="ctrl" :items="getReferenceActions(quote)">
                <span class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ quote.reference.name }}</span>
              </ContextMenu>
              <span v-if="!quote.reference?.name && quote.reference_name" class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ quote.reference_name }}</span>
              <span class="text-gray-300 dark:text-gray-600">·</span>
              <span class="font-sans text-xs text-gray-400 dark:text-gray-500">{{ $t('liked_prefix') }}{{ formatDate(quote.liked_at) }}</span>
            </div>
          </NuxtLink>
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
              <button @click.stop="handleUnlike(quote)" class="p-1.5 rounded-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
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
  layout: 'dashboard',
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

interface LikedQuote extends QuoteWithMetadata {
  liked_at: string
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
const quotes = ref<LikedQuote[]>([])
const searchQuery = ref('')
const sortValue = ref('recent')
const currentPage = ref(1)
const totalPages = ref(0)
const totalQuotes = ref(0)

const sortOptions = computed(() => [
  { label: $t('sort_most_recent'), value: 'recent' },
  { label: $t('sort_oldest_first'), value: 'oldest' },
  { label: $t('sort_most_popular'), value: 'popular' },
  { label: $t('sort_author_az'), value: 'author' }
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
    totalPages.value = response?.pagination?.totalPages ?? 1
  } catch (error) {
    console.error('Failed to load favourites:', error)
  } finally {
    loading.value = false
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
  const authorId = author?.id || quote.authorId || quote.author_id
  if (!author?.name || !authorId) return []
  return [
    { label: $t('action_view_author_page') as string, leading: 'i-ph-eye', onclick: () => navigateTo(`/authors/${authorId}`) },
    { label: $t('action_share') as string, leading: 'i-ph-share', onclick: () => shareAuthor(authorId) }
  ]
}

const getReferenceActions = (quote: any) => {
  const reference = quote.reference
  const referenceId = reference?.id || quote.referenceId || quote.reference_id
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

.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
