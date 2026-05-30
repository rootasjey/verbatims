<template>
  <NuxtLink
    :to="`/references/${reference.id}`"
    class="flex items-center gap-3 px-4 py-2.5 no-underline rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group"
  >
    <img
      v-if="reference.image_url && !imgError"
      :src="reference.image_url"
      :alt="reference.name"
      class="w-8 h-8 rounded-lg object-cover shrink-0 hover:scale-105 active:scale-99 transition-transform"
      @error="imgError = true"
    />
    <div
      v-else
      class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 hover:scale-105 active:scale-99 transition-transform"
      :class="iconBgClass"
    >
      <NIcon :name="getReferenceIcon(reference.primary_type)" class="w-4 h-4" :class="iconColorClass" />
    </div>
    <span class="text-sm font-500 text-gray-900 dark:text-white truncate transition-colors" :class="nameHoverClass">
      {{ reference.name }}
    </span>
    <span class="text-xs text-gray-400 dark:text-gray-500 truncate hidden sm:inline flex-1 min-w-0">
      {{ formatReferenceType(reference.primary_type) }}
    </span>
    <span class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap shrink-0 ml-auto">
      {{ formatNumber(reference.quotes_count || 0) }}
      <span class="hidden sm:inline">{{ (reference.quotes_count || 0) === 1 ? ' quote' : ' quotes' }}</span>
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
interface Props {
  reference: QuoteReferenceWithMetadata
}

const props = defineProps<Props>()
const imgError = ref(false)

const typeColorMap: Record<string, { bg: string; icon: string; hover: string }> = {
  book:        { bg: 'bg-blue-50 dark:bg-blue-900/20',    icon: 'text-blue-600 dark:text-blue-400',    hover: 'group-hover:text-blue-600 dark:group-hover:text-blue-400' },
  film:        { bg: 'bg-red-50 dark:bg-red-900/20',      icon: 'text-red-600 dark:text-red-400',      hover: 'group-hover:text-red-600 dark:group-hover:text-red-400' },
  tv_series:   { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-600 dark:text-purple-400', hover: 'group-hover:text-purple-600 dark:group-hover:text-purple-400' },
  music:       { bg: 'bg-green-50 dark:bg-green-900/20',   icon: 'text-green-600 dark:text-green-400',   hover: 'group-hover:text-green-600 dark:group-hover:text-green-400' },
  speech:      { bg: 'bg-orange-50 dark:bg-orange-900/20', icon: 'text-orange-600 dark:text-orange-400', hover: 'group-hover:text-orange-600 dark:group-hover:text-orange-400' },
  podcast:     { bg: 'bg-pink-50 dark:bg-pink-900/20',    icon: 'text-pink-600 dark:text-pink-400',    hover: 'group-hover:text-pink-600 dark:group-hover:text-pink-400' },
  interview:   { bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: 'text-yellow-600 dark:text-yellow-400', hover: 'group-hover:text-yellow-600 dark:group-hover:text-yellow-400' },
  documentary: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', icon: 'text-indigo-600 dark:text-indigo-400', hover: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400' },
  media_stream:{ bg: 'bg-cyan-50 dark:bg-cyan-900/20',    icon: 'text-cyan-600 dark:text-cyan-400',    hover: 'group-hover:text-cyan-600 dark:group-hover:text-cyan-400' },
  writings:    { bg: 'bg-gray-50 dark:bg-gray-800',        icon: 'text-gray-600 dark:text-gray-400',    hover: 'group-hover:text-gray-600 dark:group-hover:text-gray-400' },
  video_game:  { bg: 'bg-violet-50 dark:bg-violet-900/20', icon: 'text-violet-600 dark:text-violet-400', hover: 'group-hover:text-violet-600 dark:group-hover:text-violet-400' },
  other:       { bg: 'bg-gray-50 dark:bg-gray-800',        icon: 'text-gray-600 dark:text-gray-400',    hover: 'group-hover:text-gray-600 dark:group-hover:text-gray-400' },
}

const iconBgClass = computed(() => typeColorMap[props.reference.primary_type]?.bg || 'bg-gray-50 dark:bg-gray-800')
const iconColorClass = computed(() => typeColorMap[props.reference.primary_type]?.icon || 'text-gray-600 dark:text-gray-400')
const nameHoverClass = computed(() => typeColorMap[props.reference.primary_type]?.hover || 'group-hover:text-gray-600 dark:group-hover:text-gray-400')

const formatNumber = (num?: number | null): string => {
  if (!num) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}
</script>
