<template>
  <div class="space-y-6">
    <header class="border-b border-gray-200 pb-6 dark:border-gray-800">
      <h1 class="font-serif text-3xl font-200 text-gray-900 dark:text-gray-100 md:text-4xl">{{ $t('title') }}</h1>
      <p class="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400">{{ $t('subtitle') }}</p>
    </header>
    <form class="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:grid-cols-2 xl:grid-cols-4" @submit.prevent="applyFilters">
      <label class="text-xs text-gray-500 dark:text-gray-400">{{ $t('from') }}<input v-model="draft.from" type="date" class="mt-1 block min-h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-900 dark:border-gray-700 dark:text-gray-100"></label>
      <label class="text-xs text-gray-500 dark:text-gray-400">{{ $t('to') }}<input v-model="draft.to" type="date" class="mt-1 block min-h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-900 dark:border-gray-700 dark:text-gray-100"></label>
      <label class="text-xs text-gray-500 dark:text-gray-400">{{ $t('actor') }}<input v-model="draft.actor" type="search" :placeholder="$t('actor_placeholder') as string" class="mt-1 block min-h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-900 dark:border-gray-700 dark:text-gray-100"></label>
      <label class="text-xs text-gray-500 dark:text-gray-400">{{ $t('api_key') }}<input v-model="draft.api_key" type="search" :placeholder="$t('key_placeholder') as string" class="mt-1 block min-h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-900 dark:border-gray-700 dark:text-gray-100"></label>
      <label class="text-xs text-gray-500 dark:text-gray-400">{{ $t('action') }}<select v-model="draft.action" class="mt-1 block min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"><option value="">{{ $t('all_actions') }}</option><option value="create">{{ $t('create') }}</option><option value="update">{{ $t('update') }}</option><option value="delete">{{ $t('delete') }}</option></select></label>
      <label class="text-xs text-gray-500 dark:text-gray-400">{{ $t('source') }}<select v-model="draft.source" class="mt-1 block min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"><option value="">{{ $t('all_sources') }}</option><option value="web">{{ $t('source_web') }}</option><option value="admin_ui">{{ $t('source_admin_ui') }}</option><option value="admin_enrichment">{{ $t('source_enrichment') }}</option><option value="api_v1">API v1</option><option value="sdk">SDK</option><option value="cli">CLI</option><option value="admin_import">{{ $t('source_import') }}</option></select></label>
      <label class="text-xs text-gray-500 dark:text-gray-400 sm:col-span-2">{{ $t('target') }}<input v-model="draft.target" type="search" :placeholder="$t('target_placeholder') as string" class="mt-1 block min-h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-900 dark:border-gray-700 dark:text-gray-100"></label>
      <div class="flex items-end gap-2 xl:col-span-4"><NButton btn="solid-black" class="min-h-10 px-4" type="submit" :disabled="loading">{{ $t('apply') }}</NButton><NButton btn="outline-gray" class="min-h-10 px-4" type="button" :disabled="loading" @click="resetFilters">{{ $t('reset') }}</NButton></div>
    </form>
    <p v-if="error" role="alert" class="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{{ error }}</p>
    <div v-if="loading && events.length === 0" class="py-12 text-center text-sm text-gray-500">{{ $t('loading') }}</div>
    <div v-else-if="events.length === 0" class="rounded-xl border border-gray-200 py-12 text-center text-sm text-gray-500 dark:border-gray-800">{{ $t('empty') }}</div>
    <div v-else class="space-y-3" :aria-busy="loading">
      <article v-for="item in events" :key="item.id" class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <details class="group">
          <summary class="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-2 p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500">
            <time class="font-mono text-xs text-gray-500 dark:text-gray-400">{{ formatDate(item.occurredAt) }}</time>
            <span class="rounded-full px-2 py-1 text-xs font-medium" :class="actionClass(item.action)">{{ actionLabel(item.action) }}</span>
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ item.targetType }} #{{ item.targetId }}</span>
            <span class="text-sm text-gray-600 dark:text-gray-300">{{ item.actorUserName || $t('unknown_actor') }}</span>
            <span v-if="item.apiKeyId" class="text-xs text-gray-500 dark:text-gray-400">{{ item.apiKeyName || $t('api_key') }} #{{ item.apiKeyId }} · {{ item.apiKeyPrefix }}</span>
            <span class="ml-auto rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-300">{{ sourceLabel(item.source) }}</span>
            <span v-if="item.taskId" class="w-full truncate font-mono text-[11px] text-gray-400">{{ $t('task') }}: {{ item.taskId }}</span>
          </summary>
          <div class="grid gap-4 border-t border-gray-200 p-4 dark:border-gray-800 lg:grid-cols-2">
            <section v-if="item.beforeJson"><h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{{ $t('before') }}</h2><pre class="max-h-96 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200">{{ prettyJson(item.beforeJson) }}</pre></section>
            <section v-if="item.afterJson"><h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{{ $t('after') }}</h2><pre class="max-h-96 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200">{{ prettyJson(item.afterJson) }}</pre></section>
            <p v-if="item.requestId" class="break-all text-xs text-gray-500 lg:col-span-2">{{ $t('request') }}: <code>{{ item.requestId }}</code></p>
          </div>
        </details>
      </article>
      <div class="flex justify-center pt-2"><NButton v-if="nextBeforeId" btn="outline-gray" :disabled="loading" @click="loadMore">{{ loading ? $t('loading') : $t('load_more') }}</NButton></div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

