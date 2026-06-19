<template>
  <div class="frame flex flex-col h-full">
    <div class="flex-shrink-0 bg-gray-50 dark:bg-[#0C0A09] border-b border-dashed border-gray-200 dark:border-gray-700 pb-6 mb-6">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div class="flex flex-col sm:flex-row gap-3">
            <NSelect
              v-model="selectedEntityType"
              :items="entityTypeOptions"
              item-key="label"
              value-key="label"
              size="sm"
              placeholder="All entities"
            />
            <NSelect
              v-model="selectedStatus"
              :items="statusOptions"
              item-key="label"
              value-key="label"
              size="sm"
              placeholder="All statuses"
            />
            <div v-if="selectedEntityId" class="flex items-center gap-2 rounded-lg border border-dashed border-cyan-200 dark:border-cyan-800 bg-cyan-50/70 dark:bg-cyan-950/20 px-3 py-2 text-sm text-cyan-800 dark:text-cyan-200">
              <span>Filtered on {{ selectedEntityType.value || 'entity' }} #{{ selectedEntityId }}</span>
              <NButton size="xs" btn="ghost" @click="clearEntityFilter">Clear</NButton>
            </div>
          </div>

          <div class="flex gap-3">
            <NButton btn="soft-gray" :loading="loading" @click="loadQueue">
              <NIcon name="i-ph-arrows-clockwise" />
              Refresh
            </NButton>
            <NButton btn="soft-blue" :loading="processing" @click="processQueuedJobs">
              <NIcon name="i-ph-play" />
              Process queued
            </NButton>
            <NButton btn="soft-gray" @click="openEnrichmentConfigDialog">
              <NIcon name="i-ph-sliders-horizontal" />
              Settings
            </NButton>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0C0A09] p-4">
            <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Queued jobs</p>
            <p class="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{{ queueStats.jobs.queued }}</p>
          </div>
          <div class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0C0A09] p-4">
            <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Processing</p>
            <p class="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{{ queueStats.jobs.processing }}</p>
          </div>
          <div class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0C0A09] p-4">
            <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Review pending</p>
            <p class="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{{ queueStats.states.review }}</p>
          </div>
          <div class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0C0A09] p-4">
            <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Verified</p>
            <p class="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{{ queueStats.states.verified }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col bg-white dark:bg-[#0C0A09] min-h-0">
      <div class="enrichment-table-container flex-1 overflow-auto">
        <NTable
          :columns="tableColumns"
          :data="jobs"
          :loading="loading"
          :una="{
            tableRoot: '!overflow-visible border-none',
            scrollAreaRoot: '!overflow-visible',
            table: '!w-auto min-w-full',
            tableHeader: 'sticky top-0 z-1 bg-[#FAFAF9] dark:bg-[#0C0A09]',
            tableBody: 'bg-white dark:bg-[#0C0A09]'
          }"
          manual-pagination
          empty-text="No enrichment job found"
          empty-icon="i-ph-magic-wand"
        >
          <template #entity-cell="{ cell }">
            <div>
              <p
                class="text-sm font-medium text-gray-900 dark:text-white cursor-pointer transition-colors
                 hover:text-indigo-600 dark:hover:text-indigo-400"
                @click="openJob(cell.row.original)"
                :title="cell.row.original.entityName"
              >
                {{ cell.row.original.entityName }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {{ cell.row.original.entityType }} #{{ cell.row.original.entityId }}
              </p>
            </div>
          </template>

          <template #status-cell="{ cell }">
            <NBadge :badge="statusBadge(cell.row.original.status)" size="xs">{{ cell.row.original.status }}</NBadge>
          </template>

          <template #trigger-cell="{ cell }">
            <div>
              <p class="text-sm text-gray-900 dark:text-white capitalize">{{ cell.row.original.triggerSource }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ cell.row.original.reason }}</p>
            </div>
          </template>

          <template #summary-cell="{ cell }">
            <p class="text-sm text-gray-900 dark:text-white line-clamp-2 max-w-md">
              {{ cell.row.original.resultSummary || cell.row.original.errorMessage || 'No summary yet' }}
            </p>
          </template>

          <template #created-cell="{ cell }">
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatTimestamp(cell.row.original.createdAt) }}</span>
          </template>

          <template #updated-cell="{ cell }">
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatTimestamp(cell.row.original.updatedAt) }}</span>
          </template>

          <template #actions-cell="{ cell }">
            <NDropdownMenu :items="rowActionItems(cell.row.original)">
              <NButton size="xs" btn="ghost-gray" icon label="i-ph-dots-three-vertical" />
            </NDropdownMenu>
          </template>
        </NTable>
      </div>

      <div class="flex-shrink-0 flex items-center justify-between p-4">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Page {{ currentPage }} of {{ totalPages }} • {{ totalItems }} job{{ totalItems !== 1 ? 's' : '' }}
        </div>
        <NPagination
          v-model:page="currentPage"
          :total="totalItems"
          :items-per-page="pageSize"
          :sibling-count="2"
          pagination-selected="solid-indigo"
          pagination-unselected="soft-gray"
          show-edges
          size="sm"
        />
      </div>
    </div>

    <AdminEnrichmentJobDialog
      :open="showJobDialog"
      :loading="jobLoading"
      :applying="jobApplying"
      :job="selectedJob"
      :entity="selectedJobDetails?.entity || null"
      :preview="selectedJobDetails?.preview || null"
      :proposals="selectedJobDetails?.proposals || []"
      :change-history="selectedJobDetails?.changeHistory || []"
      :selected-fields="selectedFields"
      @update:open="handleDialogOpenChange"
      @toggle-field="toggleField"
      @select-recommended="selectRecommendedFields"
      @apply="applySelectedFields"
    />

    <AdminEnrichmentConfigDialog
      :open="showEnrichmentConfigDialog"
      :loading="enrichmentConfigLoading"
      :saving="enrichmentConfigSaving"
      :updated-at="enrichmentConfigUpdatedAt"
      :form="enrichmentConfigForm"
      :sources="enrichmentConfigSources"
      @update:open="showEnrichmentConfigDialog = $event"
      @save="saveEnrichmentConfig"
    />
  </div>
