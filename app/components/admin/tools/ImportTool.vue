<template>
  <div ref="importToolRoot" class="space-y-6" @click.capture="handleTabClick">
    <TabsRoot v-model="activeTab" class="flex flex-col gap-5" @update:model-value="scheduleLayout">
      <TabsList class="grid w-full grid-cols-2 gap-3 md:grid-cols-4">
        <TabsTrigger
          value="import"
          class="overflowing-tab-trigger"
          :aria-label="String($t('tab_import'))"
          :class="[
            'h-auto w-full min-w-0 flex-nowrap justify-start overflow-hidden whitespace-nowrap border-b-2 px-0 pb-2 pt-0 text-left font-sans text-sm transition-colors focus-visible:outline-none focus-visible:ring-0 focus-visible:border-b-gray-900 dark:focus-visible:border-b-gray-100',
            activeTab === 'import'
              ? 'border-gray-900 font-600 text-gray-900 dark:border-gray-100 dark:text-gray-100'
              : 'border-gray-200 text-gray-500 hover:text-gray-800 dark:border-neutral-700 dark:text-gray-400 dark:hover:text-gray-200',
          ]"
        >
          <OverflowingTabLabel number="01" :label="String($t('tab_import'))" />
        </TabsTrigger>
        <TabsTrigger
          value="progress"
          class="overflowing-tab-trigger"
          :aria-label="String($t('tab_progress'))"
          :class="[
            'h-auto w-full min-w-0 flex-nowrap justify-start overflow-hidden whitespace-nowrap border-b-2 px-0 pb-2 pt-0 text-left font-sans text-sm transition-colors focus-visible:outline-none focus-visible:ring-0 focus-visible:border-b-gray-900 dark:focus-visible:border-b-gray-100',
            activeTab === 'progress'
              ? 'border-gray-900 font-600 text-gray-900 dark:border-gray-100 dark:text-gray-100'
              : 'border-gray-200 text-gray-500 hover:text-gray-800 dark:border-neutral-700 dark:text-gray-400 dark:hover:text-gray-200',
          ]"
        >
          <OverflowingTabLabel number="02" :label="String($t('tab_progress'))" />
        </TabsTrigger>
        <TabsTrigger
          value="relink"
          class="overflowing-tab-trigger"
          :aria-label="String($t('tab_relink'))"
          :class="[
            'h-auto w-full min-w-0 flex-nowrap justify-start overflow-hidden whitespace-nowrap border-b-2 px-0 pb-2 pt-0 text-left font-sans text-sm transition-colors focus-visible:outline-none focus-visible:ring-0 focus-visible:border-b-gray-900 dark:focus-visible:border-b-gray-100',
            activeTab === 'relink'
              ? 'border-gray-900 font-600 text-gray-900 dark:border-gray-100 dark:text-gray-100'
              : 'border-gray-200 text-gray-500 hover:text-gray-800 dark:border-neutral-700 dark:text-gray-400 dark:hover:text-gray-200',
          ]"
        >
          <OverflowingTabLabel number="03" :label="String($t('tab_relink'))" />
        </TabsTrigger>
        <TabsTrigger
          value="history"
          class="overflowing-tab-trigger"
          :aria-label="String($t('tab_history'))"
          :class="[
            'h-auto w-full min-w-0 flex-nowrap justify-start overflow-hidden whitespace-nowrap border-b-2 px-0 pb-2 pt-0 text-left font-sans text-sm transition-colors focus-visible:outline-none focus-visible:ring-0 focus-visible:border-b-gray-900 dark:focus-visible:border-b-gray-100',
            activeTab === 'history'
              ? 'border-gray-900 font-600 text-gray-900 dark:border-gray-100 dark:text-gray-100'
              : 'border-gray-200 text-gray-500 hover:text-gray-800 dark:border-neutral-700 dark:text-gray-400 dark:hover:text-gray-200',
          ]"
        >
          <OverflowingTabLabel number="04" :label="String($t('tab_history'))" />
        </TabsTrigger>
      </TabsList>

      <TabsContent value="import" class="outline-none">
        <div class="space-y-6">
          <section aria-labelledby="import-file-heading" class="space-y-5">
            <h2 id="import-file-heading" class="font-serif text-xl text-gray-900 dark:text-gray-100">{{ $t('heading_upload') }}</h2>
            <div class="space-y-6">
                <div class="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.85fr)] lg:items-start">
                  <div class="space-y-5">
                    <div>
                      <label class="mb-2 block text-sm font-medium">{{ $t('label_select_file') }}</label>
                      <input
                        ref="fileInput"
                        type="file"
                        accept=".json,.csv,.xml,.zip"
                        @change="handleFileSelect"
                        class="block w-full min-w-0 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-gray-200 file:px-4 file:py-2 file:font-semibold file:text-gray-800 hover:file:bg-gray-300 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300 dark:file:bg-gray-800 dark:file:text-gray-100 dark:hover:file:bg-gray-700"
                      />
                      <p class="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">{{ $t('hint_formats') }}</p>
                    </div>

                    <div class="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div class="mb-2 flex min-h-5 items-center justify-between gap-2">
                          <label class="text-sm font-medium">{{ $t('label_data_format') }}</label>
                          <NBadge v-if="detectedFormat && selectedFormat?.value === detectedFormat?.value" color="blue" badge="soft" size="xs">{{ $t('badge_auto') }}</NBadge>
                          <NTooltip v-else-if="detectedFormat" :text="$t('tooltip_reset_format', { format: detectedFormat.label })">
                            <OutlinedButton size="sm" class="rounded-lg" @click="resetFormatToDetected" :aria-label="$t('aria_reset_format') as string">
                              <NIcon name="i-ph-arrow-counter-clockwise" />
                            </OutlinedButton>
                          </NTooltip>
                        </div>
                        <NCombobox
                          v-model="selectedFormat"
                          :items="formatOptions"
                          by="value"
                          :_combobox-input="{ placeholder: String($t('placeholder_search_format')), class: 'text-sm' }"
                          :_combobox-list="{ class: 'min-w-[220px]' }"
                          :_combobox-trigger="{ btn: 'outline-gray', size: 'md', trailing: 'i-lucide-chevron-down', ariaLabel: String($t('label_data_format')), class: 'min-h-10 w-full justify-between rounded-lg font-sans text-sm' }"
                        >
                          <template #trigger="{ modelValue }"><span class="truncate">{{ modelValue?.label }}</span></template>
                        </NCombobox>
                        <p v-if="selectedFormat?.value === 'zip'" class="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">{{ $t('hint_zip') }}</p>
                      </div>

                      <div v-if="selectedFormat?.value !== 'zip'">
                        <div class="mb-2 flex min-h-5 items-center justify-between gap-2">
                          <label class="text-sm font-medium">{{ $t('label_data_type') }}</label>
                          <NBadge v-if="detectedDataType && selectedDataType?.value === detectedDataType?.value" color="blue" badge="soft" size="xs">{{ $t('badge_auto') }}</NBadge>
                          <NTooltip v-else-if="detectedDataType" :text="$t('tooltip_reset_format', { format: detectedDataType.label })">
                            <OutlinedButton size="sm" class="rounded-lg" @click="resetTypeToDetected" :aria-label="$t('aria_reset_type') as string">
                              <NIcon name="i-ph-arrow-counter-clockwise" />
                            </OutlinedButton>
                          </NTooltip>
                        </div>
                        <NCombobox
                          v-model="selectedDataType"
                          :items="dataTypeOptions"
                          by="value"
                          :_combobox-input="{ placeholder: String($t('placeholder_search_data_type')), class: 'text-sm' }"
                          :_combobox-list="{ class: 'min-w-[220px]' }"
                          :_combobox-trigger="{ btn: 'outline-gray', size: 'md', trailing: 'i-lucide-chevron-down', ariaLabel: String($t('label_data_type')), class: 'min-h-10 w-full justify-between rounded-lg font-sans text-sm' }"
                        >
                          <template #trigger="{ modelValue }"><span class="truncate">{{ modelValue?.label }}</span></template>
                        </NCombobox>
                      </div>
                    </div>
                  </div>

                  <fieldset class="space-y-4 rounded-lg border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-950/40">
                    <legend class="px-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{{ $t('heading_options') }}</legend>
                    <div class="space-y-3">
                      <label class="flex items-start gap-3 rounded-md p-2 transition hover:bg-gray-100/80 dark:hover:bg-gray-800/60">
                        <input type="checkbox" v-model="importOptions.createBackup" class="mt-0.5 accent-gray-700 dark:accent-gray-300" />
                        <span class="min-w-0">
                          <span class="block text-sm font-medium">{{ $t('checkbox_backup') }}</span>
                          <span class="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">{{ $t('hint_backup') }}</span>
                        </span>
                      </label>
                      <label class="flex items-start gap-3 rounded-md p-2 transition hover:bg-gray-100/80 dark:hover:bg-gray-800/60">
                        <input type="checkbox" v-model="importOptions.ignoreValidationErrors" class="mt-0.5 accent-gray-700 dark:accent-gray-300" />
                        <span class="min-w-0">
                          <span class="block text-sm font-medium">{{ $t('checkbox_ignore_validation') }}</span>
                          <span class="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">{{ $t('hint_ignore_validation') }}</span>
                        </span>
                      </label>
                      <label class="flex items-start gap-3 rounded-md p-2 transition hover:bg-gray-100/80 dark:hover:bg-gray-800/60">
                        <input type="checkbox" v-model="importOptions.preserveIds" class="mt-0.5 accent-gray-700 dark:accent-gray-300" />
                        <span class="min-w-0">
                          <span class="block text-sm font-medium">{{ $t('checkbox_preserve_ids') }}</span>
                          <span class="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">{{ $t('hint_preserve_ids') }}</span>
                        </span>
                      </label>
                    </div>
                    <div class="border-t border-gray-200 pt-4 dark:border-gray-700">
                      <label class="mb-2 block text-sm font-medium">{{ $t('label_batch_size') }}</label>
                      <NNumberField v-model="importOptions.batchSize" :min="1" :max="1000" />
                      <p class="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">{{ $t('hint_batch_size') }}</p>
                    </div>
                  </fieldset>
                </div>

                <div class="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end dark:border-gray-700">
                  <NButton btn="solid-black" class="min-h-10 rounded-lg px-4" :disabled="!selectedFile || !selectedFormat" :loading="isValidating" @click="validateData">{{ $t('button_validate') }}</NButton>
                  <NButton v-if="validationResult" btn="solid-black" class="min-h-10 rounded-lg px-4" :disabled="!validationResult.isValid && !importOptions.ignoreValidationErrors" :loading="isImporting" @click="startImport">{{ $t('button_start') }}</NButton>
                </div>

                <div v-if="validationResult" class="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-950/50 sm:p-5">
                  <div class="flex items-center gap-2 mb-4">
                    <NIcon :name="validationResult.isValid ? 'i-ph-check-circle' : 'i-ph-x-circle'" :class="validationResult.isValid ? 'text-green-500' : 'text-red-500'" />
                    <h3 class="text-lg font-semibold">{{ validationResult.isValid ? $t('status_passed') : $t('status_failed') }}</h3>
                  </div>
                  <div class="space-y-4">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div class="text-2xl font-bold">{{ previewData.length }}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">{{ $t('stat_total') }}</div>
                      </div>
                      <div class="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div class="text-2xl font-bold text-red-600">{{ validationResult.errorCount }}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">{{ $t('stat_errors') }}</div>
                      </div>
                      <div class="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div class="text-2xl font-bold text-yellow-600">{{ validationResult.warningCount }}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">{{ $t('stat_warnings') }}</div>
                      </div>
                      <div class="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div class="text-2xl font-bold text-green-600">{{ previewData.length - validationResult.errorCount }}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">{{ $t('stat_valid') }}</div>
                      </div>
                    </div>

                    <div v-if="validationResult.errors.length > 0">
                      <h4 class="font-medium text-red-600 mb-2">{{ $t('heading_validation_errors') }}</h4>
                      <div class="max-h-40 overflow-y-auto space-y-1">
                        <div v-for="(error, index) in validationResult.errors.slice(0, 10)" :key="index" class="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">{{ error }}</div>
                        <div v-if="validationResult.errors.length > 10" class="text-sm text-gray-500">{{ $t('label_more_errors', { n: validationResult.errors.length - 10 }) }}</div>
                      </div>
                    </div>

                    <div v-if="validationResult.warnings.length > 0">
                      <h4 class="font-medium text-yellow-600 mb-2">{{ $t('heading_validation_warnings') }}</h4>
                      <div class="max-h-40 overflow-y-auto space-y-1">
                        <div v-for="(warning, index) in validationResult.warnings.slice(0, 5)" :key="index" class="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">{{ warning }}</div>
                        <div v-if="validationResult.warnings.length > 5" class="text-sm text-gray-500">{{ $t('label_more_warnings', { n: validationResult.warnings.length - 5 }) }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <DataPreviewTable :data="previewData" :type="selectedDataType?.value || 'references'" :max-rows="5" />
            </div>
          </section>
        </div>
      </TabsContent>

      <TabsContent value="progress" class="outline-none">
        <section aria-labelledby="import-progress-heading" class="space-y-4">
          <h2 id="import-progress-heading" class="font-serif text-xl text-gray-900 dark:text-gray-100">{{ $t('heading_progress_1') }}</h2>
          <ImportProgress
            v-if="currentImportId"
            :import-id="currentImportId"
            @finished="currentImportId = null"
            @not-found="currentImportId = null"
          />
          <p v-else class="rounded-lg border border-gray-200 px-4 py-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">{{ $t('empty_progress') }}</p>
        </section>
      </TabsContent>

      <TabsContent value="relink" class="outline-none">
        <section aria-labelledby="relink-heading" class="space-y-5">
          <div>
            <h2 id="relink-heading" class="font-serif text-xl text-gray-900 dark:text-gray-100">{{ $t('heading_progress_2') }}</h2>
            <p class="mt-2 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-400">
              {{ $t('desc_relink') }}
            </p>
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium">{{ $t('label_relink_bundle') }}</label>
            <input
              ref="relinkFileInput"
              type="file"
              accept=".json,.zip"
              @change="handleRelinkFileSelect"
              class="block w-full min-w-0 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-gray-200 file:px-4 file:py-2 file:font-semibold file:text-gray-800 hover:file:bg-gray-300 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300 dark:file:bg-gray-800 dark:file:text-gray-100 dark:hover:file:bg-gray-700"
            />
            <p class="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">{{ $t('hint_relink') }}</p>
            <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{{ $t('hint_relink_tip') }}</p>
          </div>

          <div v-if="relinkFormat === 'json' && Object.keys(relinkPreviewCounts).length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div v-for="(count, key) in relinkPreviewCounts" :key="key" class="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div class="truncate text-xs text-gray-500">{{ key }}</div>
              <div class="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">{{ count }}</div>
            </div>
          </div>

          <div class="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end dark:border-gray-700">
            <NButton btn="solid-black" class="min-h-10 rounded-lg px-4" :disabled="!selectedRelinkFile" :loading="isRelinking" @click="startRelink">
              {{ $t('button_start_relink') }}
            </NButton>
          </div>
        </section>
      </TabsContent>

      <TabsContent value="history" class="outline-none">
        <ImportHistory />
      </TabsContent>
    </TabsRoot>
  </div>
</template>

<script setup lang="ts">
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { useLocalStorage, useMutationObserver, useResizeObserver } from '@vueuse/core'
import OverflowingTabLabel from '~/components/OverflowingTabLabel.vue'
import ImportProgress from '~/components/admin/import/ImportProgress.vue'
import ImportHistory from '~/components/admin/import/ImportHistory.vue'
import DataPreviewTable from '~/components/admin/DataPreviewTable.vue'
import { useErrorToast } from '~/composables/useErrorToast'
import { guessDataTypeFromContent, guessDataTypeFromName, guessFormatFromContent, parseCSV, parseXML } from '~/utils/admin-import-file-format'

const $t = useI18n().$_t({ ...useRoute(), path: '/admin/import', name: 'admin-import' } as ReturnType<typeof useRoute>)
const { showErrorToast } = useErrorToast()
const importToolRoot = ref<HTMLElement | null>(null)
const activeTab = useLocalStorage<'import' | 'progress' | 'relink' | 'history'>(
  'verbatims-admin-import-active-tab',
  'import'
)
type ImportTab = typeof activeTab.value

const getActiveTab = (): ImportTab | null => {
  const panel = importToolRoot.value?.querySelector<HTMLElement>('[role="tabpanel"][data-state="active"]')
  const tab = panel?.getAttribute('aria-labelledby')?.split('-').at(-1)
  return tab === 'import' || tab === 'progress' || tab === 'relink' || tab === 'history' ? tab : null
}
const getLayoutHeight = (tab: ImportTab): number => {
  const root = importToolRoot.value
  const tabList = root?.querySelector<HTMLElement>('[role="tablist"]')
  const panel = root?.querySelector<HTMLElement>(`[role="tabpanel"][aria-labelledby$="trigger-${tab}"]`)
  if (!root || !tabList || !panel || panel.dataset.state !== 'active') return 0
  const contentHeight = root.getBoundingClientRect().height
  return contentHeight > 0 ? Math.ceil(contentHeight) : 0
}
let layoutRequest = 0
let layoutTimer = 0

const reportLayout = (tab: ImportTab | null, request: number, attempt = 0) => {
  if (request !== layoutRequest) return
  if (!tab) return
  const panel = importToolRoot.value?.querySelector<HTMLElement>(`[role="tabpanel"][aria-labelledby$="trigger-${tab}"]`)
  const height = panel?.dataset.state === 'active' ? getLayoutHeight(tab) : 0
  if (height > 0) {
    const dialog = importToolRoot.value?.closest<HTMLElement>('.admin-tools-dialog')
    if (dialog) {
      const dialogHeight = `${height + 48}px`
      const dialogWidthByTab: Record<ImportTab, string> = {
        import: '56rem',
        progress: '44rem',
        relink: '40rem',
        history: '72rem',
      }
      const dialogWidth = dialogWidthByTab[tab]
      if (dialog.style.height !== dialogHeight) dialog.style.height = dialogHeight
      if (dialog.style.maxWidth !== dialogWidth) dialog.style.maxWidth = dialogWidth
    }
    return
  }
  if (import.meta.client && attempt < 30) {
    layoutTimer = window.setTimeout(() => reportLayout(tab, request, attempt + 1), 16)
  }
}
const scheduleLayout = (tab: ImportTab | null = getActiveTab()) => {
  if (!tab || !import.meta.client) return
  layoutRequest += 1
  window.clearTimeout(layoutTimer)
  const request = layoutRequest
  layoutTimer = window.setTimeout(() => reportLayout(tab, request), 80)
}
useMutationObserver(importToolRoot, () => scheduleLayout(), { subtree: true, attributes: true, attributeFilter: ['data-state'] })
useResizeObserver(importToolRoot, () => scheduleLayout())
const handleTabClick = (event: MouseEvent) => {
  const trigger = (event.target as HTMLElement | null)?.closest<HTMLElement>('[role="tab"]')
  if (!trigger) return
  const tab = trigger.id.split('-').at(-1)
  if (tab === 'import' || tab === 'progress' || tab === 'relink' || tab === 'history') {
    scheduleLayout(tab)
  }
}


type SelectOption = { label: string; value: string }

interface ValidationResult {
  isValid: boolean
  errorCount: number
  warningCount: number
  errors: string[]
  warnings: string[]
}

interface ImportOptions {
  createBackup: boolean
  ignoreValidationErrors: boolean
  batchSize: number
  preserveIds?: boolean
}

const formatOptions: SelectOption[] = [
  { label: String($t('option_json')), value: 'json' },
  { label: String($t('option_csv')), value: 'csv' },
  { label: String($t('option_xml')), value: 'xml' },
  { label: String($t('option_all')), value: 'zip' }
]

const dataTypeOptions: SelectOption[] = [
  { label: String($t('type_references')), value: 'references' },
  { label: String($t('type_authors')), value: 'authors' },
  { label: String($t('type_tags')), value: 'tags' },
  { label: String($t('type_users')), value: 'users' },
  { label: String($t('type_quotes')), value: 'quotes' },
]

const selectedFile = ref<File | null>(null)
const selectedFormatValue = ref('json')
const selectedFormat = computed<SelectOption | null>({
  get: () => formatOptions.find(option => option.value === selectedFormatValue.value) ?? null,
  set: option => { selectedFormatValue.value = option?.value ?? '' }
})
const selectedDataTypeValue = ref('references')
const selectedDataType = computed<SelectOption>({
  get: () => dataTypeOptions.find(option => option.value === selectedDataTypeValue.value) ?? dataTypeOptions[0]!,
  set: option => { selectedDataTypeValue.value = option?.value ?? 'references' }
})
watch(activeTab, tab => scheduleLayout(tab), { flush: 'post' })
// Auto-detected values (for reset-to-detected UX)
const detectedFormat = ref<SelectOption | null>(null)
const detectedDataType = ref<SelectOption | null>(null)
// Track if user manually overrides after detection
const userOverrodeFormat = ref<boolean>(false)
const userOverrodeType = ref<boolean>(false)
// Guards to avoid watchers counting programmatic updates as user overrides
const isSettingFormat = ref<boolean>(false)
const isSettingType = ref<boolean>(false)
const isValidating = ref<boolean>(false)
const isImporting = ref<boolean>(false)
const validationResult = ref<ValidationResult | null>(null)
const previewData = ref<any[]>([])
const originalParsedData = ref<any | null>(null)
const currentImportId = ref<string | null>(null)
// Persist and restore current import id
const IMPORT_LS_KEY = 'verbatims-admin-current-import-id'
onMounted(() => {
  scheduleLayout()
  const saved = localStorage.getItem(IMPORT_LS_KEY)
  if (saved) {
    currentImportId.value = saved
    activeTab.value = 'progress'
  }
})

watch(currentImportId, (id) => {
  if (id) localStorage.setItem(IMPORT_LS_KEY, id)
  else localStorage.removeItem(IMPORT_LS_KEY)
})
// Relink state
const relinkFileInput = ref<HTMLInputElement | null>(null)
const selectedRelinkFile = ref<File | null>(null)
const relinkFormat = ref<'json' | 'zip' | null>(null)
const isRelinking = ref<boolean>(false)
const relinkPreviewCounts = ref<Record<string, number>>({})

const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  createBackup: true,
  ignoreValidationErrors: false,
  batchSize: 50,
  preserveIds: false
}

