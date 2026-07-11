<template>
  <AppDialog
    v-model="isOpen"
    title=""
    @close="emit('update:open', false)"
  >
    <template #title>
      <div class="flex items-center gap-3">
        <NTooltip :content="$t('admin_enrichment.refresh_preview') as string">
          <NButton
            v-if="reference"
            icon
            size="xs"
            btn="solid-gray"
            label="i-ph-magic-wand"
            :loading="loading"
            @click="emit('refresh')"
          />
        </NTooltip>
        <span>
          {{ preview?.reference_name || reference?.name || $t('common.unknown') }}<span class="font-300"> → {{ $t('admin_enrichment.reference_preview') }}</span>
        </span>
      </div>
    </template>

    <div>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {{ $t('admin_enrichment.review_reference_changes') }}
      </p>

      <div v-if="loading" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        {{ $t('admin_enrichment.building_reference_preview') }}
      </div>

      <div v-else-if="!preview" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        {{ $t('admin_enrichment.no_preview') }}
      </div>

      <div v-else class="space-y-4">
        <div class="rounded-lg border border-gray-200 dark:border-gray-900 p-4 bg-gray-50/60 dark:bg-gray-900/20">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p v-if="preview.match" class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {{ $t('admin_enrichment.author_match', { label: preview.match.label }) }}
                <span class="text-gray-400 dark:text-gray-500">•</span>
                {{ $t('admin_enrichment.score_label', { score: preview.match.score }) }}
              </p>
              <div v-if="preview.match" class="mt-2 flex flex-wrap items-center gap-2">
                <NBadge :badge="matchConfidenceBadge(preview.match.confidence)" size="xs">{{ $t('admin_enrichment.confidence_label', { label: (matchConfidenceLabel(preview.match.confidence) as string) }) }}</NBadge>
                <NBadge v-if="preview.match.selected_manually" badge="soft-orange" size="xs">{{ $t('admin_enrichment.selected_manually') }}</NBadge>
                <NBadge v-if="typeof preview.match.score_gap === 'number'" badge="soft-gray" size="xs">{{ $t('admin_enrichment.score_gap', { value: preview.match.score_gap }) }}</NBadge>
                <NBadge v-if="typeof preview.match.competing_score === 'number'" badge="soft-gray" size="xs">{{ $t('admin_enrichment.runner_up', { value: preview.match.competing_score }) }}</NBadge>
              </div>
              <p v-if="preview.match?.description" class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ preview.match.description }}</p>
              <div v-if="preview.match?.signals?.length" class="mt-3 space-y-1">
                <p v-for="signal in preview.match.signals" :key="signal" class="text-xs text-orange-600 dark:text-orange-300">{{ signal }}</p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <NBadge badge="soft-blue" size="sm">{{ $t('admin_enrichment.proposals_count', { count: preview.summary.proposed_count }) }}</NBadge>
              <NBadge badge="soft-green" size="sm">{{ $t('admin_enrichment.recommended_count', { count: preview.summary.recommended_count }) }}</NBadge>
              <NBadge :badge="preview.review_required ? 'soft-orange' : 'soft-gray'" size="sm">{{ preview.review_required ? $t('admin_enrichment.review_required_badge') : $t('admin_enrichment.safe_to_apply') }}</NBadge>
            </div>
          </div>

          <div v-if="preview.notes?.length" class="mt-3 space-y-1">
            <p v-for="note in preview.notes" :key="note" class="text-xs text-gray-500 dark:text-gray-400">{{ note }}</p>
          </div>

          <div v-if="preview.alternative_matches?.length" class="mt-4 rounded-lg border border-dashed border-orange-200 dark:border-orange-900/60 p-3 bg-orange-50/60 dark:bg-orange-950/10">
            <p class="text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-300">{{ $t('admin_enrichment.other_candidates') }}</p>
            <div class="mt-2 space-y-2">
              <div v-for="candidate in preview.alternative_matches" :key="candidate.external_id" class="rounded-md bg-white/70 dark:bg-gray-950/30 p-3">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-sm font-medium text-gray-900 dark:text-white">{{ candidate.label }}</span>
                  <NBadge badge="soft-gray" size="xs">{{ $t('admin_enrichment.score_label', { score: candidate.score }) }}</NBadge>
                </div>
                <p v-if="candidate.description" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ candidate.description }}</p>
                <div v-if="candidate.signals?.length" class="mt-2 space-y-1">
                  <p v-for="signal in candidate.signals" :key="signal" class="text-xs text-orange-700 dark:text-orange-300">{{ signal }}</p>
                </div>
                <div class="mt-2 flex flex-wrap gap-2">
                  <NButton btn="soft-orange" size="xs" @click="emit('promote-candidate', candidate.external_id)">{{ $t('admin_enrichment.use_candidate') }}</NButton>
                  <a :href="candidate.wikidata_url" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200 underline">{{ $t('admin_enrichment.wikidata_link') }}</a>
                  <a v-if="candidate.wikipedia_url" :href="candidate.wikipedia_url" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200 underline">{{ $t('admin_enrichment.wikipedia_link') }}</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="preview.proposals.length === 0" class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {{ $t('admin_enrichment.no_field_update_ref') }}
        </div>

        <div v-else class="space-y-3 max-h-[55vh] overflow-auto pr-1">
          <div v-for="proposal in preview.proposals" :key="proposal.field" class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-3 min-w-0">
                <NCheckbox checkbox="gray" :model-value="selectedFields.includes(proposal.field)" @update:model-value="emit('toggle-field', proposal.field, $event)" />
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <h5 class="text-sm font-medium text-gray-900 dark:text-white">{{ proposal.label }}</h5>
                    <NBadge :badge="proposal.recommended ? 'soft-green' : 'soft-gray'" size="xs">{{ proposal.recommended ? $t('admin_enrichment.recommended') : $t('admin_enrichment.optional') }}</NBadge>
                    <NBadge :badge="proposal.overwrite ? 'soft-orange' : 'soft-blue'" size="xs">{{ proposal.overwrite ? $t('admin_enrichment.overwrite') : $t('admin_enrichment.fill_missing') }}</NBadge>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ $t('admin_enrichment.confidence', { score: proposal.confidence }) }} · {{ proposal.rationale }}</p>
                </div>
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ proposal.source_labels.join(' / ') }}</div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div class="rounded-md bg-gray-50 dark:bg-gray-900/40 p-3">
                <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">{{ $t('admin_enrichment.current') }}</p>
                <pre class="text-xs text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">{{ proposal.current_value || $t('admin_enrichment.empty') }}</pre>
              </div>
              <div class="rounded-md bg-blue-50/70 dark:bg-blue-950/20 p-3 border border-dashed border-blue-200 dark:border-blue-800/60">
                <p class="text-xs uppercase tracking-wide text-blue-600 dark:text-blue-300 mb-2">{{ $t('admin_enrichment.proposed') }}</p>
                <pre class="text-xs text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words">{{ proposal.proposed_value || $t('admin_enrichment.empty') }}</pre>
              </div>
            </div>
            <div v-if="proposal.source_urls?.length" class="mt-3 flex flex-wrap gap-2">
              <a v-for="url in proposal.source_urls" :key="url" :href="url" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200 underline">{{ url }}</a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ $t('admin_enrichment.fields_selected', { count: selectedFields.length }) }}
        </div>
        <div class="flex gap-3">
          <NButton btn="link-gray" @click="emit('update:open', false)">{{ $t('common.close') }}</NButton>
          <NButton btn="ghost-gray" :disabled="!preview?.proposals?.length" @click="emit('select-recommended')">{{ $t('admin_enrichment.select_recommended') }}</NButton>
          <NButton btn="soft-blue" :loading="applying" :disabled="selectedFields.length === 0 || !jobId" @click="emit('apply')">{{ $t('admin_enrichment.apply_selected') }}</NButton>
        </div>
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const { $t } = useI18n()

interface Props {
  open: boolean
  loading: boolean
  applying: boolean
  reference?: QuoteReference | null
  preview?: any | null
  jobId?: number | null
  selectedFields: string[]
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'refresh'): void
  (e: 'promote-candidate', externalId: string): void
  (e: 'toggle-field', field: string, value: boolean | 'indeterminate'): void
  (e: 'select-recommended'): void
  (e: 'apply'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

function matchConfidenceLabel(confidence?: string | null) {
  if (confidence === 'high') return $t('admin_enrichment.confidence_high')
  if (confidence === 'medium') return $t('admin_enrichment.confidence_medium')
  if (confidence === 'low') return $t('admin_enrichment.confidence_low')
  return $t('admin_enrichment.confidence_ambiguous')
}

function matchConfidenceBadge(confidence?: string | null) {
  if (confidence === 'high') return 'soft-green'
  if (confidence === 'medium') return 'soft-blue'
  if (confidence === 'low') return 'soft-gray'
  return 'soft-orange'
}
</script>