</template>

<script setup lang="ts">
import { formatRelativeTime, parseDateInput } from '~/utils/time-formatter'

const { showErrorToast } = useErrorToast()

const route = useRoute()

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({
  title: 'Enrichment Queue - Admin - Verbatims'
})

type FilterOption = { label: string, value: string }

const loading = ref(false)
const processing = ref(false)
const jobs = ref<any[]>([])
const totalItems = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize.value)))

const selectedStatus = ref<FilterOption>({ label: 'All statuses', value: '' })
const selectedEntityType = ref<FilterOption>({ label: 'All entities', value: '' })
const selectedEntityId = ref<number | null>(null)

const statusOptions: FilterOption[] = [
  { label: 'All statuses', value: '' },
  { label: 'Queued', value: 'queued' },
  { label: 'Processing', value: 'processing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Cancelled', value: 'cancelled' },
]

const entityTypeOptions: FilterOption[] = [
  { label: 'All entities', value: '' },
  { label: 'Authors', value: 'author' },
  { label: 'References', value: 'reference' },
]

const queueStats = ref({
  jobs: { queued: 0, processing: 0, completed: 0, failed: 0, cancelled: 0 },
  states: { queued: 0, processing: 0, verified: 0, review: 0, failed: 0 },
})

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
  scheduleEnabled: true,
  processEnabled: true,
  scheduleBatchSize: 25,
  processBatchSize: 3,
  authorStaleDays: 180,
  referenceStaleDays: 365,
  reviewGraceDays: 14,
  authorMatchMinScore: 60,
  referenceMatchMinScore: 58,
  ambiguousMatchGap: 5,
})

const tableColumns = [
  { header: 'Entity', accessorKey: 'entity' },
  { header: 'Status', accessorKey: 'status', meta: { una: { tableHead: 'w-28', tableCell: 'w-28' } } },
  { header: 'Trigger', accessorKey: 'trigger', meta: { una: { tableHead: 'w-32', tableCell: 'w-32' } } },
  { header: 'Summary', accessorKey: 'summary', meta: { una: { tableHead: 'min-w-80', tableCell: 'min-w-80' } } },
  { header: 'Created', accessorKey: 'created', meta: { una: { tableHead: 'w-36', tableCell: 'w-36' } } },
  { header: 'Updated', accessorKey: 'updated', meta: { una: { tableHead: 'w-36', tableCell: 'w-36' } } },
  { header: '', accessorKey: 'actions', meta: { una: { tableHead: 'w-16', tableCell: 'w-16' } } },
]

