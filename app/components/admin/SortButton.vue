<template>
  <NTooltip :content="nextLabel">
    <button
      type="button"
      class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-200/70 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100"
      :aria-label="nextLabel"
      @click.stop="emit('toggle')"
    >
      <NIcon :name="icon" class="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  </NTooltip>
</template>

<script setup lang="ts">
const props = defineProps<{
  direction: 'asc' | 'desc' | null
  ascendingLabel: string
  descendingLabel: string
}>()

const emit = defineEmits<{
  toggle: []
}>()

const nextLabel = computed(() => props.direction === 'desc' ? props.ascendingLabel : props.descendingLabel)
const icon = computed(() => props.direction === 'asc'
  ? 'i-ph-sort-ascending'
  : props.direction === 'desc'
    ? 'i-ph-sort-descending'
    : 'i-ph-arrows-down-up')
</script>
