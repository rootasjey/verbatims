<template>
  <UCard class="author-card group hover:shadow-lg transition-all duration-200 cursor-pointer" @click="navigateToAuthor">
    <div class="flex items-start space-x-4">
      <!-- Avatar -->
      <UAvatar
        :src="author.image_url"
        :alt="author.name"
        size="lg"
        :ui="{ background: 'bg-primary-500 dark:bg-primary-400' }"
      />
      
      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {{ author.name }}
            </h3>
            
            <!-- Author Type -->
            <div class="flex items-center space-x-2 mt-1">
              <UBadge 
                :color="author.is_fictional ? 'purple' : 'blue'" 
                variant="subtle" 
                size="xs"
              >
                {{ author.is_fictional ? 'Fictional' : 'Real Person' }}
              </UBadge>
              
              <!-- Life dates for real people -->
              <span v-if="!author.is_fictional && (author.birth_date || author.death_date)" class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatLifeDates(author.birth_date, author.death_date) }}
              </span>
            </div>
          </div>
          
          <!-- Like button -->
          <button 
            @click.stop="toggleLike" 
            :disabled="!user || likePending"
            :class="[
              'flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors',
              isLiked 
                ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                : 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
              !user && 'cursor-not-allowed opacity-50'
            ]"
          >
            <UIcon 
              :name="isLiked ? 'i-ph-heart-fill' : 'i-ph-heart'" 
              :class="['w-3 h-3', likePending && 'animate-pulse']"
            />
            <span>{{ author.likes_count }}</span>
          </button>
        </div>
        
        <!-- Job/Description -->
        <p v-if="author.job" class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {{ author.job }}
        </p>
        
        <!-- Description -->
        <p v-if="author.description" class="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
          {{ author.description }}
        </p>
        
        <!-- Location -->
        <p v-if="author.birth_location" class="text-xs text-gray-500 dark:text-gray-400 mt-2">
          <UIcon name="i-ph-map-pin" class="w-3 h-3 inline mr-1" />
          {{ author.birth_location }}
        </p>
      </div>
    </div>
    
    <!-- Footer Stats -->
    <template #footer>
      <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-1">
            <UIcon name="i-ph-quotes" class="w-4 h-4" />
            <span>{{ author.quotes_count || 0 }} {{ (author.quotes_count || 0) === 1 ? 'quote' : 'quotes' }}</span>
          </div>
          
          <div class="flex items-center space-x-1">
            <UIcon name="i-ph-eye" class="w-4 h-4" />
            <span>{{ formatNumber(author.views_count) }}</span>
          </div>
        </div>
        
        <div class="text-xs text-gray-400">
          Added {{ formatDate(author.created_at) }}
        </div>
      </div>
    </template>
  </UCard>
</template>

<script setup>
const props = defineProps({
  author: {
    type: Object,
    required: true
  }
})

const { user } = useUserSession()

// Reactive state
const isLiked = ref(false)
const likePending = ref(false)

// Navigate to author page
const navigateToAuthor = () => {
  navigateTo(`/authors/${props.author.id}`)
}

// Check if user has liked this author
const checkLikeStatus = async () => {
  if (!user.value) return
  
  try {
    const { data } = await $fetch(`/api/authors/${props.author.id}/like-status`)
    isLiked.value = data?.isLiked || false
  } catch (error) {
    console.error('Failed to check like status:', error)
  }
}

// Toggle like status
const toggleLike = async () => {
  if (!user.value || likePending.value) return
  
  likePending.value = true
  try {
    const { data } = await $fetch(`/api/authors/${props.author.id}/like`, {
      method: 'POST'
    })
    
    isLiked.value = data.isLiked
    // Update the author's like count
    if (data.isLiked) {
      props.author.likes_count++
    } else {
      props.author.likes_count--
    }
  } catch (error) {
    console.error('Failed to toggle like:', error)
  } finally {
    likePending.value = false
  }
}

// Utility functions
const formatLifeDates = (birthDate, deathDate) => {
  if (!birthDate && !deathDate) return ''
  
  const birth = birthDate ? new Date(birthDate).getFullYear() : '?'
  const death = deathDate ? new Date(deathDate).getFullYear() : 'present'
  
  return `${birth} - ${death}`
}

const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short'
  })
}

// Check like status on mount
onMounted(() => {
  if (user.value) {
    checkLikeStatus()
  }
})

// Watch for user changes
watch(user, (newUser) => {
  if (newUser) {
    checkLikeStatus()
  } else {
    isLiked.value = false
  }
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.author-card:hover {
  transform: translateY(-2px);
}
</style>
