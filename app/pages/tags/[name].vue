<template>
  <div class="min-h-screen">
    <div v-if="pending" role="status" class="mx-auto flex max-w-6xl items-center gap-3 px-6 py-16 text-gray-600 dark:text-gray-400 sm:px-8 lg:px-10">
      <NIcon name="i-ph-spinner-gap" class="h-5 w-5 animate-spin" aria-hidden="true" />
      <span>{{ $t('tag_detail_loading') }}</span>
    </div>

    <template v-else-if="tag">
      <header class="mx-auto max-w-6xl px-6 pb-8 pt-12 sm:px-8 md:pb-12 md:pt-28 lg:px-10">
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 class="break-words font-serif text-5xl font-400 leading-none tracking-[-0.035em] text-gray-900 dark:text-gray-100 md:text-6xl lg:text-7xl">
            {{ tag.name }}
          </h1>

          <span class="inline-flex items-baseline gap-2 whitespace-nowrap">
            <span class="font-sans text-lg font-400 text-gray-500/75 dark:text-gray-500 md:text-xl" aria-hidden="true">/</span>
            <span class="font-sans text-sm font-500 text-gray-500 dark:text-gray-500 md:text-base">
              {{ tagCategoryLabel }}
            </span>
            <span class="ml-1 h-2 w-2 shrink-0 self-center translate-y-0.9 rounded-full" :style="tagDotStyle" aria-hidden="true" />
          </span>
        </div>

        <p v-if="tag.description" class="mt-3 max-w-2xl font-sans text-lg leading-relaxed text-gray-600 dark:text-gray-400 md:mt-4 md:text-xl">
          {{ tag.description }}
        </p>

        <button
          type="button"
          class="mt-4 inline-flex min-h-11 items-center gap-2 px-1 font-sans text-xs font-600 uppercase tracking-[0.12em] text-stone-500 transition-colors hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500 dark:text-stone-400 dark:hover:text-stone-100"
          @click="navigateBack"
        >
          <NIcon name="i-ph-arrow-left" class="h-4 w-4" aria-hidden="true" />
          <span>{{ $ts('tag_detail_back') }}</span>
        </button>
      </header>

      <main class="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-10">
        <div ref="stickyToolbarRef" class="sticky top-14 z-20 -mx-4 mb-5 bg-[#FAFAF9]/95 px-4 pb-3 pt-2 backdrop-blur-md sm:-mx-6 sm:px-6 md:mb-8 md:pt-3 lg:-mx-10 lg:px-10 dark:bg-[#0C0A09]/95">
          <div v-if="isStickyToolbarStuck" class="tag-sticky-mobile-context mb-2 flex items-center justify-between gap-3 md:hidden">
            <button
              type="button"
              class="inline-flex min-h-9 shrink-0 items-center gap-2 px-1 font-sans text-[11px] font-600 uppercase tracking-[0.12em] text-stone-500 transition-colors hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500 dark:text-stone-400 dark:hover:text-stone-100"
              @click="navigateBack"
            >
              <NIcon name="i-ph-arrow-left" class="h-4 w-4" aria-hidden="true" />
              <span>{{ $ts('tag_detail_back') }}</span>
            </button>

            <div class="flex min-w-0 items-center gap-2 font-sans text-xs font-600 uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
              <span class="h-2 w-2 shrink-0 rounded-full bg-gray-400 dark:bg-gray-500" :style="tagDotStyle" aria-hidden="true" />
              <span class="truncate">{{ tag.name }}</span>
            </div>
          </div>

          <div class="flex min-h-10 items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-2">
              <button
                v-if="isStickyToolbarStuck"
                type="button"
                class="hidden h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-md text-stone-500 transition-colors hover:bg-stone-500/10 hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500 dark:text-stone-400 dark:hover:text-stone-100 md:inline-flex lg:w-auto lg:px-2"
                :aria-label="$ts('tag_detail_back')"
                @click="navigateBack"
              >
                <NIcon name="i-ph-arrow-left" class="h-4 w-4" aria-hidden="true" />
                <span class="hidden font-sans text-[11px] font-600 uppercase tracking-[0.12em] lg:inline">{{ $ts('tag_detail_back') }}</span>
              </button>

              <div v-if="isStickyToolbarStuck" class="tag-sticky-desktop-context hidden shrink-0 items-center gap-2 font-sans text-xs font-600 uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400 md:flex">
                <span class="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500" :style="tagDotStyle" aria-hidden="true" />
                <span>{{ tag.name }}</span>
                <span class="text-gray-400 dark:text-gray-600" aria-hidden="true">·</span>
              </div>

              <p class="flex min-h-5 min-w-0 items-center gap-2 font-sans text-sm font-500 text-gray-600 dark:text-gray-400" aria-live="polite">
                <template v-if="quotesLoading && quotesTotal === null">{{ $t('tag_detail_loading_quotes') }}</template>
                <template v-else-if="quotesTotal !== null">
                  {{ $t(quoteCountKey, { count: quotesTotal }) }}
                </template>
                <span v-if="quotesLoading && showQuoteUpdateIndicator" class="inline-flex items-center" role="status">
                  <NIcon name="i-ph-spinner-gap" class="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  <span class="sr-only">{{ $t('tag_detail_updating_quotes') }}</span>
                </span>
              </p>
            </div>

            <div class="hidden shrink-0 items-center gap-3 md:flex">
              <NTooltip :content="sortByModel?.label || ''" :_tooltip-content="{ side: 'bottom' }">
              <NCombobox
                class="tag-sort"
                :model-value="sortByModel"
                @update:model-value="sortByModel = $event"
                :items="sortOptions"
                by="value"
                :_combobox-list="{ class: 'min-w-[180px]' }"
                :_combobox-trigger="{
                  btn: 'soft-gray',
                  size: 'sm',
                  trailing: '',
                  ariaLabel: sortByModel?.label || String($ts('tag_detail_sort_placeholder')),
                  class: 'h-10 w-10 justify-center rounded-md p-0',
                }"
              >
                <template #label="{ item }">
                  <span class="flex min-w-0 items-center gap-2.5">
                    <NIcon :name="item.leading" class="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
                    <span>{{ item.label }}</span>
                  </span>
                </template>
                <template #trigger="{ modelValue }">
                  <NIcon :name="modelValue?.leading || 'i-tabler-arrows-sort'" class="h-5 w-5" />
                  <span class="sr-only">{{ modelValue?.label }}</span>
                </template>
              </NCombobox>
              </NTooltip>
              <LanguageSelector />
              <NTooltip
                :content="$t(sortOrder === 'ASC' ? 'tag_detail_sort_order_ascending' : 'tag_detail_sort_order_descending') as string"
                :_tooltip-content="{ side: 'bottom' }"
              >
                <NButton
                  icon
                  :aria-label="$t(sortOrder === 'ASC' ? 'tag_detail_sort_order_ascending' : 'tag_detail_sort_order_descending') as string"
                  :label="sortOrder === 'ASC' ? 'i-ph-sort-ascending' : 'i-ph-sort-descending'"
                  btn="soft-gray"
                  @click="toggleSortOrder"
                />
              </NTooltip>
            </div>

            <div class="flex shrink-0 items-center gap-2 md:hidden">
              <LanguageSelector compact />
              <NButton size="sm" btn="outline-gray" class="rounded-full" @click="mobileFiltersOpen = true">
                <NIcon name="i-ph-faders" class="mr-1 h-4 w-4" aria-hidden="true" />
                {{ $t('tag_detail_button_sort') }}
              </NButton>
            </div>
          </div>
        </div>

        <section aria-labelledby="tag-quotes-title" class="rounded-2xl bg-[#e7e4dd] px-5 py-7 sm:px-8 sm:py-10 lg:px-12 lg:py-12 dark:bg-[#17191e]">
          <h2 id="tag-quotes-title" class="sr-only">{{ $t('tag_detail_quotes_heading', { tag: tag.name }) }}</h2>

          <div v-if="quotesError && quotesTotal === null" class="py-14 text-center" role="alert">
            <NIcon name="i-ph-warning-circle" class="mx-auto mb-4 h-10 w-10 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            <p class="mb-5 font-sans text-gray-700 dark:text-gray-300">{{ $t('tag_detail_quotes_error') }}</p>
            <NButton btn="outline-gray" @click="loadQuotes()">{{ $t('tag_detail_retry') }}</NButton>
          </div>

          <div v-else-if="quotesLoading && quotesTotal === null" class="mb-4" aria-busy="true" :aria-label="$t('tag_detail_loading_quotes') as string">
            <div class="space-y-8">
              <div v-for="i in 6" :key="i" class="animate-pulse border-b border-black/10 pb-8 last:border-0 dark:border-white/10">
                <div class="space-y-3">
                  <div class="h-6 w-5/6 rounded bg-black/10 dark:bg-white/10" />
                  <div class="h-6 w-3/5 rounded bg-black/10 dark:bg-white/10" />
                </div>
                <div class="mt-5 h-4 w-40 rounded bg-black/8 dark:bg-white/8" />
              </div>
            </div>
          </div>

          <div v-else-if="quotes.length > 0" class="mb-4" :aria-busy="quotesLoading">
            <div v-if="quotesError" class="mb-6 flex flex-wrap items-center gap-3" role="alert">
              <span class="font-sans text-sm text-gray-600 dark:text-gray-400">{{ $t('tag_detail_quotes_error') }}</span>
              <NButton size="sm" btn="outline-gray" @click="loadQuotes()">{{ $t('tag_detail_retry') }}</NButton>
            </div>
            <TransitionGroup name="tag-quotes" tag="ol" class="divide-y divide-black/10 dark:divide-white/10">
              <li v-for="quote in quotes" :key="quote.id" class="py-7 first:pt-0 last:pb-0 sm:py-9">
                <article class="quote-editorial-row group relative">
                  <NuxtLink
                    :to="`/quotes/${quote.id}`"
                    :aria-label="quote.name"
                    class="absolute inset-0 z-0 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gray-700 dark:focus-visible:outline-gray-300"
                  />

                  <div class="pointer-events-none relative z-10">
                    <blockquote class="max-w-[70ch] font-serif text-xl leading-[1.65] text-gray-900 dark:text-gray-100 sm:text-2xl">
                      <span class="quote-editorial-text">{{ quote.name }}</span>
                    </blockquote>

                    <div v-if="quote.author || quote.reference" class="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 font-sans text-sm">
                      <NuxtLink
                        v-if="quote.author?.image_url && quote.author.id"
                        :to="`/authors/${quote.author.id}`"
                        :aria-label="quote.author.name"
                        class="pointer-events-auto inline-flex shrink-0 rounded-full transition-[transform,box-shadow] duration-200 hover:scale-105 hover:shadow-lg active:scale-99 active:shadow-none motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700 dark:focus-visible:outline-gray-300"
                      >
                        <NAvatar :src="quote.author.image_url" :alt="quote.author.name" size="xs" rounded="full" class="h-7 w-7" />
                      </NuxtLink>

                      <NuxtLink
                        v-if="quote.author?.id"
                        :to="`/authors/${quote.author.id}`"
                        class="pointer-events-auto font-600 text-gray-700 transition-colors hover:text-gray-950 focus-visible:underline dark:text-gray-300 dark:hover:text-white"
                      >
                        {{ quote.author.name }}
                      </NuxtLink>
                      <span v-else-if="quote.author?.name" class="font-600 text-gray-700 dark:text-gray-300">
                        {{ quote.author.name }}
                      </span>

                      <span v-if="quote.author && quote.reference" class="text-gray-400 dark:text-gray-500" aria-hidden="true">·</span>

                      <NuxtLink
                        v-if="quote.reference?.id"
                        :to="`/references/${quote.reference.id}`"
                        class="pointer-events-auto text-gray-500 transition-colors hover:text-gray-800 focus-visible:underline dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {{ quote.reference.name }}
                      </NuxtLink>
                      <span v-else-if="quote.reference?.name" class="text-gray-500 dark:text-gray-400">
                        {{ quote.reference.name }}
                      </span>
                    </div>
                  </div>
                </article>
              </li>
            </TransitionGroup>
          </div>

          <div v-else-if="quotesError" class="py-10 text-center" role="alert">
            <NIcon name="i-ph-warning-circle" class="mx-auto mb-4 h-10 w-10 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            <p class="mb-5 font-sans text-gray-700 dark:text-gray-300">{{ $t('tag_detail_quotes_error') }}</p>
            <NButton btn="outline-gray" @click="loadQuotes()">{{ $t('tag_detail_retry') }}</NButton>
          </div>

          <div v-else class="py-14 text-center">
            <NIcon name="i-ph-quotes" class="mx-auto mb-4 h-10 w-10 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            <h3 class="mb-2 font-serif text-2xl text-gray-900 dark:text-gray-100">{{ $t('tag_detail_empty') }}</h3>
            <p class="mx-auto max-w-xl font-sans leading-relaxed text-gray-600 dark:text-gray-400">
              {{ $t('tag_detail_empty_desc', { tag: tag.name }) }}
            </p>
          </div>

          <div v-if="loadMoreError && !quotesLoading" class="mt-6 flex flex-wrap items-center justify-center gap-3" role="alert">
            <span class="font-sans text-sm text-gray-600 dark:text-gray-400">{{ $t('tag_detail_load_more_error') }}</span>
            <NButton size="sm" btn="outline-gray" :disabled="loadingMoreQuotes" @click="loadQuotes(false)">
              {{ $t('tag_detail_retry') }}
            </NButton>
          </div>

          <div v-if="hasMoreQuotes && !quotesLoading && !loadMoreError" class="mt-8 flex justify-center">
            <LoadMoreButton
              :idleText="$ts('tag_detail_load_more')"
              :loadingText="$ts('tag_detail_loading_more')"
              :isLoading="loadingMoreQuotes"
              @load="loadMoreQuotes"
            />
          </div>
        </section>
      </main>
    </template>

    <main v-else class="mx-auto max-w-6xl px-6 pb-24 pt-12 sm:px-8 lg:px-10">
      <div v-if="tagError && tagErrorStatus !== 404" class="py-16 text-center" role="alert">
        <NIcon name="i-ph-warning-circle" class="mx-auto mb-4 h-10 w-10 text-gray-500 dark:text-gray-400" aria-hidden="true" />
        <h1 class="mb-3 font-serif text-3xl text-gray-900 dark:text-gray-100">{{ $t('tag_detail_load_error_title') }}</h1>
        <p class="mb-6 font-sans text-gray-600 dark:text-gray-400">{{ $t('tag_detail_load_error_desc') }}</p>
        <NButton btn="outline-gray" @click="refreshTag">{{ $t('tag_detail_retry') }}</NButton>
      </div>
      <div v-else class="py-16 text-center">
        <NIcon name="i-ph-warning" class="mx-auto mb-4 h-10 w-10 text-gray-500 dark:text-gray-400" aria-hidden="true" />
        <h1 class="mb-3 font-serif text-3xl text-gray-900 dark:text-gray-100">{{ $ts('tag_detail_not_found_title') }}</h1>
        <p class="mb-6 font-sans text-gray-600 dark:text-gray-400">{{ $ts('tag_detail_not_found_desc') }}</p>
        <NButton to="/tags" btn="outline-gray" class="px-8">{{ $ts('tag_detail_browse') }}</NButton>
      </div>
    </main>

    <ClientOnly>
      <MobileSortAuthors
        v-if="isMobile"
        v-model:open="mobileFiltersOpen"
        v-model:sortBy="sortBy"
        :sort-order="sortOrder"
        :sort-options="sortOptions"
        @toggle-sort-order="toggleSortOrder"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { useVerbatimsSeo } from '~/composables/useSeo'

