<template>
  <AppDialog
    v-model="isOpen"
    title=""
    :max-width="view === 'candidate' ? 'md' : 'xl'"
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
      <div v-if="loading && !preview" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        Building enrichment preview from Wikidata and Wikimedia Commons...
      </div>

      <div v-else-if="!preview && !loading" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        No preview data available.
      </div>

      <div v-else ref="contentWrapper" class="pt-2 space-y-6" style="transition: height .3s ease; overflow: hidden">
        <!-- AVATAR STRIP — step 1 only -->
        <div v-if="view === 'candidate'">
          <div class="flex justify-center items-center gap-4 overflow-x-auto pb-1">
            <div
              v-for="candidate in candidates"
              :key="candidate.id"
              class="flex flex-col items-center gap-2 min-w-[88px] cursor-pointer group"
              :class="selectedCandidateId === candidate.id ? '' : 'opacity-65 hover:opacity-90 transition-opacity'"
              @click="selectCandidate(candidate.id)"
            >
              <div class="relative w-16 h-16 hover:scale-105 active:scale-95 transition-transform">
                <svg class="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36" fill="none">
                  <circle cx="18" cy="18" r="15.5" stroke="currentColor" stroke-width="1.8" class="text-gray-200 dark:text-gray-700" />
                  <circle
                    cx="18" cy="18" r="15.5"
                    stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
                    :stroke-dasharray="97.39"
                    :stroke-dashoffset="97.39 - (candidate.score / 100) * 97.39"
                    :class="scoreRingColor(candidate.score)"
                  />
                </svg>
                <div class="absolute inset-[9px] rounded-full overflow-hidden bg-white dark:bg-gray-800 flex items-center justify-center">
                  <img
                    v-if="candidate.image_url && !failedImages[candidate.id]"
                    :src="candidate.image_url"
                    :alt="candidate.label"
                    class="w-full h-full object-cover"
                    @error="onImageError(candidate.id)"
                  />
                  <NIcon v-else name="i-ph-user" class="w-6 h-6 text-gray-400" />
                </div>
                <div
                  v-if="selectedCandidateId === candidate.id"
                  class="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm"
                >
                  <NIcon name="i-ph-check-circle" class="w-4 h-4 text-blue-500" />
                </div>
              </div>
              <div class="text-center min-w-0">
                <p class="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[80px]">{{ candidate.label }}</p>
                <p class="text-[11px] text-gray-500 dark:text-gray-400">{{ candidate.score }}% match</p>
              </div>
            </div>
          </div>
        </div>

        <!-- STEP 1: Candidate detail & signal review -->
        <div v-if="view === 'candidate'" class="space-y-4">
          <Transition name="panel" mode="out-in">
            <!-- Promoting shimmer -->
            <div v-if="promoting" key="shimmer" class="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-950/30">
              <div class="space-y-3 animate-pulse">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
            </div>

            <!-- Real content -->
            <div v-else-if="selectedCandidateData" key="content">
              <div class="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-950/30">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white mt-1">{{ selectedCandidateData.label }}</p>
                    <p v-if="selectedCandidateData.description" class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ selectedCandidateData.description }}</p>

                    <div v-if="selectedCandidateData.signals.length" class="mt-3 space-y-1.5">
                      <p v-for="signal in selectedCandidateData.signals" :key="signal" class="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                        <NIcon name="i-ph-check-circle" class="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                        <span>{{ formatSignalForDetail(signal) }}</span>
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5 shrink-0">
                    <NTooltip :content="`Wikidata: ${selectedCandidateData.wikidata_url}`">
                      <NLink :to="selectedCandidateData.wikidata_url" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <NIcon name="i-tabler-database" class="w-4 h-4" />
                      </NLink>
                    </NTooltip>
                    <NTooltip v-if="selectedCandidateData.wikipedia_url" :content="`Wikipedia: ${selectedCandidateData.wikipedia_url}`">
                      <NLink :to="selectedCandidateData.wikipedia_url" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        <NIcon name="i-tabler-brand-wikipedia" class="w-4 h-4" />
                      </NLink>
                    </NTooltip>
                  </div>
                </div>
              </div>

              <div
                v-if="enrichmentStatus && selectedCandidateData?.isPrimary"
                class="flex items-start gap-2 px-3 py-2.5 mx-1 mt-2 rounded-lg border text-xs"
                :class="enrichmentStatus.variantClass"
              >
                <NIcon :name="enrichmentStatus.icon" class="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p class="font-medium">{{ enrichmentStatus.title }}</p>
                  <p v-if="enrichmentStatus.description" class="mt-0.5 opacity-80 leading-relaxed">{{ enrichmentStatus.description }}</p>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-3 mx-1 mt-2">
                <NBadge v-if="preview?.match?.selected_manually" badge="soft-pink" size="xs">selected manually</NBadge>
                <NTooltip v-if="typeof preview?.match?.score_gap === 'number'" content="Difference in match score between the primary candidate and the runner-up. A small gap means both candidates are nearly tied.">
                  <NBadge badge="soft-gray" size="xs">Score Gap {{ preview.match.score_gap }}</NBadge>
                </NTooltip>
                <NTooltip v-if="typeof preview?.match?.competing_score === 'number'" content="Match score of the second-best candidate. A high runner-up score close to the primary means the selection is less certain.">
                  <NBadge badge="soft-gray" size="xs">Runner-up {{ preview.match.competing_score }}</NBadge>
                </NTooltip>
                <NBadge v-if="!selectedCandidateData.isPrimary" badge="soft-blue" size="xs">alternative candidate</NBadge>
                <NTooltip :content="`${preview.summary.proposed_count} proposals`">
                  <NBadge badge="soft-blue" size="xs" icon="i-tabler-search">{{ preview.summary.proposed_count }}</NBadge>
                </NTooltip>
                <NTooltip :content="`${preview.summary.recommended_count} recommended`">
                  <NBadge badge="soft-green" size="xs" icon="i-tabler-thumb-up">{{ preview.summary.recommended_count }}</NBadge>
                </NTooltip>
              </div>
            </div>
          </Transition>

          <div v-if="!promoting && !selectedCandidateData && candidates.length > 0" class="text-center text-xs text-gray-400 dark:text-gray-500 py-2">
            Click a candidate above to review their matching signals.
          </div>

          <div class="flex justify-center">
            <PrimaryButton class="py-2 px-6" :disabled="promoting" @click="view = 'proposals'">
              <template v-if="promoting">
                <NIcon name="i-ph-spinner" class="w-4 h-4 animate-spin" />
                Regenerating proposals…
              </template>
              <template v-else>
                Continue to field proposals
                <NIcon name="i-ph-arrow-right" />
              </template>
            </PrimaryButton>
          </div>
        </div>

        <!-- STEP 2: Field proposals -->
        <div v-else class="space-y-4">
          <div class="flex items-center gap-3">
            <NButton btn="text-gray" size="xs" class="!p-0 shrink-0" @click="view = 'candidate'">
              <NIcon name="i-ph-arrow-left" class="w-4 h-4" />
            </NButton>

            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                <img
                  v-if="selectedCandidateData?.image_url && !failedImages[selectedCandidateData.id]"
                  :src="selectedCandidateData.image_url"
                  :alt="selectedCandidateData.label"
                  class="w-full h-full object-cover"
                  @error="onImageError(selectedCandidateData.id)"
                />
                <NIcon v-else name="i-ph-user" class="w-4 h-4 text-gray-400" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ selectedCandidateData?.label }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ selectedCandidateData?.score }}% match</p>
              </div>
            </div>
          </div>

          <div v-if="preview.proposals.length === 0" class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
            No field update is currently recommended for this author.
          </div>

          <div v-else class="space-y-3">
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
    </div>

    <template #footer>
      <div v-if="view === 'candidate'" class="w-full flex items-center justify-end gap-3 border-t b-dashed px-4 py-3">
        <NButton btn="link-gray" @click="emit('update:open', false)">Close</NButton>
      </div>
      <div v-else class="w-full flex items-center justify-between gap-3 border-t b-dashed px-4 py-3">
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

