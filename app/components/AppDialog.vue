<template>
  <Teleport to="#teleports">
    <div
      v-if="preserveAppChrome && isOpen"
      class="fixed inset-0 z-layer-modal-scrim bg-black/45"
      aria-hidden="true"
      @click="close"
    />
  </Teleport>
  <NDialog
    v-model:open="isOpen"
    :modal="!preserveAppChrome"
    :una="unaConfig"
    :show-close="false"
    :_dialog-content="dialogContentProps"
  >
    <template #header>
      <div :class="[
        compactHeader ? 'mb-1 pb-1' : 'mb-5 pb-4',
        'grid w-full min-w-0 items-center gap-4',
        $slots['header-divider'] && 'relative',
        !$slots['header-progress'] && !$slots['header-divider'] && !hideHeaderBorder && 'border-b border-gray-200/80 dark:border-neutral-700/80',
        $slots['header-progress'] ? 'relative grid-cols-[minmax(0,1fr)]' : centerTitle ? 'grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)_auto]'
      ]">
        <div v-if="$slots['header-progress']" class="mx-2 min-w-0">
          <slot name="header-progress" />
        </div>
        <div v-else-if="centerTitle" class="flex min-w-0 items-center gap-3">
          <slot name="header-title"></slot>
        </div>
        <div v-else-if="!centerTitle" class="flex min-w-0 items-center gap-3">
          <slot name="header-title"></slot>
          <h2 v-if="title" :class="['min-w-0 font-serif font-500 tracking-tight text-gray-900 dark:text-gray-100', titleClass || 'text-2xl']">
            <slot name="title">{{ title }}</slot>
          </h2>
        </div>
        <h2 v-if="centerTitle && title && !$slots['header-progress']" :class="['min-w-0 max-w-full text-center font-serif font-500 tracking-tight text-gray-900 dark:text-gray-100', titleClass || 'text-2xl']">
          <slot name="title">{{ title }}</slot>
        </h2>
        <div :class="['flex items-center gap-2', $slots['header-progress'] ? 'absolute -top-2 right-0' : centerTitle && 'justify-end']">
          <slot name="header-actions" />
          <NTooltip :content="$t('components.app_dialog.close')?.toString()">
            <NButton btn="ghost-gray" @click="close" size="sm" label="i-ph-x" icon :class="['shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 dark:focus-visible:ring-stone-400', closeButtonClass]" />
          </NTooltip>
        </div>
        <div
          v-if="$slots['header-divider'] && !hideHeaderBorder"
          class="pointer-events-none absolute inset-x-0 bottom-0 translate-y-1/2"
          aria-hidden="true"
        >
          <slot name="header-divider" />
        </div>
      </div>
    </template>

    <div v-if="scrollable" class="relative min-h-0 overflow-hidden">
      <div
        ref="dialogContentRef"
        :class="['h-full min-h-0 overflow-auto', scrollableContentClass]"
        @scroll.passive="updateScrollFade"
      >
        <slot />
      </div>
      <div
        v-if="scrollFade && hasScrollBefore"
        class="pointer-events-none absolute inset-x-0 top-0 z-10 h-7 bg-gradient-to-b from-[#FAFAF9] to-transparent dark:from-[#151515]"
        aria-hidden="true"
      />
      <div
        v-if="scrollFade && hasScrollAfter"
        class="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-7 bg-gradient-to-t from-[#FAFAF9] to-transparent dark:from-[#151515]"
        aria-hidden="true"
      />
    </div>
    <div v-else ref="dialogContentRef">
      <slot />
    </div>

    <template v-if="!hideFooter" #footer>
      <slot name="footer">
        <div class="w-full flex justify-end gap-3 pt-4 border-t border-gray-200/80 dark:border-neutral-700/80">
          <NButton btn="ghost-gray" :rounded="cancelButtonRounded" :class="['font-600', cancelButtonClass]" :disabled="submitting" @click="close">{{ cancelText }}</NButton>
          <slot name="submit">
            <PrimaryButton :disabled="!canSubmit" :loading="submitting" @click="$emit('submit')" class="rounded-full px-5">
              <span class="flex items-center gap-2">
                {{ submitText }}
                <NIcon v-if="!submitting" name="i-ph-check" class="inline-block" />
              </span>
            </PrimaryButton>
          </slot>
        </div>
      </slot>
    </template>
  </NDialog>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  title?: string
  titleClass?: string
  centerTitle?: boolean
  submitText?: string
  cancelText?: string
  cancelButtonClass?: string
  cancelButtonRounded?: string
  closeButtonClass?: string
  submitting?: boolean
  canSubmit?: boolean
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  maxHeight?: 'none' | 'sm' | 'md' | 'lg'
  hideFooter?: boolean
  hideHeaderBorder?: boolean
  compactHeader?: boolean
  scrollable?: boolean
  scrollableContentClass?: string
  scrollFade?: boolean
  una?: Record<string, string>
  preserveAppChrome?: boolean
  dialogContentStyle?: Record<string, string>
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit'): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  submitting: false,
  canSubmit: true,
  centerTitle: false,
  maxWidth: 'sm',
  maxHeight: 'none',
  hideFooter: false,
  hideHeaderBorder: false,
  compactHeader: false,
  scrollable: false,
  scrollFade: false,
  preserveAppChrome: false,
  una: () => ({})
})

