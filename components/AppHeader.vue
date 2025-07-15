<template>
  <header class="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <NuxtLink
            to="/"
            class="flex items-center space-x-2 text-xl font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            <UIcon name="i-ph-quotes" class="w-6 h-6" />
            <span>Verbatims</span>
          </NuxtLink>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-8">
          <NuxtLink
            to="/"
            class="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors"
            active-class="text-primary-600 dark:text-primary-400"
          >
            Home
          </NuxtLink>
          <NuxtLink
            to="/authors"
            class="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors"
            active-class="text-primary-600 dark:text-primary-400"
          >
            Authors
          </NuxtLink>
          <NuxtLink
            to="/references"
            class="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors"
            active-class="text-primary-600 dark:text-primary-400"
          >
            References
          </NuxtLink>
          <NuxtLink
            to="/tags"
            class="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors"
            active-class="text-primary-600 dark:text-primary-400"
          >
            Browse Tags
          </NuxtLink>
        </div>

        <!-- Right side actions -->
        <div class="flex items-center space-x-2">
          <!-- Search -->
          <UButton
            variant="ghost"
            icon="i-ph-magnifying-glass"
            size="sm"
            @click="openSearch"
            class="hidden sm:flex"
          />

          <!-- Submit Quote -->
          <UButton
            variant="outline"
            icon="i-ph-plus"
            size="sm"
            @click="openSubmitModal"
            class="hidden sm:flex"
          >
            Submit Quote
          </UButton>

          <!-- Theme Toggle -->
          <UButton
            variant="ghost"
            :icon="colorMode.value === 'dark' ? 'i-ph-sun' : 'i-ph-moon'"
            size="sm"
            @click="toggleTheme"
          />

          <!-- User Menu or Sign In -->
          <UserMenu v-if="user" :user="user" />
          <UButton v-else variant="solid" size="sm" @click="signIn">
            Sign In
          </UButton>

          <!-- Mobile Menu Button -->
          <UButton
            variant="ghost"
            icon="i-ph-list"
            size="sm"
            @click="toggleMobileMenu"
            class="md:hidden"
          />
        </div>
      </div>

      <!-- Mobile Navigation -->
      <div v-if="showMobileMenu" class="md:hidden border-t border-gray-200 dark:border-gray-700">
        <div class="px-2 pt-2 pb-3 space-y-1">
          <NuxtLink
            to="/"
            class="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
            active-class="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
            @click="showMobileMenu = false"
          >
            Home
          </NuxtLink>
          <NuxtLink
            to="/authors"
            class="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
            active-class="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
            @click="showMobileMenu = false"
          >
            Authors
          </NuxtLink>
          <NuxtLink
            to="/references"
            class="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
            active-class="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
            @click="showMobileMenu = false"
          >
            References
          </NuxtLink>
          <NuxtLink
            to="/tags"
            class="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
            active-class="text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
            @click="showMobileMenu = false"
          >
            Browse Tags
          </NuxtLink>

          <!-- Mobile Actions -->
          <div class="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
            <UButton
              variant="outline"
              icon="i-ph-magnifying-glass"
              size="sm"
              @click="openSearch; showMobileMenu = false"
              class="w-full mb-2"
            >
              Search Quotes
            </UButton>
            <UButton
              variant="solid"
              icon="i-ph-plus"
              size="sm"
              @click="openSubmitModal; showMobileMenu = false"
              class="w-full"
            >
              Submit Quote
            </UButton>
          </div>
        </div>
      </div>
    </nav>

    <!-- Search Modal -->
    <SearchModal v-model="showSearchModal" />

    <!-- Submit Quote Modal -->
    <SubmitQuoteModal v-model="showSubmitModal" />
  </header>
</template>

<script setup>
const { user } = useUserSession()
const colorMode = useColorMode()

// Mobile menu state
const showMobileMenu = ref(false)
const showSearchModal = ref(false)
const showSubmitModal = ref(false)

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
}

const openSearch = () => {
  showSearchModal.value = true
}

const openSubmitModal = () => {
  showSubmitModal.value = true
}

const signIn = () => {
  navigateTo('/auth/signin')
}

// Close mobile menu when clicking outside
onClickOutside(template, () => {
  showMobileMenu.value = false
})
</script>