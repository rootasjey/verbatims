<template>
  <AppDialog
    v-model="isOpen"
    title="Delete Sponsor Message"
    submit-text="Delete"
    :submitting="submitting"
    @submit="confirmDelete"
  >
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
      Are you sure you want to delete this sponsor message?
      <br>
      <span class="font-medium">"{{ message?.message }}"</span>
    </p>

    <template #submit>
      <NButton btn="soft-red" :loading="submitting" @click="confirmDelete">Delete</NButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
interface Props { modelValue: boolean; message: { id: number; message: string } | null }
interface Emits { (e: 'update:modelValue', v: boolean): void; (e: 'deleted'): void }

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const isOpen = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) })
const submitting = ref(false)

const confirmDelete = async () => {
  if (!props.message) return
  submitting.value = true
  try {
    await $fetch(`/api/admin/sponsors/${props.message.id}`, { method: 'DELETE' })
    emit('deleted')
    isOpen.value = false
  } catch (error) {
    console.error('Failed to delete sponsor message', error)
    useToast().toast({ toast: 'soft-error', title: 'Error', description: 'Failed to delete sponsor message' })
  } finally {
    submitting.value = false
  }
}
</script>
