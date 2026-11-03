<template>
  <main>
    <section aria-labelledby="transfer-heading" class="max-w-4xl">
      <h2 id="transfer-heading" class="mb-2 font-serif text-2xl text-gray-900 dark:text-gray-100">{{ $t('transfer_heading') }}</h2>
      <p class="mb-4 font-sans text-sm text-gray-600 dark:text-gray-400">{{ $t('transfer_description') }}</p>
      <div class="divide-y divide-gray-200 border-y border-gray-200 dark:divide-gray-800 dark:border-gray-800">
        <button v-for="tool in transferTools" :key="tool.id" class="group flex min-h-20 w-full items-center gap-4 py-4 text-left" @click="openTool(tool.id)">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-gray-200 text-gray-600 transition-colors group-hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:group-hover:bg-gray-800">
            <NIcon :name="tool.icon" class="h-5 w-5" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block font-sans text-base font-600 text-gray-900 dark:text-gray-100">{{ $t(tool.titleKey) }}</span>
            <span class="mt-1 block font-sans text-sm leading-5 text-gray-600 dark:text-gray-400">{{ $t(tool.descriptionKey) }}</span>
          </span>
          <NIcon name="i-ph-arrow-right" class="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </section>

    <section aria-labelledby="maintenance-heading" class="mt-10 max-w-4xl">
      <h2 id="maintenance-heading" class="mb-2 font-serif text-2xl text-gray-900 dark:text-gray-100">{{ $t('maintenance_heading') }}</h2>
      <p class="mb-4 font-sans text-sm text-gray-600 dark:text-gray-400">{{ $t('maintenance_description') }}</p>
      <button class="group flex min-h-20 w-full items-center gap-4 border-y border-gray-200 py-4 text-left dark:border-gray-800" @click="openTool('maintenance')">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-red-200 text-red-700 dark:border-red-900 dark:text-red-300">
          <NIcon name="i-ph-warning" class="h-5 w-5" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block font-sans text-base font-600 text-gray-900 dark:text-gray-100">{{ $t('maintenance_title') }}</span>
          <span class="mt-1 block font-sans text-sm leading-5 text-gray-600 dark:text-gray-400">{{ $t('maintenance_action_description') }}</span>
        </span>
        <NIcon name="i-ph-arrow-right" class="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-1" />
      </button>
    </section>

    <ClientOnly>
      <NDialog
        v-model:open="dialogOpen"
        :una="{ dialogContent: dialogContentClass }"
      >
        <template v-if="activeTool !== 'import'" #header>
          <div>
            <h2 class="font-serif text-2xl font-400 tracking-tight text-gray-900 dark:text-gray-100">{{ activeToolTitle }}</h2>
            <p class="mt-1 font-sans text-sm text-gray-600 dark:text-gray-400">{{ $t('dialog_hint') }}</p>
          </div>
        </template>
        <div class="min-h-0">
          <ImportTool v-if="activeTool === 'import'" />
          <ExportTool v-else-if="activeTool === 'export'" />
          <MaintenanceTool v-else-if="activeTool === 'maintenance'" />
        </div>
      </NDialog>
    </ClientOnly>
  </main>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import ImportTool from '~/components/admin/tools/ImportTool.vue'
import ExportTool from '~/components/admin/tools/ExportTool.vue'
import MaintenanceTool from '~/components/admin/tools/MaintenanceTool.vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { $t } = useI18n()
const { $loadPageTranslations } = useI18n()
const { locale } = useI18nLocale()
const route = useRoute()
const router = useRouter()
useHead({ title: $t('meta_title') as string })

type ToolId = 'import' | 'export' | 'maintenance'
const toolIds: ToolId[] = ['import', 'export', 'maintenance']
const activeTool = ref<ToolId | null>(null)
const dialogOpen = ref(false)
const dialogContentClass = 'admin-tools-dialog w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] max-w-6xl gap-5 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 text-gray-900 shadow-xl transition-[max-width,height] duration-300 ease-in-out motion-reduce:transition-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 sm:p-6'
const transferTools = [
  { id: 'import' as const, icon: 'i-ph-upload-simple', titleKey: 'import_title', descriptionKey: 'import_description' },
  { id: 'export' as const, icon: 'i-ph-export', titleKey: 'export_title', descriptionKey: 'export_description' },
]
const translationLoaders = {
  import: {
    en: () => import('../../../locales/pages/admin-import/en.json'),
    fr: () => import('../../../locales/pages/admin-import/fr.json'),
  },
  export: {
    en: () => import('../../../locales/pages/admin-export/en.json'),
    fr: () => import('../../../locales/pages/admin-export/fr.json'),
  },
  maintenance: {
    en: () => import('../../../locales/pages/admin-maintenance/en.json'),
    fr: () => import('../../../locales/pages/admin-maintenance/fr.json'),
  },
}

const activeToolTitle = computed(() => {
  if (activeTool.value === 'import') return $t('import_title')
  if (activeTool.value === 'export') return $t('export_title')
  if (activeTool.value === 'maintenance') return $t('maintenance_title')
  return ''
})

function openTool(tool: ToolId) {
  void router.replace({ path: '/admin/tools', query: { open: tool } })
}

async function showTool(tool: ToolId) {
  const toolLocale = locale.value === 'fr' ? 'fr' : 'en'
  const messages = await translationLoaders[tool][toolLocale]()
  await $loadPageTranslations(locale.value || 'en', `admin-${tool}`, messages.default)
  activeTool.value = tool
  dialogOpen.value = true
}

watch(() => route.query.open, async (value) => {
  const requested = Array.isArray(value) ? value[0] : value
  if (toolIds.includes(requested as ToolId)) {
    await showTool(requested as ToolId)
    return
  }

  dialogOpen.value = false
  activeTool.value = null
}, { immediate: true })

watch(dialogOpen, (isOpen) => {
  if (!isOpen && route.query.open) void router.replace({ path: '/admin/tools' })
})
</script>
