<template>
  <div class="mobile-home-feed bg-[#F7F5EF] dark:bg-[#0C0A09]">
    <!-- ── Featured Quote ── -->
    <div class="homepage-v3-cover mx-4 mt-2 mb-4 rounded-2xl px-6 py-16 animate-fade-in-up shadow-sm" style="animation-delay: 0s">
      <div v-if="featuredQuote" class="homepage-v3-author-wrap mb-2">
        <div class="homepage-v3-author">
          <div @click="handleClickAuthor(quoteAuthor?.id)" class="homepage-v3-author-line flex flex-col items-center gap-1 cursor-pointer group">
            <div v-if="quoteAuthor?.image_url" class="homepage-v3-author-avatar w-7 h-7 rounded-full overflow-hidden flex-shrink-0 ring-2 p-.5" :style="{ '--un-ring-color': `var(--theme-primary, #6b7280)` }">
              <img :src="quoteAuthor.image_url" :alt="quoteAuthor.name" class="w-full h-full grayscale object-cover rounded-full" />
            </div>
            <div v-else class="homepage-v3-author-avatar w-6 h-6 rounded-full ring-2 flex items-center justify-center flex-shrink-0" :style="{ '--un-ring-color': `var(--theme-primary, #6b7280)` }">
              <span class="font-serif text-xs text-gray-400 dark:text-gray-500">{{ getAuthorInitials(quoteAuthor?.name) }}</span>
            </div>
            <p class="font-subtitle text-lg font-600 text-gray-900 dark:text-gray-100 truncate group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
              {{ quoteAuthor?.name || $t('home.unknown_author') }}
            </p>
          </div>
          <NuxtLink
            v-if="featuredQuote?.reference"
            :to="`/references/${featuredQuote.reference.id}`"
            class="homepage-v3-author-reference mt-1 block text-center font-sans text-xs font-500 text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 truncate"
          >
            {{ featuredQuote.reference?.name }}
          </NuxtLink>
        </div>
      </div>

      <NuxtLink
        v-if="featuredQuote"
        :to="`/quotes/${featuredQuote.id}`"
        class="homepage-v3-quote block group"
      >
        <blockquote :class="['font-serif font-300 text-gray-900 dark:text-gray-100 leading-tight break-words [overflow-wrap:anywhere] group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors', coverQuoteClass(featuredQuote.name)]">
          {{ featuredQuote.name }}
        </blockquote>
      </NuxtLink>
    </div>
    <div class="homepage-v3-cover-actions mb-14 flex items-center justify-center gap-3">
      <a
        href="#home-exploration"
        class="homepage-v3-primary inline-flex items-center rounded-full px-5 py-2.5 font-sans text-xs font-600 transition-colors"
      >
        {{ $t('home.explore_theme') }}
        <NIcon name="i-lucide-arrow-down" class="ml-2 h-3.5 w-3.5" aria-hidden="true" />
      </a>
      <div class="homepage-v3-actions mt-0 flex items-center gap-1">
        <NTooltip :content="String($t('home.copy_quote'))">
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-white/70 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-gray-100"
            :aria-label="String($t('home.copy_quote'))"
            @click="copyFeaturedQuote"
          >
            <NIcon name="i-lucide-copy" class="h-4 w-4" />
          </button>
        </NTooltip>
        <NTooltip :content="String($t('home.share_quote'))">
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-white/70 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-gray-100"
            :aria-label="String($t('home.share_quote'))"
            @click="shareFeaturedQuote"
          >
            <NIcon name="i-lucide-share-2" class="h-4 w-4" />
          </button>
        </NTooltip>
      </div>
    </div>

    <!-- ── Editorial Introduction ── -->
    <section v-if="quotesList.length > 1" id="home-exploration" class="homepage-v3-editorial px-6 py-14 scroll-mt-20">
      <p class="font-sans text-xs uppercase tracking-[0.2em] text-[#9B7A30]">{{ $t('home.editorial_label') }}</p>
      <h2 class="mt-5 font-serif text-2xl leading-[0.98] tracking-[-0.02em] text-gray-900 dark:text-gray-100">{{ $t('home.editorial_title') }}</h2>
      <p class="mt-5 max-w-xs font-sans text-base leading-relaxed text-gray-500 dark:text-gray-400">{{ $t('home.editorial_desc') }}</p>
      <NuxtLink :to="`/quotes/${quotesList[1]!.id}`" class="mt-12 block group">
        <blockquote class="font-serif text-4xl leading-[0.98] tracking-[-0.035em] text-gray-900 transition-colors group-hover:text-gray-500 dark:text-gray-100 dark:group-hover:text-gray-300">{{ quotesList[1]!.name }}</blockquote>
        <p class="mt-4 font-sans text-sm text-gray-500 dark:text-gray-400">{{ quotesList[1]!.author?.name || $t('home.unknown') }}</p>
      </NuxtLink>
      <div class="mt-10 space-y-8">
        <NuxtLink v-for="item in quotesList.slice(2, 4)" :key="item.id" :to="`/quotes/${item.id}`" class="block border-t border-gray-200 pt-4 dark:border-gray-800">
          <blockquote class="font-serif text-xl italic leading-[1.1] tracking-[-0.015em] text-gray-700 dark:text-gray-300">{{ item.name }}</blockquote>
          <p class="mt-2 font-sans text-xs text-gray-500 dark:text-gray-400">{{ item.author?.name || $t('home.unknown') }}</p>
        </NuxtLink>
      </div>
    </section>

    <!-- ── Rich Quote Exploration ── -->
    <section v-if="quotesList.length > 4" class="homepage-v3-rich mx-6 py-14">
      <div class="homepage-v3-rich-head space-y-4">
        <h2 class="font-serif text-3xl leading-none tracking-[-0.03em] text-gray-900 dark:text-gray-100">
          {{ $t('home.rich_quotes_title') }}
        </h2>
        <p class="max-w-xs font-sans text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {{ $t('home.rich_quotes_desc') }}
        </p>
      </div>
      <div class="homepage-v3-rich-grid mt-10 grid grid-cols-1">
        <NuxtLink v-for="item in quotesList.slice(4, 10)" :key="item.id" :to="`/quotes/${item.id}`" class="homepage-v3-rich-item group">
          <blockquote :class="['font-serif leading-[1.08] tracking-[-0.02em] text-gray-900 dark:text-gray-100', richQuoteClass(item.name)]">
            {{ item.name.length > 120 ? `${item.name.slice(0, 117)}…` : item.name }}
          </blockquote>
          <small class="mt-3 block font-sans text-xs text-gray-500 dark:text-gray-400">
            {{ item.author?.name || $t('home.unknown') }}
          </small>
        </NuxtLink>
      </div>
    </section>

    <!-- ── Authors Section ── -->
    <div v-if="allAuthors.length > 0 || curatedLoading" class="homepage-v3-authors scroll-mt-20 px-6 py-10 animate-fade-in-up" style="animation-delay: 0.1s">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: `var(--theme-secondary, #6366f1)` }" />
          <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
            {{ $t('home.nav.authors') }}
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
          {{ $t('home.see_all') }}
        </NuxtLink>
      </div>

      <template v-if="allAuthors.length > 0">
        <div class="homepage-v3-author-grid grid grid-cols-2 gap-3">
          <NuxtLink
            v-for="author in allAuthors.slice(0, 8)"
            :key="author.id"
            :to="`/authors/${author.id}`"
            class="homepage-v3-person min-w-0 group"
          >
            <div v-if="author.image_url" class="w-12 h-12 rounded-full overflow-hidden grayscale flex-shrink-0">
              <img :src="author.image_url" :alt="author.name" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
              <span class="font-subtitle text-xs text-gray-400 dark:text-gray-500">{{ getAuthorInitials(author.name) }}</span>
            </div>
            <div class="min-w-0">
              <p :class="['font-subtitle font-600 leading-tight text-white break-words [overflow-wrap:anywhere]', authorNameClass(author.name)]">
                {{ author.name }}
              </p>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {{ author.quotes_count || 0 }} {{ (author.quotes_count || 0) === 1 ? $t('home.quote_singular') : $t('home.quote_plural') }}
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
    <div v-if="allReferences.length > 0 || curatedLoading" class="homepage-v3-references px-6 py-10 animate-fade-in-up" style="animation-delay: 0.15s">
      <div class="flex items-center justify-between mb-5">
        <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
          {{ $t('home.nav.references') }}
        </p>

        <NuxtLink
          to="/references"
          class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-4
            font-sans text-xs font-600 tracking-[0.1em] text-gray-400
            dark:text-gray-400
            hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-300
            hover:scale-105 active:scale-99
            transition-[colors,transform]">
          {{ $t('home.see_all') }}
        </NuxtLink>
      </div>

      <template v-if="allReferences.length > 0">
        <div class="homepage-v3-reference-grid grid grid-cols-2 gap-3">
          <NuxtLink
            v-for="ref in allReferences.slice(0, 6)"
            :key="ref.id"
            :to="`/references/${ref.id}`"
            class="homepage-v3-reference-card min-w-0 group"
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
    <div v-if="false" class="px-6 py-5 animate-fade-in-up" style="animation-delay: 0.2s">
      <div class="flex items-center justify-between mb-8">
        <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
          {{ $t('home.recent_quotes') }}
        </p>

        <NuxtLink
          to="/quotes"
          class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-4
            font-sans text-xs font-600 tracking-[0.1em] text-gray-400
            dark:text-gray-400
            hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-300
            hover:scale-105 active:scale-99
            transition-[colors,transform]">
          {{ $t('home.browse_all') }}
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
              <span>{{ quote.author?.name || $t('home.unknown') }}</span>
              <template v-if="quote.tags && quote.tags.length > 0">
                <span v-for="tag in quote.tags.slice(0, 3)" :key="tag.name" class="w-2 h-2 rounded-full inline-block" :style="{ backgroundColor: tag.color || '#6366f1' }" />
              </template>
              <span v-if="quote.reference" class="text-gray-300 dark:text-gray-600">·</span>
              <span v-if="quote.reference" class="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">{{ quote.reference?.name }}</span>
            </p>
          </NuxtLink>
        </div>
      </div>

      <div v-if="hasMore" class="mt-6 flex justify-center">
        <LoadMoreButton
          :isLoading="loadingMore"
          :idleText="$ts('home.load_more')"
          :loadingText="$ts('home.loading')"
          @load="handleLoadMore"
        />
      </div>
    </div>

    <!-- ── Version ── -->
    <div class="px-6 py-4 text-center border-y b-dashed border-gray-200 dark:border-gray-700 animate-fade-in-up" style="animation-delay: 0.55s">
      <NuxtLink to="/about" class="font-sans text-sm font-600 text-gray-400 dark:text-gray-500">v{{ config.public.appVersion }}</NuxtLink>
    </div>

    <!-- ── Empty state when no quotes ── -->
    <div v-if="allAuthors.length === 0 && allReferences.length === 0 && quotesList.length === 0 && !curatedLoading" class="px-6 py-16 text-center">
      <p class="font-serif text-xl text-gray-500 dark:text-gray-400">{{ $t('home.no_content') }}</p>
      <p class="font-sans text-sm text-gray-400 dark:text-gray-500 mt-2">{{ $t('home.be_first_contribute') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import './home/home-v3.css'
import type { ProcessedQuoteResult } from '~~/server/types'

const { $t, $ts } = useI18n()

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

const copyFeaturedQuote = async () => {
  if (!featuredQuote.value || !import.meta.client) return
  await navigator.clipboard?.writeText(`“${featuredQuote.value.name}” — ${featuredQuote.value.author?.name || $ts('home.unknown_author')}`)
}

const shareFeaturedQuote = async () => {
  if (!featuredQuote.value || !import.meta.client) return
  const url = `${window.location.origin}/quotes/${featuredQuote.value.id}`
  const text = `“${featuredQuote.value.name}” — ${featuredQuote.value.author?.name || $ts('home.unknown_author')}`
  if (navigator.share) {
    await navigator.share({ title: featuredQuote.value.name, text, url })
    return
  }
  await navigator.clipboard?.writeText(`${text}\n\n${url}`)
}

const allAuthors = computed(() => props.feed.authors?.value || [])
const allReferences = computed(() => props.feed.references?.value || [])
const quotesList = computed(() => props.feed.quotes.value || [])

const richQuoteClass = (text: string) => {
  if (text.length <= 32) return 'text-3xl lg:text-4xl'
  if (text.length <= 72) return 'text-2xl lg:text-3xl'
  return 'text-xl lg:text-2xl'
}

const coverQuoteClass = (text: string) => {
  if (text.length <= 70) return 'text-4xl'
  if (text.length <= 130) return 'text-3xl'
  if (text.length <= 210) return 'text-2xl'
  return 'text-xl'
}

const authorNameClass = (name: string) => {
  if (name.length <= 14) return 'text-xl'
  if (name.length <= 24) return 'text-lg'
  return 'text-base'
}
const curatedLoading = computed(() => props.feed.curatedLoading?.value || false)
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
  const t = $ts('reference_types.' + type)
  return t || type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
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
