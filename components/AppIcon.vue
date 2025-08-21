<template>
  <div
    :style="containerStyle"
    class="app-icon font-title font-600 uppercase line-height-tight flex items-center justify-center"
    :class="['app-icon', { ' bg-black': !props.icon }]"
    role="img"
    aria-label="Verbatims logo"
  >
    <NuxtImg v-if="props.icon && !props.outline" src="/images/letter-v.png" :width="sizeNumber" alt="Verbatims logo" />
    <NuxtImg v-else src="/images/letter-v-outline.png" class="outline-icon" :width="sizeNumber" alt="Verbatims logo" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  icon: { type: Boolean, default: true },
  outline: { type: Boolean, default: false },
  /** size in pixels (number or numeric string) */
  size: { type: [Number, String], default: 48 },
})

const sizeNumber = Number(props.size) || 48

const containerStyle = {
  width: `${sizeNumber}px`,
  height: `${sizeNumber}px`,
}

</script>

<style scoped>
.dark .outline-icon {
  filter: brightness(0) invert(1);
}
</style>
