<template>
  <button
    v-if="!to"
    type="button"
    :class="btnClass"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
  <NuxtLink v-else :to="to" :class="btnClass" @click="$emit('click', $event)">
    <slot />
  </NuxtLink>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'default' | 'destructive' | 'primary'
  size?: 'sm' | 'md'
  disabled?: boolean
  loading?: boolean
  to?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md'
})

defineEmits<{ click: [event?: MouseEvent] }>()

const btnClass = computed(() => {
  const base = [
    'font-sans text-xs inline-flex items-center gap-1.5',
    'border transition-colors active:scale-99',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ]

  if (props.size === 'sm') {
    base.push('px-2 py-1')
  } else {
    base.push('px-3 py-1.5')
  }

  if (props.variant === 'destructive') {
    base.push('text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20')
  } else if (props.variant === 'primary') {
    base.push('text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20')
  } else {
    base.push('text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800')
  }

  return base
})
</script>
