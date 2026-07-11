<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('components.dialogs.delete_user') as string"
    :submit-text="$t('components.dialogs.delete') as string"
    :submitting="submitting"
    @submit="confirm"
  >
    <div class="space-y-4">
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start">
        <NIcon name="i-ph-warning" class="w-5 h-5 text-red-600 mt-0.5 mr-2" />
        <div class="text-sm text-red-800 dark:text-red-300">
          <p class="font-medium">{{ $t('components.dialogs.delete_permanent') }}</p>
          <p class="mt-1">{{ $t('components.dialogs.confirm_delete_desc') }} <span class="font-semibold">{{ user?.name }}</span>.</p>
        </div>
      </div>

      <div class="text-sm text-gray-700 dark:text-gray-300">
        <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('components.dialogs.delete_user_warning_list') }}</p>
      </div>
    </div>

    <template #submit>
      <NButton btn="soft-red" :loading="submitting" @click="confirm">{{ $t('common.delete') }}</NButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
interface AdminUser { id: number; name: string; role: 'user'|'moderator'|'admin' }
interface Props { modelValue: boolean; user: AdminUser | null }
interface Emits { (e: 'update:modelValue', v: boolean): void; (e: 'user-deleted'): void }
const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({ get: () => props.modelValue, set: (v: boolean) => emit('update:modelValue', v) })
const user = computed(() => props.user)
const { $t } = useI18n()
const submitting = ref(false)
const { showErrorToast } = useErrorToast()

const confirm = async () => {
  if (!user.value) return
  submitting.value = true
  try {
    await $fetch(`/api/admin/users/${user.value.id}`, { method: 'DELETE' })
    useToast().toast({ toast: 'soft-success', title: String($t('components.dialogs.delete_user')), description: `${user.value.name} has been deleted.` })
    emit('user-deleted')
    isOpen.value = false
  } catch (e: any) {
    console.error('Delete user failed', e)
    showErrorToast(e, { title: String($t('components.dialogs.toast_error')), fallback: String($t('components.dialogs.delete_user')) })
  } finally {
    submitting.value = false
  }
}
</script>
