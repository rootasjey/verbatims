<template>
  <div class="px-6 py-6">
    <!-- Section Header -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-body font-200 text-gray-900 dark:text-white">
        recent authors
      </h2>
      <UButton
        icon
        btn="ghost-gray"
        label="i-ph-dots-three-bold"
        size="sm"
        @click="showMoreAuthors"
      />
    </div>

    <!-- Authors Grid -->
    <div class="flex space-x-3 overflow-x-auto py-2 scrollbar-hide">
      <div
        v-for="author in recentAuthors"
        :key="author.id"
        class="flex-shrink-0 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
        @click="navigateToAuthor(author.id)"
      >
        <div class="relative">
          <div 
            class="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all duration-300"
            :class="getAuthorColor(author.id)"
          >
            <img 
              v-if="author.image_url" 
              :src="author.image_url" 
              :alt="author.name"
              class="w-full h-full rounded-full object-cover"
            />
            <span v-else>
              {{ getAuthorInitials(author.name || 'Unknown') }}
            </span>
          </div>
          
          <!-- Activity Indicator -->
          <div 
            v-if="author.quotes_count && author.quotes_count > 0"
            class="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
          >
            {{ Math.min(author.quotes_count, 9) }}{{ (author.quotes_count > 9) ? '+' : '' }}
          </div>
        </div>
        
        <!-- Author Name -->
        <p class="text-xs font-medium text-gray-700 dark:text-gray-300 text-center mt-2 max-w-16 truncate">
          {{ (author.name || 'Unknown').split(' ')[0] }}
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex space-x-3 overflow-x-auto pb-2">
      <div
        v-for="i in 6"
        :key="i"
        class="flex-shrink-0"
      >
        <div class="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
        <div class="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded mt-2 mx-auto animate-pulse"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!recentAuthors.length" class="text-center py-8">
      <UIcon name="i-ph-users" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      <p class="text-sm text-gray-500 dark:text-gray-400">
        No recent authors yet
      </p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Submit quotes to see authors here
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Author } from '~/types';

const recentAuthors = ref<Author[]>([])
const loading = ref(true)

const emit = defineEmits<{
  showMore: []
}>()

// Color palette for author avatars (mood-like colors)
const authorColors = [
  'bg-gradient-to-br from-yellow-400 to-orange-500', // Happy
  'bg-gradient-to-br from-green-400 to-blue-500',   // Calm
  'bg-gradient-to-br from-pink-400 to-red-500',     // Excited
  'bg-gradient-to-br from-blue-400 to-purple-500',  // Thoughtful
  'bg-gradient-to-br from-purple-400 to-pink-500',  // Creative
  'bg-gradient-to-br from-indigo-400 to-blue-500',  // Wise
]

const getAuthorInitials = (name: string): string => {
  if (!name) return 'UN'
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Get consistent color for author based on ID
const getAuthorColor = (authorId: number): string => {
  return authorColors[authorId % authorColors.length]
}

const navigateToAuthor = (authorId: number) => {
  navigateTo(`/authors/${authorId}`)
}

const showMoreAuthors = () => {
  emit('showMore')
}

const fetchRecentAuthors = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/authors', {
      query: {
        limit: 8,
        sort_by: 'updated_at',
        sort_order: 'DESC'
      }
    })
    
    if (response.success) {
      recentAuthors.value = response.data || []
    }
  } catch (error) {
    console.error('Failed to fetch recent authors:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRecentAuthors()
})
</script>

<style scoped>
/* Hide scrollbar but keep functionality */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
