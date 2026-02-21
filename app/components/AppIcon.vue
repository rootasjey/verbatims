<template>
  <div
    :style="containerStyle"
    class="flex items-center justify-center"
    aria-label="Verbatims logo"
  >
    <img
      src="/images/v-letter.png"
      :width="sizeNumber"
      :height="sizeNumber"
      alt="Verbatims logo"
      class="dark:invert"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  icon: { type: Boolean, default: false },
  /** size in pixels (number or numeric string) */
  size: { type: [Number, String], default: 32 },
})

const sizeNumber = Number(props.size) || 32

const containerStyle = {
  width: `${sizeNumber}px`,
  height: `${sizeNumber}px`,
}

</script>
