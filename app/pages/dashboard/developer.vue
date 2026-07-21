<template>
  <div>
    <div class="flex items-center justify-between pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <div>
        <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
          {{ $t('title') }}
        </h1>
        <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">
          {{ $t('subtitle') }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <NDropdownMenu :items="bulkActions">
          <button class="font-sans text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-1">
            {{ $t('bulk_actions') }}
            <NIcon name="i-ph-caret-down" class="w-3 h-3" />
          </button>
        </NDropdownMenu>
        <OutlinedButton @click="showCreateDialog = true">{{ $t('new_key') }}</OutlinedButton>
      </div>
    </div>

    <!-- New Key Display -->
    <div v-if="createdKey" class="border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 p-4 mb-6 rounded-sm">
      <p class="font-sans text-xs text-yellow-800 dark:text-yellow-300 font-600 mb-2">{{ $t('warning_banner') }}</p>
      <div class="flex items-stretch gap-2">
        <code class="font-mono text-sm text-yellow-900 dark:text-yellow-200 break-all select-all bg-yellow-100 dark:bg-yellow-800/30 px-2 py-1.5 flex-1 rounded-sm">{{ createdKey }}</code>
        <button class="font-sans text-xs font-500 px-3 py-1.5 rounded-sm transition-colors shrink-0" :class="copied ? 'text-green-800 dark:text-green-300 bg-green-200 dark:bg-green-700/40' : 'text-yellow-800 dark:text-yellow-300 bg-yellow-200 dark:bg-yellow-700/40 hover:bg-yellow-300 dark:hover:bg-yellow-700/60'" @click="copyKey">{{ copied ? $t('common.copied') : $t('common.copy') }}</button>
      </div>
      <button class="font-sans text-xs text-yellow-700 dark:text-yellow-400 hover:text-yellow-800 mt-2 transition-colors" @click="createdKey = ''">{{ $t('common.dismiss') }}</button>
    </div>

    <!-- Bulk action bar -->
    <div v-if="selectedKeys.size > 0" class="flex items-center justify-between px-1 py-2 mb-3">
      <span class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ $t('common.selected_count', { count: selectedKeys.size }) }}</span>
      <div class="flex items-center gap-3">
        <button class="font-sans text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" @click="batchActivate">{{ $t('bulk_activate') }}</button>
        <button class="font-sans text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors" @click="batchDeactivate">{{ $t('bulk_deactivate') }}</button>
        <button class="font-sans text-xs text-red-500 hover:text-red-600 transition-colors" @click="showBatchDeleteDialog = true">{{ $t('bulk_delete') }}</button>
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
      <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-1">{{ $t('empty_title') }}</p>
      <p class="font-sans text-xs text-gray-400 dark:text-gray-500 mb-6">{{ $t('empty_desc') }}</p>
      <OutlinedButton @click="showCreateDialog = true">{{ $t('empty_action') }}</OutlinedButton>
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
        <span class="font-sans text-xs text-gray-400 dark:text-gray-500">{{ $t('select_all') }}</span>
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
                {{ key.isActive ? $t('common.status_active') : $t('common.status_inactive') }}
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 font-mono">
              <span>{{ key.keyPrefix }}...</span>
              <span class="font-sans">{{ key.rateLimit }} req / {{ formatWindow(key.windowSec) }}</span>
              <span v-if="key.lastUsedAt" class="font-sans">{{ $t('last_used') }}{{ timeAgo(key.lastUsedAt) }}</span>
              <span v-else class="font-sans">{{ $t('never_used') }}</span>
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
              {{ key.isActive ? $t('button_deactivate') : $t('button_activate') }}
            </button>
            <button class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" @click="openEditDialog(key)" :title="$t('common.edit') as string">
              <NIcon name="i-ph-pencil" class="w-3.5 h-3.5" />
            </button>
            <button class="p-1 text-gray-400 hover:text-red-500 transition-colors" @click="confirmDelete(key)" :title="$t('common.delete') as string">
              <NIcon name="i-ph-trash" class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="totalPages > 1" class="h-20" />
    </div>

    <div
      v-if="totalPages > 1"
      class="fixed bottom-0 z-20 bg-[#FAFAF9] dark:bg-[#0C0A09] border-t border-dashed border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between shadow-sm transition-all duration-300 ease-in-out"
      :style="{ left: footerLeftOffset + 'px', width: footerWidth }"
    >
      <span class="font-sans text-xs text-gray-500 dark:text-gray-400">
        Page
        <button
          class="font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 underline underline-offset-2 decoration-dotted decoration-gray-300 dark:decoration-gray-600"
          @click="showPageJumpDialog = true"
        >
          {{ page }}
        </button>
        of {{ totalPages }}
      </span>
      <div class="flex items-center gap-3">
        <OutlinedButton v-if="page > 1" @click="page = Math.max(1, page - 1)">&larr; Previous</OutlinedButton>
        <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">This is the first page</span>
        <button
          class="font-sans text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm px-2.5 py-1.5 transition-colors"
          @click="showPageJumpDialog = true"
        >
          {{ page }} / {{ totalPages }}
        </button>
        <OutlinedButton v-if="page < totalPages" @click="page = Math.min(totalPages, page + 1)">Next &rarr;</OutlinedButton>
        <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">This is the last page</span>
      </div>
    </div>

    <!-- API Info -->
    <div class="border border-dashed border-gray-200 dark:border-gray-700 p-4 mb-6 rounded-sm">
      <h3 class="font-sans text-xs font-600 text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{{ $t('section_public_api') }}</h3>
      <p class="font-sans text-xs text-gray-600 dark:text-gray-400 mb-2">
        {{ $t('desc_public_api') }}
      </p>
      <div class="bg-gray-50 dark:bg-gray-900 p-3 font-mono text-xs text-gray-700 dark:text-gray-300 rounded-sm">
        <p><span class="text-gray-400">{{ $t('code_auth') }}</span></p>
        <p>curl -H "Authorization: Bearer vbt_xxxxxxxx..." {{ siteUrl }}/api/v1/me</p>
        <p class="mt-1"><span class="text-gray-400">{{ $t('code_list_quotes') }}</span></p>
        <p>curl -H "Authorization: Bearer vbt_xxx..." {{ siteUrl }}/api/v1/quotes?page=1&limit=5</p>
      </div>
    </div>

    <!-- Create Key Dialog -->
    <NDialog v-model:open="showCreateDialog">
      <template #header><h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">{{ $t('dialog_create_title') }}</h3></template>
      <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mb-4">
        {{ $t('dialog_create_desc') }}
      </p>
      <input
        v-model="newKeyName"
        type="text"
              :placeholder="$t('dialog_create_placeholder') as string"
        class="w-full font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-gray-500"
        @keydown.enter="createKey"
      />
      <div class="mt-4">
        <label class="font-sans text-xs text-gray-500 dark:text-gray-400 block mb-2">{{ $t('permissions_label') }}</label>
        <div class="flex gap-3 flex-wrap">
          <label v-for="perm in availablePermissions" :key="perm.value" class="flex items-center gap-2 font-sans text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" :value="perm.value" v-model="newKeyPermissions" class="accent-gray-700 dark:accent-gray-300" />
            {{ perm.label }}
          </label>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="font-sans text-xs text-gray-500 hover:text-gray-700 transition-colors px-3 py-1.5" @click="showCreateDialog = false">{{ $t('common.cancel') }}</button>
          <OutlinedButton :disabled="!newKeyName.trim()" :loading="creating" @click="createKey">{{ $t('dialog_create_button') }}</OutlinedButton>
        </div>
      </template>
    </NDialog>

    <!-- Edit Key Dialog -->
    <NDialog v-model:open="showEditDialog">
      <template #header><h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">{{ $t('dialog_edit_title') }}</h3></template>
      <div class="space-y-4">
        <div>
          <label class="font-sans text-xs text-gray-500 dark:text-gray-400 block mb-1">{{ $t('label_name') }}</label>
          <input
            v-model="editName"
            type="text"
            :placeholder="$t('placeholder_name') as string"
            class="w-full font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-gray-500"
            @keydown.enter="saveEdit"
          />
        </div>
        <div>
          <label class="font-sans text-xs text-gray-500 dark:text-gray-400 block mb-1">
            {{ $t('label_rate_limit') }}
            <span class="text-gray-400 font-normal">{{ $t('helper_rate_limit', { n: maxRatePerHour, tier: editingKey?.tier }) }}</span>
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
              <option :value="60">{{ $t('option_per_minute') }}</option>
              <option :value="3600">{{ $t('option_per_hour') }}</option>
              <option :value="86400">{{ $t('option_per_day') }}</option>
            </select>
          </div>
          <p class="font-sans text-xs text-gray-400 dark:text-gray-500 mt-1.5">
            {{ $t('rate_display', { n: effectivePerHour }) }}
          </p>
        </div>
        <div>
          <label class="font-sans text-xs text-gray-500 dark:text-gray-400 block mb-2">{{ $t('permissions_label') }}</label>
          <div class="flex gap-3 flex-wrap">
            <label v-for="perm in availablePermissions" :key="perm.value" class="flex items-center gap-2 font-sans text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" :value="perm.value" v-model="editPermissions" class="accent-gray-700 dark:accent-gray-300" />
              {{ perm.label }}
            </label>
          </div>
        </div>
      </div>
      <div v-if="editError" class="font-sans text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-sm -mb-2">
        <p>{{ editError }}</p>
        <button class="mt-1.5 underline underline-offset-2 hover:text-red-800 dark:hover:text-red-300 transition-colors" @click="applyRecommendedRate">
          {{ $t('rate_recommended', { n: maxRatePerHour }) }}
        </button>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="font-sans text-xs text-gray-500 hover:text-gray-700 transition-colors px-3 py-1.5" @click="showEditDialog = false">{{ $t('common.cancel') }}</button>
          <OutlinedButton :disabled="!editName.trim()" :loading="savingEdit" @click="saveEdit">{{ $t('common.save') }}</OutlinedButton>
        </div>
      </template>
    </NDialog>

    <!-- Delete Dialog -->
    <NDialog v-model:open="showDeleteDialog">
      <template #header><h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">{{ $t('dialog_delete_title') }}</h3></template>
      <p class="font-sans text-sm text-gray-600 dark:text-gray-400 mb-4">
        {{ $t('dialog_delete_body', { name: deletingKey?.name }) }}
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="font-sans text-xs text-gray-500 hover:text-gray-700 transition-colors px-3 py-1.5" @click="showDeleteDialog = false">{{ $t('common.cancel') }}</button>
          <OutlinedButton variant="destructive" :loading="deleting" @click="doDelete">{{ $t('common.delete') }}</OutlinedButton>
        </div>
      </template>
    </NDialog>

    <!-- Batch Delete Dialog -->
    <NDialog v-model:open="showBatchDeleteDialog">
      <template #header><h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">{{ $t('dialog_batch_delete_title') }}</h3></template>
      <p class="font-sans text-sm text-gray-600 dark:text-gray-400 mb-4">
        {{ $t('dialog_batch_delete_body', { n: selectedKeys.size }) }}
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="font-sans text-xs text-gray-500 hover:text-gray-700 transition-colors px-3 py-1.5" @click="showBatchDeleteDialog = false">{{ $t('common.cancel') }}</button>
          <OutlinedButton variant="destructive" :loading="batchDeleting" @click="doBatchDelete">{{ $t('dialog_delete_all') }}</OutlinedButton>
        </div>
      </template>
    </NDialog>

    <PageJumpDialog
      v-model="showPageJumpDialog"
      :total-pages="totalPages"
      @jump="onPageJump"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const { $t } = useI18n()

