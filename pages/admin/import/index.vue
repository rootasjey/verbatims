<template>
  <div class="mb-8 space-y-6">
    <NTabs v-model="activeTab" :items="tabs" class="w-full">
      <template #content="{ item }">
        <div v-if="item.value === 'import'" class="mt-6 space-y-6">
          <NCollapsible v-model:open="openUpload" title="Upload Data File" :ui="{ base: 'border border-dashed rounded-xl' }">
            <div class="flex items-center justify-between px-4 space-x-4">
              <h2 class="text-xl font-semibold">1 • Upload Data File</h2>
              <NCollapsibleTrigger as-child>
                <NButton btn="ghost-gray" square>
                  <NIcon name="i-radix-icons-caret-sort" />
                </NButton>
              </NCollapsibleTrigger>
            </div>

            <NCollapsibleContent>
              <div class="space-y-6 p-4">
                <NCard>
                  <template #header>
                    <h2 class="text-xl font-semibold">Upload Data File</h2>
                  </template>

                  <div class="space-y-4">
                    <!-- File Upload -->
                    <div>
                      <label class="block text-sm font-medium mb-2">Select File</label>
                      <input
                        ref="fileInput"
                        type="file"
                        accept=".json,.csv,.xml,.zip"
                        @change="handleFileSelect"
                        class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      />
                      <p class="mt-1 text-sm text-gray-500">
                        Supported formats: JSON (.json), CSV (.csv), XML (.xml), All (ZIP .zip)
                      </p>
                    </div>

                    <!-- Format Selection -->
                    <div>
                      <div class="flex items-center justify-between gap-2 mb-2">
                        <label class="block text-sm font-medium">Data Format</label>
                        <div class="flex items-center gap-2">
                          <NBadge
                            v-if="detectedFormat && selectedFormat?.value === detectedFormat?.value"
                            color="blue"
                            variant="subtle"
                            size="xs"
                          >Auto-detected</NBadge>
                          <div v-if="detectedFormat && selectedFormat?.value !== detectedFormat?.value">
                            <NTooltip :text="`Reset to detected (${detectedFormat.label})`">
                              <NButton btn="ghost-gray" square size="xs" @click="resetFormatToDetected" aria-label="Reset format to detected">
                                <NIcon name="i-ph-arrow-counter-clockwise" />
                              </NButton>
                            </NTooltip>
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <NSelect
                          v-model="selectedFormat"
                          :items="formatOptions"
                          placeholder="Select data format"
                          item-key="label"
                          value-key="value"
                        />
                      </div>
                      <p v-if="selectedFormat?.value === 'zip'" class="mt-2 text-xs text-gray-500">
                        Dependency order for ALL imports: users → authors → references → tags → quotes
                      </p>
                    </div>

                    <!-- Data Type (for non-ZIP imports) -->
                    <div v-if="selectedFormat?.value !== 'zip'">
                      <div class="flex items-center justify-between gap-2 mb-2">
                        <label class="block text-sm font-medium">Data Type</label>
                        <div class="flex items-center gap-2">
                          <NBadge
                            v-if="detectedDataType && selectedDataType?.value === detectedDataType?.value"
                            color="blue"
                            variant="subtle"
                            size="xs"
                          >Auto-detected</NBadge>
                          <div v-if="detectedDataType && selectedDataType?.value !== detectedDataType?.value">
                            <NTooltip :text="`Reset to detected (${detectedDataType.label})`">
                              <NButton btn="ghost-gray" square size="xs" @click="resetTypeToDetected" aria-label="Reset data type to detected">
                                <NIcon name="i-ph-arrow-counter-clockwise" />
                              </NButton>
                            </NTooltip>
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <NSelect
                          v-model="selectedDataType"
                          :items="dataTypeOptions"
                          placeholder="Select data type"
                          item-key="label"
                          value-key="label"
                        />
                      </div>
                    </div>

                    <!-- Import Options -->
                    <div class="space-y-3">
                      <h3 class="text-sm font-medium">Import Options</h3>
                      <NCheckbox v-model="importOptions.createBackup" label="Create backup before import" help="Recommended for production imports" />
                      <NCheckbox v-model="importOptions.ignoreValidationErrors" label="Ignore validation errors" help="Import data even if validation fails (not recommended)" />
                      <NCheckbox v-model="importOptions.preserveIds" label="Preserve explicit IDs when present" help="Insert records using provided id fields and realign sequences. Use with caution." />
                      <div>
                        <label class="block text-sm font-medium mb-1">Batch Size</label>
                        <NInput v-model.number="importOptions.batchSize" type="number" min="1" max="1000" placeholder="50" />
                        <p class="mt-1 text-xs text-gray-500">Number of records to process at once (1-1000)</p>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex gap-3 pt-4">
                      <NButton :disabled="!selectedFile || !selectedFormat" :loading="isValidating" btn="soft-blue" @click="validateData">Validate Data</NButton>
                      <NButton v-if="validationResult" :disabled="!validationResult.isValid && !importOptions.ignoreValidationErrors" :loading="isImporting" btn="soft-green" @click="startImport">Start Import</NButton>
                    </div>
                  </div>
                </NCard>

                <NCard v-if="validationResult">
                  <template #header>
                    <div class="flex items-center gap-2">
                      <NIcon :name="validationResult.isValid ? 'i-ph-check-circle' : 'i-ph-x-circle'" :class="validationResult.isValid ? 'text-green-500' : 'text-red-500'" />
                      <h3 class="text-lg font-semibold">Validation {{ validationResult.isValid ? 'Passed' : 'Failed' }}</h3>
                    </div>
                  </template>
                  <div class="space-y-4">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div class="text-2xl font-bold">{{ previewData.length }}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Total Records</div>
                      </div>
                      <div class="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div class="text-2xl font-bold text-red-600">{{ validationResult.errorCount }}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Errors</div>
                      </div>
                      <div class="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div class="text-2xl font-bold text-yellow-600">{{ validationResult.warningCount }}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Warnings</div>
                      </div>
                      <div class="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div class="text-2xl font-bold text-green-600">{{ previewData.length - validationResult.errorCount }}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Valid Records</div>
                      </div>
                    </div>

                    <div v-if="validationResult.errors.length > 0">
                      <h4 class="font-medium text-red-600 mb-2">Validation Errors</h4>
                      <div class="max-h-40 overflow-y-auto space-y-1">
                        <div v-for="(error, index) in validationResult.errors.slice(0, 10)" :key="index" class="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">{{ error }}</div>
                        <div v-if="validationResult.errors.length > 10" class="text-sm text-gray-500">... and {{ validationResult.errors.length - 10 }} more errors</div>
                      </div>
                    </div>

                    <div v-if="validationResult.warnings.length > 0">
                      <h4 class="font-medium text-yellow-600 mb-2">Validation Warnings</h4>
                      <div class="max-h-40 overflow-y-auto space-y-1">
                        <div v-for="(warning, index) in validationResult.warnings.slice(0, 5)" :key="index" class="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">{{ warning }}</div>
                        <div v-if="validationResult.warnings.length > 5" class="text-sm text-gray-500">... and {{ validationResult.warnings.length - 5 }} more warnings</div>
                      </div>
                    </div>
                  </div>
                </NCard>

                <DataPreviewTable :data="previewData" :type="selectedDataType?.value || 'references'" :max-rows="5" />
              </div>
            </NCollapsibleContent>
          </NCollapsible>

          <!-- Import Progress -->
          <NCollapsible v-model:open="openProgress" title="Import Progress" :ui="{ base: 'border border-dashed rounded-xl' }">
            <div class="flex items-center justify-between px-4 space-x-4">
              <h2 class="text-xl font-semibold">2 • Import Progress</h2>
              <NCollapsibleTrigger as-child>
                <NButton btn="ghost-gray" square>
                  <NIcon name="i-radix-icons-caret-sort" />
                </NButton>
              </NCollapsibleTrigger>
            </div>
            <NCollapsibleContent>
              <div class="p-4">
                <ImportProgress
                  v-if="currentImportId"
                  :import-id="currentImportId"
                  @finished="() => { currentImportId = null; openProgress = false }"
                  @not-found="() => { currentImportId = null; openProgress = false }"
                />
                <div v-else class="text-center py-12 text-gray-500 dark:text-gray-400">No active import. Start an import from the Upload section.</div>
              </div>
            </NCollapsibleContent>
          </NCollapsible>

          <!-- Relink Relations -->
          <NCollapsible v-model:open="openRelink" title="Relink Relations" :ui="{ base: 'border border-dashed rounded-xl' }">
            <div class="flex items-center justify-between px-4 space-x-4">
              <h2 class="text-xl font-semibold">3 • Relink Post-Quote Relations</h2>
              <NCollapsibleTrigger as-child>
                <NButton btn="ghost-gray" square>
                  <NIcon name="i-radix-icons-caret-sort" />
                </NButton>
              </NCollapsibleTrigger>
            </div>
            <NCollapsibleContent>
              <div class="space-y-6 p-4">
                <NCard>
                  <template #header>
                    <div class="flex items-center gap-2">
                      <NIcon name="i-ph-link-simple" />
                      <h2 class="text-xl font-semibold">Relink Post-Quote Relations</h2>
                    </div>
                  </template>

                  <div class="space-y-4">
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      Use this to re-import relation datasets after a quotes import. Supported keys: 
                      <span class="font-medium">quote_tags</span>, <span class="font-medium">user_likes</span>, 
                      <span class="font-medium">user_collections</span>, <span class="font-medium">collection_quotes</span>,
                      <span class="font-medium">user_sessions</span>, <span class="font-medium">user_messages</span>,
                      <span class="font-medium">quote_reports</span>, <span class="font-medium">quote_views</span>,
                      <span class="font-medium">author_views</span>, <span class="font-medium">reference_views</span>.
                    </p>

                    <!-- Relink File Upload -->
                    <div>
                      <label class="block text-sm font-medium mb-2">Select Relink Bundle (JSON or ZIP)</label>
                      <input
                        ref="relinkFileInput"
                        type="file"
                        accept=".json,.zip"
                        @change="handleRelinkFileSelect"
                        class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      />
                      <p class="mt-1 text-xs text-gray-500">
                        JSON: object with arrays under supported keys. ZIP: server will parse counts.
                      </p>
                    </div>

                    <!-- Preview (JSON only) -->
                    <div v-if="relinkFormat === 'json' && Object.keys(relinkPreviewCounts).length" class="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div v-for="(count, key) in relinkPreviewCounts" :key="key" class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div class="text-xs uppercase tracking-wide text-gray-500">{{ key }}</div>
                        <div class="text-xl font-bold">{{ count }}</div>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex gap-3 pt-2">
                      <NButton :disabled="!selectedRelinkFile" :loading="isRelinking" btn="soft-indigo" @click="startRelink">
                        Start Relink
                      </NButton>
                    </div>

                    <p class="mt-2 text-xs text-gray-500">
                      Tip: If collection/quote IDs are missing, include <code>collection_name</code> and/or <code>quote_name</code> (and optional <code>language</code> or <code>user_id</code>) to resolve links.
                    </p>
                  </div>
                </NCard>
              </div>
            </NCollapsibleContent>
          </NCollapsible>
        </div>

        <div v-else-if="item.value === 'history'">
          <div class="p-4">
            <ImportHistory />
          </div>
        </div>
      </template>
    </NTabs>
  </div>
