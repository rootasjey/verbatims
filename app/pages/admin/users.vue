<template>
  <div class="group flex flex-col h-full">
    <!-- Table View -->
    <div class="flex-1 flex flex-col bg-white dark:bg-[#0C0A09]">
      <div class="users-table-container flex-1 overflow-auto">
        <NTable
          :columns="tableColumns"
          :data="users"
          :loading="loading"
          manual-pagination
          empty-text="No users found"
          empty-icon="i-ph-users"
        >
          <template #select-header>
            <div>
              <NCheckbox
                checkbox="gray"
                :model-value="allSelected"
                @update:model-value="toggleAllSelection"
              />
            </div>
          </template>

          <template #select-cell="{ cell }">
            <div class="items-center justify-center" :class="[
              Object.keys(rowSelection).length > 0 ? 'flex' : 'hidden',
              'group-hover:flex',
            ]">
              <NCheckbox
                checkbox="gray"
                :model-value="!!rowSelection[cell.row.original.id]"
                @click="e => handleRowCheckboxClick(e, cell.row.index, cell.row.original.id)"
              />
            </div>
          </template>

          <template #user-header>
            <div class="flex items-center gap-4">
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Users</h4>
              <div class="flex-1">
                <NInput
                  v-model="searchQuery"
                  placeholder="Search users by name or email..."
                  leading="i-ph-magnifying-glass"
                  size="md"
                  :loading="loading"
                  :trailing="searchQuery ? 'i-ph-x' : undefined"
                  :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
                  @trailing="resetFilters"
                />
              </div>
            </div>
          </template>

          <!-- User Column -->
          <template #user-cell="{ cell }">
            <div class="flex items-center space-x-3">
              <NAvatar :src="cell.row.original.avatar_url" :alt="cell.row.original.name" size="sm" />
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ cell.row.original.name }}</p>
                <p v-if="cell.row.original.email" class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ cell.row.original.email }}</p>
              </div>
            </div>
          </template>

          <!-- Role Column -->
          <template #role-header>
            <div>
              <NSelect
                v-model="selectedRoleFilter"
                :items="roleFilterOptions"
                placeholder="All Roles"
                size="sm"
                class="w-40"
                item-key="label"
                value-key="value"
              />
            </div>
          </template>

          <template #role-cell="{ cell }">
            <span :class="['inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', rolePillClass(cell.row.original.role)]">
              {{ cell.row.original.role }}
            </span>
          </template>

          <!-- Status Column -->
          <template #status-header>
            <div class="flex items-center gap-2">
              <NSelect
                v-model="selectedStatusFilter"
                :items="statusFilterOptions"
                placeholder="All Status"
                size="sm"
                class="w-40"
                item-key="label"
                value-key="value"
              />
            </div>
          </template>
          <template #status-cell="{ cell }">
            <div class="flex items-center gap-2">
              <span :class="['inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', cell.row.original.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300']">
                {{ cell.row.original.is_active ? 'Active' : 'Inactive' }}
              </span>
              <span v-if="cell.row.original.email_verified" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">Verified</span>
            </div>
          </template>

          <!-- Quotes Column -->
          <template #quotes-cell="{ cell }">
            <span class="text-sm text-gray-900 dark:text-white">
              {{ cell.row.original.approved_quotes }}/{{ cell.row.original.quote_count }}
            </span>
          </template>

          <!-- Collections Column -->
          <template #collections-cell="{ cell }">
            <span class="text-sm text-gray-900 dark:text-white">
              {{ cell.row.original.collection_count || 0 }}
            </span>
          </template>

          <!-- Joined Column -->
          <template #created-cell="{ cell }">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatRelativeTime(cell.row.original.created_at) }}
            </span>
          </template>

          <!-- Last Login Column -->
          <template #last_login-cell="{ cell }">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ cell.row.original.last_login_at ? formatRelativeTime(cell.row.original.last_login_at) : '—' }}
            </span>
          </template>

          <!-- Actions Column -->
          <template #actions-header>
            <div class="flex items-center justify-center space-x-1">
              <span v-if="selectedIds.length > 0">{{ selectedIds.length }}</span>
              <NTooltip :_tooltip-content="{
                class: 'py-2 light:bg-gray-100 dark:bg-gray-950 light:b-gray-2 dark:b-gray-9 shadow-lg dark:shadow-gray-800/50',
              }">
                <template #default>
                  <NIcon name="i-ph-info" class="mr-2 w-4 h-4 text-gray-500 dark:text-gray-400 cursor-pointer" />
                </template>
                <template #content>
                  <div class="space-y-2">
                    <div class="flex">
                      <NBadge badge="solid-gray" size="xs" icon="i-ph-selection-background" class="w-full">
                        {{ totalUsers }} Total
                      </NBadge>
                    </div>

                    <div class="flex">
                      <NBadge badge="solid-blue" size="xs" icon="i-ph-exclamation-mark" class="w-full">
                        {{ activeOnPage }} {{ activeOnPage === 1 ? 'Active' : 'Actives' }}
                      </NBadge>
                    </div>
                    <div class="flex">
                      <NBadge badge="solid-orange" size="xs" icon="i-ph-user" class="w-full">
                        {{ moderatorsOnPage }} {{ moderatorsOnPage === 1 ? 'Moderator' : 'Moderators' }}
                      </NBadge>
                    </div>
                  </div>
                </template>
              </NTooltip>

              <NDropdownMenu :items="headerActions">
                <NButton size="xs" btn="ghost-gray" icon label="i-ph-caret-down" class="hover:bg-gray-200 dark:hover:bg-gray-900" />
              </NDropdownMenu>
            </div>
          </template>

          <template #actions-cell="{ cell }">
            <NDropdownMenu :items="getUserActions(cell.row.original)">
              <NButton icon btn="ghost-gray" size="xs" label="i-ph-dots-three-vertical" class="hover:bg-gray-200 dark:hover:bg-gray-700/50" />
            </NDropdownMenu>
          </template>
        </NTable>
      </div>

      <div class="flex-shrink-0 flex items-center justify-between p-4">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Page {{ currentPage }} of {{ totalPages }} • {{ totalUsers }} total users
        </div>
        <NPagination
          v-model:page="currentPage"
          :total="totalUsers"
          :items-per-page="pageSize"
          :sibling-count="2"
          show-edges
          size="sm"
          pagination-selected="solid-indigo" 
        />
      </div>
    </div>
  </div>

  <AddUserDialog
    v-model="showAddUserDialog"
    @user-added="onUserAdded"
  />

  <EditUserDialog
    v-model="showEditUserDialog"
    :user="selectedUser"
    @user-updated="onUserUpdated"
  />

  <DeleteUserDialog
    v-model="showDeleteUserDialog"
    :user="userToDelete"
    @user-deleted="onUserDeleted"
  />

  <DeleteUsersBulkDialog
    v-model:open="showBulkDeleteDialog"
    :deleting="bulkDeleting"
    :selected-users="selectedUsers"
    :current-user-id="currentUser?.id"
    @bulk-delete="bulkDeleteUsers"
  />
