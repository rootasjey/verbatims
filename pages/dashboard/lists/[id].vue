<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Loading State -->
    <div v-if="loading" class="animate-pulse">
      <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 6" :key="i" class="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>

    <!-- Collection Content -->
    <div v-else-if="collection">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                {{ collection.name }}
              </h1>
              <UBadge color="green" variant="subtle">
                Public
              </UBadge>
            </div>
            <p v-if="collection.description" class="text-gray-600 dark:text-gray-400 mb-4">
              {{ collection.description }}
            </p>
            
            <!-- Creator Info -->
            <div class="flex items-center space-x-3 mb-4">
              <UAvatar
                :src="collection.user_avatar"
                :alt="collection.user_name"
                size="sm"
                :ui="{ background: 'bg-primary-500 dark:bg-primary-400' }"
              />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ collection.user_name }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Collection creator
                </p>
              </div>
            </div>
            
            <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{{ collection.quotes_count }} quotes</span>
              <span>Created {{ formatDate(collection.created_at) }}</span>
              <span>Updated {{ formatDate(collection.updated_at) }}</span>
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            <UButton
              variant="outline"
              icon
              label="i-ph-share"
              @click="shareCollection"
            >
              Share
            </UButton>
            <UDropdown :items="collectionActions">
              <UButton
                variant="ghost"
                icon
                label="i-ph-dots-three-vertical"
              />
            </UDropdown>
          </div>
        </div>

        <!-- Back Button -->
        <UButton
          variant="ghost"
          icon
          label="i-ph-arrow-left"
          to="/collections"
          size="sm"
        >
          Back to Collections
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
          <UButton
            variant="outline"
            :loading="loadingMore"
            @click="loadMoreQuotes"
          >
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
      <UButton to="/collections">
        Browse Collections
      </UButton>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const collectionId = route.params.id

// SEO
useHead({
  title: computed(() => collection.value ? `${collection.value.name} - Collections` : 'Collection - Verbatims'),
  meta: [
    {
      name: 'description',
      content: computed(() => collection.value?.description || 'A curated collection of quotes from Verbatims')
    }
  ]
})

// Data
const collection = ref(null)
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(false)
const currentPage = ref(1)

// Load collection
const loadCollection = async (reset = true) => {
  try {
    if (reset) {
      loading.value = true
      currentPage.value = 1
    } else {
      loadingMore.value = true
    }

    const response = await $fetch(`/api/collections/${collectionId}`, {
      query: {
        page: currentPage.value,
        limit: 12
      }
    })
    
    if (reset) {
      collection.value = response.data
    } else {
      collection.value.quotes.push(...response.data.quotes)
      collection.value.pagination = response.data.pagination
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

// Load more quotes
const loadMoreQuotes = () => {
  currentPage.value++
  loadCollection(false)
}

// Share collection
const shareCollection = async () => {
  if (!collection.value) return
  
  try {
    const shareData = {
      title: `${collection.value.name} - Verbatims Collection`,
      text: `Check out this collection of quotes: "${collection.value.name}" by ${collection.value.user_name}`,
      url: window.location.href
    }
    
    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`)
      // TODO: Show toast notification
    }
  } catch (error) {
    console.error('Failed to share collection:', error)
  }
}

// Collection actions
const collectionActions = computed(() => [
  [{
    label: 'Copy Link',
    icon: 'i-ph-link',
    click: async () => {
      try {
        await navigator.clipboard.writeText(window.location.href)
        // TODO: Show success toast
      } catch (error) {
        console.error('Failed to copy link:', error)
      }
    }
  }]
])

// Utility functions
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

// Load initial data
onMounted(() => {
  loadCollection()
})
</script>
