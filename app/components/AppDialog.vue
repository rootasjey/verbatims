<template>
  <NDialog v-model:open="isOpen" :una="unaConfig" :show-close="false">
    <template #header>
      <div class="flex justify-between items-center mb-1 pb-2 border-b b-dashed border-gray-200">
        <h3 class="font-title uppercase text-size-4 font-600">
          <slot name="title">{{ title }}</slot>
        </h3>
        <div class="flex items-center gap-2">
          <slot name="header-actions" />
          <NTooltip content="Close">
            <NButton btn="~" @click="close" size="xs" label="i-ph-x-bold" icon class="dialog-close-btn hover:scale-110 active:scale-99 transition-[transform,color] duration-300" />
          </NTooltip>
        </div>
      </div>
    </template>

    <div v-if="scrollable" class="overflow-auto max-h-[70vh]">
      <slot />
    </div>
    <slot v-else />

    <template v-if="!hideFooter" #footer>
      <slot name="footer">
        <div class="w-full flex justify-end gap-3 pt-3 border-t b-dashed border-gray-200">
          <NButton btn="link-gray" class="font-600" :disabled="submitting" @click="close">{{ cancelText }}</NButton>
          <slot name="submit">
            <PrimaryButton :disabled="!canSubmit" :loading="submitting" @click="$emit('submit')" class="rounded-0 px-3">
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
  title: string
  submitText?: string
  cancelText?: string
  submitting?: boolean
  canSubmit?: boolean
  maxWidth?: 'sm' | 'md' | 'lg'
  hideFooter?: boolean
  scrollable?: boolean
  una?: Record<string, string>
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit'): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  submitText: 'Save',
  cancelText: 'Cancel',
  submitting: false,
  canSubmit: true,
  maxWidth: 'sm',
  hideFooter: false,
  scrollable: false,
  una: () => ({})
})

const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const maxWidthClass = computed(() => {
  switch (props.maxWidth) {
    case 'sm': return 'max-w-sm'
    case 'md': return 'md:max-w-md lg:max-w-lg'
    case 'lg': return 'md:max-w-lg lg:max-w-xl'
    default: return 'max-w-sm'
  }
})

const unaConfig = computed(() => ({
  dialogContent: `border-2 ${maxWidthClass.value}`
}))

function close() {
  emit('close')
  isOpen.value = false
}
</script>