</template><template #header>
                    <h2 class="text-xl font-semibold">Upload Data File</h2>
                  </template>

                  <div class="space-y-4">
                    <!-- File Upload -->
                    <div>
                      <label class="block text-sm font-medium mb-2">Select File</label>
                      <input
                        ref="fileInput"
                        type="file"
                        accept=".json,.csv,.xml,.zip"
                        @change="handleFileSelect"
                        class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      />
                      <p class="mt-1 text-sm text-gray-500">
                        Supported formats: JSON (.json), CSV (.csv), XML (.xml), All (ZIP .zip)
                      </p>
                    </div>

                    <!-- Format Selection -->
                    <div>
                      <div class="flex items-center justify-between gap-2 mb-2">
                        <label class="block text-sm font-medium">Data Format</label>
                        <div class="flex items-center gap-2">
                          <NBadge
                            v-if="detectedFormat && selectedFormat?.value === detectedFormat?.value"
                            color="blue"
                            variant="subtle"
                            size="xs"
                          >Auto-detected</NBadge>
                          <div v-if="detectedFormat && selectedFormat?.value !== detectedFormat?.value">
                            <NTooltip :text="`Reset to detected (${detectedFormat.label})`">
                              <NButton btn="ghost-gray" square size="xs" @click="resetFormatToDetected" aria-label="Reset format to detected">
                                <NIcon name="i-ph-arrow-counter-clockwise" />
                              </NButton>
                            </NTooltip>
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <NSelect
                          v-model="selectedFormat"
                          :items="formatOptions"
                          placeholder="Select data format"
                          item-key="label"
                          value-key="value"
                        />
                      </div>
                      <p v-if="selectedFormat?.value === 'zip'" class="mt-2 text-xs text-gray-500">
                        Dependency order for ALL imports: users → authors → references → tags → quotes
                      </p>
                    </div>

                    <!-- Data Type (for non-ZIP imports) -->
                    <div v-if="selectedFormat?.value !== 'zip'">
                      <div class="flex items-center justify-between gap-2 mb-2">
                        <label class="block text-sm font-medium">Data Type</label>
                        <div class="flex items-center gap-2">
                          <NBadge
                            v-if="detectedDataType && selectedDataType?.value === detectedDataType?.value"
                            color="blue"
                            variant="subtle"
                            size="xs"
                          >Auto-detected</NBadge>
                          <div v-if="detectedDataType && selectedDataType?.value !== detectedDataType?.value">
                            <NTooltip :text="`Reset to detected (${detectedDataType.label})`">
                              <NButton btn="ghost-gray" square size="xs" @click="resetTypeToDetected" aria-label="Reset data type to detected">
                                <NIcon name="i-ph-arrow-counter-clockwise" />
                              </NButton>
                            </NTooltip>
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <NSelect
                          v-model="selectedDataType"
                          :items="dataTypeOptions"
                          placeholder="Select data type"
                          item-key="label"
                          value-key="label"
                        />
                      </div>
                    </div>

                    <!-- Import Options -->
                    <div class="space-y-3">
                      <h3 class="text-sm font-medium">Import Options</h3>
                      <NCheckbox v-model="importOptions.createBackup" label="Create backup before import" help="Recommended for production imports" />
                      <NCheckbox v-model="importOptions.ignoreValidationErrors" label="Ignore validation errors" help="Import data even if validation fails (not recommended)" />
                      <NCheckbox v-model="importOptions.preserveIds" label="Preserve explicit IDs when present" help="Insert records using provided id fields and realign sequences. Use with caution." />
                      <div>
                        <label class="block text-sm font-medium mb-1">Batch Size</label>
                        <NInput v-model.number="importOptions.batchSize" type="number" min="1" max="1000" placeholder="50" />
                        <p class="mt-1 text-xs text-gray-500">Number of records to process at once (1-1000)</p>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex gap-3 pt-4">
                      <NButton :disabled="!selectedFile || !selectedFormat" :loading="isValidating" btn="soft-blue" @click="validateData">Validate Data</NButton>
                      <NButton v-if="validationResult" :disabled="!validationResult.isValid && !importOptions.ignoreValidationErrors" :loading="isImporting" btn="soft-green" @click="startImport">Start Import</NButton>
                    </div>
                  </div>
                </NCard>

                <NCard v-if="validationResult">
                  <template #header>
                    <div class="flex items-center gap-2">
                      <NIcon :name="validationResult.isValid ? 'i-ph-check-circle' : 'i-ph-x-circle'" :class="validationResult.isValid ? 'text-green-500' : 'text-red-500'" />
                      <h3 class="text-lg font-semibold">Validation {{ validationResult.isValid ? 'Passed' : 'Failed' }}</h3>
                    </div>
                  </template>
                  <div class="space-y-4">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div class="text-2xl font-bold">{{ previewData.length }}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Total Records</div>
                      </div>
                      <div class="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div class="text-2xl font-bold text-red-600">{{ validationResult.errorCount }}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Errors</div>
                      </div>
                      <div class="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div class="text-2xl font-bold text-yellow-600">{{ validationResult.warningCount }}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Warnings</div>
                      </div>
                      <div class="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div class="text-2xl font-bold text-green-600">{{ previewData.length - validationResult.errorCount }}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">Valid Records</div>
                      </div>
                    </div>

                    <div v-if="validationResult.errors.length > 0">
                      <h4 class="font-medium text-red-600 mb-2">Validation Errors</h4>
                      <div class="max-h-40 overflow-y-auto space-y-1">
                        <div v-for="(error, index) in validationResult.errors.slice(0, 10)" :key="index" class="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">{{ error }}</div>
                        <div v-if="validationResult.errors.length > 10" class="text-sm text-gray-500">... and {{ validationResult.errors.length - 10 }} more errors</div>
                      </div>
                    </div>

                    <div v-if="validationResult.warnings.length > 0">
                      <h4 class="font-medium text-yellow-600 mb-2">Validation Warnings</h4>
                      <div class="max-h-40 overflow-y-auto space-y-1">
                        <div v-for="(warning, index) in validationResult.warnings.slice(0, 5)" :key="index" class="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">{{ warning }}</div>
                        <div v-if="validationResult.warnings.length > 5" class="text-sm text-gray-500">... and {{ validationResult.warnings.length - 5 }} more warnings</div>
                      </div>
                    </div>
                  </div>
                </NCard>

                <DataPreviewTable :data="previewData" :type="selectedDataType?.value || 'references'" :max-rows="5" />
              </div>
            </NCollapsibleContent>
          </NCollapsible>

          <!-- Import Progress -->
          <NCollapsible v-model:open="openProgress" title="Import Progress" :ui="{ base: 'border border-dashed rounded-xl' }">
            <div class="flex items-center justify-between px-4 space-x-4">
              <h2 class="text-xl font-semibold">2 • Import Progress</h2>
              <NCollapsibleTrigger as-child>
                <NButton btn="ghost-gray" square>
                  <NIcon name="i-radix-icons-caret-sort" />
                </NButton>
              </NCollapsibleTrigger>
            </div>
            <NCollapsibleContent>
              <div class="p-4">
                <ImportProgress
                  v-if="currentImportId"
                  :import-id="currentImportId"
                  @finished="() => { currentImportId = null; openProgress = false }"
                  @not-found="() => { currentImportId = null; openProgress = false }"
                />
                <div v-else class="text-center py-12 text-gray-500 dark:text-gray-400">No active import. Start an import from the Upload section.</div>
              </div>
            </NCollapsibleContent>
          </NCollapsible>

          <!-- Relink Relations -->
          <NCollapsible v-model:open="openRelink" title="Relink Relations" :ui="{ base: 'border border-dashed rounded-xl' }">
            <div class="flex items-center justify-between px-4 space-x-4">
              <h2 class="text-xl font-semibold">3 • Relink Post-Quote Relations</h2>
              <NCollapsibleTrigger as-child>
                <NButton btn="ghost-gray" square>
                  <NIcon name="i-radix-icons-caret-sort" />
                </NButton>
              </NCollapsibleTrigger>
            </div>
            <NCollapsibleContent>
              <div class="space-y-6 p-4">
                <NCard>
                  <template #header>
                    <div class="flex items-center gap-2">
                      <NIcon name="i-ph-link-simple" />
                      <h2 class="text-xl font-semibold">Relink Post-Quote Relations</h2>
                    </div>
                  </template>

                  <div class="space-y-4">
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      Use this to re-import relation datasets after a quotes import. Supported keys: 
                      <span class="font-medium">quote_tags</span>, <span class="font-medium">user_likes</span>, 
                      <span class="font-medium">user_collections</span>, <span class="font-medium">collection_quotes</span>,
                      <span class="font-medium">user_sessions</span>, <span class="font-medium">user_messages</span>,
                      <span class="font-medium">quote_reports</span>, <span class="font-medium">quote_views</span>,
                      <span class="font-medium">author_views</span>, <span class="font-medium">reference_views</span>.
                    </p>

                    <!-- Relink File Upload -->
                    <div>
                      <label class="block text-sm font-medium mb-2">Select Relink Bundle (JSON or ZIP)</label>
                      <input
                        ref="relinkFileInput"
                        type="file"
                        accept=".json,.zip"
                        @change="handleRelinkFileSelect"
                        class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      />
                      <p class="mt-1 text-xs text-gray-500">
                        JSON: object with arrays under supported keys. ZIP: server will parse counts.
                      </p>
                    </div>

                    <!-- Preview (JSON only) -->
                    <div v-if="relinkFormat === 'json' && Object.keys(relinkPreviewCounts).length" class="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div v-for="(count, key) in relinkPreviewCounts" :key="key" class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div class="text-xs uppercase tracking-wide text-gray-500">{{ key }}</div>
                        <div class="text-xl font-bold">{{ count }}</div>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex gap-3 pt-2">
                      <NButton :disabled="!selectedRelinkFile" :loading="isRelinking" btn="soft-indigo" @click="startRelink">
                        Start Relink
                      </NButton>
                    </div>

                    <p class="mt-2 text-xs text-gray-500">
                      Tip: If collection/quote IDs are missing, include <code>collection_name</code> and/or <code>quote_name</code> (and optional <code>language</code> or <code>user_id</code>) to resolve links.
                    </p>
                  </div>
                </NCard>
              </div>
            </NCollapsibleContent>
          </NCollapsible>
        </div>

        <div v-else-if="item.value === 'history'">
          <div class="p-4">
            <ImportHistory />
          </div>
        </div>
      </template>
    </NTabs>
  </div>
