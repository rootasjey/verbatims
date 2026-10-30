<template>
  <AppDialog
    v-model="isOpen"
    title=""
    hide-footer
    max-width="2xl"
    scrollable
    @close="emit('update:open', false)"
  >
    <template #title>
      <span class="font-title uppercase text-size-4 font-600">Quote Details</span>
    </template>

    <div v-if="quote" class="space-y-6">
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.95fr)] lg:items-start">
        <section class="min-w-0 lg:border-r lg:border-dashed lg:border-gray-200 lg:pr-6 lg:dark:border-gray-700">
          <p class="mb-4 font-sans text-[0.65rem] font-700 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Quote</p>
          <blockquote class="font-body text-size-8 font-300 line-height-tight text-gray-900 dark:text-white leading-relaxed">
            {{ quote.name }}
          </blockquote>

          <div class="mt-8 flex flex-col gap-3 border-t b-dashed border-gray-200 pt-5 dark:border-gray-700">
            <div v-if="quote.author" class="flex items-center gap-3">
              <NIcon name="i-ph-person-simple-walk" class="h-4 w-4 shrink-0 text-gray-500" />
              <span class="text-sm text-gray-900 dark:text-white">{{ quote.author.name }}</span>
              <NBadge v-if="quote.author.is_fictional" badge="soft-purple" size="xs">{{ $t('components.quote_card.fictional') }}</NBadge>
            </div>
            <div v-if="quote.reference" class="flex items-center gap-3">
              <NIcon name="i-ph-book-open-text-duotone" class="h-4 w-4 shrink-0 text-gray-500" />
              <span class="text-sm text-gray-900 dark:text-white">{{ quote.reference.name }}</span>
            </div>
            <div v-if="quote.language" class="flex items-center gap-3">
              <NIcon name="i-ph-globe" class="h-4 w-4 shrink-0 text-gray-500" />
              <span class="text-sm text-gray-900 dark:text-white">{{ quote.language }}</span>
            </div>
          </div>
        </section>

        <div class="min-w-0">
          <NTabs v-model="activeInfoTab" :items="infoTabs" class="w-full">
            <template #content="{ item }">
              <AdminProvenanceManager
                v-if="(item.value === 'attributions' || item.value === 'sources') && provenance"
                :quote-id="quote.id"
                :attributions="provenance.attributions"
                :sources="provenance.sources"
                :occurrences="provenance.occurrences"
                :panel="item.value"
                @changed="loadProvenance"
              />
              <AdminQuoteOccurrenceManager
                v-else-if="item.value === 'occurrences' && provenance"
                :quote-id="quote.id"
                :attributions="provenance.attributions"
                :occurrences="provenance.occurrences"
                @changed="loadProvenance"
              />
              <div v-else-if="item.value === 'metadata'" class="mt-5 border border-gray-200 dark:border-gray-700">
                <div class="grid gap-4 p-4 text-sm sm:grid-cols-2">
                  <div>
                    <span class="font-medium text-gray-700 dark:text-gray-500">{{ $t('common.created') }}</span>
                    <div class="mt-1">
                      <div class="text-xs text-gray-500 dark:text-blue" title="Email">{{ quote.user?.email }}</div>
                      <div class="flex items-center gap-2"><span class="text-gray-900 dark:text-white" title="Username">{{ quote.user?.name }}</span></div>
                    </div>
                  </div>
                  <div>
                    <span class="font-medium text-gray-700 dark:text-gray-500">{{ $t('common.status') }}</span>
                    <div class="mt-1"><NBadge badge="soft-gray" size="xs">{{ quote.status || $t('common.status_draft') }}</NBadge></div>
                  </div>
                  <div>
                    <span class="font-medium text-gray-700 dark:text-gray-500">{{ $t('common.created') }}:</span>
                    <div class="mt-1 text-gray-900 dark:text-white">{{ formatRelativeTime(quote.created_at) }}</div>
                  </div>
                  <div>
                    <span class="font-medium text-gray-700 dark:text-gray-500">{{ $t('common.updated') }}:</span>
                    <div class="mt-1 text-gray-900 dark:text-white">{{ formatRelativeTime(quote.updated_at) }}</div>
                  </div>
                </div>
              </div>
            </template>
          </NTabs>
        </div>
      </div>

      <div class="flex justify-end gap-2">
        <NButton btn="soft-blue" @click="$emit('edit', quote)">{{ $t('common.edit') }}</NButton>
        <NButton btn="link-gray" @click="emit('update:open', false)">{{ $t('components.dialogs.close') }}</NButton>
      </div>
    </div>
  </AppDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatRelativeTime } from '~/utils/time-formatter'

const { $t } = useI18n()

interface Props {
  quote: AdminQuote | null
  open: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'edit', quote: AdminQuote): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const provenance = ref<{ attributions: QuoteAttribution[]; sources: QuoteSource[]; occurrences: QuoteOccurrence[] } | null>(null)
const activeInfoTab = ref<'attributions' | 'sources' | 'occurrences' | 'metadata'>('attributions')
const infoTabs = [
  { name: 'Attributions', value: 'attributions', _tabsTrigger: { leading: 'i-ph-git-branch' } },
  { name: 'Sources', value: 'sources', _tabsTrigger: { leading: 'i-ph-link' } },
  { name: 'Occurrences', value: 'occurrences', _tabsTrigger: { leading: 'i-ph-quotes' } },
  { name: 'Metadata', value: 'metadata', _tabsTrigger: { leading: 'i-ph-info' } },
]
const loadProvenance = async () => {
  if (!props.quote?.id) return
  try {
    const [attributionsResponse, sourcesResponse, occurrencesResponse] = await Promise.all([
      $fetch<ApiResponse<Array<{
        id: number
        quote_id: number
        author_id: number | null
        reference_id: number | null
        is_primary: boolean
        status: QuoteProvenanceStatus
        verified_by: number | null
        verified_at: string | null
        notes: string | null
        author_name: string | null
        reference_name: string | null
      }>>>(`/api/admin/quotes/${props.quote.id}/attributions`),
      $fetch<ApiResponse<QuoteSource[]>>(`/api/admin/quotes/${props.quote.id}/sources`),
      $fetch<ApiResponse<QuoteOccurrence[]>>(`/api/admin/quotes/${props.quote.id}/occurrences`),
    ])

    provenance.value = {
      attributions: (attributionsResponse.data || []).map(attribution => ({
        id: attribution.id,
        quote_id: attribution.quote_id,
        author_id: attribution.author_id,
        reference_id: attribution.reference_id,
        is_primary: attribution.is_primary,
        status: attribution.status,
        verified_by: attribution.verified_by,
        verified_at: attribution.verified_at,
        notes: attribution.notes,
        author: attribution.author_id ? { id: attribution.author_id, name: attribution.author_name || 'Unknown author' } : undefined,
        reference: attribution.reference_id ? { id: attribution.reference_id, name: attribution.reference_name || 'Unknown reference' } : undefined,
      })),
      sources: sourcesResponse.data || [],
      occurrences: occurrencesResponse.data || [],
    }
  } catch (error) {
    console.error('Failed to load quote provenance:', error)
  }
}

watch(() => props.quote?.id, async (quoteId) => {
  provenance.value = null
  if (!quoteId) return
  await loadProvenance()
}, { immediate: true })

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

</script>