interface DisplayCandidate {
  id: string
  label: string
  description: string | null
  score: number
  image_url: string | null
  signals: string[]
  isPrimary: boolean
  confidence?: string | null
  wikidata_url: string
  wikipedia_url: string | null | undefined
}

const view = ref<'candidate' | 'proposals'>('candidate')
const selectedCandidateId = ref<string | null>(null)
const failedImages = ref<Record<string, boolean>>({})
const promoting = ref(false)
const candidates = ref<DisplayCandidate[]>([])

const contentWrapper = ref<HTMLElement | null>(null)

function animateHeight() {
  const el = contentWrapper.value
  if (!el) return
  el.style.height = el.scrollHeight + 'px'
}

onMounted(() => {
  nextTick(animateHeight)
})

function buildCandidatesFromPreview(preview: any) {
  const list: DisplayCandidate[] = []
  if (preview.match) {
    const m = preview.match
    list.push({
      id: m.external_id,
      label: m.label,
      description: m.description ?? null,
      score: m.score,
      image_url: m.image_url ?? null,
      signals: m.signals ?? [],
      isPrimary: true,
      confidence: m.confidence,
      wikidata_url: m.wikidata_url,
      wikipedia_url: m.wikipedia_url ?? null,
    })
  }
  if (preview.alternative_matches) {
    for (const alt of preview.alternative_matches) {
      list.push({
        id: alt.external_id,
        label: alt.label,
        description: alt.description ?? null,
        score: alt.score,
        image_url: alt.image_url ?? null,
        signals: alt.signals ?? [],
        isPrimary: false,
        wikidata_url: alt.wikidata_url,
        wikipedia_url: alt.wikipedia_url ?? null,
      })
    }
  }
  return list
}

