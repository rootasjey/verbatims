<template>
  <NuxtLink
    :to="`/authors/${author.id}`"
    class="group flex items-center gap-3 rounded-xl px-3 py-3 no-underline transition-[colors,transform] hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-gray-900 dark:hover:bg-white/6 dark:focus-visible:outline-gray-100 sm:gap-4 sm:px-5 sm:py-4 active:scale-99"
  >
    <NAvatar
      :src="author.image_url || undefined"
      :alt="author.name"
      size="sm"
      :fallback="getAuthorInitials(author.name)"
      class="shrink-0 rounded-xl bg-black/8 transition-[transform,background-color] group-hover:scale-105 dark:bg-white/10 dark:group-hover:bg-white/15"
    />
    <div class="min-w-0 flex-1">
      <span class="block truncate font-subtitle text-base font-600 leading-tight text-gray-900 transition-colors dark:text-white sm:text-lg"
      :class="author.is_fictional ? 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400' : 'group-hover:text-blue-600 dark:group-hover:text-blue-400'">
        {{ author.name }}
      </span>
      <span v-if="author.job" class="mt-1 block truncate font-sans text-sm text-gray-500 dark:text-gray-400">
        {{ author.job }}
      </span>
    </div>
    <span class="shrink-0 whitespace-nowrap font-sans text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
      <span class="sm:hidden">
        {{ formatNumber(author.quotes_count || 0) }}
        <span class="sr-only">{{ (author.quotes_count || 0) === 1 ? $t('common.quote_singular') : $t('common.quote_plural') }}</span>
      </span>
      <span class="hidden sm:inline">
        {{ formatNumber(author.quotes_count || 0) }}
        {{ (author.quotes_count || 0) === 1 ? $t('common.quote_singular') : $t('common.quote_plural') }}
      </span>
    </span>
    <NIcon name="i-ph-arrow-up-right" class="hidden h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:text-gray-500 sm:block" aria-hidden="true" />
  </NuxtLink>
</template>

<script setup lang="ts">
const { $t } = useI18n()

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
