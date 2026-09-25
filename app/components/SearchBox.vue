<template>
  <SearchBoxOverlay v-if="isOpen" v-model:open="isOpen" :mobile="isMobile">
    <NCard class="border-none m-0 p-0 shadow-none" :class="isMobile ? 'search-box-mobile-card' : ''">
      <template #header>
        <div class="flex items-center justify-between gap-3" :class="isMobile ? 'mx-0' : 'mx-3'">
          <h3 class="font-serif font-400 text-gray-900 dark:text-white" :class="isMobile ? 'text-2xl' : 'text-3xl'">
            {{ mode === 'nav' ? $t('components.search_box.quick_nav') : mode === 'cmd' ? $t('components.search_box.commands') : $t('components.search_box.search') }}
          </h3>
          <NButton
            v-if="mode === 'search' && !isMobile"
            btn="ghost-gray"
            size="sm"
            leading="i-ph-sliders-horizontal"
            @click="goToSearchPage"
          >
            {{ $t('components.search_box.advanced_filters') }}
          </NButton>
          <NButton
            v-if="isMobile"
            btn="ghost-gray"
            size="sm"
            icon
            label="i-ph-x"
            :aria-label="String($t('common.close'))"
            @click="isOpen = false"
          />
        </div>
      </template>

      <div :class="isMobile ? 'search-box-mobile-content' : 'space-y-6'">
        <div :class="isMobile ? 'search-box-mobile-search-row' : ''">
          <NInput
            v-model="storeQuery"
            :class="isMobile ? 'min-w-0 flex-1' : ''"
            :aria-label="$t('components.search_box.search_placeholder') as string"
            aria-controls="search-result-list"
            :aria-activedescendant="activeDescendantId"
            :placeholder="mode === 'nav' ? $t('components.search_box.navigate_placeholder') as string : mode === 'cmd' ? $t('components.search_box.command_placeholder') as string : $t('components.search_box.search_placeholder') as string"
            leading="i-ph-magnifying-glass"
            size="md"
            autofocus
            :una="{ input: 'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-500 dark:focus-visible:ring-gray-400 focus-visible:border-gray-500 dark:focus-visible:border-gray-400' }"
            @input="debouncedSearch"
          />
          <NButton
            v-if="mode === 'search' && isMobile"
            btn="outline-gray"
            size="sm"
            icon
            label="i-ph-faders"
            :aria-label="String($t('components.search_box.advanced_filters'))"
            class="shrink-0"
            @click="goToSearchPage"
          />
        </div>

        <!-- Search Results / Navigation -->
        <div
          id="search-result-list"
          class="overflow-y-auto pr-1"
          :class="isMobile ? 'search-box-mobile-results' : 'max-h-[min(58vh,36rem)]'"
          ref="resultsContainer"
          role="listbox"
          :aria-label="mode === 'search' ? $t('components.search_box.search_results') as string : mode === 'nav' ? $t('components.search_box.quick_nav') as string : $t('components.search_box.commands') as string"
          :aria-busy="mode === 'search' ? loading : undefined"
        >
          <template v-if="mode === 'search'">
            <div v-if="loading" class="space-y-5 py-4" role="status">
              <span class="sr-only">{{ $t('components.search_box.searching') }}</span>
              <div v-for="i in 3" :key="i" class="animate-pulse border-b border-gray-200 pb-4 dark:border-gray-800">
                <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>

            <div v-else-if="totalResults === 0 && storeQuery" class="text-center py-8">
              <NIcon name="i-ph-magnifying-glass" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p class="text-gray-500 dark:text-gray-400">{{ $t('components.search_box.no_results') }} "{{ storeQuery }}"</p>
            </div>

            <div
              v-else-if="totalResults > 0"
              class="grid gap-8"
              :class="searchResults.quotes?.length && (searchResults.authors?.length || searchResults.references?.length) ? 'lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,0.9fr)]' : 'lg:grid-cols-1'"
            >
              <!-- Quotes Section -->
              <section v-if="searchResults.quotes?.length > 0" role="group" :aria-label="$t('components.search_box.results_quotes') as string">
                <h4 class="mt-6 mb-3 font-sans text-xs font-600 uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                  {{ $t('components.search_box.results_quotes') }}
                  <span class="ml-1 font-500 tabular-nums text-gray-400 dark:text-gray-500">({{ searchResults.quotes.length }})</span>
                </h4>
                <div class="space-y-1" :class="isMobile ? '-ml-3' : ''">
                  <div
                    v-for="(quote, index) in searchResults.quotes"
                    :key="`quote-${quote.id}`"
                    :ref="el => setResultRef(el, 'quotes', index)"
                    :id="resultId('quote', quote.id)"
                    role="option"
                    :aria-selected="selectedIndex === getGlobalIndex('quotes', index)"
                    tabindex="-1"
                    class="cursor-pointer rounded-lg px-3 py-4 first:pt-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-500 dark:focus-visible:ring-gray-400"
                    :class="selectedIndex === getGlobalIndex('quotes', index) ? 'bg-gray-100 dark:bg-gray-800/70' : 'hover:bg-gray-50 dark:hover:bg-gray-900/60'"
                    @click="selectResult(quote, 'quote')"
                  >
                    <p class="font-serif text-lg leading-relaxed text-gray-900 dark:text-gray-100 line-clamp-2" v-html="highlightText(quote.name)"></p>
                    <div class="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-gray-600 dark:text-gray-400">
                      <span v-if="quote.author_name" class="font-600 text-gray-800 dark:text-gray-200">{{ quote.author_name }}</span>
                      <span v-if="quote.author_name && quote.reference_name" aria-hidden="true">·</span>
                      <span v-if="quote.reference_name">{{ quote.reference_name }}</span>
                    </div>
                  </div>
                </div>
              </section>

              <div class="space-y-7">
                <!-- Authors Section -->
                <section v-if="searchResults.authors?.length > 0" role="group" :aria-label="$t('components.search_box.results_authors') as string">
                  <h4 class="mt-6 mb-3 font-sans text-xs font-600 uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                    {{ $t('components.search_box.results_authors') }}
                    <span class="ml-1 font-500 tabular-nums text-gray-400 dark:text-gray-500">({{ searchResults.authors.length }})</span>
                  </h4>
                  <div class="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2">
                  <div
                    v-for="(author, index) in searchResults.authors"
                    :key="`author-${author.id}`"
                    :ref="el => setResultRef(el, 'authors', index)"
                    :id="resultId('author', author.id)"
                    role="option"
                    :aria-selected="selectedIndex === getGlobalIndex('authors', index)"
                    tabindex="-1"
                    class="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 py-2 transition-colors"
                    :class="selectedIndex === getGlobalIndex('authors', index) ? 'bg-gray-100 dark:bg-gray-800/70' : 'hover:bg-gray-50 dark:hover:bg-gray-900/60'"
                    @click="selectResult(author, 'author')"
                  >
                    <NAvatar :src="author.image_url" :alt="author.name" size="sm" class="shrink-0" />
                    <div class="min-w-0">
                      <NTooltip :content="author.name" :_tooltip-content="{ side: 'top', class: 'max-w-[min(20rem,calc(100vw-2rem))] whitespace-normal break-words text-left' }">
                        <p class="truncate text-sm font-600 text-gray-900 dark:text-white" v-html="highlightText(author.name)"></p>
                      </NTooltip>
                      <p class="truncate text-xs text-gray-600 dark:text-gray-400">{{ author.job || $t('components.search_box.quote_count', { count: author.quotes_count || 0 }) }}</p>
                    </div>
                  </div>
                  </div>
                </section>

                <!-- References Section -->
                <section v-if="searchResults.references?.length > 0" role="group" :aria-label="$t('components.search_box.results_references') as string">
                  <h4 class="mt-6 mb-3 font-sans text-xs font-600 uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                    {{ $t('components.search_box.results_references') }}
                    <span class="ml-1 font-500 tabular-nums text-gray-400 dark:text-gray-500">({{ searchResults.references.length }})</span>
                  </h4>
                  <div class="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2">
                  <div
                    v-for="(reference, index) in searchResults.references"
                    :key="`reference-${reference.id}`"
                    :ref="el => setResultRef(el, 'references', index)"
                    :id="resultId('reference', reference.id)"
                    role="option"
                    :aria-selected="selectedIndex === getGlobalIndex('references', index)"
                    tabindex="-1"
                    class="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 py-2 transition-colors"
                    :class="selectedIndex === getGlobalIndex('references', index) ? 'bg-gray-100 dark:bg-gray-800/70' : 'hover:bg-gray-50 dark:hover:bg-gray-900/60'"
                    @click="selectResult(reference, 'reference')"
                  >
                    <NAvatar :src="reference.image_url" :alt="reference.name" rounded="2" size="sm" class="shrink-0">
                      <template #fallback>
                        <div class="flex h-full w-full items-center justify-center bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          <NIcon :name="getReferenceIcon(reference.primary_type)" class="w-4 h-4" />
                        </div>
                      </template>
                    </NAvatar>
                    <div class="min-w-0">
                      <NTooltip :content="reference.name" :_tooltip-content="{ side: 'top', class: 'max-w-[min(20rem,calc(100vw-2rem))] whitespace-normal break-words text-left' }">
                        <p class="truncate text-sm font-600 text-gray-900 dark:text-white" v-html="highlightText(reference.name)"></p>
                      </NTooltip>
                      <p class="truncate text-xs text-gray-600 dark:text-gray-400">{{ $t('components.search_box.quote_count', { count: reference.quotes_count || 0 }) }}</p>
                    </div>
                  </div>
                  </div>
                </section>
              </div>
            </div>

            <div v-else class="text-center py-8">
              <NIcon name="i-tabler-search" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p class="text-gray-500 dark:text-gray-400">{{ $t('components.search_box.empty_hint') }}</p>
            </div>

          </template>

          <template v-else-if="mode === 'nav'">
            <div v-if="filteredNavItems.length > 0" class="space-y-1" role="group" :aria-label="$t('components.search_box.quick_nav') as string">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center px-1">
                <NIcon name="i-ph-compass" class="w-4 h-4 mr-2" />
                {{ $t('components.search_box.quick_nav') }}
              </h4>
              <div
                v-for="(item, index) in filteredNavItems"
                :key="`nav-${item.label}`"
                :data-nav-index="index"
                :id="navResultId(index)"
                role="option"
                :aria-selected="selectedNavIndex === index"
                tabindex="-1"
                class="cursor-pointer rounded-lg px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-500 dark:focus-visible:ring-gray-400"
                :class="selectedNavIndex === index ? 'bg-gray-100 dark:bg-gray-800/70' : 'hover:bg-gray-50 dark:hover:bg-gray-900/60'"
                @click="navigateToNavItem(item)"
              >
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                    <NIcon :name="item.icon" class="w-4 h-4" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ item.label }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ item.description }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <NIcon name="i-ph-compass" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p class="text-gray-500 dark:text-gray-400">{{ $t('components.search_box.no_results') }}</p>
            </div>
          </template>

          <template v-else-if="mode === 'cmd'">
            <div v-if="filteredCmdItems.length > 0" class="space-y-1" role="group" :aria-label="$t('components.search_box.commands') as string">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center px-1">
                <NIcon name="i-ph-terminal" class="w-4 h-4 mr-2" />
                {{ $t('components.search_box.commands') }}
              </h4>
              <div
                v-for="(item, index) in filteredCmdItems"
                :key="`cmd-${item.action}`"
                :data-cmd-index="index"
                :id="cmdResultId(index)"
                role="option"
                :aria-selected="selectedCmdIndex === index"
                tabindex="-1"
                class="cursor-pointer rounded-lg px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-500 dark:focus-visible:ring-gray-400"
                :class="selectedCmdIndex === index ? 'bg-gray-100 dark:bg-gray-800/70' : 'hover:bg-gray-50 dark:hover:bg-gray-900/60'"
                @click="executeCmdItem(item)"
              >
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                    <NIcon :name="item.icon" class="w-4 h-4" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ item.label }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ item.description }}</p>
                  </div>
                  <span v-if="item.shortcut" class="text-xs text-gray-400 dark:text-gray-500 font-mono shrink-0 ml-2">{{ item.shortcut }}</span>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <NIcon name="i-ph-terminal" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p class="text-gray-500 dark:text-gray-400">{{ $t('components.search_box.no_results') }}</p>
            </div>
          </template>
        </div>
      </div>

      <template #footer v-if="!isMobile">
        <div class="mx-3 flex items-center justify-between gap-x-2 text-xs text-gray-500 dark:text-gray-400">
          <span v-if="mode !== 'search' || storeQuery.trim()">{{ totalResults }} {{ $t('components.search_box.results') }}</span>
          <div class="flex items-center justify-end gap-x-2">
            <span v-if="mode === 'search'">{{ $t('components.search_box.mode_hint') }}</span>
            <span>{{ $t('components.search_box.footer_navigate') }}</span>
            <span>{{ $t('components.search_box.footer_select') }}</span>
            <span>{{ $t('components.search_box.footer_close') }}</span>
            <NButton
              v-if="mode === 'search' && storeQuery.trim()"
              btn="ghost-gray"
              size="sm"
              @click="goToSearchPage"
            >
              {{ $t('components.search_box.view_all_results') }}
            </NButton>
          </div>
        </div>
      </template>
    </NCard>

    <template #footer>
      <div v-if="isMobile && (mode !== 'search' || storeQuery.trim())" class="flex min-w-0 items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span class="font-600">{{ totalResults }} {{ $t('components.search_box.results') }}</span>
        <div v-if="mode === 'search' && storeQuery.trim()" class="flex shrink-0 items-center gap-3">
          <span aria-hidden="true" class="h-4 w-px bg-gray-300 dark:bg-gray-700" />
          <NButton
            btn="ghost-gray"
            size="xs"
            @click="goToSearchPage"
          >
            {{ $t('components.search_box.view_all_results') }}
          </NButton>
        </div>
      </div>
    </template>
  </SearchBoxOverlay>
