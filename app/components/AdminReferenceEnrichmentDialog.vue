<template>
  <NDialog
    :open="open"
    :_dialog-content="{
      class: 'w-full sm:max-w-3xl',
    }"
    @update:open="emit('update:open', $event)"
  >
    <template #header>
      <div>
        <div class="flex items-center gap-3">
          <NTooltip content="Refresh preview">
            <NButton
              v-if="reference"
              icon
              size="xs"
              btn="solid-gray"
              label="i-ph-magic-wand"
              :loading="loading"
              @click="emit('refresh')"
            />
          </NTooltip>
          <h3 class="text-lg font-semibold">
            {{ preview?.reference_name || reference?.name || 'Reference' }}<span class="font-300"> → Reference enrichment preview</span>
          </h3>
        </div>
        <span class="text-sm text-gray-500 dark:text-gray-400">
          Review the proposed changes before applying them to the reference record.
        </span>
      </div>
    </template>

    <div>
      <div v-if="loading" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        Building enrichment preview from Wikidata and linked metadata...
      </div>

      <div v-else-if="!preview" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        No preview data available.
      </div>

      <div v-else class="space-y-4">
        <div class="rounded-lg border border-gray-200 dark:border-gray-900 p-4 bg-gray-50/60 dark:bg-gray-900/20">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p v-if="preview.match" class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Match: <b>{{ preview.match.label }}</b>
                <span class="text-gray-400 dark:text-gray-500">•</span>
                score <b>{{ preview.match.score }}</b>
              </p>
              <p v-if="preview.match?.description" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ preview.match.description }}
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <NBadge badge="soft-blue" size="sm">{{ preview.summary.proposed_count }} proposals</NBadge>
              <NBadge badge="soft-green" size="sm">{{ preview.summary.recommended_count }} recommended</NBadge>
              <NBadge :badge="preview.review_required ? 'soft-orange' : 'soft-gray'" size="sm">
                {{ preview.review_required ? 'Review required' : 'Safe to apply' }}
              </NBadge>
            </div>
          </div>

          <div v-if="preview.notes?.length" class="mt-3 space-y-1">
            <p
              v-for="note in preview.notes"
              :key="note"
              class="text-xs text-gray-500 dark:text-gray-400"
            >
              {{ note }}
            </p>
          </div>
        </div>

        <div v-if="preview.proposals.length === 0" class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
          No field update is currently recommended for this reference.
        </div>

        <div v-else class="space-y-3 max-h-[55vh] overflow-auto pr-1">
          <div
            v-for="proposal in preview.proposals"
            :key="proposal.field"
            class="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-3 min-w-0">
                <NCheckbox
                  checkbox="gray"
                  :model-value="selectedFields.includes(proposal.field)"
                  @update:model-value="emit('toggle-field', proposal.field, $event)"
                />
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <h5 class="text-sm font-medium text-gray-900 dark:text-white">{{ proposal.label }}</h5>
                    <NBadge :badge="proposal.recommended ? 'soft-green' : 'soft-gray'" size="xs">
                      {{ proposal.recommended ? 'Recommended' : 'Optional' }}
                    </NBadge>
                    <NBadge :badge="proposal.overwrite ? 'soft-orange' : 'soft-blue'" size="xs">
                      {{ proposal.overwrite ? 'Overwrite' : 'Fill missing' }}
                    </NBadge>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Confidence {{ proposal.confidence }} · {{ proposal.rationale }}
                  </p>
                </div>
              </div>

              <div class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {{ proposal.source_labels.join(' / ') }}
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div class="rounded-md bg-gray-50 dark:bg-gray-900/40 p-3">
                <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Current</p>
                <pre class="text-xs text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">{{ proposal.current_value || 'Empty' }}</pre>
              </div>
              <div class="rounded-md bg-blue-50/70 dark:bg-blue-950/20 p-3 border border-dashed border-blue-200 dark:border-blue-800/60">
                <p class="text-xs uppercase tracking-wide text-blue-600 dark:text-blue-300 mb-2">Proposed</p>
                <pre class="text-xs text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words">{{ proposal.proposed_value || 'Empty' }}</pre>
              </div>
            </div>

            <div v-if="proposal.source_urls?.length" class="mt-3 flex flex-wrap gap-2">
              <a
                v-for="url in proposal.source_urls"
                :key="url"
                :href="url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200 underline"
              >
                {{ url }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ selectedFields.length }} field{{ selectedFields.length !== 1 ? 's' : '' }} selected
        </div>
        <div class="flex gap-3">
          <NButton btn="link-gray" @click="emit('update:open', false)">Close</NButton>
          <NButton
            btn="ghost-gray"
            :disabled="!preview?.proposals?.length"
            @click="emit('select-recommended')"
          >
            Select recommended
          </NButton>
          <NButton
            btn="soft-blue"
            :loading="applying"
            :disabled="selectedFields.length === 0 || !jobId"
            @click="emit('apply')"
          >
            Apply selected
          </NButton>
        </div>
      </div>
    </template>
  </NDialog>
</template>

<script setup lang="ts">
interface Props {
  open: boolean
  loading: boolean
  applying: boolean
  reference?: QuoteReference | null
  preview?: any | null
  jobId?: number | null
  selectedFields: string[]
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'refresh'): void
  (e: 'toggle-field', field: string, value: boolean | 'indeterminate'): void
  (e: 'select-recommended'): void
  (e: 'apply'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>