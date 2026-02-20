<template>
  <NDialog
    v-model:open="internalOpen"
    :mask-closable="maskClosable"
    :una="{
      dialogContent: 'max-w-none p-0 bg-transparent shadow-none border-none ring-0 focus:ring-0',
      dialogOverlay: 'bg-transparent'
    }"
  >
    <div class="image-preview-root" @click.self="close">
      <img
        v-if="src"
        :src="src"
        :alt="alt || ''"
        class="image-preview-img"
        loading="lazy"
        @click="onImageClick"
      />
    </div>
  </NDialog>
</template>

<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  src: { type: String, required: true },
  alt: { type: String, default: '' },
  closeOnScroll: { type: Boolean, default: true },
  maskClosable: { type: Boolean, default: true },
  closeOnImageClick: { type: Boolean, default: true }
})
const emit = defineEmits(['update:modelValue'])

const internalOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

const close = () => { internalOpen.value = false }
const onImageClick = (e: Event) => {
  if (props.closeOnImageClick) close()
  else e.stopPropagation()
}

const handleCloseOnScroll = () => { internalOpen.value = false }

watch(internalOpen, (open) => {
  if (!props.closeOnScroll || typeof window === 'undefined') return
  if (open) {
    window.addEventListener('scroll', handleCloseOnScroll, { passive: true })
    window.addEventListener('wheel', handleCloseOnScroll, { passive: true })
    window.addEventListener('touchmove', handleCloseOnScroll, { passive: true })
  } else {
    window.removeEventListener('scroll', handleCloseOnScroll)
    window.removeEventListener('wheel', handleCloseOnScroll)
    window.removeEventListener('touchmove', handleCloseOnScroll)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleCloseOnScroll)
    window.removeEventListener('wheel', handleCloseOnScroll)
    window.removeEventListener('touchmove', handleCloseOnScroll)
  }
})
</script>

<style scoped>
.image-preview-root {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  padding: 1.25rem;
  background: rgba(12, 10, 9, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.image-preview-img {
  max-width: 96vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 0.5rem;
  box-shadow: 0 20px 40px rgba(2,6,23,0.5);
  cursor: zoom-out;
  transition: transform 240ms cubic-bezier(.22,.61,.36,1);
}
.image-preview-img:active { transform: scale(0.98); }
</style>
