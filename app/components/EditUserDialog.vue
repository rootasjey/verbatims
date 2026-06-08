<template>
  <AppDialog
    v-model="isOpen"
    title="Edit User"
    submit-text="Update"
    :submitting="submitting"
    :can-submit="!!user"
    max-width="md"
    @submit="submit"
  >
    <div v-if="user" class="space-y-6">
      <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
        <NAvatar :src="user.avatar_url" :alt="user.name" size="sm" />
        <div>
          <div class="text-sm font-medium text-gray-900 dark:text-white">{{ user.name }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">{{ user.email || '—' }}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">Role *</label>
          <NSelect v-model="roleModel" :items="roleOptions" :disabled="submitting || isSelf" item-key="label" value-key="label" />
          <p v-if="isSelf" class="text-amber-600 text-xs mt-1">You cannot change your own role.</p>
        </div>
        <div>
          <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">Active</label>
          <NSwitch v-model="form.is_active" :disabled="submitting || isSelf" />
          <p v-if="isSelf" class="text-amber-600 text-xs mt-1">You cannot deactivate your own account.</p>
        </div>
      </div>

      <div>
        <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">Email Verified</label>
        <NSwitch v-model="form.email_verified" :disabled="submitting" />
      </div>
    </div>

    <template #submit>
      <NButton btn="soft-blue" :loading="submitting" :disabled="!user" @click="submit">Update</NButton>
    </template>
  </AppDialog>
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

type Role = 'user' | 'moderator' | 'admin'
type RoleOption = { label: string; value: Role }

const roleOptions = [
  { label: 'User', value: 'user' },
  { label: 'Moderator', value: 'moderator' },
  { label: 'Admin', value: 'admin' }
] satisfies RoleOption[]

const form = ref({ role: 'user' as Role, is_active: true, email_verified: false })
const submitting = ref(false)

const roleModel = computed<RoleOption>({
  get: () => roleOptions.find(o => o.value === form.value.role) || roleOptions[0],
  set: (opt) => { form.value.role = opt.value }
})

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
