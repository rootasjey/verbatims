<template>
  <UDialog 
    v-if="isOpen" 
    v-model:open="isOpen" 
    :una="{ dialogContent: 'sm:max-w-md md:max-w-lg lg:max-w-xl' }"
    :ui="{ 
      width: 'sm:max-w-2xl',
      height: 'max-h-[80vh]'
    }"
    :_dialog-close="{
      btn: 'ghost-gray',
    }"
  >
    <UCard class="border-none m-0 p-0 shadow-none">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Search Quotes</h3>
        </div>
      </template>

      <div class="space-y-4">
        <UInput
          v-model="searchQuery"
          placeholder="Search quotes, authors, or references..."
          leading="i-ph-magnifying-glass"
          size="md"
          autofocus
          @input="debouncedSearch"
        />

        <!-- Active Filter Chips -->
        <div
          v-if="selectedLanguage || selectedAuthor || selectedReference"
          class="flex flex-wrap items-center gap-2 -mt-2"
        >
          <!-- Language chip -->
          <span
            v-if="selectedLanguageLabel"
            class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 border border-primary-200 dark:border-primary-800"
          >
            <UIcon name="i-ph-translate" class="w-3.5 h-3.5" />
            <span>{{ selectedLanguageLabel }}</span>
            <button
              class="ml-1 text-primary-700/70 hover:text-primary-900 dark:text-primary-300/80 dark:hover:text-primary-200"
              aria-label="Remove language filter"
              @click="removeLanguageFilter"
              type="button"
            >
              <UIcon name="i-ph-x" class="w-3.5 h-3.5" />
            </button>
          </span>

          <!-- Author chip -->
          <span
            v-if="selectedAuthorLabel"
            class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
          >
            <UIcon name="i-ph-user" class="w-3.5 h-3.5" />
            <span>{{ selectedAuthorLabel }}</span>
            <button
              class="ml-1 text-emerald-700/70 hover:text-emerald-900 dark:text-emerald-300/80 dark:hover:text-emerald-200"
              aria-label="Remove author filter"
              @click="removeAuthorFilter"
              type="button"
            >
              <UIcon name="i-ph-x" class="w-3.5 h-3.5" />
            </button>
          </span>

          <!-- Reference chip -->
          <span
            v-if="selectedReferenceLabel"
            class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
          >
            <UIcon name="i-ph-book" class="w-3.5 h-3.5" />
            <span>{{ selectedReferenceLabel }}</span>
            <button
              class="ml-1 text-blue-700/70 hover:text-blue-900 dark:text-blue-300/80 dark:hover:text-blue-200"
              aria-label="Remove reference filter"
              @click="removeReferenceFilter"
              type="button"
            >
              <UIcon name="i-ph-x" class="w-3.5 h-3.5" />
            </button>
          </span>

          <UButton
            btn="ghost-gray"
            size="xs"
            class="ml-1"
            rounded="full"
            @click="clearFilters"
          >
            Clear all
          </UButton>
        </div>

        <div class="flex gap-2">
          <USelect
            v-model="selectedLanguage"
            :items="languageOptions"
            placeholder="Language"
            item-key="label"
            value-key="label"
            size="sm"
          />
          <USelect
            v-model="selectedAuthor"
            :items="authorOptions"
            placeholder="Author"
            item-key="label"
            value-key="label"
            size="sm"
            searchable
          />
          <USelect
            v-model="selectedReference"
            :items="referenceOptions"
            placeholder="Reference"
            item-key="label"
            value-key="label"
            size="sm"
            searchable
          />
        </div>

        <!-- Search Results -->
        <div class="max-h-96 overflow-y-auto" ref="resultsContainer">
          <div v-if="loading" class="space-y-3">
            <div v-for="i in 3" :key="i" class="animate-pulse">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>

          <div v-else-if="totalResults === 0 && searchQuery" class="text-center py-8">
            <UIcon name="i-ph-magnifying-glass" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500 dark:text-gray-400">No results found for "{{ searchQuery }}"</p>
          </div>

          <div v-else-if="totalResults > 0" class="space-y-4">
            <!-- Quotes Section -->
            <div v-if="searchResults.quotes?.length > 0">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <UIcon name="i-ph-quotes" class="w-4 h-4 mr-2" />
                Quotes ({{ searchResults.quotes.length }})
              </h4>
              <div class="space-y-2">
                <div
                  v-for="(quote, index) in searchResults.quotes"
                  :key="`quote-${quote.id}`"
                  :ref="el => setResultRef(el, 'quotes', index)"
                  class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-colors"
                  :class="selectedIndex === getGlobalIndex('quotes', index) ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700' : 'hover:bg-gray-50 dark:hover:bg-gray-800'"
                  @click="selectResult(quote, 'quote')"
                >
                  <p class="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-2" v-html="highlightText(quote.name)"></p>
                  <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div class="flex items-center space-x-3">
                      <span v-if="quote.author_name">{{ quote.author_name }}</span>
                      <span v-if="quote.reference_name">{{ quote.reference_name }}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                      <UIcon name="i-ph-heart" class="w-3 h-3" />
                      <span>{{ quote.likes_count }}</span>
                      <UIcon name="i-ph-eye" class="w-3 h-3" />
                      <span>{{ quote.views_count }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Authors Section -->
            <div v-if="searchResults.authors?.length > 0">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <UIcon name="i-ph-user" class="w-4 h-4 mr-2" />
                Authors ({{ searchResults.authors.length }})
              </h4>
              <div class="space-y-2">
                <div
                  v-for="(author, index) in searchResults.authors"
                  :key="`author-${author.id}`"
                  :ref="el => setResultRef(el, 'authors', index)"
                  class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-colors"
                  :class="selectedIndex === getGlobalIndex('authors', index) ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700' : 'hover:bg-gray-50 dark:hover:bg-gray-800'"
                  @click="selectResult(author, 'author')"
                >
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <UIcon name="i-ph-user" class="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div class="flex-1">
                      <p class="text-sm font-medium text-gray-900 dark:text-white" v-html="highlightText(author.name)"></p>
                      <p v-if="author.job" class="text-xs text-gray-500 dark:text-gray-400">{{ author.job }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ author.quotes_count || 0 }} quotes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- References Section -->
            <div v-if="searchResults.references?.length > 0">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <UIcon name="i-ph-book" class="w-4 h-4 mr-2" />
                References ({{ searchResults.references.length }})
              </h4>
              <div class="space-y-2">
                <div
                  v-for="(reference, index) in searchResults.references"
                  :key="`reference-${reference.id}`"
                  :ref="el => setResultRef(el, 'references', index)"
                  class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer transition-colors"
                  :class="selectedIndex === getGlobalIndex('references', index) ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700' : 'hover:bg-gray-50 dark:hover:bg-gray-800'"
                  @click="selectResult(reference, 'reference')"
                >
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <UIcon :name="getReferenceIcon(reference.primary_type)" class="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div class="flex-1">
                      <p class="text-sm font-medium text-gray-900 dark:text-white" v-html="highlightText(reference.name)"></p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 capitalize">{{ reference.primary_type.replace('_', ' ') }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ reference.quotes_count || 0 }} quotes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8">
            <UIcon name="i-ph-quotes" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500 dark:text-gray-400">Start typing to search quotes, authors, and references...</p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <span>{{ totalResults }} results</span>
          <div class="flex items-center space-x-4">
            <span>Press <kbd class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↑↓</kbd> to navigate</span>
            <span>Press <kbd class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Enter</kbd> to select</span>
            <span>Press <kbd class="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Esc</kbd> to close</span>
          </div>
        </div>
      </template>
    </UCard>
  </UDialog>
