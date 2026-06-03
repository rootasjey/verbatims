<template>
  <div class="frame flex flex-col h-full">
    <div class="flex-1 flex flex-col">
      <div class="group themes-table-container flex-1 overflow-auto border rounded-2">
        <NTable
          :columns="tableColumns"
          :data="themes"
          :loading="loading"
          :una="{
            tableRoot: '!overflow-visible border-none',
            scrollAreaRoot: '!overflow-visible',
            table: '!w-auto min-w-full',
            tableHeader: 'sticky top-0 z-1 bg-[#FAFAF9] dark:bg-[#0C0A09]',
            tableBody: 'bg-white dark:bg-[#0C0A09]'
          }"
          :_table-row="(row) => {
            if (!row) return {}
            const isHighlighted = themes.findIndex(t => t.id === row.id) === highlightedRowIndex
            const isSelected = !!rowSelection[row.id]
            if (!isHighlighted && !isSelected) return {}
            const classes = []
            if (isHighlighted && isSelected) {
              classes.push('bg-indigo-100 dark:bg-indigo-900/40 border-2 border-indigo-500 dark:border-indigo-400')
            } else if (isHighlighted) {
              classes.push('bg-[#FAFAF9] dark:bg-[#1C1B1A]')
            } else if (isSelected) {
              classes.push('bg-indigo-50/50 dark:bg-indigo-950/30 border-1.5 border-indigo-300 dark:border-indigo-700')
            }
            return {
              ...(isHighlighted ? { 'data-highlighted': 'true' } : {}),
              class: classes.join(' ')
            }
          }"
          manual-pagination
          empty-text="No themes found"
          empty-icon="i-ph-palette"
        >
          <template #name-header>
            <div class="flex items-center gap-2">
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Themes</h4>
              <div class="w-80">
                <NInput
                  v-model="searchQuery"
                  placeholder="Search themes..."
                  leading="i-ph-magnifying-glass"
                  size="md"
                  :loading="loading"
                  :trailing="searchQuery ? 'i-ph-x' : undefined"
                  :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
                  @trailing="resetFilters"
                />
              </div>
              <div>
                <NSelect
                  v-model="selectedSort"
                  :items="sortOptions"
                  placeholder="Sort by"
                  size="sm"
                  item-key="label"
                  value-key="label"
                />
              </div>
            </div>
          </template>

          <template #name-cell="{ cell }">
            <div class="flex items-center gap-2 min-w-0">
              <span class="font-medium text-sm">{{ cell.row.original.name }}</span>
            </div>
          </template>

          <template #slug-cell="{ cell }">
            <code class="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{{ cell.row.original.slug }}</code>
          </template>

          <template #status-cell="{ cell }">
            <div class="flex items-center gap-1.5">
              <NBadge v-if="cell.row.original.isActive" badge="solid-green" size="xs">Active</NBadge>
              <NBadge v-else-if="cell.row.original.isDefault" badge="soft-blue" size="xs">Default</NBadge>
              <NBadge v-else-if="cell.row.original.scheduledDate" badge="soft-yellow" size="xs">Scheduled</NBadge>
              <NBadge v-else badge="ghost-gray" size="xs">Inactive</NBadge>
            </div>
          </template>

          <template #schedule-cell="{ cell }">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ cell.row.original.scheduledDate || (cell.row.original.scheduledStart ? formatDate(cell.row.original.scheduledStart) : '—') }}
            </span>
          </template>

          <template #filters-cell="{ cell }">
            <span class="text-sm">{{ cell.row.original.filters_count || 0 }}</span>
          </template>

          <template #priority-cell="{ cell }">
            <span class="text-sm">{{ cell.row.original.priority }}</span>
          </template>

          <template #actions-header>
            <div class="flex items-center justify-center space-x-1">
              <NDropdownMenu :items="headerActions">
                <NButton size="xs" btn="ghost-gray" icon label="i-ph-caret-down" class="hover:bg-gray-200 dark:hover:bg-gray-900" />
              </NDropdownMenu>
            </div>
          </template>

          <template #actions-cell="{ cell }">
            <NDropdownMenu :items="getThemeActions(cell.row.original)">
              <NButton icon btn="ghost-gray" size="xs" label="i-ph-dots-three-vertical" class="hover:bg-gray-200 dark:hover:bg-gray-700/50" />
            </NDropdownMenu>
          </template>
        </NTable>
      </div>

      <div class="flex-shrink-0 flex items-center justify-between p-4">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Page {{ currentPage }} of {{ totalPages }} • {{ totalThemes }} total themes
        </div>
        <NPagination v-model:page="currentPage" :total="totalThemes" :items-per-page="pageSize" :sibling-count="2" show-edges size="sm" pagination-selected="solid-indigo" />
      </div>
    </div>
  </div>

  <NDialog v-model:open="showEditDialog" :una="{ dialogContent: 'md:max-w-2xl lg:max-w-5xl' }">
    <template #header>
      <h3 class="font-title uppercase text-size-4 font-600 ml-4">{{ editMode ? 'Edit Theme' : 'Create Theme' }}</h3>
    </template>
    <div class="max-h-[70vh] overflow-y-auto">
      <div class="space-y-6 px-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Name *</label>
            <NInput v-model="form.name" placeholder="e.g., To Infinity & Beyond" :disabled="submitting" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Slug *</label>
            <NInput v-model="form.slug" placeholder="e.g., space" :disabled="submitting" required />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Description</label>
          <NInput type="textarea" v-model="form.description" :rows="2" placeholder="Short theme description" :disabled="submitting" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Image URL</label>
          <NInput v-model="form.image_url" placeholder="https://..." :disabled="submitting" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Priority</label>
            <NInput v-model.number="form.priority" type="number" min="0" :disabled="submitting" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Scheduled Date</label>
            <NInput v-model="form.scheduled_date" type="date" :disabled="submitting" />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Scheduled Start</label>
            <NInput v-model="form.scheduled_start" type="datetime-local" :disabled="submitting" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Scheduled End</label>
            <NInput v-model="form.scheduled_end" type="datetime-local" :disabled="submitting" />
          </div>
          <div class="flex items-end gap-4 pb-1">
            <NCheckbox v-model="form.is_active" label="Active" />
            <NCheckbox v-model="form.is_default" label="Default fallback" />
          </div>
        </div>

        <div class="border-t pt-4">
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Theme Colors</h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Primary</label>
              <NSelect v-model="form.color_primary" :items="colorOptions" size="sm" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Secondary</label>
              <NSelect v-model="form.color_secondary" :items="colorOptions" size="sm" />
            </div>
          </div>
        </div>

        <div v-if="editMode" class="border-t pt-4">
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Content Filters</h4>
          <div class="space-y-2 mb-3">
            <div v-for="(filter, idx) in filters" :key="filter.id || idx" class="flex items-center gap-2">
              <NSelect
                v-model="filter.type"
                :items="filterTypeOptions"
                size="sm"
                class="w-36"
              />
              <NInput v-model="filter.value" placeholder="Value" size="sm" class="flex-1" />
              <NButton icon btn="ghost-red" size="xs" label="i-ph-x" @click="removeFilter(idx)" />
            </div>
          </div>
          <NButton size="xs" btn="ghost-blue" leading="i-ph-plus" @click="addFilter">Add Filter</NButton>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="mt-6 flex justify-end gap-3 px-4 pb-2">
        <NButton btn="ghost-gray" :disabled="submitting" @click="showEditDialog = false">Cancel</NButton>
        <NButton btn="solid-indigo" :loading="submitting" :disabled="!form.name.trim() || !form.slug.trim()" @click="saveTheme">
          {{ editMode ? 'Update Theme' : 'Create Theme' }}
        </NButton>
      </div>
    </template>
  </NDialog>

  <NDialog v-model:open="showDeleteDialog" :una="{ dialogContent: 'md:max-w-sm' }">
    <div>
      <h3 class="font-title uppercase text-size-4 font-600 mb-3 ml-4">Delete Theme</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Are you sure you want to delete <span class="font-medium">{{ themeToDelete?.name }}</span>? This will remove all its content filters.
      </p>
      <div class="flex justify-end gap-3">
        <NButton btn="light:soft dark:soft-white" :disabled="submitting" @click="showDeleteDialog = false">Cancel</NButton>
        <NButton btn="soft-red" :loading="submitting" @click="confirmDelete">Delete</NButton>
      </div>
    </div>
  </NDialog>
