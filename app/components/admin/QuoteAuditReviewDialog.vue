<template>
  <ClientOnly>
    <Teleport to="#teleports">
      <div
        v-if="open"
        class="fixed inset-0 z-[49] bg-black/45"
        aria-hidden="true"
        @click="dismiss"
      />
    </Teleport>

    <NDrawer
      v-if="isMobile"
      v-model:open="open"
      direction="bottom"
      :modal="false"
      :dismissible="!saving"
      :show-close="false"
      :una="{
        drawerContent: 'flex h-[min(92dvh,56rem)] max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-[#FAFAF9] shadow-2xl dark:bg-[#0C0A09]',
        drawerFooter: 'shrink-0 border-t border-gray-200 bg-[#FAFAF9] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:border-gray-800 dark:bg-[#0C0A09]',
        drawerOverlay: 'bg-black/45',
      }"
    >
      <template #body>
        <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
          <slot name="header" />
          <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-5">
            <slot />
          </div>
        </div>
      </template>
      <template #footer>
        <slot name="footer" />
      </template>
    </NDrawer>

    <NDialog
      v-else
      v-model:open="open"
      :modal="false"
      :show-close="false"
      :una="{
        dialogContent: dialogContentClass,
        dialogOverlay: 'bg-black/45',
        dialogFooter: 'border-t border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6',
      }"
    >
      <template #header>
        <slot name="header" />
      </template>
      <div
        :style="bodyHeight === null ? undefined : { height: `${bodyHeight}px` }"
        :class="[
          'max-h-[min(70dvh,48rem)] overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6',
          bodyHeight === null ? '' : 'transition-[height] duration-200 motion-reduce:transition-none',
        ]"
      >
        <div ref="bodyContent">
          <slot />
        </div>
      </div>
      <template #footer>
        <slot name="footer" />
      </template>
    </NDialog>
  </ClientOnly>
</template>

<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  saving: boolean
  contentWidth: 'compact' | 'standard' | 'wide'
}>()

const { isMobile } = useMobileDetection()
const dialogContentClass = computed(() => {
  const width = {
    compact: 'max-w-xl',
    standard: 'max-w-3xl',
    wide: 'max-w-5xl',
  }[props.contentWidth]

  return `w-[calc(100vw-2rem)] ${width} max-h-[calc(100dvh-2rem)] overflow-hidden p-0 transition-[max-width] duration-200 motion-reduce:transition-none`
})
const bodyContent = ref<HTMLElement | null>(null)
const bodyHeight = ref<number | null>(null)
let bodyResizeObserver: ResizeObserver | undefined

const measureBody = () => {
  if (!open.value || isMobile.value || !bodyContent.value) return
  bodyHeight.value = Math.ceil(bodyContent.value.getBoundingClientRect().height)
}

watch([open, isMobile], async ([isOpen, mobile]) => {
  if (!isOpen || mobile) return
  await nextTick()
  measureBody()
}, { flush: 'post' })

watch(bodyContent, async (content) => {
  if (!content) return
  await nextTick()
  bodyResizeObserver?.observe(content)
  measureBody()
}, { flush: 'post' })

onMounted(() => {
  if (!import.meta.client || typeof ResizeObserver === 'undefined') return
  bodyResizeObserver = new ResizeObserver(measureBody)
  if (bodyContent.value) bodyResizeObserver.observe(bodyContent.value)
})

onBeforeUnmount(() => bodyResizeObserver?.disconnect())

const dismiss = () => {
  if (!props.saving) open.value = false
}
</script>
