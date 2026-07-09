<template>
  <AppDialog
    v-model="isOpen"
    title="Edit Poster Image"
    submit-text="Save"
    :submitting="submitting"
    :can-submit="true"
    max-width="sm"
    @submit="saveImage"
  >
    <div class="space-y-6 m-1">
      <div class="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
        <div
          v-if="imagePreviewUrl"
          class="relative"
        >
          <img
            :src="imagePreviewUrl"
            alt="Poster preview"
            class="w-full object-cover"
            style="aspect-ratio: 3/4;"
            @error="previewErrored = true"
          />
          <div v-if="previewErrored" class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-sm text-gray-400">
            Failed to load image
          </div>
        </div>
        <div v-else class="flex items-center justify-center py-16 text-gray-400">
          <NIcon name="i-ph-image" class="w-12 h-12" />
        </div>
      </div>

      <div>
        <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">Image URL</label>
        <NInput
          v-model="imageUrl"
          type="url"
          placeholder="https://example.com/poster.jpg"
          :disabled="submitting"
          class="bg-white dark:bg-gray-900 b-none shadow-none"
        />
      </div>

      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">Or upload a file</p>
        <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="onFileSelected">
        <NButton
          btn="outline-gray"
          size="sm"
          :disabled="submitting"
          @click="fileInputRef?.click()"
        >
          <template #leading>
            <NIcon :name="uploading ? 'i-ph-circle-notch' : 'i-ph-upload'" :class="uploading ? 'animate-spin' : ''" class="w-4 h-4" />
          </template>
          Choose Image
        </NButton>
      </div>
    </div>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  modelValue: boolean
  referenceId: string
  currentImageUrl: string | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'image-updated', imageUrl: string | null): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const imageUrl = ref(props.currentImageUrl || '')
const submitting = ref(false)
const previewErrored = ref(false)
const fileInputRef = ref<HTMLInputElement>()
const { uploading, uploadImage } = useImageUpload()
const { showErrorToast } = useErrorToast()

const imagePreviewUrl = computed(() => imageUrl.value.trim() || '')

watch(() => props.currentImageUrl, (val) => {
  imageUrl.value = val || ''
})

watch(() => imageUrl.value, () => {
  previewErrored.value = false
})

const onFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const url = await uploadImage(file)
  if (url) {
    imageUrl.value = url
  }
  target.value = ''
}

const saveImage = async () => {
  submitting.value = true
  try {
    await $fetch(`/api/admin/references/${props.referenceId}`, {
      method: 'PUT',
      body: {
        image_url: imageUrl.value.trim() || null
      }
    })

    emit('image-updated', imageUrl.value.trim() || null)
    isOpen.value = false
  } catch (error) {
    showErrorToast(error, 'Failed to update poster image')
  } finally {
    submitting.value = false
  }
}

</script>
