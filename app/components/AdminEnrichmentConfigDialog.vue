<template>
  <NDialog v-model:open="isOpen" scrollable>
    <template #header>
      <div class="p-2 space-y-1">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Enrichment settings
        </h3>
        <p class="text-sm text-gray-400 dark:text-gray-400">
          Saved values are stored in KV and override env variables. Cron expressions still require a deploy to change.
        </p>
      </div>
    </template>

    <div class="p-2 space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
          <NCheckbox v-model="localForm.scheduleEnabled" label="Enable scheduling task" checkbox="blue" />
          <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('scheduleEnabled') }}</p>
        </div>

        <div class="space-y-2">
          <NCheckbox v-model="localForm.processEnabled" label="Enable processing task" checkbox="blue" />
          <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('processEnabled') }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Schedule batch size</label>
          <NInput v-model="localForm.scheduleBatchSize" input="outline-gray" type="number" min="1" />
          <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('scheduleBatchSize') }}</p>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Process batch size</label>
          <NInput v-model="localForm.processBatchSize" input="outline-gray" type="number" min="1" />
          <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('processBatchSize') }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Author stale days</label>
          <NInput v-model="localForm.authorStaleDays" input="outline-gray" type="number" min="1" />
          <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('authorStaleDays') }}</p>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Reference stale days</label>
          <NInput v-model="localForm.referenceStaleDays" input="outline-gray" type="number" min="1" />
          <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('referenceStaleDays') }}</p>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Review grace days</label>
          <NInput v-model="localForm.reviewGraceDays" input="outline-gray" type="number" min="1" />
          <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('reviewGraceDays') }}</p>
        </div>
      </div>

      <div class="rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-4 bg-gray-50/60 dark:bg-gray-900/20">
        <div>
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Matching thresholds</h4>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Saved values tune how strict Wikidata matching should be and when a result becomes ambiguous.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Author min score</label>
            <NInput v-model="localForm.authorMatchMinScore" input="outline-gray" type="number" min="1" max="100" />
            <p class="text-xs text-gray-500 dark:text-gray-400">Raise this to reject more weak author matches. Lower it only if valid people are skipped too often.</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('authorMatchMinScore') }}</p>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Reference min score</label>
            <NInput v-model="localForm.referenceMatchMinScore" input="outline-gray" type="number" min="1" max="100" />
            <p class="text-xs text-gray-500 dark:text-gray-400">Raise this to reject ambiguous title or media matches more aggressively.</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('referenceMatchMinScore') }}</p>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Ambiguous score gap</label>
            <NInput v-model="localForm.ambiguousMatchGap" input="outline-gray" type="number" min="1" />
            <p class="text-xs text-gray-500 dark:text-gray-400">If the best score is too close to the next candidate, the preview stays ambiguous and shows alternatives.</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('ambiguousMatchGap') }}</p>
          </div>
        </div>
      </div>

      <p v-if="updatedAt" class="text-xs text-gray-400">
        Last updated {{ formatDate(updatedAt) }}
      </p>
    </div>

    <template #footer>
      <div class="p-2 flex justify-end gap-2">
        <NButton btn="link-gray" :disabled="saving" @click="isOpen = false">Cancel</NButton>
        <NButton btn="soft-blue" :loading="loading || saving" @click="emit('save', localForm)">Save settings</NButton>
      </div>
    </template>
  </NDialog>
</template>

<script setup lang="ts">
import { formatDateTime } from '~/utils/time-formatter'

interface EnrichmentConfigForm {
  scheduleEnabled: boolean
  processEnabled: boolean
  scheduleBatchSize: string
  processBatchSize: string
  authorStaleDays: string
  referenceStaleDays: string
  reviewGraceDays: string
  authorMatchMinScore: string
  referenceMatchMinScore: string
  ambiguousMatchGap: string
}

interface Props {
  open: boolean
  loading: boolean
  saving: boolean
  updatedAt: string | null
  form: EnrichmentConfigForm
  sources: Record<string, 'kv' | 'env' | 'default' | 'none'>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'save', value: EnrichmentConfigForm): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

const localForm = reactive<EnrichmentConfigForm>({
  scheduleEnabled: true,
  processEnabled: true,
  scheduleBatchSize: '25',
  processBatchSize: '3',
  authorStaleDays: '180',
  referenceStaleDays: '365',
  reviewGraceDays: '14',
  authorMatchMinScore: '60',
  referenceMatchMinScore: '58',
  ambiguousMatchGap: '5',
})

watch(() => props.form, (value) => {
  Object.assign(localForm, value)
}, { immediate: true, deep: true })

function sourceLabel(field: string) {
  return props.sources[field] || 'none'
}

function formatDate(value: string | null) {
  const formatted = formatDateTime(value)
  return formatted === 'N/A' ? 'Unknown' : formatted
}
</script>