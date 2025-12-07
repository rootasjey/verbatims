<template>
  <!-- Desktop layout: signup form over large alphabet background -->
  <div v-if="!isMobile" class="relative min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0C0A09] py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
    <!-- Large repeating alphabet background -->
    <div class="absolute inset-0 z-0 w-full h-full overflow-hidden flex items-start justify-start">
      <div class="flex flex-wrap w-full h-full">
        <template v-for="i in 90" :key="i">
          <span class="mx-2 my-1">
            <span
              class="text-[10vw] font-extrabold text-gray-200 dark:text-gray-800 opacity-35 leading-none transition-all duration-300 cursor-pointer hover:text-white hover:opacity-80 hover:drop-shadow-[0_0_16px_#687FE5] dark:hover:text-primary-400 dark:hover:drop-shadow-[0_0_16px_#687FE5]"
              @click="appendLetterToInput(String.fromCharCode(65 + ((i - 1) % 26)))"
            >
              {{ String.fromCharCode(65 + ((i - 1) % 26)) }}
            </span>
          </span>
        </template>
      </div>
    </div>

    <!-- Signup Form -->
    <div class="relative z-10 max-w-md w-full space-y-8 p-8 bg-white dark:bg-[#18181B] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
      <div>
        <h3 class="mt-2 font-title text-size-8 uppercase font-600 text-gray-900 dark:text-white text-center">
          Create your <span class="font-300">Verbatims</span> account
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
          Join our community of quote enthusiasts
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
          <!-- Email/Password Sign Up Form -->
          <form @submit.prevent="signUpWithEmail" class="space-y-3">
            <div>
              <UFormGroup label="" name="name" required>
                <UInput
                  v-model="form.name"
                  type="text"
                  placeholder="Enter your full name"
                  required
                  class="rounded-3"
                  :disabled="loading.email"
                  @focus="handleInputFocus('name')"
                />
              </UFormGroup>
            </div>
            <div>
              <UFormGroup label="" name="email" required>
                <UInput
                  v-model="form.email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  class="rounded-3"
                  :disabled="loading.email"
                  @focus="handleInputFocus('email')"
                />
              </UFormGroup>
            </div>
            <div>
              <UFormGroup label="" name="password" required>
                <UInput
                  v-model="form.password"
                  required
                  placeholder="Enter your password (min. 8 characters)"
                  class="rounded-3"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :trailing="isPasswordVisible ? 'i-lucide-eye' : 'i-lucide-eye-off'"
                  :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
                  @trailing="isPasswordVisible = !isPasswordVisible"
                  :disabled="loading.email"
                  @focus="handleInputFocus('password')"
                />
              </UFormGroup>
            </div>
            <div>
              <UFormGroup label="" name="confirmPassword" required>
                <UInput
                  v-model="form.confirmPassword"
                  required
                  placeholder="Confirm your password"
                  class="rounded-3"
                  :type="isConfirmPasswordVisible ? 'text' : 'password'"
                  :trailing="isConfirmPasswordVisible ? 'i-lucide-eye' : 'i-lucide-eye-off'"
                  :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
                  @trailing="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                  :disabled="loading.email"
                  @focus="handleInputFocus('confirmPassword')"
                />
              </UFormGroup>
            </div>
            <UButton
              type="submit"
              block
              size="sm"
              btn="light:solid dark:soft-blue"
              rounded="3"
              class="py-5 hover:scale-101 active:scale-99 transition-transform"
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
              <span class="px-2 bg-white dark:bg-[#18181B] text-gray-500 dark:text-gray-400">
                Or
              </span>
            </div>
          </div>
          <div>
            <p>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?
              </span>
              <ULink to="/login" class="text-sm text-primary-600 dark:text-lime hover:underline font-400">
                Sign In
              </ULink>
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
              By creating an account, you agree to our
              <ULink to="/terms" class="text-primary-600 dark:text-primary-400 hover:underline">
                Terms of Service
              </ULink>
              and
              <ULink to="/privacy" class="text-primary-600 dark:text-primary-400 hover:underline">
                Privacy Policy
              </ULink>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Mobile, colorful layout -->
  <div v-else class="min-h-screen flex flex-col bg-gradient-to-b from-purple-50 via-pink-50 to-amber-50 dark:from-#0B0A09 dark:via-#0C0A09 dark:to-black">
    <!-- Decorative gradient header inspired by MobileHeroSection -->
    <div class="relative px-6 pt-10 pb-12 rounded-b-8 bg-gradient-to-br from-green-50/80 to-purple-50/80 dark:from-#0B0A09 dark:to-black">
      <!-- floating blobs -->
      <div class="pointer-events-none absolute -top-12 -right-8 w-44 h-44 rounded-full bg-gradient-to-br from-#687FE5/40 to-pink-400/40 blur-2xl" />
      <div class="pointer-events-none absolute top-6 -left-10 w-36 h-36 rounded-full bg-gradient-to-br from-amber-300/40 to-rose-300/40 blur-2xl" />

      <div class="relative z-1">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 flex items-center justify-center">
            <UIcon name="i-ph-quotes" class="w-6 h-6 text-#687FE5" />
          </div>
          <div>
            <p class="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">Get started</p>
            <h2 class="font-serif text-2xl text-gray-900 dark:text-gray-100 leading-tight">Create your Verbatims account</h2>
          </div>
        </div>

        <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Save favorite lines, build collections, and share quotes.
        </p>

        <div class="mt-6 bg-white/85 dark:bg-gray-900/80 backdrop-blur-md rounded-4 p-4 border border-gray-200/60 dark:border-gray-800/60 shadow-lg/30">
          <!-- Error Alert -->
          <UAlert
            v-if="error"
            color="red"
            variant="soft"
            :title="error"
            :close-button="{ icon: 'i-ph-x', color: 'gray', variant: 'link', padded: false }"
            class="mb-3"
            @close="error = ''"
          />

          <!-- Email/Password Sign Up Form -->
          <form @submit.prevent="signUpWithEmail" class="space-y-3">
            <UFormGroup label="" name="name" required>
              <UInput
                v-model="form.name"
                type="text"
                placeholder="Enter your full name"
                required
                class="rounded-3"
                :disabled="loading.email"
              />
            </UFormGroup>

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

            <UFormGroup label="" name="password" required>
              <UInput
                v-model="form.password"
                required
                placeholder="Enter your password (min. 8 characters)"
                class="rounded-3"
                :type="isPasswordVisible ? 'text' : 'password'"
                :trailing="isPasswordVisible ? 'i-lucide-eye' : 'i-lucide-eye-off'"
                :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
                @trailing="isPasswordVisible = !isPasswordVisible"
                :disabled="loading.email"
              />
            </UFormGroup>

            <UFormGroup label="" name="confirmPassword" required>
              <UInput
                v-model="form.confirmPassword"
                required
                placeholder="Confirm your password"
                class="rounded-3"
                :type="isConfirmPasswordVisible ? 'text' : 'password'"
                :trailing="isConfirmPasswordVisible ? 'i-lucide-eye' : 'i-lucide-eye-off'"
                :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
                @trailing="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                :disabled="loading.email"
              />
            </UFormGroup>

            <UButton
              type="submit"
              block
              size="sm"
              btn="primary"
              rounded="3"
              class="py-5 hover:scale-101 active:scale-99 transition-transform"
              :loading="loading.email"
            >
              Create Account
            </UButton>
          </form>

          <!-- Divider -->
          <div class="relative my-4">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200 dark:border-gray-800" />
            </div>
            <div class="relative flex justify-center text-xs">
              <span class="px-2 bg-white/85 dark:bg-gray-900/80 text-gray-500 dark:text-gray-400">Or continue with</span>
            </div>
          </div>

          <!-- Social providers -->
          <div class="grid grid-cols-2 gap-3">
            <UButton btn="soft-gray" :loading="loading.github" @click="signInWith('github')">
              <template #leading>
                <NIcon name="i-ph-github-logo" />
              </template>
              GitHub
            </UButton>
            <UButton btn="soft-blue" :loading="loading.google" @click="signInWith('google')">
              <template #leading>
                <NIcon name="i-ph-google-logo" />
              </template>
              Google
            </UButton>
          </div>

          <p class="mt-4 text-xs text-gray-500 dark:text-gray-400">
            By creating an account, you agree to our
            <ULink to="/terms" class="text-primary-600 dark:text-primary-400 hover:underline">Terms of Service</ULink>
            and
            <ULink to="/privacy" class="text-primary-600 dark:text-primary-400 hover:underline">Privacy Policy</ULink>.
          </p>
        </div>
      </div>
    </div>

    <!-- Bottom callout -->
    <div class="px-6 pb-10 pt-2">
      <div class="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-dashed border-gray-300 dark:border-gray-800 rounded-4 p-4 flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-700 dark:text-gray-300">Already joined?</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Sign in and start saving quotes.</p>
        </div>
        <UButton size="sm" btn="light:soft dark:soft-blue" to="/login" class="font-600">Sign in</UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const lastFocusedInput = ref<'name' | 'email' | 'password' | 'confirmPassword'>('name')

