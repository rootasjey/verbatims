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
              <UBadge
                v-if="collection.is_public"
                color="green"
                variant="subtle"
              >
                Public
              </UBadge>
            </div>
            <p v-if="collection.description" class="text-gray-600 dark:text-gray-400 mb-2">
              {{ collection.description }}
            </p>
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
              label="i-ph-pencil"
              @click="showEditModal = true"
            >
              Edit
            </UButton>
            <UButton
              v-if="collection.is_public"
              variant="outline"
              icon
              label="i-ph-eye"
              @click="navigateTo(`/collections/${collection.id}`)"
            >
              View Public
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
          to="/dashboard/collections"
          size="sm"
        >
          Back to Collections
        </UButton>
      </div>

      <!-- Add Quote Section -->
      <div class="mb-8">
        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">Add Quotes</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Add quotes to this collection
              </p>
            </div>
            <UButton
              icon
              label="i-ph-plus"
              @click="showAddQuoteModal = true"
            >
              Add Quote
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- Quotes Grid -->
      <div v-if="collection.quotes && collection.quotes.length > 0">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="quote in collection.quotes"
            :key="quote.id"
            class="relative group"
          >
            <QuoteCard :quote="quote" />
            
            <!-- Remove from Collection Button -->
            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <UButton
                color="red"
                variant="soft"
                size="xs"
                icon
                label="i-ph-x"
                @click="confirmRemoveQuote(quote)"
              />
            </div>
          </div>
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
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          Start building your collection by adding some quotes
        </p>
        <UButton
          icon
          label="i-ph-plus"
          @click="showAddQuoteModal = true"
        >
          Add Your First Quote
        </UButton>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="text-center py-12">
      <UIcon name="i-ph-warning" class="h-16 w-16 text-red-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Collection not found
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        The collection you're looking for doesn't exist or you don't have access to it.
      </p>
      <UButton to="/dashboard/collections">
        Back to Collections
      </UButton>
    </div>

    <!-- Edit Collection Modal -->
    <EditCollectionModal
      v-model="showEditModal"
      :collection="collection"
      @updated="onCollectionUpdated"
    />

    <!-- Add Quote Modal -->
    <AddQuoteToCollectionModal
      v-model="showAddQuoteModal"
      :collection="collection"
      @added="onQuoteAdded"
    />

    <!-- Remove Quote Confirmation -->
    <UModal v-model="showRemoveModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Remove Quote</h3>
        </template>

        <p class="mb-4">
          Are you sure you want to remove this quote from "{{ collection?.name }}"?
        </p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton btn="ghost" @click="showRemoveModal = false">
              Cancel
            </UButton>
            <UButton
              color="red"
              :loading="removing"
              @click="removeQuote"
            >
              Remove Quote
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
// Require authentication
definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const collectionId = route.params.id

// SEO
useHead({
  title: computed(() => collection.value ? `${collection.value.name} - My Collections` : 'Collection - Verbatims')
})

// Data
const collection = ref(null)
const loading = ref(true)
const loadingMore = ref(false)
const removing = ref(false)
const hasMore = ref(false)
const currentPage = ref(1)

// Modals
const showEditModal = ref(false)
const showAddQuoteModal = ref(false)
const showRemoveModal = ref(false)
const selectedQuote = ref(null)

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

const loadMoreQuotes = () => {
  currentPage.value++
  loadCollection(false)
}

const collectionActions = computed(() => [
  [{
    label: 'Delete Collection',
    icon: 'i-ph-trash',
    onclick: () => navigateTo('/dashboard/collections') // TODO: Implement delete
  }]
])

const confirmRemoveQuote = (quote) => {
  selectedQuote.value = quote
  showRemoveModal.value = true
}

const removeQuote = async () => {
  if (!selectedQuote.value) return

  try {
    removing.value = true
    await $fetch(`/api/collections/${collectionId}/quotes/${selectedQuote.value.id}`, {
      method: 'DELETE'
    })

    // Remove from local state
    collection.value.quotes = collection.value.quotes.filter(
      q => q.id !== selectedQuote.value.id
    )
    collection.value.quotes_count--
    
    showRemoveModal.value = false
    selectedQuote.value = null
  } catch (error) {
    console.error('Failed to remove quote:', error)
    useToast().toast({
      title: 'Error',
      description: 'Failed to remove quote',
      status: 'error'
    })
  } finally {
    removing.value = false
  }
}

const onCollectionUpdated = (updatedCollection) => {
  collection.value = { ...collection.value, ...updatedCollection }
}

const onQuoteAdded = (newQuote) => {
  if (!collection.value.quotes) {
    collection.value.quotes = []
  }
  collection.value.quotes.unshift(newQuote)
  collection.value.quotes_count++
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  loadCollection()
})
</script>
