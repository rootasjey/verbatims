<template>
  <div
    class="sticky top-0 z-40 w-full hidden md:block transition-all duration-300"
    :class="scrollY === 0
      ? (route.path === '/' ? 'bg-[#F7F5EF] dark:bg-[#0C0A09]' : 'bg-[#FAFAF9] dark:bg-[#0C0A09]')
      : (route.path === '/' ? 'bg-[#F7F5EF]/80 dark:bg-[#0C0A09]/80 backdrop-blur-md' : 'bg-[#FAFAF9]/80 dark:bg-[#0C0A09]/80 backdrop-blur-md')
    "
  >
    <div class="flex items-center justify-between px-4 lg:px-8 py-3 mx-auto">
      <div class="flex items-center gap-1">
        <NuxtLink to="/" @click="handleLogoClick" class="group w-43 px-0 flex justify-start cursor-pointer active:scale-95 transition-transform relative overflow-hidden">
          <span class="font-subtitle font-700 italic tracking-[0.1rem] text-xl relative z-1 transition-colors duration-300 group-hover:text-white dark:group-hover:text-[#0C0A09]">verbatims</span>
          <span class="absolute inset-0 bg-[#0C0A09] dark:bg-[#FAFAF9] w-0 group-hover:w-full transition-all duration-300 ease-out -z-0" />
        </NuxtLink>
        <div v-if="route.path === '/' && homeTheme" class="hidden sm:block relative">
          <details ref="themeDetails" class="group">
            <summary class="list-none cursor-pointer font-sans text-xs text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-gray-100 transition-colors">
              {{ homeTheme.name }}
              <span class="ml-1 text-[var(--theme-primary,#6366f1)]">⌄</span>
            </summary>
            <div class="absolute left-0 top-8 z-20 w-72 rounded-xl bg-white dark:bg-gray-900 p-4 shadow-xl ring-1 ring-black/5 dark:ring-white/10">
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
                    :title="String($t('close'))"
                    @click="closeThemeDetails"
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
            </div>
          </details>
        </div>
        <span v-else class="hidden sm:inline font-sans text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
          {{ currentDate }}
        </span>
      </div>

      <div class="flex items-center gap-4">
        <NNavigationMenu
          :items="navMenuItems"
          indicator
        >
          <template #item-content="{ items: menuItems }">
            <ul class="grid gap-1 p-3 min-w-64 max-w-80">
              <li v-for="child in menuItems" :key="child.label">
                <NNavigationMenuContentItem v-bind="child" />
              </li>
            </ul>
          </template>
        </NNavigationMenu>

        <I18nSelector />

        <div class="flex items-center font-sans font-700 color-gray-6 dark:color-gray-4">
          <div class="flex">
            <NTooltip :content="String($t('components.masthead.search'))" placement="bottom">
              <NButton
                icon
                btn="ghost-gray"
                label="i-ph-magnifying-glass-duotone"
                @click="showSearch = true"
              />
            </NTooltip>

            <UserMenu v-if="user" :user="user" />

            <NTooltip v-else :content="String($t('components.masthead.sign_in'))">
              <NButton
                icon
                btn="ghost-gray"
                label="i-lucide-log-in"
                to="/login"
              />
            </NTooltip>
          </div>
        </div>
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
const { $t } = useI18n() as any
const { locale } = useI18nLocale()
const route = useRoute()
const { user } = useUserSession()
const homeTheme = useState<{ name: string; description: string | null } | null>('active-home-theme', () => null)
const homeStats = useState<{ quotes: number; authors: number; references: number }>('active-home-stats', () => ({ quotes: 0, authors: 0, references: 0 }))
const themeDetails = ref<HTMLDetailsElement | null>(null)
const scrollY = ref(0)
const showSearch = ref(false)
const showAddQuote = ref(false)
const showReportDrawer = ref(false)
const reportTargetType: Ref<ReportTargetType> = ref('general')
const reportCategory: Ref<ReportCategory> = ref('feedback')

const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString(locale.value === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
})

const closeThemeDetails = () => {
  if (themeDetails.value) themeDetails.value.open = false
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
        label: $t('nav.authors'),
        leading: 'i-ph-users-duotone',
        description: $t('nav.authors_desc'),
        to: '/authors'
      },
      {
        label: $t('nav.references'),
        leading: 'i-ph-book-duotone',
        description: $t('nav.references_desc'),
        to: '/references'
      },
      {
        label: $t('nav.quotes'),
        leading: 'i-ph-quotes',
        description: $t('nav.quotes_desc'),
        to: '/quotes'
      },
      {
        label: $t('nav.tags'),
        leading: 'i-ph-tag-duotone',
        description: $t('nav.tags_desc'),
        to: '/tags'
      },
    ]
  },
  {
    label: $t('nav.contribute'),
    trailing: '',
    items: [
      {
        label: $t('nav.add_quote'),
        leading: 'i-ph-quotes-duotone',
        description: $t('nav.add_quote_desc'),
        onclick: () => { showAddQuote.value = true }
      },
      {
        label: $t('nav.suggest_edit'),
        leading: 'i-ph-pencil-duotone',
        description: $t('nav.suggest_edit_desc'),
        onclick: () => {
          reportTargetType.value = 'quote'
          reportCategory.value = 'content'
          showReportDrawer.value = true
        }
      },
      {
        label: $t('nav.report_issue'),
        leading: 'i-ph-bug-duotone',
        description: $t('nav.report_issue_desc'),
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
        description: $t('nav.contact_desc'),
        onclick: () => {
          reportTargetType.value = 'general'
          reportCategory.value = 'feedback'
          showReportDrawer.value = true
        }
      },
      {
        label: $t('nav.privacy'),
        leading: 'i-ph-shield-check-duotone',
        description: $t('nav.privacy_desc'),
        to: '/privacy'
      },
      {
        label: $t('nav.terms'),
        leading: 'i-ph-file-text-duotone',
        description: $t('nav.terms_desc'),
        to: '/terms'
      },
      {
        label: $t('nav.licenses'),
        leading: 'i-ph-book-open-duotone',
        description: $t('nav.licenses_desc'),
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
