<template>
  <nav
    :class="[
      'top-0 w-full z-4 transition-all duration-300',
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
          <AppIcon />
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

      <div class="flex items-center space-x-3 
        font-subtitle font-700 color-gray-6 dark:color-gray-4 mr-8">
        <div class="flex space-x-3 mr-3">
          <UButton
            icon
            btn="ghost-gray"
            label="i-ph-magnifying-glass-bold"
            @click="showSearch = true"
          />

          <UButton
            icon
            btn="ghost-gray"
            label="i-ph-plus-bold"
            @click="showAddQuote = true"
            title="Add Quote (Ctrl/Cmd+N)"
          />
        </div>

        <div class="flex space-x-8">
          <NuxtLink
            to="/authors"
            class="hover:color-gray-8 dark:hover:color-gray-2 transition-colors cursor-pointer"
          >
            Authors
          </NuxtLink>
          <NuxtLink
            to="/references"
            class="hover:color-gray-8 dark:hover:color-gray-2 transition-colors cursor-pointer"
          >
            References
          </NuxtLink>
          <span>About</span>
        </div>

        <UserMenu v-if="user" :user="user" />
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
</template>

<script lang="ts" setup>
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
const showSearch = ref(false)
const showAddQuote = ref(false)

// Page header functionality
const pageHeader = usePageHeader()

// Only show page title for admin and dashboard pages
const shouldShowPageTitle = computed(() => {
  return pageHeader.shouldShow.value &&
         (pageHeader.section.value === 'admin' || pageHeader.section.value === 'dashboard')
})

const handleScroll = () => {
  scrollY.value = window.scrollY
}

const handleLogoClick = (event: MouseEvent) => {
  if (route.path !== '/') {
    navigateTo('/')
    return
  }

  // If we're on the home page, prevent navigation and scroll to top instead
  event.preventDefault()
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// Set up scroll listener on mount
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  // Initialize scroll position
  scrollY.value = window.scrollY

  // Clean up scroll listener on unmount
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