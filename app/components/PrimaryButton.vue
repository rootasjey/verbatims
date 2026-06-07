<template>
  <button
    type="button"
    class="group relative inline-flex items-center justify-center overflow-hidden font-sans text-sm font-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
    :disabled="disabled || loading"
    @click="$emit('click')"
  >
    <span class="relative z-1 transition-colors duration-300 group-hover:text-white dark:group-hover:text-[#0C0A09] flex items-center gap-2">
      <slot />
      <span v-if="loading" class="i-ph-circle-notch animate-spin inline-block" />
    </span>
    <span class="absolute inset-0 w-0 group-hover:w-full transition-all duration-300 ease-out -z-0 bg-[#0C0A09] dark:bg-[#FAFAF9]" />
  </button>
</template>

<script setup lang="ts">
interface Props {
  disabled?: boolean
  loading?: boolean
}

defineProps<Props>()
defineEmits<{ click: [] }>()
</script>
