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
          <div
            v-for="(ref, index) in references"
            :key="ref.id"
            class="shrink-0 w-[90px] cursor-pointer"
            @click="navigateTo(`/references/${ref.id}`)"
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
          </div>
        </div>
      </div>
    </template>

    <!-- Full variant (standalone section) -->
    <template v-else>
      <div class="mt-8 px-8 pb-16">
        <div class="max-w-6xl mx-auto mb-6">
          <div class="flex items-center justify-between">
            <h2 class="font-title text-2xl md:text-3xl font-400">
              {{ $t('components.related.references') }}
            </h2>
            <div class="flex items-center gap-2">
              <NButton
                icon
                btn="outline-gray"
                size="xs"
                class="rounded-full min-w-0 min-h-0 h-8 w-8!"
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
                class="rounded-full min-w-0 min-h-0 h-8 w-8!"
                :disabled="!canScrollRight"
                :aria-label="$t('common.next') as string"
                @click="scrollRight"
              >
                <NIcon name="i-ph-arrow-right" class="w-4 h-4" />
              </NButton>
            </div>
          </div>
        </div>

        <div class="relative max-w-6xl mx-auto">
          <div
            ref="scrollContainer"
            class="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide pb-18"
            @scroll="onScroll"
          >
            <div
              v-for="(ref, index) in references"
              :key="ref.id"
              class="snap-start shrink-0 w-[180px] md:w-[200px] cursor-pointer similar-item"
              :class="{ 'in': true }"
              :style="{ transitionDelay: `${index * 60}ms` }"
              @click="navigateTo(`/references/${ref.id}`)"
            >
              <div class="group flex flex-col rounded-1 overflow-hidden h-full
                bg-white dark:bg-[#101010]
                border border-gray-200 dark:border-gray-700
                hover:border-primary-400 dark:hover:border-primary-500
                hover:shadow-lg
                active:scale-[0.98] active:shadow-none
                transition-all duration-300">
                <div v-if="ref.image_url" class="w-full aspect-[3/4] overflow-hidden">
                  <img
                    :src="ref.image_url"
                    :alt="ref.name"
                    class="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 grayscale group-hover:grayscale-0"
                  />
                </div>
                <div class="flex-1 p-4 text-center flex flex-col items-center justify-center">
                  <p class="font-medium text-sm line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {{ ref.name }}
                  </p>
                  <p v-if="ref.primary_type" class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
                    {{ formatReferenceType(ref.primary_type) }}
                  </p>
                  <div class="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
                    <NIcon name="i-ph-quotes" class="w-3 h-3" />
                    {{ formatNumber(ref.quotes_count) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { navigateTo } from 'nuxt/app'
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
const canScrollRight = ref(true)

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
