<template>
  <div>
    <!-- Header -->
    <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
            Favourites
          </h1>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ filteredQuotes.length }} liked {{ filteredQuotes.length === 1 ? 'quote' : 'quotes' }}
          </p>
        </div>
        <div class="hidden md:flex items-center gap-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search favourites..."
            class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400 w-48"
          />
          <select
            v-model="sortValue"
            class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400 cursor-pointer"
          >
            <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
      </div>
      <div class="md:hidden mt-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search favourites..."
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
        {{ searchQuery ? 'No matching favourites' : 'No favourites yet' }}
      </p>
      <p class="font-sans text-sm text-gray-500 dark:text-gray-400 mb-6">
        {{ searchQuery ? 'Try adjusting your search terms.' : 'Start exploring quotes and like the ones you love.' }}
      </p>
      <NuxtLink v-if="!searchQuery" to="/"
        class="inline-flex items-center gap-1.5 font-sans text-xs text-gray-700 dark:text-gray-300 border border-dashed border-gray-300 dark:border-gray-600 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-sm"
      >
        Discover Quotes &rarr;
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
            <blockquote class="font-body text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed line-clamp-2 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
              &ldquo;{{ quote.name }}&rdquo;
            </blockquote>
            <div class="flex items-center gap-2 mt-2 flex-wrap">
              <span class="font-sans text-xs text-gray-600 dark:text-gray-400 font-500">{{ quote.author?.name || quote.author_name || 'Unknown' }}</span>
              <span v-if="quote.reference?.name || quote.reference_name" class="text-gray-300 dark:text-gray-600">·</span>
              <span v-if="quote.reference?.name || quote.reference_name" class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ quote.reference?.name || quote.reference_name }}</span>
              <span class="text-gray-300 dark:text-gray-600">·</span>
              <span class="font-sans text-xs text-gray-400 dark:text-gray-500">Liked {{ formatDate(quote.liked_at) }}</span>
            </div>
          </NuxtLink>
          <div class="hidden md:flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <NTooltip content="Add to Collection">
              <button @click.stop="handleAddToCollection(quote)" class="p-1.5 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                <NIcon name="i-ph-folder-plus" class="w-4 h-4" />
              </button>
            </NTooltip>
            <NTooltip content="Share">
              <button @click.stop="handleShareQuote(quote)" class="p-1.5 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                <NIcon name="i-ph-share" class="w-4 h-4" />
              </button>
            </NTooltip>
            <NTooltip content="Remove from favourites">
              <button @click.stop="handleUnlike(quote)" class="p-1.5 rounded-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                <NIcon name="i-ph-heart-break" class="w-4 h-4" />
              </button>
            </NTooltip>
          </div>
        </div>
      </div>

      <!-- Load More -->
      <div v-if="hasMore" class="pt-6 text-center">
        <button
          :disabled="loadingMore"
          class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors border-b border-dashed border-gray-300 dark:border-gray-600 pb-0.5 disabled:opacity-50"
          @click="loadMore"
        >
          {{ loadingMore ? 'Loading...' : 'Load More' }}
        </button>
      </div>
    </div>

    <!-- Add to Collection Modal -->
    <AddQuoteToCollectionModal
      v-if="selectedQuote"
      v-model="showAddQuoteToCollectionModal"
      :quote="selectedQuote"
      @added="handleAddedToCollection"
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

useHead({
  title: 'Favourites - Dashboard - Verbatims'
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
const loadingMore = ref(false)
const quotes = ref<LikedQuote[]>([])
const searchQuery = ref('')
const sortBy = ref({ label: 'Most Recent', value: 'recent' })
const sortValue = ref('recent')
const hasMore = ref(false)
const currentPage = ref(1)

watch(sortValue, (val) => {
  const option = sortOptions.find(o => o.value === val)
  if (option) sortBy.value = option
})

const showAddQuoteToCollectionModal = ref(false)
const selectedQuote = ref<LikedQuote | null>(null)

const sortOptions = [
  { label: 'Most Recent', value: 'recent' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Most Popular', value: 'popular' },
  { label: 'Author A-Z', value: 'author' }
]

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

  switch (sortBy.value.value) {
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

const loadFavourites = async (page = 1) => {
  try {
    const response = await $fetch('/api/dashboard/liked-quotes', {
      query: { page, limit: 20 }
    })

    const data = (response as any)?.data || []
    if (page === 1) {
      quotes.value = data
    } else {
      quotes.value.push(...data)
    }

    hasMore.value = (response as any)?.pagination?.hasMore || false
    currentPage.value = page
  } catch (error) {
    console.error('Failed to load favourites:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = async () => {
  loadingMore.value = true
  await loadFavourites(currentPage.value + 1)
}

const handleUnlike = async (quote: LikedQuote) => {
  try {
    await $fetch(`/api/quotes/${quote.id}/like`, { method: 'POST' })
    quotes.value = quotes.value.filter(q => q.id !== quote.id)
  } catch (e) {
    console.error('Failed to unlike:', e)
    showErrorToast(e, 'Failed to remove from favourites')
  }
}

const handleShareQuote = (quote: LikedQuote) => {
  const text = `"${quote.name}"${quote.author?.name || quote.author_name ? ` - ${quote.author?.name || quote.author_name}` : ''}`
  if (navigator.share) {
    navigator.share({ title: 'Quote from Verbatims', text, url: `${window.location.origin}/quotes/${quote.id}` })
  } else {
    navigator.clipboard.writeText(text)
    useToast().toast({ title: 'Copied to clipboard', toast: 'outline-success' })
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

onMounted(() => {
  loadFavourites()
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