const loadQueue = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/admin/enrichment/status', {
      query: {
        page: currentPage.value,
        limit: pageSize.value,
        status: selectedStatus.value.value || undefined,
        entityType: selectedEntityType.value.value || undefined,
        entityId: selectedEntityId.value || undefined,
      }
    }) as any

    jobs.value = response.data?.jobs || []
    queueStats.value = response.data?.stats || queueStats.value
    totalItems.value = response.pagination?.total || 0
  } catch (error: any) {
    showErrorToast(error, 'Queue load failed')
  } finally {
    loading.value = false
  }
}

const syncFiltersFromRoute = () => {
  const queryEntityType = String(route.query.entityType || '').trim()
  const queryEntityId = Number.parseInt(String(route.query.entityId || ''), 10)
  const queryStatus = String(route.query.status || '').trim()

  selectedEntityType.value = entityTypeOptions.find(option => option.value === queryEntityType) || entityTypeOptions[0]
  selectedStatus.value = statusOptions.find(option => option.value === queryStatus) || statusOptions[0]
  selectedEntityId.value = Number.isInteger(queryEntityId) && queryEntityId > 0 ? queryEntityId : null
  currentPage.value = 1
}

const clearEntityFilter = async () => {
  selectedEntityId.value = null
  await navigateTo({ query: { ...route.query, entityId: undefined, jobId: undefined } }, { replace: true })
}

const openJob = async (job: any) => {
  selectedJob.value = job
  selectedJobDetails.value = null
  selectedFields.value = []
  jobLoading.value = true
  showJobDialog.value = true

  try {
    const response = await $fetch(`/api/admin/enrichment/jobs/${job.id}`) as any
    selectedJobDetails.value = response.data
    selectedFields.value = response.data?.preview?.proposals
      ?.filter((proposal: any) => proposal.recommended)
      ?.map((proposal: any) => proposal.field) || []
  } catch (error: any) {
    showErrorToast(error, 'Job load failed')
    showJobDialog.value = false
  } finally {
    jobLoading.value = false
  }
}

const processQueuedJobs = async () => {
  processing.value = true
  try {
    await $fetch('/api/admin/enrichment/process', {
      method: 'POST',
      body: { limit: 10 }
    })

    useToast().toast({
      title: 'Processing started',
      description: 'Queued enrichment jobs were processed.',
      toast: 'soft-success'
    })

    await loadQueue()
  } catch (error: any) {
    showErrorToast(error, 'Process failed')
  } finally {
    processing.value = false
  }
}

const toggleField = (field: string, value: boolean | 'indeterminate') => {
  if (value === true) {
    if (!selectedFields.value.includes(field)) {
      selectedFields.value = [...selectedFields.value, field]
    }
    return
  }

  selectedFields.value = selectedFields.value.filter(item => item !== field)
}

const selectRecommendedFields = () => {
  selectedFields.value = selectedJobDetails.value?.preview?.proposals
    ?.filter((proposal: any) => proposal.recommended)
    ?.map((proposal: any) => proposal.field) || []
}

const applySelectedFields = async () => {
  if (!selectedJob.value?.id || selectedFields.value.length === 0) return

  jobApplying.value = true
  try {
    await $fetch(`/api/admin/enrichment/jobs/${selectedJob.value.id}/apply`, {
      method: 'POST',
      body: {
        fields: selectedFields.value,
      }
    })

    await Promise.all([loadQueue(), openJob(selectedJob.value)])
  } catch (error: any) {
    showErrorToast(error, 'Apply failed')
  } finally {
    jobApplying.value = false
  }
}

const handleDialogOpenChange = (open: boolean) => {
  showJobDialog.value = open
  if (!open) {
    selectedJob.value = null
    selectedJobDetails.value = null
    selectedFields.value = []
  }
}

