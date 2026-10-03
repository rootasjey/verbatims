<template>
  <div class="min-h-screen">
    <NuxtLayout>
      <NuxtPage :transition="isDashboardPage ? dashboardPageTransition : false" />
    </NuxtLayout>
    <MobileBottomNavigation v-if="!isAuthPage && !isDashboardPage" />
    <NuxtRouteAnnouncer />
    <NToaster :_toast-viewport="{ class: 'z-[200]' }" />
  </div>
</template>

<script lang="ts" setup>
import '@una-ui/preset/una.css'
import '@/styles/main.css'
import MobileBottomNavigation from '~/components/MobileBottomNavigation.vue'

const route = useRoute()
const nuxtApp = useNuxtApp()
const isAuthPage = computed(() => route.path === '/login' || route.path === '/signup')
const isDashboardPage = computed(() => route.path.startsWith('/dashboard'))
const dashboardViewTransitionPending = useState('dashboard-view-transition-pending', () => false)
let dashboardTransitionFallback: ReturnType<typeof setTimeout> | undefined

const finishDashboardPageTransition = () => {
  if (dashboardTransitionFallback) clearTimeout(dashboardTransitionFallback)
  dashboardViewTransitionPending.value = false
}

nuxtApp.hook('page:finish', () => {
  if (!import.meta.client || !isDashboardPage.value) return
  if (dashboardTransitionFallback) clearTimeout(dashboardTransitionFallback)
  // Fallback only: page:finish may happen before the out-in visual transition ends.
  dashboardTransitionFallback = setTimeout(() => {
    if (isDashboardPage.value && dashboardViewTransitionPending.value) {
      dashboardViewTransitionPending.value = false
    }
  }, 400)
})

const dashboardPageTransition = {
  name: 'dashboard-view',
  mode: 'out-in' as const,
  // Let the layout measure the destination only after the out-in transition has finished.
  onAfterEnter: finishDashboardPageTransition
}

const appReady = useState('app-ready', () => false)
onNuxtReady(() => {
  appReady.value = true
})
</script>
