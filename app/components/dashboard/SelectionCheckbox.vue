<template>
  <span
    data-selection-ignore
    :data-visible="visible"
    :aria-hidden="!visible"
    :inert="!visible"
    class="dashboard-selection-checkbox inline-flex shrink-0"
  >
    <NCheckbox
      checkbox="gray"
      :aria-label="label"
      :model-value="modelValue"
      class="mt-1"
      @click.stop="$emit('toggle', $event)"
    />
  </span>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  label: string
  modelValue: boolean
}>()

defineEmits<{
  (event: 'toggle', value: MouseEvent): void
}>()
</script>

<style scoped>
.dashboard-selection-checkbox {
  opacity: 0;
  width: 0;
  overflow: hidden;
  translate: -0.375rem 0;
  scale: 0.94;
  pointer-events: none;
  transition:
    width 220ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 170ms ease-out,
    translate 220ms cubic-bezier(0.16, 1, 0.3, 1),
    scale 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dashboard-selection-checkbox[data-visible='true'] {
  opacity: 1;
  width: 1.25rem;
  translate: 0 0;
  scale: 1;
  pointer-events: auto;
}

@media (prefers-reduced-motion: reduce) {
  .dashboard-selection-checkbox {
    transition: none;
  }
}
</style>
