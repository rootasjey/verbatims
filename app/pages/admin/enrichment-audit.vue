<template>
  <div class="space-y-6">
    <div class="pb-6 border-b border-gray-300 dark:border-gray-700">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">Enrichment audit</h1>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Read-only evaluation of reference matching and proposals.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <NButton btn="outline-gray" size="sm" :disabled="results.length === 0" @click="downloadJson">Download JSON</NButton>
          <NButton btn="outline-gray" size="sm" :disabled="results.length === 0" @click="copySummary">Copy summary</NButton>
        </div>
      </div>

      <div class="mt-6 flex flex-wrap items-end gap-3">
        <label class="text-xs text-gray-500 dark:text-gray-400">
          References
          <input v-model.number="auditLimit" type="number" min="1" max="50" class="mt-1 block w-28 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
        </label>
        <label class="text-xs text-gray-500 dark:text-gray-400">
          Type
          <select v-model="auditType" class="mt-1 block min-h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
            <option value="">All types</option>
            <option value="music">Music</option>
            <option value="tv_series">TV series</option>
          </select>
        </label>
        <NButton btn="solid-primary" :loading="loading" @click="runAudit">{{ loading ? 'Auditing…' : 'Run audit' }}</NButton>
        <NButton btn="outline-gray" :disabled="loading" @click="resetFilters">Reset filters</NButton>
        <span v-if="loading" class="text-xs text-gray-500 dark:text-gray-400">Processed {{ results.length }} / {{ auditLimit }} in batches of 5</span>
      </div>
    </div>

    <div v-if="results.length" class="grid grid-cols-2 gap-3 md:grid-cols-5">
      <div v-for="item in summaryCards" :key="item.label" class="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
        <p class="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ item.label }}</p>
        <p class="mt-1 font-serif text-2xl text-gray-900 dark:text-gray-100">{{ item.value }}</p>
      </div>
    </div>

    <div v-if="results.length" class="flex flex-wrap items-center gap-2">
      <NButton v-for="filter in filters" :key="filter.value" :btn="activeFilter === filter.value ? 'solid-gray' : 'outline-gray'" size="sm" class="rounded-full" @click="activeFilter = filter.value">
        {{ filter.label }}
      </NButton>
    </div>

    <div v-if="loading && results.length === 0" class="py-12 text-center text-sm text-gray-500">Starting audit…</div>
    <div v-else-if="filteredResults.length === 0" class="rounded-xl border border-gray-200 py-12 text-center text-sm text-gray-500 dark:border-gray-800">No audit results yet.</div>
    <div v-else role="region" tabindex="0" aria-label="Enrichment audit results" class="overflow-x-auto overscroll-x-contain rounded-xl border border-gray-200 dark:border-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500">
      <table class="w-full min-w-[820px] text-left text-sm">
        <thead class="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 dark:border-gray-800">
          <tr>
            <th class="px-4 py-3">Reference</th>
            <th class="px-4 py-3">Decision</th>
            <th class="px-4 py-3">Match</th>
            <th class="px-4 py-3">Scores</th>
            <th class="px-4 py-3">Proposals</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <template v-for="result in filteredResults" :key="result.referenceId">
          <tr class="align-top">
            <td class="px-4 py-3 font-medium text-gray-900 dark:text-gray-100"><button class="text-left hover:underline" @click="toggleDetails(result.referenceId)">{{ result.referenceName }}</button><span class="ml-2 text-xs text-gray-400">#{{ result.referenceId }}</span></td>
            <td class="px-4 py-3"><span :class="decisionClass(result.decision)">{{ result.decision }}</span></td>
            <td class="px-4 py-3"><div>{{ result.match?.label || '—' }}</div><div class="text-xs text-gray-500">{{ result.match?.confidence || 'no match' }}</div></td>
            <td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-300"><div>raw {{ result.match?.raw_score ?? '—' }}</div><div>other {{ result.match?.competing_score ?? '—' }}</div><div>gap {{ result.match?.score_gap ?? '—' }}</div></td>
            <td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{{ result.proposals?.length || 0 }} total · {{ recommendedCount(result) }} recommended</td>
          </tr>
          <tr v-if="expandedId === result.referenceId" :key="`${result.referenceId}-details`" class="bg-gray-50 dark:bg-gray-900/30">
            <td colspan="5" class="px-4 py-4">
              <div class="grid gap-5 lg:grid-cols-4 text-xs">
                <div>
                  <p class="mb-2 font-semibold uppercase tracking-wider text-gray-500">Selected match</p>
                  <p class="font-medium text-gray-900 dark:text-gray-100">{{ result.match?.label || 'No match' }}</p>
                  <p class="mt-1 text-gray-500">{{ result.match?.description || '—' }}</p>
                  <dl class="mt-3 space-y-1 text-gray-500">
                    <div class="flex justify-between gap-3"><dt>Confidence</dt><dd>{{ result.match?.confidence || '—' }}</dd></div>
                    <div class="flex justify-between gap-3"><dt>Raw score</dt><dd>{{ result.match?.raw_score ?? '—' }}</dd></div>
                    <div class="flex justify-between gap-3"><dt>Competing score</dt><dd>{{ result.match?.competing_score ?? '—' }}</dd></div>
                    <div class="flex justify-between gap-3"><dt>Score gap</dt><dd>{{ result.match?.score_gap ?? '—' }}</dd></div>
                  </dl>
                  <a v-if="result.match?.wikidata_url" :href="result.match.wikidata_url" target="_blank" rel="noreferrer" class="mt-3 inline-block text-blue-600 hover:underline dark:text-blue-300">Open Wikidata ↗</a>
                </div>
                <div>
                  <p class="mb-2 font-semibold uppercase tracking-wider text-gray-500">Alternatives</p>
                  <ul v-if="result.alternatives?.length" class="space-y-2">
                    <li v-for="alternative in result.alternatives" :key="alternative.external_id" class="border-b border-gray-200 pb-2 dark:border-gray-700">
                      <span class="font-medium text-gray-900 dark:text-gray-100">{{ alternative.label }}</span>
                      <span class="ml-2 text-gray-500">{{ alternative.raw_score ?? alternative.score }}</span>
                      <p class="text-gray-500">{{ alternative.description || '—' }}</p>
                    </li>
                  </ul>
                  <p v-else class="text-gray-500">No alternatives.</p>
                </div>
                <div>
                  <p class="mb-2 font-semibold uppercase tracking-wider text-gray-500">Proposals and notes</p>
                  <ul v-if="result.proposals?.length" class="space-y-2">
                    <li v-for="proposal in result.proposals" :key="`${result.referenceId}-${proposal.field}`" class="border-b border-gray-200 pb-2 dark:border-gray-700">
                      <div class="flex justify-between gap-2"><span class="font-medium text-gray-900 dark:text-gray-100">{{ proposal.field }}</span><span>{{ proposal.confidence }}%</span></div>
                      <p class="text-gray-500">{{ proposal.proposed_value }}</p>
                    </li>
                  </ul>
                  <p v-else class="text-gray-500">No proposals.</p>
                  <ul v-if="result.notes?.length" class="mt-3 list-disc space-y-1 pl-4 text-amber-700 dark:text-amber-300"><li v-for="note in result.notes" :key="note">{{ note }}</li></ul>
                </div>
                <div>
                  <p class="mb-2 font-semibold uppercase tracking-wider text-gray-500">External sources</p>
                  <p class="mb-2 text-gray-600 dark:text-gray-300">Audit-only score: {{ result.corroboration?.agreementScore ?? 0 }}</p>
                  <ul v-if="result.corroboration?.sourceSignals.length" class="mb-3 space-y-1 text-emerald-700 dark:text-emerald-300"><li v-for="signal in result.corroboration.sourceSignals" :key="signal">{{ signal }}</li></ul>
                  <ul v-if="result.corroboration?.conflicts.length" class="mb-3 space-y-1 text-amber-700 dark:text-amber-300"><li v-for="conflict in result.corroboration.conflicts" :key="conflict">{{ conflict }}</li></ul>
                  <template v-if="result.externalSources?.length">
                    <div v-for="source in result.externalSources" :key="source.source" class="mb-3">
                      <p class="font-medium capitalize text-gray-900 dark:text-gray-100">{{ source.source }}</p>
                      <ul v-if="source.results.length" class="mt-1 space-y-1 text-gray-500">
                        <li v-for="candidate in source.results.slice(0, 3)" :key="candidate.externalId">
                          <a v-if="candidate.url" :href="candidate.url" target="_blank" rel="noreferrer" class="hover:underline">{{ candidate.label }} ↗</a>
                          <span v-else>{{ candidate.label }}</span>
                          <span v-if="candidate.description"> — {{ candidate.description }}</span>
                        </li>
                      </ul>
                      <p v-else class="mt-1 text-gray-500">No candidates.</p>
                    </div>
                  </template>
                  <p v-else class="text-gray-500">Not queried for this reference type.</p>
                </div>
              </div>
            </td>
          </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
