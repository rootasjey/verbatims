<template>
  <NuxtLink
    :to="`/tags/${encodeURIComponent(props.tag.name)}`"
    class="tag-grid-item group border-1 b-gray-200 dark:b-gray-800 relative p-6 cursor-pointer h-full flex flex-col 
    no-underline hover:scale-101 active:scale-99 hover:shadow-lg transition-all duration-300 hover:z-2"
    :style="styleVars"
  >
    <div class="border-b b-dashed b-gray-200 dark:border-gray-400 pb-2 font-sans font-600 text-size-4 flex items-center justify-between mb-4 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
      <NBadge badge="soft-gray" size="xs">
        {{ props.tag.category || 'General' }}
      </NBadge>

      <NTooltip :content="`${props.tag.quotes_count || 0} quotes`">
        <NIcon
          name="i-ph-tag-bold"
          class="opacity-0 group-hover:opacity-100 text-gray-600 dark:text-gray-400 flex-shrink-0 transition-opacity duration-300 hover:scale-125 hover:rotate-12 active:scale-99 ease-in-out transition-transform"
        />
      </NTooltip>
    </div>

    <div class="flex-1 flex flex-col">
      <h3
        class="font-serif text-gray-800 dark:text-gray-200 break-words line-height-none leading-relaxed transition-opacity duration-300 mb-2"
        :class="{
          'text-size-12 font-600': props.tag.name.length > 30,
          'text-size-15 font-600': props.tag.name.length <= 30 && props.tag.name.length > 15,
          'text-6xl font-600': props.tag.name.length <= 15
        }"
      >
        #{{ props.tag.name }}
      </h3>

      <p
        v-if="props.tag.description"
        class="font-sans text-sm text-gray-500 dark:text-gray-500 line-clamp-4 whitespace-pre-line flex-1"
      >
        {{ props.tag.description }}
      </p>
    </div>

    <div class="border-t b-dashed b-gray-200 dark:border-gray-400 pt-3 mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 transition-opacity duration-300 opacity-70 group-hover:opacity-100">
      <span>{{ props.tag.quotes_count || 0 }} {{ (props.tag.quotes_count || 0) === 1 ? 'quote' : 'quotes' }}</span>
      <span>{{ formatDate(props.tag.created_at) }}</span>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
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

const formatDate = (date?: string) => {
  if (!date) return '—'

  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.getFullYear().toString()
}

const styleVars = computed(() => {
  const color = props.tag.color?.trim()
  if (!color) return undefined

  // we expose as CSS variable so we can change only on hover
  return {
    '--tag-border-color': `${color}`
  } as Record<string, string>
})
</script>

<style scoped>
.tag-grid-item {
  transition: border-color 0.3s ease;
}

/* apply the computed color only on hover */
.tag-grid-item:hover {
  border-color: var(--tag-border-color);
}
</style>
