<template>
  <span
    data-selection-ignore
    :data-visible="visible"
    :aria-hidden="!visible"
    :inert="!visible"
    :style="{ transitionDelay: visible ? `${Math.min(delayIndex, 12) * 12}ms` : '0ms' }"
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
withDefaults(defineProps<{
  visible: boolean
  label: string
  modelValue: boolean
  delayIndex?: number
}>(), {
  delayIndex: 0
})

defineEmits<{
  (event: 'toggle', value: MouseEvent): void
}>()
</script>

<style scoped>
.dashboard-selection-checkbox {
  opacity: 0;
  position: absolute;
  left: 0.5rem;
  top: 50%;
  translate: -5px -50%;
  scale: 0.96;
  pointer-events: none;
  transition:
    opacity 150ms ease-out,
    translate 150ms cubic-bezier(0.16, 1, 0.3, 1),
    scale 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dashboard-selection-checkbox[data-visible='true'] {
  opacity: 1;
  position: relative;
  left: auto;
  top: auto;
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