</template>

<script lang="ts" setup>
import { useSearchStore } from '~/stores/search'
import type { AuthorSearchResult, ProcessedQuoteResult, ReferenceSearchResult } from '~~/server/types';
import SearchBoxOverlay from '~/components/SearchBoxOverlay.vue'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'action': [action: string]
}>()

const isOpen = computed({
  get: (): boolean => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const { $t } = useI18n()
const { isMobile } = useMobileDetection()
const route = useRoute()
const searchStore = useSearchStore()
const storeQuery = computed({
  get: () => searchStore.query,
  set: (v: string) => searchStore.setQuery(v)
})

const navItems = computed((): any[] => [
  { label: $t('components.search_box.nav_home'), icon: 'i-ph-house', description: $t('components.search_box.nav_home_desc'), to: '/' },
  { label: $t('nav.authors'), icon: 'i-ph-users-duotone', description: $t('nav.authors_desc'), to: '/authors' },
  { label: $t('nav.references'), icon: 'i-ph-book-duotone', description: $t('nav.references_desc'), to: '/references' },
  { label: $t('nav.quotes'), icon: 'i-ph-quotes', description: $t('nav.quotes_desc'), to: '/quotes' },
  { label: $t('nav.tags'), icon: 'i-ph-tag-duotone', description: $t('nav.tags_desc'), to: '/tags' },
  { label: $t('nav.dashboard'), icon: 'i-ph-square-split-vertical-duotone', description: $t('nav.overview'), to: '/dashboard' },
  { label: $t('nav.admin'), icon: 'i-ph-shield-check', description: 'Admin panel', to: '/admin' },
  { label: 'Pending Quotes', icon: 'i-ph-clock-countdown', description: 'Review and moderate pending quotes', to: '/admin/quotes/pending' },
  { label: $t('nav.drafts'), icon: 'i-ph-file-text', description: 'Manage quote drafts', to: '/admin/quotes/drafts' },
  { label: 'Social Queue', icon: 'i-ph-share-network', description: 'Manage scheduled social media posts', to: '/admin/social-queue' },
  { label: $t('nav.tags'), icon: 'i-ph-tag-duotone', description: 'Manage tag taxonomy', to: '/admin/tags' },
])

const cmdItems = computed((): any[] => [
  { label: $t('components.search_box.cmd_add_quote'), icon: 'i-ph-quotes-duotone', description: $t('components.search_box.cmd_add_quote_desc'), shortcut: '⌘N', action: 'add-quote' },
  { label: $t('components.search_box.cmd_suggest_edit'), icon: 'i-ph-pencil-duotone', description: $t('components.search_box.cmd_suggest_edit_desc'), action: 'suggest-edit' },
  { label: $t('components.search_box.cmd_report'), icon: 'i-ph-bug-duotone', description: $t('components.search_box.cmd_report_desc'), action: 'report-bug' },
  { label: $t('components.search_box.cmd_contact'), icon: 'i-ph-chat-circle-duotone', description: $t('components.search_box.cmd_contact_desc'), action: 'contact' },
])

const mode = computed(() => {
  const q = storeQuery.value
  if (q.startsWith('@')) return 'nav'
  if (q.startsWith('/')) return 'cmd'
  return 'search'
})

const navQuery = computed(() => {
  const q = storeQuery.value
  if (q.startsWith('@')) return q.slice(1).trim()
  return ''
})

const filteredNavItems = computed(() => {
  const items = navItems.value
  if (!navQuery.value) return items
  const q = navQuery.value.toLowerCase()
  return items.filter((item: any) =>
    item.label.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q)
  )
})

const cmdQuery = computed(() => {
  const q = storeQuery.value
  if (q.startsWith('/')) return q.slice(1).trim()
  return ''
})

const filteredCmdItems = computed(() => {
  const items = cmdItems.value
  if (!cmdQuery.value) return items
  const q = cmdQuery.value.toLowerCase()
  return items.filter((item: any) =>
    item.label.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.action.toLowerCase().includes(q)
  )
})

const searchResults = computed(() => searchStore.results)
const loading = computed(() => searchStore.loading)
const selectedIndex = ref<number>(-1)
const selectedNavIndex = ref(-1)
const selectedCmdIndex = ref(-1)
const resultRefs = ref<{ quotes?: HTMLElement[]; authors?: HTMLElement[]; references?: HTMLElement[] }>({})
const resultsContainer = ref<HTMLDivElement | null>(null)
let closingThroughNavigation = false

type ResultItem =
  | (ProcessedQuoteResult & { type: 'quote'; sectionIndex: number })
  | (AuthorSearchResult & { type: 'author'; sectionIndex: number })
  | (ReferenceSearchResult & { type: 'reference'; sectionIndex: number })

const totalResults = computed<number>(() => {
  if (mode.value === 'nav') return filteredNavItems.value.length
  if (mode.value === 'cmd') return filteredCmdItems.value.length
  return searchResults.value.total || 0
})
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
const resultId = (type: ResultItem['type'], id: string | number) => `search-result-${type}-${id}`
const activeResultId = computed(() => {
  const result = allResults.value[selectedIndex.value]
  return result ? resultId(result.type, result.id) : undefined
})
const navResultId = (index: number) => `search-nav-result-${index}`
const cmdResultId = (index: number) => `search-command-result-${index}`
const activeDescendantId = computed(() => {
  if (mode.value === 'nav' && selectedNavIndex.value >= 0) return navResultId(selectedNavIndex.value)
  if (mode.value === 'cmd' && selectedCmdIndex.value >= 0) return cmdResultId(selectedCmdIndex.value)
  return mode.value === 'search' ? activeResultId.value : undefined
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
  if (!storeQuery.value.trim() || !text) return text
  const escapedQuery = storeQuery.value.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  const escapedText = text.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character] as string)
  return escapedText.replace(regex, '<mark class="rounded-[0.2em] bg-gray-200 px-[0.2em] py-[0.05em] text-gray-950 [box-decoration-break:clone] dark:bg-gray-700 dark:text-white">$1</mark>')
}

