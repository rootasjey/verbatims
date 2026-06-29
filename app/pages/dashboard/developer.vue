<template>
  <div>
    <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
            Developer
          </h1>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage your API keys for the Verbatims public API
          </p>
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

    <!-- Create Key -->
    <div class="border border-dashed border-gray-200 dark:border-gray-700 p-4 mb-6 rounded-sm">
      <h3 class="font-sans text-xs font-600 text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Create a new key</h3>
      <div class="flex items-center gap-3">
        <input
          v-model="newKeyName"
          type="text"
          placeholder="e.g. My CLI tool"
          class="flex-1 font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-gray-500"
          @keydown.enter="createKey"
        />
        <OutlinedButton :disabled="!newKeyName.trim()" :loading="creating" @click="createKey">Create</OutlinedButton>
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

    <!-- Loading -->
    <div v-if="loading && keys.length === 0" class="space-y-4">
      <div v-for="i in 3" :key="i" class="animate-pulse border border-dashed border-gray-100 dark:border-gray-800 p-4 rounded-sm">
        <div class="h-4 bg-gray-100 dark:bg-gray-900 rounded w-1/2 mb-2" />
        <div class="h-3 bg-gray-100 dark:bg-gray-900 rounded w-1/4" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="keys.length === 0 && !loading" class="py-16 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-sm">
      <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-1">No API keys yet</p>
      <p class="font-sans text-xs text-gray-400 dark:text-gray-500">Create one above to get started.</p>
    </div>

    <!-- Keys List -->
    <div v-else class="space-y-3">
      <div
        v-for="key in keys"
        :key="key.id"
        class="border border-dashed border-gray-200 dark:border-gray-700 p-4 rounded-sm hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
      >
        <div class="flex items-start justify-between gap-3">
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
          <div class="flex items-center gap-2 shrink-0">
            <button
              class="font-sans text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              @click="toggleKey(key)"
            >
              {{ key.isActive ? 'Deactivate' : 'Activate' }}
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
const loading = ref(false)

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
    await $fetch(`/api/admin/api-keys/${key.id}`, {
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
