<template>
  <span class="overflowing-tab-label">
    <span v-if="number" class="overflowing-tab-label__number">{{ number }}</span>
    <NTooltip :content="label" :_tooltip-content="{ side: 'bottom' }">
      <span ref="viewport" class="overflowing-tab-label__viewport" :class="{ 'is-overflowing': isOverflowing }">
        <span class="overflowing-tab-label__track">
          <span ref="labelText" class="overflowing-tab-label__text">{{ label }}</span>
          <span v-if="isOverflowing" aria-hidden="true" class="overflowing-tab-label__text">{{ label }}</span>
        </span>
      </span>
    </NTooltip>
  </span>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  number?: string
  label: string
}>()

const viewport = ref<HTMLElement | null>(null)
const labelText = ref<HTMLElement | null>(null)
const isOverflowing = ref(false)
let resizeObserver: ResizeObserver | undefined

const updateOverflow = () => {
  const viewportElement = viewport.value
  const textElement = labelText.value
  if (!viewportElement || !textElement) return

  isOverflowing.value = textElement.scrollWidth > viewportElement.clientWidth + 1
}

const measureAfterRender = async () => {
  await nextTick()
  updateOverflow()
}

onMounted(() => {
  updateOverflow()
  resizeObserver = new ResizeObserver(updateOverflow)
  if (viewport.value) resizeObserver.observe(viewport.value)
  if (labelText.value) resizeObserver.observe(labelText.value)
})

onBeforeUnmount(() => resizeObserver?.disconnect())

watch(() => props.label, measureAfterRender, { flush: 'post' })
</script>

<style src="./OverflowingTabLabel.css"></style>
