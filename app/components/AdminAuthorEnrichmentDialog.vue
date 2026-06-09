<template>
  <AppDialog
    v-model="isOpen"
    title=""
    max-width="xl"
    scrollable
    @close="emit('update:open', false)"
  >
    <template #title>
      <div class="flex items-center gap-3">
        <NTooltip content="Refresh preview">
          <NButton
            v-if="author"
            icon
            size="xs"
            btn="solid-gray"
            label="i-ph-magic-wand sparkles"
            :loading="loading"
            @click="emit('refresh')"
          />
        </NTooltip>
        <span>
          {{ preview?.author_name || author?.name || 'Author' }}<span class="font-300"> → Author enrichment preview</span>
        </span>
      </div>
    </template>

    <div>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Review the proposed changes before applying them to the author record.
      </p>

      <div v-if="loading" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        Building enrichment preview from Wikidata and Wikimedia Commons...
      </div>

      <div v-else-if="!preview" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        No preview data available.
      </div>

      <div v-else class="space-y-4">
        <div class="rounded-lg border border-gray-200 dark:border-gray-900 p-4 bg-gray-50/60 dark:bg-gray-900/20">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p v-if="preview.match" class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                <b>{{ preview.match.label }}</b>
                <span class="text-gray-400 dark:text-gray-500">•</span>
                score <b>{{ preview.match.score }}</b>
              </p>
              <p v-if="preview.match?.description" class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ preview.match.description }}</p>
              <div v-if="preview.match?.signals?.length" class="mt-3 space-y-1">
                <p v-for="signal in preview.match.signals" :key="signal" class="text-xs text-pink-600 dark:text-pink-300">{{ signal }}</p>
              </div>

              <div v-if="preview.match" class="mt-2 flex flex-wrap items-center gap-2">
                <NBadge :badge="matchConfidenceBadge(preview.match.confidence)" size="xs">{{ matchConfidenceLabel(preview.match.confidence) }} confidence</NBadge>
                <NBadge v-if="preview.match.selected_manually" badge="soft-pink" size="xs">selected manually</NBadge>
                <NBadge v-if="typeof preview.match.score_gap === 'number'" badge="soft-gray" size="xs">score gap {{ preview.match.score_gap }}</NBadge>
                <NBadge v-if="typeof preview.match.competing_score === 'number'" badge="soft-gray" size="xs">runner-up {{ preview.match.competing_score }}</NBadge>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <NTooltip :content="`${preview.summary.proposed_count} proposals`">
                <NBadge badge="soft-blue" size="xs" icon="i-tabler-search"></NBadge>
              </NTooltip>
              <NTooltip :content="`${preview.summary.recommended_count} recommended`">
                <NBadge badge="soft-green" size="xs" icon="i-tabler-thumb-up"></NBadge>
              </NTooltip>

              <NTooltip :content="preview.review_required ? 'Review required' : 'Safe to apply'">
                <NBadge :badge="preview.review_required ? 'solid-pink' : 'soft-gray'" size="xs" icon="i-tabler-zoom-exclamation"></NBadge>
              </NTooltip>
            </div>
          </div>

          <div v-if="preview.notes?.length" class="mt-3 space-y-1">
            <p v-for="note in preview.notes" :key="note" class="text-xs text-gray-500 dark:text-gray-400">{{ note }}</p>
          </div>

          <div v-if="preview.alternative_matches?.length" class="mt-4 rounded-lg border border-dashed border-pink-200 dark:border-pink-900/60 p-3 bg-pink-50/60 dark:bg-pink-950/10">
            <p class="text-xs font-semibold uppercase tracking-wide text-pink-700 dark:text-pink-300">Other plausible candidates</p>
            <div class="mt-2 space-y-2">
              <div v-for="candidate in preview.alternative_matches" :key="candidate.external_id" class="rounded-md bg-white/70 dark:bg-gray-950/30 p-3">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-sm font-medium text-gray-900 dark:text-white">{{ candidate.label }}</span>
                  <NBadge badge="soft-gray" size="xs">score {{ candidate.score }}</NBadge>
                </div>
                <p v-if="candidate.description" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ candidate.description }}</p>
                <div v-if="candidate.signals?.length" class="mt-2 space-y-1">
                  <p v-for="signal in candidate.signals" :key="signal" class="text-xs text-pink-700 dark:text-pink-300">{{ signal }}</p>
                </div>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <NButton btn="soft-pink" size="xs" @click="emit('promote-candidate', candidate.external_id)">Use this candidate</NButton>

                  <NTooltip :content="`Wikidata: ${candidate.wikidata_url}`">
                    <NLink :to="candidate.wikidata_url" target="_blank" rel="noopener noreferrer" class="text-xs text-gray-600 hover:text-blue-700 dark:hover:text-blue-200 hover:underline">
                      <NIcon name="i-tabler-database" />
                    </NLink>
                  </NTooltip>
                  <NTooltip :content="`Wikipedia: ${candidate.wikipedia_url}`">
                    <NLink v-if="candidate.wikipedia_url" :to="candidate.wikipedia_url" target="_blank" rel="noopener noreferrer" class="text-xs text-gray-600 hover:text-blue-700 dark:hover:text-blue-200 hover:underline">
                      <NIcon name="i-tabler-brand-wikipedia" />
                    </NLink>
                  </NTooltip>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="preview.proposals.length === 0" class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
          No field update is currently recommended for this author.
        </div>

        <div v-else class="space-y-3 max-h-[55vh] overflow-auto pr-1">
          <div v-for="proposal in preview.proposals" :key="proposal.field" class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4">
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-3 min-w-0">
                <NCheckbox checkbox="blue" class="mt-1 p-2.4" rounded="1" size="xs" :model-value="selectedFields.includes(proposal.field)" @update:model-value="emit('toggle-field', proposal.field, $event)" />
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <h5 class="text-sm font-medium text-gray-900 dark:text-white">{{ proposal.label }}</h5>

                    <NTooltip :content="proposal.recommended ? 'Recommended' : 'Optional'">
                      <NBadge :badge="proposal.recommended ? 'soft-green' : 'solid-gray'" size="xs">
                        <NIcon v-if="proposal.recommended" name="i-tabler-thumb-up" />
                        <NIcon v-else name="i-tabler-question-mark" />
                      </NBadge>
                    </NTooltip>
                    <NBadge :badge="proposal.overwrite ? 'solid-pink' : 'soft-blue'" size="xs">{{ proposal.overwrite ? 'Overwrite' : 'Fill missing' }}</NBadge>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Confidence {{ proposal.confidence }} · {{ proposal.rationale }}</p>
                </div>
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ proposal.source_labels.join(' / ') }}</div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div class="rounded-md bg-white dark:bg-gray-900/40 p-3">
                <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Current</p>
                <pre class="text-xs text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">{{ proposal.current_value || 'Empty' }}</pre>
              </div>
              <div class="rounded-md bg-blue-50/70 dark:bg-blue-950/20 p-3 border border-dashed border-blue-200 dark:border-blue-800/60">
                <p class="text-xs uppercase tracking-wide text-blue-600 dark:text-blue-300 mb-2">Proposed</p>
                <pre class="text-xs text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words">{{ proposal.proposed_value || 'Empty' }}</pre>
              </div>
            </div>
            <div v-if="proposal.source_urls?.length" class="mt-3 flex flex-wrap gap-2">
              <div class="w-full p-3 bg-white dark:bg-gray-800 rounded-2">
                <h3 class="text-xs font-600 text-gray-600 dark:text-gray-300 mb-2">Source URLs</h3>
                <div class="flex flex-wrap gap-2">
                  <NTooltip v-for="url in proposal.source_urls" :key="url"  :content="url">
                    <NButton icon link btn="soft-blue" :to="url" target="_blank" rel="noopener noreferrer" class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200 underline">
                      <NIcon v-if="url.includes('wikipedia')" name="i-tabler-brand-wikipedia" />
                      <NIcon v-else-if="url.includes('wikidata')" name="i-tabler-database" />
                      <NIcon v-else name="i-tabler-link" />
                    </NButton>
                  </NTooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="w-full flex items-center justify-between gap-3 border-t b-dashed px-4 py-3">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ selectedFields.length }} field{{ selectedFields.length !== 1 ? 's' : '' }} selected
        </div>
        <div class="flex gap-3">
          <NButton btn="link-gray" @click="emit('update:open', false)">Close</NButton>
          <NButton btn="text-gray" :disabled="!preview?.proposals?.length" @click="emit('select-recommended')">Select recommended</NButton>
          <PrimaryButton class="px-4" :loading="applying" :disabled="selectedFields.length === 0 || !jobId" @click="emit('apply')">Apply selected</PrimaryButton>
        </div>
      </div>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
interface Props {
  open: boolean
  loading: boolean
  applying: boolean
  author?: Author | null
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
  if (confidence === 'high') return 'High'
  if (confidence === 'medium') return 'Medium'
  if (confidence === 'low') return 'Low'
  return 'Ambiguous'
}

function matchConfidenceBadge(confidence?: string | null) {
  if (confidence === 'high') return 'soft-green'
  if (confidence === 'medium') return 'soft-blue'
  if (confidence === 'low') return 'soft-gray'
  return 'soft-pink'
}
</script>
