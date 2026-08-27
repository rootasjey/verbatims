<template>
  <div
    class="min-h-screen"
    :class="route.path === '/'
      ? 'bg-[#F7F5EF] dark:bg-[#0C0A09]'
      : 'bg-gray-50 dark:bg-[#0C0A09]'"
  >
    <!-- Desktop header: hidden on screens < 768px -->
    <AppMastheadBar />

    <!-- Mobile header: hidden on screens >= 768px -->
    <header
      class="fixed top-0 left-0 right-0 z-40 md:hidden
        px-4 py-3 safe-area-pt"
        :class="[
          {
            'bg-[#F7F5EF] dark:bg-[#0C0A09]': scrollY === 0 && route.path === '/',
            'bg-[#FAFAF9] dark:bg-[#0C0A09]': scrollY === 0 && route.path !== '/',
            'bg-[#F7F5EF]/80 dark:bg-[#0C0A09]/80 backdrop-blur-md': scrollY !== 0 && route.path === '/',
            'bg-[#FAFAF9]/80 dark:bg-[#0C0A09]/80 backdrop-blur-md': scrollY !== 0 && route.path !== '/'
          }
        ]"
    >
      <div
        class="flex items-center justify-between gap-3"
        @click.self="scrollToTop"
      >
        <div class="flex items-center">
          <NButton
            btn="~"
            @click="handleAppIconClick"
            size="sm"
            class="m-0 p-3"
          >
            <span class="font-subtitle font-700 italic tracking-[0.1rem] text-xl">verbatims</span>
          </NButton>
        </div>

        <span v-if="route.path === '/' && homeTheme" class="min-w-0 flex-1 truncate text-center font-sans text-xs text-gray-600 dark:text-gray-300">
          {{ homeTheme.name }} · {{ currentDate }}
        </span>
        <span v-else class="inline flex-1 text-center font-sans text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
          {{ currentDate }}
        </span>

        <NDropdownMenu :items="mobileMenuItems" :modal="false" :_dropdown-menu-content="{ side: 'bottom', align: 'end' }">
          <NButton icon btn="ghost-gray" label="i-ph-list" size="sm" :aria-label="String($t('nav.menu'))" />
        </NDropdownMenu>
      </div>
    </header>

    <!-- Main content: responsive top/bottom spacing -->
    <main class="pt-14 md:pt-0 pb-10 md:pb-10">
      <slot />
    </main>

    <!-- The homepage footer is part of the editorial scroll; inner pages keep the desktop convention. -->
    <AppFooter :class="route.path === '/' ? 'homepage-v3-footer' : 'hidden md:block'" />

    <!-- Mobile-only drawers (client-only to avoid SSR issues with NDrawer) -->
    <ClientOnly>
      <AddQuoteDrawer
        v-model:open="showAddQuote"
        @submitted="handleQuoteAdded"
      />
      <ReportDrawer
        v-model:open="showReportDrawer"
        :target-type="'general'"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { $t } = useI18n()
const homeTheme = useState<{ name: string; description: string | null } | null>('active-home-theme', () => null)
const showAddQuote = ref(false)
const showReportDrawer = ref(false)

const mobileMenuItems = computed(() => [
  { label: String($t('nav.explore')), leading: 'i-ph-compass', to: '/quotes' },
  { label: String($t('nav.authors')), leading: 'i-ph-users-three', to: '/authors' },
  { label: String($t('nav.references')), leading: 'i-ph-book-open-text', to: '/references' },
  { label: String($t('nav.about')), leading: 'i-ph-info', to: '/about' },
  { label: String($t('nav.contribute')), leading: 'i-ph-plus-circle', onclick: () => { showAddQuote.value = true } },
])

const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', {
    weekday: 'short',
    year: '2-digit',
    month: 'short',
    day: 'numeric'
  })
})

const scrollY = ref(0)

const scrollToTop = () => {
  if (import.meta.client) {
    if (scrollY.value === 0) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const handleScroll = () => {
  if (import.meta.client) {
    scrollY.value = window.scrollY
  }
}

const handleAppIconClick = (event: MouseEvent) => {
  if (route.path !== '/') {
    navigateTo('/')
    return
  }
  event.preventDefault()
  scrollToTop()
}

const handleQuoteAdded = () => {
  showAddQuote.value = false
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  scrollY.value = window.scrollY
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

useHead({
  htmlAttrs: {
    lang: 'en'
  },
  link: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      href: '/favicon.ico'
    }
  ]
})
</script>

<style scoped>
.safe-area-pt {
  padding-top: max(0.75rem, env(safe-area-inset-top));
}
</style>
