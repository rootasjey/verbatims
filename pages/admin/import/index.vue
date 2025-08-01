<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="font-title text-size-12 font-bold text-gray-900 dark:text-white">
        Data Import
      </h1>
      <p class="-mt-4 font-body text-gray-600 dark:text-gray-400">
        Import reference data from Firebase backups, JSON, or CSV files
      </p>
    </div>

    <!-- Import Tabs -->
    <div class="mb-8">
      <UTabs v-model="activeTab" :items="tabs" />
    </div>

    <!-- Upload Section -->
    <div v-if="activeTab === 0" class="space-y-6">
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
              accept=".json,.csv"
              @change="handleFileSelect"
              class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            <p class="mt-1 text-sm text-gray-500">
              Supported formats: JSON (.json), CSV (.csv)
            </p>
          </div>

          <!-- Format Selection -->
          <div>
            <label class="block text-sm font-medium mb-2">Data Format</label>
            <USelect
              v-model="selectedFormat"
              :options="formatOptions"
              placeholder="Select data format"
            />
          </div>

          <!-- Import Options -->
          <div class="space-y-3">
            <h3 class="text-sm font-medium">Import Options</h3>
            
            <UCheckbox
              v-model="importOptions.createBackup"
              label="Create backup before import"
              help="Recommended for production imports"
            />
            
            <UCheckbox
              v-model="importOptions.ignoreValidationErrors"
              label="Ignore validation errors"
              help="Import data even if validation fails (not recommended)"
            />
            
            <div>
              <label class="block text-sm font-medium mb-1">Batch Size</label>
              <UInput
                v-model.number="importOptions.batchSize"
                type="number"
                min="1"
                max="1000"
                placeholder="50"
              />
              <p class="mt-1 text-xs text-gray-500">
                Number of records to process at once (1-1000)
              </p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-4">
            <UButton
              :disabled="!selectedFile || !selectedFormat"
              :loading="isValidating"
              @click="validateData"
            >
              Validate Data
            </UButton>
            
            <UButton
              v-if="validationResult"
              :disabled="!validationResult.isValid && !importOptions.ignoreValidationErrors"
              :loading="isImporting"
              color="green"
              @click="startImport"
            >
              Start Import
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Validation Results -->
      <UCard v-if="validationResult">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              :name="validationResult.isValid ? 'i-ph-check-circle' : 'i-ph-x-circle'"
              :class="validationResult.isValid ? 'text-green-500' : 'text-red-500'"
            />
            <h3 class="text-lg font-semibold">
              Validation {{ validationResult.isValid ? 'Passed' : 'Failed' }}
            </h3>
          </div>
        </template>

        <div class="space-y-4">
          <!-- Summary -->
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
              <div class="text-2xl font-bold text-green-600">
                {{ previewData.length - validationResult.errorCount }}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Valid Records</div>
            </div>
          </div>

          <!-- Errors -->
          <div v-if="validationResult.errors.length > 0">
            <h4 class="font-medium text-red-600 mb-2">Validation Errors</h4>
            <div class="max-h-40 overflow-y-auto space-y-1">
              <div
                v-for="(error, index) in validationResult.errors.slice(0, 10)"
                :key="index"
                class="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded"
              >
                {{ error }}
              </div>
              <div v-if="validationResult.errors.length > 10" class="text-sm text-gray-500">
                ... and {{ validationResult.errors.length - 10 }} more errors
              </div>
            </div>
          </div>

          <!-- Warnings -->
          <div v-if="validationResult.warnings.length > 0">
            <h4 class="font-medium text-yellow-600 mb-2">Validation Warnings</h4>
            <div class="max-h-40 overflow-y-auto space-y-1">
              <div
                v-for="(warning, index) in validationResult.warnings.slice(0, 5)"
                :key="index"
                class="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded"
              >
                {{ warning }}
              </div>
              <div v-if="validationResult.warnings.length > 5" class="text-sm text-gray-500">
                ... and {{ validationResult.warnings.length - 5 }} more warnings
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Data Preview -->
      <UCard v-if="previewData.length > 0">
        <template #header>
          <h3 class="text-lg font-semibold">Data Preview (First 5 Records)</h3>
        </template>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Language</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Release Date</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="(item, index) in previewData.slice(0, 5)" :key="index">
                <td class="px-3 py-2 text-sm">{{ item.name }}</td>
                <td class="px-3 py-2 text-sm">{{ item.primary_type }}</td>
                <td class="px-3 py-2 text-sm">{{ item.original_language }}</td>
                <td class="px-3 py-2 text-sm">{{ item.release_date || '-' }}</td>
                <td class="px-3 py-2 text-sm max-w-xs truncate">{{ item.description || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- Progress Section -->
    <div v-if="activeTab === 1" class="space-y-6">
      <ImportProgressView v-if="currentImportId" :import-id="currentImportId" />
      <div v-else class="text-center py-12 text-gray-500">
        No active import. Start an import from the Upload tab.
      </div>
    </div>

    <!-- History Section -->
    <div v-if="activeTab === 2">
      <ImportHistoryView />
    </div>
  </div>
</template>

<script setup>
// Import components
import ImportProgressView from '~/components/admin/ImportProgressView.vue'
import ImportHistoryView from '~/components/admin/ImportHistoryView.vue'

// SEO and permissions
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({
  title: 'Data Import - Admin'
})

// Data
const activeTab = ref(0)
const selectedFile = ref(null)
const selectedFormat = ref('')
const isValidating = ref(false)
const isImporting = ref(false)
const validationResult = ref(null)
const previewData = ref([])
const currentImportId = ref(null)

const importOptions = ref({
  createBackup: true,
  ignoreValidationErrors: false,
  batchSize: 50
})

const tabs = [
  { label: 'Upload', icon: 'i-ph-upload' },
  { label: 'Progress', icon: 'i-ph-clock' },
  { label: 'History', icon: 'i-ph-list' }
]

const formatOptions = [
  { label: 'Firebase JSON Backup', value: 'firebase' },
  { label: 'Transformed JSON', value: 'json' },
  { label: 'CSV File', value: 'csv' }
]

// Methods
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    validationResult.value = null
    previewData.value = []
    
    // Auto-detect format based on file extension
    if (file.name.endsWith('.json')) {
      selectedFormat.value = 'firebase' // Default to Firebase format
    } else if (file.name.endsWith('.csv')) {
      selectedFormat.value = 'csv'
    }
  }
}

