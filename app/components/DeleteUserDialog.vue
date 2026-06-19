<template>
  <AppDialog
    v-model="isOpen"
    title="Delete User"
    submit-text="Delete User"
    :submitting="submitting"
    @submit="confirm"
  >
    <div class="space-y-4">
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start">
        <NIcon name="i-ph-warning" class="w-5 h-5 text-red-600 mt-0.5 mr-2" />
        <div class="text-sm text-red-800 dark:text-red-300">
          <p class="font-medium">This action is permanent.</p>
          <p class="mt-1">You're about to delete the user <span class="font-semibold">{{ user?.name }}</span>.</p>
        </div>
      </div>

      <div class="text-sm text-gray-700 dark:text-gray-300">
        <ul class="list-disc ml-5 space-y-1">
          <li>The user will lose access to their account.</li>
          <li>Quotes authored by the user will remain linked to their user ID.</li>
          <li>You cannot delete your own account, nor the last remaining admin.</li>
        </ul>
      </div>
    </div>

    <template #submit>
      <NButton btn="soft-red" :loading="submitting" @click="confirm">Delete User</NButton>
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
const submitting = ref(false)
const { showErrorToast } = useErrorToast()

const confirm = async () => {
  if (!user.value) return
  submitting.value = true
  try {
    await $fetch(`/api/admin/users/${user.value.id}`, { method: 'DELETE' })
    useToast().toast({ toast: 'success', title: 'User deleted', description: `${user.value.name} has been deleted.` })
    emit('user-deleted')
    isOpen.value = false
  } catch (e: any) {
    console.error('Delete user failed', e)
    showErrorToast(e, { title: 'Error', fallback: 'Failed to delete user' })
  } finally {
    submitting.value = false
  }
}
</script>
