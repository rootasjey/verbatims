<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4 pb-6">
      <div>
        <h1 class="font-serif text-3xl font-200 text-gray-900 dark:text-gray-100 md:text-4xl">{{ $t('title') }}</h1>
        <p class="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400">{{ $t('subtitle') }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <NButton btn="outline-gray" class="min-h-10 px-4" :leading="sortOrder === 'newest' ? 'i-ph-sort-descending' : 'i-ph-sort-ascending'" :aria-label="sortOrderLabel" :disabled="loading" @click="toggleSortOrder">
          {{ $t(sortOrder === 'newest' ? 'newest_first' : 'oldest_first') }}
        </NButton>
        <NButton id="editorial-history-filters-trigger" btn="outline-gray" class="min-h-10 px-4" leading="i-ph-funnel" :aria-expanded="filtersOpen" @click="filtersOpen = true">
          {{ $t('filters') }}<span v-if="activeFilterCount" class="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-800">{{ activeFilterCount }}</span>
        </NButton>
      </div>
    </header>
    <AdminEditorialHistoryFilterDialog v-model:open="filtersOpen" :title="$t('filters') as string" :close-label="$t('close_filters') as string">
    <form class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" @submit.prevent="applyFilters">
      <label class="text-xs text-gray-500 dark:text-gray-400">{{ $t('from') }}<input v-model="draft.from" type="date" class="mt-1 block min-h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-900 dark:border-gray-700 dark:text-gray-100"></label>
      <label class="text-xs text-gray-500 dark:text-gray-400">{{ $t('to') }}<input v-model="draft.to" type="date" class="mt-1 block min-h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-900 dark:border-gray-700 dark:text-gray-100"></label>
      <label class="text-xs text-gray-500 dark:text-gray-400">{{ $t('actor') }}<input v-model="draft.actor" type="search" :placeholder="$t('actor_placeholder') as string" class="mt-1 block min-h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-900 dark:border-gray-700 dark:text-gray-100"></label>
      <label class="text-xs text-gray-500 dark:text-gray-400">{{ $t('api_key') }}<input v-model="draft.api_key" type="search" :placeholder="$t('key_placeholder') as string" class="mt-1 block min-h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-900 dark:border-gray-700 dark:text-gray-100"></label>
      <label class="text-xs text-gray-500 dark:text-gray-400">
        {{ $t('action') }}
        <NCombobox
          v-model="selectedActionOption"
          :items="actionOptions"
          by="value"
          :_combobox-input="{ placeholder: $t('search_options') as string, class: 'text-sm' }"
          :_combobox-list="{ class: 'z-[60] min-w-[180px] rounded-lg border border-gray-700 shadow-xl' }"
          :_combobox-trigger="{ ariaLabel: $t('action') as string, btn: 'outline-gray', size: 'md', trailing: 'i-lucide-chevron-down', class: 'mt-1 min-h-10 w-full justify-between rounded-lg font-sans text-sm' }"
        >
          <template #trigger="{ modelValue }">{{ modelValue?.label }}</template>
        </NCombobox>
      </label>
      <label class="text-xs text-gray-500 dark:text-gray-400">
        {{ $t('source') }}
        <NCombobox
          v-model="selectedSourceOption"
          :items="sourceOptions"
          by="value"
          :_combobox-input="{ placeholder: $t('search_options') as string, class: 'text-sm' }"
          :_combobox-list="{ class: 'z-[60] min-w-[220px] rounded-lg border border-gray-700 shadow-xl' }"
          :_combobox-trigger="{ ariaLabel: $t('source') as string, btn: 'outline-gray', size: 'md', trailing: 'i-lucide-chevron-down', class: 'mt-1 min-h-10 w-full justify-between rounded-lg font-sans text-sm' }"
        >
          <template #trigger="{ modelValue }">{{ modelValue?.label }}</template>
        </NCombobox>
      </label>
      <label class="text-xs text-gray-500 dark:text-gray-400 sm:col-span-2">{{ $t('target') }}<input v-model="draft.target" type="search" :placeholder="$t('target_placeholder') as string" class="mt-1 block min-h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-900 dark:border-gray-700 dark:text-gray-100"></label>
      <div class="sticky bottom-0 z-10 flex items-end gap-2 bg-[#FAFAF9] py-3 dark:bg-[#0C0A09] sm:col-span-2 xl:col-span-4"><NButton btn="solid-black" class="min-h-10 px-4" type="submit" :disabled="loading">{{ $t('apply') }}</NButton><NButton id="editorial-history-reset-filters" btn="outline-gray" class="min-h-10 px-4" type="button" :disabled="loading" @click="resetFilters">{{ $t('reset') }}</NButton></div>
    </form>
    </AdminEditorialHistoryFilterDialog>
    <p v-if="error" role="alert" class="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{{ error }}</p>
    <div v-if="loading && events.length === 0" class="py-12 text-center text-sm text-gray-500">{{ $t('loading') }}</div>
    <div v-else-if="events.length === 0" class="rounded-xl border border-gray-200 py-12 text-center text-sm text-gray-500 dark:border-gray-800">{{ $t('empty') }}</div>
    <div v-else class="space-y-3" :aria-busy="loading">
      <TransitionGroup name="audit-events" tag="div" class="relative space-y-3">
      <article v-for="item in events" :key="item.id" class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div>
          <button type="button" class="flex w-full cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500" :aria-expanded="openEventId === item.id" @click="toggleEvent(item.id)">
            <time class="font-mono text-xs text-gray-500 dark:text-gray-400">{{ formatDate(item.occurredAt) }}</time>
            <span class="rounded-full px-2 py-1 text-xs font-medium" :class="actionClass(item.action)">{{ actionLabel(item.action) }}</span>
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ item.targetType }} #{{ item.targetId }}</span>
            <span class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <UserAvatar v-if="item.actorUserId" :src="item.actorAvatarUrl" :alt="item.actorUserName || ($t('unknown_actor') as string)" size="xs" square="1.75em" class="shrink-0" />
              <span class="font-medium">{{ item.actorUserName || $t('unknown_actor') }}</span>
            </span>
            <span v-if="item.apiKeyId" class="text-xs text-gray-500 dark:text-gray-400">{{ item.apiKeyName || $t('api_key') }} #{{ item.apiKeyId }} · {{ item.apiKeyPrefix }}</span>
            <span class="ml-auto rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-300">{{ sourceLabel(item.source) }}</span>
            <NIcon name="i-tabler-chevron-down" class="ml-2 h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 motion-reduce:transition-none" :class="openEventId === item.id ? 'rotate-180' : ''" aria-hidden="true" />
            <span v-if="item.taskId" class="w-full truncate font-mono text-[11px] text-gray-400">{{ $t('task') }}: {{ item.taskId }}</span>
          </button>
          <Transition name="audit-detail">
          <div v-if="openEventId === item.id" class="audit-detail-transition">
          <div class="audit-detail-inner grid gap-4 border-t border-gray-200 p-4 dark:border-gray-800 lg:grid-cols-2">
            <AdminEditorialAuditPayload
              v-if="item.beforeJson || item.afterJson"
              :action="item.action"
              :before-json="item.beforeJson"
              :after-json="item.afterJson"
              :before-label="$t('before') as string"
              :after-label="$t('after') as string"
              :view-label="$t('view_mode') as string"
              :diff-label="$t('diff_view') as string"
              :json-label="$t('json_view') as string"
              :added-label="$t('added') as string"
              :removed-label="$t('removed') as string"
              :changed-label="$t('changed') as string"
              :no-changes-label="$t('no_changes') as string"
            />
            <p v-if="item.requestId" class="break-all text-xs text-gray-500 lg:col-span-2">{{ $t('request') }}: <code>{{ item.requestId }}</code></p>
          </div>
          </div>
          </Transition>
        </div>
      </article>
      </TransitionGroup>
      <div class="flex justify-center pt-2"><NButton v-if="nextCursorId" btn="outline-gray" :disabled="loading" @click="loadMore">{{ loading ? $t('loading') : $t('load_more') }}</NButton></div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

