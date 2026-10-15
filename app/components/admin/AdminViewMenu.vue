<template>
  <NTooltip :content="label">
    <div class="inline-flex">
      <NDropdownMenu :items="items" :modal="false">
        <NButton
          icon
          btn="outline-gray"
          size="sm"
          :label="modelValue ? 'i-lucide-layout-grid' : 'i-lucide-table-2'"
          :aria-label="label"
          class="h-10 w-10 rounded-md border-[#d2cfc6] bg-[#f0efe9] text-gray-700 hover:bg-[#eae8e1] dark:border-white/15 dark:bg-white/[0.06] dark:text-gray-200 dark:hover:bg-white/10"
        />
      </NDropdownMenu>
    </div>
  </NTooltip>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  label: string
  tableLabel: string
  cardsLabel: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const items = computed(() => [
  { label: props.tableLabel, leading: 'i-lucide-table-2', onclick: () => emit('update:modelValue', false) },
  { label: props.cardsLabel, leading: 'i-lucide-layout-grid', onclick: () => emit('update:modelValue', true) },
])
</script>
