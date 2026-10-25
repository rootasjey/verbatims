<template>
  <div class="flex items-center">
    <NTooltip :content="$t('language_info_tooltip') as string">
      <NButton
        icon
        btn="ghost-gray"
        size="xs"
        label="i-ph-info"
        :aria-label="$t('language_info_open') as string"
        aria-haspopup="dialog"
        class="shrink-0 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        @click="isOpen = true"
      />
    </NTooltip>

    <ClientOnly>
      <NDrawer v-if="isMobile" v-model:open="isOpen" direction="bottom">
        <template #body>
          <div class="space-y-5 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <div class="flex items-start justify-between gap-4">
              <h2 class="font-serif text-xl font-500 leading-snug text-gray-900 dark:text-gray-100">
                {{ $t('language_info_title') }}
              </h2>
              <NButton
                icon
                btn="ghost-gray"
                size="xs"
                label="i-ph-x-bold"
                :aria-label="$t('common.close') as string"
                @click="isOpen = false"
              />
            </div>
            <DashboardLanguageWaveDivider />
            <DashboardLanguageInfoContent />
          </div>
        </template>
      </NDrawer>

      <AppDialog
        v-else
        v-model="isOpen"
        :title="$t('language_info_title') as string"
        max-width="sm"
        hide-footer
      >
        <template #header-divider>
          <DashboardLanguageWaveDivider />
        </template>
        <DashboardLanguageInfoContent />
      </AppDialog>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const { $t } = useI18n()
const { isMobile } = useMobileDetection()
const isOpen = ref(false)
</script>