useHead({ title: $t('meta_title') as string })
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
const newKeyPermissions = ref<string[]>(['read'])
const creating = ref(false)
const createdKey = ref('')
const copied = ref(false)

const availablePermissions = [
  { label: 'Read', value: 'read' },
  { label: 'Write: Quotes', value: 'write:quotes' },
  { label: 'Write: Authors', value: 'write:authors' },
  { label: 'Write: References', value: 'write:references' },
  { label: 'Write: Collections', value: 'write:collections' },
  { label: 'All (*)', value: '*' },
]

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

const bulkActions = computed((): any[] => [
  {
    label: $t('dropdown_activate_all') as string,
    leading: 'i-ph-play',
    onclick: async () => {
      await Promise.all(keys.value.filter(k => !k.isActive).map(k => toggleKey(k)))
      clearSelection()
    },
  },
  {},
  {
    label: $t('dropdown_deactivate_all') as string,
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
    showErrorToast(e, $t('error_bulk_delete') as string)
  } finally {
    batchDeleting.value = false
  }
}

const showEditDialog = ref(false)
const editingKey = ref<any | null>(null)
const editName = ref('')
const editPermissions = ref<string[]>([])
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
  editPermissions.value = [...(key.permissions || ['read'])]
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
    if (editPermissions.value.length > 0) {
      body.permissions = editPermissions.value
    }
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
  if (mins < 1) return $t('time_just_now')
  if (mins < 60) return $t('time_m_ago', { m: mins })
  const hours = Math.floor(mins / 60)
  if (hours < 24) return $t('time_h_ago', { h: hours })
  return $t('time_d_ago', { d: Math.floor(hours / 24) })
}