const debouncedSearch = useDebounceFn(async () => {
  if (mode.value === 'nav' || mode.value === 'cmd') {
    searchStore.clear()
    selectedIndex.value = -1
    selectedNavIndex.value = -1
    selectedCmdIndex.value = -1
    return
  }

  if (!storeQuery.value.trim()) {
    searchStore.clear()
    selectedIndex.value = -1
    return
  }

  try {
    await searchStore.search({ limit: 20 })
    selectedIndex.value = -1
  } catch (error) {
    console.error('Search error:', error)
    searchStore.clear()
  }
}, 300)

const goToSearchPage = () => {
  const query = storeQuery.value.trim()
  const searchQuery: Record<string, string> = {}

  if (query) searchQuery.q = query

  // Keep advanced filters when the dialog is opened from the search page.
  if (route.path === '/search') {
    for (const key of ['language', 'author', 'reference'] as const) {
      const value = route.query[key]
      if (typeof value === 'string' && value) searchQuery[key] = value
    }
  }

  closeAndNavigate()
  navigateTo({ path: '/search', query: searchQuery })
}

const closeAndNavigate = () => {
  closingThroughNavigation = true
  isOpen.value = false
}

const selectResult = (
  result: ProcessedQuoteResult | AuthorSearchResult | ReferenceSearchResult,
  type: 'quote' | 'author' | 'reference'
) => {
  closeAndNavigate()

  switch (type) {
    case 'quote':
  navigateTo(`/quotes/${result.id}`)
      break
    case 'author':
      navigateTo(`/authors/${result.id}`)
      break
    case 'reference':
      navigateTo(`/references/${result.id}`)
      break
  }
}

