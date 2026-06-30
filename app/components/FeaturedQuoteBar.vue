<template>
  <div
    class="relative px-8 pt-8 pb-10 transition-all duration-300"
    :class="{ 'pb-6': isCompressed }"
  >
    <!-- Masthead -->
    <div class="mb-10">
      <span class="font-title text-xs uppercase tracking-[0.25em] text-gray-400 dark:text-gray-600">
        Verbatims
      </span>
    </div>

    <!-- Quote content — clickable -->
    <div
      v-if="currentQuote"
      class="max-w-3xl mx-auto text-center cursor-pointer group"
      @click="navigateTo(`/quotes/${currentQuote.id}`)"
    >
      <!-- Opening quote mark -->
      <span class="font-serif text-5xl text-secondary-500/40 leading-none select-none" aria-hidden="true">"</span>

      <blockquote
        :key="currentQuote.id"
        class="font-serif text-2xl sm:text-3xl lg:text-4xl text-gray-900 dark:text-gray-100 leading-snug tracking-tight -mt-2 quote-fade"
      >
        {{ currentQuote.name }}
      </blockquote>

      <!-- Attribution -->
      <div class="mt-6 flex items-center justify-center gap-3">
        <div class="w-8 h-px bg-secondary-500/50 transition-all duration-300 group-hover:w-12" />
        <div class="text-center">
          <p
            v-if="currentQuote.author"
            class="font-sans text-sm font-500 text-gray-700 dark:text-gray-300 transition-colors group-hover:text-secondary-600 dark:group-hover:text-secondary-400"
          >
            {{ currentQuote.author.name }}
          </p>
          <p
            v-else
            class="font-sans text-sm font-500 text-gray-500 dark:text-gray-400"
          >
            Unknown Author
          </p>
          <p
            v-if="currentQuote.reference"
            class="font-sans text-xs text-gray-400 dark:text-gray-500 mt-0.5"
          >
            {{ currentQuote.reference.name }}
          </p>
        </div>
        <div class="w-8 h-px bg-secondary-500/50 transition-all duration-300 group-hover:w-12" />
      </div>

      <!-- Subtle hint -->
      <p class="mt-4 text-xs text-gray-400 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 select-none">
        Read more
      </p>
    </div>

    <!-- Loading state -->
    <div v-else-if="loading" class="max-w-3xl mx-auto text-center py-8">
      <div class="animate-pulse space-y-4">
        <div class="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mx-auto" />
        <div class="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mx-auto" />
        <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mx-auto mt-6" />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="max-w-3xl mx-auto text-center py-4">
      <p class="font-serif text-2xl text-gray-500 dark:text-gray-400">
        No quotes yet. Be the first to share one.
      </p>
    </div>

    <!-- Bottom divider -->
    <div class="mt-10 h-px bg-gray-200/80 dark:bg-gray-800" />
  </div>
</template>

<script lang="ts" setup>
import type { ProcessedQuoteResult } from '~~/server/types'
import { navigateTo } from 'nuxt/app'

const ROTATION_INTERVAL = 30_000

const { data: featuredData, pending: loading } = await useFetch<ApiResponse<ProcessedQuoteResult>>('/api/quotes/featured')
const { data: randomData } = await useFetch<ApiResponse<ProcessedQuoteResult[]>>('/api/quotes/random?count=10')

const pool = computed<ProcessedQuoteResult[]>(() => {
  const quotes: ProcessedQuoteResult[] = []
  if (featuredData.value?.data) quotes.push(featuredData.value.data)
  if (randomData.value?.data) {
    for (const q of randomData.value.data) {
      if (!quotes.some(existing => existing.id === q.id)) quotes.push(q)
    }
  }
  return quotes
})

const currentIndex = ref(0)
const currentQuote = computed<ProcessedQuoteResult | null>(() => pool.value[currentIndex.value] ?? null)

let rotationTimer: ReturnType<typeof setInterval> | null = null

const advance = () => {
  if (pool.value.length <= 1) return
  currentIndex.value = (currentIndex.value + 1) % pool.value.length
}

onMounted(() => {
  rotationTimer = setInterval(advance, ROTATION_INTERVAL)
})

onUnmounted(() => {
  if (rotationTimer) clearInterval(rotationTimer)
})

// Scroll compression
const scrollY = ref(0)
const isCompressed = computed(() => scrollY.value > 40)

const onScroll = () => {
  scrollY.value = window.scrollY
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
.quote-fade {
  animation: quoteFadeIn 600ms ease-out both;
}

@keyframes quoteFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .quote-fade {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
