<template>
  <div class="min-h-screen bg-[#FAFAF9] dark:bg-[#0C0A09]">
    <!-- Loading skeleton (SSR/hydration) — skip when store already has data -->
    <div v-if="!hydrated && !searchStore.hasResults" class="mobile-search-page">
      <!-- Search bar skeleton -->
      <div class="sticky top-14 bg-[#FAFAF9] dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-700 p-4 z-30">
        <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>

      <div class="p-6 animate-pulse">
        <!-- Suggested searches skeleton -->
        <div class="py-6">
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4" />
          <div class="flex flex-wrap gap-2">
            <div v-for="i in 4" :key="i" class="h-7 bg-gray-200 dark:bg-gray-700 rounded-full" :class="i % 2 === 0 ? 'w-24' : 'w-28'" />
          </div>
        </div>

        <div class="border-t border-dashed border-gray-300 dark:border-gray-700" />

        <!-- Authors skeleton -->
        <div class="py-6">
          <div class="flex items-center justify-between mb-5">
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-14" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div v-for="i in 4" :key="i" class="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0" />
              <div class="space-y-2 flex-1 min-w-0">
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-dashed border-gray-300 dark:border-gray-700" />

        <!-- References skeleton -->
        <div class="py-6">
          <div class="flex items-center justify-between mb-5">
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-14" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div v-for="i in 4" :key="i" class="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded shrink-0" />
              <div class="space-y-2 flex-1 min-w-0">
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Search Interface -->
    <div v-else-if="isMobile" class="mobile-search-page">
      <!-- Search Header -->
      <div class="sticky top-14 bg-[#FAFAF9] dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-700 p-4 z-30">
        <NInput
          v-model="searchQuery"
          :placeholder="$t('search_placeholder') as string"
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
        <div v-if="!searchQuery.trim()" class="space-y-0">
          <!-- Recent searches -->
          <div v-if="recentSearches.length > 0" class="pb-6 animate-fade-in-up" style="animation-delay: 0s">
            <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 mb-3">{{ $t('section_recent') }}</p>
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
              <NTooltip :content="$t('remove_recent', { search }) as string">
                <NIcon
                  name="i-ph-x-circle-duotone"
                  @click="searchStore.removeRecent(search)"
                  class="ml-1"
                />
              </NTooltip>
            </NBadge>
            </div>
          </div>

          <div v-if="recentSearches.length > 0" class="border-t border-dashed border-gray-300 dark:border-gray-700" />

          <!-- Suggested searches -->
          <div class="py-6 animate-fade-in-up" style="animation-delay: 0.12s">
            <div class="flex items-center justify-between mb-4">
              <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">{{ $t('section_suggested') }}</p>
              <NTooltip :content="$t('refresh_suggestions') as string">
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
                class="cursor-pointer hover:scale-102 active:scale-99 transition-transform"
                @click="searchQuery = s.text"
              >
                <NIcon :name="s.icon" size="4" />
                <span class="ml-1 text-sm text-gray-700 dark:text-gray-300">{{ s.text }}</span>
              </NBadge>
            </div>
          </div>

          <div class="border-t border-dashed border-gray-300 dark:border-gray-700" />

          <!-- Random authors -->
          <div class="py-6 animate-fade-in-up" style="animation-delay: 0.24s">
            <div class="flex items-center justify-between mb-5">
              <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">{{ $t('section_authors') }}</p>
              <div class="flex items-center gap-2">
                <NTooltip :content="$t('refresh_authors') as string">
                  <NButton
                    @click="fetchRandomAuthors()"
                    icon
                    label="i-ph-arrows-clockwise"
                    btn="ghost-gray"
                  />
                </NTooltip>
                <NuxtLink
                  to="/authors"
                  class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-4
                    font-sans text-xs font-600 tracking-[0.1em] text-gray-400
                    dark:text-gray-400
                    hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-300
                    hover:scale-105 active:scale-99
                    transition-[colors,transform]">
                  See All
                </NuxtLink>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <NuxtLink
                v-for="author in randomAuthors"
                :key="author.id"
                :to="`/authors/${author.id}`"
                class="flex items-center gap-3 p-3
                bg-white dark:bg-gray-800 rounded-lg
                hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-99 transition-all"
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
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ $t('author_quotes_count', { count: author.quotes_count }) }}</div>
                </div>
              </NuxtLink>
              <div v-if="randomAuthors.length === 0" class="col-span-2 text-sm text-gray-500 dark:text-gray-400">{{ $t('empty_authors') }}</div>
            </div>
          </div>

          <div class="border-t border-dashed border-gray-300 dark:border-gray-700" />

          <!-- Random references -->
          <div class="py-6 animate-fade-in-up" style="animation-delay: 0.36s">
            <div class="flex items-center justify-between mb-5">
              <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">{{ $t('section_references') }}</p>
              <div class="flex items-center gap-2">
                <NTooltip :content="$t('refresh_references') as string">
                  <NButton
                    @click="fetchRandomReferences()"
                    icon
                    label="i-ph-arrows-clockwise"
                    btn="ghost-gray"
                  />
                </NTooltip>
                <NuxtLink
                  to="/references"
                  class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-4
                    font-sans text-xs font-600 tracking-[0.1em] text-gray-400
                    dark:text-gray-400
                    hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-300
                    hover:scale-105 active:scale-99
                    transition-[colors,transform]">
                  See All
                </NuxtLink>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <NuxtLink
                v-for="reference in randomReferences"
                :key="reference.id"
                :to="`/references/${reference.id}`"
                class="flex items-center gap-3 p-3
                bg-white dark:bg-gray-800 rounded-lg
                hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-99 transition-all"
              >
                <NAvatar :src="reference.image_url" rounded="2" class="shrink-0">
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
                    <NTooltip :content="$t('reference_meta', { type: formatReferenceType(reference.primary_type), count: reference.quotes_count }) as string">
                      <span>{{ reference.quotes_count }} <NIcon name="i-ph-quotes-duotone" /></span>
                    </NTooltip>
                  </div>
                </div>
              </NuxtLink>
              <div v-if="randomReferences.length === 0" class="col-span-2 text-sm text-gray-500 dark:text-gray-400">{{ $t('empty_references') }}</div>
            </div>
          </div>
        </div>

        <!-- Search Results -->
        <div v-else class="space-y-6">
          <div v-if="loading" class="flex items-center justify-center py-8">
            <div class="flex items-center gap-3">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              <span class="text-gray-600 dark:text-gray-400">{{ $t('status_searching') }}</span>
            </div>
          </div>

          <div v-else-if="searchResults.total > 0" class="space-y-6">
            <div class="text-center py-4">
              <p class="text-gray-600 dark:text-gray-400">
                {{ $t('results_count', { count: searchResults.total, query: searchQuery }) }}
              </p>
            </div>

            <div v-if="searchResults.quotes.length > 0" class="space-y-4">
              <h3 class="font-title uppercase text-lg font-600 text-gray-900 dark:text-white">{{ $t('section_quotes') }}</h3>
              <div class="space-y-0">
                <QuoteListItem
                  v-for="quote in searchResults.quotes"
                  :key="quote.id"
                  :quote="quote"
                />
              </div>
            </div>

            <div v-if="searchResults.authors.length > 0" class="space-y-4">
              <h3 class="font-title uppercase text-lg font-600 text-gray-900 dark:text-white">{{ $t('section_results_authors') }}</h3>
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
                      :alt="$t('alt_author') as string"
                      class="w-10 h-10 rounded-full object-cover"
                      width="40"
                      height="40"
                    />
                    <div>
                      <h4 class="font-600 text-gray-900 dark:text-white">{{ author.name }}</h4>
                      <p class="text-sm text-gray-600 dark:text-gray-400">{{ $t('author_quotes_count', { count: author.quotes_count }) }}</p>
                    </div>
                  </div>
                  <NIcon name="i-ph-arrow-right" class="w-5 h-5 text-gray-400" />
                </NuxtLink>
              </div>
            </div>

            <div v-if="searchResults.references.length > 0" class="space-y-4">
              <h3 class="font-title uppercase text-lg font-600 text-gray-900 dark:text-white">{{ $t('section_results_references') }}</h3>
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
                      {{ $t('reference_meta', { type: reference.primary_type, count: reference.quotes_count }) }}
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
            <h3 class="text-lg font-600 text-gray-900 dark:text-white mb-2">{{ $t('empty_title') }}</h3>
            <p class="text-gray-600 dark:text-gray-400">{{ $t('empty_desc') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop: Redirect to home with search modal -->
    <div v-else class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <NIcon name="i-ph-desktop" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 class="text-xl font-600 text-gray-900 dark:text-white mb-4">{{ $t('desktop_title') }}</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-6">{{ $t('desktop_desc') }}</p>
        <NButton btn="solid-black" @click="navigateTo('/')">
          {{ $t('desktop_button') }}
        </NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import type { SearchResults } from '~/types'
import { useSearchStore } from '~/stores/search'
import { useMobileDetection } from '~/composables/useMobileDetection'
import { useVerbatimsSeo } from '~/composables/useSeo'
import { navigateTo } from 'nuxt/app'
import { formatReferenceType, getReferenceIcon } from '~/utils/reference'

const { isMobile } = useMobileDetection()
const appReady = useState('app-ready', () => false)
const hydrated = ref(appReady.value)

onNuxtReady(() => {
  hydrated.value = true
})

const route = useRoute()
const router = useRouter()
const searchStore = useSearchStore()

definePageMeta({
  layout: 'default',
  keepalive: true
})

const { $t } = useI18n()

useVerbatimsSeo({
  title: $t('meta_title') as string,
  description: $t('meta_desc') as string,
  type: 'website'
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
</style>
