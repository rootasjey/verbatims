<template>
  <div class="flex items-start gap-3 rounded-lg border border-gray-200 border-l-2 border-l-red-500 bg-gray-50 p-4 text-gray-900 dark:border-neutral-700 dark:border-l-red-400 dark:bg-neutral-900/40 dark:text-gray-100">
    <NIcon name="i-ph-warning" class="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
    <div class="text-sm">
      <p class="font-semibold">{{ $t('components.dialogs.delete_permanent') }}</p>
      <div class="mt-1 text-gray-600 dark:text-gray-400">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $t } = useI18n()
</script>
