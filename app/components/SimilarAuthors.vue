<template>
  <div v-if="authors.length > 0" class="px-8 pb-16">
    <div class="max-w-6xl mx-auto">
      <div class="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent mb-14"></div>
    </div>

    <!-- Editorial section header -->
    <div class="flex items-center justify-center gap-4 mb-12">
      <span class="flex-1 max-w-12 h-px bg-gray-300 dark:bg-gray-600"></span>
      <h2 class="font-sans text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 flex-shrink-0">
        Similar Authors
      </h2>
      <span class="flex-1 max-w-12 h-px bg-gray-300 dark:bg-gray-600"></span>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
      <div
        v-for="(author, index) in authors"
        :key="author.id"
        class="group cursor-pointer similar-item text-center"
        :class="{ 'in': authors.length > 0 }"
        :style="{ transitionDelay: `${index * 60}ms` }"
        @click="navigateTo(`/authors/${author.id}`)"
      >
        <div class="flex flex-col justify-center items-center p-4 rounded-sm
          hover:bg-gray-50 dark:hover:bg-white/[0.02]
          transition-all duration-300">
          <div class="mb-3 p-0.5 flex rounded-full overflow-hidden ring-2 ring-gray-300 dark:ring-gray-600 grayscale group-hover:grayscale-0 transition-all duration-500">
            <NAvatar
              :src="author.image_url || undefined"
              :alt="author.name"
              size="lg"
              :fallback="getAuthorInitials(author.name)"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          <div class="flex-1 w-full">
            <p class="font-subtitle text-base font-600 text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">
              {{ author.name }}
            </p>
            <p v-if="author.job" class="font-sans text-xs text-gray-400 dark:text-gray-500 line-clamp-1 mt-0.5">
              {{ author.job }}
            </p>
            <p class="font-serif text-xs text-gray-400 dark:text-gray-500 mt-2">
              {{ formatNumber(author.quotes_count) }} quote{{ author.quotes_count === 1 ? '' : 's' }}
            </p>
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
