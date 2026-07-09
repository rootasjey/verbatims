<template>
  <div>
    <!-- Editorial Header -->
    <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
            Users
          </h1>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ totalUsers }} {{ totalUsers === 1 ? 'user' : 'users' }}
          </p>
        </div>
        <div class="hidden md:flex items-center gap-3">
          <input v-model="searchQuery" type="text" placeholder="Search users by name or email..." class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none w-56" />
          <select v-model="selectedRoleFilter" class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 cursor-pointer">
            <option v-for="opt in roleFilterOptions" :key="opt.value" :value="opt">{{ opt.label }}</option>
          </select>
          <select v-model="selectedStatusFilter" class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 cursor-pointer">
            <option v-for="opt in statusFilterOptions" :key="opt.value" :value="opt">{{ opt.label }}</option>
          </select>
        </div>
      </div>
      <div class="md:hidden mt-4">
        <input v-model="searchQuery" type="text" placeholder="Search users..." class="w-full font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && users.length === 0" class="space-y-5">
      <div v-for="i in 5" :key="i" class="animate-pulse pb-5 border-b border-dashed border-gray-100 dark:border-gray-800">
        <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4 mb-2" /><div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="users.length === 0 && !loading" class="py-16 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-sm">
      <NIcon name="i-ph-users" class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
      <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">{{ searchQuery ? 'No matching users found' : 'No users yet' }}</p>
      <p class="font-sans text-sm text-gray-500 dark:text-gray-400">{{ searchQuery ? 'Try adjusting your search terms or filters.' : 'Users will appear here once they sign up.' }}</p>
    </div>

    <!-- Table -->
    <div v-else>
      <div v-if="selectedIds.length > 0" class="flex items-center gap-3 mb-4 pb-3 border-b border-dashed border-gray-200 dark:border-gray-700">
        <span class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ selectedIds.length }} selected</span>
        <button class="font-sans text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors" @click="showBulkDeleteDialog = true">Delete All</button>
        <button class="font-sans text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-auto" @click="clearSelection">Clear</button>
      </div>

      <div class="border border-dashed border-gray-200 dark:border-gray-700 rounded-sm overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0C0A09]">
              <th class="w-10 px-3 py-3 text-left"><NCheckbox checkbox="gray" :model-value="allSelected" @update:model-value="toggleAllSelection" /></th>
              <th class="px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">User</th>
              <th class="w-24 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Role</th>
              <th class="w-36 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
              <th class="w-20 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Quotes</th>
              <th class="w-24 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Collections</th>
              <th class="w-28 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Joined</th>
              <th class="w-28 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Last Login</th>
              <th class="w-10 px-3 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="(user, idx) in users" :key="user.id" :data-highlighted="idx === highlightedRowIndex ? 'true' : undefined" :class="['animate-fade-in-up transition-colors group', { 'bg-[#FAFAF9] dark:bg-[#1C1B1A]': idx === highlightedRowIndex }, { 'bg-indigo-50/50 dark:bg-indigo-950/30': !!rowSelection[user.id] }]" :style="{ animationDelay: `${idx * 0.03}s` }">
              <td class="px-3 py-3">
                <div :class="[Object.keys(rowSelection).length > 0 ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity']">
                  <NCheckbox checkbox="gray" :model-value="!!rowSelection[user.id]" @click="handleRowCheckboxClick($event, idx, user.id)" />
                </div>
              </td>
              <td class="px-3 py-3">
                <div class="flex items-center gap-3">
                  <NAvatar :src="user.avatar_url" :alt="user.name" size="xs" />
                  <div class="min-w-0">
                    <p class="font-sans text-sm text-gray-900 dark:text-gray-100 truncate">{{ user.name }}</p>
                    <p v-if="user.email" class="font-sans text-xs text-gray-500 dark:text-gray-400 truncate">{{ user.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-3 py-3">
                <span class="font-sans text-xs px-1.5 py-0.5" :class="rolePillClass(user.role)">{{ user.role }}</span>
              </td>
              <td class="px-3 py-3">
                <div class="flex items-center gap-1.5">
                  <span class="font-sans text-xs px-1.5 py-0.5" :class="user.is_active ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20' : 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20'">{{ user.is_active ? 'Active' : 'Inactive' }}</span>
                  <span v-if="user.email_verified" class="font-sans text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5">Verified</span>
                </div>
              </td>
              <td class="px-3 py-3 font-sans text-sm text-gray-900 dark:text-gray-100">{{ user.approved_quotes }}/{{ user.quote_count }}</td>
              <td class="px-3 py-3 font-sans text-sm text-gray-900 dark:text-gray-100">{{ user.collection_count || 0 }}</td>
              <td class="px-3 py-3 font-sans text-xs text-gray-500 dark:text-gray-400">{{ formatRelativeTime(user.created_at) }}</td>
              <td class="px-3 py-3 font-sans text-xs text-gray-500 dark:text-gray-400">{{ user.last_login_at ? formatRelativeTime(user.last_login_at) : '\u2014' }}</td>
              <td class="px-3 py-3">
                <NDropdownMenu :items="getUserActions(user)">
                  <button @click.stop class="p-1 rounded-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><NIcon name="i-ph-dots-three-vertical" class="w-4 h-4" /></button>
                </NDropdownMenu>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="flex items-center justify-between pt-4">
        <span class="font-sans text-xs text-gray-500 dark:text-gray-400">
          Page {{ currentPage }} of {{ totalPages }} &middot; {{ totalUsers }} {{ totalUsers === 1 ? 'user' : 'users' }}
        </span>
        <div class="flex items-center gap-3">
          <OutlinedButton v-if="currentPage > 1" @click="currentPage = Math.max(1, currentPage - 1)">&larr; Previous</OutlinedButton>
          <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">This is the first page</span>
          <OutlinedButton v-if="currentPage < totalPages" @click="currentPage = Math.min(totalPages, currentPage + 1)">Next &rarr;</OutlinedButton>
          <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">This is the last page</span>
        </div>
      </div>
      <div v-else class="pt-4 text-center">
        <span class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">No more pages to show</span>
      </div>
    </div>

    <AddUserDialog v-model="showAddUserDialog" @user-added="onUserAdded" />
    <EditUserDialog v-model="showEditUserDialog" :user="selectedUser" @user-updated="onUserUpdated" />
    <DeleteUserDialog v-model="showDeleteUserDialog" :user="userToDelete" @user-deleted="onUserDeleted" />
    <DeleteUsersBulkDialog v-model:open="showBulkDeleteDialog" :deleting="bulkDeleting" :selected-users="selectedUsers" :current-user-id="currentUser?.id" @bulk-delete="bulkDeleteUsers" />
  </div>
</template>

<script setup lang="ts">
import { formatRelativeTime } from '~/utils/time-formatter'
import { useAdminKeyboardShortcuts } from '~/composables/useAdminKeyboardShortcuts'
import { useTableKeyboardNav } from '~/composables/useTableKeyboardNav'
import { useErrorToast } from '~/composables/useErrorToast'

const { showErrorToast } = useErrorToast()

definePageMeta({ layout: 'admin', middleware: 'admin' })
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

const rowSelection = ref<Record<number, boolean>>({})
const lastSelectedIndex = ref<number | null>(null)

const selectedIds = computed(() => Object.entries(rowSelection.value).filter(([, v]) => !!v).map(([k]) => Number(k)))

const allSelected = computed<boolean | 'indeterminate'>({
  get: () => { const total = users.value.length; const count = selectedIds.value.length; if (total === 0) return false; if (count === total) return true; if (count > 0) return 'indeterminate'; return false },
  set: (v) => { const newSelection: Record<number, boolean> = {}; if (v === true) users.value.forEach(u => { newSelection[u.id] = true }); rowSelection.value = newSelection; lastSelectedIndex.value = null }
})

const toggleAllSelection = (v: boolean | 'indeterminate') => {
  if (v) { const newSel: Record<number, boolean> = {}; users.value.forEach(u => { newSel[u.id] = true }); rowSelection.value = newSel }
  else { rowSelection.value = {} }
  lastSelectedIndex.value = null
}

const handleRowCheckboxClick = (event: MouseEvent, index: number, id: number) => {
  const currently = !!rowSelection.value[id]; const newVal = !currently
  if (event.shiftKey && lastSelectedIndex.value !== null) {
    const start = Math.min(lastSelectedIndex.value, index); const end = Math.max(lastSelectedIndex.value, index)
    for (let i = start; i <= end; i += 1) { const row = users.value[i]; if (row) rowSelection.value[row.id] = newVal }
  } else { rowSelection.value[id] = newVal }
  lastSelectedIndex.value = index
}

const selectAllOnPage = () => {
  const visibleIds = users.value.map(u => u.id)
  const allSel = visibleIds.length > 0 && visibleIds.every(id => !!rowSelection.value[id])
  if (allSel) rowSelection.value = {}
  else visibleIds.forEach(id => (rowSelection.value[id] = true))
}

const clearSelection = () => { rowSelection.value = {}; lastSelectedIndex.value = null }

const isAnyDialogOpen = computed(() => showAddUserDialog.value || showEditUserDialog.value || showDeleteUserDialog.value || showBulkDeleteDialog.value)

const { highlightedRowIndex, clearHighlight } = useTableKeyboardNav({
  visibleRowCount: () => users.value.length,
  onSelectRow: (index: number) => { const u = users.value[index]; if (u) { rowSelection.value[u.id] = !rowSelection.value[u.id]; lastSelectedIndex.value = null } },
  isDialogOpen: () => isAnyDialogOpen.value, isDropdownOpen: () => false
})

const highlightedUser = computed<AdminUser | null>(() => { if (highlightedRowIndex.value === null) return null; return users.value[highlightedRowIndex.value] ?? null })

useAdminKeyboardShortcuts({
  selectAllOnPage, clearSelection, hasSelection: () => selectedIds.value.length > 0,
  isDialogOpen: () => isAnyDialogOpen.value, isDropdownOpen: () => false,
  onDelete: () => { showBulkDeleteDialog.value = true },
  onConfirmDialog: () => { if (showBulkDeleteDialog.value) bulkDeleteUsers() },
  highlightedRowIndex: () => highlightedRowIndex.value,
  onSingleEdit: () => { if (highlightedUser.value) editUser(highlightedUser.value) },
  onSingleView: () => { if (highlightedUser.value) navigateTo(`/users/${highlightedUser.value.id}`) },
  onSingleDelete: () => { if (highlightedUser.value) deleteUser(highlightedUser.value) }
})

const selectedUsers = computed(() => { const ids = selectedIds.value; return ids.length > 0 ? users.value.filter(u => ids.includes(u.id)) : [] })

const showAddUserDialog = ref(false)
const showEditUserDialog = ref(false)
const showDeleteUserDialog = ref(false)
const showBulkDeleteDialog = ref(false)
const selectedUser = ref<AdminUser | null>(null)
const userToDelete = ref<AdminUser | null>(null)

const roleFilterOptions = [
  { label: 'All Roles', value: '' }, { label: 'Users', value: 'user' },
  { label: 'Moderators', value: 'moderator' }, { label: 'Admins', value: 'admin' }
]

const statusFilterOptions = [
  { label: 'All Status', value: '' }, { label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }
]

const totalPages = computed(() => Math.ceil(totalUsers.value / pageSize.value))

const rolePillClass = (role: UserRole) => {
  switch (role) {
    case 'admin': return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
    case 'moderator': return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
    default: return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
  }
}

const loadUsers = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/admin/users', {
      query: { page: currentPage.value, limit: pageSize.value, search: searchQuery.value || undefined, role: selectedRoleFilter.value.value || undefined, status: selectedStatusFilter.value.value || undefined }
    })
    users.value = response.data || []; totalUsers.value = response.pagination?.total || 0
    rowSelection.value = {}; lastSelectedIndex.value = null; clearHighlight()
  } catch (error: any) { console.error('Failed to load users:', error); showErrorToast(error, 'Failed to load users') }
  finally { loading.value = false }
}