</template>

<script setup lang="ts">
import { formatRelativeTime } from '~/utils/time-formatter'
import { useAdminKeyboardShortcuts } from '~/composables/useAdminKeyboardShortcuts'
import { useTableKeyboardNav } from '~/composables/useTableKeyboardNav'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Themes - Admin - Verbatims' })

const loading = ref(false)
const themes = ref<any[]>([])
const totalThemes = ref(0)
const currentPage = ref(1)
const pageSize = ref(50)
const searchQuery = ref('')
const selectedSort = ref({ label: 'Priority (High-Low)', value: 'priority_desc' })

const showEditDialog = ref(false)
const editMode = ref(false)
const editingThemeId = ref<number | null>(null)
const submitting = ref(false)

const showDeleteDialog = ref(false)
const themeToDelete = ref<any>(null)

const form = ref({
  slug: '',
  name: '',
  description: '',
  image_url: '',
  is_active: false,
  is_default: false,
  scheduled_date: '',
  scheduled_start: '',
  scheduled_end: '',
  priority: 0,
  color_primary: 'indigo' as string,
  color_secondary: 'amber' as string,
})

const filters = ref<any[]>([])

const filterTypeOptions = ['keyword', 'tag_name', 'author_name', 'reference_name', 'author_id', 'reference_id']

