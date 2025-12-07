<template>
  <NDialog v-model:open="isOpen" :una="{ dialogContent: 'sm:max-w-2xl' }">
    <NCard>
      <template #header>
        <h3 class="text-lg font-semibold">Add Quote to Collection</h3>
      </template>

      <div class="space-y-6">
        <!-- Search Quotes -->
        <div>
          <NInput
            v-model="searchQuery"
            placeholder="Search quotes..."
            leading="i-ph-magnifying-glass"
            @input="debouncedSearch"
          />
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="space-y-4">
          <div v-for="i in 3" :key="i" class="animate-pulse">
            <div class="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>

        <!-- Quotes List -->
        <div v-else-if="quotes.length > 0" class="space-y-3 max-h-96 overflow-y-auto">
          <div
            v-for="quote in quotes"
            :key="quote.id"
            class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            :class="{ 'opacity-50': addingQuotes.has(quote.id) }"
            @click="addQuoteToCollection(quote)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-2">
                  "{{ quote.name }}"
                </p>
                <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span v-if="quote.author_name">{{ quote.author_name }}</span>
                  <span v-if="quote.reference_name">• {{ quote.reference_name }}</span>
                </div>
              </div>
              <div class="ml-4">
                <NButton
                  v-if="!addingQuotes.has(quote.id)"
                  size="xs"
                  icon
                  label="i-ph-plus"
                  @click.stop="addQuoteToCollection(quote)"
                >
                  Add
                </NButton>
                <NIcon
                  v-else
                  name="i-ph-spinner"
                  class="w-4 h-4 animate-spin text-primary-500"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-8">
          <NIcon name="i-ph-magnifying-glass" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p class="text-gray-500 dark:text-gray-400">
            {{ searchQuery ? 'No quotes found matching your search' : 'Start typing to search for quotes' }}
          </p>
        </div>

        <!-- Load More -->
        <div v-if="hasMore && !loading" class="text-center">
          <NButton
            variant="ghost"
            size="sm"
            :loading="loadingMore"
            @click="loadMore"
          >
            Load More
          </NButton>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <NButton
            variant="ghost"
            @click="closeModal"
          >
            Close
          </NButton>
        </div>
      </template>
    </NCard>
  </NDialog>
</template><script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  collection: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'added'])

// Modal state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Data
const quotes = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(false)
const currentPage = ref(1)
const searchQuery = ref('')
const addingQuotes = ref(new Set())

// Search quotes
const searchQuotes = async (reset = true) => {
  if (!searchQuery.value.trim()) {
    quotes.value = []
    hasMore.value = false
    return
  }

  try {
    if (reset) {
      loading.value = true
      currentPage.value = 1
    } else {
      loadingMore.value = true
    }

    const response = await $fetch('/api/quotes', {
      query: {
        search: searchQuery.value,
        status: 'approved',
        page: currentPage.value,
        limit: 10
      }
    })
    
    if (reset) {
      quotes.value = response.data
    } else {
      quotes.value.push(...response.data)
    }
    
    hasMore.value = response.hasMore
  } catch (error) {
    console.error('Failed to search quotes:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// Debounced search
const debouncedSearch = useDebounceFn(() => {
  searchQuotes()
}, 300)

// Load more quotes
const loadMore = () => {
  currentPage.value++
  searchQuotes(false)
}

// Add quote to collection
const addQuoteToCollection = async (quote) => {
  if (!props.collection || addingQuotes.value.has(quote.id)) return

  try {
    addingQuotes.value.add(quote.id)
    
    const response = await $fetch(`/api/collections/${props.collection.id}/quotes`, {
      method: 'POST',
      body: { quote_id: quote.id }
    })
    
    emit('added', response.data)
    
    // Remove from search results
    quotes.value = quotes.value.filter(q => q.id !== quote.id)
    
    // TODO: Show success toast
  } catch (error) {
    console.error('Failed to add quote to collection:', error)
    
    if (error.statusCode === 409) {
      // Quote already in collection
      quotes.value = quotes.value.filter(q => q.id !== quote.id)
    }
    
    // TODO: Show error toast
  } finally {
    addingQuotes.value.delete(quote.id)
  }
}

// Close modal and reset
const closeModal = () => {
  isOpen.value = false
  quotes.value = []
  searchQuery.value = ''
  hasMore.value = false
  currentPage.value = 1
  addingQuotes.value.clear()
}

// Reset when modal closes
watch(isOpen, (newValue) => {
  if (!newValue) {
    nextTick(() => {
      quotes.value = []
      searchQuery.value = ''
      hasMore.value = false
      currentPage.value = 1
      addingQuotes.value.clear()
    })
  }
})
</script>
