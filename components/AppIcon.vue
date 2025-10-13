<template>
  <div
    :style="containerStyle"
    class="app-icon font-title font-600 uppercase line-height-tight flex items-center justify-center"
    :class="['app-icon', { ' bg-black': !props.icon }]"
    role="img"
    aria-label="Verbatims logo"
  >
    <div v-if="props.icon && !props.outline" :width="sizeNumber">
      <span class="border b-dashed px-2 py-1">VBT</span>
    </div>
    <div v-else :width="sizeNumber">
      <span class="border b-dashed px-2 py-1">VERBATIMS</span>
    </div>
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
