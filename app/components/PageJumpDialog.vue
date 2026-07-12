<template>
  <ClientOnly>
    <NDialog v-model:open="isOpen" :_dialog-content="{ class : 'p-0' }">
      <template #header>
        <div class="px-6 pt-6">
          <h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">
            Jump to page
          </h3>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400">
            Enter a page number between 1 and {{ totalPages }}.
          </p>
        </div>
      </template>
      <div class="px-6 space-y-4">
        <input
          ref="pageJumpInput"
          v-model="pageJumpValue"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          :placeholder="`1 – ${totalPages}`"
          class="w-full font-sans text-sm bg-gray-100 dark:bg-gray-900 px-3 py-2 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
          @keydown.enter.prevent="jumpToPage"
        />
        <NBadge badge="soft-blue" class="w-full" :class="[{ 'opacity-0 pointer-events-none': !pageJumpWarning }]">
          <p class="font-sans text-xs">
            {{ pageJumpWarning || ' ' }}
          </p>
          <NTooltip content="Fix the number">
            <div
              class="ml-1 flex items-center bg-blue-100 dark:bg-blue-900 p-.5 rounded-1 cursor-pointer hover:scale-105 active:scale-99 transition-[transform]"
              @click="fixPageJumpWarning"
            >
              <NIcon name="i-tabler-hammer" />
            </div>
          </NTooltip>
        </NBadge>
      </div>
      <template #footer>
        <div class="pb-3 px-6 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-3 w-full m-0 p-0">
          <NButton
            btn="link-gray"
            @click="isOpen = false"
          >
            Cancel
          </NButton>
          <PrimaryButton @click="jumpToPage" class="min-w-[60px] py-2">Go</PrimaryButton>
        </div>
      </template>
    </NDialog>
  </ClientOnly>
</template>

<script setup lang="ts">
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
  if (page < 1) return 'Value is too low. You will be redirected to page 1.'
  if (page > props.totalPages) return `Value exceeds the maximum. You will be redirected to page ${props.totalPages}.`
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