const { $t, $ts } = useI18n()
const { isMobile } = useMobileDetection()
definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const rawTagName = computed(() => String(route.params.name || ''))
const tagApiUrl = computed(() => `/api/tags/${encodeURIComponent(rawTagName.value)}`)
const languageStore = useLanguageStore()

const tagSortValues = new Set(['created_at', 'likes_count', 'views_count', 'shares_count'])
const readQueryString = (value: unknown) => typeof value === 'string' ? value : ''
const readTagFiltersFromRoute = () => {
  const routeSortBy = readQueryString(route.query.sort)
  const routeLanguage = readQueryString(route.query.lang)

  return {
    sortBy: tagSortValues.has(routeSortBy) ? routeSortBy : 'created_at',
    sortOrder: route.query.order === 'ASC' ? 'ASC' as const : 'DESC' as const,
    language: languageStore.availableLanguages.some(language => language.value === routeLanguage)
      ? routeLanguage
      : route.query.lang === undefined
        ? null
        : 'all'
  }
}
const initialTagFilters = readTagFiltersFromRoute()
const initialRouteLanguage = languageStore.availableLanguages.find(language => language.value === initialTagFilters.language)
if (initialRouteLanguage) languageStore.selectedLanguage = initialRouteLanguage

const sortBy = ref<string>(initialTagFilters.sortBy)
const sortOrder = ref<'ASC' | 'DESC'>(initialTagFilters.sortOrder)
const quotes = ref<QuoteWithRelations[]>([])
const quotesLoading = ref<boolean>(true)
const showQuoteUpdateIndicator = ref(false)
const loadingMoreQuotes = ref<boolean>(false)
const hasMoreQuotes = ref<boolean>(false)
const currentPage = ref<number>(1)
const quotesTotal = ref<number | null>(null)
const quotesError = ref(false)
const loadMoreError = ref(false)
const mobileFiltersOpen = ref<boolean>(false)
const stickyToolbarRef = ref<HTMLElement | null>(null)
const isStickyToolbarStuck = ref(false)
const isApplyingRouteFilters = ref(false)
let quoteRequestId = 0
let quoteUpdateIndicatorTimer: ReturnType<typeof setTimeout> | undefined

