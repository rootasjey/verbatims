<template>
  <div class="min-w-0">
        <div v-if="activeTab === 'evidence'" id="quote-audit-panel-evidence" role="tabpanel" class="space-y-3">
          <section v-if="evidence" class="rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <h4 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">{{ $t('audit_evidence_title') }}</h4>
                <p class="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{{ evidence.summary }}</p>
                <p v-if="evidence.auditedAt" class="mt-1 text-[11px] text-gray-400 dark:text-gray-500">{{ $t('audit_evidence_date', { date: formatRelativeTime(evidence.auditedAt) }) }}</p>
              </div>
              <NBadge badge="soft-amber" size="xs" class="shrink-0">{{ $t('audit_progress_awaiting_review') }}</NBadge>
            </div>
            <p class="mt-2 border-t border-gray-100 pt-2 text-xs leading-relaxed text-gray-500 dark:border-gray-800 dark:text-gray-400">{{ $t('audit_evidence_human_review') }}</p>
          </section>

          <p v-if="!evidence || evidenceDimensions.length === 0" class="rounded-lg border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            {{ $t('audit_no_evidence') }}
          </p>

          <details
            v-for="dimension in evidenceDimensions"
            :key="dimension"
            class="group rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#171615]"
          >
            <summary class="flex cursor-pointer list-none items-center gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-700 dark:focus-visible:ring-gray-300">
              <NIcon :name="dimensionIcons[dimension]" class="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" aria-hidden="true" />
              <span class="min-w-0 flex-1 font-sans text-sm font-500 text-gray-900 dark:text-gray-100">{{ $t(`audit_dimension_${dimension}`) }}</span>
              <NBadge :badge="dimensionBadge(dimension)" size="xs">{{ dimensionStatusLabel(dimension) }}</NBadge>
              <NIcon name="i-lucide-chevron-down" class="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div class="space-y-2 border-t border-gray-100 px-4 py-3 text-sm dark:border-gray-800">
              <p class="leading-relaxed text-gray-700 dark:text-gray-300">{{ evidence?.dimensions?.[dimension]?.assessment }}</p>
              <p v-if="evidence?.dimensions?.[dimension]?.evidenceLocation" class="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                {{ $t('audit_evidence_location') }}: {{ evidence.dimensions[dimension].evidenceLocation }}
              </p>
              <ul v-if="evidence?.dimensions?.[dimension]?.sources?.length" class="space-y-2">
                <li v-for="source in evidence.dimensions[dimension].sources" :key="source.url" class="break-words text-xs leading-relaxed">
                  <a :href="source.url" target="_blank" rel="noopener noreferrer" class="text-blue-700 underline decoration-blue-300 underline-offset-2 hover:decoration-blue-700 dark:text-blue-300">{{ source.title || source.url }}</a>
                  <span class="ml-1 text-gray-500 dark:text-gray-400">{{ $t(`audit_source_level_${source.sourceLevel || 'unknown'}`) }}<template v-if="source.support"> — {{ source.support }}</template></span>
                </li>
              </ul>
              <ul v-if="evidence?.dimensions?.[dimension]?.caveats?.length" class="list-disc space-y-1 pl-4 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                <li v-for="caveat in evidence.dimensions[dimension].caveats" :key="caveat">{{ caveat }}</li>
              </ul>
            </div>
          </details>
        </div>

        <div v-else id="quote-audit-panel-assessment" role="tabpanel" class="space-y-4">
          <section class="space-y-2" aria-labelledby="outcome-heading">
            <div>
              <h4 id="outcome-heading" class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">{{ $t('audit_outcome_label') }}</h4>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ $t('audit_outcome_hint') }}</p>
            </div>
            <fieldset class="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" aria-labelledby="outcome-heading">
              <legend class="sr-only">{{ $t('audit_outcome_label') }}</legend>
              <label
                v-for="option in outcomeTiles"
                :key="option.value || 'none'"
                class="group relative flex aspect-[1.1/1] min-h-28 min-w-0 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border p-3 text-center transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-gray-700 dark:focus-within:ring-gray-300"
                :class="selectedOutcome === option.value
                  ? 'border-gray-700 bg-gray-100 dark:border-gray-300 dark:bg-white/[0.08]'
                  : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-[#171615] dark:hover:bg-white/[0.06]'"
              >
                <input v-model="selectedOutcome" type="radio" name="quote-audit-outcome" :value="option.value" class="sr-only">
                <NIcon :name="option.icon" class="h-7 w-7 shrink-0 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                <span class="min-w-0 font-sans text-[15px] font-500 leading-snug text-gray-800 dark:text-gray-200">{{ option.label }}</span>
                <NIcon v-if="selectedOutcome === option.value" name="i-lucide-check" class="absolute right-2 top-2 h-4 w-4 text-gray-900 dark:text-gray-100" aria-hidden="true" />
              </label>
            </fieldset>
          </section>

          <label class="block space-y-1.5">
            <span class="font-sans text-xs font-medium text-gray-700 dark:text-gray-300">{{ $t('audit_notes_label') }}</span>
            <textarea v-model="notes" rows="3" maxlength="5000" class="w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 font-sans text-sm text-gray-900 dark:border-gray-700 dark:bg-[#171615] dark:text-gray-100" :placeholder="$t('audit_notes_placeholder') as string" />
          </label>
          <p v-if="quote?.audit_reviewed_at" class="text-[11px] text-gray-500 dark:text-gray-400">{{ $t('audit_last_reviewed', { date: formatRelativeTime(quote.audit_reviewed_at) }) }}</p>
        </div>
  </div>
</template>

<script setup lang="ts">
import type { QuoteAuditOutcome } from '#shared/constants/quote-audit'
import { formatRelativeTime } from '~/utils/time-formatter'

interface AuditFinding {
  status?: string
  assessment?: string
  evidenceLocation?: string | null
  sources?: Array<{ url: string; title?: string; sourceLevel?: string; support?: string }>
  caveats?: string[]
}

interface AuditEvidence {
  summary?: string
  auditedAt?: string
  dimensions?: Record<string, AuditFinding>
}

const props = defineProps<{
  quote: AdminQuote | null
  evidence: AuditEvidence | null
  outcomeOptions: Array<{ value: QuoteAuditOutcome; label: string }>
}>()

const outcome = defineModel<QuoteAuditOutcome | ''>('outcome', { required: true })
const notes = defineModel<string>('notes', { required: true })
const activeTab = defineModel<'evidence' | 'assessment'>('tab', { default: 'evidence' })

const { $t } = useI18n()

const evidenceDimensionOrder = ['quote_text', 'author', 'reference', 'author_image', 'reference_image']
const evidenceDimensions = computed(() => evidenceDimensionOrder.filter(dimension => props.evidence?.dimensions?.[dimension]))
const dimensionIcons: Record<string, string> = {
  quote_text: 'i-lucide-quote',
  author: 'i-lucide-user-round',
  reference: 'i-lucide-book-open',
  author_image: 'i-lucide-user-round',
  reference_image: 'i-lucide-image',
}

const selectedOutcome = computed({
  get: () => outcome.value,
  set: (value: QuoteAuditOutcome | '') => { outcome.value = value },
})

const outcomeTiles = computed(() => [
  { value: '' as const, label: $t('audit_outcome_none') as string, icon: 'i-lucide-circle-dashed' },
  ...props.outcomeOptions.map(option => ({
    ...option,
    icon: {
      source_candidate_found: 'i-lucide-link-2',
      possible_misattribution: 'i-lucide-user-round-search',
      primary_source_confirmed: 'i-lucide-book-check',
      no_primary_source_found: 'i-lucide-search-x',
      disputed: 'i-lucide-scale',
      inconclusive: 'i-lucide-circle-help',
    }[option.value],
  })),
])

const dimensionStatusLabel = (dimension: string) => {
  const status = props.evidence?.dimensions?.[dimension]?.status
  return status ? $t(`audit_evidence_status_${status}`) : $t('audit_evidence_status_uncertain')
}

const dimensionBadge = (dimension: string) => {
  const status = props.evidence?.dimensions?.[dimension]?.status
  if (status === 'confirmed_primary' || status === 'supported_authoritative') return 'soft-green'
  if (status === 'secondary_candidate') return 'soft-amber'
  return 'soft-gray'
}
</script>
