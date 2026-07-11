<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('components.dialogs.delete_sponsor') as string"
    :submit-text="$t('common.delete') as string"
    :submitting="submitting"
    @submit="confirmDelete"
  >
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
      {{ $t('components.dialogs.confirm_delete') }}
      <br>
      <span class="font-medium">"{{ message?.message }}"</span>
    </p>

    <template #submit>
      <NButton btn="soft-red" :loading="submitting" @click="confirmDelete">{{ $t('common.delete') }}</NButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
interface Props { modelValue: boolean; message: { id: number; message: string } | null }
interface Emits { (e: 'update:modelValue', v: boolean): void; (e: 'deleted'): void }

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const isOpen = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) })
const { $t } = useI18n()
const submitting = ref(false)
const { showErrorToast } = useErrorToast()

const confirmDelete = async () => {
  if (!props.message) return
  submitting.value = true
  try {
    await $fetch(`/api/admin/sponsors/${props.message.id}`, { method: 'DELETE' })
    emit('deleted')
    isOpen.value = false
  } catch (error) {
    console.error('Failed to delete sponsor message', error)
    showErrorToast(error, { title: String($t('components.dialogs.toast_error')), fallback: String($t('components.dialogs.delete_sponsor')) })
  } finally {
    submitting.value = false
  }
}
</script>