const sortOptions = [
  { label: $ts('tag_detail_sort_most_recent'), value: 'created_at', leading: 'i-tabler-clock-hour-12' },
  { label: $ts('tag_detail_sort_most_liked'), value: 'likes_count', leading: 'i-tabler-stars' },
  { label: $ts('tag_detail_sort_most_viewed'), value: 'views_count', leading: 'i-tabler-eye' },
  { label: $ts('tag_detail_sort_most_shared'), value: 'shares_count', leading: 'i-tabler-share-3' }
]

const sortByModel = computed({
  get: () => sortOptions.find(option => option.value === sortBy.value) || sortOptions[0],
  set: (option: { label: string; value: string } | null) => {
    sortBy.value = option?.value || 'created_at'
  }
})

const { data: tagData, pending, error: tagError, refresh: refreshTag } = await useLazyFetch<ApiResponse<TagWithStats>>(tagApiUrl)

const tag = computed(() => tagData.value?.data ?? null)
const tagErrorStatus = computed(() => Number((tagError.value as { statusCode?: number } | null)?.statusCode ?? 0))
const categoryTranslationKeys: Record<string, string> = {
  emotion: 'tag_detail_category_emotion',
  existential: 'tag_detail_category_existential',
  growth: 'tag_detail_category_growth',
  ideas: 'tag_detail_category_ideas',
  knowledge: 'tag_detail_category_knowledge',
  media: 'tag_detail_category_media',
  mindset: 'tag_detail_category_mindset',
  relationships: 'tag_detail_category_relationships',
  society: 'tag_detail_category_society',
  style: 'tag_detail_category_style'
}
const tagCategoryLabel = computed(() => {
  const category = tag.value?.category?.trim()
  if (!category) return $t('tag_detail_general_label')

  const translationKey = categoryTranslationKeys[category.toLowerCase()]
  return translationKey ? $t(translationKey) : category
})
const quoteCountKey = computed(() => {
  if (!languageStore.isAllLanguages) {
    return quotesTotal.value === 1 ? 'tag_detail_language_quote_singular' : 'tag_detail_language_quote_plural'
  }
  return quotesTotal.value === 1 ? 'tag_detail_visible_quote_singular' : 'tag_detail_visible_quote_plural'
})

