<template>
  <AppDialog
    v-model="isOpen"
    title="Enrichment settings"
    :submitting="saving"
    scrollable
    max-width="lg"
    @submit="emit('save', localForm)"
  >
    <p class="text-sm text-gray-400 dark:text-gray-400 mb-6">
      Saved values are stored in KV and override env variables. Cron expressions still require a deploy to change.
    </p>

    <div class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <CheckboxBadge v-model="localForm.scheduleEnabled" label="Enable scheduling task" />
          <p class="ml-9 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('scheduleEnabled') }}</p>
        </div>
        <div>
          <CheckboxBadge v-model="localForm.processEnabled" label="Enable processing task" />
          <p class="ml-9 text-xs text-gray-500 dark:text-gray-400">Source: {{ sourceLabel('processEnabled') }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <NNumberField
            v-model="localForm.scheduleBatchSize"
            :min="1"
            class="bg-white dark:bg-gray-900"
          />

          <div class="ml-1 mt-2 flex gap-2">
            <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">Schedule batch size</NBadge>
            <NTooltip content="Current source">
              <NBadge badge="soft-blue">{{ sourceLabel('scheduleBatchSize') }}</NBadge>
            </NTooltip>
          </div>
        </div>
        <div>
          <NNumberField
            v-model="localForm.processBatchSize"
            :min="1"
            class="bg-white dark:bg-gray-900"
          />
          <div class="ml-1 mt-2 flex gap-2">
            <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">Process batch size</NBadge>
            <NTooltip content="Current source">
              <NBadge badge="soft-blue">{{ sourceLabel('processBatchSize') }}</NBadge>
            </NTooltip>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <NNumberField
            v-model="localForm.authorStaleDays"
            :min="1"
            class="bg-white dark:bg-gray-900"
          />
          <div class="ml-1 mt-2 flex gap-2">
            <NTooltip content="Author stale days">
              <NBadge size="xs" icon="i-tabler-user" badge="soft-gray" rounded="1" class="py-0.5 text-xs">stale days</NBadge>
            </NTooltip>
            <NTooltip content="Current source">
              <NBadge badge="soft-blue">{{ sourceLabel('authorStaleDays') }}</NBadge>
            </NTooltip>
          </div>
        </div>
        <div>
          <NNumberField
            v-model="localForm.referenceStaleDays"
            :min="1"
            class="bg-white dark:bg-gray-900"
          />
          <div class="ml-1 mt-2 flex gap-2">
            <NTooltip content="Reference stale days">
              <NBadge size="xs" icon="i-tabler-book" badge="soft-gray" rounded="1" class="py-0.5 text-xs">stale days</NBadge>
            </NTooltip>
            <NTooltip content="Current source">
              <NBadge badge="soft-blue">{{ sourceLabel('referenceStaleDays') }}</NBadge>
            </NTooltip>
          </div>
        </div>
        <div>
          <NNumberField
            v-model="localForm.reviewGraceDays"
            :min="1"
            class="bg-white dark:bg-gray-900"
          />
          <div class="ml-1 mt-2 flex gap-2">
            <NTooltip content="Review grace days">
              <NBadge size="xs" icon="i-tabler-calendar" badge="soft-gray" rounded="1" class="py-0.5 text-xs">grace days</NBadge>
            </NTooltip>
            <NTooltip content="Current source">
              <NBadge badge="soft-blue">{{ sourceLabel('reviewGraceDays') }}</NBadge>
            </NTooltip>
          </div>
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
            <NNumberField
              v-model="localForm.authorMatchMinScore"
              :min="1"
              :max="100"
              class="bg-white dark:bg-gray-900"
            />

            <div class="mt-2 space-y-2">
              <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">Author min score</NBadge>
              <p class="text-xs text-gray-500 dark:text-gray-400">Raise this to reject more weak author matches.</p>
              <NBadge badge="soft-blue">{{ sourceLabel('authorMatchMinScore') }}</NBadge>
            </div>
          </div>
          <div>
            <NNumberField
              v-model="localForm.referenceMatchMinScore"
              :min="1"
              :max="100"
              class="bg-white dark:bg-gray-900"
            />
            <div class="mt-2 space-y-2">
              <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">Reference min score</NBadge>
              <p class="text-xs text-gray-500 dark:text-gray-400">Raise this to reject ambiguous matches more aggressively.</p>
              <NBadge badge="soft-blue">{{ sourceLabel('referenceMatchMinScore') }}</NBadge>
            </div>
          </div>
          <div>
            <NNumberField
              v-model="localForm.ambiguousMatchGap"
              :min="1"
              class="bg-white dark:bg-gray-900"
            />
            <div class="mt-2 space-y-2">
              <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">Ambiguous score gap</NBadge>
              <p class="text-xs text-gray-500 dark:text-gray-400">If the best score is too close to the next candidate, the preview stays ambiguous.</p>
              <NBadge badge="soft-blue">{{ sourceLabel('ambiguousMatchGap') }}</NBadge>
            </div>
          </div>
        </div>
      </div>

      <p v-if="updatedAt" class="text-xs text-gray-400">
        Last updated {{ formatDate(updatedAt) }}
      </p>
    </div>

    <template #submit>
      <PrimaryButton :loading="loading || saving" @click="emit('save', localForm)" class="px-4">Save settings</PrimaryButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { formatDateTime } from '~/utils/time-formatter'

interface EnrichmentConfigForm {
  scheduleEnabled: boolean
  processEnabled: boolean
  scheduleBatchSize: number
  processBatchSize: number
  authorStaleDays: number
  referenceStaleDays: number
  reviewGraceDays: number
  authorMatchMinScore: number
  referenceMatchMinScore: number
  ambiguousMatchGap: number
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
  scheduleBatchSize: 25,
  processBatchSize: 3,
  authorStaleDays: 180,
  referenceStaleDays: 365,
  reviewGraceDays: 14,
  authorMatchMinScore: 60,
  referenceMatchMinScore: 58,
  ambiguousMatchGap: 5,
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
