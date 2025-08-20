<template>
  <div class="px-6 py-6">
    <!-- Section Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-bold text-gray-900 dark:text-white">
        Your progress
      </h2>
      <UButton
        icon
        btn="ghost-gray"
        label="i-ph-dots-three-bold"
        size="sm"
        @click="showDetails"
      />
    </div>

    <!-- Progress Card -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <!-- Main Progress Display -->
      <div class="flex items-end justify-between mb-4">
        <!-- Large Percentage -->
        <div class="flex items-baseline">
          <span class="text-6xl font-bold text-gray-900 dark:text-white">
            {{ progressPercentage }}
          </span>
          <span class="text-2xl font-bold text-gray-900 dark:text-white ml-1">
            %
          </span>
        </div>
        
        <!-- Progress Description -->
        <div class="text-right">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Of the weekly
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            plan completed
          </p>
        </div>
      </div>

      <!-- Progress Visualization -->
      <div class="flex items-center space-x-2 mb-4">
        <!-- Progress Dots -->
        <div class="flex space-x-1">
          <div
            v-for="i in 7"
            :key="i"
            class="w-3 h-3 rounded-full transition-all duration-300"
            :class="i <= completedDays ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'"
          ></div>
        </div>
        
        <!-- Central Action Button -->
        <div class="flex-1 flex justify-center">
          <button
            @click="handleMainAction"
            class="w-16 h-16 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <UIcon name="i-ph-house-bold" class="w-6 h-6" />
          </button>
        </div>
        
        <!-- Additional Action -->
        <div class="flex space-x-1">
          <button
            @click="handleSecondaryAction"
            class="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            <UIcon name="i-ph-chart-bar-bold" class="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            @click="handleTertiaryAction"
            class="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            <UIcon name="i-ph-gear-bold" class="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <!-- Weekly Stats -->
      <div class="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ weeklyStats.quotesRead }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Quotes Read
          </p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ weeklyStats.authorsDiscovered }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Authors Found
          </p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ weeklyStats.quotesLiked }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Quotes Liked
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface WeeklyStats {
  quotesRead: number
  authorsDiscovered: number
  quotesLiked: number
}

const weeklyStats = ref<WeeklyStats>({
  quotesRead: 23,
  authorsDiscovered: 8,
  quotesLiked: 12
})

const completedDays = ref(6) // Out of 7 days
const progressPercentage = computed(() => {
  return Math.round((completedDays.value / 7) * 100)
})

const emit = defineEmits<{
  showDetails: []
  mainAction: []
  secondaryAction: []
  tertiaryAction: []
}>()

const showDetails = () => {
  emit('showDetails')
}

const handleMainAction = () => {
  emit('mainAction')
}

const handleSecondaryAction = () => {
  emit('secondaryAction')
}

const handleTertiaryAction = () => {
  emit('tertiaryAction')
}

// Fetch user progress data
const fetchProgressData = async () => {
  try {
    // This would typically fetch from an API
    // For now, we'll use mock data
    const mockData = {
      quotesRead: Math.floor(Math.random() * 50) + 10,
      authorsDiscovered: Math.floor(Math.random() * 15) + 3,
      quotesLiked: Math.floor(Math.random() * 25) + 5
    }
    
    weeklyStats.value = mockData
    completedDays.value = Math.floor(Math.random() * 7) + 1
  } catch (error) {
    console.error('Failed to fetch progress data:', error)
  }
}

onMounted(() => {
  fetchProgressData()
})
</script>

<style scoped>
/* Add subtle animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.progress-dot {
  animation: pulse 2s infinite;
}
</style>
