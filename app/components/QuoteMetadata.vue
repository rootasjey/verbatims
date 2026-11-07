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
            <div v-if="quote.sources?.length" class="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-start gap-2 px-2 py-1 sm:grid-cols-3 sm:gap-3 md:px-4">
              <dt class="flex items-center text-sm font-sans font-medium text-gray-500 dark:text-gray-400">
                <NIcon name="i-ph-link" class="w-4 h-4 mr-2 text-gray-400" />
                {{ $t('components.quote_metadata.source') }}
              </dt>
              <dd class="sm:col-span-2 ml-0 space-y-3 text-base text-size-3.5 font-sans font-500">
                <div v-for="source in quote.sources" :key="source.id" class="min-w-0">
                  <a v-if="source.source_url"
                    :href="source.source_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 break-all text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {{ getSourceLabel(source) }}
                    <NIcon name="i-ph-arrow-square-out" class="h-3.5 w-3.5 shrink-0" />
                    <span class="sr-only">(opens in a new tab)</span>
                  </a>
                  <span v-else>{{ getSourceLabel(source) }}</span>
                  <div v-if="source.source_medium" class="mt-0.5 text-sm font-normal text-gray-600 dark:text-gray-400">
                    {{ getMediumLabel(source.source_medium) }}
                  </div>
                  <div v-if="source.locator_type && source.locator_value" class="mt-0.5 text-sm font-normal text-gray-600 dark:text-gray-400">
                    {{ $t(`components.dialogs.locator_${source.locator_type}`) }}: {{ source.locator_value }}
                  </div>
                  <div v-if="source.translator_name" class="mt-0.5 text-sm font-normal text-gray-600 dark:text-gray-400">
                    {{ $t('components.quote_metadata.translator') }}: {{ source.translator_name }}
                  </div>
                  <div class="mt-1 text-sm font-normal text-gray-600 dark:text-gray-400">
                    {{ $t('components.quote_metadata.source_verification') }}: {{ sourceVerificationLabel(source.verification_status) }}
                  </div>
                </div>
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

const getSourceLabel = (source: QuoteSource) => source.label
  || (source.source_medium ? getMediumLabel(source.source_medium) : undefined)
  || (source.source_type ? (sourceLabels[source.source_type] || source.source_type) : 'Original source')
const getMediumLabel = (medium: QuoteSourceMedium) => String($t(`components.dialogs.source_medium_${medium}`))
const sourceVerificationLabel = (status: QuoteProvenanceStatus) => String($t(`components.quote_metadata.status_${status}`))

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
const provenanceLabel = (status: string) => ({
  manually_verified: 'Manually verified',
  externally_verified: 'Externally verified',
  disputed: 'Disputed',
}[status] || status)
</script>
