<template>
  <NuxtLink
    :to="`/authors/${author.id}`"
    class="flex items-center gap-3 px-4 py-2.5 no-underline rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors group"
  >
    <NAvatar
      :src="author.image_url || undefined"
      :alt="author.name"
      size="xs"
      :fallback="getAuthorInitials(author.name)"
      class="shrink-0 bg-gray-200 dark:bg-gray-800 hover:scale-105 active:scale-99 hover:bg-gray-300 dark:hover:bg-gray-700 transition-[transform,color]"
    />
    <span class="text-sm font-500 text-gray-900 dark:text-white truncate transition-colors"
      :class="author.is_fictional ? 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400' : 'group-hover:text-blue-600 dark:group-hover:text-blue-400'">
      {{ author.name }}
    </span>
    <span v-if="author.job" class="text-xs text-gray-400 dark:text-gray-500 truncate hidden sm:inline flex-1 min-w-0">
      {{ author.job }}
    </span>
    <span class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap shrink-0 ml-auto">
      {{ formatNumber(author.quotes_count || 0) }}
      <span class="hidden sm:inline">{{ (author.quotes_count || 0) === 1 ? ' quote' : ' quotes' }}</span>
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
interface Props {
  author: Author
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