const sanitizeImportOptions = (options: Partial<ImportOptions> | null | undefined): ImportOptions => {
  const createBackup = typeof options?.createBackup === 'boolean'
    ? options.createBackup
    : DEFAULT_IMPORT_OPTIONS.createBackup

  const ignoreValidationErrors = typeof options?.ignoreValidationErrors === 'boolean'
    ? options.ignoreValidationErrors
    : DEFAULT_IMPORT_OPTIONS.ignoreValidationErrors

  const rawBatchSize = Number(options?.batchSize ?? DEFAULT_IMPORT_OPTIONS.batchSize)
  const batchSize = Number.isFinite(rawBatchSize)
    ? Math.min(1000, Math.max(1, Math.round(rawBatchSize)))
    : DEFAULT_IMPORT_OPTIONS.batchSize

  const preserveIds = typeof options?.preserveIds === 'boolean'
    ? options.preserveIds
    : DEFAULT_IMPORT_OPTIONS.preserveIds

  return {
    createBackup,
    ignoreValidationErrors,
    batchSize,
    preserveIds
  }
}

const importOptions = useLocalStorage<ImportOptions>(
  'verbatims-admin-import-options',
  sanitizeImportOptions(DEFAULT_IMPORT_OPTIONS),
  {
    deep: true
  }
)

