<template>
  <div v-if="references.length > 0" class="px-8 pb-16">
    <div class="max-w-6xl mx-auto">
      <div class="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent mb-14"></div>
    </div>

    <h2 class="font-title text-2xl md:text-3xl font-600 text-center mb-10">
      Similar References
    </h2>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
      <div
        v-for="(ref, index) in references"
        :key="ref.id"
        class="group cursor-pointer similar-item"
        :class="{ 'in': references.length > 0 }"
        :style="{ transitionDelay: `${index * 60}ms` }"
        @click="navigateTo(`/references/${ref.id}`)"
      >
        <div class="flex flex-col rounded-xl overflow-hidden
          bg-white dark:bg-[#101010]
          border border-gray-200 dark:border-gray-700
          hover:border-primary-400 dark:hover:border-primary-500
          hover:shadow-lg hover:shadow-primary-500/5
          active:scale-99
          transition-all duration-300">
          <div v-if="ref.image_url" class="w-full aspect-[3/4] overflow-hidden">
            <img
              :src="ref.image_url"
              :alt="ref.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div class="flex-1 p-4 text-center">
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
</template>

<script setup lang="ts">
interface SimilarReference {
  id: number
  name: string
  image_url?: string | null
  primary_type?: string | null
  quotes_count?: number | null
}

interface Props {
  references: SimilarReference[]
}

defineProps<Props>()

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
