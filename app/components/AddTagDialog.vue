<template>
  <NDialog v-model:open="isOpen" :una="{ dialogContent: 'border-2 max-w-sm' }">
    <div ref="contentRef">
      <div class="mb-3 pb-3 border-b b-dashed border-gray-200">
        <h3 class="font-title uppercase text-size-4 font-600">{{ dialogTitle }}</h3>
      </div>

      <form @submit.prevent="submitTag" @keydown.ctrl.enter.prevent="submitTag" @keydown.meta.enter.prevent="submitTag" class="space-y-6">
        <div>
          <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">Name *</label>
          <NInput v-model="form.name" class="bg-white b-none shadow-none" placeholder="e.g., inspiration" :disabled="submitting" required autofocus />
        </div>
        <div>
          <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">Category</label>
          <NInput v-model="form.category" class="bg-white b-none shadow-none" placeholder="e.g., emotion, philosophy" :disabled="submitting" />
        </div>
        <div>
          <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">Description</label>
          <NInput type="textarea" v-model="form.description" class="bg-white b-none shadow-none" :rows="3" placeholder="Short description" :disabled="submitting" />
        </div>
        <div>
          <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">Color</label>
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
              <NInput v-model="form.color" class="bg-white b-none shadow-none" placeholder="#687FE5" :disabled="submitting" />
            </div>
          </div>
        </div>
      </form>

      <div class="mt-6 pt-3 border-t b-dashed border-gray-200 flex justify-end gap-3">
        <NButton btn="link-gray" class="font-600" :disabled="submitting" @click="closeDialog">Cancel</NButton>
        <NButton btn="~" class="font-600 hover:bg-black hover:color-white" rounded="0" :loading="submitting" :disabled="!form.name.trim()" @click="submitTag">{{ submitButtonText }}</NButton>
      </div>
    </div>
  </NDialog>
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

const isOpen = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) })
const isEditMode = computed(() => !!props.editTag)
const dialogTitle = computed(() => isEditMode.value ? 'Edit Tag' : 'Create Tag')
const submitButtonText = computed(() => isEditMode.value ? 'Update Tag' : 'Create Tag')

useColorPickerEscape()

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
      useToast().toast({ toast: 'error', title: 'Duplicate name', description: 'A tag with this name already exists.' })
      return
    }
    useToast().toast({ toast: 'error', title: 'Error', description: 'Failed to save tag' })
  } finally {
    submitting.value = false
  }
}
</script>
