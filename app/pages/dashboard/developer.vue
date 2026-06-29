<template>
  <div>
    <div class="flex items-center justify-between pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <div>
        <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
          Developer
        </h1>
        <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">
          Manage your API keys for the Verbatims public API
        </p>
      </div>
      <div class="flex items-center gap-3">
        <NDropdownMenu :items="bulkActions">
          <button class="font-sans text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-1">
            Bulk actions
            <NIcon name="i-ph-caret-down" class="w-3 h-3" />
          </button>
        </NDropdownMenu>
        <OutlinedButton @click="showCreateDialog = true">New Key</OutlinedButton>
      </div>
    </div>

    <!-- New Key Display -->
    <div v-if="createdKey" class="border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 p-4 mb-6 rounded-sm">
      <p class="font-sans text-xs text-yellow-800 dark:text-yellow-300 font-600 mb-2">⚠️ Save this key — it won't be shown again!</p>
      <div class="flex items-stretch gap-2">
        <code class="font-mono text-sm text-yellow-900 dark:text-yellow-200 break-all select-all bg-yellow-100 dark:bg-yellow-800/30 px-2 py-1.5 flex-1 rounded-sm">{{ createdKey }}</code>
        <button class="font-sans text-xs font-500 px-3 py-1.5 rounded-sm transition-colors shrink-0" :class="copied ? 'text-green-800 dark:text-green-300 bg-green-200 dark:bg-green-700/40' : 'text-yellow-800 dark:text-yellow-300 bg-yellow-200 dark:bg-yellow-700/40 hover:bg-yellow-300 dark:hover:bg-yellow-700/60'" @click="copyKey">{{ copied ? 'Copied!' : 'Copy' }}</button>
      </div>
      <button class="font-sans text-xs text-yellow-700 dark:text-yellow-400 hover:text-yellow-800 mt-2 transition-colors" @click="createdKey = ''">Dismiss</button>
    </div>

    <!-- Bulk action bar -->
    <div v-if="selectedKeys.size > 0" class="flex items-center justify-between px-1 py-2 mb-3">
      <span class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ selectedKeys.size }} selected</span>
      <div class="flex items-center gap-3">
        <button class="font-sans text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" @click="batchActivate">Activate</button>
        <button class="font-sans text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" @click="batchDeactivate">Deactivate</button>
        <button class="font-sans text-xs text-red-500 hover:text-red-600 transition-colors" @click="showBatchDeleteDialog = true">Delete</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && keys.length === 0" class="space-y-4">
      <div v-for="i in 3" :key="i" class="border border-dashed border-gray-100 dark:border-gray-800 p-4 rounded-sm">
        <div class="shimmer h-4 rounded w-1/2 mb-2" />
        <div class="shimmer h-3 rounded w-1/4" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="keys.length === 0 && !loading" class="py-16 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-sm">
      <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-1">No API keys yet</p>
      <p class="font-sans text-xs text-gray-400 dark:text-gray-500 mb-6">Create one to get started.</p>
      <OutlinedButton @click="showCreateDialog = true">Create API Key</OutlinedButton>
    </div>

    <!-- Keys List -->
    <div v-else class="space-y-3">
      <div class="flex items-center gap-2 pb-1">
        <input
          type="checkbox"
          :checked="allSelected"
          :indeterminate="someSelected && !allSelected"
          class="shrink-0 accent-gray-700 dark:accent-gray-300 cursor-pointer"
          @change="toggleSelectAll"
        />
        <span class="font-sans text-xs text-gray-400 dark:text-gray-500">Select all</span>
      </div>
      <div
        v-for="key in keys"
        :key="key.id"
        class="border border-dashed border-gray-200 dark:border-gray-700 p-4 rounded-sm hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        :class="selectedKeys.has(key.id) ? 'border-gray-400 dark:border-gray-500' : ''"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-3 flex-1 min-w-0">
            <input
              type="checkbox"
              :checked="selectedKeys.has(key.id)"
              class="mt-0.5 shrink-0 accent-gray-700 dark:accent-gray-300 cursor-pointer"
              @change="toggleKeySelection(key.id)"
            />
            <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100 truncate">{{ key.name }}</h3>
              <span class="font-sans text-xs px-1.5 py-0.5 shrink-0" :class="tierClass(key.tier)">{{ key.tier }}</span>
              <span
                class="font-sans text-xs px-1.5 py-0.5 shrink-0"
                :class="key.isActive ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20' : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'"
              >
                {{ key.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 font-mono">
              <span>{{ key.keyPrefix }}...</span>
              <span class="font-sans">{{ key.rateLimit }} req / {{ formatWindow(key.windowSec) }}</span>
              <span v-if="key.lastUsedAt" class="font-sans">Last used: {{ timeAgo(key.lastUsedAt) }}</span>
              <span v-else class="font-sans">Never used</span>
            </div>
            <div class="flex gap-1.5 mt-1.5">
              <span v-for="perm in key.permissions" :key="perm" class="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-sm">{{ perm }}</span>
            </div>
          </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button
              class="font-sans text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              @click="toggleKey(key)"
            >
              {{ key.isActive ? 'Deactivate' : 'Activate' }}
            </button>
            <button class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" @click="openEditDialog(key)" title="Edit">
              <NIcon name="i-ph-pencil" class="w-3.5 h-3.5" />
            </button>
            <button class="p-1 text-gray-400 hover:text-red-500 transition-colors" @click="confirmDelete(key)" title="Delete">
              <NIcon name="i-ph-trash" class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="flex items-center justify-between pt-2">
        <span class="font-sans text-xs text-gray-500 dark:text-gray-400">Page {{ page }} of {{ totalPages }}</span>
        <div class="flex gap-3">
          <OutlinedButton v-if="page > 1" @click="page -= 1">&larr; Previous</OutlinedButton>
          <OutlinedButton v-if="page < totalPages" @click="page += 1">Next &rarr;</OutlinedButton>
        </div>
      </div>
    </div>

    <!-- API Info -->
    <div class="border border-dashed border-gray-200 dark:border-gray-700 p-4 mb-6 rounded-sm">
      <h3 class="font-sans text-xs font-600 text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Public API</h3>
      <p class="font-sans text-xs text-gray-600 dark:text-gray-400 mb-2">
        Use your API keys to access quotes, authors, references, and more programmatically.
      </p>
      <div class="bg-gray-50 dark:bg-gray-900 p-3 font-mono text-xs text-gray-700 dark:text-gray-300 rounded-sm">
        <p><span class="text-gray-400"># Authenticate with your key</span></p>
        <p>curl -H "Authorization: Bearer vbt_xxxxxxxx..." {{ siteUrl }}/api/v1/me</p>
        <p class="mt-1"><span class="text-gray-400"># List approved quotes</span></p>
        <p>curl -H "Authorization: Bearer vbt_xxx..." {{ siteUrl }}/api/v1/quotes?page=1&limit=5</p>
      </div>
    </div>

    <!-- Create Key Dialog -->
    <NDialog v-model:open="showCreateDialog">
      <template #header><h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">Create API Key</h3></template>
      <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mb-4">
        Give your key a name so you can recognize it later.
      </p>
      <input
        v-model="newKeyName"
        type="text"
        placeholder="e.g. My CLI tool"
        class="w-full font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-gray-500"
        @keydown.enter="createKey"
      />
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="font-sans text-xs text-gray-500 hover:text-gray-700 transition-colors px-3 py-1.5" @click="showCreateDialog = false">Cancel</button>
          <OutlinedButton :disabled="!newKeyName.trim()" :loading="creating" @click="createKey">Create</OutlinedButton>
        </div>
      </template>
    </NDialog>

    <!-- Edit Key Dialog -->
    <NDialog v-model:open="showEditDialog">
      <template #header><h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">Edit API Key</h3></template>
      <div class="space-y-4">
        <div>
          <label class="font-sans text-xs text-gray-500 dark:text-gray-400 block mb-1">Name</label>
          <input
            v-model="editName"
            type="text"
            placeholder="Key name"
            class="w-full font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-gray-500"
            @keydown.enter="saveEdit"
          />
        </div>
        <div>
          <label class="font-sans text-xs text-gray-500 dark:text-gray-400 block mb-1">
            Rate limit
            <span class="text-gray-400 font-normal">(max {{ maxRatePerHour }} req/h for {{ editingKey?.tier }} tier)</span>
          </label>
          <div class="flex gap-3 items-end">
            <input
              v-model.number="editRateLimit"
              type="number"
              min="1"
              class="flex-1 font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-gray-500"
            />
            <select
              v-model="editWindowSec"
              class="w-28 font-sans text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-gray-400 cursor-pointer"
            >
              <option :value="60">per minute</option>
              <option :value="3600">per hour</option>
              <option :value="86400">per day</option>
            </select>
          </div>
          <p class="font-sans text-xs text-gray-400 dark:text-gray-500 mt-1.5">
            ⇢ {{ effectivePerHour }} req / hour
          </p>
        </div>
      </div>
      <div v-if="editError" class="font-sans text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-sm -mb-2">
        <p>{{ editError }}</p>
        <button class="mt-1.5 underline underline-offset-2 hover:text-red-800 dark:hover:text-red-300 transition-colors" @click="applyRecommendedRate">
          Use recommended rate ({{ maxRatePerHour }} req/h)
        </button>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="font-sans text-xs text-gray-500 hover:text-gray-700 transition-colors px-3 py-1.5" @click="showEditDialog = false">Cancel</button>
          <OutlinedButton :disabled="!editName.trim()" :loading="savingEdit" @click="saveEdit">Save</OutlinedButton>
        </div>
      </template>
    </NDialog>

    <!-- Delete Dialog -->
    <NDialog v-model:open="showDeleteDialog">
      <template #header><h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">Delete API Key</h3></template>
      <p class="font-sans text-sm text-gray-600 dark:text-gray-400 mb-4">
        Delete <strong class="text-gray-900 dark:text-gray-100">{{ deletingKey?.name }}</strong>?
        This cannot be undone.
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="font-sans text-xs text-gray-500 hover:text-gray-700 transition-colors px-3 py-1.5" @click="showDeleteDialog = false">Cancel</button>
          <OutlinedButton variant="destructive" :loading="deleting" @click="doDelete">Delete</OutlinedButton>
        </div>
      </template>
    </NDialog>

    <!-- Batch Delete Dialog -->
    <NDialog v-model:open="showBatchDeleteDialog">
      <template #header><h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">Delete API Keys</h3></template>
      <p class="font-sans text-sm text-gray-600 dark:text-gray-400 mb-4">
        Delete <strong class="text-gray-900 dark:text-gray-100">{{ selectedKeys.size }}</strong> selected keys? This cannot be undone.
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="font-sans text-xs text-gray-500 hover:text-gray-700 transition-colors px-3 py-1.5" @click="showBatchDeleteDialog = false">Cancel</button>
          <OutlinedButton variant="destructive" :loading="batchDeleting" @click="doBatchDelete">Delete all</OutlinedButton>
        </div>
      </template>
    </NDialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Developer - Verbatims' })
const { showErrorToast } = useErrorToast()
const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig.public?.siteUrl || 'https://verbatims.cc'

const page = ref(1)
const limit = ref(50)
const keys = ref<any[]>([])
const total = ref(0)
const loading = ref(true)

const showCreateDialog = ref(false)
const newKeyName = ref('')
const creating = ref(false)
const createdKey = ref('')
const copied = ref(false)

const copyKey = async () => {
  try {
    await navigator.clipboard.writeText(createdKey.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = createdKey.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

const selectedKeys = ref<Set<number>>(new Set())

const allSelected = computed(() => keys.value.length > 0 && keys.value.every(k => selectedKeys.value.has(k.id)))
const someSelected = computed(() => selectedKeys.value.size > 0)

const toggleKeySelection = (id: number) => {
  const next = new Set(selectedKeys.value)
  if (next.has(id)) { next.delete(id) } else { next.add(id) }
  selectedKeys.value = next
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedKeys.value = new Set()
  } else {
    selectedKeys.value = new Set(keys.value.map(k => k.id))
  }
}

const clearSelection = () => { selectedKeys.value = new Set() }

const bulkActions = computed(() => [
  {
    label: 'Activate All',
    leading: 'i-ph-play',
    onclick: async () => {
      await Promise.all(keys.value.filter(k => !k.isActive).map(k => toggleKey(k)))
      clearSelection()
    },
  },
  {},
  {
    label: 'Deactivate All',
    leading: 'i-ph-pause',
    onclick: async () => {
      await Promise.all(keys.value.filter(k => k.isActive).map(k => toggleKey(k)))
      clearSelection()
    },
  },
])

const batchActivate = async () => {
  const targets = keys.value.filter(k => selectedKeys.value.has(k.id) && !k.isActive)
  await Promise.all(targets.map(k => toggleKey(k)))
  clearSelection()
}

const batchDeactivate = async () => {
  const targets = keys.value.filter(k => selectedKeys.value.has(k.id) && k.isActive)
  await Promise.all(targets.map(k => toggleKey(k)))
  clearSelection()
}

const showBatchDeleteDialog = ref(false)
const batchDeleting = ref(false)

const doBatchDelete = async () => {
  const targets = keys.value.filter(k => selectedKeys.value.has(k.id))
  if (targets.length === 0) return
  batchDeleting.value = true
  try {
    await Promise.all(targets.map(k => $fetch(`/api/user/api-keys/${k.id}`, { method: 'DELETE' })))
    showBatchDeleteDialog.value = false
    clearSelection()
    if (keys.value.length <= targets.length && page.value > 1) page.value -= 1
    loadKeys()
  } catch (e) {
    showErrorToast(e, 'Failed to delete some keys')
  } finally {
    batchDeleting.value = false
  }
}

const showEditDialog = ref(false)
const editingKey = ref<any | null>(null)
const editName = ref('')
const editRateLimit = ref(1000)
const editWindowSec = ref(3600)
const savingEdit = ref(false)

const tierMaxPerHour: Record<string, number> = {
  free: 1000,
  pro: 10000,
  enterprise: 100000,
}

const maxRatePerHour = computed(() => tierMaxPerHour[editingKey.value?.tier] ?? 1000)

const effectivePerHour = computed(() => {
  if (!editRateLimit.value || !editWindowSec.value) return 0
  return Math.round((editRateLimit.value / editWindowSec.value) * 3600)
})

const editError = ref('')

const openEditDialog = (key: any) => {
  editingKey.value = key
  editName.value = key.name
  editRateLimit.value = key.rateLimit
  editWindowSec.value = key.windowSec
  editError.value = ''
  showEditDialog.value = true
}

const applyRecommendedRate = () => {
  editRateLimit.value = maxRatePerHour.value
  editWindowSec.value = 3600
  editError.value = ''
  saveEdit()
}

const saveEdit = async () => {
  if (!editName.value.trim() || !editingKey.value) return
  savingEdit.value = true
  try {
    const body: Record<string, unknown> = { name: editName.value.trim() }
    if (editRateLimit.value > 0) {
      body.rateLimit = Math.min(editRateLimit.value, maxRatePerHour.value)
    }
    if (editWindowSec.value > 0) {
      body.windowSec = editWindowSec.value
    }
    await $fetch(`/api/user/api-keys/${editingKey.value.id}`, {
      method: 'PUT',
      body,
    })
    showEditDialog.value = false
    editingKey.value = null
    loadKeys()
  } catch (e: any) {
    editError.value = e?.data?.statusMessage || e?.statusMessage || e?.message || 'Failed to update API key'
  } finally {
    savingEdit.value = false
  }
}

const showDeleteDialog = ref(false)
const deletingKey = ref<any | null>(null)
const deleting = ref(false)

const totalPages = computed(() => Math.ceil(total.value / limit.value))

const formatWindow = (s: number) => {
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  return `${Math.floor(s / 3600)}h`
}

const timeAgo = (ts: number | string) => {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const createKey = async () => {
  if (!newKeyName.value.trim()) return
  creating.value = true
  try {
    const res: any = await $fetch('/api/user/api-keys', {
      method: 'POST',
      body: { name: newKeyName.value.trim() },
    })
    createdKey.value = res.data.plainKey
    showCreateDialog.value = false
    newKeyName.value = ''
    loadKeys()
  } catch (e) {
    showErrorToast(e, 'Failed to create API key')
  } finally {
    creating.value = false
  }
}

const toggleKey = async (key: any) => {
  try {
    await $fetch(`/api/user/api-keys/${key.id}`, {
      method: 'PUT',
      body: { isActive: !key.isActive },
    })
    key.isActive = !key.isActive
  } catch (e) {
    showErrorToast(e, 'Failed to update API key')
  }
}

const confirmDelete = (key: any) => {
  deletingKey.value = key
  showDeleteDialog.value = true
}

const doDelete = async () => {
  if (!deletingKey.value) return
  deleting.value = true
  try {
    await $fetch(`/api/user/api-keys/${deletingKey.value.id}`, { method: 'DELETE' })
    showDeleteDialog.value = false
    deletingKey.value = null
    if (keys.value.length <= 1 && page.value > 1) page.value -= 1
    loadKeys()
  } catch (e) {
    showErrorToast(e, 'Failed to delete API key')
  } finally {
    deleting.value = false
  }
}

const loadKeys = async () => {
  try {
    loading.value = true
    const res: any = await $fetch('/api/user/api-keys', {
      query: { page: page.value, limit: limit.value },
    })
    keys.value = res.data || []
    total.value = res.pagination?.total || 0
    clearSelection()
  } catch (e) {
    showErrorToast(e, 'Failed to load API keys')
  } finally {
    loading.value = false
  }
}

const tierClass = (tier: string) => {
  switch (tier) {
    case 'pro': return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
    case 'enterprise': return 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
    default: return 'text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
  }
}

watch(page, () => loadKeys())
onMounted(() => loadKeys())
</script>

<style scoped>
.shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.dark .shimmer {
  background: linear-gradient(90deg, #1c1917 25%, #292524 50%, #1c1917 75%);
  background-size: 200% 100%;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