const colorOptions = ['rose', 'pink', 'fuchsia', 'purple', 'violet', 'indigo', 'blue', 'sky', 'cyan', 'teal', 'emerald', 'green', 'lime', 'yellow', 'amber', 'orange', 'red', 'slate', 'gray', 'zinc', 'neutral', 'stone']

// multi-select state
const rowSelection = ref<Record<number, boolean>>({})
const lastSelectedIndex = ref<number | null>(null)

const selectedIds = computed<number[]>(() => Object.entries(rowSelection.value).filter(([, v]) => !!v).map(([k]) => Number(k)))

const clearSelection = () => { rowSelection.value = {}; lastSelectedIndex.value = null }

const selectAllOnPage = () => {
  if (themes.value.every(t => !!rowSelection.value[t.id])) rowSelection.value = {}
  else themes.value.forEach(t => (rowSelection.value[t.id] = true))
}

const isAnyDialogOpen = computed(() => showEditDialog.value || showDeleteDialog.value)

const { highlightedRowIndex, clearHighlight } = useTableKeyboardNav({
  visibleRowCount: () => themes.value.length,
  onSelectRow: (index: number) => {
    const theme = themes.value[index]
    if (theme) { rowSelection.value[theme.id] = !rowSelection.value[theme.id]; lastSelectedIndex.value = null }
  },
  isDialogOpen: () => isAnyDialogOpen.value,
  isDropdownOpen: () => false,
})

const highlightedTheme = computed<any | null>(() => {
  if (highlightedRowIndex.value === null) return null
  return themes.value[highlightedRowIndex.value] ?? null
})

useAdminKeyboardShortcuts({
  selectAllOnPage, clearSelection,
  hasSelection: () => selectedIds.value.length > 0,
  isDialogOpen: () => isAnyDialogOpen.value,
  isDropdownOpen: () => false,
  onDelete: () => { if (selectedIds.value.length) showDeleteDialog.value = true },
  onConfirmDialog: () => { if (showDeleteDialog.value) confirmDelete() },
  highlightedRowIndex: () => highlightedRowIndex.value,
  onSingleEdit: () => {
    if (highlightedTheme.value) { openEdit(highlightedTheme.value) }
  },
  onSingleDelete: () => {
    if (highlightedTheme.value) { themeToDelete.value = highlightedTheme.value; showDeleteDialog.value = true }
  },
})

