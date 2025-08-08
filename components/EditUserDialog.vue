<template>
  <UDialog v-model:open="isOpen" :una="{ dialogContent: 'md:max-w-md lg:max-w-lg' }">
    <div>
      <div class="mb-3">
        <h3 class="font-title uppercase text-size-4 font-600">Edit User</h3>
      </div>

      <div v-if="user" class="space-y-4">
        <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
          <UAvatar :src="user.avatar_url" :alt="user.name" size="sm" />
          <div>
            <div class="text-sm font-medium text-gray-900 dark:text-white">{{ user.name }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{{ user.email || '—' }}</div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormGroup label="Role" required>
            <USelect v-model="form.role" :items="roleOptions" :disabled="submitting || isSelf" />
            <template #help>
              <span v-if="isSelf" class="text-amber-600 text-xs">You cannot change your own role.</span>
            </template>
          </UFormGroup>
          <UFormGroup label="Active">
            <USwitch v-model="form.is_active" :disabled="submitting || isSelf" />
            <template #help>
              <span v-if="isSelf" class="text-amber-600 text-xs">You cannot deactivate your own account.</span>
            </template>
          </UFormGroup>
        </div>

        <UFormGroup label="Email Verified">
          <USwitch v-model="form.email_verified" :disabled="submitting" />
        </UFormGroup>
      </div>

      <div class="mt-6 flex justify-end space-x-3">
        <UButton btn="light:soft dark:soft-white" @click="close" :disabled="submitting">Cancel</UButton>
        <UButton btn="soft-blue" :loading="submitting" @click="submit" :disabled="!user">Update</UButton>
      </div>
    </div>
  </UDialog>
</template>

<script setup lang="ts">
interface AdminUser { id: number; name: string; email?: string; avatar_url?: string; role: 'user'|'moderator'|'admin'; is_active: boolean|0|1; email_verified: boolean|0|1 }
interface Props { modelValue: boolean; user: AdminUser | null }
interface Emits { (e: 'update:modelValue', v: boolean): void; (e: 'user-updated'): void }
const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { user: currentUser } = useUserSession()

const isOpen = computed({ get: () => props.modelValue, set: (v: boolean) => emit('update:modelValue', v) })
const user = computed(() => props.user)
const isSelf = computed(() => user.value?.id === currentUser.value?.id)

const roleOptions = [
  { label: 'User', value: 'user' },
  { label: 'Moderator', value: 'moderator' },
  { label: 'Admin', value: 'admin' }
]

const form = ref({ role: 'user', is_active: true, email_verified: false })
const submitting = ref(false)

watch(user, (u) => {
  if (u) {
    form.value = { role: u.role, is_active: !!u.is_active, email_verified: !!u.email_verified }
  }
}, { immediate: true })

const close = () => { isOpen.value = false }

const submit = async () => {
  if (!user.value) return
  submitting.value = true
  try {
    await $fetch(`/api/admin/users/${user.value.id}/update`, { method: 'POST', body: form.value })
    useToast().toast({ toast: 'success', title: 'User updated', description: `${user.value.name} has been updated.` })
    emit('user-updated')
    isOpen.value = false
  } catch (e: any) {
    console.error('Update user failed', e)
    useToast().toast({ toast: 'error', title: 'Error', description: e?.data?.statusMessage || 'Failed to update user' })
  } finally {
    submitting.value = false
  }
}
</script>