</template>

<script setup lang="ts">
import ImportProgress from '~/components/admin/import/ImportProgress.vue'
import ImportHistory from '~/components/admin/import/ImportHistory.vue'
import DataPreviewTable from '~/components/admin/DataPreviewTable.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({
  title: 'verbatims • [admin] Data Import'
})

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

const selectedFile = ref<File | null>(null)
const selectedFormat = ref<SelectOption | null>(null)
const selectedDataType = ref<SelectOption>({ label: 'References', value: 'references' })
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
const openUpload = ref<boolean>(true)
const openProgress = ref<boolean>(false)
// Persist and restore current import id
const IMPORT_LS_KEY = 'verbatims-admin-current-import-id'
onMounted(() => {
  const saved = localStorage.getItem(IMPORT_LS_KEY)
  if (saved) {
    currentImportId.value = saved
    openProgress.value = true
  }
})

watch(currentImportId, (id) => {
  if (id) localStorage.setItem(IMPORT_LS_KEY, id)
  else localStorage.removeItem(IMPORT_LS_KEY)
})
const openHistory = ref<boolean>(false)
const openRelink = ref<boolean>(false)

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

const formatOptions: SelectOption[] = [
  { label: 'JSON File', value: 'json' },
  { label: 'CSV File', value: 'csv' },
  { label: 'XML File', value: 'xml' },
  { label: 'All (ZIP)', value: 'zip' }
]