const tagDotStyle = computed(() => {
  const color = tag.value?.color?.trim()
  return color ? { backgroundColor: color } : undefined
})

const updateStickyToolbarState = () => {
  const toolbar = stickyToolbarRef.value
  if (!toolbar) return

  const stickyTop = Number.parseFloat(window.getComputedStyle(toolbar).top) || 0
  isStickyToolbarStuck.value = window.scrollY > 0 && toolbar.getBoundingClientRect().top <= stickyTop + 1
}

onMounted(() => {
  updateStickyToolbarState()
  window.addEventListener('scroll', updateStickyToolbarState, { passive: true })
  window.addEventListener('resize', updateStickyToolbarState, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateStickyToolbarState)
  window.removeEventListener('resize', updateStickyToolbarState)
})

const navigateBack = () => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    window.history.back()
    return
  }

  navigateTo('/tags')
}

const syncTagFiltersToRoute = async () => {
  if (isApplyingRouteFilters.value) return

  const query = { ...route.query }
  delete query.lang
  delete query.sort
  delete query.order

  if (languageStore.currentLanguageValue !== 'all') query.lang = languageStore.currentLanguageValue
  if (sortBy.value !== 'created_at') query.sort = sortBy.value
  if (sortOrder.value !== 'DESC') query.order = sortOrder.value

  const filterKeys = ['lang', 'sort', 'order'] as const
  if (filterKeys.every(key => route.query[key] === query[key])) return

  await router.replace({ path: route.path, query, hash: route.hash })
}

