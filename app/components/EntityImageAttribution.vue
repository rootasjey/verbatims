<template>
  <div v-if="hasAttribution || reportable || $slots.actions" class="mt-2 flex flex-col items-start gap-y-1">
    <p v-if="hasAttribution" class="min-w-0 font-sans text-xs leading-relaxed text-gray-500 dark:text-gray-400">
      <a v-if="sourceUrl" :href="sourceUrl" target="_blank" rel="noopener noreferrer" class="underline decoration-gray-300 underline-offset-2 hover:text-gray-800 dark:decoration-gray-600 dark:hover:text-gray-100">
        {{ credit || 'Image source' }}
      </a>
      <span v-else-if="credit">{{ credit }}</span>
      <span v-if="license">{{ credit || sourceUrl ? ' · ' : '' }}{{ license }}</span>
      <span v-if="date">{{ credit || sourceUrl || license ? ' · ' : '' }}{{ date }}</span>
      <span v-if="location">{{ credit || sourceUrl || license || date ? ' · ' : '' }}{{ location }}</span>
    </p>
    <div v-if="reportable || $slots.actions" class="inline-flex items-center gap-2">
      <button
        v-if="reportable"
        type="button"
        class="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-gray-100/80 px-3 font-sans text-xs font-600 text-gray-700 transition-colors hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-gray-100"
        @click="$emit('report')"
      >
        <NIcon name="i-tabler-flag-3" class="h-3.5 w-3.5" aria-hidden="true" />
        {{ reportLabel }}
      </button>
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  credit?: string | null
  sourceUrl?: string | null
  license?: string | null
  date?: string | null
  location?: string | null
  reportable?: boolean
  reportLabel?: string
}>(), {
  reportable: false,
  reportLabel: ''
})

defineEmits<{
  (event: 'report'): void
}>()

const hasAttribution = computed(() => !!(props.credit || props.sourceUrl || props.license || props.date || props.location))
</script>
