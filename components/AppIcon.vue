<template>
  <div
    :style="containerStyle"
    class="app-icon font-title font-600 uppercase line-height-tight text-color-white light:border flex items-center justify-center"
    :class="['app-icon', { ' bg-black': !props.icon }]"
    role="img"
    aria-label="Verbatims logo"
  >
    <NuxtImg v-if="props.icon && !props.outline" src="/images/letter-v.png" :width="sizeNumber" alt="Verbatims logo" />
    <NuxtImg v-else-if="props.icon && props.outline" src="/images/letter-v-outline.png" class="outline-icon" :width="sizeNumber" alt="Verbatims logo" />
    <span v-else :style="labelStyle">v.b.t</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  icon: { type: Boolean, default: false },
  outline: { type: Boolean, default: false },
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

<style scoped>
.app-icon {
  /* Ensure border is visible and ready to animate */
  border-color: rgba(255, 255, 255, 0.35);
  transition: border-color 150ms ease;
}

.app-icon:hover,
.app-icon:focus-visible {
  animation: borderRainbow 2.5s linear infinite;
}

.dark .outline-icon {
  filter: brightness(0) invert(1);
}

@keyframes borderRainbow {
  0% { border-color: #ef4444; }    /* red-500 */
  20% { border-color: #f59e0b; }   /* amber-500 */
  40% { border-color: #10b981; }   /* emerald-500 */
  60% { border-color: #3b82f6; }   /* blue-500 */
  80% { border-color: #8b5cf6; }   /* violet-500 */
  100% { border-color: #ef4444; }
}

@media (prefers-reduced-motion: reduce) {
  .app-icon:hover,
  .app-icon:focus-visible {
    animation: none;
    border-color: #8b5cf6; /* single accessible highlight */
  }
}
</style>