const dataTypeOptions: SelectOption[] = [
  { label: 'References', value: 'references' },
  { label: 'Authors', value: 'authors' },
  { label: 'Tags', value: 'tags' },
  { label: 'Users', value: 'users' },
  { label: 'Quotes', value: 'quotes' },
]

const tabs = [
  { name: 'Import', value: 'import', icon: 'i-ph-upload-simple' },
  { name: 'History', value: 'history', icon: 'i-ph-clock-countdown', class: 'border-l border-gray-200 dark:border-gray-700 ml-2 pl-2' }
]

const activeTab = useLocalStorage<'import' | 'history'>(
  'verbatims-admin-import-active-tab',
  'import'
)

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
    const byNameType = guessDataTypeFromName(name)
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
          if (!selectedFormat.value && opt && !userOverrodeFormat.value) {
            isSettingFormat.value = true
            selectedFormat.value = opt
            isSettingFormat.value = false
          }
        }

        // If data type still unknown or came only from name, refine using content
        const fmtVal = selectedFormat.value?.value || byExt || fmt
        const byContentType = guessDataTypeFromContent(headText, fmtVal)
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
    currentImportId.value = response.importId
    openProgress.value = true
  } catch (error: any) {
    console.error('Relink failed:', error)
    useToast().toast({
      title: 'Relink Failed',
      description: error?.data?.message || 'An error occurred during relink.',
      toast: 'error',
    })
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

    useToast().toast({
      title: 'Import Failed',
      description: error?.data?.message || 'An error occurred during import.',
      toast: 'error',
    })
  } finally {
    isValidating.value = false
  }
}

