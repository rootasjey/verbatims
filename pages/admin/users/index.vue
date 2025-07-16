<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          User Management
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Manage user accounts, roles, and permissions
        </p>
      </div>
      <UButton
        variant="ghost"
        icon
        label="i-ph-arrow-left"
        to="/admin"
      >
        Back to Admin
      </UButton>
    </div>

    <!-- Filters and Search -->
    <div class="mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <UInput
            v-model="searchQuery"
            placeholder="Search users by name or email..."
            icon
            label="i-ph-magnifying-glass"
            @input="debouncedSearch"
          />
        </div>
        <USelect
          v-model="roleFilter"
          :items="roleOptions"
          @change="loadUsers"
        />
        <USelect
          v-model="statusFilter"
          :items="statusOptions"
          @change="loadUsers"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 10" :key="i" class="animate-pulse">
        <UCard>
          <div class="flex items-center space-x-4">
            <div class="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div class="flex-1">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Users Table -->
    <div v-else-if="users.length > 0">
      <UCard>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Activity
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="user in users"
                :key="user.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <UAvatar
                      :src="user.avatar_url"
                      :alt="user.name"
                      size="sm"
                      :ui="{ background: 'bg-primary-500 dark:bg-primary-400' }"
                    />
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ user.name }}
                      </div>
                      <div v-if="user.email" class="text-sm text-gray-500 dark:text-gray-400">
                        {{ user.email }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <UBadge :color="getRoleColor(user.role)" variant="subtle">
                    {{ user.role }}
                  </UBadge>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <UBadge :color="user.is_active ? 'green' : 'red'" variant="subtle">
                      {{ user.is_active ? 'Active' : 'Inactive' }}
                    </UBadge>
                    <UBadge v-if="user.email_verified" color="blue" variant="subtle" size="xs">
                      Verified
                    </UBadge>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <div>{{ user.approved_quotes }}/{{ user.quote_count }} quotes</div>
                  <div>{{ user.collection_count }} collections</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(user.created_at) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <UDropdown :items="getUserActions(user)">
                    <UButton
                      variant="ghost"
                      icon
                      label="i-ph-dots-three-vertical"
                      size="sm"
                    />
                  </UDropdown>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <UIcon name="i-ph-users" class="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No users found
      </h3>
      <p class="text-gray-500 dark:text-gray-400">
        {{ searchQuery ? 'Try adjusting your search terms' : 'No users match the current filters' }}
      </p>
    </div>

    <!-- Load More -->
    <div v-if="hasMore && !loading" class="text-center mt-8">
      <UButton
        variant="outline"
        :loading="loadingMore"
        @click="loadMore"
      >
        Load More Users
      </UButton>
    </div>

    <!-- Edit User Modal -->
    <UDialog v-model:open="showEditModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Edit User</h3>
        </template>

        <div v-if="selectedUser" class="space-y-4">
          <!-- User Info -->
          <div class="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <UAvatar
              :src="selectedUser.avatar_url"
              :alt="selectedUser.name"
              size="md"
              :ui="{ background: 'bg-primary-500 dark:bg-primary-400' }"
            />
            <div>
              <h4 class="font-medium text-gray-900 dark:text-white">{{ selectedUser.name }}</h4>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ selectedUser.email }}</p>
            </div>
          </div>

          <!-- Role Selection -->
          <UFormGroup label="Role">
            <USelect
              v-model="editForm.role"
              :items="editRoleOptions"
              :disabled="updating || selectedUser.id === currentUser.id"
            />
            <template #help>
              <span v-if="selectedUser.id === currentUser.id" class="text-amber-600">
                You cannot change your own role
              </span>
            </template>
          </UFormGroup>

          <!-- Status Toggle -->
          <UFormGroup label="Account Status">
            <UToggle
              v-model="editForm.is_active"
              :disabled="updating || selectedUser.id === currentUser.id"
            />
            <template #help>
              <span v-if="selectedUser.id === currentUser.id" class="text-amber-600">
                You cannot deactivate your own account
              </span>
            </template>
          </UFormGroup>

          <!-- Email Verification -->
          <UFormGroup label="Email Verification">
            <UToggle
              v-model="editForm.email_verified"
              :disabled="updating"
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              variant="ghost"
              @click="showEditModal = false"
              :disabled="updating"
            >
              Cancel
            </UButton>
            <UButton
              :loading="updating"
              @click="updateUser"
            >
              Update User
            </UButton>
          </div>
        </template>
      </UCard>
    </UDialog>
  </div>