const navigateToNavItem = (item: any) => {
  closeAndNavigate()
  navigateTo(item.to)
}

const executeCmdItem = (item: any) => {
  closeAndNavigate()
  emit('action', item.action)
}

const selectCurrentResult = () => {
  if (mode.value === 'nav') {
    const index = selectedNavIndex.value >= 0 ? selectedNavIndex.value : 0
    if (filteredNavItems.value[index]) {
      navigateToNavItem(filteredNavItems.value[index])
    }
    return
  }
  if (mode.value === 'cmd') {
    const index = selectedCmdIndex.value >= 0 ? selectedCmdIndex.value : 0
    if (filteredCmdItems.value[index]) {
      executeCmdItem(filteredCmdItems.value[index])
    }
    return
  }
  const index = selectedIndex.value >= 0 ? selectedIndex.value : 0
  if (allResults.value[index]) {
    const result = allResults.value[index]
    selectResult(result, result.type)
  }
}

const scrollToSelected = () => {
  const index = selectedIndex.value ; if (index < 0 || index >= allResults.value.length) return
  const result = allResults.value[index] ; if (!result) return

  const section = result.type === 'quote' ? 'quotes' : result.type === 'author' ? 'authors' : 'references'

  const element = resultRefs.value[section]?.[result.sectionIndex] ; if (!element || !resultsContainer.value) return
  const containerRect = resultsContainer.value.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()

  if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
    element.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
}

