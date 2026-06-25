<template>
  <div class="mobile-home-feed bg-[#FAFAF9] dark:bg-[#0C0A09]">
    <!-- ── Featured Quote ── -->
    <div class="bg-gray-100 dark:bg-gray-800 px-6 pt-8 pb-2 animate-fade-in-up" style="animation-delay: 0s">
      <div v-if="featuredQuote" class="mb-2">
        <div @click="handleClickAuthor(quoteAuthor?.id)" class="flex items-center gap-3 cursor-pointer group">
          <div v-if="quoteAuthor?.image_url" class="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-2 p-.5" :style="{ '--un-ring-color': `var(--theme-primary, #6366f1)` }">
            <img :src="quoteAuthor.image_url" :alt="quoteAuthor.name" class="w-full h-full grayscale object-cover rounded-full" />
          </div>
          <div v-else class="w-6 h-6 rounded-full ring-2 flex items-center justify-center flex-shrink-0" :style="{ '--un-ring-color': `var(--theme-primary, #6366f1)` }">
            <span class="font-serif text-xs text-gray-400 dark:text-gray-500">{{ getAuthorInitials(quoteAuthor?.name) }}</span>
          </div>
          <div class="min-w-0">
            <p class="font-subtitle text-lg font-600 text-gray-900 dark:text-gray-100 truncate group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
              {{ quoteAuthor?.name || 'Unknown Author' }}
            </p>
            <p v-if="featuredQuote?.reference" class="font-sans text-xs text-gray-500 dark:text-gray-400 truncate">
              {{ featuredQuote.reference.name }}
            </p>
          </div>
        </div>
      </div>

      <NuxtLink
        v-if="featuredQuote"
        :to="`/quotes/${featuredQuote.id}`"
        class="block group"
      >
        <blockquote class="font-serif text-3xl font-200 text-gray-900 dark:text-gray-100 leading-tight group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
          {{ featuredQuote.name }}
        </blockquote>
      </NuxtLink>
    </div>

    <!-- ── Theme Section ── -->
    <div v-if="theme" class="bg-gray-100 dark:bg-gray-800 px-6 pt-8 pb-8 border-t b-dashed border-gray-200 dark:border-gray-700 animate-fade-in-up" style="animation-delay: 0.05s">
      <div class="flex items-center gap-2 mb-3">
        <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: `var(--theme-primary, #6366f1)` }" />
        <p class="font-sans text-xs font-600 uppercase tracking-[0.2em]" :style="{ color: `var(--theme-primary, #6366f1)` }">
          Theme
        </p>
      </div>
      <h2 class="font-serif text-lg font-200 text-gray-900 dark:text-gray-100 leading-tight">
        {{ theme.name }}
      </h2>
      <p v-if="theme.description" class="font-sans text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-md">
        {{ theme.description }}
      </p>
      <div v-if="stats" class="mt-2 inline-flex items-center gap-3 border border-dashed border-gray-200 dark:border-gray-700 rounded-sm px-3 py-2">
        <span class="font-serif text-lg font-600 text-gray-900 dark:text-gray-100">{{ stats.quotes?.toLocaleString() }}</span>
        <span class="font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">quotes</span>
        <span class="text-gray-300 dark:text-gray-600">·</span>
        <span class="font-serif text-lg font-600 text-gray-900 dark:text-gray-100">{{ stats.authors?.toLocaleString() }}</span>
        <span class="font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">authors</span>
      </div>
    </div>

    <!-- ── Authors Section ── -->
    <!-- <div v-if="allAuthors.length > 0 || curatedLoading" class="border-t border-dashed border-gray-300 dark:border-gray-700" /> -->
    <div v-if="allAuthors.length > 0 || curatedLoading" class="px-6 py-6 animate-fade-in-up" style="animation-delay: 0.1s">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: `var(--theme-secondary, #6366f1)` }" />
          <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
            Authors
          </p>
        </div>

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

      <template v-if="allAuthors.length > 0">
        <div class="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
          <NuxtLink
            v-for="author in allAuthors.slice(0, 8)"
            :key="author.id"
            :to="`/authors/${author.id}`"
            class="flex-shrink-0 flex gap-3 min-w-0 group"
          >
            <div v-if="author.image_url" class="w-12 h-12 rounded-full overflow-hidden grayscale flex-shrink-0">
              <img :src="author.image_url" :alt="author.name" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
              <span class="font-subtitle text-xs text-gray-400 dark:text-gray-500">{{ getAuthorInitials(author.name) }}</span>
            </div>
            <div class="min-w-0">
              <p class="font-subtitle text-sm font-600 text-gray-900 dark:text-gray-100 truncate max-w-24 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                {{ author.name }}
              </p>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {{ author.quotes_count || 0 }} {{ (author.quotes_count || 0) === 1 ? 'quote' : 'quotes' }}
              </p>
            </div>
          </NuxtLink>
        </div>
      </template>
      <template v-else>
        <div class="flex gap-4 overflow-x-auto pb-1">
          <div v-for="i in 3" :key="i" class="flex-shrink-0 flex gap-3">
            <div class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0" />
            <div>
              <div class="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1.5" />
              <div class="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ── References Section ── -->
    <div v-if="allReferences.length > 0 || curatedLoading" class="border-t border-dashed border-gray-300 dark:border-gray-700" />
    <div v-if="allReferences.length > 0 || curatedLoading" class="px-6 py-6 animate-fade-in-up" style="animation-delay: 0.15s">
      <div class="flex items-center justify-between mb-5">
        <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
          References
        </p>

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

      <template v-if="allReferences.length > 0">
        <div class="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
          <NuxtLink
            v-for="ref in allReferences.slice(0, 6)"
            :key="ref.id"
            :to="`/references/${ref.id}`"
            class="flex-shrink-0 w-36 group"
          >
            <div class="w-full h-48 overflow-hidden rounded-sm mb-2">
              <div
                v-if="ref.image_url"
                class="w-full h-full bg-cover bg-center grayscale transition-transform duration-300 group-hover:scale-105"
                :style="{ backgroundImage: `url(${ref.image_url})` }"
              />
              <div v-else class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                <NIcon name="i-ph-image" class="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
            <h4 class="font-title text-sm font-600 text-gray-900 dark:text-gray-100 leading-snug line-clamp-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
              {{ ref.name }}
            </h4>
            <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {{ formatReferenceType(ref.primary_type) }}
            </p>
          </NuxtLink>
        </div>
      </template>
      <template v-else>
        <div class="flex gap-4 overflow-x-auto pb-1">
          <div v-for="i in 3" :key="i" class="flex-shrink-0 w-36">
            <div class="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-sm animate-pulse mb-2" />
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24 mb-1" />
            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" />
          </div>
        </div>
      </template>
    </div>

    <!-- ── Recent Quotes Section ── -->
    <div v-if="quotesList.length > 0" class="border-t border-dashed border-gray-300 dark:border-gray-700" />
    <div v-if="quotesList.length > 0" class="px-6 py-5 animate-fade-in-up" style="animation-delay: 0.2s">
      <div class="flex items-center justify-between mb-8">
        <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
          Recent Quotes
        </p>

        <NuxtLink
          to="/quotes"
          class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-4
            font-sans text-xs font-600 tracking-[0.1em] text-gray-400
            dark:text-gray-400
            hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-300
            hover:scale-105 active:scale-99
            transition-[colors,transform]">
          Browse All
        </NuxtLink>
      </div>

      <div class="space-y-8">
        <div
          v-for="(quote, qi) in quotesList.slice(0, 5)"
          :key="quote.id"
          class="pb-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0 animate-fade-in-up"
          :style="{ animationDelay: `${0.25 + qi * 0.05}s` }"
        >
          <NuxtLink
            :to="`/quotes/${quote.id}`"
            class="block group"
          >
            <blockquote class="font-body text-lg font-600 text-gray-700 dark:text-gray-300 italic leading-relaxed group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
              {{ quote.name }}
            </blockquote>
            <p class="mt-1.5 font-sans text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors flex items-center gap-1.5 flex-wrap">
              <span>{{ quote.author?.name || 'Unknown' }}</span>
              <template v-if="quote.tags && quote.tags.length > 0">
                <span v-for="tag in quote.tags.slice(0, 3)" :key="tag.name" class="w-2 h-2 rounded-full inline-block" :style="{ backgroundColor: tag.color || '#6366f1' }" />
              </template>
              <span v-if="quote.reference" class="text-gray-300 dark:text-gray-600">·</span>
              <span v-if="quote.reference" class="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">{{ quote.reference.name }}</span>
            </p>
          </NuxtLink>
        </div>
      </div>

      <div v-if="hasMore" class="mt-6 flex justify-center">
        <LoadMoreButton
          :isLoading="loadingMore"
          idleText="Load More"
          loadingText="Loading..."
          @load="handleLoadMore"
        />
      </div>
    </div>

    <!-- ── Spotlight Section ── -->
    <div v-if="spotlightReference" class="border-t border-dashed border-gray-300 dark:border-gray-700" />
    <div v-if="spotlightReference" class="px-6 py-6 animate-fade-in-up" style="animation-delay: 0.5s">
      <div class="flex items-center gap-3 mb-4">
        <span class="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <p class="font-sans text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 flex-shrink-0">
          Spotlight
        </p>
        <span class="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>
      <NuxtLink :to="`/references/${spotlightReference.id}`" class="block group">
        <div class="mb-3 overflow-hidden rounded-sm">
          <div
            v-if="spotlightReference.image_url"
            class="w-full bg-cover bg-center grayscale"
            :style="{ backgroundImage: `url(${spotlightReference.image_url})`, aspectRatio: '3 / 2' }"
          />
          <div v-else class="w-full h-40 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800" />
        </div>
        <h3 class="font-serif text-xl font-600 text-gray-900 dark:text-gray-100 leading-snug group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
          {{ spotlightReference.name }}
        </h3>
      </NuxtLink>
      <span class="font-body text-sm font-600 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-2">
        {{ formatReferenceType(spotlightReference.primary_type) }}
      </span>
    </div>

    <!-- ── Version ── -->
    <div class="px-6 py-4 text-center border-y b-dashed border-gray-200 dark:border-gray-700 animate-fade-in-up" style="animation-delay: 0.55s">
      <NuxtLink to="/about" class="font-sans text-sm font-600 text-gray-400 dark:text-gray-500">v{{ config.public.appVersion }}</NuxtLink>
    </div>

    <!-- ── Empty state when no quotes ── -->
    <div v-if="allAuthors.length === 0 && allReferences.length === 0 && quotesList.length === 0 && !curatedLoading" class="px-6 py-16 text-center">
      <p class="font-serif text-xl text-gray-500 dark:text-gray-400">No content yet</p>
      <p class="font-sans text-sm text-gray-400 dark:text-gray-500 mt-2">Be the first to contribute</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProcessedQuoteResult } from '~~/server/types'

