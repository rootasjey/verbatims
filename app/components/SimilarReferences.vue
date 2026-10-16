<template>
  <div v-if="references.length > 0">
    <!-- Compact variant (sidebar) -->
    <template v-if="compact">
      <div class="px-6 py-6 border-t b-dashed border-gray-200 dark:border-gray-700">
        <p class="font-sans text-[10px] font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 mb-4">
          {{ $t('components.related.references') }}
        </p>
        <div
          ref="scrollContainer"
          class="flex gap-3 overflow-x-auto scroll-smooth scrollbar-hide"
          @scroll="onScroll"
        >
          <NuxtLink
            v-for="(ref, index) in references"
            :key="ref.id"
            :to="`/references/${ref.id}`"
            class="block shrink-0 w-[90px] cursor-pointer"
          >
            <div class="group">
              <div v-if="ref.image_url" class="w-full aspect-[3/4] overflow-hidden rounded-sm bg-gray-100 dark:bg-[#0C0A09] mb-1.5">
                <img
                  :src="ref.image_url"
                  :alt="ref.name"
                  class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                />
              </div>
              <div v-else class="w-full aspect-[3/4] rounded-sm bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 mb-1.5" />
              <p class="font-sans text-[10px] text-gray-500 dark:text-gray-400 leading-tight line-clamp-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                {{ ref.name }}
              </p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </template>

    <!-- Full variant (standalone section) -->
    <template v-else>
      <section class="homepage-v3-references mx-4 mb-14 rounded-2 px-4 py-6 md:py-12 md:mx-6 md:px-8 lg:mx-10 lg:px-16 lg:py-16">
        <div class="mx-auto mb-8 max-w-7xl">
          <div class="flex items-end justify-between gap-4">
            <div>
              <h2 class="font-serif text-4xl font-400 leading-none tracking-[-0.035em] text-stone-700 dark:text-stone-300 lg:text-5xl">
              {{ $t('components.related.references') }}
              </h2>
              <p class="max-w-md font-sans text-sm font-500 italic leading-relaxed text-gray-500 dark:text-gray-400">
                {{ $t('components.related.references_description') }}
              </p>
            </div>
            <div v-if="canScrollLeft || canScrollRight" class="flex items-center gap-2 lg:hidden">
              <NButton
                icon
                btn="outline-gray"
                size="xs"
                class="rounded-full min-w-0 min-h-0 h-8 w-8! disabled:opacity-35"
                :disabled="!canScrollLeft"
                :aria-label="$t('common.previous') as string"
                @click="scrollLeft"
              >
                <NIcon name="i-ph-arrow-left" class="w-4 h-4" />
              </NButton>
              <NButton
                icon
                btn="outline-gray"
                size="xs"
                class="rounded-full min-w-0 min-h-0 h-8 w-8! disabled:opacity-35"
                :disabled="!canScrollRight"
                :aria-label="$t('common.next') as string"
                @click="scrollRight"
              >
                <NIcon name="i-ph-arrow-right" class="w-4 h-4" />
              </NButton>
            </div>
          </div>
        </div>

        <div class="relative mx-auto max-w-7xl">
          <div
            ref="scrollContainer"
            class="homepage-v3-reference-grid flex flex-nowrap gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible"
            @scroll="onScroll"
          >
            <NuxtLink
              v-for="(ref, index) in references"
              :key="ref.id"
              :to="`/references/${ref.id}`"
              class="homepage-v3-reference-card block h-[320px] snap-start shrink-0 w-[240px] cursor-pointer p-0 similar-item md:w-[280px] lg:h-[440px] lg:w-auto"
              :class="{ 'in': true }"
              :style="{ transitionDelay: `${index * 60}ms` }"
            >
              <div class="group relative flex h-full flex-col justify-end overflow-hidden rounded-xl border-0 bg-[#4a4d4c] text-white">
                <div v-if="ref.image_url" class="homepage-v3-reference-image absolute inset-0 bg-cover bg-center grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0" :style="{ backgroundImage: `url(${ref.image_url})` }" />
                <div
                  v-else
                  class="homepage-v3-reference-image absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#34312f] to-[#1b1b1b] text-white/55"
                  role="img"
                  :aria-label="`${$t('components.related.poster_unavailable')}: ${ref.name}`"
                >
                  <NIcon name="i-lucide-image-off" class="h-8 w-8" aria-hidden="true" />
                  <span class="px-4 text-center font-sans text-[10px] font-600 uppercase tracking-[0.14em]">
                    {{ $t('components.related.poster_unavailable') }}
                  </span>
                </div>
                <div class="homepage-v3-reference-overlay absolute inset-0" />
                <div class="relative mt-auto p-5">
                  <p class="font-subtitle text-xl font-600 leading-tight break-words wrap-anywhere lg:text-2xl xl:text-3xl">{{ ref.name }}</p>
                  <p v-if="ref.primary_type" class="font-sans text-xs font-600 text-white/70 lg:text-sm">
                    {{ formatReferenceType(ref.primary_type) }}
                  </p>
                </div>
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

interface SimilarReference {
  id: number
  name: string
  image_url?: string | null
  primary_type?: string | null
  quotes_count?: number | null
}

interface Props {
  references: SimilarReference[]
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

const onScroll = () => {
  updateScrollState()
}

const scrollLeft = () => {
  const el = scrollContainer.value
  if (!el) return
  const cardWidth = el.querySelector('.snap-start')?.clientWidth ?? 200
  el.scrollBy({ left: -(cardWidth + 20), behavior: 'smooth' })
}

const scrollRight = () => {
  const el = scrollContainer.value
  if (!el) return
  const cardWidth = el.querySelector('.snap-start')?.clientWidth ?? 200
  el.scrollBy({ left: cardWidth + 20, behavior: 'smooth' })
}

onMounted(() => {
  updateScrollState()
})

const formatReferenceType = (type: string): string => {
  if (!type) return ''
  const typeMap: Record<string, string> = {
    'film': 'Film',
    'book': 'Book',
    'tv_series': 'TV Series',
    'tv_show': 'TV Show',
    'music': 'Music',
    'speech': 'Speech',
    'podcast': 'Podcast',
    'interview': 'Interview',
    'documentary': 'Documentary',
    'media_stream': 'Media Stream',
    'writings': 'Writings',
    'video_game': 'Video Game',
    'other': 'Other'
  }
  return typeMap[type] || type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

const formatNumber = (num?: number | null): string => {
  if (!num) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}
</script>

<style scoped>
.similar-item.homepage-v3-reference-card {
  padding: 0;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.similar-item {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 420ms cubic-bezier(.22,.61,.36,1), transform 420ms cubic-bezier(.22,.61,.36,1);
}
.similar-item.in {
  opacity: 1;
  transform: translateY(0);
}
</style>
