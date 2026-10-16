<template>
  <div v-if="authors.length > 0">
    <!-- Compact variant (sidebar) -->
    <template v-if="compact">
      <div class="px-6 py-6 border-t b-dashed border-gray-200 dark:border-gray-700">
        <p class="font-sans text-[10px] font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 mb-4">
          {{ $t('components.related.authors') }}
        </p>
        <div class="space-y-3">
          <div
            v-for="author in authors.slice(0, 5)"
            :key="author.id"
            class="group flex items-center gap-2 cursor-pointer"
            @click="navigateTo(`/authors/${author.id}`)"
          >
            <div class="w-7 h-7 rounded-full overflow-hidden ring-1 ring-gray-300 dark:ring-gray-600 grayscale group-hover:grayscale-0 transition-all duration-300 shrink-0">
              <img
                v-if="author.image_url"
                :src="author.image_url"
                :alt="author.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span class="font-serif text-[8px] text-gray-500">{{ getAuthorInitials(author.name) }}</span>
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-sans text-[10px] text-gray-600 dark:text-gray-400 leading-tight truncate group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                {{ author.name }}
              </p>
              <p v-if="author.job" class="font-sans text-[9px] text-gray-400 dark:text-gray-500 truncate">
                {{ author.job }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Full variant (standalone section) -->
    <template v-else>
      <section class="homepage-v3-authors mx-4 mb-14 rounded-2 px-4 py-6 md:py-12 md:mx-6 md:px-8 lg:mx-16 lg:px-16 lg:py-16">
        <div class="mx-auto mb-8 max-w-7xl">
          <div class="flex items-end justify-between gap-4">
            <div>
              <h2 class="font-serif text-4xl font-400 leading-none tracking-[-0.035em] text-stone-200 lg:text-5xl">
                {{ $t('components.related.authors') }}
              </h2>
              <p class="max-w-md font-sans text-sm font-500 italic leading-relaxed text-white/60">
                {{ $t('author_detail_similar_authors_description') }}
              </p>
            </div>
            <div v-if="canScrollLeft || canScrollRight" class="flex shrink-0 items-center gap-2">
              <button type="button" class="homepage-v3-carousel-control similar-authors-carousel-control active:scale-96" :disabled="!canScrollLeft" :aria-label="String($t('common.previous'))" @click="scrollAuthors(-1)">
                <NIcon name="i-ph-arrow-left" class="h-4 w-4" />
              </button>
              <button type="button" class="homepage-v3-carousel-control similar-authors-carousel-control active:scale-96" :disabled="!canScrollRight" :aria-label="String($t('common.next'))" @click="scrollAuthors(1)">
                <NIcon name="i-ph-arrow-right" class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div class="relative mx-auto max-w-7xl">
          <div
            ref="scrollContainer"
            class="homepage-v3-author-grid flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3"
            @scroll="updateScrollState"
          >
            <NuxtLink
              v-for="(author, index) in authors"
              :key="author.id"
              :to="`/authors/${author.id}`"
              class="homepage-v3-author-card similar-item w-[min(78vw,280px)] shrink-0 snap-start group flex flex-col items-start gap-4 lg:w-[calc((100%-3rem)/4)]"
              :class="{ 'in': authors.length > 0 }"
              :style="{ transitionDelay: `${index * 60}ms` }"
            >
              <div v-if="author.image_url" class="h-12 w-12 shrink-0 overflow-hidden rounded-full grayscale transition group-hover:grayscale-0">
                <img :src="author.image_url" :alt="author.name" class="h-full w-full object-cover">
              </div>
              <div v-else role="img" :aria-label="author.name" class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700">
                <span aria-hidden="true" class="font-subtitle text-xs text-gray-400 dark:text-gray-500">{{ getAuthorInitials(author.name) }}</span>
              </div>
              <div class="min-w-0">
                <p class="font-subtitle font-600 leading-tight text-white transition-colors group-hover:text-white/70 break-words wrap-anywhere">
                  {{ author.name }}
                </p>
                <p v-if="author.job" class="mt-1 truncate font-sans text-sm text-white/65">
                  {{ author.job }}
                </p>
                <p v-if="author.quotes_count != null" class="font-sans text-xs font-600 text-white/55">
                  {{ formatNumber(author.quotes_count) }} {{ author.quotes_count === 1 ? $t('author_detail_quote') : $t('author_detail_quotes_count') }}
                </p>
              </div>
            </NuxtLink>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
const { $t } = useI18n()

interface SimilarAuthor {
  id: number
  name: string
  image_url?: string | null
  job?: string | null
  quotes_count?: number | null
}

interface Props {
  authors: SimilarAuthor[]
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  compact: false
})

const scrollContainer = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const updateScrollState = () => {
  const el = scrollContainer.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 4
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}

const scrollAuthors = (direction: -1 | 1) => {
  const el = scrollContainer.value
  if (!el) return
  const cardWidth = el.querySelector('.snap-start')?.clientWidth ?? 240
  el.scrollBy({ left: direction * (cardWidth + 16), behavior: 'smooth' })
}

const getAuthorInitials = (name: string): string => {
  if (!name) return '??'
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const formatNumber = (num?: number | null): string => {
  if (!num) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

onMounted(updateScrollState)
</script>

<style scoped>
.similar-item {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 420ms cubic-bezier(.22,.61,.36,1), transform 420ms cubic-bezier(.22,.61,.36,1);
}
.similar-item.in {
  opacity: 1;
  transform: translateY(0);
}
.similar-authors-carousel-control {
  border-radius: 0.625rem;
  transition: background 180ms ease, color 180ms ease, transform 150ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .similar-authors-carousel-control:active {
    transform: none;
  }
}
</style>
