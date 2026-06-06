<template>
  <NDialog v-model:open="isOpen" :una="{ dialogContent: 'md:max-w-sm' }">
    <div>
      <h3 class="font-title uppercase text-size-4 font-600 mb-3 ml-4">Delete Sponsor Message</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Are you sure you want to delete this sponsor message?
        <br>
        <span class="font-medium">"{{ message?.message }}"</span>
      </p>
      <div class="flex justify-end gap-3">
        <NButton btn="light:soft dark:soft-white" :disabled="submitting" @click="close">Cancel</NButton>
        <NButton btn="soft-red" :loading="submitting" @click="confirmDelete">Delete</NButton>
      </div>
    </div>
  </NDialog>
</template>

<script setup lang="ts">
interface Props { modelValue: boolean; message: { id: number; message: string } | null }
interface Emits { (e: 'update:modelValue', v: boolean): void; (e: 'deleted'): void }

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const isOpen = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) })
const submitting = ref(false)

const close = () => { isOpen.value = false }

const confirmDelete = async () => {
  if (!props.message) return
  submitting.value = true
  try {
    await $fetch(`/api/admin/sponsors/${props.message.id}`, { method: 'DELETE' })
    emit('deleted')
    close()
  } catch (error) {
    console.error('Failed to delete sponsor message', error)
    useToast().toast({ toast: 'soft-error', title: 'Error', description: 'Failed to delete sponsor message' })
  } finally {
    submitting.value = false
  }
}
</script>
