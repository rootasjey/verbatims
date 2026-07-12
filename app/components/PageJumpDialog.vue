<template>
  <ClientOnly>
    <AppDialog
      v-model="isOpen"
      :title="$t('components.dialogs.jump_to_page.title') as string"
      :submit-text="$t('components.dialogs.jump_to_page.go') as string"
      @submit="jumpToPage"
    >
      <div class="space-y-4">
        <p class="font-sans text-xs text-gray-500 dark:text-gray-400">
          {{ $t('components.dialogs.jump_to_page.description', { n: totalPages }) }}
        </p>
        <input
          ref="pageJumpInput"
          v-model="pageJumpValue"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          :placeholder="$t('components.dialogs.jump_to_page.placeholder', { n: totalPages }) as string"
          class="w-full font-sans text-sm bg-gray-100 dark:bg-gray-900 px-3 py-2 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
          @keydown.enter.prevent="jumpToPage"
        />
        <NBadge badge="soft-blue" class="w-full" :class="[{ 'opacity-0 pointer-events-none': !pageJumpWarning }]">
          <p class="font-sans text-xs">
            {{ pageJumpWarning || ' ' }}
          </p>
          <NTooltip :content="$t('components.dialogs.jump_to_page.fix_tooltip') as string">
            <div
              class="ml-1 flex items-center bg-blue-100 dark:bg-blue-900 p-.5 rounded-1 cursor-pointer hover:scale-105 active:scale-99 transition-[transform]"
              @click="fixPageJumpWarning"
            >
              <NIcon name="i-tabler-hammer" />
            </div>
          </NTooltip>
        </NBadge>
      </div>
    </AppDialog>
  </ClientOnly>
</template>

<script setup lang="ts">
const { $t } = useI18n()

interface Props {
  modelValue: boolean
  totalPages: number
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'jump', page: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

const pageJumpValue = ref('')
const pageJumpInput = ref<HTMLInputElement | null>(null)

const pageJumpWarning = computed(() => {
  const val = String(pageJumpValue.value).trim()
  if (!val) return ''
  const page = parseInt(val, 10)
  if (isNaN(page)) return ''
  if (page < 1) return $t('components.dialogs.jump_to_page.warning_low')
  if (page > props.totalPages) return $t('components.dialogs.jump_to_page.warning_high', { page: props.totalPages })
  return ''
})

const jumpToPage = () => {
  const page = parseInt(String(pageJumpValue.value), 10)
  if (isNaN(page)) return
  const clamped = Math.max(1, Math.min(page, props.totalPages))
  emit('jump', clamped)
  isOpen.value = false
  pageJumpValue.value = ''
}

const fixPageJumpWarning = () => {
  pageJumpValue.value = Number(pageJumpValue.value.trim()) > props.totalPages ? String(props.totalPages) : '1'
}

watch(isOpen, async (open) => {
  if (open) {
    await nextTick()
    pageJumpInput.value?.focus()
    pageJumpValue.value = ''
  }
})
</script>
