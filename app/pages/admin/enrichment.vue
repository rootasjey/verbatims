<template>
  <div>
    <!-- Editorial Header -->
    <div data-admin-page-header class="pb-6 mb-6">
      <div class="flex items-start justify-between gap-4 mb-4">
        <div class="min-w-0">
          <h1 class="flex flex-wrap items-center gap-3 font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
            {{ $t('title') }}
            <NBadge badge="soft-gray" size="sm" class="font-sans text-xs">{{ $t('job_count', { count: totalItems }) }}</NBadge>
          </h1>
          <p class="mt-2 max-w-2xl font-sans text-sm leading-6 text-gray-600 dark:text-gray-400">{{ $t('page_intro') }}</p>
          <NuxtLink to="/admin/enrichment-audit" class="mt-1 inline-flex text-xs text-gray-600 underline decoration-gray-300 underline-offset-4 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">{{ $t('audit_tool_link') }}</NuxtLink>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <div v-if="selectedEntityId" class="flex items-center gap-2 font-sans text-xs text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-700 px-2 py-1 rounded-lg">
            <span>{{ $t('filter_label', { entity: selectedEntityType.label, id: selectedEntityId }) }}</span>
            <button class="hover:underline" @click="clearEntityFilter">{{ $t('clear') }}</button>
          </div>
          <NTooltip :content="$t('refresh') as string">
            <button type="button" class="grid h-9 w-9 place-items-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800" :aria-label="$t('refresh') as string" :disabled="loading" @click="loadQueue"><NIcon name="i-ph-arrow-clockwise" class="h-4 w-4" /></button>
          </NTooltip>
          <NButton btn="solid-black" size="sm" :loading="processing" :disabled="processing || queueStats.jobs.queued === 0" class="h-9 min-h-9 rounded-xl px-4 font-sans font-medium" @click="processQueuedJobs"><NIcon v-if="!processing" name="i-ph-play" class="mr-1.5 h-4 w-4" />{{ $t('process_batch') }}</NButton>
          <NTooltip :content="$t('settings') as string">
            <button type="button" class="grid h-9 w-9 place-items-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800" :aria-label="$t('settings') as string" @click="openEnrichmentConfigDialog"><NIcon name="i-ph-gear" class="h-4 w-4" /></button>
          </NTooltip>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div class="border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ $t('stat_queued') }}</p>
          <p class="font-serif text-2xl font-600 text-gray-900 dark:text-gray-100 mt-1">{{ queueStats.jobs.queued }}</p>
        </div>
        <div class="border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ $t('stat_processing') }}</p>
          <p class="font-serif text-2xl font-600 text-gray-900 dark:text-gray-100 mt-1">{{ queueStats.jobs.processing }}</p>
        </div>
        <div class="border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ $t('stat_review') }}</p>
          <p class="font-serif text-2xl font-600 text-gray-900 dark:text-gray-100 mt-1">{{ queueStats.states.review }}</p>
          <p class="mt-1 text-[11px] leading-4 text-gray-500 dark:text-gray-400">{{ $t('stat_review_hint') }}</p>
        </div>
        <div class="border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ $t('stat_verified') }}</p>
          <p class="font-serif text-2xl font-600 text-gray-900 dark:text-gray-100 mt-1">{{ queueStats.states.verified }}</p>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div v-if="loading && jobs.length === 0" class="space-y-5">
      <div v-for="i in 5" :key="i" class="animate-pulse pb-5 border-b border-gray-100 dark:border-gray-800">
        <div class="h-4 bg-gray-100 dark:bg-gray-900 rounded w-3/4 mb-2" /><div class="h-3 bg-gray-100 dark:bg-gray-900 rounded w-1/4" />
      </div>
    </div>

    <div v-else-if="jobs.length === 0 && !loading" class="py-16 text-center border border-gray-200 dark:border-gray-800 rounded-xl">
      <NIcon name="i-ph-magic-wand" class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
      <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">
        {{ selectedStatus.value || selectedEntityType.value ? $t('empty_search_title') : $t('empty_title') }}
      </p>
      <p class="font-sans text-sm text-gray-500 dark:text-gray-400">
        {{ selectedStatus.value || selectedEntityType.value ? $t('empty_search_desc') : $t('empty_desc') }}
      </p>
    </div>

    <div v-else>
      <div role="region" tabindex="0" :aria-label="$t('title') as string" class="border border-gray-200 dark:border-gray-800 rounded-xl overflow-x-auto overscroll-x-contain focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500">
        <table class="w-full min-w-[900px]">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0C0A09]">
              <th class="min-w-44 px-3 py-3 text-left align-top">
                <div class="space-y-2">
                  <span class="block font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_entity') }}</span>
                  <NCombobox v-model="selectedEntityType" :items="entityTypeOptions" by="value" :_combobox-list="{ class: 'min-w-[180px]' }" :_combobox-trigger="{ btn: 'outline-gray', size: 'xs', trailing: 'i-lucide-chevron-down', class: 'gap-1 px-2 text-xs leading-normal font-normal w-fit min-w-0 rounded-md border-[#d2cfc6] bg-white dark:border-white/15 dark:bg-white/[0.06]' }">
                    <template #trigger="{ modelValue }"><span class="text-xs font-medium leading-none">{{ modelValue?.label }}</span></template>
                  </NCombobox>
                </div>
              </th>
              <th class="w-36 px-3 py-3 text-left align-top">
                <div class="space-y-2">
                  <span class="block font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_status') }}</span>
                  <NCombobox v-model="selectedStatus" :items="statusOptions" by="value" :_combobox-list="{ class: 'min-w-[180px]' }" :_combobox-trigger="{ btn: 'outline-gray', size: 'xs', trailing: 'i-lucide-chevron-down', class: 'gap-1 px-2 text-xs leading-normal font-normal w-fit min-w-0 rounded-md border-[#d2cfc6] bg-white dark:border-white/15 dark:bg-white/[0.06]' }">
                    <template #trigger="{ modelValue }"><span class="text-xs font-medium leading-none">{{ modelValue?.label }}</span></template>
                  </NCombobox>
                </div>
              </th>
              <th class="w-32 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_trigger') }}</th>
              <th class="px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_summary') }}</th>
              <th class="w-32 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_created') }}</th>
              <th class="w-32 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_updated') }}</th>
              <th class="w-10 px-3 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <ContextMenu
              v-for="(job, idx) in jobs"
              :key="job.id"
              as-child
              ignore-interactive-targets
              size="xs"
              native-on-modifier="ctrl"
              :items="rowActionItems(job)"
            >
            <tr class="animate-fade-in-up transition-colors group" :style="{ animationDelay: `${idx * 0.03}s` }">
              <td class="px-3 py-3">
                <p class="font-sans text-sm text-gray-900 dark:text-gray-100 cursor-pointer transition-colors hover:text-indigo-600 dark:hover:text-indigo-400" :title="job.entityName" @click="openJob(job)">{{ job.entityName }}</p>
                <p class="font-sans text-xs text-gray-500 dark:text-gray-400 capitalize">{{ job.entityType }} #{{ job.entityId }}</p>
              </td>
              <td class="px-3 py-3"><span class="font-sans text-xs px-1.5 py-0.5" :class="statusPillClass(job.status)">{{ job.status }}</span></td>
              <td class="px-3 py-3">
                <p class="font-sans text-sm text-gray-900 dark:text-gray-100 capitalize">{{ job.triggerSource }}</p>
                <p class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ job.reason }}</p>
              </td>
              <td class="px-3 py-3"><p class="font-sans text-sm text-gray-900 dark:text-gray-100 line-clamp-2 max-w-md">{{ job.resultSummary || job.errorMessage || $t('label_no_summary') }}</p></td>
              <td class="px-3 py-3 font-sans text-xs text-gray-500 dark:text-gray-400">{{ formatTimestamp(job.createdAt) }}</td>
              <td class="px-3 py-3 font-sans text-xs text-gray-500 dark:text-gray-400">{{ formatTimestamp(job.updatedAt) }}</td>
              <td class="px-3 py-3">
                <NDropdownMenu :items="rowActionItems(job)" :modal="false">
                  <button @click.stop class="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"><NIcon name="i-ph-dots-three-vertical" class="w-4 h-4" /></button>
                </NDropdownMenu>
              </td>
            </tr>
            </ContextMenu>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="hidden md:block h-20" />
    </div>

    <div
      v-if="totalPages > 1"
      class="relative md:fixed md:bottom-0 z-20 mb-24 md:mb-0 bg-[#FAFAF9] dark:bg-[#0C0A09] border-t border-gray-200 dark:border-gray-700 rounded-t-2xl px-3 sm:px-6 lg:px-8 py-2 md:py-3 flex items-center justify-between gap-2 shadow-sm transition-all duration-300 ease-in-out"
      :style="isDesktopViewport ? { left: footerLeftOffset + 'px', width: footerWidth } : undefined"
    >
      <span class="font-sans text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
        Page
        <button
          class="font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 underline underline-offset-2 decoration-gray-300 dark:decoration-gray-600"
          @click="showPageJumpDialog = true"
        >
          {{ currentPage }}
        </button>
        of {{ totalPages }} <span class="hidden sm:inline">&middot; {{ totalItems }} {{ $t(totalItems === 1 ? 'common.quote_singular' : 'common.quote_plural') }}</span>
      </span>
      <div class="flex items-center gap-3">
        <OutlinedButton v-if="currentPage > 1" @click="currentPage = Math.max(1, currentPage - 1)">&larr; Previous</OutlinedButton>
        <OutlinedButton v-if="currentPage < totalPages" @click="currentPage = Math.min(totalPages, currentPage + 1)">Next &rarr;</OutlinedButton>
      </div>
    </div>

    <AdminEnrichmentJobDialog :open="showJobDialog" :loading="jobLoading" :applying="jobApplying" :job="selectedJob" :entity="selectedJobDetails?.entity || null" :preview="selectedJobDetails?.preview || null" :proposals="selectedJobDetails?.proposals || []" :change-history="selectedJobDetails?.changeHistory || []" :selected-fields="selectedFields" @update:open="handleDialogOpenChange" @toggle-field="toggleField" @select-recommended="selectRecommendedFields" @apply="applySelectedFields" />
    <AdminEnrichmentConfigDialog :open="showEnrichmentConfigDialog" :loading="enrichmentConfigLoading" :saving="enrichmentConfigSaving" :updated-at="enrichmentConfigUpdatedAt" :form="enrichmentConfigForm" :sources="enrichmentConfigSources" @update:open="showEnrichmentConfigDialog = $event" @save="saveEnrichmentConfig" />
    <PageJumpDialog
      v-model="showPageJumpDialog"
      :total-pages="totalPages"
      @jump="onPageJump"
    />
  </div>
