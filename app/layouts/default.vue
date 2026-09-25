<template>
  <div
    class="min-h-screen"
    :class="usesWarmEditorialSurface
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
            'bg-[#F7F5EF] dark:bg-[#0C0A09]': scrollY === 0 && usesWarmEditorialSurface,
            'bg-[#FAFAF9] dark:bg-[#0C0A09]': scrollY === 0 && !usesWarmEditorialSurface,
            'bg-[#F7F5EF]/80 dark:bg-[#0C0A09]/80 backdrop-blur-md': scrollY !== 0 && usesWarmEditorialSurface,
            'bg-[#FAFAF9]/80 dark:bg-[#0C0A09]/80 backdrop-blur-md': scrollY !== 0 && !usesWarmEditorialSurface
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

        <span class="flex-1" aria-hidden="true" />
        <NButton
          v-if="route.path === '/' && homeTheme"
          icon
          btn="ghost-gray"
          label="i-lucide-book-open"
          size="sm"
          :aria-label="String($t('home.theme_details'))"
          :aria-expanded="showMobileTheme"
          aria-controls="mobile-theme-sheet"
          @click="showMobileTheme = true"
        />

        <NButton
          icon
          btn="ghost-gray"
          :label="showMobileMenu ? 'i-ph-x' : 'i-ph-list'"
          size="sm"
          :aria-label="String($t(showMobileMenu ? 'common.close' : 'nav.menu'))"
          :aria-expanded="showMobileMenu"
          aria-controls="mobile-site-menu"
          @click="showMobileMenu = !showMobileMenu"
        />
      </div>
    </header>

    <ClientOnly>
      <NDrawer
        v-if="route.path === '/' && homeTheme"
        v-model:open="showMobileTheme"
        direction="bottom"
        :dismissible="true"
        :close-threshold="0.25"
        :show-close="false"
        :una="{ drawerContent: 'z-[60] rounded-t-3xl bg-[#F7F5EF] dark:bg-[#1C1917] shadow-2xl', drawerOverlay: 'z-[55] bg-black/45' }"
      >
        <template #body>
          <div id="mobile-theme-sheet" class="px-6 pb-8 pt-5" aria-label="Theme details">
            <div class="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
            <div class="flex items-start justify-between gap-4">
              <h2 class="font-serif text-2xl text-gray-900 dark:text-gray-100">{{ homeTheme.name }}</h2>
              <NButton icon btn="ghost-gray" label="i-ph-x" size="sm" :aria-label="String($t('common.close'))" @click="showMobileTheme = false" />
            </div>
            <p v-if="homeTheme.description" class="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {{ homeTheme.description }}
            </p>
            <p class="mt-4 text-xs text-gray-500 dark:text-gray-500">
              {{ homeStats.quotes.toLocaleString() }} citations · {{ homeStats.references.toLocaleString() }} références · {{ homeStats.authors.toLocaleString() }} auteurs
            </p>
            <p class="mt-2 font-sans text-xs text-gray-400 dark:text-gray-500">
              {{ $t('home.edition_date', { date: currentEditionDate }) }}
            </p>
          </div>
        </template>
      </NDrawer>
    </ClientOnly>

    <ClientOnly>
      <NDrawer
        v-model:open="showMobileMenu"
        direction="bottom"
        :dismissible="true"
        :close-threshold="0.25"
        :show-close="false"
        :una="{ drawerContent: 'z-[60] h-screen rounded-none bg-[#F7F5EF] dark:bg-[#0C0A09]', drawerOverlay: 'z-[55] bg-black/45' }"
      >
        <template #body>
      <div
        id="mobile-site-menu"
        class="mobile-site-menu flex h-full flex-col px-6 pb-32 pt-20"
        role="dialog"
        aria-modal="true"
        :aria-label="String($t('nav.menu'))"
      >
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="font-sans text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
              {{ currentDate }}
            </p>
            <p v-if="route.path === '/' && homeTheme" class="mt-2 font-sans text-sm text-gray-700 dark:text-gray-300">
              {{ homeTheme.name }}
            </p>
          </div>
          <NButton icon btn="ghost-gray" label="i-ph-x" size="sm" :aria-label="String($t('common.close'))" @click="closeMobileMenu" />
        </div>
        <nav class="mt-14 flex flex-col gap-5" :aria-label="String($t('nav.menu'))">
          <NuxtLink v-for="(item, index) in mobileMenuItems.filter(item => item.to)" :key="item.to" :to="item.to!" class="mobile-site-menu-link" :style="{ '--menu-index': index }" @click="closeMobileMenu">
            {{ item.label }}
          </NuxtLink>
          <button type="button" class="mobile-site-menu-link text-left" style="--menu-index: 4" @click="openContribution">
            {{ $t('nav.contribute') }}
          </button>
        </nav>
        <div class="mt-12 border-t border-black/10 pt-5 dark:border-white/15" aria-label="Preferences">
          <div class="flex items-center gap-2">
            <I18nSelector />
            <ThemeSelector />
          </div>
        </div>
      </div>
        </template>
      </NDrawer>
    </ClientOnly>

    <!-- Main content: responsive top/bottom spacing -->
    <main
      class="pt-14 md:pt-0 md:pb-10"
      :class="route.path.startsWith('/quotes/')
        ? 'pb-[calc(6rem+env(safe-area-inset-bottom))]'
        : 'pb-10'"
    >
      <slot />
    </main>

    <!-- Homepage and reference pages share the editorial footer layout. -->
    <AppFooter class="homepage-v3-footer" />

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
const usesWarmEditorialSurface = computed(() => route.path === '/' || route.path.startsWith('/quotes/') || route.path === '/search')
const { $t } = useI18n()
const { locale } = useI18nLocale()
const homeTheme = useState<{ name: string; description: string | null } | null>('active-home-theme', () => null)
const homeStats = useState<{ quotes: number; authors: number; references: number }>('active-home-stats', () => ({ quotes: 0, authors: 0, references: 0 }))
const showAddQuote = ref(false)
const showReportDrawer = ref(false)
const showMobileMenu = ref(false)
const showMobileTheme = ref(false)
const previousBodyOverflow = ref('')
const previousDocumentOverflow = ref('')

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

const currentEditionDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
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

const closeMobileMenu = () => {
  showMobileMenu.value = false
}

const openContribution = () => {
  closeMobileMenu()
  showAddQuote.value = true
}

const handleMobileMenuKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  if (showMobileMenu.value) closeMobileMenu()
  if (showMobileTheme.value) showMobileTheme.value = false
}

watch([showMobileMenu, showMobileTheme], ([menuOpen, themeOpen]) => {
  if (!import.meta.client) return
  const isOpen = menuOpen || themeOpen

  if (isOpen) {
    if (document.body.style.overflow !== 'hidden') {
      previousBodyOverflow.value = document.body.style.overflow
      previousDocumentOverflow.value = document.documentElement.style.overflow
    }
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = previousBodyOverflow.value
    document.documentElement.style.overflow = previousDocumentOverflow.value
  }
})

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('keydown', handleMobileMenuKeydown)
  scrollY.value = window.scrollY
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('keydown', handleMobileMenuKeydown)
  if (import.meta.client) {
    document.body.style.overflow = previousBodyOverflow.value
    document.documentElement.style.overflow = previousDocumentOverflow.value
  }
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

.mobile-site-menu-link {
  color: #272522;
  font-family: Fraunces, Georgia, serif;
  font-size: clamp(2.25rem, 10vw, 3.5rem);
  letter-spacing: -0.04em;
  line-height: 0.98;
}

.mobile-site-menu-link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 6px;
}

.mobile-site-menu-link {
  opacity: 0;
  animation: mobile-menu-link-in 420ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: calc(var(--menu-index, 0) * 55ms + 100ms);
}

@keyframes mobile-menu-link-in {
  from { opacity: 0; transform: translateY(0.75rem); }
  to { opacity: 1; transform: translateY(0); }
}

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: opacity 260ms ease, transform 260ms ease;
}

.mobile-site-menu { transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1); }

.mobile-site-menu-dragging { transition: none; }

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-1.5rem);
}

@media (prefers-reduced-motion: reduce) {
  .mobile-menu-enter-active,
  .mobile-menu-leave-active {
    transition-duration: 0.01ms;
  }

  .mobile-site-menu-link {
    animation: none;
    opacity: 1;
  }
}

:global(html.dark .mobile-site-menu-link) { color: #f5f2ec; }
</style>