type DebouncedAction = (() => void) & { cancel: () => void }
const createDebouncedAction = (action: () => void | Promise<void>, delay: number): DebouncedAction => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const debounced = (() => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      void action()
    }, delay)
  }) as DebouncedAction

  debounced.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = undefined
  }

  return debounced
}
const syncTagFiltersToRouteDebounced = createDebouncedAction(syncTagFiltersToRoute, 250)

const applyTagFiltersFromRoute = async () => {
  const nextFilters = readTagFiltersFromRoute()
  const nextLanguage = nextFilters.language ?? languageStore.currentLanguageValue
  const nextLanguageOption = languageStore.availableLanguages.find(language => language.value === nextLanguage)
  const filtersChanged = nextFilters.sortBy !== sortBy.value ||
    nextFilters.sortOrder !== sortOrder.value ||
    nextLanguage !== languageStore.currentLanguageValue

  if (!filtersChanged) return

  isApplyingRouteFilters.value = true
  sortBy.value = nextFilters.sortBy
  sortOrder.value = nextFilters.sortOrder
  if (nextLanguageOption) languageStore.selectedLanguage = nextLanguageOption
  await nextTick()
  isApplyingRouteFilters.value = false
  if (tag.value?.name) loadQuotes()
}

const loadQuotes = async (reset = true) => {
  if (!tag.value?.name) return

  const requestId = ++quoteRequestId
  if (reset) {
    quotesLoading.value = true
    showQuoteUpdateIndicator.value = false
    if (quoteUpdateIndicatorTimer) clearTimeout(quoteUpdateIndicatorTimer)
    if (quotesTotal.value !== null) {
      quoteUpdateIndicatorTimer = setTimeout(() => {
        showQuoteUpdateIndicator.value = true
      }, 180)
    }
    currentPage.value = 1
    quotesError.value = false
    loadMoreError.value = false
  } else {
    loadingMoreQuotes.value = true
    loadMoreError.value = false
  }

  try {
    const response = await $fetch<ApiResponse<QuoteWithRelations[]>>('/api/quotes', {
      query: {
        page: currentPage.value,
        limit: 20,
        sort_by: sortBy.value,
        sort_order: sortOrder.value,
        tag: tag.value.name,
        ...languageStore.getLanguageQuery()
      }
    })

    if (requestId !== quoteRequestId) return
    const fetchedQuotes = response.data || []

    if (reset) {
      quotes.value = fetchedQuotes
    } else {
      quotes.value.push(...fetchedQuotes)
    }

    quotesTotal.value = response.pagination?.total ?? fetchedQuotes.length
    hasMoreQuotes.value = Boolean(response.pagination?.hasMore)
  } catch (error) {
    console.error('Failed to load tag quotes:', error)
    if (requestId === quoteRequestId) {
      if (reset) quotesError.value = true
      else loadMoreError.value = true
    }
  } finally {
    if (requestId === quoteRequestId) {
      if (quoteUpdateIndicatorTimer) clearTimeout(quoteUpdateIndicatorTimer)
      quoteUpdateIndicatorTimer = undefined
      showQuoteUpdateIndicator.value = false
      quotesLoading.value = false
      loadingMoreQuotes.value = false
    }
  }
}