const selectedCandidateData = computed<DisplayCandidate | null>(() => {
  if (!selectedCandidateId.value) return null
  return candidates.value.find(c => c.id === selectedCandidateId.value) || null
})

interface EnrichmentStatus {
  variantClass: string
  icon: string
  title: string
  description: string | null
}

const enrichmentStatus = computed<EnrichmentStatus | null>(() => {
  if (!props.preview?.match) return null

  const confidence = props.preview.match.confidence
  const reviewRequired = props.preview.review_required
  const notes = props.preview.notes?.filter(Boolean).join(' ') || null

  if (confidence === 'high' && !reviewRequired) {
    return {
      variantClass: 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
      icon: 'i-ph-check-circle',
      title: 'High confidence — safe to apply',
      description: null,
    }
  }

  if (confidence === 'ambiguous' || reviewRequired) {
    const label = matchConfidenceLabel(confidence)
    return {
      variantClass: 'bg-amber-50 dark:bg-pink-950/20 text-amber-700 dark:text-pink-300 border-amber-200 dark:border-amber-800',
      icon: 'i-ph-warning',
      title: `${label} confidence — review required`,
      description: notes,
    }
  }

  if (confidence === 'low') {
    const label = matchConfidenceLabel(confidence)
    return {
      variantClass: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      icon: 'i-ph-warning',
      title: `${label} confidence — review recommended`,
      description: notes,
    }
  }

  if (confidence === 'medium') {
    return {
      variantClass: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      icon: 'i-ph-info',
      title: 'Medium confidence',
      description: notes,
    }
  }

  return null
})

function matchConfidenceLabel(confidence?: string | null) {
  if (confidence === 'high') return 'High'
  if (confidence === 'medium') return 'Medium'
  if (confidence === 'low') return 'Low'
  return 'Ambiguous'
}

watch(() => props.preview, (preview) => {
  if (preview?.match && candidates.value.length === 0) {
    candidates.value = buildCandidatesFromPreview(preview)
  }
  if (preview?.match) {
    selectedCandidateId.value = preview.match.external_id
    const primaryId = preview.match.external_id
    for (const c of candidates.value) {
      if (c.isPrimary !== (c.id === primaryId)) {
        c.isPrimary = c.id === primaryId
      }
    }
  }
  view.value = 'candidate'
  promoting.value = false
  nextTick(animateHeight)
}, { immediate: true })

watch([view, () => promoting.value, selectedCandidateId], () => {
  nextTick(animateHeight)
})

function selectCandidate(id: string) {
  if (view.value === 'proposals') {
    view.value = 'candidate'
  }
  selectedCandidateId.value = id

  const candidate = candidates.value.find(c => c.id === id)
  if (candidate && !candidate.isPrimary) {
    promoting.value = true
    emit('promote-candidate', id)
  }
}

function onImageError(id: string) {
  failedImages.value[id] = true
}

function scoreRingColor(score: number) {
  if (score >= 80) return 'text-blue-500'
  if (score >= 60) return 'text-indigo-500'
  if (score >= 40) return 'text-amber-500'
  return 'text-pink-500'
}

function formatSignalForDetail(signal: string) {
  if (/^Name match/i.test(signal)) return 'The name matches the selected Wikidata entry.'
  if (/^Description overlap/i.test(signal)) return 'Existing biography context overlaps with the selected Wikidata description.'
  if (/^Occupation match/i.test(signal)) return 'Existing profession aligns with the selected Wikidata occupation.'
  if (/^Birth year/i.test(signal)) return 'Existing birth details match Wikidata records.'
  if (/^Death year/i.test(signal)) return 'Existing death details align with Wikidata records.'
  if (/^Birth location/i.test(signal)) return 'Existing birth location matches Wikidata records.'
  if (/^Death location/i.test(signal)) return 'Existing death location matches Wikidata records.'
  return signal
}
</script>