watch(importOptions, (current) => {
  const sanitized = sanitizeImportOptions(current)
  if (
    sanitized.createBackup !== current?.createBackup ||
    sanitized.ignoreValidationErrors !== current?.ignoreValidationErrors ||
    sanitized.batchSize !== current?.batchSize ||
    sanitized.preserveIds !== current?.preserveIds
  ) {
    importOptions.value = sanitized
  }
}, { deep: true, immediate: true })

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0] ?? null
  if (file) {
    selectedFile.value = file
    validationResult.value = null
    previewData.value = []
    originalParsedData.value = null
    // reset detected/override state on new selection
    detectedFormat.value = null
    detectedDataType.value = null
    userOverrodeFormat.value = false
    userOverrodeType.value = false

    // Auto-detect format by extension first
    const name = file.name.toLowerCase()
    const byExt =
      name.endsWith('.json') ? 'json'
      : name.endsWith('.csv') ? 'csv'
      : name.endsWith('.xml') ? 'xml'
      : name.endsWith('.zip') ? 'zip'
      : null
    if (byExt) {
      const fmtOpt = formatOptions.find(o => o.value === byExt) || null
      detectedFormat.value = fmtOpt
      isSettingFormat.value = true
      selectedFormat.value = fmtOpt
      isSettingFormat.value = false
    }

    // Auto-detect type by filename hints immediately
    const byNameType = guessDataTypeFromName(name, dataTypeOptions)
    if (byNameType) {
      detectedDataType.value = byNameType
      isSettingType.value = true
      selectedDataType.value = byNameType
      isSettingType.value = false
    }

    // Lightweight content sniffing (skip for ZIP). This refines/backs up detection without heavy parsing.
    if (byExt !== 'zip') {
      // Read the first chunk to keep it cheap
      readFileHead(file, 64 * 1024).then((headText) => {
        // If format not set by extension, try to infer from content
        const fmt = guessFormatFromContent(headText)
        if (fmt) {
          const opt = formatOptions.find(o => o.value === fmt) || null
          detectedFormat.value = opt
          if (opt && !userOverrodeFormat.value) {
            isSettingFormat.value = true
            selectedFormat.value = opt
            isSettingFormat.value = false
          }
        }

        // If data type still unknown or came only from name, refine using content
        const fmtVal = selectedFormat.value?.value || byExt || fmt
        const byContentType = guessDataTypeFromContent(headText, fmtVal, dataTypeOptions)
        if (byContentType) {
          detectedDataType.value = byContentType
          if (!userOverrodeType.value) {
            isSettingType.value = true
            selectedDataType.value = byContentType
            isSettingType.value = false
          }
        }
      }).catch(() => { /* ignore sniff errors */ })
    }
  }
}

const handleRelinkFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0] ?? null
  selectedRelinkFile.value = file
  relinkPreviewCounts.value = {}
  relinkFormat.value = null

  if (!file) return
  const name = file.name.toLowerCase()
  if (name.endsWith('.zip')) {
    relinkFormat.value = 'zip'
    return
  }
  if (name.endsWith('.json')) {
    relinkFormat.value = 'json'
    // parse minimal counts preview
    readFileContent(file).then((text) => {
      try {
        const obj = JSON.parse(text) || {}
        const keys = ['quote_tags', 'user_likes', 'user_collections', 'collection_quotes', 'user_sessions', 'user_messages', 'quote_reports', 'quote_views', 'author_views', 'reference_views']
        const counts: Record<string, number> = {}
        for (const k of keys) {
          const arr = Array.isArray(obj[k]) ? obj[k] : []
          if (arr.length) counts[k] = arr.length
        }
        relinkPreviewCounts.value = counts
      } catch (e) {
        relinkPreviewCounts.value = {}
      }
    })
  }
}

const startRelink = async (): Promise<void> => {
  if (!selectedRelinkFile.value) return
  isRelinking.value = true
  try {
    let body: any = { filename: selectedRelinkFile.value.name }
    if (relinkFormat.value === 'zip') {
      const zipBase64 = await readFileAsBase64(selectedRelinkFile.value)
      body.zipBase64 = zipBase64
      body.options = importOptions.value
    } else {
      // JSON: send as bundle directly
      const text = await readFileContent(selectedRelinkFile.value)
      body.bundle = JSON.parse(text)
      body.options = importOptions.value
    }
    const response: any = await $fetch('/api/admin/import/relink', {
      method: 'POST',
      body
    })
    currentImportId.value = response.data?.importId
    activeTab.value = 'progress'
  } catch (error: any) {
    console.error('Relink failed:', error)
    showErrorToast(error, { title: String($t('error_relink_failed')), fallback: 'An error occurred during relink.' })
  } finally {
    isRelinking.value = false
  }
}