</template>

<script setup>
// Require admin authentication
definePageMeta({
  middleware: 'admin'
})

// SEO
useHead({
  title: 'User Management - Admin - Verbatims'
})

const { user: currentUser } = useUserSession()

// Data
const users = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const updating = ref(false)
const hasMore = ref(false)
const currentPage = ref(1)
const searchQuery = ref('')
const roleFilter = ref('all')
const statusFilter = ref('all')

// Modals
const showEditModal = ref(false)
const selectedUser = ref(null)
const editForm = ref({
  role: '',
  is_active: true,
  email_verified: true
})

// Options
const roleOptions = [
  { label: 'All Roles', value: 'all' },
  { label: 'Users', value: 'user' },
  { label: 'Moderators', value: 'moderator' },
  { label: 'Admins', value: 'admin' }
]

const statusOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' }
]

const editRoleOptions = [
  { label: 'User', value: 'user' },
  { label: 'Moderator', value: 'moderator' },
  { label: 'Admin', value: 'admin' }
]

// Load users
const loadUsers = async (reset = true) => {
  try {
    if (reset) {
      loading.value = true
      currentPage.value = 1
    } else {
      loadingMore.value = true
    }

    const params = {
      page: currentPage.value,
      limit: 20
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    if (roleFilter.value !== 'all') {
      params.role = roleFilter.value
    }

    if (statusFilter.value !== 'all') {
      params.status = statusFilter.value
    }

    const response = await $fetch('/api/admin/users', { query: params })
    
    if (reset) {
      users.value = response.data
    } else {
      users.value.push(...response.data)
    }
    
    hasMore.value = response.pagination.hasMore
  } catch (error) {
    console.error('Failed to load users:', error)
    // TODO: Show error toast
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// Debounced search
const debouncedSearch = useDebounceFn(() => {
  loadUsers()
}, 300)

// Load more users
const loadMore = () => {
  currentPage.value++
  loadUsers(false)
}

// User actions
const getUserActions = (user) => [
  [{
    label: 'Edit User',
    icon: 'i-ph-pencil',
    click: () => editUser(user)
  }, {
    label: 'View Profile',
    icon: 'i-ph-user',
    click: () => navigateTo(`/users/${user.id}`) // TODO: Create user profile page
  }]
]

const editUser = (user) => {
  selectedUser.value = user
  editForm.value = {
    role: user.role,
    is_active: user.is_active,
    email_verified: user.email_verified
  }
  showEditModal.value = true
}

const updateUser = async () => {
  if (!selectedUser.value) return

  try {
    updating.value = true
    const response = await $fetch(`/api/admin/users/${selectedUser.value.id}/update`, {
      method: 'POST',
      body: editForm.value
    })

    // Update user in list
    const index = users.value.findIndex(u => u.id === selectedUser.value.id)
    if (index !== -1) {
      users.value[index] = response.data
    }

    showEditModal.value = false
    // TODO: Show success toast
  } catch (error) {
    console.error('Failed to update user:', error)
    // TODO: Show error toast
  } finally {
    updating.value = false
  }
}

// Utility functions
const getRoleColor = (role) => {
  switch (role) {
    case 'admin': return 'red'
    case 'moderator': return 'orange'
    default: return 'blue'
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

// Load initial data
onMounted(() => {
  loadUsers()
})

// Watch for filter changes
watch([roleFilter, statusFilter], () => {
  loadUsers()
})
</script>