</template>

<script setup lang="ts">
import { formatRelativeTime } from '~/utils/time-formatter'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({ title: 'Users - Admin - Verbatims' })

const { user: currentUser } = useUserSession()

const loading = ref(false)
const bulkDeleting = ref(false)
const users = ref<AdminUser[]>([])
const totalUsers = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchQuery = ref('')
const selectedRoleFilter = ref({ label: 'All Roles', value: '' })
const selectedStatusFilter = ref({ label: 'All Status', value: '' })

// --- multi-select state (copied from messages.vue) ---
const rowSelection: Ref<Record<number, boolean>> = ref({})
const lastSelectedIndex = ref<number | null>(null)

const selectedIds = computed(() =>
  Object.entries(rowSelection.value)
    .filter(([, v]) => !!v)
    .map(([k]) => Number(k))
)

const allSelected = computed<boolean | 'indeterminate'>({
  get: () => {
    const total = users.value.length
    const count = selectedIds.value.length
    if (total === 0) return false
    if (count === total) return true
    if (count > 0) return 'indeterminate'
    return false
  },
  set: (v) => {
    const newSelection: Record<number, boolean> = {}
    if (v === true) {
      users.value.forEach(u => { newSelection[u.id] = true })
    }
    rowSelection.value = newSelection
    lastSelectedIndex.value = null // reset range anchor when toggling all
  }
})