const config = useRuntimeConfig()

interface Props {
  feed: {
    quotes: Ref<ProcessedQuoteResult[]>
    authors?: Ref<Author[]>
    references?: Ref<QuoteReference[]>
    hasMore?: Ref<boolean>
    loadingMore?: Ref<boolean>
    loadMore: () => Promise<void>
    curatedLoading?: Ref<boolean>
  }
  theme?: {
    slug: string
    name: string
    description: string | null
    image_url: string | null
    config: Record<string, any> | null
  } | null
  stats?: {
    quotes: number
    authors: number
    references: number
  }
}

const props = withDefaults(defineProps<Props>(), {
  theme: null,
  stats: undefined
})

const emit = defineEmits<{
  newQuote: []
}>()

const featuredQuote = computed(() => {
  const qs = props.feed.quotes.value || []
  return qs[0] || null
})

const quoteAuthor = computed(() => {
  return featuredQuote.value?.author || null
})

const allAuthors = computed(() => props.feed.authors?.value || [])
const allReferences = computed(() => props.feed.references?.value || [])
const quotesList = computed(() => props.feed.quotes.value || [])
const curatedLoading = computed(() => props.feed.curatedLoading?.value || false)
const spotlightReference = computed(() => {
  const refs = props.feed.references?.value || []
  return refs[0] || null
})
const hasMore = computed(() => props.feed.hasMore?.value || false)
const loadingMore = computed(() => props.feed.loadingMore?.value || false)

const handleLoadMore = () => {
  props.feed.loadMore()
}

const handleClickAuthor = (authorId?: number) => {
  if (authorId) {
    navigateTo(`/authors/${authorId}`)
  }
}

const getAuthorInitials = (name?: string): string => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase()
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase()
}

const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

const formatReferenceType = (type?: string): string => {
  if (!type) return ''
  const map: Record<string, string> = {
    film: 'Film',
    book: 'Book',
    tv_series: 'TV Series',
    music: 'Music',
    speech: 'Speech',
    podcast: 'Podcast',
    interview: 'Interview',
    documentary: 'Documentary',
    media_stream: 'Media Stream',
    writings: 'Writings',
    video_game: 'Video Game',
    other: 'Other'
  }
  return map[type] || type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}
</script>

<style scoped>
.mobile-home-feed {
  padding-bottom: 1rem;
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

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.grayscale {
  filter: grayscale(100%);
  transition: filter 0.3s ease, transform 0.3s ease;
}

.group:hover .grayscale {
  filter: grayscale(0%);
  transform: scale(1.05);
}
</style>