const validateData = async (): Promise<void> => {
  if (!selectedFile.value || !selectedFormat.value) return
  isValidating.value = true

  try {
    const fmt = selectedFormat.value?.value
    if (fmt === 'zip') {
      previewData.value = []
      validationResult.value = {
        isValid: true,
        errorCount: 0,
        warningCount: 1,
        errors: [],
        warnings: ['ZIP archive will be processed on the server during import.']
      }
      return
    }

    const fileContent = await readFileContent(selectedFile.value)
    let parsedData: any

    if (fmt === 'csv') { parsedData = parseCSV(fileContent) }
    else if (fmt === 'xml') { parsedData = parseXML(fileContent) }
    else {
      parsedData = JSON.parse(fileContent)
      if (parsedData?.data && Array.isArray(parsedData.data)) parsedData = parsedData.data
      else if (!Array.isArray(parsedData)) parsedData = [parsedData]

      // Auto-detect dataset type for JSON to avoid validating with wrong schema
      const sample = Array.isArray(parsedData) && parsedData.length > 0 ? parsedData[0] : null
      if (sample && typeof sample === 'object') {
        // Heuristics: keys typical to each dataset
        const k = Object.keys(sample)
        const hasQuoteKeys = k.includes('language') || k.includes('status') || k.includes('author_id') || k.includes('reference_id')
        const hasReferenceKeys = k.includes('primary_type') || k.includes('secondary_type') || k.includes('release_date')
        const hasAuthorKeys = k.includes('is_fictional') || k.includes('birth_date') || k.includes('death_date')
        const hasUserKeys = k.includes('email') || k.includes('role')
        const hasTagKeys = k.includes('color') && !k.includes('email') && !k.includes('language')

        const detected = hasQuoteKeys ? { label: 'Quotes', value: 'quotes' as const }
          : hasReferenceKeys ? { label: 'References', value: 'references' as const }
          : hasAuthorKeys ? { label: 'Authors', value: 'authors' as const }
          : hasUserKeys ? { label: 'Users', value: 'users' as const }
          : hasTagKeys ? { label: 'Tags', value: 'tags' as const }
          : null
        if (detected) {
          detectedDataType.value = detected
          if (!userOverrodeType.value) {
            isSettingType.value = true
            selectedDataType.value = detected
            isSettingType.value = false
          }
        }
      }
    }

    previewData.value = parsedData

    // Route validation to proper endpoint
    const type = selectedDataType.value?.value || 'references'
    const validateUrl =
      type === 'users' ? '/api/admin/validate-users'
      : type === 'quotes' ? '/api/admin/validate-quotes'
      : type === 'authors' ? '/api/admin/validate-authors'
      : type === 'tags' ? '/api/admin/validate-tags'
      : '/api/admin/validate-references'

    const response: any = await $fetch(validateUrl, {
      method: 'POST',
      body: { data: parsedData }
    })

    validationResult.value = response.validation as ValidationResult

  } catch (error: any) {
    console.error('Validation failed:', error)

    showErrorToast(error, { title: String($t('error_import_failed')), fallback: 'An error occurred during import.' })
  } finally {
    isValidating.value = false
  }
}