const scrollToSelectedNav = () => {
  const index = selectedNavIndex.value
  if (index < 0 || index >= filteredNavItems.value.length) return
  if (!resultsContainer.value) return
  const element = resultsContainer.value.querySelector<HTMLElement>(`[data-nav-index="${index}"]`)
  if (!element) return
  const containerRect = resultsContainer.value.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()
  if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
    element.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
}

const scrollToSelectedCmd = () => {
  const index = selectedCmdIndex.value
  if (index < 0 || index >= filteredCmdItems.value.length) return
  if (!resultsContainer.value) return
  const element = resultsContainer.value.querySelector<HTMLElement>(`[data-cmd-index="${index}"]`)
  if (!element) return
  const containerRect = resultsContainer.value.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()
  if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
    element.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
}

const getCircularIndex = (current: number, direction: 1 | -1, length: number) => {
  if (!length) return -1
  if (current < 0) return direction === 1 ? 0 : length - 1
  return (current + direction + length) % length
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    isOpen.value = false
    return
  }

  if (mode.value === 'nav' || mode.value === 'cmd') {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (mode.value === 'nav' && filteredNavItems.value.length) {
        selectedNavIndex.value = getCircularIndex(selectedNavIndex.value, 1, filteredNavItems.value.length)
        scrollToSelectedNav()
      } else if (mode.value === 'cmd' && filteredCmdItems.value.length) {
        selectedCmdIndex.value = getCircularIndex(selectedCmdIndex.value, 1, filteredCmdItems.value.length)
        scrollToSelectedCmd()
      }
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (mode.value === 'nav' && filteredNavItems.value.length) {
        selectedNavIndex.value = getCircularIndex(selectedNavIndex.value, -1, filteredNavItems.value.length)
        scrollToSelectedNav()
      } else if (mode.value === 'cmd' && filteredCmdItems.value.length) {
        selectedCmdIndex.value = getCircularIndex(selectedCmdIndex.value, -1, filteredCmdItems.value.length)
        scrollToSelectedCmd()
      }
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      selectCurrentResult()
      return
    }
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (allResults.value.length) {
      selectedIndex.value = getCircularIndex(selectedIndex.value, 1, allResults.value.length)
      scrollToSelected()
    }
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (allResults.value.length) {
      selectedIndex.value = getCircularIndex(selectedIndex.value, -1, allResults.value.length)
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

watch(isOpen, (isStillOpen) => {
  if (isStillOpen) {
    nextTick(() => {
      document.addEventListener('keydown', handleKeydown)
      const searchInput = document.querySelector<HTMLInputElement>('input[placeholder]')
      searchInput?.focus()
    })

    return
  }

  document.removeEventListener('keydown', handleKeydown)
  if (closingThroughNavigation) {
    closingThroughNavigation = false
  } else if (route.path === '/search') {
    const query = typeof route.query.q === 'string' ? route.query.q : ''
    searchStore.setQuery(query)
    if (query) {
      void searchStore.search({
        limit: 50,
        language: typeof route.query.language === 'string' ? route.query.language : undefined,
        author: typeof route.query.author === 'string' ? route.query.author : undefined,
        reference: typeof route.query.reference === 'string' ? route.query.reference : undefined
      })
    } else {
      searchStore.clear()
    }
  }

  // Preserve store state when closing; only reset local UI state
  selectedIndex.value = -1
  selectedNavIndex.value = -1
  selectedCmdIndex.value = -1
  resultRefs.value = {}
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
:global(body .dialog-content.search-box-dialog) {
  width: 94vw !important;
  max-width: min(94vw, 58rem) !important;
}

.search-box-mobile-card {
  display: flex;
  height: auto;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border-radius: 0;
  background: transparent;
}

.search-box-mobile-card :deep(.card-header) {
  flex: none;
  padding: 1.25rem 1rem 0.75rem;
}

.search-box-mobile-card :deep(.card-content) {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  padding: 0 1rem;
}

:deep(.search-box-mobile-content) {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 1rem;
}

:deep(.search-box-mobile-search-row) {
  display: flex;
  flex: none;
  align-items: center;
  gap: 0.5rem;
}

:deep(.search-box-mobile-search-row > .input-wrapper) {
  min-width: 0;
  flex: 1;
}

:deep(.search-box-mobile-results) {
  min-height: 0;
  max-height: min(56dvh, 32rem);
  flex: 1;
  overscroll-behavior: contain;
}

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
