<template>
  <div v-if="authors.length > 0" class="px-8 pb-16">
    <div class="max-w-6xl mx-auto">
      <div class="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent mb-14"></div>
    </div>

    <h2 class="font-title text-2xl md:text-3xl font-200 text-center mb-10">
      Take a look at
    </h2>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
      <div
        v-for="(author, index) in authors"
        :key="author.id"
        class="group cursor-pointer similar-item"
        :class="{ 'in': authors.length > 0 }"
        :style="{ transitionDelay: `${index * 60}ms` }"
        @click="navigateTo(`/authors/${author.id}`)"
      >
        <div class="flex flex-col items-center text-center p-5 rounded-xl
          bg-white dark:bg-[#101010]
          border border-gray-200 dark:border-gray-700
          hover:border-primary-400 dark:hover:border-primary-500
          hover:shadow-lg hover:shadow-primary-500/5
          active:scale-99
          transition-all duration-300">
          <NAvatar
            :src="author.image_url || undefined"
            :alt="author.name"
            size="lg"
            :fallback="getAuthorInitials(author.name)"
            class="mb-3 group-hover:scale-110 transition-transform duration-300"
          />
          <div class="flex-1 w-full">
            <p class="font-medium text-sm line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {{ author.name }}
            </p>
            <p v-if="author.job" class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
              {{ author.job }}
            </p>
            <div class="mt-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
              <NIcon name="i-ph-quotes" class="w-3 h-3" />
              {{ formatNumber(author.quotes_count) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SimilarAuthor {
  id: number
  name: string
  image_url?: string | null
  job?: string | null
  quotes_count?: number | null
}

interface Props {
  authors: SimilarAuthor[]
}

defineProps<Props>()

const getAuthorInitials = (name: string): string => {
  if (!name) return '??'
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
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
