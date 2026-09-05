<template>
    <NDialog
    :open="dialogOpen"
    @update:open="handleDialogUpdate"
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
import { nextTick, onUnmounted, watch, type PropType } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  src: { type: String, required: true },
  alt: { type: String, default: '' },
  imgClass: { type: String, default: '' },
  overlayClass: { type: String, default: '' },
  transitionOrigin: { type: Object as PropType<HTMLElement | null>, default: null },
  closeOnScroll: { type: Boolean, default: true },
  maskClosable: { type: Boolean, default: true },
  closeOnImageClick: { type: Boolean, default: true }
})
const emit = defineEmits(['update:modelValue'])

const dialogOpen = ref(props.modelValue)
const isClosing = ref(false)

const emitClosed = () => {
  dialogOpen.value = false
  isClosing.value = false
  showTransitionOrigin()
  emit('update:modelValue', false)
}

const close = () => { void requestClose() }
const onImageClick = (e: Event) => {
  if (props.closeOnImageClick) close()
  else e.stopPropagation()
}

const getTransitionOrigin = (): HTMLElement | null => {
  const origin = props.transitionOrigin as HTMLElement | null
  if (!(origin instanceof HTMLElement)) return null
  return origin.querySelector('img') || origin
}

const getPreviewImage = (): HTMLImageElement | null => {
  return document.querySelector('.image-preview-img')
}

let sourceWasHidden = false

const hideTransitionOrigin = () => {
  const origin = getTransitionOrigin()
  if (!origin || sourceWasHidden) return
  origin.style.visibility = 'hidden'
  sourceWasHidden = true
}

const showTransitionOrigin = () => {
  const origin = getTransitionOrigin()
  if (!origin || !sourceWasHidden) return
  origin.style.visibility = ''
  sourceWasHidden = false
}

const getTransformFromOrigin = (origin: HTMLElement, image: HTMLImageElement) => {
  const sourceRect = origin.getBoundingClientRect()
  const targetRect = image.getBoundingClientRect()
  if (!sourceRect.width || !sourceRect.height || !targetRect.width || !targetRect.height) return null

  const sourceCenterX = sourceRect.left + sourceRect.width / 2
  const sourceCenterY = sourceRect.top + sourceRect.height / 2
  const targetCenterX = targetRect.left + targetRect.width / 2
  const targetCenterY = targetRect.top + targetRect.height / 2
  const scale = Math.min(sourceRect.width / targetRect.width, sourceRect.height / targetRect.height)

  return {
    transform: `translate(${sourceCenterX - targetCenterX}px, ${sourceCenterY - targetCenterY}px) scale(${scale})`
  }
}

const animateFromOrigin = async () => {
  const origin = getTransitionOrigin()
  const image = getPreviewImage()
  if (!origin || !image || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    showTransitionOrigin()
    return
  }

  await image.decode().catch(() => undefined)
  const initial = getTransformFromOrigin(origin, image)
  if (!initial) {
    showTransitionOrigin()
    return
  }

  image.animate([initial, { transform: 'none' }], {
    duration: 600,
    easing: 'cubic-bezier(.16,1,.3,1)',
    fill: 'both'
  })
}

const animateToOrigin = async () => {
  const origin = getTransitionOrigin()
  const image = getPreviewImage()
  if (!origin || !image || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    showTransitionOrigin()
    return
  }

  const target = getTransformFromOrigin(origin, image)
  if (!target) {
    showTransitionOrigin()
    return
  }

  await image.animate([{ transform: 'none' }, target], {
    duration: 500,
    easing: 'cubic-bezier(.4,0,.2,1)',
    fill: 'both'
  }).finished
  showTransitionOrigin()
}

const handleCloseOnScroll = () => { void requestClose() }

const requestClose = async () => {
  if (!dialogOpen.value || isClosing.value) return
  isClosing.value = true
  await nextTick()
  await animateToOrigin()
  emitClosed()
}

const handleDialogUpdate = (open: boolean) => {
  if (open) {
    dialogOpen.value = true
    return
  }
  // Keep the dialog mounted while the reverse shared-element transition runs.
  dialogOpen.value = true
  void requestClose()
}

watch(() => props.modelValue, async (open, previousOpen) => {
  if (open) {
    dialogOpen.value = true
    hideTransitionOrigin()
    await nextTick()
    requestAnimationFrame(() => { void animateFromOrigin() })
  } else if (previousOpen) {
    void requestClose()
  }
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
  showTransitionOrigin()
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
