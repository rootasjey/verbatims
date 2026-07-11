<template>
  <AppDialog
    v-model="isOpen"
    title=""
    max-width="md"
    @close="emit('update:open', false)"
  >
    <template #title>
      <div class="flex items-start justify-between gap-4 w-full">
        <div>
          <span>
            {{ job?.entityName || entity?.name || preview?.entity_name || $t('admin_enrichment.enrichment_title') }}
            <span class="font-300"> → {{ job?.entityType === 'reference' ? $t('admin_enrichment.reference_review') : $t('admin_enrichment.author_review') }}</span>
          </span>
        </div>
      </div>
    </template>

    <div>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">{{ jobSummary }}</p>

      <div class="min-h-0 overflow-y-auto space-y-4">
        <div v-if="loading" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          {{ $t('common.loading') }}
        </div>

        <template v-else>
          <div class="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-gray-50/60 dark:bg-gray-900/20">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400">{{ $t('admin_enrichment.entity') }}</span>
                <p class="font-medium text-gray-900 dark:text-white">{{ entity?.name || job?.entityName || $t('common.unknown') }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">{{ $t('admin_enrichment.created') }}</span>
                <p class="font-medium text-gray-900 dark:text-white">{{ formatTimestamp(job?.createdAt) }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">{{ $t('admin_enrichment.updated') }}</span>
                <p class="font-medium text-gray-900 dark:text-white">{{ formatTimestamp(job?.updatedAt) }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">{{ $t('admin_enrichment.applied') }}</span>
                <p class="font-medium text-gray-900 dark:text-white">{{ formatTimestamp(job?.appliedAt) }}</p>
              </div>
            </div>
            <div v-if="job?.errorMessage" class="mt-3 rounded-md border border-dashed border-red-200 bg-red-50/70 p-3 dark:border-red-900/70 dark:bg-red-950/20">
              <p class="text-xs font-medium uppercase tracking-wide text-red-600 dark:text-red-300">{{ $t('admin_enrichment.error_details') }}</p>
              <pre class="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words pr-2 text-xs text-red-700 dark:text-red-200">{{ job.errorMessage }}</pre>
            </div>
          </div>
          <div class="ml-2 flex flex-wrap gap-2">
            <NBadge v-if="job" :badge="statusBadge(job.status)" size="xs">{{ job.status }}</NBadge>
            <NBadge v-if="job?.triggerSource" badge="soft-gray" size="xs">{{ job.triggerSource }}</NBadge>
            <NBadge v-if="job?.reason" badge="soft-blue" size="xs">{{ job.reason }}</NBadge>
          </div>

          <div v-if="preview?.notes?.length" class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4 space-y-1">
            <p v-for="note in preview.notes" :key="note" class="text-xs text-gray-500 dark:text-gray-400">{{ note }}</p>
          </div>

          <div>
            <div class="pt-3 flex items-start justify-between gap-3 mb-3">
              <div class="flex-col items-center gap-2">
                <h4 class="text-sm font-semibold text-gray-900 dark:text-white">{{ $t('admin_enrichment.suggested_changes') }}</h4>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ $t('admin_enrichment.fields_selected', { count: selectedFields.length }) }}
                </div>
              </div>

              <NButton btn="text-gray" size="sm" :disabled="!proposalList.length" @click="emit('select-recommended')">{{ $t('admin_enrichment.select_recommended') }}</NButton>
            </div>

            <div v-if="proposalList.length === 0" class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              {{ $t('admin_enrichment.no_proposals') }}
            </div>

            <div v-else class="space-y-3 max-h-[42vh] overflow-auto pr-1">
              <div v-for="proposal in proposalList" :key="proposal.field" class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex items-start gap-3 min-w-0">
                    <NCheckbox checkbox="gray" :disabled="Boolean(job?.appliedAt)" :model-value="selectedFields.includes(proposal.field)" @update:model-value="emit('toggle-field', proposal.field, $event)" />
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-2">
                        <h5 class="text-sm font-medium text-gray-900 dark:text-white">{{ proposal.label }}</h5>
                        <NBadge :badge="proposal.recommended ? 'soft-green' : 'soft-gray'" size="xs">{{ proposal.recommended ? $t('admin_enrichment.recommended') : $t('admin_enrichment.optional') }}</NBadge>
                        <NBadge :badge="proposal.overwrite ? 'soft-orange' : 'soft-blue'" size="xs">{{ proposal.overwrite ? $t('admin_enrichment.overwrite') : $t('admin_enrichment.fill_missing') }}</NBadge>
                      </div>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ $t('admin_enrichment.confidence', { score: proposal.confidence }) }} · {{ proposal.rationale }}</p>
                    </div>
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ proposal.source_labels?.join(' / ') || proposal.sourceLabels?.join(' / ') || '' }}</div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div class="rounded-md bg-gray-50 dark:bg-gray-900/40 p-3">
                    <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">{{ $t('admin_enrichment.current') }}</p>
                    <pre class="text-xs text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">{{ proposal.current_value || proposal.currentValue || $t('admin_enrichment.empty') }}</pre>
                  </div>
                  <div class="rounded-md bg-blue-50/70 dark:bg-blue-950/20 p-3 border border-dashed border-blue-200 dark:border-blue-800/60">
                    <p class="text-xs uppercase tracking-wide text-blue-600 dark:text-blue-300 mb-2">{{ $t('admin_enrichment.proposed') }}</p>
                    <pre class="text-xs text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words">{{ proposal.proposed_value || proposal.proposedValue || $t('admin_enrichment.empty') }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">{{ $t('admin_enrichment.applied_history') }}</h4>
            <div v-if="!changeHistory.length" class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              {{ $t('admin_enrichment.no_applied_changes') }}
            </div>
            <div v-else class="space-y-2">
              <div v-for="change in changeHistory" :key="change.id" class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ humanizeField(change.fieldName) }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatTimestamp(change.createdAt) }}</p>
                  </div>
                  <NBadge badge="soft-green" size="xs">{{ $t('admin_enrichment.applied_badge') }}</NBadge>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div class="rounded-md bg-gray-50 dark:bg-gray-900/40 p-3">
                    <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">{{ $t('admin_enrichment.previous') }}</p>
                    <pre class="text-xs text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">{{ change.previousValue || $t('admin_enrichment.empty') }}</pre>
                  </div>
                  <div class="rounded-md bg-green-50/70 dark:bg-green-950/20 p-3 border border-dashed border-green-200 dark:border-green-800/60">
                    <p class="text-xs uppercase tracking-wide text-green-600 dark:text-green-300 mb-2">{{ $t('admin_enrichment.new_value') }}</p>
                    <pre class="text-xs text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words">{{ change.newValue || $t('admin_enrichment.empty') }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <div class="flex gap-3">
          <NButton btn="link-gray" @click="emit('update:open', false)">{{ $t('common.close') }}</NButton>
          <PrimaryButton :loading="applying" :disabled="Boolean(job?.appliedAt) || selectedFields.length === 0 || !job?.id || !proposalList.length" trailing="i-tabler-check" class="px-4" @click="emit('apply')">{{ $t('admin_enrichment.apply_selected') }}</PrimaryButton>
        </div>
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { formatRelativeTime, parseDateInput } from '~/utils/time-formatter'

const { $t } = useI18n()

interface Props {
  open: boolean
  loading: boolean
  applying: boolean
  job?: any | null
  entity?: { id: number, name: string } | null
  preview?: any | null
  proposals?: any[]
  changeHistory?: any[]
  selectedFields: string[]
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'toggle-field', field: string, value: boolean | 'indeterminate'): void
  (e: 'select-recommended'): void
  (e: 'apply'): void
}

