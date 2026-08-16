<template>
  <AppDialog
    v-model="isOpen"
    title=""
    hide-footer
    @close="emit('update:open', false)"
  >
    <template #title>
      <span class="font-title uppercase text-size-4 font-600">Quote Details</span>
    </template>

    <div v-if="quote">
      <blockquote class="font-body text-size-8 font-300 line-height-tight text-gray-900 dark:text-white leading-relaxed">
        {{ quote.name }}
      </blockquote>

      <div class="mt-6 flex flex-col gap-1 mb-6 border-t b-dashed border-gray-200 dark:border-gray-700 pt-6">
        <div v-if="quote.author" class="flex items-center gap-4">
          <NIcon name="i-ph-person-simple-walk" class="w-4 h-4 text-gray-500" />
          <span class="text-sm text-gray-900 dark:text-white">{{ quote.author.name }}</span>
          <NBadge v-if="quote.author.is_fictional" badge="soft-purple" size="xs">{{ $t('components.quote_card.fictional') }}</NBadge>
        </div>
        <div v-if="quote.reference" class="flex items-center gap-4">
          <NIcon name="i-ph-book-open-text-duotone" class="w-4 h-4 text-gray-500" />
          <span class="text-sm text-gray-900 dark:text-white">{{ quote.reference.name }}</span>
        </div>
        <div v-if="quote.language" class="flex items-center gap-4">
          <NIcon name="i-ph-globe" class="w-4 h-4 text-gray-500" />
          <span class="text-sm text-gray-900 dark:text-white">{{ quote.language }}</span>
        </div>
      </div>

      <NAccordion :items="accordionItems" class="mb-6">
        <template #content="{ item }">
          <div class="space-y-3 text-sm p-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="font-medium text-gray-700 dark:text-gray-500">{{ $t('common.created') }}</span>
                <div class="mt-1">
                  <div class="text-xs text-gray-500 dark:text-blue" title="Email">{{ quote.user?.email }}</div>
                  <div class="flex items-center gap-2">
                    <span class="text-gray-900 dark:text-white" title="Username">{{ quote.user?.name }}</span>
                  </div>
                </div>
              </div>
              <div>
                <span class="font-medium text-gray-700 dark:text-gray-500">{{ $t('common.status') }}</span>
                <div class="mt-1">
                  <NBadge badge="soft-gray" size="xs">{{ quote.status || $t('common.status_draft') }}</NBadge>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="font-medium text-gray-700 dark:text-gray-500">{{ $t('common.created') }}:</span>
                <div class="text-gray-900 dark:text-white mt-1">{{ formatRelativeTime(quote.created_at) }}</div>
              </div>
              <div>
                <span class="font-medium text-gray-700 dark:text-gray-500">{{ $t('common.updated') }}:</span>
                <div class="text-gray-900 dark:text-white mt-1">{{ formatRelativeTime(quote.updated_at) }}</div>
              </div>
            </div>
          </div>
        </template>
      </NAccordion>

      <div v-if="provenance" class="mb-6 border-t b-dashed border-gray-200 dark:border-gray-700 pt-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-title text-sm font-600 uppercase text-gray-700 dark:text-gray-300">Provenance</h3>
          <NBadge v-if="primaryAttribution" :badge="provenanceBadge(primaryAttribution.status)" size="xs">
            {{ provenanceLabel(primaryAttribution.status) }}
          </NBadge>
        </div>
        <div v-if="provenance.attributions.length" class="space-y-2 text-sm">
          <div v-for="attribution in provenance.attributions" :key="attribution.id" class="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <NIcon name="i-ph-git-branch" class="w-4 h-4 text-gray-400" />
            <span>{{ attribution.author?.name || 'Unknown author' }}</span>
            <span class="text-gray-400">·</span>
            <span>{{ attribution.reference?.name || 'Unknown reference' }}</span>
            <NBadge v-if="attribution.is_primary" badge="soft-blue" size="xs">Primary</NBadge>
          </div>
          <a
            v-for="source in provenance.sources"
            :key="source.id"
            v-show="source.source_url"
            :href="source.source_url || undefined"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            <NIcon name="i-ph-link" class="w-3.5 h-3.5" />
            {{ source.label || source.source_type }}
          </a>
        </div>
        <p v-else class="text-xs text-gray-500 dark:text-gray-400">No attribution or source recorded.</p>
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

const provenance = ref<{ attributions: QuoteAttribution[]; sources: QuoteSource[] } | null>(null)
const primaryAttribution = computed(() => provenance.value?.attributions.find(attribution => attribution.is_primary))

const provenanceLabels: Record<string, string> = {
  unverified: 'Unverified',
  manually_verified: 'Manually verified',
  externally_verified: 'Externally verified',
  disputed: 'Disputed',
}

const provenanceLabel = (status: string) => provenanceLabels[status] || status
const provenanceBadge = (status: string) => {
  if (status === 'externally_verified') return 'soft-success'
  if (status === 'manually_verified') return 'soft-blue'
  if (status === 'disputed') return 'soft-error'
  return 'soft-gray'
}

watch(() => props.quote?.id, async (quoteId) => {
  provenance.value = null
  if (!quoteId) return
  try {
    const response = await $fetch<ApiResponse<{ attributions: QuoteAttribution[]; sources: QuoteSource[] }>>(`/api/quotes/${quoteId}`)
    provenance.value = response.data || null
  } catch (error) {
    console.error('Failed to load quote provenance:', error)
  }
}, { immediate: true })

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

const accordionItems = computed(() => {
  if (!props.quote) return []

  return [
    {
      value: 'metadata',
      label: 'Metadata',
      defaultOpen: false,
      slot: 'metadata',
      content: props.quote.status || $t('common.status_draft'),
    }
  ]
})
</script>