const loadMoreQuotes = async () => {
  if (!hasMoreQuotes.value || loadingMoreQuotes.value) return
  currentPage.value += 1
  await loadQuotes(false)
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
}

useVerbatimsSeo(() => {
  const currentTag = tag.value
  const tagName = currentTag?.name
  if (!currentTag || !tagName) {
    return {
      title: $ts('tag_detail_meta_title_fallback'),
      description: $ts('tag_detail_meta_desc_fallback'),
      type: 'website'
    }
  }
  return {
    title: `${tagName} - Verbatims`,
    description: currentTag.description || `Browse quotes tagged with ${tagName} on Verbatims.`,
    imagePath: `/api/og/tags/${currentTag.id}.png`,
    imageAlt: `${tagName}: ${currentTag.usage_count ?? 0} quotes on Verbatims`,
    type: 'website'
  }
})

watch(tag, (value) => {
  if (value?.name) {
    loadQuotes()
  }
}, { immediate: true })

watch(rawTagName, () => {
  quoteRequestId += 1
  if (quoteUpdateIndicatorTimer) clearTimeout(quoteUpdateIndicatorTimer)
  quoteUpdateIndicatorTimer = undefined
  showQuoteUpdateIndicator.value = false
  quotes.value = []
  quotesTotal.value = null
  hasMoreQuotes.value = false
  currentPage.value = 1
  quotesError.value = false
  loadMoreError.value = false
  quotesLoading.value = true
})

