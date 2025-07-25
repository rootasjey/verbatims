<template>
  <nav 
    :class="[
      'top-0 w-full z-50 transition-all duration-300',
      'flex justify-between p-4',
      scrollY === 0 ? 'absolute' : 'fixed backdrop-blur-md border-b border-white/20 bg-black/20'
    ]"
  >
    <UButton btn="~" @click="handleLogoClick" class="cursor-pointer hover:scale-105 active:scale-95 transition-transform">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Solar by 480 Design - https://creativecommons.org/licenses/by/4.0/ --><path fill="currentColor" d="M5 3a1 1 0 0 0-2 0v6a9 9 0 1 0 18 0V3a1 1 0 1 0-2 0v6A7 7 0 1 1 5 9zM4 20a1 1 0 1 0 0 2h16a1 1 0 1 0 0-2z"/></svg>
    </UButton>
    
    <div class="flex space-x-6 font-subtitle font-600 color-gray-6 dark:color-gray-4 mr-8">
      <span>Search</span>
      <NuxtLink
        to="/authors"
        class="hover:color-gray-8 dark:hover:color-gray-2 transition-colors cursor-pointer"
      >
        Authors
      </NuxtLink>
      <span>References</span>
      <span>Contact</span>
      <span>About</span>
    </div>
  </nav>
</template>

<script setup>
const { user } = useUserSession()
const colorMode = useColorMode()
const scrollY = ref(0)
const route = useRoute()

const handleScroll = () => {
  scrollY.value = window.scrollY
}

const handleLogoClick = (event) => {
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
})

// Clean up scroll listener on unmount
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

</script>