interface AuditResult {
  referenceId: number
  referenceName: string
  decision?: string
  match?: { label?: string, description?: string | null, confidence?: string, raw_score?: number, competing_score?: number | null, score_gap?: number | null, wikidata_url?: string } | null
  alternatives?: Array<{ external_id: string, label: string, description?: string | null, score: number, raw_score?: number }>
  proposals?: Array<{ field: string, proposed_value: string | null, confidence: number, recommended?: boolean }>
  externalSources?: Array<{ source: string, results: Array<{ externalId: string, label: string, description: string | null, url: string | null }> }>
  corroboration?: { agreementScore: number, sourceSignals: string[], conflicts: string[] }
  notes?: string[]
  error?: string
}

definePageMeta({ layout: 'admin', middleware: 'admin' })

const auditLimit = ref(20)
const auditType = ref('')
const filtersReady = ref(false)
const loading = ref(false)
const results = ref<AuditResult[]>([])
const activeFilter = ref('all')
const expandedId = ref<number | null>(null)
const filters = [
  { value: 'all', label: 'All' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'ambiguous_match', label: 'Ambiguous' },
  { value: 'no_match', label: 'No match' },
]

const AUDIT_FILTERS_KEY = 'verbatims:enrichment-audit-filters:v1'

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(AUDIT_FILTERS_KEY) || '{}') as { limit?: number, type?: string, decision?: string }
    const savedLimit = saved.limit
    if (typeof savedLimit === 'number' && Number.isInteger(savedLimit) && savedLimit >= 1 && savedLimit <= 50) auditLimit.value = savedLimit
    if (typeof saved.type === 'string' && ['', 'music', 'tv_series'].includes(saved.type)) auditType.value = saved.type
    if (typeof saved.decision === 'string' && filters.some(filter => filter.value === saved.decision)) activeFilter.value = saved.decision
  } catch {
    // Ignore malformed local preferences and use defaults.
  }
  filtersReady.value = true
})

