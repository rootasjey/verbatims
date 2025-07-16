<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Data Management
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Advanced data operations, exports, and maintenance tools
        </p>
      </div>
      <UButton
        variant="ghost"
        icon
        label="i-ph-arrow-left"
        to="/admin"
      >
        Back to Admin
      </UButton>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-primary-600">{{ stats.totalReferences }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Total References</div>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-green-600">{{ stats.recentImports }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Recent Imports</div>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-600">{{ stats.totalBackups }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Available Backups</div>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <div class="text-3xl font-bold text-yellow-600">{{ stats.dataQualityScore }}%</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Data Quality</div>
        </div>
      </UCard>
    </div>

    <!-- Action Tabs -->
    <div class="mb-8">
      <UTabs v-model="activeTab" :items="tabs" />
    </div>

    <!-- Export Section -->
    <div v-if="activeTab === 0" class="space-y-6">
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">Export Data</h2>
        </template>

        <div class="space-y-6">
          <!-- Export Options -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium mb-2">Export Format</label>
              <USelect
                v-model="exportOptions.format"
                :options="exportFormatOptions"
                placeholder="Select format"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Data Filter</label>
              <USelect
                v-model="exportOptions.filter"
                :options="exportFilterOptions"
                placeholder="All data"
              />
            </div>
          </div>

          <!-- Advanced Options -->
          <div class="space-y-3">
            <h3 class="text-sm font-medium">Export Options</h3>
            
            <UCheckbox
              v-model="exportOptions.includeMetadata"
              label="Include metadata (creation dates, counts, etc.)"
            />
            
            <UCheckbox
              v-model="exportOptions.compressOutput"
              label="Compress output file"
            />
            
            <UCheckbox
              v-model="exportOptions.includeUrls"
              label="Include all URL data"
            />
          </div>

          <!-- Export Actions -->
          <div class="flex gap-3">
            <UButton
              :loading="isExporting"
              @click="startExport"
              :disabled="!exportOptions.format"
            >
              Start Export
            </UButton>
            
            <UButton
              variant="outline"
              @click="previewExport"
              :disabled="!exportOptions.format"
            >
              Preview Data
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Export History -->
      <UCard v-if="exportHistory.length > 0">
        <template #header>
          <h3 class="text-lg font-semibold">Recent Exports</h3>
        </template>
        
        <div class="space-y-3">
          <div
            v-for="export_ in exportHistory"
            :key="export_.id"
            class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div>
              <div class="font-medium">{{ export_.filename }}</div>
              <div class="text-sm text-gray-500">
                {{ export_.recordCount }} records • {{ formatDate(export_.createdAt) }}
              </div>
            </div>
            <div class="flex gap-2">
              <UButton
                size="sm"
                variant="outline"
                @click="downloadExport(export_.id)"
              >
                Download
              </UButton>
              <UButton
                size="sm"
                variant="ghost"
                color="red"
                @click="deleteExport(export_.id)"
              >
                Delete
              </UButton>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Data Quality Section -->
    <div v-if="activeTab === 1" class="space-y-6">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Data Quality Analysis</h2>
            <UButton
              variant="outline"
              @click="runQualityAnalysis"
              :loading="isAnalyzing"
            >
              Run Analysis
            </UButton>
          </div>
        </template>

        <div v-if="qualityReport" class="space-y-6">
          <!-- Quality Score -->
          <div class="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="text-4xl font-bold mb-2" :class="getQualityScoreColor(qualityReport.overallScore)">
              {{ qualityReport.overallScore }}%
            </div>
            <div class="text-lg font-medium">Overall Data Quality Score</div>
          </div>

          <!-- Quality Metrics -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div class="text-2xl font-bold">{{ qualityReport.completeness }}%</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Completeness</div>
            </div>
            <div class="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div class="text-2xl font-bold">{{ qualityReport.accuracy }}%</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
            </div>
            <div class="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div class="text-2xl font-bold">{{ qualityReport.consistency }}%</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Consistency</div>
            </div>
          </div>

          <!-- Issues Found -->
          <div v-if="qualityReport.issues.length > 0">
            <h3 class="text-lg font-semibold mb-3">Issues Found</h3>
            <div class="space-y-2">
              <div
                v-for="(issue, index) in qualityReport.issues.slice(0, 10)"
                :key="index"
                class="p-3 rounded-lg"
                :class="getIssueColor(issue.severity)"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium">{{ issue.title }}</div>
                    <div class="text-sm">{{ issue.description }}</div>
                  </div>
                  <UBadge :color="issue.severity === 'high' ? 'red' : issue.severity === 'medium' ? 'yellow' : 'blue'">
                    {{ issue.severity }}
                  </UBadge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          Click "Run Analysis" to analyze data quality
        </div>
      </UCard>
    </div>

    <!-- Maintenance Section -->
    <div v-if="activeTab === 2" class="space-y-6">
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">Database Maintenance</h2>
        </template>

        <div class="space-y-6">
          <!-- Maintenance Actions -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <h3 class="font-medium">Cleanup Operations</h3>
              
              <UButton
                block
                variant="outline"
                @click="cleanupOldBackups"
                :loading="isCleaningBackups"
              >
                Clean Old Backups
              </UButton>
              
              <UButton
                block
                variant="outline"
                @click="cleanupImportLogs"
                :loading="isCleaningLogs"
              >
                Clean Import Logs
              </UButton>
              
              <UButton
                block
                variant="outline"
                @click="optimizeDatabase"
                :loading="isOptimizing"
              >
                Optimize Database
              </UButton>
            </div>

            <div class="space-y-4">
              <h3 class="font-medium">Data Operations</h3>
              
              <UButton
                block
                variant="outline"
                @click="rebuildIndexes"
                :loading="isRebuildingIndexes"
              >
                Rebuild Search Indexes
              </UButton>
              
              <UButton
                block
                variant="outline"
                @click="updateStatistics"
                :loading="isUpdatingStats"
              >
                Update Statistics
              </UButton>
              
              <UButton
                block
                variant="outline"
                color="red"
                @click="showDangerZone = true"
              >
                Danger Zone
              </UButton>
            </div>
          </div>

          <!-- Maintenance Log -->
          <div v-if="maintenanceLog.length > 0">
            <h3 class="font-medium mb-3">Recent Maintenance</h3>
            <div class="space-y-2 max-h-40 overflow-y-auto">
              <div
                v-for="(log, index) in maintenanceLog"
                :key="index"
                class="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded"
              >
                <span class="font-medium">{{ formatDate(log.timestamp) }}</span>
                - {{ log.action }}: {{ log.result }}
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Danger Zone Modal -->
    <UModal v-model="showDangerZone">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">⚠️ Danger Zone</h3>
        </template>
        
        <div class="space-y-4">
          <p class="text-sm text-gray-600">
            These operations are irreversible and can cause data loss. Use with extreme caution.
          </p>
          
          <div class="space-y-3">
            <UButton
              block
              color="red"
              variant="outline"
              @click="truncateTable('quote_references')"
            >
              Clear All References
            </UButton>
            
            <UButton
              block
              color="red"
              variant="outline"
              @click="resetDatabase"
            >
              Reset Entire Database
            </UButton>
          </div>
        </div>
        
        <template #footer>
          <div class="flex justify-end">
            <UButton @click="showDangerZone = false">Cancel</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
// SEO and permissions
definePageMeta({
  middleware: 'admin'
})

useHead({
  title: 'Data Management - Admin'
})

// Data
const activeTab = ref(0)
const isExporting = ref(false)
const isAnalyzing = ref(false)
const isCleaningBackups = ref(false)
const isCleaningLogs = ref(false)
const isOptimizing = ref(false)
const isRebuildingIndexes = ref(false)
const isUpdatingStats = ref(false)
const showDangerZone = ref(false)

const stats = ref({
  totalReferences: 0,
  recentImports: 0,
  totalBackups: 0,
  dataQualityScore: 0
})

const exportOptions = ref({
  format: '',
  filter: '',
  includeMetadata: true,
  compressOutput: false,
  includeUrls: true
})

const exportHistory = ref([])
const qualityReport = ref(null)
const maintenanceLog = ref([])

const tabs = [
  { label: 'Export', icon: 'i-ph-download' },
  { label: 'Data Quality', icon: 'i-ph-chart-line' },
  { label: 'Maintenance', icon: 'i-ph-wrench' }
]

const exportFormatOptions = [
  { label: 'JSON', value: 'json' },
  { label: 'CSV', value: 'csv' },
  { label: 'Excel (XLSX)', value: 'xlsx' },
  { label: 'SQL Dump', value: 'sql' }
]

const exportFilterOptions = [
  { label: 'All References', value: 'all' },
  { label: 'Films Only', value: 'film' },
  { label: 'Books Only', value: 'book' },
  { label: 'TV Series Only', value: 'tv_series' },
  { label: 'Recent (Last 30 days)', value: 'recent' },
  { label: 'Popular (Most viewed)', value: 'popular' }
]

// Methods
const loadStats = async () => {
  try {
    const response = await $fetch('/api/admin/data-management/stats')
    stats.value = response.data
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

const startExport = async () => {
  isExporting.value = true
  
  try {
    const response = await $fetch('/api/admin/data-management/export', {
      method: 'POST',
      body: exportOptions.value
    })
    
    // Download the file
    const link = document.createElement('a')
    link.href = response.downloadUrl
    link.download = response.filename
    link.click()
    
    // Refresh export history
    await loadExportHistory()
    
  } catch (error) {
    console.error('Export failed:', error)
  } finally {
    isExporting.value = false
  }
}

const runQualityAnalysis = async () => {
  isAnalyzing.value = true
  
  try {
    const response = await $fetch('/api/admin/data-management/quality-analysis')
    qualityReport.value = response.data
  } catch (error) {
    console.error('Quality analysis failed:', error)
  } finally {
    isAnalyzing.value = false
  }
}

const getQualityScoreColor = (score) => {
  if (score >= 90) return 'text-green-600'
  if (score >= 70) return 'text-yellow-600'
  return 'text-red-600'
}

const getIssueColor = (severity) => {
  switch (severity) {
    case 'high': return 'bg-red-50 dark:bg-red-900/20'
    case 'medium': return 'bg-yellow-50 dark:bg-yellow-900/20'
    default: return 'bg-blue-50 dark:bg-blue-900/20'
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString()
}

// Lifecycle
onMounted(() => {
  loadStats()
})
</script>