const toggleAllSelection = (v: boolean | 'indeterminate') => {
  if (v) {
    const newSelection: Record<number, boolean> = {}
    users.value.forEach(u => { newSelection[u.id] = true })
    rowSelection.value = newSelection
  } else {
    rowSelection.value = {}
  }
  lastSelectedIndex.value = null
}

const handleRowCheckboxClick = (event: MouseEvent, index: number, id: number) => {
  const currently = !!rowSelection.value[id]
  const newVal = !currently

  if (event.shiftKey && lastSelectedIndex.value !== null) {
    const start = Math.min(lastSelectedIndex.value, index)
    const end = Math.max(lastSelectedIndex.value, index)
    for (let i = start; i <= end; i += 1) {
      const row = users.value[i]
      if (row) rowSelection.value[row.id] = newVal
    }
  } else {
    rowSelection.value[id] = newVal
  }

  lastSelectedIndex.value = index
}

// helper that returns selected user objects (may be useful later)
const selectedUsers = computed(() => {
  const ids = selectedIds.value
  return ids.length > 0
    ? users.value.filter(u => ids.includes(u.id))
    : []
})

// -----------------------------------------------------

const showAddUserDialog = ref(false)
const showEditUserDialog = ref(false)
const showDeleteUserDialog = ref(false)
const showBulkDeleteDialog = ref(false)
const selectedUser = ref<AdminUser | null>(null)
const userToDelete = ref<AdminUser | null>(null)

const roleFilterOptions = [
  { label: 'All Roles', value: '' },
  { label: 'Users', value: 'user' },
  { label: 'Moderators', value: 'moderator' },
  { label: 'Admins', value: 'admin' }
]

const statusFilterOptions = [
  { label: 'All Status', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' }
]

const totalPages = computed(() => Math.ceil(totalUsers.value / pageSize.value))

const activeOnPage = computed(() => users.value.filter(u => !!u.is_active).length)
const moderatorsOnPage = computed(() => users.value.filter(u => u.role === 'moderator').length)
const totalQuotesOnPage = computed(() => users.value.reduce((sum, u) => sum + (u.quote_count || 0), 0))

const tableColumns = [
  { header: '', accessorKey: 'select', enableSorting: false, meta: { una: { tableHead: 'w-6', tableCell: 'w-6' } } },
  { header: 'User', accessorKey: 'user', enableSorting: false, meta: { una: { tableHead: 'min-w-60', tableCell: 'min-w-60' } } },
  { header: 'Role', accessorKey: 'role', enableSorting: false, meta: { una: { tableHead: 'w-28', tableCell: 'w-28' } } },
  { header: 'Status', accessorKey: 'status', enableSorting: false, meta: { una: { tableHead: 'w-40', tableCell: 'w-40' } } },
  { header: 'Quotes', accessorKey: 'quotes', enableSorting: false, meta: { una: { tableHead: 'w-24', tableCell: 'w-24' } } },
  { header: 'Collections', accessorKey: 'collections', enableSorting: false, meta: { una: { tableHead: 'w-28', tableCell: 'w-28' } } },
  { header: 'Joined', accessorKey: 'created', enableSorting: false, meta: { una: { tableHead: 'w-32', tableCell: 'w-32' } } },
  { header: 'Last login', accessorKey: 'last_login', enableSorting: false, meta: { una: { tableHead: 'w-32', tableCell: 'w-32' } } },
  { header: '', accessorKey: 'actions', enableSorting: false, meta: { una: { tableHead: 'w-16', tableCell: 'w-16' } } },
]

const headerActions = computed(() => {
  const actions: Array<any> = []
  if (selectedIds.value.length > 0) {
    actions.push({
      label: `Delete ${selectedIds.value.length} selected`,
      leading: 'i-ph-trash',
      onclick: () => { showBulkDeleteDialog.value = true }
    })
    actions.push({})
  }
  
  if (actions.length > 0) actions.push({})
  actions.push({
    label: 'Add New User',
    leading: 'i-ph-plus',
    onclick: () => { showAddUserDialog.value = true }
  })

  actions.push({})
  actions.push({ label: 'Refresh', leading: 'i-ph-arrows-clockwise', onclick: () => loadUsers() })
  actions.push({ label: 'Reset Filters', leading: 'i-ph-x', onclick: () => resetFilters() })
  return actions
})

const rolePillClass = (role: UserRole) => {
  switch (role) {
    case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
    case 'moderator': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
    default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
  }
}

const loadUsers = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/admin/users', {
      query: {
        page: currentPage.value,
        limit: pageSize.value,
        search: searchQuery.value || undefined,
        role: selectedRoleFilter.value.value || undefined,
        status: selectedStatusFilter.value.value || undefined
      }
    })

    users.value = response.data || []
    totalUsers.value = response.pagination?.total || 0
    // clear any existing selection when data refreshes
    rowSelection.value = {}
    lastSelectedIndex.value = null
  } catch (error: any) {
    console.error('Failed to load users:', error)
    useToast().toast({ title: 'Error', description: 'Failed to load users', toast: 'error' })
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedRoleFilter.value = roleFilterOptions[0]
  selectedStatusFilter.value = statusFilterOptions[0]
  currentPage.value = 1
  rowSelection.value = {}
  lastSelectedIndex.value = null
}

