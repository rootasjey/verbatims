<template>
  <div>
    <!-- Editorial Header -->
    <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
            API Keys
          </h1>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ total }} {{ total === 1 ? 'key' : 'keys' }}
            <span class="text-green-600 dark:text-green-400">&middot; Manage public API access</span>
          </p>
        </div>
        <div class="hidden md:flex items-center gap-3">
          <input v-model="searchQuery" type="text" placeholder="Search keys..." class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none w-48" />
          <OutlinedButton @click="openCreateDialog">+ Create Key</OutlinedButton>
        </div>
      </div>
      <div class="md:hidden mt-4">
        <input v-model="searchQuery" type="text" placeholder="Search keys..." class="w-full font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && keys.length === 0" class="space-y-5">
      <div v-for="i in 5" :key="i" class="animate-pulse pb-5 border-b border-dashed border-gray-100 dark:border-gray-800">
        <div class="h-4 bg-gray-100 dark:bg-gray-900 rounded w-3/4 mb-2" /><div class="h-3 bg-gray-100 dark:bg-gray-900 rounded w-1/4" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="keys.length === 0 && !loading" class="py-16 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-sm">
      <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">{{ searchQuery ? 'No matching keys' : 'No API keys yet' }}</p>
      <p class="font-sans text-xs text-gray-400 dark:text-gray-500 mb-4">Create your first API key to start using the public API.</p>
      <OutlinedButton @click="openCreateDialog">+ Create Key</OutlinedButton>
    </div>

    <!-- Table -->
    <div v-else>
      <div class="border border-dashed border-gray-200 dark:border-gray-700 rounded-sm overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0C0A09]">
              <th class="px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Name</th>
              <th class="px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Key</th>
              <th class="w-20 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Tier</th>
              <th class="w-24 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
              <th class="w-24 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Rate Limit</th>
              <th class="w-32 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Permissions</th>
              <th class="w-28 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Owner</th>
              <th class="w-28 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Created</th>
              <th class="w-10 px-3 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="key in keys" :key="key.id" class="transition-colors group hover:bg-[#FAFAF9] dark:hover:bg-[#1C1B1A]">
              <td class="px-3 py-3">
                <p class="font-sans text-sm text-gray-900 dark:text-gray-100">{{ key.name }}</p>
              </td>
              <td class="px-3 py-3">
                <code class="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{{ key.keyPrefix }}...</code>
              </td>
              <td class="px-3 py-3">
                <span class="font-sans text-xs px-1.5 py-0.5" :class="tierClass(key.tier)">{{ key.tier }}</span>
              </td>
              <td class="px-3 py-3">
                <span class="font-sans text-xs px-1.5 py-0.5" :class="key.isActive ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20' : 'text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'">
                  {{ key.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-3 py-3 font-sans text-xs text-gray-500 dark:text-gray-400">
                {{ key.rateLimit }}/{{ formatWindow(key.windowSec) }}
              </td>
              <td class="px-3 py-3">
                <div class="flex gap-1 flex-wrap">
                  <span v-for="perm in key.permissions" :key="perm" class="font-mono text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5">{{ perm }}</span>
                </div>
              </td>
              <td class="px-3 py-3 font-sans text-xs text-gray-500 dark:text-gray-400">{{ key.userName }}</td>
              <td class="px-3 py-3 font-sans text-xs text-gray-500 dark:text-gray-400">{{ formatDate(key.createdAt) }}</td>
              <td class="px-3 py-3">
                <NDropdownMenu :items="getRowActions(key)">
                  <button @click.stop class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><NIcon name="i-ph-dots-three-vertical" class="w-4 h-4" /></button>
                </NDropdownMenu>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between pt-4">
        <span class="font-sans text-xs text-gray-500 dark:text-gray-400">Page {{ currentPage }} of {{ totalPages }} &middot; {{ total }} {{ total === 1 ? 'key' : 'keys' }}</span>
        <div class="flex items-center gap-3">
          <OutlinedButton v-if="currentPage > 1" @click="currentPage = Math.max(1, currentPage - 1)">&larr; Previous</OutlinedButton>
          <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">First page</span>
          <OutlinedButton v-if="currentPage < totalPages" @click="currentPage = Math.min(totalPages, currentPage + 1)">Next &rarr;</OutlinedButton>
          <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">Last page</span>
        </div>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <NDialog v-model:open="showDialog">
      <template #header>
        <h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">{{ editingKey ? 'Edit API Key' : 'Create API Key' }}</h3>
      </template>
      <div class="space-y-4">
        <div>
          <label class="font-sans text-xs text-gray-500 dark:text-gray-400 block mb-1">Name</label>
          <input v-model="form.name" type="text" placeholder="e.g. My mobile app" class="w-full font-sans text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label class="font-sans text-xs text-gray-500 dark:text-gray-400 block mb-1">Tier</label>
          <select v-model="form.tier" class="w-full font-sans text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2 py-1.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400 cursor-pointer">
            <option v-for="t in tierOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </div>
        <div>
          <label class="font-sans text-xs text-gray-500 dark:text-gray-400 block mb-1">Permissions</label>
          <div class="flex gap-3 flex-wrap">
            <label v-for="perm in availablePermissions" :key="perm.value" class="flex items-center gap-2 font-sans text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" :value="perm.value" v-model="form.permissions" class="accent-gray-700 dark:accent-gray-300" />
              {{ perm.label }}
            </label>
          </div>
        </div>
        <div class="flex gap-4">
          <div class="flex-1">
            <label class="font-sans text-xs text-gray-500 dark:text-gray-400 block mb-1">Rate limit (requests)</label>
            <input v-model.number="form.rateLimit" type="number" min="1" class="w-full font-sans text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2 py-1.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400" />
          </div>
          <div class="flex-1">
            <label class="font-sans text-xs text-gray-500 dark:text-gray-400 block mb-1">Window (seconds)</label>
            <input v-model.number="form.windowSec" type="number" min="1" class="w-full font-sans text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2 py-1.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-400" />
          </div>
        </div>

        <!-- Show plain key after creation -->
        <div v-if="createdKey" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-3 rounded-sm">
          <p class="font-sans text-xs text-yellow-800 dark:text-yellow-300 font-600 mb-2">Save this key — it won't be shown again!</p>
          <div class="flex items-stretch gap-2">
            <code class="font-mono text-sm text-yellow-900 dark:text-yellow-200 break-all select-all flex-1">{{ createdKey }}</code>
            <button class="font-sans text-xs font-500 px-3 py-1.5 rounded-sm transition-colors shrink-0" :class="copied ? 'text-green-800 dark:text-green-300 bg-green-200 dark:bg-green-700/40' : 'text-yellow-800 dark:text-yellow-300 bg-yellow-200 dark:bg-yellow-700/40 hover:bg-yellow-300 dark:hover:bg-yellow-700/60'" @click="copyKey">{{ copied ? 'Copied!' : 'Copy' }}</button>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-3 py-1.5" @click="closeDialog">Cancel</button>
          <OutlinedButton :loading="saving" :variant="editingKey ? undefined : undefined" @click="save">{{ editingKey ? 'Save' : 'Create' }}</OutlinedButton>
        </div>
      </template>
    </NDialog>

    <!-- Delete Dialog -->
    <NDialog v-model:open="showDeleteDialog">
      <template #header><h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">Delete API Key</h3></template>
      <p class="font-sans text-sm text-gray-600 dark:text-gray-400 mb-4">
        Are you sure you want to delete the key <strong class="text-gray-900 dark:text-gray-100">{{ deletingKey?.name }}</strong>?
        This action cannot be undone. Any applications using this key will lose access immediately.
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-3 py-1.5" @click="showDeleteDialog = false">Cancel</button>
          <OutlinedButton variant="destructive" :loading="deleting" @click="confirmDelete">Delete</OutlinedButton>
        </div>
      </template>
    </NDialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'API Keys - Admin - Verbatims' })
const { showErrorToast } = useErrorToast()

const loading = ref(false)
const keys = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(50)
const searchQuery = ref('')

const showDialog = ref(false)
const editingKey = ref<any | null>(null)
const saving = ref(false)
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

const showDeleteDialog = ref(false)
const deletingKey = ref<any | null>(null)
const deleting = ref(false)

const availablePermissions = [
  { label: 'Read', value: 'read' },
  { label: 'Write', value: 'write' },
  { label: 'Admin', value: 'admin' },
]

const tierOptions = [
  { label: 'Free — 1,000 req/h', value: 'free' },
  { label: 'Pro — 10,000 req/h', value: 'pro' },
  { label: 'Enterprise — Custom', value: 'enterprise' },
]

const form = reactive({
  name: '',
  tier: 'free',
  permissions: ['read'],
  rateLimit: 1000,
  windowSec: 3600,
})

const tierClass = (tier: string) => {
  switch (tier) {
    case 'pro': return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
    case 'enterprise': return 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
    default: return 'text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
  }
}

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const formatWindow = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h`
}

const formatDate = (ts: number | string | null | undefined) => {
  if (!ts) return '\u2014'
  const d = new Date(ts)
  if (isNaN(d.getTime())) return '\u2014'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const resetForm = () => {
  form.name = ''
  form.tier = 'free'
  form.permissions = ['read']
  form.rateLimit = 1000
  form.windowSec = 3600
  createdKey.value = ''
  editingKey.value = null
}

const openCreateDialog = () => {
  resetForm()
  showDialog.value = true
}

const getRowActions = (key: any) => [
  {
    label: key.isActive ? 'Deactivate' : 'Activate',
    leading: key.isActive ? 'i-ph-pause' : 'i-ph-play',
    onclick: async () => {
      await $fetch(`/api/admin/api-keys/${key.id}`, { method: 'PUT', body: { isActive: !key.isActive } })
      loadKeys()
    },
  },
  {},
  {
    label: 'Edit',
    leading: 'i-ph-pencil',
    onclick: () => {
      editingKey.value = key
      form.name = key.name
      form.permissions = [...key.permissions]
      form.rateLimit = key.rateLimit
      form.windowSec = key.windowSec
      form.tier = key.tier
      showDialog.value = true
    },
  },
  {},
  {
    label: 'Delete',
    leading: 'i-ph-trash',
    onclick: () => {
      deletingKey.value = key
      showDeleteDialog.value = true
    },
  },
]

const closeDialog = () => {
  showDialog.value = false
  resetForm()
}

const save = async () => {
  if (!form.name.trim()) return
  saving.value = true
  try {
    if (editingKey.value) {
      await $fetch(`/api/admin/api-keys/${editingKey.value.id}`, {
        method: 'PUT',
        body: {
          name: form.name.trim(),
          tier: form.tier,
          permissions: form.permissions,
          rateLimit: form.rateLimit,
          windowSec: form.windowSec,
        },
      })
    } else {
      const res = await $fetch('/api/admin/api-keys', {
        method: 'POST',
        body: {
          name: form.name.trim(),
          tier: form.tier,
          permissions: form.permissions,
          rateLimit: form.rateLimit,
          windowSec: form.windowSec,
        },
      })
      createdKey.value = (res as any).data?.plainKey || ''
      // Don't close dialog — show the key
      saveAndContinue()
    }
    loadKeys()
  } catch (e) {
    showErrorToast(e, 'Failed to save API key')
  } finally {
    saving.value = false
  }
}

const saveAndContinue = async () => {
  // Wait for user to copy the key, then close
  // The dialog stays open with the key displayed
  // User clicks Cancel to close
}

const confirmDelete = async () => {
  if (!deletingKey.value) return
  deleting.value = true
  try {
    await $fetch(`/api/admin/api-keys/${deletingKey.value.id}`, { method: 'DELETE' })
    showDeleteDialog.value = false
    deletingKey.value = null
    if (keys.value.length <= 1 && currentPage.value > 1) currentPage.value -= 1
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
    const res: any = await $fetch('/api/admin/api-keys', {
      query: {
        page: currentPage.value,
        limit: pageSize.value,
        search: searchQuery.value || undefined,
      },
    })
    keys.value = res.data?.apiKeys || []
    total.value = res.pagination?.total || 0
  } catch (e) {
    console.error('Failed to load API keys', e)
    showErrorToast(e, 'Failed to load API keys')
  } finally {
    loading.value = false
  }
}

watchDebounced([currentPage, searchQuery], () => { loadKeys() }, { debounce: 300 })
onMounted(() => { loadKeys() })
</script>