const sortOptions = [
  { label: 'Priority (High-Low)', value: 'priority_desc' },
  { label: 'Priority (Low-High)', value: 'priority_asc' },
  { label: 'Name A-Z', value: 'name_asc' },
  { label: 'Name Z-A', value: 'name_desc' },
  { label: 'Slug A-Z', value: 'slug_asc' },
  { label: 'Scheduled Date', value: 'scheduled_date_desc' },
]

const tableColumns = [
  { header: 'Name', accessorKey: 'name', enableSorting: false, meta: { una: { tableHead: 'min-w-40', tableCell: 'min-w-40' } } },
  { header: 'Slug', accessorKey: 'slug', enableSorting: false, meta: { una: { tableHead: 'w-28', tableCell: 'w-28' } } },
  { header: 'Status', accessorKey: 'status', enableSorting: false, meta: { una: { tableHead: 'w-28', tableCell: 'w-28' } } },
  { header: 'Schedule', accessorKey: 'schedule', enableSorting: false, meta: { una: { tableHead: 'w-32', tableCell: 'w-32' } } },
  { header: 'Filters', accessorKey: 'filters', enableSorting: false, meta: { una: { tableHead: 'w-16', tableCell: 'w-16 text-center' } } },
  { header: 'Priority', accessorKey: 'priority', enableSorting: false, meta: { una: { tableHead: 'w-16', tableCell: 'w-16 text-center' } } },
  { header: '', accessorKey: 'actions', enableSorting: false, meta: { una: { tableHead: 'w-16', tableCell: 'w-16' } } },
]

const totalPages = computed(() => Math.ceil(totalThemes.value / pageSize.value))

const headerActions = computed(() => {
  const actions: any[] = []
  if (selectedIds.value.length > 0) {
    actions.push({ label: 'Delete Selected', leading: 'i-ph-trash', shortcut: 'D', onclick: () => { showDeleteDialog.value = true } })
  }
  if (actions.length > 0) actions.push({})
  actions.push({ label: 'Add New Theme', leading: 'i-ph-plus', onclick: () => { openCreate() } })
  actions.push({})
  actions.push({ label: 'Refresh', leading: 'i-ph-arrows-clockwise', onclick: () => loadThemes() })
  actions.push({ label: 'Reset Filters', leading: 'i-ph-x', onclick: () => resetFilters() })
  return actions
})

const getThemeActions = (theme: any) => {
  const actions: any[] = [
    { label: 'Edit Theme', leading: 'i-ph-pencil', onclick: () => openEdit(theme) },
    theme.isActive
      ? { label: 'Deactivate', leading: 'i-ph-toggle-left', onclick: () => toggleActive(theme, false) }
      : { label: 'Activate', leading: 'i-ph-toggle-right', onclick: () => toggleActive(theme, true) },
    theme.isDefault
      ? { label: 'Remove from Defaults', leading: 'i-ph-star-slash', onclick: () => toggleDefault(theme, false) }
      : { label: 'Set as Default', leading: 'i-ph-star', onclick: () => toggleDefault(theme, true) },
    {},
    { label: 'Delete Theme', leading: 'i-ph-trash', onclick: () => { themeToDelete.value = theme; showDeleteDialog.value = true } },
  ]
  return actions
}

