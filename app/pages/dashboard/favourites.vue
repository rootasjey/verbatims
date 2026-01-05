<template>
  <div class="min-h-screen">
    <!-- Mobile: Favourites List -->
    <div v-if="isMobile" class="mobile-favourites-page bg-gray-50 dark:bg-[#0A0805] min-h-screen pb-24">
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
              Favourites
            </h1>
          </div>

          <!-- Search Bar with collapse animation -->
          <div 
            class="transition-all duration-300 ease-in-out overflow-hidden"
            :class="showHeaderElements ? 'mb-3 max-h-20 opacity-100' : 'max-h-0 opacity-0 mb-0'"
          >
            <NInput
              v-model="searchQuery"
              :placeholder="`Search among ${filteredQuotes.length} ${filteredQuotes.length === 1 ? 'favourite' : 'favourites'}...`"
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
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="flex items-center gap-3">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          <span class="text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredQuotes.length === 0" class="text-center py-16 px-4">
        <NIcon name="i-ph-heart" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-600 text-gray-900 dark:text-white mb-2">
          {{ searchQuery ? 'No matching favourites' : 'No favourites yet' }}
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search terms.' : 'Start exploring quotes and like the ones you love.' }}
        </p>
        <NButton v-if="!searchQuery" btn="solid-black" to="/">
          <NIcon name="i-ph-magnifying-glass" />
          Discover Quotes
        </NButton>
      </div>

      <!-- Results -->
      <div v-else class="px-3 pt-3 pb-6 space-y-3">
        <QuoteListItem
            v-for="(quote, idx) in processedMobileQuotes"
            :key="idx"
            :quote="quote"
            :actions="favouriteActions"
            @share="handleShareQuote"
            @unlike="handleUnlike"
            @add-to-collection="handleAddToCollection"
          />

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

    <!-- Desktop: Masonry Grid -->
    <div v-else>
      <!-- Search and Filters -->
      <div class="mb-6 flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <NInput
            v-model="searchQuery"
            placeholder="Search your favourites..."
            leading="i-ph-magnifying-glass"
            size="md"
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

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <NIcon name="i-ph-spinner" class="w-8 h-8 animate-spin text-gray-400" />
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredQuotes.length === 0 && !loading" class="text-center py-16">
        <NIcon name="i-ph-heart" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ searchQuery ? 'No matching favourites' : 'No favourites yet' }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search terms.' : 'Start exploring quotes and like the ones you love.' }}
        </p>
        <NButton v-if="!searchQuery" btn="solid-black" to="/">
          <NIcon name="i-ph-magnifying-glass" />
          Discover Quotes
        </NButton>
      </div>

      <!-- Quotes Grid -->
      <div v-else class="space-y-6">
        <!-- Results Count -->
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ filteredQuotes.length }} {{ filteredQuotes.length === 1 ? 'favourite' : 'favourites' }}
        </div>

        <!-- Masonry Grid -->
        <MasonryGrid>
          <QuoteMasonryItem
            v-for="(quote, idx) in filteredQuotes"
            :index="idx"
            :key="idx"
            :quote="quote"
            :show-actions="true"
            @like-toggled="handleLikeToggled"
            @add-to-collection="handleAddToCollection"
          />
        </MasonryGrid>

        <!-- Load More -->
        <div v-if="hasMore" class="text-center pt-8">
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

    <!-- Add to Collection Modal (desktop only for now) -->
    <AddToCollectionModal
      v-if="selectedQuote"
      v-model="showAddToCollectionModal"
      :quote="selectedQuote"
      @added="handleAddedToCollection"
    />
  </div>
</template>

<script setup lang="ts">
import type { ProcessedQuoteResult } from '~~/server/types'

const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()

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

definePageMeta({
  layout: false,
  middleware: 'auth'
})

useHead({
  title: 'Favourites - Dashboard - Verbatims'
})

const loading = ref(true)
const loadingMore = ref(false)
const quotes = ref<LikedQuote[]>([])
const searchQuery = ref('')
const sortBy = ref({ label: 'Most Recent', value: 'recent' })
const hasMore = ref(false)
const currentPage = ref(1)

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

const showAddToCollectionModal = ref(false)
const selectedQuote = ref<LikedQuote | null>(null)
const editQuoteDrawerOpen = ref(false)
const actionsOpen = ref(false)

