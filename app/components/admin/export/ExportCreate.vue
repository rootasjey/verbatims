<template>
  <div class="export-create pt-6">
    <div class="space-y-7">
      <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <!-- Export -->
        <section class="min-w-0 rounded-xl border border-gray-200 bg-white/60 p-4 dark:border-gray-700 dark:bg-gray-900/30 sm:p-5">
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
        </section>

        <!-- Preview Export -->
        <section class="min-w-0 rounded-xl border border-gray-200 bg-white/60 p-4 dark:border-gray-700 dark:bg-gray-900/30 sm:p-5">
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
            <div class="rounded-xl border border-gray-200 bg-gray-50/70 p-3 dark:border-gray-700 dark:bg-gray-950/50 sm:p-4">
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
        </section>
      </div>

      <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <!-- Export Configuration -->
        <section class="min-w-0 rounded-xl border border-gray-200 bg-white/60 p-4 dark:border-gray-700 dark:bg-gray-900/30 sm:p-5">
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
                  class="flex min-w-0 flex-col items-start gap-1 overflow-hidden rounded-lg border p-3 text-left transition-colors active:scale-99 disabled:cursor-not-allowed disabled:opacity-40 sm:p-4"
                  :class="dataExport.exportOptions.value.data_type.value === dataType.value
                    ? 'border-gray-400 bg-gray-100 text-gray-900 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-100'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-800/60'"
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
                    class="w-full max-w-sm cursor-pointer rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 shadow-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-300/60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:focus:border-gray-500 dark:focus:ring-gray-700/60"
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
                  class="w-full max-w-sm rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 shadow-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-300/60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:focus:border-gray-500 dark:focus:ring-gray-700/60"
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
        </section>

        <!-- Filters -->
        <section class="min-w-0 rounded-xl border border-gray-200 bg-white/60 p-4 dark:border-gray-700 dark:bg-gray-900/30 sm:p-5">
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
                <div v-if="dataExport.isAllSelected.value" class="rounded-lg border border-gray-200 bg-gray-50/70 p-3 font-sans text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-950/50 dark:text-gray-400">
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
        </section>
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

<style scoped>
.export-create :deep(input:not([type="checkbox"]):not([type="file"])),
.export-create :deep(select) {
  border-style: solid;
  border-width: 1px;
  border-radius: 0.625rem;
  background-color: #f9fafb;
}

.export-create :deep(input:not([type="checkbox"]):not([type="file"]):focus),
.export-create :deep(select:focus) {
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 2px rgb(209 213 219 / 0.65);
}

:global(.dark) .export-create :deep(input:not([type="checkbox"]):not([type="file"])),
:global(.dark) .export-create :deep(select) {
  background-color: #030712;
}

:global(.dark) .export-create :deep(input:not([type="checkbox"]):not([type="file"]):focus),
:global(.dark) .export-create :deep(select:focus) {
  box-shadow: 0 0 0 2px rgb(75 85 99 / 0.65);
}
</style>
