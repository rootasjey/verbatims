<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
          <UIcon name="i-ph-quotes" class="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Sign in to Verbatims
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Join our community of quote enthusiasts
        </p>
      </div>

      <UCard>
        <div class="space-y-4">
          <!-- GitHub Sign In -->
          <UButton
            block
            size="lg"
            variant="outline"
            icon
            label="i-simple-icons-github"
            :loading="loading.github"
            @click="signInWith('github')"
          >
            Continue with GitHub
          </UButton>

          <!-- Google Sign In -->
          <UButton
            block
            size="lg"
            variant="outline"
            icon
            label="i-simple-icons-google"
            :loading="loading.google"
            @click="signInWith('google')"
          >
            Continue with Google
          </UButton>

          <!-- Divider -->
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Or continue as guest
              </span>
            </div>
          </div>

          <!-- Guest Access -->
          <UButton
            block
            size="lg"
            variant="ghost"
            icon
            label="i-ph-user"
            @click="continueAsGuest"
          >
            Browse as Guest
          </UButton>
        </div>

        <template #footer>
          <div class="text-center">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              By signing in, you agree to our
              <NuxtLink to="/terms" class="text-primary-600 dark:text-primary-400 hover:underline">
                Terms of Service
              </NuxtLink>
              and
              <NuxtLink to="/privacy" class="text-primary-600 dark:text-primary-400 hover:underline">
                Privacy Policy
              </NuxtLink>
            </p>
          </div>
        </template>
      </UCard>

      <!-- Features -->
      <div class="mt-8">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4 text-center">
          Why sign in?
        </h3>
        <div class="grid grid-cols-1 gap-4">
          <div class="flex items-start space-x-3">
            <UIcon name="i-ph-plus-circle" class="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Submit Quotes</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Share your favorite quotes with the community</p>
            </div>
          </div>
          <div class="flex items-start space-x-3">
            <UIcon name="i-ph-heart" class="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Like & Save</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Create collections of your favorite quotes</p>
            </div>
          </div>
          <div class="flex items-start space-x-3">
            <UIcon name="i-ph-user-circle" class="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Personal Dashboard</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Track your submissions and activity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// SEO
useHead({
  title: 'Sign In - Verbatims',
  meta: [
    { name: 'description', content: 'Sign in to Verbatims to submit quotes, create collections, and join our community.' }
  ]
})

// Redirect if already authenticated
const { user } = useUserSession()
if (user.value) {
  await navigateTo('/dashboard')
}

// Loading states
const loading = ref({
  github: false,
  google: false
})

// Sign in with OAuth provider
const signInWith = async (provider: 'github' | 'google') => {
  loading.value[provider] = true
  try {
    await navigateTo(`/auth/${provider}`, { external: true })
  } catch (error) {
    console.error(`${provider} sign in error:`, error)
    // TODO: Show error toast
  } finally {
    loading.value[provider] = false
  }
}

// Continue as guest
const continueAsGuest = () => {
  navigateTo('/')
}
</script>
