<template>
  <div
    class="sticky top-0 z-40 w-full hidden md:block transition-all duration-300"
    :class="scrollY === 0
      ? (route.path === '/' || route.path.startsWith('/quotes/') ? 'bg-[#F7F5EF] dark:bg-[#0C0A09]' : 'bg-[#FAFAF9] dark:bg-[#0C0A09]')
      : (route.path === '/' || route.path.startsWith('/quotes/') ? 'bg-[#F7F5EF]/80 dark:bg-[#0C0A09]/80 backdrop-blur-md' : 'bg-[#FAFAF9]/80 dark:bg-[#0C0A09]/80 backdrop-blur-md')
    "
  >
    <div class="flex items-center justify-between px-4 lg:px-8 py-3 mx-auto">
      <div class="flex items-center gap-3">
        <NuxtLink to="/" @click="handleLogoClick" class="group w-auto px-0 flex justify-start cursor-pointer active:scale-95 transition-transform relative overflow-hidden">
          <span class="font-subtitle font-700 italic tracking-[0.1rem] text-xl relative z-1 transition-colors duration-300 group-hover:text-white dark:group-hover:text-[#0C0A09]">verbatims</span>
          <span class="absolute inset-0 bg-[#0C0A09] dark:bg-[#FAFAF9] w-0 group-hover:w-full transition-all duration-300 ease-out -z-0" />
        </NuxtLink>
        <div v-if="route.path === '/' && homeTheme" class="hidden sm:block">
          <span class="mr-3 inline-block h-3 w-px align-[-0.05em] bg-gray-300/70 dark:bg-white/20" aria-hidden="true" />
          <NPopover
            v-model:open="showThemePopover"
            :_popover-content="{
              align: 'start',
              side: 'bottom',
              sideOffset: 8,
              class: 'w-72 rounded-xl bg-[#F7F5EF] p-4 text-gray-900 shadow-xl ring-1 ring-black/5 dark:bg-[#1C1917] dark:text-gray-100 dark:ring-white/10'
            }"
          >
            <template #trigger>
              <button
                type="button"
                class="cursor-pointer font-sans font-500 text-xs text-gray-700 transition-colors hover:text-gray-950 dark:text-gray-300 dark:hover:text-gray-100"
                :aria-label="String($t('home.theme_details'))"
              >
                {{ homeTheme.name }}
              </button>
            </template>
            <template #default>
              <div class="flex items-start justify-between gap-3">
                <p class="font-serif text-lg text-gray-900 dark:text-gray-100">{{ homeTheme.name }}</p>
                <div class="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    class="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-gray-100"
                    :aria-label="String($t('home.share_theme'))"
                    :title="String($t('home.share_theme'))"
                    @click="shareTheme"
                  >
                    <NIcon name="i-ph-share-network" class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-gray-100"
                    :aria-label="String($t('close'))"
                    @click="showThemePopover = false"
                  >
                    <NIcon name="i-ph-x" class="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p v-if="homeTheme.description" class="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {{ homeTheme.description }}
              </p>
              <p class="mt-3 text-xs text-gray-400 dark:text-gray-500">
                {{ homeStats.quotes.toLocaleString() }} citations · {{ homeStats.references.toLocaleString() }} références · {{ homeStats.authors.toLocaleString() }} auteurs
              </p>
              <p class="mt-3 text-xs text-gray-400 dark:text-gray-500">
                {{ currentDate }}
              </p>
            </template>
          </NPopover>
        </div>
        <div v-else class="hidden sm:flex items-center">
          <span class="mr-3 inline-block h-3 w-px bg-gray-300/70 dark:bg-white/20" aria-hidden="true" />
          <span class="font-sans text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
            {{ currentDate }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <NNavigationMenu
          :items="navMenuItems"
          indicator
        >
          <template #item-content="{ items: menuItems }">
            <ul class="grid gap-1 p-3 min-w-64 max-w-80">
              <li v-for="child in menuItems" :key="child.label" class="w-full">
                <template v-if="(child as any).slot === 'language'">
                  <button type="button" class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-gray-100 dark:hover:bg-white/10" :aria-expanded="showLanguageMenu" @click.stop.prevent="showLanguageMenu = !showLanguageMenu">
                    <NIcon :name="child.leading" class="h-5 w-5 shrink-0" />
                    <span class="min-w-0 flex-1">
                      <span class="block text-sm">{{ child.label }}</span>
                      <span v-if="child.description" class="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{{ child.description }}</span>
                    </span>
                    <NIcon name="i-lucide-chevron-right" class="h-4 w-4 shrink-0 transition-transform" :class="showLanguageMenu ? 'rotate-90' : ''" />
                  </button>
                  <Transition name="language-submenu">
                    <div v-if="showLanguageMenu" class="ml-8 mt-1 grid gap-1 border-l border-gray-200 pl-2 dark:border-white/15">
                      <button type="button" class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-white/10" @click="switchLocale('en')">
                        <img src="/images/languages/usa.png" alt="" class="h-5 w-5 shrink-0 rounded-[2px] object-cover" />
                        <span>English</span>
                      </button>
                      <button type="button" class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-white/10" @click="switchLocale('fr')">
                        <img src="/images/languages/france.png" alt="" class="h-5 w-5 shrink-0 rounded-[2px] object-cover" />
                        <span>Français</span>
                      </button>
                    </div>
                  </Transition>
                </template>
                <NNavigationMenuContentItem v-else-if="(child as any).slot === 'search'" v-bind="child" class="w-full">
                  <div class="flex items-center justify-between gap-3">
                    <span class="text-sm">{{ child.label }}</span>
                    <span class="inline-flex shrink-0 items-center gap-1">
                      <NKbd label="⌘" size="sm" />
                      <NKbd label="K" size="sm" />
                    </span>
                  </div>
                </NNavigationMenuContentItem>
                <NNavigationMenuContentItem v-else v-bind="child" class="w-full" />
              </li>
            </ul>
          </template>
        </NNavigationMenu>

        <UserMenu v-if="user" :user="user" />
      </div>
    </div>
  </div>

  <SearchBox
    :model-value="showSearch"
    @update:model-value="showSearch = $event"
    @action="handleSearchAction"
  />

  <AddQuoteDialog
    v-model="showAddQuote"
    @quote-added="handleQuoteAdded"
  />

  <ReportDialog
    v-model="showReportDrawer"
    :target-type="reportTargetType"
    :category="reportCategory"
  />
</template>

<script setup lang="ts">
const { $t, $switchLocale } = useI18n() as any
const { locale } = useI18nLocale()
const route = useRoute()
const { user } = useUserSession()
const homeTheme = useState<{ name: string; description: string | null } | null>('active-home-theme', () => null)
const homeStats = useState<{ quotes: number; authors: number; references: number }>('active-home-stats', () => ({ quotes: 0, authors: 0, references: 0 }))
const scrollY = ref(0)
const showSearch = ref(false)
const showThemePopover = ref(false)
const showLanguageMenu = ref(false)
const showAddQuote = ref(false)
const showReportDrawer = ref(false)
const reportTargetType: Ref<ReportTargetType> = ref('general')
const reportCategory: Ref<ReportCategory> = ref('feedback')

const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
})