watch([sortBy, sortOrder, () => languageStore.currentLanguageValue], () => {
  if (isApplyingRouteFilters.value) return
  syncTagFiltersToRouteDebounced()
  if (tag.value?.name) loadQuotes()
}, { flush: 'post' })

watch(() => route.query, () => {
  void applyTagFiltersFromRoute()
}, { deep: true })

onMounted(() => {
  // Explicit URL filters take precedence; otherwise preserve the app's selected language.
  void (async () => {
    await applyTagFiltersFromRoute()
    await syncTagFiltersToRoute()
  })()
})

onBeforeUnmount(() => {
  syncTagFiltersToRouteDebounced.cancel()
  if (quoteUpdateIndicatorTimer) clearTimeout(quoteUpdateIndicatorTimer)
})

</script>

<style scoped>
.quote-editorial-text {
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  background-image: linear-gradient(currentColor, currentColor);
  background-repeat: no-repeat;
  background-position: 0 100%;
  background-size: 0% 1px;
  transition: background-size 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

:global(.tag-sort) {
  width: max-content;
}

:global(.tag-sort [data-slot='combobox-anchor']),
:global(.tag-sort [data-slot='combobox-trigger']) {
  width: 2.5rem !important;
  min-width: 2.5rem !important;
}

:global(.tag-sort .combobox-trigger-trailing) {
  display: none !important;
}

.quote-editorial-row:hover .quote-editorial-text,
.quote-editorial-row:focus-within .quote-editorial-text {
  background-size: 100% 1px;
}

.tag-quotes-enter-active,
.tag-quotes-leave-active,
.tag-quotes-move {
  transition: opacity 180ms ease, transform 180ms ease;
}

.tag-quotes-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.tag-quotes-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .tag-quotes-enter-active,
  .tag-quotes-leave-active,
  .tag-quotes-move {
    transition: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .quote-editorial-text {
    transition: none;
  }
}
</style>
