<template>
  <div class="px-6 py-6">
    <!-- Section Header -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-body font-200 text-gray-900 dark:text-white">
        recent references
      </h2>
      <UButton
        icon
        btn="ghost-gray"
        label="i-ph-dots-three-bold"
        size="sm"
        @click="showMoreReferences"
      />
    </div>

    <!-- References Grid -->
    <div class="grid grid-cols-2 gap-3">
      <div
        v-for="reference in recentReferences"
        :key="reference.id"
        class="relative cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
        @click="navigateToReference(reference.id)"
      >
        <div 
          class="relative w-full h-32 rounded-2xl overflow-hidden shadow-lg"
          :style="getCardBackground(reference)"
        >
          <!-- Overlay for better text readability -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          
          <!-- Content -->
          <div class="absolute inset-0 p-4 flex flex-col justify-between">
            <!-- Reference Title -->
            <h3 class="text-white font-bold text-sm leading-tight line-clamp-2">
              {{ reference.name }}
            </h3>
            
            <!-- Bottom Section -->
            <div class="flex items-center justify-between">
              <!-- Duration/Type Info -->
              <div class="flex items-center space-x-2">
                <span class="text-white/90 text-xs">
                  {{ getTypeDisplay(reference) }}
                </span>
                <div class="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <UIcon 
                    :name="getTypeIcon(reference.primary_type)" 
                    class="w-4 h-4 text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-2 gap-3">
      <div
        v-for="i in 6"
        :key="i"
        class="w-full h-32 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse"
      ></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!recentReferences.length" class="text-center py-8">
      <UIcon name="i-ph-books" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      <p class="text-sm text-gray-500 dark:text-gray-400">
        No recent references yet
      </p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Submit quotes to see references here
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QuoteReference } from '~/types';

const recentReferences = ref<QuoteReference[]>([])
const loading = ref(true)

const emit = defineEmits<{
  showMore: []
}>()

// Color palette for reference cards (mood-like gradients)
const referenceGradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple-Blue
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Pink-Red
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Blue-Cyan
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Green-Teal
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Pink-Yellow
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', // Teal-Pink
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', // Peach
  'linear-gradient(135deg, #ff8a80 0%, #ea80fc 100%)', // Red-Purple
]

// Get card background (poster or gradient)
const getCardBackground = (reference: QuoteReference) => {
  if (reference.image_url) {
    return {
      backgroundImage: `url(${reference.image_url})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
  
  // Use gradient based on reference ID
  const gradientIndex = reference.id % referenceGradients.length
  return {
    background: referenceGradients[gradientIndex]
  }
}

const getTypeIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    book: 'i-ph-book',
    film: 'i-ph-film-strip',
    tv_series: 'i-ph-television',
    music: 'i-ph-music-note',
    speech: 'i-ph-microphone',
    podcast: 'i-ph-microphone-stage',
    interview: 'i-ph-chat-circle',
    documentary: 'i-ph-video-camera',
    media_stream: 'i-ph-play-circle',
    writings: 'i-ph-article',
    video_game: 'i-ph-game-controller',
    other: 'i-ph-file'
  }
  return iconMap[type] || 'i-ph-file'
}

const getTypeDisplay = (reference: QuoteReference) => {
  if (reference.secondary_type) {
    return reference.secondary_type
  }
  
  const typeMap: Record<string, string> = {
    book: 'Book',
    film: 'Film',
    tv_series: 'TV Series',
    music: 'Music',
    speech: 'Speech',
    podcast: 'Podcast',
    interview: 'Interview',
    documentary: 'Documentary',
    media_stream: 'Stream',
    writings: 'Writing',
    video_game: 'Game',
    other: 'Other'
  }
  return typeMap[reference.primary_type] || 'Reference'
}

const navigateToReference = (referenceId: number) => {
  navigateTo(`/references/${referenceId}`)
}

const showMoreReferences = () => {
  emit('showMore')
}

const fetchRecentReferences = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/references', {
      query: {
        limit: 4,
        sort_by: 'created_at',
        sort_order: 'DESC'
      }
    })
    
    if (response.success) {
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