const props = withDefaults(defineProps<Props>(), {
  proposals: () => [],
  changeHistory: () => [],
})

const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

const proposalList = computed(() => {
  if (props.preview?.proposals?.length) return props.preview.proposals

  return props.proposals.map((proposal) => ({
    field: proposal.fieldName,
    label: humanizeField(proposal.fieldName),
    current_value: proposal.currentValue,
    proposed_value: proposal.proposedValue,
    confidence: proposal.confidence,
    overwrite: proposal.overwrite,
    recommended: proposal.recommended,
    source_labels: proposal.sourceLabels,
    source_urls: proposal.sourceUrls,
    rationale: proposal.rationale,
  }))
})

const jobSummary = computed(() => {
  if (props.job?.resultSummary) return props.job.resultSummary
  if (props.preview?.summary?.proposed_count !== undefined) {
    return $t('admin_enrichment.proposals_count', { count: props.preview.summary.proposed_count })
  }
  return $t('admin_enrichment.review_suggestions')
})

const statusBadge = (status: string) => {
  if (status === 'completed') return 'soft-green'
  if (status === 'processing') return 'soft-yellow'
  if (status === 'failed') return 'soft-red'
  if (status === 'queued') return 'soft-blue'
  return 'soft-gray'
}

const humanizeField = (field: string) => field.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())

const formatTimestamp = (value: string | number | Date | null | undefined) => {
  const date = parseDateInput(value as any)
  if (!date) return '—'
  return `${date.toLocaleDateString()} · ${formatRelativeTime(date)}`
}
</script>
