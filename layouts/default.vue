<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <AppHeader />
    
    <!-- Main Content -->
    <main class="pt-16">
      <slot />
    </main>
    
    <!-- Footer -->
    <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- Brand -->
          <div class="col-span-1 md:col-span-2">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Verbatims
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              A comprehensive, user-generated quotes database with moderation capabilities.
              Discover, share, and preserve the world's most meaningful words.
            </p>
            <div class="flex space-x-4">
              <UButton
                variant="ghost"
                size="sm"
                icon="i-simple-icons-github"
                to="https://github.com/verbatims/verbatims"
                external
              >
                GitHub
              </UButton>
              <UButton
                variant="ghost"
                size="sm"
                icon="i-simple-icons-twitter"
                to="https://twitter.com/verbatims"
                external
              >
                Twitter
              </UButton>
            </div>
          </div>
          
          <!-- Quick Links -->
          <div>
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Explore
            </h4>
            <ul class="space-y-2">
              <li>
                <NuxtLink
                  to="/"
                  class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Latest Quotes
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="/authors"
                  class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Authors
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="/references"
                  class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  References
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="/tags"
                  class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Browse Tags
                </NuxtLink>
              </li>
            </ul>
          </div>
          
          <!-- Support -->
          <div>
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Support
            </h4>
            <ul class="space-y-2">
              <li>
                <NuxtLink
                  to="/about"
                  class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  About
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="/help"
                  class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Help Center
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="/privacy"
                  class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Privacy Policy
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="/terms"
                  class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Terms of Service
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>
        
        <!-- Bottom Bar -->
        <div class="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p class="text-gray-500 dark:text-gray-400 text-sm">
            © {{ new Date().getFullYear() }} Verbatims. All rights reserved.
          </p>
          <div class="flex items-center space-x-4 mt-4 sm:mt-0">
            <span class="text-gray-500 dark:text-gray-400 text-sm">
              Made with ❤️ using Nuxt & NuxtHub
            </span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
// Set page meta
useHead({
  htmlAttrs: {
    lang: 'en'
  },
  link: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      href: '/favicon.ico'
    }
  ]
})
</script>
