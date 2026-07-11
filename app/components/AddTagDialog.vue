<template>
  <AppDialog
    v-model="isOpen"
    :title="dialogTitle as string"
    :submit-text="submitButtonText as string"
    :submitting="submitting"
    :can-submit="!!form.name.trim()"
    @submit="submitTag"
  >
    <div ref="contentRef">
      <form @submit.prevent="submitTag" @keydown.ctrl.enter.prevent="submitTag" @keydown.meta.enter.prevent="submitTag" class="space-y-6">
        <div>
          <NInput
            v-model="form.name"
            class="bg-white dark:bg-gray-900 b-none shadow-none"
            :placeholder="$t('components.dialogs.placeholder_name') as string"
            :disabled="submitting"
            required
            autofocus
            :una="{
              inputTrailingWrapper: 'pr-1.5'
            }"
          >
            <template #trailing>
              <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
                {{ $t('components.dialogs.name') }}
              </NBadge>
            </template>
          </NInput>
        </div>
        <div>
          <NInput
            v-model="form.category"
            class="bg-white dark:bg-gray-900 b-none shadow-none"
            :placeholder="$t('components.dialogs.genre') as string"
            :disabled="submitting"
            :una="{
              inputTrailingWrapper: 'pr-1.5'
            }"
          >
            <template #trailing>
              <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
                {{ $t('components.dialogs.genre') }}
              </NBadge>
            </template>
          </NInput>
        </div>
        <div>
          <NInput
            type="textarea"
            v-model="form.description"
            class="bg-white dark:bg-gray-900 b-none shadow-none"
            :rows="3"
            :placeholder="$t('components.dialogs.placeholder_desc') as string"
            :disabled="submitting"
            :una="{
              inputTrailingWrapper: 'pr-1.5 bottom-2 top-initial'
            }"
          >
            <template #trailing>
              <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
                {{ $t('components.dialogs.description') }}
              </NBadge>
            </template>
          </NInput>
        </div>
        <div>
          <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">{{ $t('components.dialogs.theme') }}</label>
          <div class="flex items-center gap-2">
            <div class="relative top-1">
              <BlossomColorPicker
                :value="pickerValue"
                @change="onColorChange"
                :colors="BLOSSOM_PALETTE"
                :show-alpha-slider="false"
                :core-size="28"
                :petal-size="28"
              />
            </div>
            <div class="max-w-[100px]">
              <NInput v-model="form.color" class="bg-white dark:bg-gray-900 b-none shadow-none" :placeholder="$t('components.dialogs.theme') as string" :disabled="submitting" />
            </div>
          </div>
        </div>
      </form>
    </div>
  </AppDialog>
</template>

<script setup lang="ts">
import { BlossomColorPicker } from '@dayflow/blossom-color-picker-vue'
import type { BlossomColorPickerColor } from '@dayflow/blossom-color-picker-vue'
import { hexToBlossomValue, BLOSSOM_PALETTE } from '~/utils/color'
import { useColorPickerEscape } from '~/composables/useColorPickerEscape'

interface Props { modelValue: boolean; editTag?: Tag | null }
interface Emits { (e:'update:modelValue', v:boolean):void; (e:'tag-added'):void; (e:'tag-updated'):void }

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { $t } = useI18n()

const isOpen = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) })
const isEditMode = computed(() => !!props.editTag)
const dialogTitle = computed(() => isEditMode.value ? $t('components.dialogs.edit_tag') : $t('components.dialogs.add_tag'))
const submitButtonText = computed(() => isEditMode.value ? $t('components.dialogs.update') : $t('components.dialogs.create'))

useColorPickerEscape()
const { showErrorToast } = useErrorToast()

const submitting = ref(false)
const form = ref({ name: '', description: '', category: '', color: '#687FE5' })
const pickerValue = ref(hexToBlossomValue('#687FE5'))

watch(() => props.editTag, (tag) => {
  if (tag) {
    form.value = {
      name: tag.name,
      description: tag.description || '',
      category: tag.category || '',
      color: tag.color || '#687FE5'
    }
    pickerValue.value = hexToBlossomValue(tag.color || '#687FE5')
    return
  }

  form.value = {
    name: '',
    description: '',
    category: '',
    color: '#687FE5'
  }
  pickerValue.value = hexToBlossomValue('#687FE5')
}, { immediate: true })

const contentRef = ref<HTMLElement | null>(null)

function applyDialogColors() {
  const el = contentRef.value?.closest<HTMLElement>('[role="dialog"]')
  if (!el) return
  el.style.borderColor = form.value.color
  const existing = getComputedStyle(el).boxShadow
  const tint = `inset 0 0 0 1000px ${form.value.color}0C`
  el.style.boxShadow = existing && existing !== 'none' ? `${tint}, ${existing}` : tint

  const closeBtn = el.querySelector<HTMLElement>('.dialog-close-btn')
  if (closeBtn) {
    closeBtn.style.color = form.value.color
    closeBtn.style.backgroundColor = `${form.value.color}15`
    closeBtn.dataset.tagTinted = 'true'

    const styleId = 'tag-dialog-close-hover'
    let styleEl = document.getElementById(styleId)
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = styleId
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = `[data-tag-tinted]:hover { background-color: ${form.value.color}30 !important; }`
  }

  const inputs = el.querySelectorAll<HTMLElement>('input, textarea')
  inputs.forEach(input => {
    input.dataset.tagInput = 'true'
  })

  const inputStyleId = 'tag-dialog-input-focus'
  let inputStyleEl = document.getElementById(inputStyleId)
  if (!inputStyleEl) {
    inputStyleEl = document.createElement('style')
    inputStyleEl.id = inputStyleId
    document.head.appendChild(inputStyleEl)
  }
  inputStyleEl.textContent = `[data-tag-input]:focus { box-shadow: inset 0 0 0 1px ${form.value.color}60; }`
}

watch(isOpen, (open) => {
  if (open) nextTick(applyDialogColors)
})

watch(() => form.value.color, () => {
  if (isOpen.value) applyDialogColors()
})

function onColorChange(color: BlossomColorPickerColor) {
  form.value.color = color.hex
  pickerValue.value = { hue: color.hue, saturation: color.saturation, alpha: color.alpha, layer: color.layer }
}

const closeDialog = () => { isOpen.value = false }

const submitTag = async () => {
  if (submitting.value) return
  if (!form.value.name.trim()) return
  submitting.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      description: form.value.description.trim() || null,
      category: form.value.category.trim() || null,
      color: form.value.color?.trim() || '#687FE5'
    }
    if (isEditMode.value && props.editTag) {
      await $fetch(`/api/admin/tags/${props.editTag.id}`, { method: 'PUT', body: payload })
      emit('tag-updated')
    } else {
      await $fetch('/api/admin/tags', { method: 'POST', body: payload })
      emit('tag-added')
    }
    closeDialog()
  } catch (error: any) {
    console.error('Error saving tag:', error)
    if (error?.statusCode === 409) {
      showErrorToast(null, { title: String($t('components.dialogs.name')), fallback: String($t('components.dialogs.toast_error')) })
      return
    }
    showErrorToast(error, String($t('components.dialogs.toast_error')))
  } finally {
    submitting.value = false
  }
}
</script>
