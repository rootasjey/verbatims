<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('components.dialogs.add_user') as string"
    :submit-text="$t('components.dialogs.create') as string"
    :submitting="submitting"
    :can-submit="canSubmit"
    @submit="submit"
  >
    <form @submit.prevent="submit" @keydown.ctrl.enter.prevent="submit" @keydown.meta.enter.prevent="submit" class="space-y-6">
      <NInput
        v-model="form.name"
        :placeholder="$t('components.dialogs.placeholder_name') as string"
        :disabled="submitting"
        required
        class="bg-white dark:bg-gray-900 b-none shadow-none"
        :una="{ inputTrailingWrapper: 'pr-1.5' }"
      >
        <template #trailing>
          <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
            {{ $t('components.dialogs.name') }}
          </NBadge>
        </template>
      </NInput>

      <NInput
        v-model="form.email"
        type="email"
        :placeholder="$t('auth.email_placeholder') as string"
        :disabled="submitting"
        required
        class="bg-white dark:bg-gray-900 b-none shadow-none"
        :una="{ inputTrailingWrapper: 'pr-1.5' }"
      >
        <template #trailing>
          <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
            {{ $t('auth.email_label') }}
          </NBadge>
        </template>
      </NInput>

      <div>
        <PasswordInput v-model="form.password" :placeholder="$t('auth.password_placeholder') as string" :disabled="submitting" required />
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ $t('auth.password_min_chars') }}</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <div>
          <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">{{ $t('components.dialogs.role_label') }}</label>
          <NSelect v-model="roleModel" :items="roleOptions" select="soft-blue" select-item="blue" :disabled="submitting" item-key="label" value-key="label" />
        </div>
        <div class="flex gap-4 justify-around items-center">
          <div>
            <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">{{ form.is_active ? $t('components.dialogs.user_active') : $t('components.dialogs.user_inactive') }}</label>
            <NSwitch v-model="form.is_active" switch-checked="blue" :disabled="submitting" />
          </div>
          <div>
            <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">{{ form.email_verified ? $t('components.dialogs.user_verified') : $t('components.dialogs.user_unverified') }}</label>
            <NSwitch v-model="form.email_verified" switch-checked="blue" :disabled="submitting" />
          </div>
        </div>
      </div>

      <NInput
        v-model="form.avatar_url"
        type="url"
        :placeholder="$t('components.dialogs.placeholder_url') as string"
        :disabled="submitting"
        class="bg-white dark:bg-gray-900 b-none shadow-none"
        :una="{ inputTrailingWrapper: 'pr-1.5' }"
      >
        <template #trailing>
          <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
            {{ $t('components.dialogs.image_url') }}
          </NBadge>
        </template>
      </NInput>
    </form>
  </AppDialog>
</template>

<script setup lang="ts">
interface Props { modelValue: boolean }
interface Emits {
  (e: 'update:modelValue', v: boolean): void
  (e: 'user-added'): void
}
const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { $t } = useI18n()

const isOpen = computed({ get: () => props.modelValue, set: (v: boolean) => emit('update:modelValue', v) })

type Role = 'user' | 'moderator' | 'admin'
type RoleOption = { label: string; value: Role }

const roleOptions = computed<RoleOption[]>(() => [
  { label: String($t('components.dialogs.role_user')), value: 'user' },
  { label: String($t('components.dialogs.role_moderator')), value: 'moderator' },
  { label: String($t('components.dialogs.role_admin')), value: 'admin' }
])

const form = ref({
  name: '',
  email: '',
  password: '',
  role: 'user' as Role,
  is_active: true,
  email_verified: false,
  avatar_url: ''
})

const roleModel = computed({
  get: () => roleOptions.value.find(o => o.value === form.value.role) ?? roleOptions.value[0]!,
  set: (opt: RoleOption) => { form.value.role = opt.value }
})

const submitting = ref(false)
const canSubmit = computed(() => !!(form.value.name.trim() && form.value.email.trim() && form.value.password.length >= 8))
const { showErrorToast } = useErrorToast()

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
    useToast().toast({ toast: 'success', title: String($t('components.dialogs.toast_created')), description: `${form.value.name} ${String($t('common.created'))}` })
    emit('user-added')
    isOpen.value = false
  } catch (e: any) {
    console.error('Create user failed', e)
    showErrorToast(e, { title: String($t('components.dialogs.toast_error')), fallback: String($t('components.dialogs.toast_error')) })
  } finally {
    submitting.value = false
  }
}
</script>
