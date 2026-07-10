<template>
  <nav
    :class="[
      'top-0 w-full z-4 transition-all duration-300 bg-[#FAFAF9] dark:bg-[#0C0A09]/70',
      'border-b b-dashed',
      scrollY === 0 ? 'absolute' : 'fixed backdrop-blur-md',
      // Optional left padding to account for layout sidebars (e.g., dashboard/admin)
      props.leftPadClass
    ]"
  >
    <!-- Main Navigation Bar -->
    <div class="flex justify-between items-center p-4">
      <div class="flex items-center space-x-4">
        <NButton btn="~" @click="handleLogoClick" rounded="none" class="group px-0 flex cursor-pointer active:scale-95 transition-transform relative overflow-hidden">
          <span class="font-subtitle font-700 italic tracking-[0.1rem] text-xl relative z-1 transition-colors duration-300 group-hover:text-white dark:group-hover:text-[#0C0A09]">verbatims</span>
          <span class="absolute inset-0 bg-[#0C0A09] dark:bg-[#FAFAF9] w-0 group-hover:w-full transition-all duration-300 ease-out -z-0" />
        </NButton>

        <!-- Page Title for Admin/Dashboard -->
        <div v-if="shouldShowPageTitle" class="flex items-center gap-3">
          <div class="h-5 w-px bg-gray-300 dark:bg-gray-600" />
          <h1 class="font-sans text-xs uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {{ pageHeader.title }}
          </h1>
        </div>
      </div>

      <NNavigationMenu
        v-if="!isMobile && shouldShowNavMenu"
        :items="navMenuItems"
        indicator
        :class="{ 'ml-24': !shouldShowPageTitle }"
      />

      <div class="flex items-center font-sans font-700 color-gray-6 dark:color-gray-4">
        <div class="flex">
          <NTooltip v-if="user" :content="$t('nav.add_quote') + ' (Ctrl/Cmd+N)'" placement="bottom">
            <NButton
            icon
            btn="ghost-gray"
            label="i-ph-quotes-duotone"
            @click="showAddQuote = true"
            />
          </NTooltip>

          <NTooltip :content="$t('nav.search') + ' (Ctrl/Cmd+K)'" placement="bottom">
            <NButton
              icon
              btn="ghost-gray"
              label="i-ph-magnifying-glass-duotone"
              @click="showSearch = true"
            />
          </NTooltip>

          <I18nSelector />

          <UserMenu v-if="user" :user="user" />

          <NTooltip v-else :content="$ts('nav.sign_in')">
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
  </nav>

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

<script lang="ts" setup>
  import { useStorage } from '@vueuse/core'

const { $t, $ts } = useI18n()
  
const config = useRuntimeConfig()
const version: string = String((config.public as any).appVersion || '')


const { isMobile } = useMobileDetection()

interface Props {
  // Responsive utility classes to pad the header from the left (e.g., 'lg:pl-64' | 'lg:pl-16')
  leftPadClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  leftPadClass: ''
})

const { user } = useUserSession()
const scrollY = ref(0)
const route = useRoute()
const pageHeader = usePageHeader()
const showHomeTitle = useStorage('verbatims.show_home_title', true)

const showSearch = ref(false)
const showAddQuote = ref(false)
const showReportDrawer = ref(false)
const reportTargetType: Ref<ReportTargetType> = ref('general')
const reportCategory: Ref<ReportCategory> = ref('feedback')

// Only show page title for admin and dashboard pages
const shouldShowPageTitle = computed(() => {
  return pageHeader.shouldShow.value &&
         (pageHeader.section.value === 'admin' || pageHeader.section.value === 'dashboard')
})

// Hide nav menu on admin/dashboard — out of place in a management context
const shouldShowNavMenu = computed(() => {
  return pageHeader.section.value !== 'admin' && pageHeader.section.value !== 'dashboard'
})

const navMenuItems = computed(() => [
  {
    label: $ts('nav.explore'),
    trailing: 'i-ph-dot-bold',
    items: [
      {
        label: $ts('nav.authors'),
        leading: 'i-ph-users-duotone',
        description: $ts('nav.authors_desc'),
        to: '/authors'
      },
      {
        label: $ts('nav.references'),
        leading: 'i-ph-book-duotone',
        description: $ts('nav.references_desc'),
        to: '/references'
      },
      {
        label: $ts('nav.quotes'),
        leading: 'i-ph-quotes',
        description: $ts('nav.quotes_desc'),
        to: '/quotes'
      },
      {
        label: $ts('nav.tags'),
        leading: 'i-ph-tag-duotone',
        description: $ts('nav.tags_desc'),
        to: '/tags'
      },
    ]
  },
  {
    label: $ts('nav.contribute'),
    trailing: 'i-ph-dot-bold',
    items: [
      ...(user ? [{
        label: $ts('nav.add_quote'),
        leading: 'i-ph-quotes-duotone',
        description: $ts('nav.add_quote_desc'),
        onclick: () => { showAddQuote.value = true }
      }] : []),
      {
        label: $ts('nav.suggest_edit'),
        leading: 'i-ph-pencil-duotone',
        description: $ts('nav.suggest_edit_desc'),
        onclick: () => {
          reportTargetType.value = 'quote'
          reportCategory.value = 'content'
          showReportDrawer.value = true
        }
      },
      {
        label: $ts('nav.report_issue'),
        leading: 'i-ph-bug-duotone',
        description: $ts('nav.report_issue_desc'),
        onclick: () => {
          reportCategory.value = 'bug'
          showReportDrawer.value = true
        }
      },
    ]
  },
  {
    label: $ts('nav.about'),
    trailing: 'i-ph-dot-bold',
    items: [
      {
        label: $ts('nav.about_verbatims'),
        description: $ts('nav.about_verbatims_desc'),
        to: '/about'
      },
      {
        label: $ts('nav.contact'),
        description: $ts('nav.contact_desc'),
        onclick: () => {
          reportTargetType.value = 'general'
          reportCategory.value = 'feedback'
          showReportDrawer.value = true
        }
      },
      {
        label: $ts('nav.privacy'),
        leading: 'i-ph-shield-check-duotone',
        description: $ts('nav.privacy_desc'),
        to: '/privacy'
      },
      {
        label: $ts('nav.terms'),
        leading: 'i-ph-file-text-duotone',
        description: $ts('nav.terms_desc'),
        to: '/terms'
      },
      {
        label: $ts('nav.developers'),
        leading: 'i-ph-code-duotone',
        description: $ts('nav.developers_desc'),
        to: '/developers'
      },
      {
        label: $ts('nav.licenses'),
        leading: 'i-ph-book-open-duotone',
        description: $ts('nav.licenses_desc'),
        to: '/licenses'
      },
      {
        label: $ts('nav.version'),
        leading: 'i-ph-git-branch-duotone',
        description: version,
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

  // If we're on the home page, prevent navigation.
  event.preventDefault()

  if (scrollY.value === 0) {
    showHomeTitle.value = !showHomeTitle.value
    return
  }

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  scrollY.value = window.scrollY

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })
})

const handleQuoteAdded = () => {
  // Optionally refresh page data or show success message
  // The dialog already shows a toast, so we don't need to do anything here
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

onMounted(() => {
  const handler = (e: KeyboardEvent) => {
    // Cmd+K (Mac) or Ctrl+K (Win/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      showSearch.value = true
    }
    // Cmd+N (Mac) or Ctrl+N (Win/Linux)
    if (user && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault()
      showAddQuote.value = true
    }
  }

  window.addEventListener('keydown', handler)
  onUnmounted(() => {
    window.removeEventListener('keydown', handler)
  })
})
</script>