function handleInputFocus(input: 'name' | 'email' | 'password' | 'confirmPassword') {
  lastFocusedInput.value = input
}

function appendLetterToInput(letter: string) {
  if (lastFocusedInput.value === 'password') {
    form.value.password += letter
  } else if (lastFocusedInput.value === 'confirmPassword') {
    form.value.confirmPassword += letter
  } else if (lastFocusedInput.value === 'email') {
    form.value.email += letter
  } else {
    form.value.name += letter
  }
}
useHead({
  title: 'Sign Up - Verbatims',
  meta: [
    { name: 'description', content: 'Create an account on Verbatims to submit quotes, create collections, and join our community.' }
  ]
})

// Use index-style dynamic layout switching
definePageMeta({
  layout: 'default'
})

// Redirect if already authenticated
const { user } = useUserSession()
if (user.value) {
  await navigateTo('/dashboard')
}

const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()
const hydrated = ref(false)

onNuxtReady(() => {
  hydrated.value = true
  setPageLayout(currentLayout.value)
})

watch(currentLayout, (newLayout) => {
  if (hydrated.value) setPageLayout(newLayout)
})

const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const isPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)

// Loading states
const loading = ref({
  email: false,
  github: false,
  google: false
})

const error = ref('')

const signUpWithEmail = async () => {
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

    await refreshCookie('nuxt-session')
    await navigateTo('/')
  } catch (err: any) {
    console.error('Email sign up error:', err)
    error.value = err.data?.message || 'Failed to create account'
  } finally {
    loading.value.email = false
  }
}

// Sign in with OAuth provider (used for signup continuation)
const signInWith = async (provider: 'github' | 'google') => {
  loading.value[provider] = true
  try {
    await navigateTo(`/auth/${provider}`, { external: true })
  } catch (error) {
    console.error(`${provider} auth error:`, error)
  } finally {
    loading.value[provider] = false
  }
}
</script>