</template>

<script setup lang="ts">
import { formatRelativeTime, parseDateInput } from '~/utils/time-formatter'

const { $t } = useI18n()
const { showErrorToast } = useErrorToast()

const route = useRoute()

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: $t('meta_title') as string })

type FilterOption = { label: string, value: string }

const loading = ref(false)
const processing = ref(false)
const jobs = ref<any[]>([])
const totalItems = ref(0)
const currentPage = ref(1)
useSyncedPageQuery(currentPage)
const pageSize = ref(20)
const showPageJumpDialog = ref(false)
const footerLeftOffset = ref(0)
const footerWidth = ref('100%')
const isDesktopViewport = ref(false)
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize.value)))

const selectedStatus = ref<FilterOption>({ label: String($t('filter_all_statuses')), value: '' })
const selectedEntityType = ref<FilterOption>({ label: String($t('filter_all_entities')), value: '' })
const selectedEntityId = ref<number | null>(null)

const statusOptions = computed<FilterOption[]>(() => [
  { label: String($t('filter_all_statuses')), value: '' }, { label: String($t('filter_queued')), value: 'queued' }, { label: String($t('filter_processing')), value: 'processing' },
  { label: String($t('filter_completed')), value: 'completed' }, { label: String($t('filter_failed')), value: 'failed' }, { label: String($t('filter_cancelled')), value: 'cancelled' },
])

