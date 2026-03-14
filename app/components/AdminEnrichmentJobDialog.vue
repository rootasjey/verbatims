<template>
  <NDialog
    :open="open"
    :_dialog-content="{ class: 'w-full sm:max-w-4xl' }"
    @update:open="emit('update:open', $event)"
  >
    <template #header>
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="text-lg font-semibold">
            {{ job?.entityName || entity?.name || preview?.entity_name || 'Enrichment job' }}
            <span class="font-300"> → {{ job?.entityType === 'reference' ? 'Reference' : 'Author' }} review</span>
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ jobSummary }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2 justify-end">
          <NBadge v-if="job" :badge="statusBadge(job.status)" size="sm">{{ job.status }}</NBadge>
          <NBadge v-if="job?.triggerSource" badge="soft-gray" size="sm">{{ job.triggerSource }}</NBadge>
          <NBadge v-if="job?.reason" badge="soft-blue" size="sm">{{ job.reason }}</NBadge>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <div v-if="loading" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        Loading enrichment job details...
      </div>

      <template v-else>
        <div class="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-gray-50/60 dark:bg-gray-900/20">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400">Entity</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ entity?.name || job?.entityName || 'Unknown' }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Created</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ formatTimestamp(job?.createdAt) }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Updated</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ formatTimestamp(job?.updatedAt) }}</p>
            </div>
            <div>
              <span class="text-gray-500 dark:text-gray-400">Applied</span>
              <p class="font-medium text-gray-900 dark:text-white">{{ formatTimestamp(job?.appliedAt) }}</p>
            </div>
          </div>
          <p v-if="job?.errorMessage" class="mt-3 text-sm text-red-600 dark:text-red-400">
            {{ job.errorMessage }}
          </p>
        </div>

        <div v-if="preview?.notes?.length" class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4 space-y-1">
          <p
            v-for="note in preview.notes"
            :key="note"
            class="text-xs text-gray-500 dark:text-gray-400"
          >
            {{ note }}
          </p>
        </div>

        <div>
          <div class="flex items-center justify-between gap-3 mb-3">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Suggested changes</h4>
            <NButton btn="ghost-gray" size="sm" :disabled="!proposalList.length" @click="emit('select-recommended')">
              Select recommended
            </NButton>
          </div>

          <div v-if="proposalList.length === 0" class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
            No proposal is stored for this job.
          </div>

          <div v-else class="space-y-3 max-h-[42vh] overflow-auto pr-1">
            <div
              v-for="proposal in proposalList"
              :key="proposal.field"
              class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex items-start gap-3 min-w-0">
                  <NCheckbox
                    checkbox="gray"
                    :disabled="Boolean(job?.appliedAt)"
                    :model-value="selectedFields.includes(proposal.field)"
                    @update:model-value="emit('toggle-field', proposal.field, $event)"
                  />
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <h5 class="text-sm font-medium text-gray-900 dark:text-white">{{ proposal.label }}</h5>
                      <NBadge :badge="proposal.recommended ? 'soft-green' : 'soft-gray'" size="xs">
                        {{ proposal.recommended ? 'Recommended' : 'Optional' }}
                      </NBadge>
                      <NBadge :badge="proposal.overwrite ? 'soft-orange' : 'soft-blue'" size="xs">
                        {{ proposal.overwrite ? 'Overwrite' : 'Fill missing' }}
                      </NBadge>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Confidence {{ proposal.confidence }} · {{ proposal.rationale }}
                    </p>
                  </div>
                </div>

                <div class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {{ proposal.source_labels?.join(' / ') || proposal.sourceLabels?.join(' / ') || '' }}
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <div class="rounded-md bg-gray-50 dark:bg-gray-900/40 p-3">
                  <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Current</p>
                  <pre class="text-xs text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">{{ proposal.current_value || proposal.currentValue || 'Empty' }}</pre>
                </div>
                <div class="rounded-md bg-blue-50/70 dark:bg-blue-950/20 p-3 border border-dashed border-blue-200 dark:border-blue-800/60">
                  <p class="text-xs uppercase tracking-wide text-blue-600 dark:text-blue-300 mb-2">Proposed</p>
                  <pre class="text-xs text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words">{{ proposal.proposed_value || proposal.proposedValue || 'Empty' }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Applied history</h4>
          <div v-if="!changeHistory.length" class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
            No applied change recorded for this job yet.
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="change in changeHistory"
              :key="change.id"
              class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4"
            >
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ humanizeField(change.fieldName) }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatTimestamp(change.createdAt) }}</p>
                </div>
                <NBadge badge="soft-green" size="xs">Applied</NBadge>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div class="rounded-md bg-gray-50 dark:bg-gray-900/40 p-3">
                  <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Previous</p>
                  <pre class="text-xs text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">{{ change.previousValue || 'Empty' }}</pre>
                </div>
                <div class="rounded-md bg-green-50/70 dark:bg-green-950/20 p-3 border border-dashed border-green-200 dark:border-green-800/60">
                  <p class="text-xs uppercase tracking-wide text-green-600 dark:text-green-300 mb-2">New</p>
                  <pre class="text-xs text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words">{{ change.newValue || 'Empty' }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ selectedFields.length }} field{{ selectedFields.length !== 1 ? 's' : '' }} selected
        </div>
        <div class="flex gap-3">
          <NButton btn="link-gray" @click="emit('update:open', false)">Close</NButton>
          <NButton
            btn="soft-blue"
            :loading="applying"
            :disabled="Boolean(job?.appliedAt) || selectedFields.length === 0 || !job?.id || !proposalList.length"
            @click="emit('apply')"
          >
            Apply selected
          </NButton>
        </div>
      </div>
    </template>
  </NDialog>
</template>

<script setup lang="ts">
import { formatRelativeTime, parseDateInput } from '~/utils/time-formatter'

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
    return `${props.preview.summary.proposed_count} proposal(s) generated`
  }
  return 'Review stored enrichment suggestions and applied history.'
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