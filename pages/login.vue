<template>
  <div class="min-h-screen flex items-center justify-center
   bg-gray-50 dark:bg-[#141414] py-12 px-4 sm:px-6 lg:px-8">
    <!-- Desktop Layout: Horizontal -->
    <div class="flex items-center gap-8">
      <div class="hidden md:flex items-center gap-8">
        <div>
          <NuxtImg
            src="/images/quote-sample-2.jpg"
            alt="Quote Sample"
            width="400"
            height="500"
            class="mx-auto rounded-6"
          />
        </div>

        <!-- Dashed Divider -->
        <div class="h-92 border-l border-dashed border-gray-300 dark:border-gray-600"></div>
      </div>

      <!-- Login Form -->
      <div class="max-w-md w-full space-y-8">
        <div>
          <div class="w-12 h-12 bg-white dark:bg-gray-800 rounded-3 flex justify-center items-center">
            <UIcon name="i-ph-quotes" class="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 class="mt-2 text-gray-900 dark:text-white">
            Login to Verbatims
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Manage your quotes, collections, and account settings
          </p>
        </div>

        <div>
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

            <!-- Email/Password Sign In Form -->
            <form @submit.prevent="signInWithEmail" class="space-y-3">
              <div>
                <UFormGroup label="" name="email" required>
                  <UInput
                    v-model="form.email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    class="rounded-3"
                    :disabled="loading.email"
                  />
                </UFormGroup>
              </div>

              <div>
                <UFormGroup label="" name="password" required>
                  <UInput
                    v-model="form.password"
                    required
                    placeholder="Enter your password"
                    class="rounded-3"
                    :type="isPasswordVisible ? 'text' : 'password'"
                    :trailing="isPasswordVisible ? 'i-lucide-eye' : 'i-lucide-eye-off'"
                    :una="{
                      inputTrailing: 'pointer-events-auto cursor-pointer',
                    }"
                    @trailing="isPasswordVisible = !isPasswordVisible"
                    :disabled="loading.email"
                  />
                </UFormGroup>
              </div>

              <UButton
                type="submit"
                block
                size="sm"
                btn="primary"
                rounded="3"
                class="py-5 hover:scale-101 active:scale-99 transition-transform"
                :loading="loading.email"
              >
                Sign In
              </UButton>
            </form>

            <!-- Divider -->
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white dark:bg-[#141414] text-gray-500 dark:text-gray-400">
                  Or
                </span>
              </div>
            </div>

            <div>
              <ULink to="/forgot-password" class="text-sm text-primary-600 dark:text-primary-400 hover:underline font-400">
                Forgot password?
              </ULink>
              <p>
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?
                </span>
                <ULink to="/signup" class="text-sm text-primary-600 dark:text-primary-400 hover:underline font-400">
                  Sign Up
                </ULink>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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

const form = ref({
  email: '',
  password: ''
})

const isPasswordVisible = ref(false)

const loading = ref({
  email: false,
  github: false,
  google: false
})

const error = ref('')

const signInWithEmail = async () => {
  if (!form.value.email || !form.value.password) {
    error.value = 'Please fill in all fields'
    return
  }

  loading.value.email = true
  error.value = ''

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: form.value.email,
        password: form.value.password
      }
    })

    await refreshCookie('nuxt-session')
    await useUserSession().fetch()
    await navigateTo('/')
  } catch (err: any) {
    console.error('Email sign in error:', err)
    error.value = err.data?.message || 'Invalid email or password'
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
  } finally {
    loading.value[provider] = false
  }
}
</script>
