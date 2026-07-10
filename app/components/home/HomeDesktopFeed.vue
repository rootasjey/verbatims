<template>
  <div>
    <!-- Three-column newspaper layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b b-dashed">

      <!-- Left sidebar: Navigation -->
      <div class="pt-8 pb-12 hidden lg:block lg:col-span-2 border-r b-dashed border-gray-300 dark:border-gray-700">
        <nav class="flex flex-col space-y-2 font-500 px-4 md:px-8">
          <HomeNavLink to="/quotes">
            {{ $t('home.nav.quotes') }}
          </HomeNavLink>
          <HomeNavLink to="/authors">
            {{ $t('home.nav.authors') }}
          </HomeNavLink>
          <HomeNavLink to="/references">
            {{ $t('home.nav.references') }}
          </HomeNavLink>
          <button @click="showSearch = true"
            class="group relative inline-block overflow-hidden font-sans text-sm transition-colors duration-300 text-gray-700 dark:text-gray-300 hover:text-white dark:hover:text-[#0C0A09] group-active:scale-95 transition-transform text-left w-full">
            <span class="relative z-1 transition-colors duration-300">{{ $t('home.nav.search') }}</span>
            <span class="absolute inset-0 w-0 group-hover:w-full transition-all duration-300 ease-out -z-0 bg-[#0C0A09] dark:bg-[#FAFAF9]" />
          </button>
        </nav>

        <div class="mt-6 pt-6 border-t b-dashed border-gray-300 dark:border-gray-700">
          <div class="px-4 md:px-8">
            <p class="font-sans text-xs uppercase tracking-wider text-gray-400 dark:text-gray-600 mb-4">
              {{ $t('home.stats') }}
            </p>
            <div class="border border-gray-200 dark:border-gray-700 rounded-sm p-3 space-y-2">
              <div class="flex items-baseline justify-between gap-2">
                <span class="font-serif text-lg font-600 text-gray-900 dark:text-gray-100">{{ stats.quotes.toLocaleString() }}</span>
                <span class="font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ $t('home.quotes_label') }}</span>
              </div>
              <div class="flex items-baseline justify-between gap-2">
                <span class="font-serif text-lg font-600 text-gray-900 dark:text-gray-100">{{ stats.authors.toLocaleString() }}</span>
                <span class="font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ $t('home.authors_label') }}</span>
              </div>
              <div class="flex items-baseline justify-between gap-2">
                <span class="font-serif text-lg font-600 text-gray-900 dark:text-gray-100">{{ stats.references.toLocaleString() }}</span>
                <span class="font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ $t('home.references_label') }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Quotes -->
        <div class="mt-8 pt-6 border-t b-dashed border-gray-300 dark:border-gray-700">
          <div class="px-4 md:px-8 mb-4 flex items-center justify-between">
            <p class="font-sans text-xs uppercase tracking-wider text-gray-400 dark:text-gray-600">
              {{ $t('home.recent_quotes') }}
            </p>
            <a href="/quotes" class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              {{ $t('home.see_all') }}
            </a>
          </div>

          <div class="px-4 md:px-8 space-y-6">
            <NuxtLink
              v-for="quote in recentSidebarQuotes"
              :key="quote.id"
              :to="`/quotes/${quote.id}`"
              class="block group"
            >
              <blockquote class="font-body text-xs text-gray-700 dark:text-gray-300 italic leading-snug group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                {{ truncateQuote(quote.name, 100) }}
              </blockquote>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {{ quote.author?.name || $t('home.unknown') }}
              </p>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Center content -->
      <div class="mt-8 lg:col-span-7">
        <!-- Theme header -->
        <div v-if="props.theme" class="lg:px-8 border-b b-dashed border-gray-300 dark:border-gray-700 pb-6 mb-6">
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: `var(--theme-primary, #6366f1)` }" />
              <p class="font-sans text-xs font-600 uppercase tracking-[0.2em]" :style="{ color: `var(--theme-primary, #6366f1)` }">
              {{ $t('home.theme') }}
            </p>
          </div>
          <h2 class="font-serif text-2xl font-300 text-gray-900 dark:text-gray-100">
            {{ props.theme.name }}
          </h2>
          <p v-if="props.theme.description" class="font-sans text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ props.theme.description }}
          </p>
        </div>

        <!-- Featured quote (Philosophy section) -->
        <div v-if="featuredQuote" class="mb-8 pb-8 border-b b-dashed border-gray-300 dark:border-gray-700">
          <div class="lg:px-8 flex items-center gap-2 mb-4">
            <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: `var(--theme-secondary, #FAB95B)` }" />
            <p class="font-sans text-xs font-600 uppercase tracking-[0.2em]" :style="{ backgroundColor: `var(--theme-secondary, #FAB95B)` }" >
              {{ $t('home.featured') }}
            </p>
          </div>
          <NuxtLink
            :to="`/quotes/${featuredQuote.id}`"
            class="block group lg:px-8"
          >
            <h2 class="font-serif text-3xl md:text-4xl lg:text-6xl font-200 text-gray-900 dark:text-gray-100 leading-tight mb-4 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
              {{ featuredQuote.name }}
            </h2>
          </NuxtLink>
          <div class="flex items-center gap-3 mt-6 lg:px-8">
            <NuxtLink
              v-if="featuredQuote.author"
              :to="`/authors/${featuredQuote.author.id}`"
              class="flex items-center gap-3 group"
            >
              <div
                v-if="featuredQuote.author?.image_url && !imageErrors[featuredQuote.author.id]"
                class="w-6 h-6 rounded-full overflow-hidden grayscale"
              >
                <img :src="featuredQuote.author.image_url" :alt="featuredQuote.author.name" class="w-full h-full object-cover" @error="authorAvatarFailed(featuredQuote.author.id)" />
              </div>
              <div v-else class="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                <span class="font-serif text-xs text-gray-400 dark:text-gray-500">
                  {{ getAuthorInitials(featuredQuote.author?.name) }}
                </span>
              </div>
              <div>
                <p class="font-subtitle text-2xl font-600 text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                  {{ featuredQuote.author?.name || $t('home.unknown_author') }}
                </p>
                <p v-if="featuredQuote.reference" class="font-sans text-xs text-gray-500 dark:text-gray-400">
                  {{ featuredQuote.reference.name }}
                </p>
              </div>
            </NuxtLink>
            <template v-else>
              <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span class="font-serif text-sm font-bold text-gray-600 dark:text-gray-400">
                  ?
                </span>
              </div>
              <div>
                <p class="font-serif text-sm font-600 text-gray-900 dark:text-gray-100">
                  {{ $t('home.unknown_author') }}
                </p>
              </div>
            </template>
          </div>
        </div>

        <!-- Spotlight section -->
        <div v-if="spotlightReference" class="mb-8 pb-8 border-b border-gray-300 dark:border-gray-700">
          <div class="flex justify-center items-center gap-3 mb-4">
            <span class="flex-1 max-w-4 h-px bg-gray-200 dark:bg-gray-700" />
            <p class="font-sans text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 flex-shrink-0">
              {{ $t('home.spotlight') }}
            </p>
             <span class="flex-1 max-w-4 h-px bg-gray-200 dark:bg-gray-700" />
          </div>
          <NuxtLink :to="`/references/${spotlightReference.id}`" class="block group">
            <div class="mb-6 mx-8 overflow-hidden">
              <div
                v-if="spotlightReference.image_url && !referenceImageErrors[spotlightReference.id]"
                class="w-full bg-cover bg-center grayscale"
                :style="{ backgroundImage: `url(${spotlightReference.image_url})`, aspectRatio: spotlightAspectRatio || undefined }"
              />
              <div v-else class="w-full h-64 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800" />
            </div>
            <h3 class="font-serif text-2xl font-600 text-gray-900 dark:text-gray-100 text-center mb-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
              {{ spotlightReference.name }}
            </h3>
          </NuxtLink>
          <p class="font-sans text-sm text-gray-500 dark:text-gray-400 text-center">
            {{ formatReferenceType(spotlightReference.primary_type) }}
          </p>
        </div>

        <!-- Opinion section: Grid of small quotes -->
        <div class="mb-8 pb-8 border-b border-gray-300 dark:border-gray-700">
          <p class="font-sans text-xs italic uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500 mb-6 text-center">
            {{ $t('home.opinion') }}
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mx-4">
            <div
              v-for="(item, index) in opinionQuotes"
              :key="`opinion-${index}`"
              class="flex gap-3 p-4 border border-transparent rounded-sm transition-all duration-300 hover:bg-gray-50 dark:hover:bg-white/[0.02] hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm"
            >
              <NuxtLink
                v-if="item.author"
                :to="`/authors/${item.author.id}`"
                class="flex-shrink-0"
              >
                <div
                  v-if="item.author?.image_url && !imageErrors[item.author.id]"
                  class="w-8 h-8 rounded-full overflow-hidden mt-1 grayscale"
                >
                  <img :src="item.author.image_url" :alt="item.author.name" class="w-full h-full object-cover" @error="authorAvatarFailed(item.author.id)" />
                </div>
                <div v-else class="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center mt-1">
                  <span class="font-serif text-[10px] text-gray-400 dark:text-gray-500">
                    {{ getAuthorInitials(item.author.name) }}
                  </span>
                </div>
              </NuxtLink>
              <div v-else class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 mt-1">
                <span class="font-serif text-xs font-bold text-gray-600 dark:text-gray-400">
                  ?
                </span>
              </div>
              <div class="min-w-0 flex-1">
                <NuxtLink
                  :to="`/quotes/${item.id}`"
                  class="block group"
                >
                  <blockquote class="font-body text-sm text-gray-700 dark:text-gray-300 italic leading-snug group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                    {{ truncateQuote(item.name, 120) }}
                  </blockquote>
                </NuxtLink>
                <NuxtLink
                  v-if="item.author"
                  :to="`/authors/${item.author.id}`"
                  class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1 inline-block hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  {{ item.author?.name || $t('home.unknown') }}
                </NuxtLink>
                <p v-else class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ $t('home.unknown') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Stories section -->
        <div class="mb-8">
          <div class="flex justify-center items-center gap-3 mb-6 mx-6">
            <span class="flex-1 max-w-3 h-px bg-gray-200 dark:bg-gray-700" />
            <p class="font-sans text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 flex-shrink-0">
              {{ $t('home.stories') }}
            </p>
            <span class="flex-1 max-w-3 h-px bg-gray-200 dark:bg-gray-700" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mx-6">
            <div
              v-for="(item, index) in storyQuotes"
              :key="`story-${index}`"
              class="pb-6 border-b border-gray-100 dark:border-gray-800 md:border-b-0 md:pb-0"
              :class="{ 'md:border-r md:border-gray-300 md:dark:border-gray-700 md:pr-6': index % 3 < 2 }"
            >
              <NuxtLink :to="`/quotes/${item.id}`" class="block group">
                <h4 class="font-serif text-lg font-600 text-gray-900 dark:text-gray-100 leading-tight mb-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                  {{ truncateQuote(item.name, 80) }}
                </h4>
              </NuxtLink>
              <NuxtLink
                v-if="item.author"
                :to="`/authors/${item.author.id}`"
                class="font-sans text-sm text-gray-600 dark:text-gray-400 line-clamp-3 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                {{ item.author?.name }}
              </NuxtLink>
              <p v-else class="font-sans text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                {{ $t('home.unknown') }}
              </p>
              <NuxtLink
                v-if="item.reference"
                :to="`/references/${item.reference.id}`"
                class="font-sans text-xs text-gray-400 dark:text-gray-600 mt-2 inline-block hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
              >
                {{ item.reference.name }}
              </NuxtLink>
              <p v-else class="font-sans text-xs text-gray-400 dark:text-gray-600 mt-2">
                {{ '' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right sidebar: Featured references -->
      <div class="lg:col-span-3 lg:border-l b-dashed border-gray-300 dark:border-gray-700 lg:sticky lg:top-16 lg:self-start lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto pb-12">
        <div class="px-4 md:px-8 mt-4 mb-6 pb-4 border-b b-dashed border-gray-300 dark:border-gray-700 flex items-center justify-between">
          <p class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">
            {{ $t('home.featured_references') }}
          </p>
          <a href="/references" class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            {{ $t('home.see_all') }}
          </a>
        </div>

        <div class="px-4 md:px-8 space-y-6">
          <div
            v-for="(ref, index) in featuredReferences"
            :key="ref.id"
            class="group cursor-pointer flex gap-3"
            @click="navigateTo(`/references/${ref.id}`)"
          >
            <div class="flex-shrink-0 w-16 h-22 overflow-hidden rounded-sm">
              <div
                v-if="ref.image_url && !referenceImageErrors[ref.id]"
                class="w-full h-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105 grayscale"
                :style="{ backgroundImage: `url(${ref.image_url})` }"
              />
              <div v-else class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                <NIcon name="i-ph-image" class="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="font-title text-md font-600 text-gray-900 dark:text-gray-100 leading-snug group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors line-clamp-2">
                {{ ref.name }}
              </h4>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {{ formatReferenceType(ref.primary_type) }}
              </p>
              <p v-if="ref.description" class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                {{ ref.description }}
              </p>
            </div>
          </div>
        </div>

        <div class="mt-8 pt-6 border-t b-dashed border-gray-300 dark:border-gray-700 text-center">
          <NButton
            btn="link"
            to="/references"
            :label="$ts('home.see_more')"
            trailing="i-ph-arrow-right"
            class="font-sans text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors inline-flex items-center gap-2"
          />
        </div>

        <!-- Related Authors -->
        <div v-if="sidebarAuthors.length" class="px-4 md:px-8 mt-8 pt-6 border-t b-dashed border-gray-300 dark:border-gray-700">
          <div class="mb-4 flex items-center justify-between">
            <p class="font-sans text-xs uppercase tracking-wider text-gray-400 dark:text-gray-600">
              {{ $t('home.related_authors') }}
            </p>
            <a href="/authors" class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              {{ $t('home.see_all') }}
            </a>
          </div>
          <div class="space-y-4">
            <NuxtLink
              v-for="author in sidebarAuthors"
              :key="author.id"
              :to="`/authors/${author.id}`"
              class="flex items-center gap-3 group"
            >
              <div class="flex-shrink-0">
                <div
                  v-if="author.image_url && !imageErrors[author.id]"
                  class="w-10 h-10 rounded-full overflow-hidden grayscale"
                >
                  <img :src="author.image_url" :alt="author.name" class="w-full h-full object-cover" @error="authorAvatarFailed(author.id)" />
                </div>
                <div v-else class="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                  <span class="font-subtitle text-xs text-gray-400 dark:text-gray-500">
                    {{ getAuthorInitials(author.name) }}
                  </span>
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-subtitle text-lg font-600 text-gray-900 dark:text-gray-100 truncate group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                  {{ author.name || $t('home.unknown') }}
                </p>
                <p v-if="author.quotes_count" class="font-sans text-xs text-gray-500 dark:text-gray-400">
                  {{ author.quotes_count }} {{ author.quotes_count === 1 ? $t('home.quote_singular') : $t('home.quote_plural') }}
                </p>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div v-if="feed.hasMore?.value" class="mt-12">
      <LoadMoreButton
        :idleText="$ts('home.load_more')"
        :loadingText="$ts('home.loading')"
        :isLoading="feed.loadingMore?.value || false"
        @load="feed.loadMore()"
      />
    </div>
  </div>

  <SearchBox v-model="showSearch" />

  <AddQuoteDialog v-model="showEditQuoteDialog" :edit-quote="selectedQuote as any"
    @quote-updated="closeEditAfterUpdate" />

  <DeleteQuoteDialog v-model="showDeleteQuoteDialog" :quote="selectedQuote as any" @quote-deleted="onQuoteDeleted" />

  <ReportDialog v-model="showReportDialog" targetType="quote" :targetId="selectedQuote?.id" />
</template>

<script setup lang="ts">
import type { ProcessedQuoteResult } from '~~/server/types'
import type { UseHomeFeed } from '~/composables/useHomeFeed'
import { navigateTo } from 'nuxt/app'

const { $t, $ts } = useI18n()

interface Props {
  feed: UseHomeFeed
  stats?: { quotes: number; authors: number; references: number }
  theme?: {
    slug: string
    name: string
    description: string | null
    image_url: string | null
    config: Record<string, any> | null
  } | null
}

const props = withDefaults(defineProps<Props>(), {
  stats: () => ({ quotes: 0, authors: 0, references: 0 }),
  theme: null
})

const showSearch = ref(false)
const selectedQuote = ref<ProcessedQuoteResult | null>(null)
const showEditQuoteDialog = ref(false)
const showDeleteQuoteDialog = ref(false)
const showReportDialog = ref(false)

// Extract featured quote (first quote)
const featuredQuote = computed(() => {
  const quotes = props.feed.quotes.value || []
  return quotes[0] || null
})

// Extract spotlight reference (first reference)
const spotlightReference = computed(() => {
  const refs = props.feed.references.value || []
  return refs[0] || null
})

const spotlightAspectRatio = ref<string | null>(null)
const referenceImageErrors = reactive<Record<number, boolean>>({})

watch(spotlightReference, (ref, _oldRef, onCleanup) => {
  if (!ref?.image_url) {
    spotlightAspectRatio.value = null
    return
  }

  let stale = false
  onCleanup(() => { stale = true })

  const img = new Image()
  img.onload = () => {
    if (stale) return
    spotlightAspectRatio.value = `${img.naturalWidth} / ${img.naturalHeight}`
  }
  img.onerror = () => {
    if (stale) return
    referenceImageErrors[ref.id] = true
    spotlightAspectRatio.value = null
  }
  img.src = ref.image_url
}, { immediate: true })

// Extract opinion quotes (next 6 quotes after featured)
const opinionQuotes = computed(() => {
  const quotes = props.feed.quotes.value || []
  return quotes.slice(1, 7)
})

// Extract story quotes (next 9 quotes after opinion)
const storyQuotes = computed(() => {
  const quotes = props.feed.quotes.value || []
  return quotes.slice(7, 16)
})

// Extract featured references (all after spotlight)
const featuredReferences = computed(() => {
  const refs = props.feed.references.value || []
  return refs.slice(1)
})

watch(featuredReferences, (refs) => {
  refs.forEach((ref) => {
    if (!ref.image_url || referenceImageErrors[ref.id]) return
    const img = new Image()
    img.onerror = () => {
      referenceImageErrors[ref.id] = true
    }
    img.src = ref.image_url
  })
}, { immediate: true })

// Extract top authors for sidebar (most liked)
const sidebarAuthors = computed(() => {
  const auths = props.feed.authors?.value || []
  return auths.slice(0, 8)
})

// Extract recent quotes for sidebar (12 most recent)
const recentSidebarQuotes = computed(() => {
  const quotes = props.feed.quotes.value || []
  // Use moderated_at if available, otherwise created_at
  return quotes
    .slice()
    .sort((a, b) => {
      const dateA = a.moderated_at || a.created_at
      const dateB = b.moderated_at || b.created_at
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })
    .slice(0, 24)
})

const truncateQuote = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const formatReferenceType = (type: string) => {
  const t = $ts('reference_types.' + type)
  return t || type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const getAuthorInitials = (name: string) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase()
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
}

// Track images that failed to load so we show the initials fallback
const imageErrors = reactive<Record<number, boolean>>({})

const authorAvatarFailed = (id: number) => {
  imageErrors[id] = true
}

const openEdit = (quote: ProcessedQuoteResult) => {
  selectedQuote.value = quote
  showEditQuoteDialog.value = true
}

const openDelete = (quote: ProcessedQuoteResult) => {
  selectedQuote.value = quote
  showDeleteQuoteDialog.value = true
}

const openReport = (quote: ProcessedQuoteResult) => {
  selectedQuote.value = quote
  showReportDialog.value = true
}

const closeEditAfterUpdate = async () => {
  showEditQuoteDialog.value = false

  try {
    if (!selectedQuote.value?.id) return
    const res = await $fetch<{ success: boolean; data: ProcessedQuoteResult }>(`/api/quotes/${selectedQuote.value.id}`)
    const updated = res.data
    if (updated) props.feed.updateQuoteInFeed(updated)
  } catch (e) {
    console.error('Failed to update quote:', e)
  }
}

const onQuoteDeleted = async () => {
  showDeleteQuoteDialog.value = false
  if (selectedQuote.value?.id) {
    props.feed.removeQuoteFromFeed(selectedQuote.value.id)
  }
}



</script>

<style scoped>
.grayscale {
  filter: grayscale(100%);
  transition: filter 0.3s ease, transform 0.3s ease;
}

.grayscale:hover,
.group:hover .grayscale {
  filter: grayscale(0%);
  transform: scale(1.03);
}
</style>
