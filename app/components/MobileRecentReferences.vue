<template>
  <div class="px-6 py-6">
    <div class="border-t border-dashed border-gray-300 dark:border-gray-700 pt-6">
      <!-- Section Header -->
      <div class="flex items-center justify-between mb-5">
        <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
          References
        </p>
        <button
          class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          @click="showMoreReferences"
        >
          See All
        </button>
      </div>

      <!-- References list -->
      <div class="space-y-4">
        <div
          v-for="reference in recentReferences"
          :key="reference.id"
          class="flex gap-3 cursor-pointer group"
          @click="navigateToReference(reference.id)"
        >
          <div class="flex-shrink-0 w-14 h-20 overflow-hidden rounded-sm">
            <div
              v-if="reference.image_url"
              class="w-full h-full bg-cover bg-center grayscale transition-transform duration-300 group-hover:scale-105"
              :style="{ backgroundImage: `url(${reference.image_url})` }"
            />
            <div v-else class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
              <NIcon name="i-ph-image" class="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="font-title text-sm font-600 text-gray-900 dark:text-gray-100 leading-snug group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors line-clamp-2">
              {{ reference.name }}
            </h4>
            <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {{ formatReferenceType(reference.primary_type) }}
            </p>
            <p v-if="reference.description" class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
              {{ reference.description }}
            </p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="flex gap-3 animate-pulse">
          <div class="w-14 h-20 rounded-sm bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
          <div class="flex-1">
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!recentReferences.length" class="text-center py-8">
        <p class="font-sans text-sm text-gray-500 dark:text-gray-400">
          No references yet
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Option { label: string; value: string; [key: string]: unknown }

const recentReferences = ref<QuoteReference[]>([])
const loading = ref(true)

const emit = defineEmits<{
  showMore: []
}>()

const navigateToReference = (referenceId: number) => {
  navigateTo(`/references/${referenceId}`)
}

const showMoreReferences = () => {
  emit('showMore')
}

const formatReferenceType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'film': 'Film',
    'book': 'Book',
    'tv_series': 'TV Series',
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

const fetchRecentReferences = async () => {
  try {
    loading.value = true
    const response = await $fetch<ApiResponse<QuoteReference[]>>('/api/references', {
      query: {
        limit: 4,
        sort_by: 'created_at',
        sort_order: 'DESC'
      }
    })

    if (response?.success) {
      recentReferences.value = response.data || []
    }
  } catch (error) {
    console.error('Failed to fetch recent references:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRecentReferences()
})
</script>

<style scoped>
.grayscale {
  filter: grayscale(100%);
  transition: filter 0.3s ease, transform 0.3s ease;
}

.group:hover .grayscale {
  filter: grayscale(0%);
}
</style>
