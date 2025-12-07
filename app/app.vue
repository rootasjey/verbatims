<template>
  <div class="min-h-screen">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <MobileBottomNavigation />
    <NuxtRouteAnnouncer />
    <NToaster />
  </div>
</template>

<script lang="ts" setup>
import '@una-ui/preset/una.css'
import '@/styles/main.css'
import MobileBottomNavigation from '~/components/MobileBottomNavigation.vue'
</script>