interface AuditEvent {
  id: number
  occurredAt: string
  actorUserId: number | null
  actorUserName: string | null
  actorAvatarUrl: string | null
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

interface FilterOption {
  label: string
  value: string
}

const { $t } = useI18n()
useHead({ title: $t('meta_title') as string })
const draft = reactive<AuditFilters>({ from: '', to: '', actor: '', api_key: '', action: '', source: '', target: '' })
const actionOptions = computed<FilterOption[]>(() => [
  { label: $t('all_actions') as string, value: '' },
  { label: $t('create') as string, value: 'create' },
  { label: $t('update') as string, value: 'update' },
  { label: $t('delete') as string, value: 'delete' },
])
const sourceOptions = computed<FilterOption[]>(() => [
  { label: $t('all_sources') as string, value: '' },
  { label: $t('source_web') as string, value: 'web' },
  { label: $t('source_admin_ui') as string, value: 'admin_ui' },
  { label: $t('source_enrichment') as string, value: 'admin_enrichment' },
  { label: $t('source_api') as string, value: 'api_v1' },
  { label: $t('source_sdk') as string, value: 'sdk' },
  { label: $t('source_cli') as string, value: 'cli' },
  { label: $t('source_import') as string, value: 'admin_import' },
])
const selectedActionOption = computed<FilterOption>({
  get: () => actionOptions.value.find(option => option.value === draft.action) ?? actionOptions.value[0]!,
  set: option => { draft.action = option.value },
})
const selectedSourceOption = computed<FilterOption>({
  get: () => sourceOptions.value.find(option => option.value === draft.source) ?? sourceOptions.value[0]!,
  set: option => { draft.source = option.value },
})
const filters = ref<AuditFilters>({ ...draft })
const events = ref<AuditEvent[]>([])
const filtersOpen = ref(false)
const openEventId = ref<number | null>(null)
const sortOrder = ref<'newest' | 'oldest'>('newest')
const nextCursorId = ref<number | null>(null)
const loading = ref(false)
const error = ref('')
const activeFilterCount = computed(() => Object.values(filters.value).filter(Boolean).length)
const sortOrderLabel = computed(() => `${$t('sort_order') as string}: ${$t(sortOrder.value === 'newest' ? 'newest_first' : 'oldest_first') as string}`)

async function fetchEvents(append = false) {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    const response = await $fetch<{ data: AuditEvent[], next_before_id: number | null, next_after_id: number | null }>('/api/admin/quote-editorial-audit', {
      query: {
        limit: 50,
        order: sortOrder.value,
        ...(append && nextCursorId.value ? (sortOrder.value === 'newest' ? { before_id: nextCursorId.value } : { after_id: nextCursorId.value }) : {}),
        ...filters.value,
      },
    })
    events.value = append ? [...events.value, ...response.data] : response.data
    nextCursorId.value = sortOrder.value === 'newest' ? response.next_before_id : response.next_after_id
  } catch {
    error.value = String($t('load_error'))
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  filters.value = { ...draft }
  nextCursorId.value = null
  filtersOpen.value = false
  void fetchEvents()
}

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'newest' ? 'oldest' : 'newest'
  nextCursorId.value = null
  openEventId.value = null
  void fetchEvents()
}

function toggleEvent(id: number) {
  openEventId.value = openEventId.value === id ? null : id
}

function resetFilters() {
  Object.assign(draft, { from: '', to: '', actor: '', api_key: '', action: '', source: '', target: '' })
  applyFilters()
}

function loadMore() {
  void fetchEvents(true)
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

<style scoped>
.audit-events-move {
  transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
}

.audit-events-enter-active,
.audit-events-leave-active {
  transition: opacity 180ms ease, transform 220ms ease;
}

.audit-events-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.audit-events-leave-active {
  position: absolute;
  right: 0;
  left: 0;
  width: 100%;
}

.audit-events-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.audit-detail-enter-active,
.audit-detail-leave-active {
  overflow: hidden;
  transition: max-height 240ms ease, opacity 180ms ease;
}

.audit-detail-enter-from,
.audit-detail-leave-to {
  max-height: 0;
  opacity: 0;
}

.audit-detail-enter-to,
.audit-detail-leave-from {
  max-height: 60rem;
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .audit-events-move,
  .audit-events-enter-active,
  .audit-events-leave-active {
    transition-duration: 1ms;
  }

  .audit-detail-enter-active,
  .audit-detail-leave-active {
    transition-duration: 1ms, 1ms;
  }
}
</style>
