<template>
  <AppDialog
    v-model="isOpen"
    title="Enrichment settings"
    :submitting="saving"
    scrollable
    @submit="emit('save', localForm)"
  >
    <p class="text-sm text-gray-400 dark:text-gray-400 mb-6">
      Saved values are stored in KV and override env variables. Cron expressions still require a deploy to change.
    </p>

    <div class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <CheckboxBadge v-model="localForm.scheduleEnabled" label="Enable scheduling task" />
          <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('scheduleEnabled') }}</p>
        </div>
        <div>
          <CheckboxBadge v-model="localForm.processEnabled" label="Enable processing task" />
          <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('processEnabled') }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <NInput
            v-model="localForm.scheduleBatchSize"
            type="number"
            min="1"
            class="bg-white dark:bg-gray-900 b-none shadow-none"
            :una="{ inputTrailingWrapper: 'pr-1.5' }"
          >
            <template #trailing>
              <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">Schedule batch size</NBadge>
            </template>
          </NInput>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('scheduleBatchSize') }}</p>
        </div>
        <div>
          <NInput
            v-model="localForm.processBatchSize"
            type="number"
            min="1"
            class="bg-white dark:bg-gray-900 b-none shadow-none"
            :una="{ inputTrailingWrapper: 'pr-1.5' }"
          >
            <template #trailing>
              <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">Process batch size</NBadge>
            </template>
          </NInput>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('processBatchSize') }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <NInput
            v-model="localForm.authorStaleDays"
            type="number"
            min="1"
            class="bg-white dark:bg-gray-900 b-none shadow-none"
            :una="{ inputTrailingWrapper: 'pr-1.5' }"
          >
            <template #trailing>
              <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">Author stale days</NBadge>
            </template>
          </NInput>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('authorStaleDays') }}</p>
        </div>
        <div>
          <NInput
            v-model="localForm.referenceStaleDays"
            type="number"
            min="1"
            class="bg-white dark:bg-gray-900 b-none shadow-none"
            :una="{ inputTrailingWrapper: 'pr-1.5' }"
          >
            <template #trailing>
              <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">Reference stale days</NBadge>
            </template>
          </NInput>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('referenceStaleDays') }}</p>
        </div>
        <div>
          <NInput
            v-model="localForm.reviewGraceDays"
            type="number"
            min="1"
            class="bg-white dark:bg-gray-900 b-none shadow-none"
            :una="{ inputTrailingWrapper: 'pr-1.5' }"
          >
            <template #trailing>
              <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">Review grace days</NBadge>
            </template>
          </NInput>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('reviewGraceDays') }}</p>
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
          <div>
            <NInput
              v-model="localForm.authorMatchMinScore"
              type="number"
              min="1"
              max="100"
              class="bg-white dark:bg-gray-900 b-none shadow-none"
              :una="{ inputTrailingWrapper: 'pr-1.5' }"
            >
              <template #trailing>
                <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">Author min score</NBadge>
              </template>
            </NInput>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Raise this to reject more weak author matches.</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('authorMatchMinScore') }}</p>
          </div>
          <div>
            <NInput
              v-model="localForm.referenceMatchMinScore"
              type="number"
              min="1"
              max="100"
              class="bg-white dark:bg-gray-900 b-none shadow-none"
              :una="{ inputTrailingWrapper: 'pr-1.5' }"
            >
              <template #trailing>
                <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">Reference min score</NBadge>
              </template>
            </NInput>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Raise this to reject ambiguous matches more aggressively.</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('referenceMatchMinScore') }}</p>
          </div>
          <div>
            <NInput
              v-model="localForm.ambiguousMatchGap"
              type="number"
              min="1"
              class="bg-white dark:bg-gray-900 b-none shadow-none"
              :una="{ inputTrailingWrapper: 'pr-1.5' }"
            >
              <template #trailing>
                <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">Ambiguous score gap</NBadge>
              </template>
            </NInput>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">If the best score is too close to the next candidate, the preview stays ambiguous.</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('ambiguousMatchGap') }}</p>
          </div>
        </div>
      </div>

      <p v-if="updatedAt" class="text-xs text-gray-400">
        Last updated {{ formatDate(updatedAt) }}
      </p>
    </div>

    <template #submit>
      <NButton btn="soft-blue" :loading="loading || saving" @click="emit('save', localForm)">Save settings</NButton>
    </template>
  </AppDialog>
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