const startImport = async (): Promise<void> => {
  if (!previewData.value.length && selectedFormat.value?.value !== 'zip') return
  isImporting.value = true

  try {
    const fmt = selectedFormat.value?.value || 'json'

    if (fmt === 'zip') {
      const zipBase64 = await readFileAsBase64(selectedFile.value)
      const response: any = await $fetch('/api/admin/import/all', {
        method: 'POST',
        body: {
          zipBase64,
          options: importOptions.value,
          filename: selectedFile.value?.name || null,
        }
      })
      currentImportId.value = response.data?.importId
    } else {
      const type = selectedDataType.value?.value || 'references'
      const importUrl = `/api/admin/import/${type}`
      const response: any = await $fetch(importUrl, {
        method: 'POST',
        body: {
          data: previewData.value,
          format: fmt,
          options: importOptions.value,
          filename: selectedFile.value?.name || null,
        }
      })
      currentImportId.value = response.data?.importId
    }

    activeTab.value = 'progress'
  } catch (error: any) {
    console.error('Import failed:', error)
    showErrorToast(error, { title: String($t('error_import_failed')), fallback: 'An error occurred during import.' })
  } finally {
    isImporting.value = false
  }
}

const readFileContent = (file: File | null): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('')
    const reader = new FileReader()
    reader.onload = (e) => {
      const target = e && e.target ? (e.target as FileReader) : null
      resolve(target && target.result ? String(target.result) : '')
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

// Read only the first N bytes for quick sniffing
const readFileHead = (file: File, maxBytes = 65536): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const blob = file.slice(0, Math.min(maxBytes, file.size))
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
      reader.onerror = reject
      reader.readAsText(blob)
    } catch (e) {
      resolve('')
    }
  })
}