const createKey = async () => {
  if (!newKeyName.value.trim()) return
  creating.value = true
  try {
    const res: any = await $fetch('/api/user/api-keys', {
      method: 'POST',
      body: { name: newKeyName.value.trim(), permissions: newKeyPermissions.value },
    })
    createdKey.value = res.data.plainKey
    showCreateDialog.value = false
    newKeyName.value = ''
    newKeyPermissions.value = ['read']
    loadKeys()
  } catch (e) {
    showErrorToast(e, $t('error_create') as string)
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
    showErrorToast(e, $t('error_update') as string)
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
    showErrorToast(e, $t('error_delete') as string)
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
    showErrorToast(e, $t('error_load') as string)
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

const showPageJumpDialog = ref(false)
const footerLeftOffset = ref(0)
const footerWidth = ref('100%')

const onPageJump = (pageNum: number) => {
  page.value = pageNum
}

let footerObserver: ResizeObserver | null = null

const updateFooterPosition = () => {
  const mainEl = document.querySelector('main')
  if (!mainEl) {
    footerLeftOffset.value = 0
    footerWidth.value = '100%'
    return
  }
  const rect = mainEl.getBoundingClientRect()
  footerLeftOffset.value = rect.left
  footerWidth.value = `${rect.width}px`
}

onMounted(() => {
  updateFooterPosition()
  footerObserver = new ResizeObserver(updateFooterPosition)
  const mainEl = document.querySelector('main')
  if (mainEl) footerObserver.observe(mainEl)
  window.addEventListener('resize', updateFooterPosition)
})

onUnmounted(() => {
  if (footerObserver) footerObserver.disconnect()
  window.removeEventListener('resize', updateFooterPosition)
})
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
