<template>
  <div
    class="sticky top-0 z-4 w-full hidden md:block border-b b-dashed transition-all duration-300"
    :class="scrollY === 0
      ? 'bg-[#FAFAF9] dark:bg-[#0C0A09]'
      : 'bg-[#FAFAF9]/80 dark:bg-[#0C0A09]/80 backdrop-blur-md'
    "
  >
    <div class="flex items-center justify-between px-4 lg:px-8 py-3 mx-auto">
      <div class="flex items-center gap-1">
        <NButton btn="~" @click="handleLogoClick" rounded="none" class="group w-43 px-0 flex justify-start cursor-pointer active:scale-95 transition-transform relative overflow-hidden">
          <span class="font-subtitle font-700 italic tracking-[0.1rem] text-xl relative z-1 transition-colors duration-300 group-hover:text-white dark:group-hover:text-[#0C0A09]">verbatims</span>
          <span class="absolute inset-0 bg-[#0C0A09] dark:bg-[#FAFAF9] w-0 group-hover:w-full transition-all duration-300 ease-out -z-0" />
        </NButton>
        <div class="h-5 w-px mx-4.2 hidden sm:block" />
        <span class="hidden sm:inline font-sans text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
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
                link
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
const { $t } = useI18n()
const route = useRoute()
const { user } = useUserSession()
const scrollY = ref(0)
const showSearch = ref(false)
const showAddQuote = ref(false)
const showReportDrawer = ref(false)
const reportTargetType: Ref<ReportTargetType> = ref('general')
const reportCategory: Ref<ReportCategory> = ref('feedback')

const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
})

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
