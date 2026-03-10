<template>
  <NDialog v-model:open="isOpen" :una="{ dialogContent: 'md:max-w-md lg:max-w-lg' }">
    <div>
      <div class="mb-2">
        <h3 class="font-title uppercase text-size-4 font-600 ml-4">Delete Selected Users</h3>
      </div>

      <div class="px-1 space-y-4">
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start">
          <NIcon name="i-ph-warning" class="w-5 h-5 text-red-600 mt-0.5 mr-2" />
          <div class="text-sm text-red-800 dark:text-red-300">
            <p class="font-medium">This action is permanent.</p>
            <p class="mt-1">
              {{ deletableCount > 0
                ? `You are about to delete ${deletableCount} ${deletableCount === 1 ? 'user' : 'users'}.`
                : 'There are no eligible users to delete in the current selection.' }}
            </p>
          </div>
        </div>

        <div class="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          <p>
            Selected: <span class="font-semibold">{{ selectedCount }}</span>
            <span class="mx-2">•</span>
            Will delete: <span class="font-semibold">{{ deletableCount }}</span>
          </p>
          <p v-if="selfSelectedCount > 0" class="text-amber-700 dark:text-amber-300">
            {{ selfSelectedCount }} {{ selfSelectedCount === 1 ? 'selected account is' : 'selected accounts are' }} your current session and will be skipped.
          </p>
          <p v-if="adminSelectedCount > 0" class="text-amber-700 dark:text-amber-300">
            {{ adminSelectedCount }} {{ adminSelectedCount === 1 ? 'selected user is' : 'selected users are' }} an admin and will be skipped. Use the single-user delete flow for admin accounts.
          </p>
        </div>

        <div v-if="previewUsers.length > 0" class="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          <p class="font-medium">Users to be deleted:</p>
          <div v-for="user in previewUsers" :key="user.id" class="border-l-2 border-gray-300 dark:border-gray-600 pl-3">
            <p class="font-medium">{{ user.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ user.email || 'No email' }}
              <span class="mx-1">•</span>
              {{ user.role }}
            </p>
          </div>
          <p v-if="deletableCount > previewUsers.length" class="text-xs text-gray-500 dark:text-gray-400">
            And {{ deletableCount - previewUsers.length }} more.
          </p>
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <NButton btn="light:soft dark:soft-white" @click="close" :disabled="deleting">Cancel</NButton>
        <NButton btn="soft-red" :loading="deleting" :disabled="deletableCount === 0" @click="confirm">Delete Users</NButton>
      </div>
    </div>
  </NDialog>
</template>

<script setup lang="ts">
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

const close = () => {
  isOpen.value = false
}

const confirm = () => {
  emit('bulk-delete')
}
</script>