const resetFilters = () => { searchQuery.value = ''; selectedRoleFilter.value = roleFilterOptions[0]!; selectedStatusFilter.value = statusFilterOptions[0]!; currentPage.value = 1; rowSelection.value = {}; lastSelectedIndex.value = null }

const getUserActions = (user: AdminUser) => [
  { label: 'View Profile', leading: 'i-ph-user', onclick: () => navigateTo(`/users/${user.id}`) },
  { label: 'Edit User', leading: 'i-ph-pencil', onclick: () => editUser(user) },
  {}, { label: 'Delete User', leading: 'i-ph-trash', onclick: () => deleteUser(user) }
]

const editUser = (user: AdminUser) => { selectedUser.value = user; showEditUserDialog.value = true }
const deleteUser = (user: AdminUser) => { userToDelete.value = user; showDeleteUserDialog.value = true }
const onUserAdded = () => { showAddUserDialog.value = false; loadUsers() }
const onUserUpdated = () => { showEditUserDialog.value = false; selectedUser.value = null; loadUsers() }
const onUserDeleted = () => { showDeleteUserDialog.value = false; userToDelete.value = null; if (users.value.length <= 1 && currentPage.value > 1) currentPage.value = currentPage.value - 1; loadUsers() }

const bulkDeleteUsers = async () => {
  if (selectedIds.value.length === 0) return
  bulkDeleting.value = true
  try {
    const response = await fetch('/api/admin/users/bulk-delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selectedIds.value }) })
    const payload = await response.json() as { deletedCount?: number; skipped?: { self?: number; admins?: number; notFound?: number }; statusMessage?: string }
    if (!response.ok) throw createError({ statusCode: response.status, statusMessage: payload?.statusMessage || 'Failed to delete selected users' })
    const deletedCount = payload.deletedCount || 0; const skippedSelf = payload.skipped?.self || 0; const skippedAdmins = payload.skipped?.admins || 0; const skippedNotFound = payload.skipped?.notFound || 0
    useToast().toast({ toast: skippedSelf || skippedAdmins || skippedNotFound ? 'outline-warning' : 'soft-success', title: deletedCount > 0 ? `Deleted ${deletedCount} ${deletedCount === 1 ? 'user' : 'users'}` : 'No users deleted', description: [skippedSelf ? `${skippedSelf} self skipped` : '', skippedAdmins ? `${skippedAdmins} admin skipped` : '', skippedNotFound ? `${skippedNotFound} missing` : ''].filter(Boolean).join(' &middot; ') || undefined })
    showBulkDeleteDialog.value = false; rowSelection.value = {}; lastSelectedIndex.value = null
    if (deletedCount > 0 && users.value.length === deletedCount && currentPage.value > 1) currentPage.value = currentPage.value - 1
    await loadUsers()
  } catch (error: any) { console.error('Bulk delete users failed:', error); showErrorToast(error, 'Bulk delete failed') }
  finally { bulkDeleting.value = false }
}

watchDebounced([currentPage, searchQuery, selectedRoleFilter, selectedStatusFilter], () => { loadUsers() }, { debounce: 300 })
onMounted(() => { loadUsers() })
</script>

<style scoped>
@keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in-up { animation: fade-in-up 0.5s ease-out both; }
</style>