const readFileAsBase64 = (file: File | null): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('')
    const reader = new FileReader()
    reader.onload = () => {
      const res = reader.result || ''
      const str = typeof res === 'string' ? res : ''
      // result is data:*;base64,.... Strip prefix for server
      const comma = str.indexOf(',')
      resolve(comma >= 0 ? str.slice(comma + 1) : str)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ---------- UX helpers: detect/reset/watch overrides ----------
const resetFormatToDetected = () => {
  if (!detectedFormat.value) return
  isSettingFormat.value = true
  selectedFormat.value = detectedFormat.value
  isSettingFormat.value = false
  userOverrodeFormat.value = false
}

const resetTypeToDetected = () => {
  if (!detectedDataType.value) return
  isSettingType.value = true
  selectedDataType.value = detectedDataType.value as SelectOption
  isSettingType.value = false
  userOverrodeType.value = false
}

watch(selectedFormat, (val) => {
  if (isSettingFormat.value) return
  if (val && detectedFormat.value && val.value !== detectedFormat.value.value) {
    userOverrodeFormat.value = true
  }
})

watch(selectedDataType, (val) => {
  if (isSettingType.value) return
  if (val && detectedDataType.value && val.value !== detectedDataType.value.value) {
    userOverrodeType.value = true
  }
})

</script>
