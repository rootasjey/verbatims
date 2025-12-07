<template>
  <div class="min-h-screen">
    <!-- Mobile: Collection Detail -->
    <div v-if="isMobile" class="mobile-collection-detail bg-gray-50 dark:bg-[#0A0805] min-h-screen pb-24">
      <!-- Header with collapse on scroll -->
      <div 
        class="sticky top-10 z-10 bg-white dark:bg-[#0F0D0B] border-b rounded-6 border-gray-100 dark:border-gray-800 transition-all duration-300 ease-in-out"
        :class="{ 'shadow-sm': !showHeaderElements }"
      >
        <div class="px-4 transition-all duration-300 ease-in-out" :class="showHeaderElements ? 'py-5' : 'py-3'">
          <div class="mt-3 flex items-center gap-2">
            <h1 
              class="overflow-x-hidden font-sans text-gray-900 dark:text-white transition-all duration-300 ease-in-out truncate flex-1"
              :class="showHeaderElements ? 'text-4xl font-600' : 'text-2xl font-600'"
            >
              {{ collection?.name || 'Collection' }}
            </h1>
          </div>

          <!-- Description and metadata with collapse animation -->
          <div 
            class="transition-all duration-300 ease-in-out overflow-hidden"
            :class="showHeaderElements ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'"
          >
            <p v-if="collection?.description" class="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
              {{ collection.description }}
            </p>
            <div class="flex items-center gap-2 py-1 text-xs text-gray-500 dark:text-gray-400">
              <span>{{ collection?.quotes_count || 0 }} {{ (collection?.quotes_count || 0) === 1 ? 'quote' : 'quotes' }}</span>
              <span>·</span>
              <UBadge :badge="collection?.is_public ? 'outline-green' : 'outline-red'" size="xs" rounded="full">
                {{ collection?.is_public ? 'Public' : 'Private' }}
              </UBadge>
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
      <div v-else-if="(collection?.quotes?.length || 0) === 0" class="text-center py-16 px-4">
        <UIcon name="i-ph-quotes" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-600 text-gray-900 dark:text-white mb-2">No quotes yet</h3>
        <p class="text-gray-600 dark:text-gray-400">Add quotes to this collection from any quote page.</p>
      </div>

      <!-- Quotes List -->
      <div v-else class="px-3 pt-3 pb-6 space-y-3">
        <QuoteListItem
          v-for="quote in processedMobileQuotes"
          :key="quote.id"
          :quote="quote"
          :actions="collectionQuoteActions"
          @share="handleShareQuote"
          @remove-from-collection="handleRemoveFromCollection"
        />
        
        <div v-if="hasMore" class="pt-3">
          <UButton
            :loading="loadingMore"
            btn="dark:solid-black"
            size="md"
            class="w-full hover:scale-101 active:scale-99 transition-transform duration-300 ease-in-out"
            @click="loadMoreQuotes"
          >
            Load More
          </UButton>
        </div>
      </div>
    </div>

    <!-- Desktop: Collection Detail -->
    <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="loading" class="animate-pulse">
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
      </div>

      <!-- Collection Content -->
      <div v-else-if="collection">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-2">
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white truncate">
                  {{ collection.name }}
                </h1>
                <UBadge v-if="collection.is_public" color="green" variant="subtle">Public</UBadge>
              </div>
              <p v-if="collection.description" class="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {{ collection.description }}
              </p>
              <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                  <UIcon name="i-ph-quotes" class="w-4 h-4" />
                  {{ collection.quotes_count }} quotes
                </span>
                <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                  <UIcon name="i-ph-calendar-plus" class="w-4 h-4" />
                  Created {{ formatDate(collection.created_at) }}
                </span>
                <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                  <UIcon name="i-ph-clock" class="w-4 h-4" />
                  Updated {{ formatDate(collection.updated_at) }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <UButton btn="outline" @click="shareCollection">
                <UIcon name="i-ph-share" />
                Share
              </UButton>
              <UDropdownMenu :items="collectionActions">
                <UButton icon btn="ghost" size="sm" label="i-ph-dots-three-vertical" />
              </UDropdownMenu>
            </div>
          </div>

          <!-- Back Button -->
          <UButton btn="ghost" size="sm" to="/dashboard/lists">
            <UIcon name="i-ph-arrow-left" />
            Back to Lists
          </UButton>
        </div>

        <!-- Quotes Grid -->
        <div v-if="collection.quotes && collection.quotes.length > 0">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuoteCard
              v-for="quote in collection.quotes"
              :key="quote.id"
              :quote="quote"
            />
          </div>

          <!-- Load More -->
          <div v-if="hasMore" class="text-center mt-8">
            <UButton :loading="loadingMore" btn="dark:solid-black" class="w-full sm:w-auto" @click="loadMoreQuotes">
              Load More Quotes
            </UButton>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <UIcon name="i-ph-bookmark" class="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No quotes in this collection
          </h3>
          <p class="text-gray-500 dark:text-gray-400">
            This collection is empty or all quotes are pending approval.
          </p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="text-center py-12">
        <UIcon name="i-ph-warning" class="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Collection not found
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          The collection you're looking for doesn't exist or is not public.
        </p>
        <UButton to="/dashboard/lists">Back to Lists</UButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { CollectionWithQuotes } from '~/types/user-interactions'
import type { ProcessedQuoteResult } from '~/types'

const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()

definePageMeta({
  layout: false,
  middleware: 'auth'
})

const route = useRoute()
const collectionId = computed(() => String(route.params.id))

const collection = ref<CollectionWithQuotes | null>(null)

useHead({
  title: computed(() => collection.value ? `${collection.value.name} - Collections` : 'Collection - Verbatims'),
  meta: [
    {
      name: 'description',
      content: computed(() => collection.value?.description || 'A curated collection of quotes from Verbatims')
    }
  ]
})
const loading = ref(true)
const loadingMore = ref(false)
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

const loadCollection = async (reset = true) => {
  try {
    if (reset) {
      loading.value = true
      currentPage.value = 1
    } else {
      loadingMore.value = true
    }

    const response = await $fetch<any>(`/api/collections/${collectionId.value}` as const, {
      query: {
        page: currentPage.value,
        limit: 12
      }
    })
    
    if (reset) {
      collection.value = response.data as unknown as CollectionWithQuotes
    } else {
      if (collection.value) {
        collection.value.quotes = [...(collection.value.quotes || []), ...(response.data?.quotes || [])]
        // @ts-expect-error pagination may not be part of the type shape but exists in API response
        collection.value.pagination = response.data.pagination
      }
    }
    
    hasMore.value = response.data.pagination.hasMore
  } catch (error) {
    console.error('Failed to load collection:', error)
    collection.value = null
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMoreQuotes = () => {
  currentPage.value++
  loadCollection(false)
}

const processedMobileQuotes = computed<ProcessedQuoteResult[]>(() => {
  return (collection.value?.quotes || []).map((q: any) => ({
    ...q,
    result_type: 'quote',
    author: q.author_id ? { id: q.author_id, name: q.author_name, is_fictional: q.author_is_fictional, image_url: q.author_image_url } : undefined,
    reference: q.reference_id ? { id: q.reference_id, name: q.reference_name, type: q.reference_type } : undefined,
    tags: q.tags || [],
  }))
})

const shareCollection = async () => {
  if (!collection.value) return
  
  try {
    const shareData = {
      title: `${collection.value.name} - Verbatims Collection`,
      text: `Check out this collection of quotes: "${collection.value.name}"`,
      url: window.location.href
    }
    
    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`)
      useToast().toast({
        title: 'Collection Shared',
        description: 'The collection link has been copied to your clipboard.',
        toast: 'success',
      })
    }
  } catch (error) {
    console.error('Failed to share collection:', error)
  }
}

const collectionActions = computed(() => ([
  {
    label: 'Copy Link',
    leading: 'i-ph-link',
    onclick: async () => {
      try {
        await navigator.clipboard.writeText(window.location.href)
        useToast().toast({ title: 'Link copied', description: 'URL copied to clipboard', toast: 'success' })
      } catch (error) {
        console.error('Failed to copy link:', error)
      }
    }
  }
]))

const collectionQuoteActions = [
  {
    label: 'Share',
    leading: 'i-ph-share'
  },
  { divider: true } as any,
  {
    label: 'Remove from Collection',
    leading: 'i-ph-trash'
  }
]

const handleShareQuote = (quote: any) => {
  if (navigator.share) {
    navigator.share({ 
      title: 'Quote from Verbatims', 
      text: quote.name, 
      url: `${window.location.origin}/quotes/${quote.id}` 
    })
  } else {
    navigator.clipboard.writeText(`"${quote.name}" - ${quote.author?.name || ''}`)
    useToast().toast({ title: 'Copied to clipboard' })
  }
}

const handleRemoveFromCollection = async (quote: any) => {
  if (!confirm('Remove this quote from the collection?')) return
  
  try {
    await $fetch(`/api/collections/${collectionId.value}/quotes/${quote.id}`, {
      method: 'DELETE'
    })
    
    // Remove from local state
    if (collection.value) {
      collection.value.quotes = collection.value.quotes?.filter((q: any) => q.id !== quote.id) || []
      if (collection.value.quotes_count) {
        collection.value.quotes_count--
      }
    }
    
    useToast().toast({ 
      title: 'Quote removed',
      description: 'Quote removed from collection'
    })
  } catch (error) {
    console.error('Failed to remove quote:', error)
    useToast().toast({ 
      title: 'Failed to remove quote',
      description: 'Please try again'
    })
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  setPageLayout(currentLayout.value)
  loadCollection()
  // Add mobile scroll listener
  if (isMobile.value) {
    window.addEventListener('scroll', handleScroll, { passive: true })
  }
})

watch(currentLayout, (newLayout) => setPageLayout(newLayout))

onBeforeUnmount(() => {
  if (isMobile.value) {
    window.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
.mobile-collection-detail {
  min-height: calc(100vh - 80px);
}
</style>