const openEnrichmentConfigDialog = async () => {
  enrichmentConfigLoading.value = true
  showEnrichmentConfigDialog.value = true

  try {
    const configUrl = '/api/admin/enrichment/config' as string
    const response = await ($fetch as any)(configUrl) as {
      data?: {
        updatedAt: string | null
        values: Record<string, string | number | boolean>
        sources: Record<string, 'kv' | 'env' | 'default' | 'none'>
      }
    }

    enrichmentConfigUpdatedAt.value = response.data?.updatedAt || null
    enrichmentConfigSources.value = response.data?.sources || {}
    enrichmentConfigForm.scheduleEnabled = Boolean(response.data?.values?.scheduleEnabled)
    enrichmentConfigForm.processEnabled = Boolean(response.data?.values?.processEnabled)
    enrichmentConfigForm.scheduleBatchSize = Number(response.data?.values?.scheduleBatchSize ?? 25)
    enrichmentConfigForm.processBatchSize = Number(response.data?.values?.processBatchSize ?? 3)
    enrichmentConfigForm.authorStaleDays = Number(response.data?.values?.authorStaleDays ?? 180)
    enrichmentConfigForm.referenceStaleDays = Number(response.data?.values?.referenceStaleDays ?? 365)
    enrichmentConfigForm.reviewGraceDays = Number(response.data?.values?.reviewGraceDays ?? 14)
    enrichmentConfigForm.authorMatchMinScore = Number(response.data?.values?.authorMatchMinScore ?? 60)
    enrichmentConfigForm.referenceMatchMinScore = Number(response.data?.values?.referenceMatchMinScore ?? 58)
    enrichmentConfigForm.ambiguousMatchGap = Number(response.data?.values?.ambiguousMatchGap ?? 5)
  } catch (error: any) {
    showErrorToast(error, 'Failed to load settings')
    showEnrichmentConfigDialog.value = false
  } finally {
    enrichmentConfigLoading.value = false
  }
}

const saveEnrichmentConfig = async (form: typeof enrichmentConfigForm) => {
  enrichmentConfigSaving.value = true
  try {
    const configUrl = '/api/admin/enrichment/config' as string
    const response = await ($fetch as any)(configUrl, {
      method: 'POST',
      body: {
        scheduleEnabled: form.scheduleEnabled,
        processEnabled: form.processEnabled,
        scheduleBatchSize: Number(form.scheduleBatchSize),
        processBatchSize: Number(form.processBatchSize),
        authorStaleDays: Number(form.authorStaleDays),
        referenceStaleDays: Number(form.referenceStaleDays),
        reviewGraceDays: Number(form.reviewGraceDays),
        authorMatchMinScore: Number(form.authorMatchMinScore),
        referenceMatchMinScore: Number(form.referenceMatchMinScore),
        ambiguousMatchGap: Number(form.ambiguousMatchGap),
      }
    }) as {
      data?: {
        updatedAt: string | null
        values: Record<string, string | number | boolean>
        sources: Record<string, 'kv' | 'env' | 'default' | 'none'>
      }
    }

    enrichmentConfigUpdatedAt.value = response.data?.updatedAt || null
    enrichmentConfigSources.value = response.data?.sources || {}
    useToast().toast({
      title: 'Enrichment settings saved',
      description: 'KV overrides are now active for the enrichment scheduler and processor.',
      toast: 'soft-success'
    })
    showEnrichmentConfigDialog.value = false
  } catch (error: any) {
    showErrorToast(error, 'Save failed')
  } finally {
    enrichmentConfigSaving.value = false
  }
}

const rowActionItems = (job: any) => [
  {
    label: 'Review job',
    leading: 'i-ph-eye',
    onclick: () => openJob(job)
  }
]

const statusBadge = (status: string) => {
  if (status === 'completed') return 'soft-green'
  if (status === 'processing') return 'soft-yellow'
  if (status === 'failed') return 'soft-red'
  if (status === 'queued') return 'soft-blue'
  return 'soft-gray'
}

const formatTimestamp = (value: string | number | Date | null | undefined) => {
  const date = parseDateInput(value as any)
  if (!date) return '—'
  return `${date.toLocaleDateString()} · ${formatRelativeTime(date)}`
}

watchDebounced([currentPage, selectedStatus, selectedEntityType], () => {
  loadQueue()
}, { debounce: 200 })

onMounted(() => {
  syncFiltersFromRoute()
  loadQueue()
})

watch(() => route.query, () => {
  syncFiltersFromRoute()
  loadQueue()
})
</script>

<style scoped>
.enrichment-table-container {
  max-height: calc(100vh - 11rem);
  max-width: calc(100vw - 8rem);
}
</style>
