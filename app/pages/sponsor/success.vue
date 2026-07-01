<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="max-w-md mx-auto px-8 text-center">
      <div class="mb-6">
        <NIcon name="i-ph-check-circle" class="w-16 h-16 text-green-600 dark:text-green-400 mx-auto" />
      </div>

      <h1 class="font-title text-4xl font-600 mb-3">
        Payment successful!
      </h1>

      <p class="font-body text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
        Your sponsored message has been submitted and is now awaiting
        <strong class="text-gray-700 dark:text-gray-300">moderation</strong>.
        You'll receive a notification once it's approved and published.
      </p>

      <div class="space-y-3">
        <NButton
          label="Back to home"
          btn="outline-gray"
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

useHead({
  title: 'Payment Successful \u2022 Verbatims',
  meta: [
    { name: 'description', content: 'Your sponsored message payment was successful.' },
  ],
})
</script>