const loadThemes = async () => {
  try {
    loading.value = true
    const sortValue = selectedSort.value.value
    const lastUnderscoreIndex = sortValue.lastIndexOf('_')
    const sortBy = sortValue.substring(0, lastUnderscoreIndex)
    const sortOrder = sortValue.substring(lastUnderscoreIndex + 1).toUpperCase()

    const res = await $fetch('/api/admin/themes', {
      query: {
        page: currentPage.value,
        limit: pageSize.value,
        search: searchQuery.value || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      },
    })
    themes.value = res.data || []
    totalThemes.value = res.pagination?.total || 0
    rowSelection.value = {}
    clearHighlight()
  } catch (e) {
    console.error('Failed to load themes', e)
    useToast().toast({ toast: 'solid-error', title: 'Error', description: 'Failed to load themes' })
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedSort.value = sortOptions[0]
  currentPage.value = 1
  rowSelection.value = {}
}

const resetForm = () => {
  form.value = { slug: '', name: '', description: '', image_url: '', is_active: false, is_default: false, scheduled_date: '', scheduled_start: '', scheduled_end: '', priority: 0, color_primary: 'indigo', color_secondary: 'amber' }
  filters.value = []
  editingThemeId.value = null
  editMode.value = false
}

const openCreate = () => {
  resetForm()
  showEditDialog.value = true
}

const openEdit = async (theme: any) => {
  editMode.value = true
  editingThemeId.value = theme.id
  try {
    const res = await $fetch(`/api/admin/themes/${theme.id}`)
    const data = res.data
    let themeConfig: Record<string, any> = {}
    if (data.config) {
      try { themeConfig = typeof data.config === 'string' ? JSON.parse(data.config) : data.config } catch { themeConfig = {} }
    }
    form.value = {
      slug: data.slug || '',
      name: data.name || '',
      description: data.description || '',
      image_url: data.imageUrl || '',
      is_active: data.isActive || false,
      is_default: data.isDefault || false,
      scheduled_date: data.scheduledDate || '',
      scheduled_start: data.scheduledStart ? formatDatetimeForInput(data.scheduledStart) : '',
      scheduled_end: data.scheduledEnd ? formatDatetimeForInput(data.scheduledEnd) : '',
      priority: data.priority || 0,
      color_primary: themeConfig.color_primary || 'indigo',
      color_secondary: themeConfig.color_secondary || 'amber',
    }
    filters.value = (data.filters || []).map((f: any) => ({ id: f.id, type: f.type, value: f.value }))
  } catch (e) {
    console.error('Failed to load theme details', e)
    useToast().toast({ toast: 'error', title: 'Error', description: 'Failed to load theme details' })
    return
  }
  showEditDialog.value = true
}

const addFilter = () => {
  filters.value.push({ id: undefined, type: 'keyword', value: '' })
}

const removeFilter = async (idx: number) => {
  const filter = filters.value[idx]
  if (filter.id) {
    try {
      await $fetch(`/api/admin/themes/${editingThemeId.value}/filters/${filter.id}`, { method: 'DELETE' })
    } catch {
      useToast().toast({ toast: 'error', title: 'Error', description: 'Failed to delete filter' })
      return
    }
  }
  filters.value.splice(idx, 1)
}

const saveTheme = async () => {
  if (submitting.value) return
  if (!form.value.name.trim() || !form.value.slug.trim()) return
  submitting.value = true
  try {
    const payload: any = {
      slug: form.value.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      name: form.value.name.trim(),
      description: form.value.description.trim() || null,
      image_url: form.value.image_url.trim() || null,
      is_active: form.value.is_active,
      is_default: form.value.is_default,
      scheduled_date: form.value.scheduled_date || null,
      scheduled_start: form.value.scheduled_start || null,
      scheduled_end: form.value.scheduled_end || null,
      priority: form.value.priority || 0,
      config: { color_primary: form.value.color_primary, color_secondary: form.value.color_secondary },
    }

    if (editMode.value && editingThemeId.value) {
      await $fetch(`/api/admin/themes/${editingThemeId.value}`, { method: 'PUT', body: payload })

      const existingFilterIds = new Set(filters.value.filter(f => f.id).map(f => f.id))
      for (const filter of filters.value) {
        if (!filter.id) {
          await $fetch(`/api/admin/themes/${editingThemeId.value}/filters`, {
            method: 'POST',
            body: { type: filter.type, value: filter.value, match_mode: 'any' },
          })
        }
      }

      useToast().toast({ toast: 'success', title: 'Theme updated' })
    } else {
      const res = await $fetch('/api/admin/themes', { method: 'POST', body: payload })
      const newId = res.data?.id

      if (newId) {
        for (const filter of filters.value) {
          if (filter.value.trim()) {
            await $fetch(`/api/admin/themes/${newId}/filters`, {
              method: 'POST',
              body: { type: filter.type, value: filter.value, match_mode: 'any' },
            })
          }
        }
      }

      useToast().toast({ toast: 'success', title: 'Theme created' })
    }

    showEditDialog.value = false
    await loadThemes()
  } catch (error: any) {
    console.error('Error saving theme:', error)
    const details = error?.data?.statusMessage || error?.statusMessage || error?.message || 'Unknown error'
    if (error?.statusCode === 409) {
      useToast().toast({ toast: 'soft-error', title: 'Duplicate slug', description: details, actions: [{ label: 'Copy', btn: 'soft-gray', altText: 'Copy error details', onClick: () => navigator.clipboard.writeText(details) }] })
      return
    }
    useToast().toast({ toast: 'soft-error', title: 'Error', description: details, actions: [{ label: 'Copy', btn: 'soft-gray', altText: 'Copy error details', onClick: () => navigator.clipboard.writeText(details) }] })
  } finally {
    submitting.value = false
  }
}

const confirmDelete = async () => {
  if (!themeToDelete.value && selectedIds.value.length === 0) return
  submitting.value = true
  try {
    if (themeToDelete.value) {
      await $fetch(`/api/admin/themes/${themeToDelete.value.id}`, { method: 'DELETE' })
      useToast().toast({ toast: 'success', title: 'Theme deleted' })
    } else {
      const ids = [...selectedIds.value]
      const results = await Promise.allSettled(ids.map(id => $fetch(`/api/admin/themes/${id}`, { method: 'DELETE' })))
      const failed = results.filter(r => r.status === 'rejected').length
      useToast().toast({ toast: failed ? 'warning' : 'success', title: `Deleted ${ids.length - failed} theme${ids.length - failed !== 1 ? 's' : ''}` })
    }
    showDeleteDialog.value = false
    themeToDelete.value = null
    rowSelection.value = {}
    await loadThemes()
  } catch (e) {
    console.error('Failed to delete theme', e)
    useToast().toast({ toast: 'error', title: 'Error', description: 'Failed to delete theme' })
  } finally {
    submitting.value = false
  }
}

const toggleActive = async (theme: any, isActive: boolean) => {
  try {
    await $fetch(`/api/admin/themes/${theme.id}/activate`, { method: 'PUT', body: { is_active: isActive } })
    useToast().toast({ toast: 'success', title: isActive ? 'Theme activated' : 'Theme deactivated' })
    await loadThemes()
  } catch {
    useToast().toast({ toast: 'error', title: 'Error', description: 'Failed to toggle theme' })
  }
}

const toggleDefault = async (theme: any, isDefault: boolean) => {
  try {
    await $fetch(`/api/admin/themes/${theme.id}/default`, { method: 'PUT', body: { is_default: isDefault } })
    useToast().toast({ toast: 'success', title: isDefault ? 'Theme set as default' : 'Default removed' })
    await loadThemes()
  } catch {
    useToast().toast({ toast: 'error', title: 'Error', description: 'Failed to toggle default' })
  }
}

const formatDate = (val: any) => {
  if (!val) return '—'
  const d = new Date(val)
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString()
}

const formatDatetimeForInput = (val: any) => {
  if (!val) return ''
  const d = new Date(val)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 16)
}

watchDebounced([currentPage, searchQuery, selectedSort], () => { loadThemes() }, { debounce: 300 })
onMounted(() => { loadThemes() })
</script>

<style scoped>
.themes-table-container {
  max-height: calc(100vh - 11rem);
  max-width: calc(100vw - 8rem);
}

:deep(.table-header tr) { border-bottom: none; }
:deep([data-reka-scroll-area-viewport]) { overflow: visible !important; }
:deep([data-reka-scroll-area-corner]) { display: none !important; }
.frame { min-height: calc(100vh - 8rem) }
</style>
