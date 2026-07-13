<template>
  <div class="pt-6">
    <div class="space-y-7">
      <div class="flex md:grid-cols-2 gap-6">
        <!-- Export -->
        <div class="max-w-2xl border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center gap-3 mb-4">
            <div>
              <h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">{{ $ts('export_create.title') }}</h3>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ $ts('export_create.description') }}</p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex flex-col sm:flex-row gap-4">
              <OutlinedButton
                :disabled="!dataExport.exportOptions.value.format.value || dataExport.state.isExporting"
                :loading="dataExport.state.isExporting"
                class="flex-1"
                @click="dataExport.startExport"
              >
                <NIcon :name="dataExport.exportOptions.value.download_after_export ? 'i-ph-download' : 'i-ph-export-duotone'" />
                {{
                  dataExport.state.isExporting
                    ? $ts('export_create.exporting')
                    : (dataExport.exportOptions.value.download_after_export
                        ? $ts('export_create.generate_download_export')
                        : $ts('export_create.generate_export'))
                }}
              </OutlinedButton>

              <button
                class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                :disabled="dataExport.state.isExporting"
                @click="() => dataExport.resetFilters({ clearStorage: true })"
              >
                <NIcon name="i-ph-arrow-clockwise" />
                {{ $ts('export_create.reset_all') }}
              </button>
            </div>

            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="dataExport.exportOptions.value.download_after_export" class="accent-gray-700 dark:accent-gray-300" />
              <span class="font-sans text-sm text-gray-700 dark:text-gray-300">{{ $ts('export_create.download_after_export') }}</span>
            </label>
          </div>
        </div>

        <!-- Preview Export -->
        <div class="max-w-2xl min-w-md border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center gap-3 mb-4">
            <div>
              <h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">{{ $ts('export_create.preview_title') }}</h3>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ $ts('export_create.preview_desc') }}</p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex justify-start">
              <OutlinedButton
                :disabled="dataExport.state.isExporting || !dataExport.exportOptions.value.format.value"
                @click="dataExport.validateExport"
              >
                <NIcon name="i-ph-magnifying-glass" />
                {{ $ts('export_create.generate_preview') }}
              </OutlinedButton>
            </div>

            <!-- Export Preview Results -->
            <div class="border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div class="text-2xl font-bold text-gray-900 dark:text-white">
                      {{ dataExport.state.previewData?.estimated_count?.toLocaleString() || 0 }}
                    </div>
                    <div class="text-gray-600 dark:text-gray-400">{{ $ts('export_create.records') }}</div>
                  </div>
                  <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div class="text-2xl font-bold text-gray-900 dark:text-white">
                      {{ dataExport.formatFileSize(dataExport.state.previewData?.estimated_size || 0) }}
                    </div>
                    <div class="text-gray-600 dark:text-gray-400">{{ $ts('export_create.estimated_size') }}</div>
                  </div>
                  <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div class="text-2xl font-bold text-gray-900 dark:text-white">
                      {{ dataExport.exportOptions.value.format.label }}
                    </div>
                    <div class="text-gray-600 dark:text-gray-400">{{ $ts('export_create.format') }}</div>
                  </div>
                </div>

                <div v-if="(dataExport.state.previewData?.warnings.length ?? 0) > 0" class="space-y-2">
                  <h4 class="font-medium text-yellow-700 dark:text-yellow-300">{{ $ts('export_create.warnings') }}</h4>
                  <ul class="list-disc list-inside text-sm text-yellow-600 dark:text-yellow-400 space-y-1">
                    <li v-for="warning in dataExport.state.previewData?.warnings" :key="warning">{{ warning }}</li>
                  </ul>
                </div>

                <div v-if="(dataExport.state.previewData?.errors.length ?? 0) > 0" class="space-y-2">
                  <h4 class="font-medium text-red-700 dark:text-red-300">{{ $ts('export_create.errors') }}</h4>
                  <ul class="list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1">
                    <li v-for="error in dataExport.state.previewData?.errors" :key="error">{{ error }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex md:grid-cols-2 gap-6">
        <!-- Export Configuration -->
        <div class="max-w-2xl border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center gap-3 mb-4">
            <div>
              <h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">{{ $ts('export_create.config_title') }}</h3>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ $ts('export_create.config_desc') }}</p>
            </div>
          </div>

          <div class="space-y-6">
            <div>
              <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-3">
                {{ $ts('export_create.data_type') }}
              </label>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  v-for="dataType in dataTypeOptions"
                  :key="dataType.value"
                  :disabled="!dataType.available"
                  class="flex flex-col items-start gap-1 min-w-0 overflow-hidden p-4 text-left border border-dashed active:scale-99 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  :class="dataExport.exportOptions.value.data_type.value === dataType.value
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
                  @click="dataExport.setDataType({ label: dataType.label, value: dataType.value, available: dataType.available })"
                >
                  <div class="flex items-center gap-2">
                    <NIcon :name="dataType.icon" class="w-4 h-4" />
                    <span class="font-medium">{{ dataType.label }}</span>
                  </div>
                  <span class="text-xs opacity-75 w-full truncate">{{ dataType.description }}</span>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
                  {{ $ts('export_create.export_format') }}
                </label>
                <div>
                  <select
                    :value="dataExport.exportOptions.value.format?.label || ''"
                    @change="formatModel = dataExport.formatOptions.find(o => o.label === ($event.target as HTMLSelectElement).value) ?? dataExport.exportOptions.value.format"
                    class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.5 text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    <option value="" disabled>{{ $ts('export_create.select_format') }}</option>
                    <option v-for="opt in dataExport.formatOptions" :key="opt.label" :value="opt.label">{{ opt.label }}</option>
                  </select>
                  <p v-if="dataExport.isAllSelected.value" class="mt-1 font-sans text-xs text-gray-500 dark:text-gray-400">
                    {{ $ts('export_create.zip_hint') }}
                  </p>
                </div>
              </div>

              <div>
                <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
                  {{ $ts('export_create.record_limit') }}
                </label>
                <input
                  v-model.number="dataExport.exportOptions.value.limit"
                  type="number"
                  min="0"
                  placeholder="0"
                  class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 w-24 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-3">
                {{ $ts('export_create.include_data') }}
              </label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="dataExport.exportOptions.value.include_relations" class="accent-gray-700 dark:accent-gray-300" />
                  <span class="font-sans text-sm text-gray-700 dark:text-gray-300">{{ dataExport.getIncludeRelationsLabel() }}</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="dataExport.exportOptions.value.include_user_data" class="accent-gray-700 dark:accent-gray-300" />
                  <span class="font-sans text-sm text-gray-700 dark:text-gray-300">{{ $ts('export_create.include_user_info') }}</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="dataExport.exportOptions.value.include_moderation_data" class="accent-gray-700 dark:accent-gray-300" />
                  <span class="font-sans text-sm text-gray-700 dark:text-gray-300">{{ $ts('export_create.include_moderation') }}</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="dataExport.exportOptions.value.include_analytics" class="accent-gray-700 dark:accent-gray-300" />
                  <span class="font-sans text-sm text-gray-700 dark:text-gray-300">{{ $ts('export_create.include_analytics') }}</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="dataExport.exportOptions.value.include_metadata" class="accent-gray-700 dark:accent-gray-300" />
                  <span class="font-sans text-sm text-gray-700 dark:text-gray-300">{{ $ts('export_create.include_metadata') }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="max-w-2xl min-w-md border border-dashed border-gray-200 dark:border-gray-700 p-4">
          <NCollapsible>
            <NCollapsibleTrigger class="w-full">
              <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-3">
                  <div class="text-left">
                    <h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">{{ $ts('export_create.filters_title') }}</h3>
                    <p class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ $ts('export_create.filters_desc') }}</p>
                  </div>
                </div>
                <NIcon name="i-ph-caret-down" class="w-5 h-5 text-gray-400 transition-transform ui-open:rotate-180" />
              </div>
            </NCollapsibleTrigger>

            <NCollapsibleContent>
              <div class="pt-4 space-y-6">
                <div v-if="dataExport.isAllSelected.value" class="rounded-md border border-dashed border-gray-200 dark:border-gray-700 p-3 font-sans text-xs text-gray-500 dark:text-gray-400">
                  {{ $ts('export_create.filters_saved_hint') }}
                </div>
                <!-- Dynamic Filters based on Data Type -->
                <div v-if="dataExport.exportOptions.value.data_type.value === 'quotes' && !dataExport.isAllSelected.value">
                  <QuotesFilters
                    v-model="dataExport.quotesFilters.value"
                    :status-options="dataExport.statusOptions as any"
                    :language-options="dataExport.languageOptions as any"
                  />
                </div>

                <div v-else-if="dataExport.exportOptions.value.data_type.value === 'references' && !dataExport.isAllSelected.value">
                  <ReferencesFilters
                    v-model="dataExport.referencesFilters.value"
                    :primary-type-options="dataExport.primaryTypeOptions"
                  />
                </div>

                <div v-else-if="dataExport.exportOptions.value.data_type.value === 'authors' && !dataExport.isAllSelected.value">
                  <AuthorsFilters
                    v-model="dataExport.authorsFilters.value"
                  />
                </div>

                <div v-else-if="dataExport.exportOptions.value.data_type.value === 'users' && !dataExport.isAllSelected.value">
                  <UsersFilters
                    v-model="dataExport.usersFilters.value"
                  />
                </div>

                <div v-else-if="dataExport.exportOptions.value.data_type.value === 'tags' && !dataExport.isAllSelected.value">
                  <TagsFilters
                    v-model="dataExport.tagsFilters.value"
                  />
                </div>
              </div>
            </NCollapsibleContent>
          </NCollapsible>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $t, $ts } = useI18n()

