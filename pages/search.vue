<template>
  <div class="min-h-screen">
    <!-- Mobile Search Interface -->
    <div v-if="isMobile" class="mobile-search-page">
      <!-- Search Header -->
      <div class="sticky top-14 bg-white dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-700 p-4 z-30">
        <UInput
          v-model="searchQuery"
          placeholder="Search quotes, authors, references..."
          leading="i-ph-magnifying-glass"
          size="lg"
          autofocus
          @input="debouncedSearch"
          class="w-full"
        />
      </div>

      <!-- Search Results or Navigation -->
      <div class="p-4">
        <!-- Empty State: Show Navigation Links -->
        <div v-if="!searchQuery.trim()" class="space-y-6">
          <div class="text-center py-8">
            <UIcon name="i-ph-magnifying-glass" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 class="text-xl font-600 text-gray-900 dark:text-white mb-2">Search Verbatims</h2>
            <p class="text-gray-600 dark:text-gray-400">Find quotes, authors, and references</p>
          </div>

          <!-- Quick Navigation -->
          <div class="space-y-3">
            <h3 class="text-lg font-600 text-gray-900 dark:text-white mb-4">Browse by Category</h3>
            
            <NuxtLink
              to="/authors"
              class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div class="flex items-center space-x-3">
                <UIcon name="i-ph-user-bold" class="w-6 h-6 text-blue-500" />
                <div>
                  <h4 class="font-600 text-gray-900 dark:text-white">Authors</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Browse quotes by author</p>
                </div>
              </div>
              <UIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
            </NuxtLink>

            <NuxtLink
              to="/references"
              class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div class="flex items-center space-x-3">
                <UIcon name="i-ph-book-bold" class="w-6 h-6 text-green-500" />
                <div>
                  <h4 class="font-600 text-gray-900 dark:text-white">References</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Explore books, films, and more</p>
                </div>
              </div>
              <UIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
            </NuxtLink>
          </div>

          <!-- Recent Searches (if any) -->
          <div v-if="recentSearches.length > 0" class="space-y-3">
            <h3 class="text-lg font-600 text-gray-900 dark:text-white">Recent Searches</h3>
            <div class="space-y-2">
              <button
                v-for="search in recentSearches"
                :key="search"
                @click="searchQuery = search"
                class="flex items-center justify-between w-full p-3 text-left bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span class="text-gray-700 dark:text-gray-300">{{ search }}</span>
                <UIcon name="i-ph-clock" class="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        <!-- Search Results -->
        <div v-else class="space-y-6">
          <!-- Loading State -->
          <div v-if="loading" class="flex items-center justify-center py-8">
            <div class="flex items-center gap-3">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              <span class="text-gray-600 dark:text-gray-400">Searching...</span>
            </div>
          </div>

          <!-- Results -->
          <div v-else-if="searchResults.total > 0" class="space-y-6">
            <!-- Results Summary -->
            <div class="text-center py-4">
              <p class="text-gray-600 dark:text-gray-400">
                Found <b>{{ searchResults.total }}</b> results for "<b>{{ searchQuery }}</b>"
              </p>
            </div>

            <!-- Quotes Results -->
            <div v-if="searchResults.quotes.length > 0" class="space-y-4">
              <h3 class="text-lg font-600 text-gray-900 dark:text-white">Quotes</h3>
              <div class="space-y-0">
                <QuoteListItem
                  v-for="quote in searchResults.quotes"
                  :key="quote.id"
                  :quote="quote"
                />
              </div>
            </div>

            <!-- Authors Results -->
            <div v-if="searchResults.authors.length > 0" class="space-y-4">
              <h3 class="text-lg font-600 text-gray-900 dark:text-white">Authors</h3>
              <div class="grid gap-3">
                <NuxtLink
                  v-for="author in searchResults.authors"
                  :key="author.id"
                  :to="`/authors/${author.id}`"
                  class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div>
                    <h4 class="font-600 text-gray-900 dark:text-white">{{ author.name }}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ author.quotes_count }} quotes</p>
                  </div>
                  <UIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
                </NuxtLink>
              </div>
            </div>

            <!-- References Results -->
            <div v-if="searchResults.references.length > 0" class="space-y-4">
              <h3 class="text-lg font-600 text-gray-900 dark:text-white">References</h3>
              <div class="grid gap-3">
                <NuxtLink
                  v-for="reference in searchResults.references"
                  :key="reference.id"
                  :to="`/references/${reference.id}`"
                  class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div>
                    <h4 class="font-600 text-gray-900 dark:text-white">{{ reference.name }}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      {{ reference.primary_type }} • {{ reference.quotes_count }} quotes
                    </p>
                  </div>
                  <UIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- No Results -->
          <div v-else-if="!loading" class="text-center py-8">
            <UIcon name="i-ph-magnifying-glass-minus" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-600 text-gray-900 dark:text-white mb-2">No results found</h3>
            <p class="text-gray-600 dark:text-gray-400">Try adjusting your search terms</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop: Redirect to home with search modal -->
    <div v-else class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <UIcon name="i-ph-desktop" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 class="text-xl font-600 text-gray-900 dark:text-white mb-4">Desktop Search</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">Use the search button in the header or press Ctrl/Cmd+K</p>
        <UButton btn="solid-black" @click="navigateTo('/')">
          Go to Home
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SearchResults } from '~/types'
import { useSearchStore } from '~/stores/search'
const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()
const route = useRoute()
const router = useRouter()
const searchStore = useSearchStore()

definePageMeta({
  layout: false,
  keepalive: true
})

useHead({
  title: 'verbatims - search',
  meta: [
    {
      name: 'description',
      content: 'Search quotes, authors, and references on Verbatims. Find inspiring quotes from books, films, and more.',
    }
  ]
})

// Proxy to store so the template remains unchanged
const searchQuery = computed({
  get: () => searchStore.query,
  set: (v: string) => searchStore.setQuery(v)
})

const searchResults = computed<SearchResults>(() => searchStore.results)
const loading = computed<boolean>(() => searchStore.loading)
const recentSearches = computed<string[]>(() => searchStore.recent)

const debouncedSearch = useDebounceFn(async () => {
  const q = searchQuery.value.trim()
  // Keep the query in the URL to support back/forward and deep-linking
  router.replace({ path: '/search', query: q ? { q } : {} })
  await searchStore.search({ limit: 20 })
}, 300)

onMounted(async () => {
  setPageLayout(currentLayout.value)

  const q = typeof route.query.q === 'string' ? route.query.q : ''
  if (q && q !== searchStore.query) {
    searchStore.setQuery(q)
  }
  if (searchStore.query && (searchStore.results.total === 0 || searchStore.isStale())) {
    await searchStore.search({ limit: 20 })
  }
})

watch(currentLayout, (newLayout) => {
  setPageLayout(newLayout)
})

// Keep store in sync when user navigates back/forward
watch(() => route.query.q, (newQ) => {
  const q = typeof newQ === 'string' ? newQ : ''
  if (q !== searchStore.query) {
    searchStore.setQuery(q)
    if (q) searchStore.search({ limit: 20 })
    else searchStore.clear()
  }
})
</script>

<style scoped>
.mobile-search-page {
  /* Ensure proper spacing for mobile layout */
  min-height: calc(100vh - 80px); /* Account for bottom navigation */
}
</style>
