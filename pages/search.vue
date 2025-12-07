<template>
  <div class="min-h-screen">
    <!-- Mobile Search Interface -->
    <div v-if="isMobile" class="mobile-search-page">
      <!-- Search Header -->
      <div class="sticky top-14 bg-white dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-700 p-4 z-30">
        <NInput
          v-model="searchQuery"
          placeholder="Search quotes, authors, references..."
          leading="i-ph-magnifying-glass"
          autofocus
          size="lg"
          rounded="6"
          @input="debouncedSearch"
          class="w-full"
          :una="{
            inputTrailing: 'pointer-events-auto cursor-pointer',
          }"
          :trailing="searchQuery ? 'i-ph-x-circle-duotone' : ''"
          @trailing="searchQuery = ''"
        />
      </div>

      <div class="p-6">
        <!-- Empty State Start Page -->
        <div v-if="!searchQuery.trim()" class="space-y-12">
          <div v-if="recentSearches.length > 0">
            <h3 class="font-serif text-lg font-600 text-gray-900 dark:text-white mt-3 mb-3">Recent searches</h3>
            <div class="flex flex-wrap gap-2">
              <NBadge 
                v-for="search in recentSearches" 
                :key="search"
                rounded="full"
                badge="solid-gray"
                class="cursor-pointer hover:scale-102 active:scale-99 transition-transform"
              >
              <NIcon name="i-ph-magnifying-glass-bold" @click="searchQuery = search" />
              <span class="font-400 font-size-3.5" @click="searchQuery = search">{{ search }}</span>
              <NTooltip :content="`Remove ${search} from recent searches`">
                <NIcon 
                  name="i-ph-x-circle-duotone" 
                  @click="searchStore.removeRecent(search)" 
                  class="ml-1"
                />
              </NTooltip>
            </NBadge>
            </div>
          </div>

          <div>
            <div class="flex justify-between items-center">
              <h3 class="font-serif text-lg font-600 text-gray-900 dark:text-white mb-3">Suggested searches</h3>
              <NTooltip content="Refresh suggestions">
                <NButton 
                  @click="refreshSuggestions()"
                  icon
                  label="i-ph-arrows-clockwise"
                  btn="ghost-gray"
                />
              </NTooltip>
            </div>
            <div class="flex flex-wrap gap-3">
              <NBadge v-for="s in suggestions" 
                :key="s.text"
                rounded="full"
                badge="soft-gray"
                class="cursor-pointer hover:scale-102 active:scale-99 transition-transform animate-bounce-in"
                @click="searchQuery = s.text"
              >
                <NIcon :name="s.icon" size="4" />
                <span class="ml-1 text-sm text-gray-700 dark:text-gray-300">{{ s.text }}</span>
              </NBadge>
            </div>
          </div>

          <div class="pt-2">
            <div class="flex justify-between items-center mb-3">
              <h3 class="font-serif text-lg font-600 text-gray-900 dark:text-white" @click="goToAuthors()">
                Random authors
              </h3>

              <NTooltip content="Fetch new random authors">
                <NButton 
                  @click="fetchRandomAuthors()"
                  icon
                  label="i-ph-arrows-clockwise"
                  btn="ghost-gray"
                />
              </NTooltip>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <NuxtLink
                v-for="author in randomAuthors"
                :key="author.id"
                :to="`/authors/${author.id}`"
                class="flex items-center gap-3 p-3 
                bg-white dark:bg-gray-800 rounded-lg 
                hover:shadow-md active:scale-99 active:shadow-none transition-all animate-fade-in"
              >
                <NAvatar :src="author.image_url">
                  <template #fallback>
                    <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400">
                      <NIcon name="i-ph-user-circle-duotone" class="w-6 h-6" />
                    </div>
                  </template>
                </NAvatar>
                <div>
                  <NTooltip :content="author.name">
                    <div class="author-name font-600 text-gray-900 dark:text-white line-clamp-1">{{ author.name }}</div>
                  </NTooltip>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ author.quotes_count }} quotes</div>
                </div>
              </NuxtLink>
              <div v-if="randomAuthors.length === 0" class="col-span-2 text-sm text-gray-500 dark:text-gray-400">No authors yet</div>
            </div>
          </div>

          <div class="pt-2">
            <div class="flex justify-between items-center">
              <h3 class="font-serif text-lg font-600 text-gray-900 dark:text-white" @click="goToReferences()">
                Random references
              </h3>

              <NTooltip content="Fetch new random references">
                <NButton 
                  @click="fetchRandomReferences()"
                  icon
                  label="i-ph-arrows-clockwise"
                  btn="ghost-gray"
                />
              </NTooltip>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <NuxtLink
                v-for="reference in randomReferences"
                :key="reference.id"
                :to="`/references/${reference.id}`"
                class="flex items-center gap-3 p-3 
                bg-white dark:bg-gray-800 rounded-lg 
                hover:shadow-md active:scale-99 active:shadow-none transition-all animate-fade-in"
              >
                <NAvatar :src="reference.image_url" rounded="2" class="shrink-0 shadow">
                  <template #fallback>
                    <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                      <NIcon name="i-ph-book-duotone" class="w-6 h-6" />
                    </div>
                  </template>
                </NAvatar>
                <div>
                  <NTooltip :content="reference.name">
                    <div class="author-name font-600 text-gray-900 dark:text-white line-clamp-1">{{ reference.name }}</div>
                  </NTooltip>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatReferenceType(reference.primary_type) }} • 
                    <NTooltip :content="`${reference.quotes_count} quotes`">
                      <span>{{ reference.quotes_count }} <NIcon name="i-ph-quotes-duotone" /></span>
                    </NTooltip>
                  </div>
                </div>
              </NuxtLink>
              <div v-if="randomReferences.length === 0" class="col-span-2 text-sm text-gray-500 dark:text-gray-400">No references yet</div>
            </div>
          </div>
        </div>

        <!-- Search Results -->
        <div v-else class="space-y-6">
          <div v-if="loading" class="flex items-center justify-center py-8">
            <div class="flex items-center gap-3">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              <span class="text-gray-600 dark:text-gray-400">Searching...</span>
            </div>
          </div>

          <div v-else-if="searchResults.total > 0" class="space-y-6">
            <div class="text-center py-4">
              <p class="text-gray-600 dark:text-gray-400">
                Found <b>{{ searchResults.total }}</b> results for "<b>{{ searchQuery }}</b>"
              </p>
            </div>

            <div v-if="searchResults.quotes.length > 0" class="space-y-4">
              <h3 class="font-title uppercase text-lg font-600 text-gray-900 dark:text-white">Quotes</h3>
              <div class="space-y-0">
                <QuoteListItem
                  v-for="quote in searchResults.quotes"
                  :key="quote.id"
                  :quote="quote"
                />
              </div>
            </div>

            <div v-if="searchResults.authors.length > 0" class="space-y-4">
              <h3 class="font-title uppercase text-lg font-600 text-gray-900 dark:text-white">Authors</h3>
              <div class="grid gap-3">
                <NuxtLink
                  v-for="author in searchResults.authors"
                  :key="author.id"
                  :to="`/authors/${author.id}`"
                  class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div class="flex space-x-3">
                    <NuxtImg
                      :src="author.image_url"
                      alt="Author Avatar"
                      class="w-10 h-10 rounded-full object-cover"
                      width="40"
                      height="40"
                    />
                    <div>
                      <h4 class="font-600 text-gray-900 dark:text-white">{{ author.name }}</h4>
                      <p class="text-sm text-gray-600 dark:text-gray-400">{{ author.quotes_count }} quotes</p>
                    </div>
                  </div>
                  <NIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
                </NuxtLink>
              </div>
            </div>

            <div v-if="searchResults.references.length > 0" class="space-y-4">
              <h3 class="font-title uppercase text-lg font-600 text-gray-900 dark:text-white">References</h3>
              <div class="grid gap-3">
                <NuxtLink
                  v-for="reference in searchResults.references"
                  :key="reference.id"
                  :to="`/references/${reference.id}`"
                  class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div class="bg-gray-100 dark:bg-gray-700 rounded-2 w-10 h-10 flex items-center justify-center shrink-0">
                    <NIcon :name="getReferenceIcon(reference.primary_type)" />
                  </div>
                  <div>
                    <h4 class="font-600 text-gray-900 dark:text-white">{{ reference.name }}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      {{ reference.primary_type }} • {{ reference.quotes_count }} quotes
                    </p>
                  </div>
                  <NIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- No Results -->
          <div v-else-if="!loading" class="text-center py-8">
            <NIcon name="i-ph-magnifying-glass-minus" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-600 text-gray-900 dark:text-white mb-2">No results found</h3>
            <p class="text-gray-600 dark:text-gray-400">Try adjusting your search terms</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop: Redirect to home with search modal -->
    <div v-else class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <NIcon name="i-ph-desktop" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 class="text-xl font-600 text-gray-900 dark:text-white mb-4">Desktop Search</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">Use the search button in the header or press Ctrl/Cmd+K</p>
        <NButton btn="solid-black" @click="navigateTo('/')">
          Go to Home
        </NButton>
      </div>
    </div>
  </div>
