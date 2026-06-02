<template>
  <div
    :class="[
      'sticky top-0 z-4 w-full border-b b-dashed transition-all duration-300',
      scrollY === 0
        ? 'bg-[#FAFAF9] dark:bg-[#0C0A09]'
        : 'bg-[#FAFAF9]/80 dark:bg-[#0C0A09]/80 backdrop-blur-md'
    ]"
  >
    <div class="flex items-center justify-between px-4 lg:px-8 py-3 mx-auto">
      <div class="flex items-center gap-4">
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
            <NTooltip content="Search (Ctrl/Cmd+K)" placement="bottom">
              <NButton
                icon
                btn="ghost-gray"
                label="i-ph-magnifying-glass-duotone"
                @click="showSearch = true"
              />
            </NTooltip>

            <UserMenu v-if="user" :user="user" />
            <NButton v-else btn="light:soft" to="/login" rounded="4" class="font-800 relative left-2 dark:border hover:color-blue-6 hover:scale-102 active:scale-95 transition-transform">
              Sign in
            </NButton>
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
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const navMenuItems = computed(() => [
  {
    label: 'Explore',
    trailing: '',
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
      {
        label: 'Tags',
        leading: 'i-ph-tag-duotone',
        description: 'Browse quote topics and themes',
        to: '/tags'
      },
    ]
  },
  {
    label: 'Contribute',
    trailing: '',
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
    trailing: '',
    items: [
      {
        label: 'About Verbatims',
        description: 'Learn more about Verbatims',
        to: '/about'
      },
      {
        label: 'Contact',
        leading: 'i-ph-envelope-duotone',
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
        description: '0.47.0',
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
