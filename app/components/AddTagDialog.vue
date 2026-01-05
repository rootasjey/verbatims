<template>
  <NDialog v-model:open="isOpen" :una="{ dialogContent: 'md:max-w-md lg:max-w-lg' }">
    <div>
      <div class="mb-3">
        <h3 class="font-title uppercase text-size-4 font-600 ml-4">{{ dialogTitle }}</h3>
      </div>

      <form @submit.prevent="submitTag" @keydown.ctrl.enter.prevent="submitTag" @keydown.meta.enter.prevent="submitTag" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Name *</label>
          <NInput v-model="form.name" placeholder="e.g., inspiration" :disabled="submitting" required autofocus />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Category</label>
          <NInput v-model="form.category" placeholder="e.g., emotion, philosophy" :disabled="submitting" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Description</label>
          <NInput type="textarea" v-model="form.description" :rows="3" placeholder="Short description" :disabled="submitting" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Color</label>
          <div class="flex items-center gap-2">
            <NInput v-model="form.color" placeholder="#687FE5" :disabled="submitting" class="flex-1" />
            <span class="w-6 h-6 rounded border border-gray-200 dark:border-gray-700" :style="{ backgroundColor: form.color || '#687FE5' }" />
          </div>
        </div>
      </form>

      <div class="mt-6 flex justify-end gap-3">
        <NButton btn="light:soft dark:soft-white" :disabled="submitting" @click="closeDialog">Cancel</NButton>
        <NButton btn="soft-blue" :loading="submitting" :disabled="!form.name.trim()" @click="submitTag">{{ submitButtonText }}</NButton>
      </div>
    </div>
  </NDialog>
</template>

<script setup lang="ts">
interface Props { modelValue: boolean; editTag?: Tag | null }
interface Emits { (e:'update:modelValue', v:boolean):void; (e:'tag-added'):void; (e:'tag-updated'):void }

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) })
const isEditMode = computed(() => !!props.editTag)
const dialogTitle = computed(() => isEditMode.value ? 'Edit Tag' : 'Create Tag')
const submitButtonText = computed(() => isEditMode.value ? 'Update Tag' : 'Create Tag')

const submitting = ref(false)
const form = ref({ name: '', description: '', category: '', color: '#687FE5' })

watch(() => props.editTag, (tag) => {
  if (tag) {
    form.value = {
      name: tag.name, 
      description: tag.description || '', 
      category: tag.category || '', 
      color: tag.color || '#687FE5'
    }
    return
  }

  form.value = { 
    name: '', 
    description: '', 
    category: '', 
    color: '#687FE5' 
  }
}, { immediate: true })

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
