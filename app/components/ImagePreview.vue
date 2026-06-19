<template>
  <NDialog
    v-model:open="internalOpen"
    :mask-closable="maskClosable"
    :show-close="false"
    :una="{
      dialogContent: 'max-w-none p-0 bg-transparent shadow-none border-none ring-0 focus:ring-0',
      dialogOverlay: 'bg-transparent'
    }"
  >
    <div :class="['image-preview-root', overlayClass]" @click.self="close">
      <div class="image-preview-toolbar">
        <div class="flex items-center gap-1">
          <slot name="actions" />
          <NButton
            btn="ghost-gray"
            icon
            size="xs"
            label="i-ph-x-bold"
            square="2em"
            @click="close"
          />
        </div>
      </div>
      <img
        v-if="src"
        :src="src"
        :alt="alt || ''"
        :class="['image-preview-img', imgClass]"
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
  imgClass: { type: String, default: '' },
  overlayClass: { type: String, default: '' },
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
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  padding: 1.25rem;
  background: rgba(12, 10, 9, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  animation: backdrop-in 300ms ease both;
}

@keyframes backdrop-in {
  from { opacity: 0; backdrop-filter: blur(0px); -webkit-backdrop-filter: blur(0px); }
  to { opacity: 1; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
}
.image-preview-img {
  max-width: 96vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 0.5rem;
  cursor: zoom-out;
}
.image-preview-img:active { transform: scale(0.98); }

.image-preview-toolbar {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
}
</style>
