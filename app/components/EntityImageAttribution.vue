<template>
  <div v-if="hasAttribution || reportable || $slots.actions" class="mt-2 flex flex-col items-start gap-y-1">
    <p v-if="hasAttribution" class="min-w-0 font-sans text-xs leading-relaxed text-gray-500 dark:text-gray-400">
      <template v-if="creditStatus">
        <span v-if="creditStatus === 'unknown'">{{ $t('image_attribution.credit_unknown') }}</span>
        <template v-else>
          <span>{{ $t(`image_attribution.credit_${creditStatus}`) }} </span>
          <a v-if="sourceUrl" :href="sourceUrl" target="_blank" rel="noopener noreferrer" class="underline decoration-gray-300 underline-offset-2 hover:text-gray-800 dark:decoration-gray-600 dark:hover:text-gray-100">
            {{ credit || $t('image_attribution.source_link') }}
          </a>
          <span v-else-if="credit">{{ credit }}</span>
        </template>
      </template>
      <template v-else>
        <a v-if="sourceUrl" :href="sourceUrl" target="_blank" rel="noopener noreferrer" class="underline decoration-gray-300 underline-offset-2 hover:text-gray-800 dark:decoration-gray-600 dark:hover:text-gray-100">
          {{ credit || $t('image_attribution.source_link') }}
        </a>
        <span v-else-if="credit">{{ credit }}</span>
      </template>
      <span v-if="licenseStatus === 'undocumented'">{{ hasCreditContent ? ' · ' : '' }}{{ $t('image_attribution.license_undocumented') }}<template v-if="license">: {{ license }}</template></span>
      <span v-else-if="licenseStatus === 'territory_limited'">{{ hasCreditContent ? ' · ' : '' }}{{ $t('image_attribution.license_territory_limited') }}<template v-if="license">: {{ license }}</template></span>
      <span v-else-if="licenseStatus === 'documented'">{{ hasCreditContent ? ' · ' : '' }}{{ license || $t('image_attribution.license_documented') }}</span>
      <span v-else-if="!licenseStatus && license">{{ hasCreditContent ? ' · ' : '' }}{{ license }}</span>
      <span v-if="date">{{ hasCreditContent || hasLicenseContent ? ' · ' : '' }}{{ date }}</span>
      <span v-if="location">{{ hasCreditContent || hasLicenseContent || date ? ' · ' : '' }}{{ location }}</span>
    </p>
    <div v-if="reportable || $slots.actions" class="inline-flex items-center gap-2">
      <button
        v-if="reportable"
        type="button"
        class="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-gray-100/80 px-3 font-sans text-xs font-600 text-gray-700 transition-colors hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-gray-100"
        @click="$emit('report')"
      >
        <NIcon name="i-tabler-flag-3" class="h-3.5 w-3.5" aria-hidden="true" />
        {{ reportLabel }}
      </button>
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  credit?: string | null
  creditStatus?: 'creator_known' | 'source_known' | 'unknown' | null
  sourceUrl?: string | null
  license?: string | null
  licenseStatus?: 'documented' | 'undocumented' | 'territory_limited' | null
  date?: string | null
  location?: string | null
  reportable?: boolean
  reportLabel?: string
}>(), {
  reportable: false,
  reportLabel: ''
})

const { $t } = useI18n()

defineEmits<{
  (event: 'report'): void
}>()

const hasCreditContent = computed(() => !!(props.creditStatus || props.credit || props.sourceUrl))
const hasLicenseContent = computed(() => !!(props.licenseStatus || props.license))
const hasAttribution = computed(() => !!(hasCreditContent.value || hasLicenseContent.value || props.date || props.location))
</script>
