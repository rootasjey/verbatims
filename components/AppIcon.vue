<template>
  <div
    :style="containerStyle"
    class="font-title font-600 uppercase line-height-tight bg-black text-color-white border flex items-center justify-center"
    role="img"
    aria-label="Verbatims logo"
  >
    <span :style="labelStyle">v.b.t</span>
  </div>
</template>
<script setup lang="ts">
const props = defineProps({
  /** size in pixels (number or numeric string) */
  size: { type: [Number, String], default: 48 },
  /** optional border-radius */
  rounded: { type: String, default: '0px' },
})

const sizeNumber = Number(props.size) || 48

const containerStyle = {
  width: `${sizeNumber}px`,
  height: `${sizeNumber / 1.5}px`,
  borderRadius: props.rounded,
}

// Make the label scale with the container without relying on external CSS
const labelStyle = {
  fontSize: `${Math.max(10, Math.round(sizeNumber * 0.28))}px`,
  lineHeight: 1,
}
</script>