</template><template #fallback>
                    <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400">
                      <NIcon name="i-ph-user-circle-duotone" class="w-6 h-6" />
                    </div>
                  </template>
                </NAvatar>
                <div>
                  <NTooltip :content="author.name">
                    <div class="author-name font-600 text-gray-900 dark:text-white line-clamp-1">{{ author.name }}</div>
                  </NTooltip>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ author.quotes_count }} quotes</div>
                </div>
              </NuxtLink>
              <div v-if="randomAuthors.length === 0" class="col-span-2 text-sm text-gray-500 dark:text-gray-400">No authors yet</div>
            </div>
          </div>

          <div class="pt-2">
            <div class="flex justify-between items-center">
              <h3 class="font-serif text-lg font-600 text-gray-900 dark:text-white" @click="goToReferences()">
                Random references
              </h3>

              <NTooltip content="Fetch new random references">
                <NButton 
                  @click="fetchRandomReferences()"
                  icon
                  label="i-ph-arrows-clockwise"
                  btn="ghost-gray"
                />
              </NTooltip>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <NuxtLink
                v-for="reference in randomReferences"
                :key="reference.id"
                :to="`/references/${reference.id}`"
                class="flex items-center gap-3 p-3 
                bg-white dark:bg-gray-800 rounded-lg 
                hover:shadow-md active:scale-99 active:shadow-none transition-all animate-fade-in"
              >
                <NAvatar :src="reference.image_url" rounded="2" class="shrink-0 shadow">
                  <template #fallback>
                    <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                      <NIcon name="i-ph-book-duotone" class="w-6 h-6" />
                    </div>
                  </template>
                </NAvatar>
                <div>
                  <NTooltip :content="reference.name">
                    <div class="author-name font-600 text-gray-900 dark:text-white line-clamp-1">{{ reference.name }}</div>
                  </NTooltip>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatReferenceType(reference.primary_type) }} • 
                    <NTooltip :content="`${reference.quotes_count} quotes`">
                      <span>{{ reference.quotes_count }} <NIcon name="i-ph-quotes-duotone" /></span>
                    </NTooltip>
                  </div>
                </div>
              </NuxtLink>
              <div v-if="randomReferences.length === 0" class="col-span-2 text-sm text-gray-500 dark:text-gray-400">No references yet</div>
            </div>
          </div>
        </div>

        <!-- Search Results -->
        <div v-else class="space-y-6">
          <div v-if="loading" class="flex items-center justify-center py-8">
            <div class="flex items-center gap-3">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              <span class="text-gray-600 dark:text-gray-400">Searching...</span>
            </div>
          </div>

          <div v-else-if="searchResults.total > 0" class="space-y-6">
            <div class="text-center py-4">
              <p class="text-gray-600 dark:text-gray-400">
                Found <b>{{ searchResults.total }}</b> results for "<b>{{ searchQuery }}</b>"
              </p>
            </div>

            <div v-if="searchResults.quotes.length > 0" class="space-y-4">
              <h3 class="font-title uppercase text-lg font-600 text-gray-900 dark:text-white">Quotes</h3>
              <div class="space-y-0">
                <QuoteListItem
                  v-for="quote in searchResults.quotes"
                  :key="quote.id"
                  :quote="quote"
                />
              </div>
            </div>

            <div v-if="searchResults.authors.length > 0" class="space-y-4">
              <h3 class="font-title uppercase text-lg font-600 text-gray-900 dark:text-white">Authors</h3>
              <div class="grid gap-3">
                <NuxtLink
                  v-for="author in searchResults.authors"
                  :key="author.id"
                  :to="`/authors/${author.id}`"
                  class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div class="flex space-x-3">
                    <NuxtImg
                      :src="author.image_url"
                      alt="Author Avatar"
                      class="w-10 h-10 rounded-full object-cover"
                      width="40"
                      height="40"
                    />
                    <div>
                      <h4 class="font-600 text-gray-900 dark:text-white">{{ author.name }}</h4>
                      <p class="text-sm text-gray-600 dark:text-gray-400">{{ author.quotes_count }} quotes</p>
                    </div>
                  </div>
                  <NIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
                </NuxtLink>
              </div>
            </div>

            <div v-if="searchResults.references.length > 0" class="space-y-4">
              <h3 class="font-title uppercase text-lg font-600 text-gray-900 dark:text-white">References</h3>
              <div class="grid gap-3">
                <NuxtLink
                  v-for="reference in searchResults.references"
                  :key="reference.id"
                  :to="`/references/${reference.id}`"
                  class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div class="bg-gray-100 dark:bg-gray-700 rounded-2 w-10 h-10 flex items-center justify-center shrink-0">
                    <NIcon :name="getReferenceIcon(reference.primary_type)" />
                  </div>
                  <div>
                    <h4 class="font-600 text-gray-900 dark:text-white">{{ reference.name }}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      {{ reference.primary_type }} • {{ reference.quotes_count }} quotes
                    </p>
                  </div>
                  <NIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- No Results -->
          <div v-else-if="!loading" class="text-center py-8">
            <NIcon name="i-ph-magnifying-glass-minus" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-600 text-gray-900 dark:text-white mb-2">No results found</h3>
            <p class="text-gray-600 dark:text-gray-400">Try adjusting your search terms</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop: Redirect to home with search modal -->
    <div v-else class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <NIcon name="i-ph-desktop" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 class="text-xl font-600 text-gray-900 dark:text-white mb-4">Desktop Search</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">Use the search button in the header or press Ctrl/Cmd+K</p>
        <NButton btn="solid-black" @click="navigateTo('/')">
          Go to Home
        </NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SearchResults } from '~/types'