const switchLocale = (value: string) => {
  $switchLocale(value)
}

const shareTheme = async () => {
  if (!homeTheme.value || !import.meta.client) return
  const url = window.location.href
  if (navigator.share) {
    await navigator.share({ title: homeTheme.value.name, text: homeTheme.value.description || homeTheme.value.name, url })
    return
  }
  await navigator.clipboard?.writeText(url)
}

const runtimeConfig = useRuntimeConfig()

const navMenuItems = computed((): any[] => [
  {
    label: $t('nav.explore'),
    trailing: '',
    items: [
      {
        label: $t('nav.browse_authors'),
        to: '/authors'
      },
      {
        label: $t('nav.browse_references'),
        to: '/references'
      },
      {
        label: $t('nav.browse_quotes'),
        to: '/quotes'
      },
      {
        label: $t('nav.browse_tags'),
        to: '/tags'
      },
      {
        slot: 'search',
        label: $t('nav.search'),
        onclick: () => { showSearch.value = true }
      },
      {
        slot: 'language',
        label: $t('components.dialogs.language'),
        leading: 'i-ph-translate-duotone',
        description: $t('components.dialogs.select_language'),
        items: [
          { label: 'English' },
          { label: 'Français' }
        ]
      },
    ]
  },
  {
    label: $t('nav.contribute'),
    trailing: '',
    items: [
      ...(!user.value ? [{
        label: $t('nav.sign_in'),
        leading: 'i-lucide-log-in',
        to: '/login'
      }] : []),
      {
        label: $t('nav.add_quote'),
        leading: 'i-ph-quotes-duotone',
        onclick: () => { showAddQuote.value = true }
      },
      {
        label: $t('nav.suggest_edit'),
        leading: 'i-ph-pencil-duotone',
        onclick: () => {
          reportTargetType.value = 'quote'
          reportCategory.value = 'content'
          showReportDrawer.value = true
        }
      },
      {
        label: $t('nav.report_issue'),
        leading: 'i-ph-bug-duotone',
        onclick: () => {
          reportCategory.value = 'bug'
          showReportDrawer.value = true
        }
      },
      {
        label: $t('components.masthead.sponsor'),
        leading: 'i-ph-megaphone-duotone',
        description: $t('components.masthead.sponsor_desc'),
        to: '/sponsor'
      },
    ]
  },
  {
    label: $t('nav.about'),
    trailing: '',
    items: [
      {
        label: $t('nav.about_verbatims'),
        description: $t('nav.about_verbatims_desc'),
        to: '/about'
      },
      {
        label: $t('nav.contact'),
        leading: 'i-ph-envelope-duotone',
        onclick: () => {
          reportTargetType.value = 'general'
          reportCategory.value = 'feedback'
          showReportDrawer.value = true
        }
      },
      {
        label: $t('nav.privacy'),
        leading: 'i-ph-shield-check-duotone',
        to: '/privacy'
      },
      {
        label: $t('nav.terms'),
        leading: 'i-ph-file-text-duotone',
        to: '/terms'
      },
      {
        label: $t('nav.licenses'),
        leading: 'i-ph-book-open-duotone',
        to: '/licenses'
      },
      {
        label: $t('nav.version'),
        leading: 'i-ph-git-branch-duotone',
        description: `v${runtimeConfig.public.appVersion}`,
        to: 'https://github.com/rootasjey/verbatims',
        target: '_blank'
      },
    ]
  }
])

