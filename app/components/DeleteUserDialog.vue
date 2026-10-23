<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('components.dialogs.delete_user') as string"
    :submitting="submitting"
    :can-submit="!deleteDisabled"
    cancel-button-class="min-h-10 px-4"
    max-width="md"
    @submit="confirm"
  >
    <div class="space-y-5">
      <div class="min-w-0">
        <p class="break-words font-semibold text-gray-900 dark:text-gray-100">
          {{ user?.name }} <span class="font-normal text-gray-500 dark:text-gray-400">· #{{ user?.id }}</span>
        </p>
        <p v-if="user?.email" class="mt-1 break-all text-sm text-gray-500 dark:text-gray-400">{{ user.email }}</p>
      </div>

      <DeleteWarningPanel>
        <p>{{ $t('components.dialogs.confirm_delete_desc') }}</p>
        <p class="mt-1">{{ $t('components.dialogs.delete_user_single_warning') }}</p>
      </DeleteWarningPanel>
    </div>

    <template #submit>
      <NButton :btn="deleteDisabled ? 'soft-gray' : 'solid-red'" :disabled="deleteDisabled" :loading="submitting" class="min-h-10 px-4" @click="confirm">
        {{ $t('common.delete') }}
      </NButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
interface AdminUser { id: number; name: string; email?: string; role: 'user'|'moderator'|'admin' }
interface Props { modelValue: boolean; user: AdminUser | null }
interface Emits { (e: 'update:modelValue', v: boolean): void; (e: 'user-deleted'): void }
const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({ get: () => props.modelValue, set: (v: boolean) => emit('update:modelValue', v) })
const user = computed(() => props.user)
const { $t } = useI18n()
const submitting = ref(false)
const { user: currentUser } = useUserSession()
const { showErrorToast } = useErrorToast()
const deleteDisabled = computed(() => submitting.value || !user.value || user.value.id === Number(currentUser.value?.id))

const confirm = async () => {
  const targetUser = user.value
  if (!targetUser || submitting.value || targetUser.id === Number(currentUser.value?.id)) return
  submitting.value = true
  try {
    const deleteUserPath = `/api/admin/users/${targetUser.id}` as '/api/admin/users/:id'
    await $fetch<{ success: boolean }, '/api/admin/users/:id'>(deleteUserPath, { method: 'DELETE' })
    useToast().toast({ toast: 'soft-success', title: String($t('components.dialogs.delete_user')), description: `${targetUser.name} has been deleted.` })
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