const emit = defineEmits<Emits>()

const { $t } = useI18n()

const submitText = computed(() => props.submitText ?? String($t('components.app_dialog.save')))
const cancelText = computed(() => props.cancelText ?? String($t('components.app_dialog.cancel')))

const dialogContentRef = ref<HTMLElement | null>(null)
const hasScrollBefore = ref(false)
const hasScrollAfter = ref(false)
let scrollContentObserver: ResizeObserver | undefined

function updateScrollFade() {
  const content = dialogContentRef.value
  if (!props.scrollFade || !content) {
    hasScrollBefore.value = false
    hasScrollAfter.value = false
    return
  }

  hasScrollBefore.value = content.scrollTop > 1
  hasScrollAfter.value = content.scrollTop + content.clientHeight < content.scrollHeight - 1
}

watch([dialogContentRef, () => props.modelValue, () => props.scrollFade], async ([content, isOpen, isEnabled]) => {
  scrollContentObserver?.disconnect()
  scrollContentObserver = undefined

  if (!content || !isOpen || !isEnabled) {
    updateScrollFade()
    return
  }

  await nextTick()
  updateScrollFade()
  scrollContentObserver = new ResizeObserver(updateScrollFade)
  scrollContentObserver.observe(content)

  const slottedContent = content.firstElementChild
  if (slottedContent instanceof HTMLElement) {
    scrollContentObserver.observe(slottedContent)
  }
}, { flush: 'post' })

onBeforeUnmount(() => scrollContentObserver?.disconnect())

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const maxWidthClass = computed(() => {
  switch (props.maxWidth) {
    case 'xs': return 'max-w-xs'
    case 'sm': return 'max-w-sm'
    case 'md': return 'md:max-w-md lg:max-w-lg'
    case 'lg': return 'md:max-w-lg lg:max-w-xl'
    case 'xl': return 'md:max-w-xl lg:max-w-2xl'
    case '2xl': return 'md:max-w-2xl lg:max-w-5xl'
    default: return 'max-w-sm'
  }
})

const maxHeightClass = computed(() => {
  switch (props.maxHeight) {
    case 'none': return props.scrollable ? 'max-h-[calc(100dvh-2rem)]' : ''
    case 'sm': return 'max-h-[50vh]'
    case 'md': return 'max-h-[70vh]'
    case 'lg': return 'max-h-[90vh]'
    default: return ''
  }
})

const unaConfig = computed(() => ({
  ...props.una,
  dialogContent: [
    'w-[calc(100vw_-_2rem)] max-w-[calc(100vw_-_2rem)] border border-gray-200 bg-[#FAFAF9] text-gray-900 shadow-2xl rounded-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAF9] dark:border-neutral-800 dark:bg-[#151515] dark:text-gray-100 dark:focus-visible:ring-stone-400/80 dark:focus-visible:ring-offset-[#151515]',
    maxWidthClass.value,
    maxHeightClass.value,
    props.scrollable && 'grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden',
    props.una?.dialogContent
  ].filter(Boolean).join(' ')
}))

function close() {
  emit('close')
  isOpen.value = false
}

// reka-ui auto-focuses the first tabbable element (the close button) when a
// dialog opens. That focuses the X button and activates its tooltip, whose
// dismissable layer swallows the first Escape (needing two presses to close).
// Intercept the open auto-focus and move focus to the content / first field.
function handleOpenAutoFocus(event: Event) {
  event.preventDefault()
  nextTick(() => {
    const dialogEl = dialogContentRef.value?.closest<HTMLElement>('[role="dialog"]')
    if (!dialogEl) return
    const target = dialogEl.querySelector<HTMLElement>('[autofocus]')
      || dialogEl.querySelector<HTMLElement>('input:not([type="hidden"]), textarea, select')
      || dialogEl
    target?.focus({ preventScroll: true })
  })
}

// `NDialogContentProps` doesn't type the reka-ui `openAutoFocus` handler, but
// UnaUI's DialogContent forwards extra attributes ($attrs) to reka-ui at runtime.
const dialogContentProps = computed(() => ({
  onOpenAutoFocus: handleOpenAutoFocus,
  style: props.dialogContentStyle,
})) as any

</script>
