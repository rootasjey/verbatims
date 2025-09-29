<template>
  <div class="mb-8 space-y-6">
    <UTabs v-model="activeTab" :items="tabs" class="w-full">
      <template #content="{ item }">
        <div v-if="item.value === 'import'" class="mt-6 space-y-6">
          <UCollapsible v-model:open="openUpload" title="Upload Data File" :ui="{ base: 'border border-dashed rounded-xl' }">
            <div class="flex items-center justify-between px-4 space-x-4">
              <h2 class="text-xl font-semibold">1 • Upload Data File</h2>
              <UCollapsibleTrigger as-child>
                <UButton btn="ghost-gray" square>
                  <UIcon name="i-radix-icons-caret-sort" />
                </UButton>
              </UCollapsibleTrigger>
            </div>

            <UCollapsibleContent>
              <div class="space-y-6 p-4">
                <UCard>
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
                      <label class="block text-sm font-medium mb-2">Data Format</label>
                      <div>
                        <USelect
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
                      <label class="block text-sm font-medium mb-2">Data Type</label>
                      <div>
                        <USelect
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
                      <UCheckbox v-model="importOptions.createBackup" label="Create backup before import" help="Recommended for production imports" />
                      <UCheckbox v-model="importOptions.ignoreValidationErrors" label="Ignore validation errors" help="Import data even if validation fails (not recommended)" />
                      <div>
                        <label class="block text-sm font-medium mb-1">Batch Size</label>
                        <UInput v-model.number="importOptions.batchSize" type="number" min="1" max="1000" placeholder="50" />
                        <p class="mt-1 text-xs text-gray-500">Number of records to process at once (1-1000)</p>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex gap-3 pt-4">
                      <UButton :disabled="!selectedFile || !selectedFormat" :loading="isValidating" btn="soft-blue" @click="validateData">Validate Data</UButton>
                      <UButton v-if="validationResult" :disabled="!validationResult.isValid && !importOptions.ignoreValidationErrors" :loading="isImporting" btn="soft-green" @click="startImport">Start Import</UButton>
                    </div>
                  </div>
                </UCard>

                <UCard v-if="validationResult">
                  <template #header>
                    <div class="flex items-center gap-2">
                      <UIcon :name="validationResult.isValid ? 'i-ph-check-circle' : 'i-ph-x-circle'" :class="validationResult.isValid ? 'text-green-500' : 'text-red-500'" />
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
                </UCard>

                <DataPreviewTable :data="previewData" :type="selectedDataType?.value || 'references'" :max-rows="5" />
              </div>
            </UCollapsibleContent>
          </UCollapsible>

          <!-- Import Progress -->
          <UCollapsible v-model:open="openProgress" title="Import Progress" :ui="{ base: 'border border-dashed rounded-xl' }">
            <div class="flex items-center justify-between px-4 space-x-4">
              <h2 class="text-xl font-semibold">2 • Import Progress</h2>
              <UCollapsibleTrigger as-child>
                <UButton btn="ghost-gray" square>
                  <UIcon name="i-radix-icons-caret-sort" />
                </UButton>
              </UCollapsibleTrigger>
            </div>
            <UCollapsibleContent>
              <div class="p-4">
                <ImportProgress v-if="currentImportId" :import-id="currentImportId" />
                <div v-else class="text-center py-12 text-gray-500">No active import. Start an import from the Upload section.</div>
              </div>
            </UCollapsibleContent>
          </UCollapsible>

          <!-- Relink Relations -->
          <UCollapsible v-model:open="openRelink" title="Relink Relations" :ui="{ base: 'border border-dashed rounded-xl' }">
            <div class="flex items-center justify-between px-4 space-x-4">
              <h2 class="text-xl font-semibold">3 • Relink Post-Quote Relations</h2>
              <UCollapsibleTrigger as-child>
                <UButton btn="ghost-gray" square>
                  <UIcon name="i-radix-icons-caret-sort" />
                </UButton>
              </UCollapsibleTrigger>
            </div>
            <UCollapsibleContent>
              <div class="space-y-6 p-4">
                <UCard>
                  <template #header>
                    <div class="flex items-center gap-2">
                      <UIcon name="i-ph-link-simple" />
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
                      <UButton :disabled="!selectedRelinkFile" :loading="isRelinking" btn="soft-indigo" @click="startRelink">
                        Start Relink
                      </UButton>
                    </div>

                    <p class="mt-2 text-xs text-gray-500">
                      Tip: If collection/quote IDs are missing, include <code>collection_name</code> and/or <code>quote_name</code> (and optional <code>language</code> or <code>user_id</code>) to resolve links.
                    </p>
                  </div>
                </UCard>
              </div>
            </UCollapsibleContent>
          </UCollapsible>
        </div>

        <div v-else-if="item.value === 'history'">
          <div class="p-4">
            <ImportHistory />
          </div>
        </div>
      </template>
    </UTabs>
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
}

const selectedFile = ref<File | null>(null)
const selectedFormat = ref<SelectOption | null>(null)
const selectedDataType = ref<SelectOption>({ label: 'References', value: 'references' })
const isValidating = ref<boolean>(false)
const isImporting = ref<boolean>(false)
const validationResult = ref<ValidationResult | null>(null)
const previewData = ref<any[]>([])
const originalParsedData = ref<any | null>(null)
const currentImportId = ref<string | null>(null)
const openUpload = ref<boolean>(true)
const openProgress = ref<boolean>(false)
const openHistory = ref<boolean>(false)
const openRelink = ref<boolean>(false)

// Relink state
const relinkFileInput = ref<HTMLInputElement | null>(null)
const selectedRelinkFile = ref<File | null>(null)
const relinkFormat = ref<'json' | 'zip' | null>(null)
const isRelinking = ref<boolean>(false)
const relinkPreviewCounts = ref<Record<string, number>>({})

const importOptions = ref<ImportOptions>({
  createBackup: true,
  ignoreValidationErrors: false,
  batchSize: 50
})

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

    // Auto-detect format based on file extension
    const name = file.name.toLowerCase()
    if (name.endsWith('.json')) {
      selectedFormat.value = formatOptions.find(o => o.value === 'json') || null
    } else if (name.endsWith('.csv')) {
      selectedFormat.value = formatOptions.find(o => o.value === 'csv') || null
    } else if (name.endsWith('.xml')) {
      selectedFormat.value = formatOptions.find(o => o.value === 'xml') || null
    } else if (name.endsWith('.zip')) {
      selectedFormat.value = formatOptions.find(o => o.value === 'zip') || null
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
    } else {
      // JSON: send as bundle directly
      const text = await readFileContent(selectedRelinkFile.value)
      body.bundle = JSON.parse(text)
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

        if (hasQuoteKeys) selectedDataType.value = { label: 'Quotes', value: 'quotes' }
        else if (hasReferenceKeys) selectedDataType.value = { label: 'References', value: 'references' }
        else if (hasAuthorKeys) selectedDataType.value = { label: 'Authors', value: 'authors' }
        else if (hasUserKeys) selectedDataType.value = { label: 'Users', value: 'users' }
        else if (hasTagKeys) selectedDataType.value = { label: 'Tags', value: 'tags' }
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

</script>
