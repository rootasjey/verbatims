<template>
  <div class="min-h-screen">
    <NuxtLayout>
      <NuxtPage :transition="isDashboardPage ? dashboardPageTransition : false" />
    </NuxtLayout>
    <MobileBottomNavigation v-if="!isAuthPage && !isDashboardPage && !isAdminPage" />
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
const isAdminPage = computed(() => route.path.startsWith('/admin'))
const dashboardViewTransitionPending = useState('dashboard-view-transition-pending', () => false)
let dashboardTransitionFallback: ReturnType<typeof setTimeout> | undefined
let bodyScrollLockObserver: MutationObserver | null = null
let previousRootOverflowY = ''
let rootScrollLockApplied = false

const syncRootScrollLock = () => {
  const bodyLocked = document.body.style.overflow === 'hidden'
    || document.body.style.pointerEvents === 'none'

  if (bodyLocked) {
    if (!rootScrollLockApplied) {
      previousRootOverflowY = document.documentElement.style.overflowY
      document.documentElement.style.overflowY = 'hidden'
      rootScrollLockApplied = true
    }
    return
  }

  if (!rootScrollLockApplied) return

  document.documentElement.style.overflowY = previousRootOverflowY
  rootScrollLockApplied = false
}

const finishDashboardPageTransition = () => {
  if (dashboardTransitionFallback) clearTimeout(dashboardTransitionFallback)
  dashboardViewTransitionPending.value = false
}

nuxtApp.hook('page:finish', () => {
  if (!import.meta.client || !isDashboardPage.value) return
  if (dashboardTransitionFallback) clearTimeout(dashboardTransitionFallback)
  // Fallback only: page:finish may happen before the destination view enters.
  dashboardTransitionFallback = setTimeout(() => {
    if (isDashboardPage.value && dashboardViewTransitionPending.value) {
      dashboardViewTransitionPending.value = false
    }
  }, 400)
})

const dashboardPageTransition = {
  name: 'dashboard-view',
  // Keep the destination mounted during route changes; the panel skeleton covers the brief overlap.
  onAfterEnter: finishDashboardPageTransition
}

const appReady = useState('app-ready', () => false)
onNuxtReady(() => {
  appReady.value = true
})

onMounted(() => {
  bodyScrollLockObserver = new MutationObserver(syncRootScrollLock)
  bodyScrollLockObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['style']
  })
  syncRootScrollLock()
})

onUnmounted(() => {
  bodyScrollLockObserver?.disconnect()
  if (rootScrollLockApplied) {
    document.documentElement.style.overflowY = previousRootOverflowY
  }
})
</script>