const entityTypeOptions = computed<FilterOption[]>(() => [
  { label: String($t('filter_all_entities')), value: '' }, { label: String($t('filter_authors')), value: 'author' }, { label: String($t('filter_references')), value: 'reference' },
])

useSyncedQueryFilters({
  keys: ['status', 'entityType', 'entityId'],
  read: (query) => {
    const status = readSyncedQueryValue(query.status)
    const entityType = readSyncedQueryValue(query.entityType)
    const entityId = Number.parseInt(readSyncedQueryValue(query.entityId), 10)
    return {
      status: statusOptions.value.some(option => option.value === status) ? status : '',
      entityType: entityTypeOptions.value.some(option => option.value === entityType) ? entityType : '',
      entityId: Number.isSafeInteger(entityId) && entityId > 0 ? String(entityId) : ''
    }
  },
  write: (query, state) => ({
    ...query,
    status: state.status || undefined,
    entityType: state.entityType || undefined,
    entityId: state.entityId || undefined
  }),
  get: () => ({ status: selectedStatus.value.value, entityType: selectedEntityType.value.value, entityId: selectedEntityId.value ? String(selectedEntityId.value) : '' }),
  apply: (state) => {
    selectedStatus.value = statusOptions.value.find(option => option.value === state.status) ?? statusOptions.value[0]!
    selectedEntityType.value = entityTypeOptions.value.find(option => option.value === state.entityType) ?? entityTypeOptions.value[0]!
    selectedEntityId.value = state.entityId ? Number(state.entityId) : null
  },
  onFilterChange: () => { currentPage.value = 1 }
})

