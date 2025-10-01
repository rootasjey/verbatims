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
        <UButton btn="~" @click="handleLogoClick" class="cursor-pointer hover:scale-105 active:scale-95 transition-transform">
          <AppIcon icon :size="24" />
        </UButton>

        <!-- Page Title for Admin/Dashboard -->
        <div v-if="shouldShowPageTitle" class="flex items-center space-x-3">
          <div class="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
          <div class="flex items-center space-x-2">
            <h1 class="font-title text-lg font-600 text-gray-900 dark:text-white">
              {{ pageHeader.title }}
            </h1>
            <UBadge
              :color="pageHeader.section.value === 'admin' ? 'red' : 'blue'"
              variant="subtle"
              size="xs"
              class="uppercase"
            >
              {{ pageHeader.section.value }}
            </UBadge>
          </div>
        </div>
      </div>

      <UNavigationMenu
        v-if="!isMobile"
        :items="navMenuItems"
        indicator
        :class="{ 'ml-24': !shouldShowPageTitle }"
      />

      <div class="flex items-center font-sans font-700 color-gray-6 dark:color-gray-4">
        <div class="flex">
          <UTooltip content="Add Quote (Ctrl/Cmd+N)" placement="bottom">
            <UButton
            icon
            btn="ghost-gray"
            label="i-ph-quotes-duotone"
            @click="showAddQuote = true"
            />
          </UTooltip>

          <UTooltip content="Search (Ctrl/Cmd+K)" placement="bottom">
            <UButton
              icon
              btn="ghost-gray"
              label="i-ph-magnifying-glass-duotone"
              @click="showSearch = true"
            />
          </UTooltip>

          <UserMenu v-if="user" :user="user" />
          <UButton v-else btn="light:soft dark:soft-blue" to="/login" class="font-800 relative left-2">
            Sign in
          </UButton>
        </div>
      </div>
    </div>
  </nav>

  <SearchBox 
    :model-value="showSearch" 
    @update:model-value="showSearch = $event"
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
import type { ReportTargetType, ReportCategory } from '~/types';
const config = useRuntimeConfig()
const version: string = String((config.public as any).appVersion || '')
import { useStorage } from '@vueuse/core'

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

const navMenuItems = computed(() => [
  {
    label: 'Explore',
    trailing: 'i-ph-dot-bold',
    items: [
      {
        label: 'Authors',
        leading: 'i-ph-users-duotone',
        description: 'Browse quotes by author',
        to: '/authors'
      },
      {
        label: 'References',
        leading: 'i-ph-book-duotone',
        description: 'Explore books, films, and more',
        to: '/references'
      },
      {
        label: 'Quotes',
        leading: 'i-ph-quotes',
        description: 'Explore quotes from various sources',
        to: '/quotes'
      },
    ]
  },
  {
    label: 'Contribute',
    trailing: 'i-ph-dot-bold',
    items: [
      {
        label: 'Add Quote',
        leading: 'i-ph-quotes-duotone',
        description: 'Contribute a new quote',
        onclick: () => { showAddQuote.value = true }
      },
      {
        label: 'Suggest Edit',
        leading: 'i-ph-pencil-duotone',
        description: 'Suggest an edit to an existing quote',
        onclick: () => {
          reportTargetType.value = 'quote'
          reportCategory.value = 'content'
          showReportDrawer.value = true
        }
      },
      {
        label: 'Report Issue',
        leading: 'i-ph-bug-duotone',
        description: 'Report a problem or bug',
        onclick: () => {
          reportCategory.value = 'bug'
          showReportDrawer.value = true
        }
      },
    ]
  },
  {
    label: 'About',
    trailing: 'i-ph-dot-bold',
    items: [
      {
        label: 'About Verbatims',
        description: 'Learn more about Verbatims',
        to: '/about'
      },
      {
        label: 'Contact',
        description: 'Get in touch with us',
        onclick: () => {
          reportTargetType.value = 'general'
          reportCategory.value = 'feedback'
          showReportDrawer.value = true
        }
      },
      {
        label: 'Privacy Policy',
        leading: 'i-ph-shield-check-duotone',
        description: 'Read our privacy policy',
        to: '/privacy'
      },
      {
        label: 'Terms',
        leading: 'i-ph-file-text-duotone',
        description: 'Read our terms of service',
        to: '/terms'
      },
      {
        label: 'Licenses',
        leading: 'i-ph-book-open-duotone',
        description: 'Read our licenses',
        to: '/licenses'
      },
      {
        label: 'Version',
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

onMounted(() => {
  const handler = (e: KeyboardEvent) => {
    // Cmd+K (Mac) or Ctrl+K (Win/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      showSearch.value = true
    }
    // Cmd+N (Mac) or Ctrl+N (Win/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
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