const favouriteActions = [
  {
    label: 'Share',
    leading: 'i-ph-share'
  },
  {
    label: 'Unlike',
    leading: 'i-ph-heart-break'
  },
  { divider: true, label: '' },
  {
    label: 'Add to Collection',
    leading: 'i-ph-folder-plus'
  }
]

const openEditQuote = (quote: LikedQuote) => {
  selectedQuote.value = quote
  // open the edit drawer (reuse EditQuoteDrawer if desired)
  editQuoteDrawerOpen.value = true
}

const confirmDeleteQuote = (quote: LikedQuote) => {
  // simple confirmation — you can replace with a modal
  if (!confirm('Remove this favourite?')) return
  // Call API to remove like
  try {
    void (fetch as any)(`/api/quotes/${quote.id}/unlike`, { method: 'POST' })
  } catch (e) {
    console.error('Failed to unlike:', e)
  }
  quotes.value = quotes.value.filter(q => q.id !== quote.id)
}

const handleUnlike = async (quote: LikedQuote) => {
  try {
    await $fetch(`/api/quotes/${quote.id}/like`, { method: 'POST' })
    quotes.value = quotes.value.filter(q => q.id !== quote.id)
  } catch (e) {
    console.error('Failed to unlike:', e)
    useToast().toast({ 
      title: 'Failed to remove from favourites',
    })
  }
}

const handleShareQuote = (quote: LikedQuote) => {
  if (navigator.share) {
    navigator.share({ title: 'Quote from Verbatims', text: quote.name, url: `${window.location.origin}/quotes/${quote.id}` })
  } else {
    navigator.clipboard.writeText(`"${quote.name}" - ${quote.author?.name || ''}`)
    useToast().toast({ title: 'Copied to clipboard' })
  }
}

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
      quote.reference?.name?.toLowerCase().includes(query)
    )
  }

  switch (sortBy.value.value) {
    case 'oldest':
      filtered.sort((a, b) => new Date(a.liked_at).getTime() - new Date(b.liked_at).getTime())
      break
    case 'popular':
      filtered.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
      break
    case 'author':
      filtered.sort((a, b) => (a.author?.name || '').localeCompare(b.author?.name || ''))
      break
    default: // recent
      filtered.sort((a, b) => new Date(b.liked_at).getTime() - new Date(a.liked_at).getTime())
  }

  return filtered
})

const processedMobileQuotes = computed<ProcessedQuoteResult[]>(() => {
  return filteredQuotes.value.map((q) => ({
    id: (q as any).id,
    ...q,
    result_type: 'quote',
    author_name: q.author_name ?? q.author?.name,
    author_is_fictional: q.author_is_fictional ?? (q.author as any)?.is_fictional,
    author_image_url: q.author_image_url ?? (q.author as any)?.image_url,
    reference_name: q.reference_name ?? q.reference?.name,
    reference_type: q.reference_type ?? (q.reference as any)?.type,
    tags: q.tags ?? [],
    author: q.author || (q.author_name ? { id: q.author_id!, name: q.author_name, is_fictional: q.author_is_fictional, image_url: q.author_image_url } as any : undefined),
    reference: q.reference || (q.reference_name ? { id: q.reference_id!, name: q.reference_name, type: q.reference_type } as any : undefined),
  }))
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

const handleLikeToggled = (quote: LikedQuote) => {
  if (!quote.is_liked) {
    quotes.value = quotes.value.filter(q => q.id !== quote.id)
  }
}

const handleAddToCollection = (quote: LikedQuote) => {
  selectedQuote.value = quote
  showAddToCollectionModal.value = true
}

const handleAddedToCollection = () => {
  showAddToCollectionModal.value = false
  selectedQuote.value = null
}

onMounted(() => {
  setPageLayout(currentLayout.value)
  loadFavourites()
  // Add mobile scroll listener
  if (isMobile.value) {
    window.addEventListener('scroll', handleScroll, { passive: true })
  }
})

watch(currentLayout, (newLayout) => {
  setPageLayout(newLayout)
})

onBeforeUnmount(() => {
  if (isMobile.value) {
    window.removeEventListener('scroll', handleScroll)
  }
})

watch([searchQuery, sortBy], () => {
  if (searchQuery.value) {
    // For now, just filter client-side
    // In a real app, you might want to debounce and search server-side
  }
})
</script>

<style scoped>
.mobile-favourites-page {
  /* Ensure proper spacing for mobile layout */
  min-height: calc(100vh - 80px); /* Account for bottom navigation */
}
</style>
