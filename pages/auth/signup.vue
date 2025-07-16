<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
          <UIcon name="i-ph-quotes" class="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Create your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Join our community of quote enthusiasts
        </p>
      </div>

      <UCard>
        <div class="space-y-6">
          <!-- Error Alert -->
          <UAlert
            v-if="error"
            color="red"
            variant="soft"
            :title="error"
            :close-button="{ icon: 'i-ph-x', color: 'gray', variant: 'link', padded: false }"
            @close="error = ''"
          />

          <!-- Email/Password Sign Up Form -->
          <form @submit.prevent="signUpWithEmail" class="space-y-4">
            <div>
              <UFormGroup label="Name" name="name" required>
                <UInput
                  v-model="form.name"
                  type="text"
                  placeholder="Enter your full name"
                  required
                  :disabled="loading.email"
                />
              </UFormGroup>
            </div>

            <div>
              <UFormGroup label="Email" name="email" required>
                <UInput
                  v-model="form.email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  :disabled="loading.email"
                />
              </UFormGroup>
            </div>
            
            <div>
              <UFormGroup label="Password" name="password" required>
                <UInput
                  v-model="form.password"
                  type="password"
                  placeholder="Enter your password (min. 8 characters)"
                  required
                  :disabled="loading.email"
                />
              </UFormGroup>
            </div>

            <div>
              <UFormGroup label="Confirm Password" name="confirmPassword" required>
                <UInput
                  v-model="form.confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  required
                  :disabled="loading.email"
                />
              </UFormGroup>
            </div>

            <UButton
              type="submit"
              block
              size="lg"
              :loading="loading.email"
            >
              Create Account
            </UButton>
          </form>

          <!-- Divider -->
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          <!-- OAuth Sign In -->
          <div class="space-y-3">
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
          </div>

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
          <div class="text-center space-y-2">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?
              <NuxtLink to="/auth/signin" class="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                Sign in
              </NuxtLink>
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              By creating an account, you agree to our
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
          What you'll get
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
  title: 'Sign Up - Verbatims',
  meta: [
    { name: 'description', content: 'Create an account on Verbatims to submit quotes, create collections, and join our community.' }
  ]
})

// Redirect if already authenticated
const { user } = useUserSession()
if (user.value) {
  await navigateTo('/dashboard')
}

// Form data
const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// Loading states
const loading = ref({
  email: false,
  github: false,
  google: false
})

// Error state
const error = ref('')

// Sign up with email/password
const signUpWithEmail = async () => {
  // Validation
  if (!form.value.name || !form.value.email || !form.value.password || !form.value.confirmPassword) {
    error.value = 'Please fill in all fields'
    return
  }

  if (form.value.password.length < 8) {
    error.value = 'Password must be at least 8 characters long'
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value.email = true
  error.value = ''

  try {
    const { user } = await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        name: form.value.name,
        email: form.value.email,
        password: form.value.password
      }
    })

    // Refresh user session
    await refreshCookie('nuxt-session')
    
    // Redirect to dashboard
    await navigateTo('/dashboard')
  } catch (err: any) {
    console.error('Email sign up error:', err)
    error.value = err.data?.message || 'Failed to create account'
  } finally {
    loading.value.email = false
  }
}

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