const startImport = async (): Promise<void> => {
  if (!previewData.value.length) return
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
      currentImportId.value = response.importId
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
      currentImportId.value = response.importId
    }

    // Toggle collapsibles per UX preference
    openUpload.value = false
    openProgress.value = true
  } catch (error: any) {
    console.error('Import failed:', error)
    useToast().toast({
      title: 'Import Failed',
      description: error?.data?.message || 'An error occurred during import.',
      toast: 'error',
    })
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

const parseCSV = (csvContent: string): Record<string, any>[] => {
  // Simple CSV parser - in production, use a proper CSV library
  const lines = csvContent.trim().split('\n')
  if (!lines.length) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))

  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
    const obj: Record<string, any> = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] || null
    })
    return obj
  })
}

const parseXML = (xmlText: string): Record<string, any>[] => {
  try {
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml')
    const hasError = doc.getElementsByTagName('parsererror')[0]
    if (hasError) throw new Error('Invalid XML')
    const refs = Array.from(doc.getElementsByTagName('reference'))
    const nodes = refs.length ? refs : Array.from(doc.documentElement.children)
    return nodes.map((el) => {
      const obj: Record<string, any> = {}
      Array.from(el.children).forEach((c) => { obj[c.tagName] = c.textContent || '' })
      return obj
    })
  } catch (e: any) {
    console.error('XML parse failed:', e)
    return []
  }
}