import { useSearchStore } from '~/stores/search'
import { useMobileDetection, useLayoutSwitching } from '~/composables/useMobileDetection'
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

const suggestions = ref(searchStore.getRandomSuggestedSearch(5))
function refreshSuggestions() {
  suggestions.value = searchStore.getRandomSuggestedSearch(5)
}

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

const randomAuthors = ref<any[]>([])
const randomReferences = ref<any[]>([])

async function fetchRandomAuthors(n = 4) {
  try {
    const res = await $fetch('/api/authors/random', { params: { count: n } })
    randomAuthors.value = res.authors || []
  } catch (e) {
    randomAuthors.value = []
  }
}

async function fetchRandomReferences(n = 4) {
  try {
    const res = await $fetch('/api/references/random', { params: { count: n } })
    randomReferences.value = res.references || []
  } catch (e) {
    randomReferences.value = []
  }
}

function goToAuthors() {
  router.push('/authors')
}

function goToReferences() {
  router.push('/references')
}

onMounted(async () => {
  setPageLayout(currentLayout.value)

  const q = typeof route.query.q === 'string' ? route.query.q : ''
  if (q && q !== searchStore.query) {
    searchStore.setQuery(q)
  }
  if (searchStore.query && (searchStore.results.total === 0 || searchStore.isStale())) {
    await searchStore.search({ limit: 20 })
  }
  // Fetch random authors/references if no search query
  if (!searchStore.query.trim()) {
    await Promise.all([
      fetchRandomAuthors(4),
      fetchRandomReferences(4)
    ])
  }
})
</script>

<style scoped>
.mobile-search-page {
  /* Ensure proper spacing for mobile layout */
  min-height: calc(100vh - 80px); /* Account for bottom navigation */
}

.author-name {
  font-size: 0.8rem;

  @media screen and (min-width: 460px) {
    font-size: 1.125rem; /* 18px on sm and up */    
  }
}
</style>