import QuotesFilters from '~/components/admin/export/QuotesFilters.vue'
import ReferencesFilters from '~/components/admin/export/ReferencesFilters.vue'
import AuthorsFilters from '~/components/admin/export/AuthorsFilters.vue'
import TagsFilters from '~/components/admin/export/TagsFilters.vue'

import UsersFilters from '~/components/admin/export/UsersFilters.vue'
import { useDataExport } from '~/composables/useDataExport'

import { computed } from 'vue'
import type { ExportFormat } from '~~/shared/types/export'

const dataExport = useDataExport()

// Computed proxy for export format select (maps object or label string to the full format object)
const formatModel = computed({
  get() {
    return dataExport.exportOptions.value.format
  },
  set(option) {
    const opt = (typeof option === 'object') ? option : dataExport.formatOptions.find(o => o.label === option)
    if (opt) dataExport.exportOptions.value.format = opt as { label: string; value: ExportFormat }
  }
})

const dataTypeOptions = computed(() => [
  { label: $ts('export_create.data_type_everything'), value: 'all' as const, icon: 'i-ph-stack', description: $ts('export_create.data_type_everything_desc'), available: true },
  { label: $ts('export_create.data_type_quotes'), value: 'quotes' as const, icon: 'i-ph-quotes', description: $ts('export_create.data_type_quotes_desc'), available: true },
  { label: $ts('export_create.data_type_references'), value: 'references' as const, icon: 'i-ph-book', description: $ts('export_create.data_type_references_desc'), available: true },
  { label: $ts('export_create.data_type_authors'), value: 'authors' as const, icon: 'i-ph-user-circle', description: $ts('export_create.data_type_authors_desc'), available: true },
  { label: $ts('export_create.data_type_users'), value: 'users' as const, icon: 'i-ph-users', description: $ts('export_create.data_type_users_desc'), available: true },
  { label: $ts('export_create.data_type_tags'), value: 'tags' as const, icon: 'i-ph-tag', description: $ts('export_create.data_type_tags_desc'), available: true }
])

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  dataExport.startAutoPreview()
  if (dataExport.exportOptions.value.format?.value) {
    dataExport.triggerPreviewUpdate()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})

// Keyboard shortcut: Ctrl/Cmd + E → Generate export (or Generate & Download based on option)
const onKeydown = (keyEvent: KeyboardEvent) => {
  // Ignore when typing in inputs/textareas or contenteditable elements
  const target = keyEvent.target as HTMLElement | null
  if (target) {
    const tag = target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (target as HTMLElement).isContentEditable) return
  }

  if ((keyEvent.ctrlKey || keyEvent.metaKey) && keyEvent.key.toLowerCase() === 'e') {
    // Mirror the same disabled conditions as the Generate button
    const hasFormat = Boolean(dataExport.exportOptions.value.format?.value)
    if (!dataExport.state.isExporting && hasFormat) {
      keyEvent.preventDefault()
      dataExport.startExport()
    }
  }
}
</script>