// ---------- Detection Helpers ----------
const guessDataTypeFromName = (lowerName: string): SelectOption | null => {
  const pairs: Array<{ re: RegExp; type: SelectOption }> = [
    { re: /(\b|[-_])(quote|quotes|qts)(\b|\.|[-_])/i, type: { label: 'Quotes', value: 'quotes' } },
    { re: /(\b|[-_])(author|authors|people|persons)(\b|\.|[-_])/i, type: { label: 'Authors', value: 'authors' } },
    { re: /(\b|[-_])(reference|references|books|films|works)(\b|\.|[-_])/i, type: { label: 'References', value: 'references' } },
    { re: /(\b|[-_])(tag|tags)(\b|\.|[-_])/i, type: { label: 'Tags', value: 'tags' } },
    { re: /(\b|[-_])(user|users|accounts)(\b|\.|[-_])/i, type: { label: 'Users', value: 'users' } },
  ]
  for (const p of pairs) {
    if (p.re.test(lowerName)) return p.type
  }
  return null
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

const guessFormatFromContent = (text: string): 'json' | 'csv' | 'xml' | null => {
  const t = text.trim()
  if (!t) return null
  if (t.startsWith('{') || t.startsWith('[')) return 'json'
  if (/^<\?xml|^<([a-zA-Z_][\w:-]*)(\s|>)/.test(t)) return 'xml'
  // crude CSV check: header, delimiter, newline
  const firstLine = t.split(/\r?\n/)[0] || ''
  if (firstLine.includes(',')) return 'csv'
  return null
}

const selectOptionByValue = (options: SelectOption[], value: string): SelectOption | null => {
  return options.find(o => o.value === value) || null
}

const guessDataTypeFromJSONSample = (sample: any): SelectOption | null => {
  if (!sample || typeof sample !== 'object') return null
  const k = Object.keys(sample)
  const hasQuoteKeys = k.includes('language') || k.includes('status') || k.includes('author_id') || k.includes('reference_id') || k.includes('content')
  const hasReferenceKeys = k.includes('primary_type') || k.includes('secondary_type') || k.includes('release_date') || k.includes('source_url')
  const hasAuthorKeys = k.includes('is_fictional') || k.includes('birth_date') || k.includes('death_date') || k.includes('biography')
  const hasUserKeys = k.includes('email') || k.includes('role') || k.includes('display_name')
  const hasTagKeys = (k.includes('color') || k.includes('slug')) && !k.includes('email') && !k.includes('language')

  if (hasQuoteKeys) return selectOptionByValue(dataTypeOptions, 'quotes')
  if (hasReferenceKeys) return selectOptionByValue(dataTypeOptions, 'references')
  if (hasAuthorKeys) return selectOptionByValue(dataTypeOptions, 'authors')
  if (hasUserKeys) return selectOptionByValue(dataTypeOptions, 'users')
  if (hasTagKeys) return selectOptionByValue(dataTypeOptions, 'tags')
  return null
}

const guessDataTypeFromContent = (text: string, fmt?: string | null): SelectOption | null => {
  const format = fmt || guessFormatFromContent(text)
  if (!format) return null

  if (format === 'json') {
    // Try light regex-based hints first (no full parse required)
    const t = text
    const hintPairs: Array<{ re: RegExp; type: 'quotes'|'authors'|'references'|'tags'|'users' }> = [
      { re: /"(language|status|author_id|reference_id|content)"\s*:/i, type: 'quotes' },
      { re: /"(primary_type|secondary_type|release_date|source_url)"\s*:/i, type: 'references' },
      { re: /"(is_fictional|birth_date|death_date|biography)"\s*:/i, type: 'authors' },
      { re: /"(email|role|display_name)"\s*:/i, type: 'users' },
      { re: /"(color|slug)"\s*:/i, type: 'tags' },
    ]
    for (const h of hintPairs) {
      if (h.re.test(t)) return selectOptionByValue(dataTypeOptions, h.type)
    }

    // As a fallback, if the file is reasonably small, try parsing
    try {
      if (t.length < 2_000_000) {
        const parsed = JSON.parse(text)
        if (Array.isArray(parsed) && parsed.length) return guessDataTypeFromJSONSample(parsed[0])
        if (parsed && typeof parsed === 'object') {
          // If shape is { data: [...] }
          if (Array.isArray((parsed as any).data) && (parsed as any).data.length) return guessDataTypeFromJSONSample((parsed as any).data[0])
          // If shape is { quotes: [...]} etc.
          const keys = ['quotes','authors','references','tags','users']
          for (const k of keys) {
            const arr = (parsed as any)[k]
            if (Array.isArray(arr) && arr.length) return selectOptionByValue(dataTypeOptions, k)
          }
        }
      }
    } catch { /* ignore */ }
    return null
  }

  if (format === 'csv') {
    const firstLine = (text.split(/\r?\n/)[0] || '').toLowerCase()
    const headers = firstLine.split(',').map(h => h.trim())
    const has = (h: string) => headers.includes(h)
    if (has('content') || has('author_id') || has('reference_id') || has('language')) return selectOptionByValue(dataTypeOptions, 'quotes')
    if (has('primary_type') || has('release_date') || has('secondary_type')) return selectOptionByValue(dataTypeOptions, 'references')
    if (has('is_fictional') || has('birth_date') || has('death_date')) return selectOptionByValue(dataTypeOptions, 'authors')
    if (has('email') || has('role')) return selectOptionByValue(dataTypeOptions, 'users')
    if (has('color') || has('slug')) return selectOptionByValue(dataTypeOptions, 'tags')
    return null
  }

  if (format === 'xml') {
    // Try to infer via tag names without full parse
    const t = text.slice(0, 16384)
    if (/<quotes?\b|<quote\b/i.test(t)) return selectOptionByValue(dataTypeOptions, 'quotes')
    if (/<authors?\b|<author\b/i.test(t)) return selectOptionByValue(dataTypeOptions, 'authors')
    if (/<references?\b|<reference\b|<book\b|<film\b/i.test(t)) return selectOptionByValue(dataTypeOptions, 'references')
    if (/<tags?\b|<tag\b/i.test(t)) return selectOptionByValue(dataTypeOptions, 'tags')
    if (/<users?\b|<user\b/i.test(t)) return selectOptionByValue(dataTypeOptions, 'users')
    return null
  }

  return null
}

</script>
