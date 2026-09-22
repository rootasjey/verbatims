<template>
  <NuxtLink
    :to="`/tags/${encodeURIComponent(props.tag.name)}`"
    class="tag-grid-item group relative flex h-full min-h-56 flex-col rounded-xl border border-black/8 bg-white/35 p-5 no-underline transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:z-1 hover:scale-102 hover:bg-white/75 hover:shadow-md active:scale-99 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-800 dark:border-white/8 dark:bg-white/3 dark:hover:bg-white/6 dark:focus-visible:outline-gray-200"
    :style="styleVars"
  >
    <div class="mb-5 flex items-center gap-2 font-sans text-[0.68rem] font-600 uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
      <span class="tag-color-dot h-2 w-2 shrink-0 rounded-full bg-gray-400 dark:bg-gray-500" aria-hidden="true" />
      <span>{{ props.tag.category || $ts('tags_category_general') }}</span>
    </div>

    <div class="flex flex-1 flex-col">
      <h3 class="tag-name mb-3 line-clamp-2 break-words font-serif text-2xl font-500 leading-snug tracking-[-0.02em] text-gray-900 dark:text-gray-100 sm:text-[1.7rem]">
        {{ props.tag.name }}
      </h3>

      <p
        v-if="props.tag.description"
        class="line-clamp-3 flex-1 whitespace-pre-line font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400"
      >
        {{ props.tag.description }}
      </p>
    </div>

    <div class="mt-5 flex items-center justify-between gap-3 border-t border-black/8 pt-3 font-sans text-xs text-gray-500 dark:border-white/10 dark:text-gray-400">
      <span>{{ $ts((props.tag.quotes_count || 0) === 1 ? 'tags_quote_count_one' : 'tags_quote_count_other', { count: props.tag.quotes_count || 0 }) }}</span>
      <span class="shrink-0 tabular-nums">{{ formatDate(props.tag.created_at) }}</span>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { parseDateInput } from '~/utils/time-formatter'

interface TagListItem {
  id: number
  name: string
  description?: string | null
  category?: string | null
  color?: string | null
  created_at?: string
  quotes_count?: number
}

const props = defineProps<{
  tag: TagListItem
}>()

const { $ts } = useI18n()

const formatDate = (date?: string) => {
  if (!date) return '—'

  const parsed = parseDateInput(date)
  if (!parsed) return '—'
  return $ts('tags_added_year', { year: parsed.getFullYear() })
}

const styleVars = computed(() => {
  const color = props.tag.color?.trim()
  if (!color) return undefined

  return {
    '--tag-color': color
  } as Record<string, string>
})
</script>

<style scoped>
.tag-name {
  overflow-wrap: anywhere;
}

.tag-color-dot {
  background-color: var(--tag-color, currentColor);
}

@media (prefers-reduced-motion: reduce) {
  .tag-grid-item {
    transition-duration: 0.01ms;
  }
}
</style>