const queueStats = ref({ jobs: { queued: 0, processing: 0, completed: 0, failed: 0, cancelled: 0 }, states: { queued: 0, processing: 0, verified: 0, review: 0, failed: 0 } })

const showJobDialog = ref(false)
const jobLoading = ref(false)
const jobApplying = ref(false)
const selectedJob = ref<any | null>(null)
const selectedJobDetails = ref<any | null>(null)
const selectedFields = ref<string[]>([])

const showEnrichmentConfigDialog = ref(false)
const enrichmentConfigLoading = ref(false)
const enrichmentConfigSaving = ref(false)
const enrichmentConfigUpdatedAt = ref<string | null>(null)
const enrichmentConfigSources = ref<Record<string, 'kv' | 'env' | 'default' | 'none'>>({})
const enrichmentConfigForm = reactive({
  scheduleEnabled: true, processEnabled: true, scheduleBatchSize: 25, processBatchSize: 3,
  authorStaleDays: 180, referenceStaleDays: 365, reviewGraceDays: 14,
  authorMatchMinScore: 60, referenceMatchMinScore: 58, ambiguousMatchGap: 5,
})

const statusPillClass = (status: string) => {
  switch (status) {
    case 'completed': return 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
    case 'processing': return 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
    case 'failed': return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
    case 'queued': return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
    default: return 'text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
  }
}

const loadQueue = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/admin/enrichment/status', { query: { page: currentPage.value, limit: pageSize.value, status: selectedStatus.value.value || undefined, entityType: selectedEntityType.value.value || undefined, entityId: selectedEntityId.value || undefined } }) as any
    jobs.value = response.data?.jobs || []; queueStats.value = response.data?.stats || queueStats.value; totalItems.value = response.pagination?.total || 0
  } catch (error: any) {
    console.error('Queue load failed:', error)
    if (error?.statusCode && error?.statusCode !== 500) {
      showErrorToast(error, String($t('error_queue_load')))
    }
  }
  finally { loading.value = false }
}

const clearEntityFilter = async () => { selectedEntityId.value = null; await navigateTo({ query: { ...route.query, entityId: undefined, jobId: undefined } }, { replace: true }) }

const openJob = async (job: any) => {
  selectedJob.value = job; selectedJobDetails.value = null; selectedFields.value = []; jobLoading.value = true; showJobDialog.value = true
  try {
    const response = await $fetch(`/api/admin/enrichment/jobs/${job.id}`) as any
    selectedJobDetails.value = response.data
    selectedFields.value = response.data?.preview?.proposals?.filter((p: any) => p.recommended)?.map((p: any) => p.field) || []
  } catch (error: any) { showErrorToast(error, String($t('error_job_load'))); showJobDialog.value = false }
  finally { jobLoading.value = false }
}

const processQueuedJobs = async () => {
  processing.value = true
  try {
    await $fetch('/api/admin/enrichment/process', { method: 'POST', body: { limit: 10 } })
    useToast().toast({ title: String($t('toast_processing_started')), description: String($t('toast_processing_desc')), toast: 'soft-success' })
    await loadQueue()
  } catch (error: any) { showErrorToast(error, String($t('error_process'))) }
  finally { processing.value = false }
}

const toggleField = (field: string, value: boolean | 'indeterminate') => {
  if (value === true) { if (!selectedFields.value.includes(field)) selectedFields.value = [...selectedFields.value, field]; return }
  selectedFields.value = selectedFields.value.filter(item => item !== field)
}
const selectRecommendedFields = () => { selectedFields.value = selectedJobDetails.value?.preview?.proposals?.filter((p: any) => p.recommended)?.map((p: any) => p.field) || [] }

const applySelectedFields = async () => {
  if (!selectedJob.value?.id || selectedFields.value.length === 0) return
  jobApplying.value = true
  try { await $fetch(`/api/admin/enrichment/jobs/${selectedJob.value.id}/apply`, { method: 'POST', body: { fields: selectedFields.value } }); await Promise.all([loadQueue(), openJob(selectedJob.value)]) }
  catch (error: any) { showErrorToast(error, String($t('error_apply'))) }
  finally { jobApplying.value = false }
}

