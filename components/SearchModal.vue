<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-2xl' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Search Quotes</h3>
          <UButton
            variant="ghost"
            icon="i-ph-x"
            size="sm"
            @click="isOpen = false"
          />
        </div>
      </template>

      <div class="space-y-4">
        <!-- Search Input -->
        <UInput
          v-model="searchQuery"
          placeholder="Search quotes, authors, or references..."
          icon="i-ph-magnifying-glass"
          size="lg"
          @input="debouncedSearch"
        />

        <!-- Filters -->
        <div class="flex flex-wrap gap-2">
          <USelectMenu
            v-model="selectedLanguage"
            :options="languageOptions"
            placeholder="Language"
            size="sm"
          />
          <USelectMenu
            v-model="selectedAuthor"
            :options="authorOptions"
            placeholder="Author"
            size="sm"
            searchable
          />
          <USelectMenu
            v-model="selectedReference"
            :options="referenceOptions"
            placeholder="Reference"
            size="sm"
            searchable
          />
        </div>

        <!-- Search Results -->
        <div class="max-h-96 overflow-y-auto">
          <div v-if="loading" class="space-y-3">
            <div v-for="i in 3" :key="i" class="animate-pulse">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>

          <div v-else-if="searchResults.length === 0 && searchQuery" class="text-center py-8">
            <UIcon name="i-ph-magnifying-glass" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500 dark:text-gray-400">No quotes found for "{{ searchQuery }}"</p>
          </div>

          <div v-else-if="searchResults.length > 0" class="space-y-3">
            <div
              v-for="quote in searchResults"
              :key="quote.id"
              class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              @click="selectQuote(quote)"
            >
              <p class="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-2">
                "{{ quote.name }}"
              </p>
              <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span v-if="quote.author">{{ quote.author.name }}</span>
                <span v-if="quote.reference">{{ quote.reference.name }}</span>
                <div class="flex items-center space-x-2">
                  <UIcon name="i-ph-heart" class="w-3 h-3" />
                  <span>{{ quote.likes_count }}</span>
                  <UIcon name="i-ph-eye" class="w-3 h-3" />
                  <span>{{ quote.views_count }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8">
            <UIcon name="i-ph-quotes" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500 dark:text-gray-400">Start typing to search quotes...</p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <span>{{ searchResults.length }} results</span>
          <div class="flex items-center space-x-4">
            <span>Press <kbd class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Enter</kbd> to select</span>
            <span>Press <kbd class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Esc</kbd> to close</span>
          </div>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Search state
const searchQuery = ref('')
const searchResults = ref([])
const loading = ref(false)

// Filter state
const selectedLanguage = ref(null)
const selectedAuthor = ref(null)
const selectedReference = ref(null)

// Options for filters
const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'Spanish', value: 'es' },
  { label: 'German', value: 'de' },
  { label: 'Italian', value: 'it' }
]

const authorOptions = ref([])
const referenceOptions = ref([])

// Debounced search function
const debouncedSearch = useDebounceFn(async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  loading.value = true
  try {
    const { data } = await $fetch('/api/search', {
      query: {
        q: searchQuery.value,
        language: selectedLanguage.value,
        author: selectedAuthor.value,
        reference: selectedReference.value,
        limit: 20
      }
    })
    
    searchResults.value = data || []
  } catch (error) {
    console.error('Search error:', error)
    searchResults.value = []
  } finally {
    loading.value = false
  }
}, 300)

// Load filter options
const loadFilterOptions = async () => {
  try {
    const [authorsData, referencesData] = await Promise.all([
      $fetch('/api/authors?limit=100'),
      $fetch('/api/references?limit=100')
    ])
    
    authorOptions.value = authorsData.data?.map(author => ({
      label: author.name,
      value: author.id
    })) || []
    
    referenceOptions.value = referencesData.data?.map(reference => ({
      label: reference.name,
      value: reference.id
    })) || []
  } catch (error) {
    console.error('Failed to load filter options:', error)
  }
}

// Select quote and navigate
const selectQuote = (quote) => {
  isOpen.value = false
  navigateTo(`/quote/${quote.id}`)
}

// Keyboard shortcuts
const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    isOpen.value = false
  }
}

// Watch for modal open/close
watch(isOpen, (newValue) => {
  if (newValue) {
    loadFilterOptions()
    nextTick(() => {
      document.addEventListener('keydown', handleKeydown)
    })
  } else {
    document.removeEventListener('keydown', handleKeydown)
    // Reset search state
    searchQuery.value = ''
    searchResults.value = []
    selectedLanguage.value = null
    selectedAuthor.value = null
    selectedReference.value = null
  }
})

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

kbd {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.75rem;
}
</style>
