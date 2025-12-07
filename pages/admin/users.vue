<template>
  <div class="frame flex flex-col h-full">
    <div class="flex-shrink-0 bg-gray-50 dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-700 pb-6 mb-6">
      <div class="mb-6">
        <h1 class="font-title text-size-12 font-bold text-gray-900 dark:text-white">
          Users
        </h1>
        <p class="-mt-4 font-body text-gray-600 dark:text-gray-400">
          Manage user accounts, roles and permissions.
        </p>
      </div>

      <!-- Search and Filters -->
      <div class="flex flex-col sm:flex-row gap-4">
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
        <div class="flex gap-2">
          <NSelect
            v-model="selectedRoleFilter"
            :items="roleFilterOptions"
            placeholder="All Roles"
            size="sm"
            class="w-40"
            item-key="label"
            value-key="value"
          />
          <NSelect
            v-model="selectedStatusFilter"
            :items="statusFilterOptions"
            placeholder="All Status"
            size="sm"
            class="w-40"
            item-key="label"
            value-key="value"
          />
          <NButton btn="soft-blue" @click="showAddUserDialog = true" size="sm">
            <NIcon name="i-ph-plus" class="w-4 h-4 mr-2" />
            Create User
          </NButton>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <NIcon name="i-ph-users" class="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ totalUsers }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <NIcon name="i-ph-check-circle" class="w-5 h-5 text-green-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Active (page)</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ activeOnPage }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <NIcon name="i-ph-shield" class="w-5 h-5 text-amber-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Moderators</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ moderatorsOnPage }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-[#0C0A09] rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center">
            <NIcon name="i-ph-quotes" class="w-5 h-5 text-orange-600 mr-2" />
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Quotes (page)</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ totalQuotesOnPage }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

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
          <!-- Actions Column -->
          <template #actions-cell="{ cell }">
            <NDropdownMenu :items="getUserActions(cell.row.original)">
              <NButton icon btn="ghost" size="sm" label="i-ph-dots-three-vertical" />
            </NDropdownMenu>
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
          <template #role-cell="{ cell }">
            <span :class="['inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', rolePillClass(cell.row.original.role)]">
              {{ cell.row.original.role }}
            </span>
          </template>

          <!-- Status Column -->
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
</template><script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({ title: 'Users - Admin - Verbatims' })

const loading = ref(false)
const users = ref<AdminUser[]>([])
const totalUsers = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchQuery = ref('')
const selectedRoleFilter = ref({ label: 'All Roles', value: '' })
const selectedStatusFilter = ref({ label: 'All Status', value: '' })

const showAddUserDialog = ref(false)
const showEditUserDialog = ref(false)
const showDeleteUserDialog = ref(false)
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
  { header: '', accessorKey: 'actions', enableSorting: false, meta: { una: { tableHead: 'w-16', tableCell: 'w-16' } } },
  { header: 'User', accessorKey: 'user', enableSorting: false, meta: { una: { tableHead: 'min-w-60', tableCell: 'min-w-60' } } },
  { header: 'Role', accessorKey: 'role', enableSorting: false, meta: { una: { tableHead: 'w-28', tableCell: 'w-28' } } },
  { header: 'Status', accessorKey: 'status', enableSorting: false, meta: { una: { tableHead: 'w-40', tableCell: 'w-40' } } },
  { header: 'Quotes', accessorKey: 'quotes', enableSorting: false, meta: { una: { tableHead: 'w-24', tableCell: 'w-24' } } },
  { header: 'Collections', accessorKey: 'collections', enableSorting: false, meta: { una: { tableHead: 'w-28', tableCell: 'w-28' } } },
  { header: 'Joined', accessorKey: 'created', enableSorting: false, meta: { una: { tableHead: 'w-32', tableCell: 'w-32' } } },
  { header: 'Last login', accessorKey: 'last_login', enableSorting: false, meta: { una: { tableHead: 'w-32', tableCell: 'w-32' } } }
]

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

// Utility function for relative time formatting
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`

  return date.toLocaleDateString()
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