const getUserActions = (user: AdminUser) => [
  { label: 'View Profile', leading: 'i-ph-user', onclick: () => navigateTo(`/users/${user.id}`) },
  { label: 'Edit User', leading: 'i-ph-pencil', onclick: () => editUser(user) },
  {},
  { label: 'Delete User', leading: 'i-ph-trash', onclick: () => deleteUser(user) }
]

const editUser = (user: AdminUser) => {
  selectedUser.value = user
  showEditUserDialog.value = true
}

const deleteUser = (user: AdminUser) => {
  userToDelete.value = user
  showDeleteUserDialog.value = true
}

const onUserAdded = () => {
  showAddUserDialog.value = false
  loadUsers()
}

const onUserUpdated = () => {
  showEditUserDialog.value = false
  selectedUser.value = null
  loadUsers()
}

const onUserDeleted = () => {
  showDeleteUserDialog.value = false
  userToDelete.value = null
  if (users.value.length <= 1 && currentPage.value > 1) currentPage.value = currentPage.value - 1
  loadUsers()
}

const bulkDeleteUsers = async () => {
  if (selectedIds.value.length === 0) return

  bulkDeleting.value = true
  try {
    const response = await fetch('/api/admin/users/bulk-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids: selectedIds.value })
    })

    const payload = await response.json() as {
      deletedCount?: number
      skipped?: { self?: number, admins?: number, notFound?: number }
      statusMessage?: string
    }

    if (!response.ok) {
      throw createError({ statusCode: response.status, statusMessage: payload?.statusMessage || 'Failed to delete selected users' })
    }

    const deletedCount = payload.deletedCount || 0
    const skippedSelf = payload.skipped?.self || 0
    const skippedAdmins = payload.skipped?.admins || 0
    const skippedNotFound = payload.skipped?.notFound || 0

    useToast().toast({
      toast: skippedSelf || skippedAdmins || skippedNotFound ? 'warning' : 'success',
      title: deletedCount > 0
        ? `Deleted ${deletedCount} ${deletedCount === 1 ? 'user' : 'users'}`
        : 'No users deleted',
      description: [
        skippedSelf ? `${skippedSelf} self skipped` : '',
        skippedAdmins ? `${skippedAdmins} admin skipped` : '',
        skippedNotFound ? `${skippedNotFound} missing` : ''
      ].filter(Boolean).join(' · ') || undefined
    })

    showBulkDeleteDialog.value = false
    rowSelection.value = {}
    lastSelectedIndex.value = null

    if (deletedCount > 0 && users.value.length === deletedCount && currentPage.value > 1) {
      currentPage.value = currentPage.value - 1
    }

    await loadUsers()
  } catch (error: any) {
    console.error('Bulk delete users failed:', error)
    useToast().toast({
      toast: 'error',
      title: 'Bulk delete failed',
      description: error?.data?.statusMessage || 'Failed to delete selected users'
    })
  } finally {
    bulkDeleting.value = false
  }
}

watchDebounced([currentPage, searchQuery, selectedRoleFilter, selectedStatusFilter], () => {
  loadUsers()
}, { debounce: 300 })

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.users-table-container {
  max-height: calc(100vh - 20rem);
}
</style>
