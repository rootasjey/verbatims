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
      <div class="flex-1 overflow-auto">
        <NTable
          :columns="tableColumns"
          :data="jobs"
          :loading="loading"
          manual-pagination
          empty-text="No enrichment job found"
          empty-icon="i-ph-magic-wand"
        >
          <template #entity-cell="{ cell }">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ cell.row.original.entityName }}</p>
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
  </div>
</template>

<script setup lang="ts">
import { formatRelativeTime, parseDateInput } from '~/utils/time-formatter'

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
    console.error('Failed to load enrichment queue:', error)
    useToast().toast({
      title: 'Queue load failed',
      description: error?.data?.statusMessage || error?.message || 'Could not load enrichment jobs.',
      toast: 'error'
    })
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
    console.error('Failed to load enrichment job:', error)
    useToast().toast({
      title: 'Job load failed',
      description: error?.data?.statusMessage || error?.message || 'Could not load this enrichment job.',
      toast: 'error'
    })
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
      toast: 'success'
    })

    await loadQueue()
  } catch (error: any) {
    useToast().toast({
      title: 'Process failed',
      description: error?.data?.statusMessage || error?.message || 'Could not process queued jobs.',
      toast: 'error'
    })
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

    useToast().toast({
      title: 'Changes applied',
      description: `${selectedFields.value.length} field(s) were applied.`,
      toast: 'success'
    })

    await Promise.all([loadQueue(), openJob(selectedJob.value)])
  } catch (error: any) {
    useToast().toast({
      title: 'Apply failed',
      description: error?.data?.statusMessage || error?.message || 'Could not apply selected fields.',
      toast: 'error'
    })
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