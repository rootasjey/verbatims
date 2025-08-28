<template>
  <div class="pt-6">
    <div class="space-y-7">
      <div class="flex md:grid-cols-2 gap-6">
        <!-- Export -->
        <UCard class="max-w-2xl shadow-none bg-gray-50/50 dark:bg-gray-800/20">
          <template #header>
            <div class="flex items-center gap-3">
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">Export Data</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">Download your export</p>
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <div class="flex flex-col sm:flex-row gap-4">
              <UButton
                btn="solid-black"
                :loading="dataExport.state.isExporting"
                :disabled="!dataExport.exportOptions.value.format.value || dataExport.state.isExporting"
                @click="dataExport.startExport"
                class="flex-1"
              >
                <UIcon name="i-ph-download" />
                {{
                  dataExport.state.isExporting
                    ? 'Exporting...'
                    : (dataExport.exportOptions.value.download_after_export
                        ? 'Generate & Download Export'
                        : 'Generate Export')
                }}
              </UButton>

              <UButton
                btn="ghost"
                :disabled="dataExport.state.isExporting"
                @click="() => dataExport.resetFilters({ clearStorage: true })"
              >
                <UIcon name="i-ph-arrow-clockwise" />
                Reset All
              </UButton>
            </div>

            <div class="flex items-center gap-3">
              <UCheckbox
                v-model="dataExport.exportOptions.value.download_after_export"
                label="Download after export"
              />
            </div>
          </div>
        </UCard>

        <!-- Preview Export -->
        <UCard class="max-w-2xl min-w-md shadow-none bg-gray-50/50 dark:bg-gray-800/20">
          <template #header>
            <div class="flex items-center gap-3">
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">Preview Export</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">Review data before export</p>
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <div class="flex justify-start">
              <UButton
                btn="outline-blue"
                :disabled="dataExport.state.isExporting || !dataExport.exportOptions.value.format.value"
                @click="dataExport.validateExport"
              >
                <UIcon name="i-ph-magnifying-glass" />
                Generate Preview
              </UButton>
            </div>

            <!-- Export Preview Results -->
            <div v-if="dataExport.state.previewData" class="border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div class="text-2xl font-bold text-gray-900 dark:text-white">
                      {{ dataExport.state.previewData.estimated_count?.toLocaleString() || 0 }}
                    </div>
                    <div class="text-gray-600 dark:text-gray-400">Records</div>
                  </div>
                  <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div class="text-2xl font-bold text-gray-900 dark:text-white">
                      {{ dataExport.formatFileSize(dataExport.state.previewData.estimated_size || 0) }}
                    </div>
                    <div class="text-gray-600 dark:text-gray-400">Estimated Size</div>
                  </div>
                  <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div class="text-2xl font-bold text-gray-900 dark:text-white">
                      {{ dataExport.exportOptions.value.format.label }}
                    </div>
                    <div class="text-gray-600 dark:text-gray-400">Format</div>
                  </div>
                </div>

                <div v-if="dataExport.state.previewData.warnings.length > 0" class="space-y-2">
                  <h4 class="font-medium text-yellow-700 dark:text-yellow-300">Warnings:</h4>
                  <ul class="list-disc list-inside text-sm text-yellow-600 dark:text-yellow-400 space-y-1">
                    <li v-for="warning in dataExport.state.previewData.warnings" :key="warning">{{ warning }}</li>
                  </ul>
                </div>

                <div v-if="dataExport.state.previewData.errors.length > 0" class="space-y-2">
                  <h4 class="font-medium text-red-700 dark:text-red-300">Errors:</h4>
                  <ul class="list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1">
                    <li v-for="error in dataExport.state.previewData.errors" :key="error">{{ error }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <div class="flex md:grid-cols-2 gap-6">
        <!-- Export Configuration -->
        <UCard class="max-w-2xl shadow-none bg-gray-50/50 dark:bg-gray-800/20">
          <template #header>
            <div class="flex items-center gap-3">
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">Export Configuration</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">Choose data type and format</p>
              </div>
            </div>
          </template>

          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Data Type
              </label>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <UButton
                  v-for="dataType in dataTypeOptions"
                  :key="dataType.value"
                  :btn="dataExport.exportOptions.value.data_type.value === dataType.value ? 'light:solid-blue dark:solid-green' : 'light:outline-gray dark:outline-green'"
                  :disabled="!dataType.available"
                  class="justify-start p-4 h-auto"
                  @click="dataExport.setDataType({ label: dataType.label, value: dataType.value, available: dataType.available })"
                >
                  <div class="flex flex-col items-start gap-1 min-w-0 overflow-hidden">
                    <div class="flex items-center gap-2">
                      <UIcon :name="dataType.icon" class="w-4 h-4" />
                      <span class="font-medium">{{ dataType.label }}</span>
                    </div>
                    <span class="text-xs opacity-75 w-full truncate">{{ dataType.description }}</span>
                  </div>
                </UButton>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Export Format
                </label>
                <div>
                  <USelect
                    v-model="dataExport.exportOptions.value.format"
                    :items="dataExport.formatOptions"
                    item-key="label"
                    value-key="label"
                    placeholder="Select format"
                  />
                  <p v-if="dataExport.isAllSelected.value" class="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    The result will be a ZIP archive containing one file per data type in the selected format (CSV/JSON/XML).
                  </p>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Record Limit (0 = no limit)
                </label>
                <UInput
                  v-model.number="dataExport.exportOptions.value.limit"
                  type="number"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Include Data
              </label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <UCheckbox
                  v-model="dataExport.exportOptions.value.include_relations"
                  :label="dataExport.getIncludeRelationsLabel()"
                />
                <UCheckbox
                  v-model="dataExport.exportOptions.value.include_user_data"
                  label="Include user information"
                />
                <UCheckbox
                  v-model="dataExport.exportOptions.value.include_moderation_data"
                  label="Include moderation history"
                />
                <UCheckbox
                  v-model="dataExport.exportOptions.value.include_analytics"
                  label="Include analytics (views, likes, shares)"
                />
                <UCheckbox
                  v-model="dataExport.exportOptions.value.include_metadata"
                  label="Include export metadata"
                />
              </div>
            </div>
          </div>
        </UCard>

        <!-- Filters -->
        <UCard class="max-w-2xl min-w-md shadow-none bg-gray-50/50 dark:bg-gray-800/20">
          <template #header>
            <UCollapsible>
              <UCollapsibleTrigger class="w-full border-b b-dashed border-gray-200 dark:border-gray-700 pb-3">
                <div class="flex items-center justify-between w-full p-0">
                  <div class="flex items-center gap-3">
                    <div class="text-left">
                      <h3 class="font-semibold text-gray-900 dark:text-white">Filters</h3>
                      <p class="text-sm text-gray-600 dark:text-gray-400">Optional filtering criteria (click to expand)</p>
                    </div>
                  </div>
                  <UIcon name="i-ph-caret-down" class="w-5 h-5 text-gray-400 transition-transform ui-open:rotate-180" />
                </div>
              </UCollapsibleTrigger>

              <UCollapsibleContent>
                <div class="pt-4 space-y-6">
                  <div v-if="dataExport.isAllSelected.value" class="rounded-md border border-dashed border-gray-200 dark:border-gray-700 p-3 text-sm">
                    Using the last saved filters of each data type (Quotes, Authors, References, Users). To change them, switch to a specific data type and adjust its filters.
                  </div>
                  <!-- Dynamic Filters based on Data Type -->
                  <div v-if="dataExport.exportOptions.value.data_type.value === 'quotes' && !dataExport.isAllSelected.value">
                    <QuotesFilters
                      v-model="dataExport.quotesFilters.value"
                      :status-options="dataExport.statusOptions"
                      :language-options="dataExport.languageOptions"
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
                </div>
              </UCollapsibleContent>
            </UCollapsible>
          </template>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import QuotesFilters from '~/components/admin/export/QuotesFilters.vue'
import ReferencesFilters from '~/components/admin/export/ReferencesFilters.vue'
import AuthorsFilters from '~/components/admin/export/AuthorsFilters.vue'
import UsersFilters from '~/components/admin/export/UsersFilters.vue'
import { useDataExport } from '~/composables/useDataExport'
import type { ExportDataType } from '~/types/export'

const dataExport = useDataExport()

const dataTypeOptions: Array<{ label: string; value: ExportDataType; icon: string; description: string; available: boolean }> = [
  { label: 'Everything', value: 'all', icon: 'i-ph-stack', description: 'Export all together', available: true },
  { label: 'Quotes', value: 'quotes', icon: 'i-ph-quotes', description: 'Export quotes', available: true },
  { label: 'References', value: 'references', icon: 'i-ph-book', description: 'Export references', available: true },
  { label: 'Authors', value: 'authors', icon: 'i-ph-user-circle', description: 'Export authors', available: true },
  { label: 'Users', value: 'users', icon: 'i-ph-users', description: 'Export users', available: true }
]
</script>