watch([auditLimit, auditType, activeFilter], () => {
  if (!filtersReady.value || !import.meta.client) return
  localStorage.setItem(AUDIT_FILTERS_KEY, JSON.stringify({ limit: auditLimit.value, type: auditType.value, decision: activeFilter.value }))
})

const filteredResults = computed(() => activeFilter.value === 'all' ? results.value : results.value.filter(result => result.decision === activeFilter.value))
const summaryCards = computed(() => [
  { label: 'Audited', value: results.value.length },
  { label: 'Accepted', value: results.value.filter(result => result.decision === 'accepted').length },
  { label: 'Ambiguous', value: results.value.filter(result => result.decision === 'ambiguous_match').length },
  { label: 'No match', value: results.value.filter(result => result.decision === 'no_match').length },
  { label: 'Recommended', value: results.value.reduce((total, result) => total + recommendedCount(result), 0) },
])

async function runAudit() {
  loading.value = true
  results.value = []
  activeFilter.value = 'all'
  const total = Math.max(1, Math.min(50, Number(auditLimit.value) || 20))
  try {
    for (let offset = 0; offset < total; offset += 5) {
      const response = await $fetch<{ data: { results: AuditResult[] } }>('/api/admin/enrichment/audit', { method: 'POST', body: { limit: Math.min(5, total - offset), offset, primaryType: auditType.value || undefined } })
      results.value.push(...response.data.results)
    }
  } finally {
    loading.value = false
  }
}

function recommendedCount(result: AuditResult) {
  return result.proposals?.filter(proposal => proposal.recommended).length || 0
}

function toggleDetails(referenceId: number) {
  expandedId.value = expandedId.value === referenceId ? null : referenceId
}

function resetFilters() {
  auditLimit.value = 20
  auditType.value = ''
  activeFilter.value = 'all'
}

function decisionClass(decision?: string) {
  if (decision === 'accepted') return 'text-emerald-700 dark:text-emerald-300'
  if (decision === 'ambiguous_match') return 'text-amber-700 dark:text-amber-300'
  return 'text-gray-500 dark:text-gray-400'
}

function downloadJson() {
  const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), count: results.value.length, results: results.value }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `enrichment-audit-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

async function copySummary() {
  await navigator.clipboard.writeText(JSON.stringify({ count: results.value.length, cards: summaryCards.value, results: filteredResults.value.map(result => ({ id: result.referenceId, name: result.referenceName, decision: result.decision, match: result.match, recommended: recommendedCount(result) })) }, null, 2))
}
</script>
