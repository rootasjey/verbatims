<template>
  <div class="px-6 py-6">
    <div class="border-t border-dashed border-gray-300 dark:border-gray-700 pt-6">
      <!-- Section Header -->
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: 'var(--theme-primary, #6366f1)' }" />
          <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
            Authors
          </p>
        </div>
        <button
          class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          @click="showMoreAuthors"
        >
          See All
        </button>
      </div>

      <!-- Authors horizontal scroll -->
      <div class="flex space-x-4 overflow-x-auto py-1 scrollbar-hide">
        <div
          v-for="author in recentAuthors"
          :key="author.id"
          class="flex-shrink-0 cursor-pointer group"
          @click="navigateToAuthor(author.id)"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              v-if="author.image_url"
              class="w-10 h-10 rounded-full overflow-hidden grayscale flex-shrink-0"
            >
              <img :src="author.image_url" :alt="author.name" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
              <span class="font-subtitle text-xs text-gray-400 dark:text-gray-500">
                {{ getAuthorInitials(author.name) }}
              </span>
            </div>
            <div class="min-w-0">
              <p class="font-subtitle text-sm font-600 text-gray-900 dark:text-gray-100 truncate max-w-24 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                {{ author.name }}
              </p>
              <p v-if="author.quotes_count" class="font-sans text-xs text-gray-500 dark:text-gray-400">
                {{ author.quotes_count }} {{ author.quotes_count === 1 ? 'quote' : 'quotes' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex space-x-4 overflow-x-auto py-1">
        <div v-for="i in 4" :key="i" class="flex-shrink-0 flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          <div>
            <div class="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
            <div class="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!recentAuthors.length" class="text-center py-8">
        <p class="font-sans text-sm text-gray-500 dark:text-gray-400">
          No authors yet
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const recentAuthors = ref<Author[]>([])
const loading = ref(true)

const emit = defineEmits<{
  showMore: []
}>()

const getAuthorInitials = (name: string): string => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
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
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.grayscale {
  filter: grayscale(100%);
  transition: filter 0.3s ease, transform 0.3s ease;
}

.group:hover .grayscale {
  filter: grayscale(0%);
  transform: scale(1.05);
}
</style>