const validateData = async () => {
  if (!selectedFile.value || !selectedFormat.value) return
  
  isValidating.value = true
  
  try {
    const fileContent = await readFileContent(selectedFile.value)
    let parsedData
    
    if (selectedFormat.value === 'csv') {
      parsedData = parseCSV(fileContent)
    } else {
      parsedData = JSON.parse(fileContent)
      
      // Handle different JSON formats
      if (selectedFormat.value === 'firebase' && parsedData.data) {
        // Firebase backup format
        parsedData = Object.values(parsedData.data)
      } else if (selectedFormat.value === 'json' && parsedData.data) {
        // Transformed format
        parsedData = parsedData.data
      }
    }
    
    // Transform data if needed (simplified client-side transformation)
    if (selectedFormat.value === 'firebase') {
      parsedData = transformFirebaseData(parsedData)
    }
    
    previewData.value = parsedData
    
    // Validate data
    const response = await $fetch('/api/admin/validate-references', {
      method: 'POST',
      body: { data: parsedData }
    })
    
    validationResult.value = response.validation
    
  } catch (error) {
    console.error('Validation failed:', error)
    // TODO: Show error toast
  } finally {
    isValidating.value = false
  }
}

const startImport = async () => {
  if (!previewData.value.length) return
  
  isImporting.value = true
  
  try {
    const response = await $fetch('/api/admin/import/references', {
      method: 'POST',
      body: {
        data: previewData.value,
        format: selectedFormat.value,
        options: importOptions.value
      }
    })
    
    currentImportId.value = response.importId
    activeTab.value = 1 // Switch to progress tab
    
    // TODO: Show success toast
    
  } catch (error) {
    console.error('Import failed:', error)
    // TODO: Show error toast
  } finally {
    isImporting.value = false
  }
}

// Utility functions
const readFileContent = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

const parseCSV = (csvContent) => {
  // Simple CSV parser - in production, use a proper CSV library
  const lines = csvContent.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
    const obj = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] || null
    })
    return obj
  })
}

const transformFirebaseData = (firebaseData) => {
  // Simplified client-side transformation
  // In production, this should be done server-side
  return firebaseData.map(item => ({
    name: item.name || '',
    original_language: item.language || 'en',
    primary_type: item.type?.primary || 'other',
    secondary_type: item.type?.secondary || '',
    description: item.summary || '',
    image_url: item.urls?.image || '',
    release_date: item.release?.original?.__time__ ? 
      new Date(item.release.original.__time__).toISOString().split('T')[0] : null,
    urls: JSON.stringify(item.urls || {}),
    created_at: item.created_at?.__time__ || new Date().toISOString(),
    updated_at: item.updated_at?.__time__ || new Date().toISOString()
  }))
}
</script>
