<template>
  <NCard
    :class="[
      'quote-card group transition-all duration-300 h-full',
      featured ? 'ring-2 ring-primary-500 shadow-lg bg-gradient-to-br from-primary-50/50 to-primary-100/30 dark:from-primary-900/20 dark:to-primary-800/10' : ''
    ]"
    :ui="{
      background: 'bg-white dark:bg-gray-800',
      shadow: '',
      ring: '',
      rounded: 'rounded-xl',
      divide: '',
      body: { padding: 'p-6' }
    }"
  >
    <template #header>
      <div class="flex items-start justify-between gap-4 mb-4">
        <div class="flex-1 min-w-0">
          <blockquote
            :class="[
              'quote-text quote-content text-balance mb-4',
              featured ? 'text-xl sm:text-2xl lg:text-3xl font-semibold' : ''
            ]"
          >
            "{{ quote.name }}"
          </blockquote>

          <!-- Language indicator -->
          <div v-if="quote.language !== 'en'" class="mt-2">
            <NBadge variant="subtle" size="xs">
              {{ getLanguageName(quote.language) }}
            </NBadge>
          </div>
        </div>

        <NDropdownMenu :items="dropdownItems" :_dropdown-menu-content="{ side: 'bottom', align: 'end' }">
          <NButton
            btn="ghost-gray"
            icon
            label="i-ph-dots-three-vertical"
            size="sm"
            class="opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </NDropdownMenu>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Author -->
      <div v-if="quote.author" class="flex items-center space-x-3 mb-3">
        <NAvatar
          :src="quote.author.image_url"
          :alt="quote.author.name"
          :size="featured ? 'md' : 'sm'"
          :ui="{ background: 'bg-primary-500 dark:bg-primary-400' }"
        />
        <div>
          <NuxtLink
            :to="`/authors/${quote.author.id}`"
            class="quote-author hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            {{ quote.author.name }}
          </NuxtLink>
          <p v-if="quote.author.is_fictional" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Fictional Character
          </p>
        </div>
      </div>

      <!-- Reference -->
      <div v-if="quote.reference" class="flex items-center space-x-2 quote-reference mb-4">
        <NIcon :name="getReferenceIcon(quote.reference.type)" class="w-4 h-4 flex-shrink-0" />
        <span>From:</span>
        <NuxtLink
          :to="`/references/${quote.reference.id}`"
          class="font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate"
        >
          {{ quote.reference.name }}
        </NuxtLink>
      </div>

      <!-- Tags -->
      <div v-if="quote.tags?.length" class="flex flex-wrap gap-2">
        <NuxtLink
          v-for="tag in quote.tags"
          :key="tag.name"
          :to="`/tags/${encodeURIComponent(tag.name)}`"
          class="tag hover:scale-105 transition-transform"
          :style="{
            backgroundColor: tag.color + '20',
            color: tag.color,
            borderColor: tag.color + '40'
          }"
        >
          #{{ tag.name }}
        </NuxtLink>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
        <div class="flex items-center space-x-6">
          <!-- Like Button -->
          <button
            @click="toggleLike"
            :disabled="!user || likePending"
            :class="[
              'flex items-center space-x-2 text-sm transition-colors',
              isLiked
                ? 'text-red-500 hover:text-red-600'
                : 'text-gray-500 hover:text-red-500',
              !user && 'cursor-not-allowed opacity-50'
            ]"
          >
            <NIcon
              :name="isLiked ? 'i-ph-heart-fill' : 'i-ph-heart'"
              :class="['w-4 h-4', likePending && 'animate-pulse']"
            />
            <span>{{ quote.likes_count }}</span>
          </button>

          <!-- Views -->
          <div class="flex items-center space-x-2 text-sm text-gray-500">
            <NIcon name="i-ph-eye" class="w-4 h-4" />
            <span>{{ formatNumber(quote.views_count) }}</span>
          </div>

          <!-- Shares -->
          <div v-if="quote.shares_count > 0" class="flex items-center space-x-2 text-sm text-gray-500">
            <NIcon name="i-ph-share" class="w-4 h-4" />
            <span>{{ formatNumber(quote.shares_count) }}</span>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <!-- Featured badge -->
          <NBadge v-if="featured || quote.is_featured" color="yellow" variant="subtle" size="xs">
            Featured
          </NBadge>

          <!-- View Details -->
          <NuxtLink
            :to="`/quotes/${quote.id}`"
            class="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
          >
            View Details
          </NuxtLink>
        </div>
      </div>
    </template>
  </NCard>

  <!-- Add to Collection Modal -->
  <AddToCollectionModal
    v-model="showAddToCollectionModal"
    :quote="quote"
    @added="onAddedToCollection"
  />
</template><script setup>
const props = defineProps({
  quote: {
    type: Object,
    required: true
  },
  featured: {
    type: Boolean,
    default: false
  }
})

const { user } = useUserSession()

const isLiked = ref(false)
const likePending = ref(false)

// Check if user has liked this quote
const checkLikeStatus = async () => {
  if (!user.value) return

  try {
    const { data } = await $fetch(`/api/quotes/${props.quote.id}/like-status`)
    isLiked.value = data?.isLiked || false
  } catch (error) {
    console.error('Failed to check like status:', error)
  }
}

const toggleLike = async () => {
  if (!user.value || likePending.value) return

  likePending.value = true
  try {
    const { data } = await $fetch(`/api/quotes/${props.quote.id}/like`, {
      method: 'POST'
    })

    isLiked.value = data.isLiked
    // Update the quote's like count
    if (data.isLiked) {
      props.quote.likes_count++
    } else {
      props.quote.likes_count--
    }
  } catch (error) {
    console.error('Failed to toggle like:', error)
  } finally {
    likePending.value = false
  }
}

const shareQuote = async () => {
  try {
    if (navigator.share) {
      await navigator.share({
        title: 'Quote from Verbatims',
        text: `"${props.quote.name}" ${props.quote.author ? `- ${props.quote.author.name}` : ''}`,
        url: `${window.location.origin}/quotes/${props.quote.id}`
      })
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(
        `"${props.quote.name}" ${props.quote.author ? `- ${props.quote.author.name}` : ''}\n\n${window.location.origin}/quotes/${props.quote.id}`
      )
      // TODO: Show toast notification
    }

    // Track share
    await $fetch(`/api/quotes/${props.quote.id}/share`, { method: 'POST' })
    props.quote.shares_count++
  } catch (error) {
    console.error('Failed to share quote:', error)
  }
}

const showAddToCollectionModal = ref(false)

const addToCollection = () => {
  if (!user.value) {
    navigateTo('/login')
    return
  }
  showAddToCollectionModal.value = true
}

const onAddedToCollection = (collection) => {
  // TODO: Show success toast
}

const reportQuote = () => {
  if (!user.value) {
    navigateTo('/login')
    return
  }
  // TODO: Open report modal
}

const dropdownItems = computed(() =>  [
  {
    label: 'Share',
    leading: 'i-ph-share',
    onclick: shareQuote
  },
  ...(user.value.role === 'admin' || user.value.role === 'moderator' ? [{
    label: 'Add to Collection',
    leading: 'i-ph-bookmark',
    onclick: addToCollection
  }] : []),
  {},
  {
    label: 'Report',
    leading: 'i-ph-flag',
    onclick: reportQuote
  }
])

const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

onMounted(() => {
  if (user.value) {
    checkLikeStatus()
  }
})

watch(user, (newUser) => {
  if (newUser) {
    checkLikeStatus()
  } else {
    isLiked.value = false
  }
})
</script>