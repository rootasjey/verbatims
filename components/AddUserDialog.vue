<template>
  <NDialog v-model:open="isOpen" :una="{ dialogContent: 'md:max-w-md lg:max-w-lg' }">
    <div>
      <div class="mb-6">
        <h3 class="font-title uppercase text-size-4 font-600">Create User</h3>
      </div>

      <form @submit.prevent="submit" class="space-y-4">
        <NFormGroup label="Name" required>
          <NInput v-model="form.name" :disabled="submitting" placeholder="Jane Doe" />
        </NFormGroup>

        <NFormGroup label="Email" required>
          <NInput v-model="form.email" :disabled="submitting" type="email" placeholder="jane@example.com" />
        </NFormGroup>

        <NFormGroup label="Password" required>
          <NInput v-model="form.password" :disabled="submitting" type="password" placeholder="••••••••" />
          <template #help>
            <span class="text-xs text-gray-500">At least 8 characters</span>
          </template>
        </NFormGroup>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <NFormGroup label="Role" required>
            <NSelect v-model="form.role" :items="roleOptions" :disabled="submitting" item-key="label" value-key="label" />
          </NFormGroup>
          <div class="flex gap-4 justify-around items-center">
            <NFormGroup :label="form.is_active ? 'Active' : 'Inactive'">
              <NSwitch v-model="form.is_active" :disabled="submitting" />
            </NFormGroup>
            <NFormGroup :label="form.email_verified ? 'Verified' : 'Unverified'">
              <NSwitch v-model="form.email_verified" :disabled="submitting" />
            </NFormGroup>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NFormGroup label="Avatar URL">
            <NInput v-model="form.avatar_url" :disabled="submitting" type="url" placeholder="https://…" />
          </NFormGroup>
        </div>
      </form>

      <div class="mt-6 flex justify-end space-x-3">
        <NButton btn="light:soft dark:soft-white" @click="close" :disabled="submitting">Cancel</NButton>
        <NButton btn="soft-blue" :loading="submitting" @click="submit" :disabled="!canSubmit">Create User</NButton>
      </div>
    </div>
  </NDialog>
</template>
        </NFormGroup>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <NFormGroup label="Role" required>
            <NSelect v-model="form.role" :items="roleOptions" :disabled="submitting" item-key="label" value-key="label" />
          </NFormGroup>
          <div class="flex gap-4 justify-around items-center">
            <NFormGroup :label="form.is_active ? 'Active' : 'Inactive'">
              <NSwitch v-model="form.is_active" :disabled="submitting" />
            </NFormGroup>
            <NFormGroup :label="form.email_verified ? 'Verified' : 'Unverified'">
              <NSwitch v-model="form.email_verified" :disabled="submitting" />
            </NFormGroup>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NFormGroup label="Avatar URL">
            <NInput v-model="form.avatar_url" :disabled="submitting" type="url" placeholder="https://…" />
          </NFormGroup>
        </div>
      </form>

      <div class="mt-6 flex justify-end space-x-3">
        <NButton btn="light:soft dark:soft-white" @click="close" :disabled="submitting">Cancel</NButton>
        <NButton btn="soft-blue" :loading="submitting" @click="submit" :disabled="!canSubmit">Create User</NButton>
      </div>
    </div>
  </NDialog>
</template>

<script setup lang="ts">
interface Props { modelValue: boolean }
interface Emits {
  (e: 'update:modelValue', v: boolean): void
  (e: 'user-added'): void
}
const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({ get: () => props.modelValue, set: (v: boolean) => emit('update:modelValue', v) })

const roleOptions = [
  { label: 'User', value: 'user' },
  { label: 'Moderator', value: 'moderator' },
  { label: 'Admin', value: 'admin' }
]

const form = ref({
  name: '',
  email: '',
  password: '',
  role: 'user',
  is_active: true,
  email_verified: false,
  avatar_url: ''
})

const submitting = ref(false)
const canSubmit = computed(() => form.value.name.trim() && form.value.email.trim() && form.value.password.length >= 8)

const close = () => { isOpen.value = false }

const reset = () => {
  form.value = { name: '', email: '', password: '', role: 'user', is_active: true, email_verified: false, avatar_url: '' }
}

watch(isOpen, (open) => { if (!open) reset() })

const submit = async () => {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  try {
    await $fetch('/api/admin/users', { method: 'POST', body: form.value })
    useToast().toast({ toast: 'success', title: 'User created', description: `${form.value.name} has been created.` })
    emit('user-added')
    isOpen.value = false
  } catch (e: any) {
    console.error('Create user failed', e)
    useToast().toast({ toast: 'error', title: 'Error', description: e?.data?.statusMessage || 'Failed to create user' })
  } finally {
    submitting.value = false
  }
}
</script>
