<template>
  <div class="min-h-screen">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <NuxtRouteAnnouncer />
    <UToaster />
  </div>
</template>

<script lang="ts" setup>
import '@una-ui/preset/una.css'
import '@/styles/main.css'
</script>
