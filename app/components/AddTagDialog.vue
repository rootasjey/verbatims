<template>
  <AppDialog
    v-model="isOpen"
    :title="dialogTitle as string"
    :submit-text="submitButtonText as string"
    :submitting="submitting"
    :can-submit="!!form.name.trim()"
    @submit="submitTag"
  >
    <template v-if="isEditMode" #submit>
      <NButton btn="solid-black" class="min-h-10 rounded-lg px-4" :disabled="!form.name.trim() || submitting" :loading="submitting" @click="submitTag">
        {{ submitButtonText }}
        <NIcon v-if="!submitting" name="i-ph-check" class="ml-2 h-4 w-4" aria-hidden="true" />
      </NButton>
    </template>
    <div>
      <form @submit.prevent="submitTag" @keydown.ctrl.enter.prevent="submitTag" @keydown.meta.enter.prevent="submitTag" class="space-y-5">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block min-w-0 space-y-1.5">
            <span class="font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ $t('components.dialogs.name') }}</span>
          <NInput
            v-model="form.name"
            :placeholder="$t('components.dialogs.placeholder_name') as string"
            :disabled="submitting"
            required
            autofocus
            input="outline-gray"
          />
          </label>
          <label class="block min-w-0 space-y-1.5">
            <span class="font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ $t('components.dialogs.genre') }}</span>
          <NInput
            v-model="form.category"
            :placeholder="$t('components.dialogs.genre') as string"
            :disabled="submitting"
            input="outline-gray"
          />
          </label>
        </div>
        <label class="block space-y-1.5">
          <span class="font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ $t('components.dialogs.description') }}</span>
          <NInput
            type="textarea"
            v-model="form.description"
            :rows="3"
            :placeholder="$t('components.dialogs.placeholder_desc') as string"
            :disabled="submitting"
            input="outline-gray"
          />
        </label>
        <div class="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200/80 pt-4 dark:border-neutral-700/80">
          <div>
            <p class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100">{{ $t('components.dialogs.theme') }}</p>
            <p class="mt-1 font-sans text-xs text-gray-500 dark:text-gray-400">{{ form.color }}</p>
          </div>
          <div class="flex items-center gap-3">
              <BlossomColorPicker
                :value="pickerValue"
                @change="onColorChange"
                :colors="BLOSSOM_PALETTE"
                :show-alpha-slider="false"
                :core-size="28"
                :petal-size="28"
              />
              <div class="w-28">
                <NInput v-model="form.color" :aria-label="$t('components.dialogs.theme') as string" :disabled="submitting" input="outline-gray" />
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
      const updateTagPath = `/api/admin/tags/${props.editTag.id}` as '/api/admin/tags/:id'
      await $fetch<{ success: boolean }, '/api/admin/tags/:id'>(updateTagPath, {
        method: 'PUT',
        body: payload
      })
      emit('tag-updated')
    } else {
      await $fetch<{ success: boolean }, '/api/admin/tags'>('/api/admin/tags', {
        method: 'POST',
        body: payload
      })
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
