<template>
  <div class="space-y-5">
    <p class="font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">
      {{ $t('language_info_intro') }}
    </p>

    <section class="border-t border-gray-200 pt-4 dark:border-white/10">
      <h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">
        {{ $t('language_info_content_title') }}
      </h3>
      <p class="mt-1.5 font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        {{ $t('language_info_content_body') }}
      </p>
    </section>

    <section class="border-t border-gray-200 pt-4 dark:border-white/10">
      <h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">
        {{ $t('language_info_interface_title') }}
      </h3>
      <p class="mt-1.5 font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        {{ $t('language_info_interface_body') }}
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
const { $t } = useI18n()
</script>