</template>

<script lang="ts" setup>
import type { Ref, ComponentPublicInstance } from 'vue'
import type {
  SearchResults,
  SearchApiResponse,
  ProcessedQuoteResult,
  AuthorSearchResult,
  ReferenceSearchResult,
} from '~/types'
import type { QuoteReferencePrimaryType } from '~/types'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = computed({
  get: (): boolean => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const searchQuery = ref<string>('')
const searchResults = ref<SearchResults>({ quotes: [], authors: [], references: [], total: 0 })
const loading = ref<boolean>(false)
const selectedIndex = ref<number>(-1)
const resultRefs = ref<{ quotes?: HTMLElement[]; authors?: HTMLElement[]; references?: HTMLElement[] }>({})
const resultsContainer = ref<HTMLDivElement | null>(null)

const selectedLanguage = ref<{ label: string; value: string | number }>()
const selectedAuthor = ref<{ label: string; value: string | number }>()
const selectedReference = ref<{ label: string; value: string | number }>()

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
]

const authorOptions: Ref<Array<{ label: string; value: number | string }>> = ref([])
const referenceOptions: Ref<Array<{ label: string; value: number | string }>> = ref([])

type ResultItem =
  | (ProcessedQuoteResult & { type: 'quote'; sectionIndex: number })
  | (AuthorSearchResult & { type: 'author'; sectionIndex: number })
  | (ReferenceSearchResult & { type: 'reference'; sectionIndex: number })

const totalResults = computed<number>(() => searchResults.value.total || 0)
const allResults = computed<ResultItem[]>(() => {
  const results: ResultItem[] = []
  if (searchResults.value.quotes) {
    searchResults.value.quotes.forEach((item, index) => {
      results.push({ ...(item as ProcessedQuoteResult), type: 'quote', sectionIndex: index })
    })
  }
  if (searchResults.value.authors) {
    searchResults.value.authors.forEach((item, index) => {
      results.push({ ...(item as AuthorSearchResult), type: 'author', sectionIndex: index })
    })
  }
  if (searchResults.value.references) {
    searchResults.value.references.forEach((item, index) => {
      results.push({ ...(item as ReferenceSearchResult), type: 'reference', sectionIndex: index })
    })
  }
  return results
})

const setResultRef = (
  el: Element | ComponentPublicInstance | null,
  section: 'quotes' | 'authors' | 'references',
  index: number
) => {
  if (el) {
    const rawEl = (el as ComponentPublicInstance & { $el?: Element }).$el ?? (el as Element)
    const htmlEl = rawEl instanceof HTMLElement ? rawEl : null
    if (!htmlEl) return
    if (!resultRefs.value[section]) {
      resultRefs.value[section] = []
    }
    ;(resultRefs.value[section] as HTMLElement[])[index] = htmlEl
  }
}

const getGlobalIndex = (section: 'quotes' | 'authors' | 'references', index: number) => {
  let globalIndex = 0
  if (section === 'quotes') return index
  if (section === 'authors') {
    globalIndex += searchResults.value.quotes?.length || 0
    return globalIndex + index
  }
  if (section === 'references') {
    globalIndex += (searchResults.value.quotes?.length || 0) + (searchResults.value.authors?.length || 0)
    return globalIndex + index
  }
  return -1
}

const getReferenceIcon = (type: QuoteReferencePrimaryType | string) => {
  const icons: Record<string, string> = {
    film: 'i-ph-film-strip',
    book: 'i-ph-book',
    tv_series: 'i-ph-television',
    music: 'i-ph-music-note',
    speech: 'i-ph-microphone',
    podcast: 'i-ph-microphone',
    interview: 'i-ph-chat-circle',
    documentary: 'i-ph-video',
    other: 'i-ph-file'
  }
  return icons[type] || 'i-ph-file'
}

const highlightText = (text: string) => {
  if (!searchQuery.value.trim() || !text) return text
  const regex = new RegExp(`(${searchQuery.value.trim()})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>')
}

const debouncedSearch = useDebounceFn(async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = { quotes: [], authors: [], references: [], total: 0 }
    selectedIndex.value = -1
    return
  }

  loading.value = true
  try {
    const response = await $fetch<SearchApiResponse>('/api/search', {
      query: {
        q: searchQuery.value,
        language: selectedLanguage.value || undefined,
        author: selectedAuthor.value || undefined,
        reference: selectedReference.value || undefined,
        limit: 20
      }
    })

    searchResults.value = response?.data || { quotes: [], authors: [], references: [], total: 0 }
    selectedIndex.value = -1
  } catch (error) {
    console.error('Search error:', error)
    searchResults.value = { quotes: [], authors: [], references: [], total: 0 }
  } finally {
    loading.value = false
  }
}, 300)

// Re-run search when filters change (if a query is present)
watch([selectedLanguage, selectedAuthor, selectedReference], () => {
  if (searchQuery.value.trim()) debouncedSearch()
})

const loadFilterOptions = async () => {
  // simple cache to avoid refetching every open
  if (authorOptions.value.length && referenceOptions.value.length) return
  try {
    const [authorsData, referencesData] = await Promise.all([
      $fetch('/api/authors?limit=100'),
      $fetch('/api/references?limit=100')
    ])

    authorOptions.value = (authorsData.data || []).map((author: { id: number | string; name: string }) => ({
      label: author.name,
      value: author.id
    }))

    referenceOptions.value = (referencesData.data || []).map((reference: { id: number | string; name: string }) => ({
      label: reference.name,
      value: reference.id
    }))
  } catch (error) {
    console.error('Failed to load filter options:', error)
  }
}

const clearFilters = () => {
  selectedLanguage.value = undefined
  selectedAuthor.value = undefined
  selectedReference.value = undefined
  if (searchQuery.value.trim()) debouncedSearch()
}

// Labels for chips
const selectedLanguageLabel = computed<string | null>(() => {
  const val = selectedLanguage.value
  if (!val) return null
  const item = languageOptions.find(o => o.value === val.value || o.label === val.label)
  return item ? item.label : String(val.label)
})

const selectedAuthorLabel = computed<string | null>(() => {
  const val = selectedAuthor.value
  if (!val) return null
  const item = (authorOptions.value || []).find(o => o.value === val.value || o.label === val.label)
  return item ? item.label : String(val.label)
})

const selectedReferenceLabel = computed<string | null>(() => {
  const val = selectedReference.value
  if (!val) return null
  const item = (referenceOptions.value || []).find(o => o.value === val.value || o.label === val.label)
  return item ? item.label : String(val.label)
})

// Remove single chips
const removeLanguageFilter = () => {
  selectedLanguage.value = undefined
  if (searchQuery.value.trim()) debouncedSearch()
}

const removeAuthorFilter = () => {
  selectedAuthor.value = undefined
  if (searchQuery.value.trim()) debouncedSearch()
}

const removeReferenceFilter = () => {
  selectedReference.value = undefined
  if (searchQuery.value.trim()) debouncedSearch()
}

const selectResult = (
  result: ProcessedQuoteResult | AuthorSearchResult | ReferenceSearchResult,
  type: 'quote' | 'author' | 'reference'
) => {
  isOpen.value = false

  switch (type) {
    case 'quote':
  navigateTo(`/quote/${result.id}`)
      break
    case 'author':
  navigateTo(`/author/${result.id}`)
      break
    case 'reference':
  navigateTo(`/reference/${result.id}`)
      break
  }
}

const selectCurrentResult = () => {
  if (selectedIndex.value >= 0 && allResults.value[selectedIndex.value]) {
    const result = allResults.value[selectedIndex.value]
    selectResult(result, result.type)
  }
}

const scrollToSelected = () => {
  if (selectedIndex.value >= 0 && allResults.value[selectedIndex.value]) {
    const result = allResults.value[selectedIndex.value]
    const section = result.type === 'quote' ? 'quotes' : result.type === 'author' ? 'authors' : 'references'
    const element = resultRefs.value[section]?.[result.sectionIndex]

    if (element && resultsContainer.value) {
  const containerRect = resultsContainer.value.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()

      if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
        element.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    isOpen.value = false
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (selectedIndex.value < allResults.value.length - 1) {
      selectedIndex.value++
      scrollToSelected()
    }
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (selectedIndex.value > 0) {
      selectedIndex.value--
      scrollToSelected()
    }
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    selectCurrentResult()
    return
  }
}

watch(isOpen, (newValue) => {
  if (newValue) {
    loadFilterOptions()
    nextTick(() => {
      document.addEventListener('keydown', handleKeydown)
      // Focus the search input
  const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="Search quotes"]')
  searchInput?.focus()
    })
  } else {
    document.removeEventListener('keydown', handleKeydown)
    searchQuery.value = ''
    searchResults.value = { quotes: [], authors: [], references: [], total: 0 }
    selectedIndex.value = -1
    selectedLanguage.value = undefined
    selectedAuthor.value = undefined
    selectedReference.value = undefined
    resultRefs.value = {}
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

kbd {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.75rem;
}

mark {
  background-color: rgb(254 240 138);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}

.dark mark {
  background-color: rgb(133 77 14);
  color: rgb(254 240 138);
}
</style>