interface AuditEvent {
  id: number
  occurredAt: string
  actorUserName: string | null
  apiKeyId: number | null
  apiKeyName: string | null
  apiKeyPrefix: string | null
  action: string
  targetType: string
  targetId: string
  beforeJson: string | null
  afterJson: string | null
  source: string
  taskId: string | null
  requestId: string | null
}

interface AuditFilters {
  from: string
  to: string
  actor: string
  api_key: string
  action: string
  source: string
  target: string
}

const { $t } = useI18n()
useHead({ title: $t('meta_title') as string })
const draft = reactive<AuditFilters>({ from: '', to: '', actor: '', api_key: '', action: '', source: '', target: '' })
const filters = ref<AuditFilters>({ ...draft })
const events = ref<AuditEvent[]>([])
const nextBeforeId = ref<number | null>(null)
const loading = ref(false)
const error = ref('')

async function fetchEvents(append = false) {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    const response = await $fetch<{ data: AuditEvent[], next_before_id: number | null }>('/api/admin/quote-editorial-audit', {
      query: { limit: 50, ...(append && nextBeforeId.value ? { before_id: nextBeforeId.value } : {}), ...filters.value },
    })
    events.value = append ? [...events.value, ...response.data] : response.data
    nextBeforeId.value = response.next_before_id
  } catch {
    error.value = String($t('load_error'))
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  filters.value = { ...draft }
  nextBeforeId.value = null
  void fetchEvents()
}

function resetFilters() {
  Object.assign(draft, { from: '', to: '', actor: '', api_key: '', action: '', source: '', target: '' })
  applyFilters()
}

function loadMore() {
  void fetchEvents(true)
}

function prettyJson(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

function formatDate(value: string) {
  const parsed = new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`)
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'medium' }).format(parsed)
}

function actionLabel(action: string) {
  return $t(action === 'create' ? 'create' : action === 'delete' ? 'delete' : 'update')
}

function actionClass(action: string) {
  return action === 'create'
    ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
    : action === 'delete'
      ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
}

function sourceLabel(source: string) {
  const key = ({ web: 'source_web', admin_ui: 'source_admin_ui', admin_enrichment: 'source_enrichment', admin_import: 'source_import', sdk: 'source_sdk', cli: 'source_cli', api_v1: 'source_api' } as Record<string, string>)[source]
  return key ? $t(key) : source
}

onMounted(() => { void fetchEvents() })
</script>