const handleScroll = () => {
  scrollY.value = window.scrollY
}

const handleLogoClick = (event: MouseEvent) => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

  if (route.path !== '/') {
    navigateTo('/')
    return
  }

  event.preventDefault()

  if (scrollY.value === 0) return

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const handleSearchAction = (action: string) => {
  switch (action) {
    case 'add-quote':
      showAddQuote.value = true
      break
    case 'suggest-edit':
      reportTargetType.value = 'quote'
      reportCategory.value = 'content'
      showReportDrawer.value = true
      break
    case 'report-bug':
      reportCategory.value = 'bug'
      showReportDrawer.value = true
      break
    case 'contact':
      reportTargetType.value = 'general'
      reportCategory.value = 'feedback'
      showReportDrawer.value = true
      break
  }
}

const handleQuoteAdded = () => {
  // Dialog shows a toast on success; nothing extra needed here
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  scrollY.value = window.scrollY

  const handleKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      showSearch.value = true
    }
  }

  window.addEventListener('keydown', handleKeydown)

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('keydown', handleKeydown)
  })
})
</script>

<style scoped>
.language-submenu-enter-active,
.language-submenu-leave-active {
  overflow: hidden;
  transition: opacity 160ms ease, transform 160ms ease, max-height 160ms ease;
  max-height: 6rem;
}

.language-submenu-enter-from,
.language-submenu-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .language-submenu-enter-active,
  .language-submenu-leave-active {
    transition: none;
  }
}
</style>
