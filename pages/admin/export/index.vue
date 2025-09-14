<template>
  <div>
    <div class="mb-6 space-y-4">
      <UAlert
        v-if="dataExport.state.successMessage"
        btn="soft"
        closable
        :title="dataExport.state.successMessage"
        :close-button="{ icon: 'i-ph-x', color: 'gray', btn: 'link', padded: false }"
        @close="clearMessages"
      />

      <UAlert
        v-if="dataExport.state.errorMessage"
        btn="soft"
        closable
        :title="dataExport.state.errorMessage"
        :close-button="{ icon: 'i-ph-x', color: 'gray', btn: 'link', padded: false }"
        @close="clearMessages"
      />
    </div>

    <UTabs v-model="activeTab" :items="mainTabs" class="w-full">
      <template #content="{ item }">
        <div v-if="['export'].includes(item.value)">
          <ExportCreate />
        </div>

        <div v-else-if="item.value === 'history'">
          <ExportHistory @go-to-export="activeTab = 'export'" />
        </div>
      </template>
    </UTabs>

    <UDialog v-model:open="dataExport.state.showProgressDialog">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Export in Progress</h3>
        </template>

        <div class="space-y-4">
          <div class="text-center py-8">
            <UIcon name="i-ph-spinner" class="w-8 h-8 animate-spin text-red-600 mx-auto mb-4" />
            <p class="text-gray-600 dark:text-gray-400">
              Processing export... This may take a few moments.
            </p>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton
              btn="ghost"
              :disabled="dataExport.state.isExporting"
              @click="closeProgressDialog"
            >
              Close
            </UButton>
          </div>
        </template>
      </UCard>
    </UDialog>
  </div>
</template>

<script setup lang="ts">
import ExportCreate from '~/components/admin/export/ExportCreate.vue'
import ExportHistory from '~/components/admin/export/ExportHistory.vue'
import { useLocalStorage } from '@vueuse/core'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({
  title: 'VERBATIMS - Export Data - Admin'
})

const dataExport = useDataExport()

const activeTab = useLocalStorage<'export' | 'history'>(
  'verbatims-admin-export-active-tab',
  'export'
)

const mainTabs = [
  { name: 'Export', value: 'export', icon: 'i-ph-quotes' },
  {
    name: 'History',
    value: 'history',
    icon: 'i-ph-clock-countdown',
    class: 'border-l border-gray-200 dark:border-gray-700 ml-2 pl-2'
  }
]

const clearMessages = () => { dataExport.clearMessages() }
const closeProgressDialog = () => { dataExport.closeProgressDialog() }

watch(activeTab, () => {
  clearMessages()
  dataExport.state.previewData = null
})

onMounted(() => { dataExport.init() })
</script>

<style scoped>
.export-history-container {
  max-height: calc(100vh - 20rem);
  overflow-y: auto;
}

/* Custom tab styling for Export History */
:deep(.una-tabs-list) {
  border-bottom: 1px solid theme('colors.gray.200');
}

:deep(.dark .una-tabs-list) {
  border-bottom-color: theme('colors.gray.700');
}

/* Accordion step styling */
:deep(.accordion-item) {
  transition: all 0.2s ease;
}

:deep(.accordion-item:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:deep(.dark .accordion-item:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
