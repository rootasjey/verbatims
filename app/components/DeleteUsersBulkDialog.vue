<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('components.dialogs.delete_users_selected') as string"
    :submit-text="$t('components.dialogs.delete') as string"
    :submitting="deleting"
    :can-submit="deletableCount > 0"
    @submit="confirm"
  >
    <div class="space-y-4">
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start">
        <NIcon name="i-ph-warning" class="w-5 h-5 text-red-600 mt-0.5 mr-2" />
        <div class="text-sm text-red-800 dark:text-red-300">
          <p class="font-medium">{{ $t('components.dialogs.delete_permanent') }}</p>
          <p class="mt-1">
            {{ deletableCount > 0
              ? $t('components.dialogs.delete_users_selected_desc', { n: deletableCount })
              : $t('components.dialogs.delete_users_none_eligible') }}
          </p>
        </div>
      </div>

      <div class="text-sm text-gray-700 dark:text-gray-300 space-y-2">
        <p>
          {{ $t('components.dialogs.selected_label') }} <span class="font-semibold">{{ selectedCount }}</span>
          <span class="mx-2">•</span>
          {{ $t('components.dialogs.will_delete') }} <span class="font-semibold">{{ deletableCount }}</span>
        </p>
        <p v-if="selfSelectedCount > 0" class="text-amber-700 dark:text-amber-300">
          {{ $t('components.dialogs.delete_user_warning_list') }}
        </p>
        <p v-if="adminSelectedCount > 0" class="text-amber-700 dark:text-amber-300">
          {{ $t('components.dialogs.delete_user_warning_list') }}
        </p>
      </div>

      <div v-if="previewUsers.length > 0" class="text-sm text-gray-700 dark:text-gray-300 space-y-2">
        <p class="font-medium">{{ $t('components.dialogs.users_to_delete') }}</p>
        <div v-for="user in previewUsers" :key="user.id" class="border-l-2 border-gray-300 dark:border-gray-600 pl-3">
          <p class="font-medium">{{ user.name }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ user.email || $t('common.na') }}
            <span class="mx-1">•</span>
            {{ user.role }}
          </p>
        </div>
        <p v-if="deletableCount > previewUsers.length" class="text-xs text-gray-500 dark:text-gray-400">
          {{ $t('components.dialogs.and_n_more', { n: deletableCount - previewUsers.length }) }}
        </p>
      </div>
    </div>

    <template #submit>
      <NButton btn="soft-red" :loading="deleting" :disabled="deletableCount === 0" @click="confirm">{{ $t('common.delete') }}</NButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
const { $t } = useI18n()

interface AdminUser { id: number; name: string; email?: string; role: 'user'|'moderator'|'admin' }
interface Props {
  open: boolean
  deleting: boolean
  selectedUsers: AdminUser[]
  currentUserId?: number | null
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'bulk-delete'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit('update:open', v)
})

const selectedCount = computed(() => props.selectedUsers.length)
const selfSelectedCount = computed(() => props.selectedUsers.filter(user => user.id === props.currentUserId).length)
const adminSelectedCount = computed(() => props.selectedUsers.filter(user => user.role === 'admin').length)
const deletableUsers = computed(() => props.selectedUsers.filter(user => user.id !== props.currentUserId && user.role !== 'admin'))
const deletableCount = computed(() => deletableUsers.value.length)
const previewUsers = computed(() => deletableUsers.value.slice(0, 3))

const confirm = () => {
  emit('bulk-delete')
}
</script>
