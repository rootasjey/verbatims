<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
</template>

<script lang="ts" setup>
import type { CollectionWithQuotes } from '~/types/user-interactions'

definePageMeta({
  layout: 'dashboard',
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  loadCollection()
})
</script>
