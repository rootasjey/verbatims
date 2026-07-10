<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="max-w-md mx-auto px-8 text-center">
      <div class="mb-6">
        <NIcon name="i-ph-x-circle" class="w-16 h-16 text-red-500 dark:text-red-400 mx-auto" />
      </div>

      <h1 class="font-title text-4xl font-600 mb-3">
        {{ $t('title') }}
      </h1>

      <p class="font-body text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
        {{ $t('desc') }}
      </p>

      <div class="space-y-3">
        <NButton
          :label="$t('try_again') as string"
          btn="outline-gray"
          size="lg"
          to="/sponsor"
          class="w-full"
        />
        <NButton
          :label="$t('back_home') as string"
          btn="ghost-gray"
          size="lg"
          to="/"
          class="w-full"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { $t } = useI18n()

useHead({
  title: $t('meta_title') as string,
  meta: [
    { name: 'description', content: $t('meta_desc') as string },
  ],
})
</script>
