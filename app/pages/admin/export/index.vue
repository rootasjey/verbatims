<template>
  <div>
    <!-- Editorial Header -->
    <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
        {{ $t('title') }}
      </h1>
    </div>

    <aside class="mb-6 flex max-w-4xl items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/70 p-4 text-sm leading-6 text-gray-600 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-400">
      <NIcon name="i-ph-info" class="mt-1 h-4 w-4 shrink-0" />
      <p>{{ $t('export_scope_note') }}</p>
    </aside>

    <!-- Alert Messages -->
    <div class="mb-6 space-y-4">
      <div v-if="dataExport.state.successMessage" class="flex items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 font-sans text-xs text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
        <span>{{ dataExport.state.successMessage }}</span>
        <button class="text-green-600 dark:text-green-400 hover:text-green-800 flex-shrink-0" @click="clearMessages"><NIcon name="i-ph-x" class="w-4 h-4" /></button>
      </div>

      <div v-if="dataExport.state.errorMessage" class="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-sans text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        <span>{{ dataExport.state.errorMessage }}</span>
        <button class="text-red-600 dark:text-red-400 hover:text-red-800 flex-shrink-0" @click="clearMessages"><NIcon name="i-ph-x" class="w-4 h-4" /></button>
      </div>
    </div>

    <NTabs v-model="activeTab" :items="mainTabs" class="w-full">
      <template #content="{ item }">
        <div v-if="['export'].includes(item.value)">
          <ExportCreate />
        </div>

        <div v-else-if="item.value === 'history'">
          <ExportHistory @go-to-export="activeTab = 'export'" />
        </div>
      </template>
    </NTabs>

    <NDialog v-model:open="dataExport.state.showProgressDialog">
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100 mb-4">{{ $t('dialog_in_progress') }}</h3>

        <div class="text-center py-8">
          <NIcon name="i-ph-spinner" class="w-8 h-8 animate-spin text-red-600 mx-auto mb-4" />
          <p class="font-sans text-sm text-gray-600 dark:text-gray-400">{{ $t('dialog_body') }}</p>
        </div>

        <div class="flex justify-end">
          <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-3 py-1.5" :disabled="dataExport.state.isExporting" @click="closeProgressDialog">{{ $t('close') }}</button>
        </div>
      </div>
    </NDialog>
  </div>
</template>

<script setup lang="ts">
import ExportCreate from '~/components/admin/export/ExportCreate.vue'
import ExportHistory from '~/components/admin/export/ExportHistory.vue'
import { useLocalStorage } from '@vueuse/core'

definePageMeta({ layout: 'admin', middleware: 'admin' })
const { $t } = useI18n()
useHead({ title: $t('meta_title') as string })

const dataExport = useDataExport()

const activeTab = useLocalStorage<'export' | 'history'>('verbatims-admin-export-active-tab', 'export')

const mainTabs = [
  { name: $t('tab_export'), value: 'export', icon: 'i-ph-quotes' },
  { name: $t('tab_history'), value: 'history', icon: 'i-ph-clock-countdown', class: 'border-l border-gray-200 dark:border-gray-700 ml-2 pl-2' }
]

const clearMessages = () => { dataExport.clearMessages() }
const closeProgressDialog = () => { dataExport.closeProgressDialog() }

watch(activeTab, () => { clearMessages(); dataExport.state.previewData = null })
onMounted(() => { dataExport.init() })
</script>

<style scoped>
.export-history-container { max-height: calc(100vh - 20rem); overflow-y: auto; }
:deep(.una-tabs-list) { border-bottom: 1px solid theme('colors.gray.200'); }
:deep(.dark .una-tabs-list) { border-bottom-color: theme('colors.gray.700'); }
:deep(.accordion-item) { transition: all 0.2s ease; }
:deep(.accordion-item:hover) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
:deep(.dark .accordion-item:hover) { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
</style>