const handleDialogOpenChange = (open: boolean) => { showJobDialog.value = open; if (!open) { selectedJob.value = null; selectedJobDetails.value = null; selectedFields.value = [] } }

const openEnrichmentConfigDialog = async () => {
  enrichmentConfigLoading.value = true; showEnrichmentConfigDialog.value = true
  try {
    const configUrl = '/api/admin/enrichment/config' as string
    const response = await ($fetch as any)(configUrl) as { data?: { updatedAt: string | null; values: Record<string, string | number | boolean>; sources: Record<string, 'kv' | 'env' | 'default' | 'none'> } }
    enrichmentConfigUpdatedAt.value = response.data?.updatedAt || null; enrichmentConfigSources.value = response.data?.sources || {}
    enrichmentConfigForm.scheduleEnabled = Boolean(response.data?.values?.scheduleEnabled); enrichmentConfigForm.processEnabled = Boolean(response.data?.values?.processEnabled)
    enrichmentConfigForm.scheduleBatchSize = Number(response.data?.values?.scheduleBatchSize ?? 25); enrichmentConfigForm.processBatchSize = Number(response.data?.values?.processBatchSize ?? 3)
    enrichmentConfigForm.authorStaleDays = Number(response.data?.values?.authorStaleDays ?? 180); enrichmentConfigForm.referenceStaleDays = Number(response.data?.values?.referenceStaleDays ?? 365)
    enrichmentConfigForm.reviewGraceDays = Number(response.data?.values?.reviewGraceDays ?? 14); enrichmentConfigForm.authorMatchMinScore = Number(response.data?.values?.authorMatchMinScore ?? 60)
    enrichmentConfigForm.referenceMatchMinScore = Number(response.data?.values?.referenceMatchMinScore ?? 58); enrichmentConfigForm.ambiguousMatchGap = Number(response.data?.values?.ambiguousMatchGap ?? 5)
  } catch (error: any) { showErrorToast(error, String($t('error_load_settings'))); showEnrichmentConfigDialog.value = false }
  finally { enrichmentConfigLoading.value = false }
}

const saveEnrichmentConfig = async (form: typeof enrichmentConfigForm) => {
  enrichmentConfigSaving.value = true
  try {
    const configUrl = '/api/admin/enrichment/config' as string
    const response = await ($fetch as any)(configUrl, { method: 'POST', body: { scheduleEnabled: form.scheduleEnabled, processEnabled: form.processEnabled, scheduleBatchSize: Number(form.scheduleBatchSize), processBatchSize: Number(form.processBatchSize), authorStaleDays: Number(form.authorStaleDays), referenceStaleDays: Number(form.referenceStaleDays), reviewGraceDays: Number(form.reviewGraceDays), authorMatchMinScore: Number(form.authorMatchMinScore), referenceMatchMinScore: Number(form.referenceMatchMinScore), ambiguousMatchGap: Number(form.ambiguousMatchGap) } }) as { data?: { updatedAt: string | null; values: Record<string, string | number | boolean>; sources: Record<string, 'kv' | 'env' | 'default' | 'none'> } }
    enrichmentConfigUpdatedAt.value = response.data?.updatedAt || null; enrichmentConfigSources.value = response.data?.sources || {}
    useToast().toast({ title: String($t('toast_settings_saved')), description: String($t('toast_settings_desc')), toast: 'soft-success' }); showEnrichmentConfigDialog.value = false
  } catch (error: any) { showErrorToast(error, String($t('error_save'))) }
  finally { enrichmentConfigSaving.value = false }
}

const rowActionItems = (job: any) => [{ label: String($t('dropdown_review')), leading: 'i-ph-eye', onclick: () => openJob(job) }]

const formatTimestamp = (value: string | number | Date | null | undefined) => {
  const date = parseDateInput(value as any); if (!date) return '\u2014'; return `${date.toLocaleDateString()} · ${formatRelativeTime(date)}`
}

const onPageJump = (page: number) => {
  currentPage.value = page
}

watchDebounced([currentPage, selectedStatus, selectedEntityType, selectedEntityId], () => { loadQueue() }, { debounce: 200 })
onMounted(() => { loadQueue() })

let footerObserver: ResizeObserver | null = null

const updateFooterPosition = () => {
  isDesktopViewport.value = window.matchMedia('(min-width: 768px)').matches
  const mainEl = document.querySelector('main')
  if (!mainEl || !isDesktopViewport.value) {
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
@keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in-up { animation: fade-in-up 0.5s ease-out both; }
.line-clamp-2 { display: -webkit-box; line-clamp: 2; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>
