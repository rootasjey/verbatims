<template>
  <nav 
    :class="[
      'top-0 w-full z-4 transition-all duration-300',
      'flex justify-between p-4',
      'border-b b-dashed',
      scrollY === 0 ? 'absolute' : 'fixed backdrop-blur-md'
    ]"
  >
    <UButton btn="~" @click="handleLogoClick" class="cursor-pointer hover:scale-105 active:scale-95 transition-transform">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
        <path fill="currentColor" d="M5 3a1 1 0 0 0-2 0v6a9 9 0 1 0 18 0V3a1 1 0 1 0-2 0v6A7 7 0 1 1 5 9zM4 20a1 1 0 1 0 0 2h16a1 1 0 1 0 0-2z"/></svg>
    </UButton>
    
    <div class="flex items-center space-x-6 font-title font-600 color-gray-6 dark:color-gray-4 mr-8">
      <UButton 
        icon
        btn="ghost"
        label="i-ph-magnifying-glass-bold"
        @click="showSearch = true"
      />
      
      <UButton 
        icon
        btn="ghost"
        label="i-ph-plus-bold"
        @click="showAddQuote = true"
        title="Add Quote (Ctrl/Cmd+N)"
      />
      
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
const { user } = useUserSession()
const colorMode = useColorMode()
const scrollY = ref(0)
const route = useRoute()
const showSearch = ref(false)
const showAddQuote = ref(false)

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