<template>
  <div class="flex w-full justify-center">
    <ClientOnly>
      <NCollapsible v-model:open="metadataOpenModel" class="w-full max-w-600px">
      <NCollapsibleTrigger v-if="showTrigger" as-child class="flex w-full justify-center">
        <NButton
          btn="text-gray"
          class="grid min-w-0 grid-cols-[1rem_auto_1rem] items-center gap-2 rounded-md p-1 font-sans text-xs font-600 uppercase tracking-[0.16em] text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          :class="metadataOpen ? 'text-stone-800 dark:text-stone-100' : ''"
        >
          <span aria-hidden="true" />
          <span>{{ $t('components.quote_sticky.metadata') }}</span>
          <NIcon name="i-ph-caret-down" class="h-4 w-4 transition-transform duration-200" :class="metadataOpen ? 'rotate-180' : ''" />
        </NButton>
      </NCollapsibleTrigger>

      <NCollapsibleContent>
        <div class="mx-auto w-full max-w-600px rounded-2xl bg-[#EFEEE8]/70 px-4 py-6 dark:bg-white/5 md:p-6">

          <dl class="space-y-5">
            <!-- Language -->
            <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-center gap-2 px-2 py-1 sm:grid-cols-3 sm:gap-3 md:px-4">
              <dt class="flex items-center text-sm font-sans font-medium text-gray-500 dark:text-gray-400">
                <NIcon name="i-ph-globe-hemisphere-east-duotone" class="w-4 h-4 mr-2 text-gray-400" />
                {{ $t('components.dialogs.language') }}
              </dt>
              <dd class="text-size-3.5 ml-0 sm:col-span-2 text-base font-sans font-500 text-gray-900 dark:text-white">
                {{ getLanguageName(quote.language) }}
              </dd>
            </div>


            <!-- Source -->
            <div v-if="primarySource?.source_url" class="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-center gap-2 px-2 py-1 sm:grid-cols-3 sm:gap-3 md:px-4">
              <dt class="flex items-center text-sm font-sans font-medium text-gray-500 dark:text-gray-400">
                <NIcon name="i-ph-link" class="w-4 h-4 mr-2 text-gray-400" />
                Source
              </dt>
              <dd class="sm:col-span-2 ml-0 text-base text-size-3.5 font-sans font-500">
                <a
                  :href="primarySource.source_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {{ getSourceLabel(primarySource.source_type) }}
                  <NIcon name="i-ph-arrow-square-out" class="w-3.5 h-3.5" />
                  <span class="sr-only">(opens in a new tab)</span>
                </a>
              </dd>
            </div>

            <div v-if="primaryAttribution && primaryAttribution.status !== 'unverified'" class="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-center gap-2 px-2 py-1 sm:grid-cols-3 sm:gap-3 md:px-4">
              <dt class="flex items-center text-sm font-sans font-medium text-gray-500 dark:text-gray-400">
                <NIcon name="i-ph-seal-check" class="w-4 h-4 mr-2 text-gray-400" />
                Verification
              </dt>
              <dd class="sm:col-span-2 ml-0 text-sm font-sans font-500 text-gray-700 dark:text-gray-300">
                {{ provenanceLabel(primaryAttribution.status) }}
              </dd>
            </div>

            <div v-if="quote.attributions?.length" class="grid grid-cols-1 items-start gap-3 px-2 py-1 sm:grid-cols-3 md:px-4">
              <dt class="flex items-center text-sm font-sans font-medium text-gray-500 dark:text-gray-400">
                <NIcon name="i-ph-git-branch" class="w-4 h-4 mr-2 text-gray-400" />
                Attributions
              </dt>
              <dd class="sm:col-span-2 ml-0 space-y-2 text-sm font-sans text-gray-700 dark:text-gray-300">
                <div v-for="attribution in quote.attributions" :key="attribution.id" class="flex flex-wrap items-center gap-1.5">
                  <span>{{ attribution.author?.name || 'Unknown author' }}</span>
                  <span class="text-gray-400">·</span>
                  <span>{{ attribution.reference?.name || 'Unknown reference' }}</span>
                  <span v-if="attribution.is_primary" class="inline-flex items-center rounded-md border border-stone-300/70 bg-stone-200/50 px-1.5 py-0.5 font-sans text-[0.6rem] font-600 uppercase tracking-[0.12em] text-stone-600 dark:border-stone-600/70 dark:bg-stone-700/40 dark:text-stone-300">Primary</span>
                </div>
              </dd>
            </div>

            <!-- Submitted by -->
            <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-center gap-2 px-2 py-1 sm:grid-cols-3 sm:gap-3 md:px-4">
              <dt class="flex items-center text-sm font-sans font-medium text-gray-500 dark:text-gray-400">
                <NIcon name="i-ph-person-arms-spread" class="w-4 h-4 mr-2 text-gray-400" />
                {{ $t('common.submitted') }}
              </dt>
              <dd class="sm:col-span-2 ml-0 text-base text-size-3.5 font-sans font-500 text-gray-900 dark:text-white">{{ quote.user?.name }}</dd>
            </div>


            <!-- Added on -->
            <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-center gap-2 px-2 py-1 sm:grid-cols-3 sm:gap-3 md:px-4">
              <dt class="flex items-center text-sm font-sans font-medium text-gray-500 dark:text-gray-400">
                <NIcon name="i-ph-calendar-dots-duotone" class="w-4 h-4 mr-2 text-gray-400" />
                {{ $t('common.added') }}
              </dt>
              <dd class="sm:col-span-2 ml-0 text-base text-size-3.5 font-sans font-500 text-gray-900 dark:text-white">{{ formatDate(quote.created_at) }}</dd>
            </div>

            <div v-if="quote.reference">
              <!-- Reference type -->
              <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-center gap-2 px-2 py-1 sm:grid-cols-3 sm:gap-3 md:px-4">
                <dt class="flex items-center text-sm font-sans font-medium text-gray-500 dark:text-gray-400">
                  <NIcon :name="getReferenceIcon(quote.reference.primary_type)" class="w-4 h-4 mr-2 text-gray-400" />
                  Reference type
                </dt>
                <dd class="sm:col-span-2 ml-0 text-base text-size-3.5 font-sans font-500 text-gray-900 dark:text-white capitalize">{{ quote.reference.primary_type.replace('_',' ') }}</dd>
              </div>
            </div>

            <div v-if="quote.is_featured">
              <!-- Status -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <dt class="flex items-center text-sm font-sans font-medium text-gray-500 dark:text-gray-400">
                  <NIcon name="i-ph-star" class="w-4 h-4 mr-2 text-yellow-500" />
                  {{ $t('common.status') }}
                </dt>
                <dd class="sm:col-span-2">
                  <NBadge color="yellow" badge="soft" class="font-sans">
                    <NIcon name="i-ph-sparkle" class="w-3 h-3 mr-1" />
                    {{ $t('home.featured') }}
                  </NBadge>
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </NCollapsibleContent>
      </NCollapsible>

      <template #fallback>
        <div class="flex-col items-center mx-auto">
          <div class="mx-auto flex w-full max-w-600px items-center justify-center px-1 font-sans text-xs font-600 uppercase tracking-[0.16em] text-stone-500 dark:text-stone-400">
            {{ $t('components.quote_sticky.metadata') }}
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import { formatDate } from '~/utils/time-formatter'
import { getReferenceIcon } from '~/utils/reference'
import { getLanguageName } from '~/utils/quote'

const { $t } = useI18n()
const metadataOpen = ref(false)

const sourceLabels: Record<string, string> = {
  'wikiquote-en': 'Wikiquote (English)',
  'wikiquote-fr': 'Wikiquote (French)',
}

const getSourceLabel = (sourceType?: string) => sourceType ? (sourceLabels[sourceType] || sourceType) : 'Original source'

interface Props {
  quote: QuoteWithRelations;
  showTrigger?: boolean;
  relatedQuotes?: QuoteWithRelations[];
  waveColor?: string;
}

const props = withDefaults(defineProps<Props>(), { showTrigger: true });
const metadataOpenModel = computed({
  get: () => !props.showTrigger || metadataOpen.value,
  set: (open: boolean) => {
    if (props.showTrigger) metadataOpen.value = open
  }
})

const primaryAttribution = computed(() => props.quote.attributions?.find(attribution => attribution.is_primary))
const primarySource = computed(() => props.quote.sources?.find(source => source.is_primary) ?? props.quote.sources?.[0])
const provenanceLabel = (status: string) => ({
  manually_verified: 'Manually verified',
  externally_verified: 'Externally verified',
  disputed: 'Disputed',
}[status] || status)
</script>
