<template>
  <!-- Desktop layout: login form over large quote background -->
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
    
    <!-- Login Form -->
    <div class="relative z-10 max-w-md w-full space-y-8 p-8 bg-white dark:bg-[#18181B] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
      <div>
        <h3 class="mt-2 font-title text-size-8 uppercase font-600 text-gray-900 dark:text-white text-center">
          Sign in <span class="font-300">to Verbatims</span>
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
          Manage your quotes, collections, and account settings
        </p>
      </div>
      <div>
        <div class="space-y-6">
          <!-- Error Alert -->
          <NAlert
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
              <NFormGroup label="" name="email" required>
                <NInput
                  v-model="form.email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  class="rounded-3"
                  :disabled="loading.email"
                  @focus="handleInputFocus('email')"
                />
              </NFormGroup>
            </div>
            <div>
              <NFormGroup label="" name="password" required>
                <NInput
                  v-model="form.password"
                  required
                  placeholder="Enter your password"
                  class="rounded-3"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :trailing="isPasswordVisible ? 'i-lucide-eye' : 'i-lucide-eye-off'"
                  :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
                  @trailing="isPasswordVisible = !isPasswordVisible"
                  :disabled="loading.email"
                  @focus="handleInputFocus('password')"
                />
              </NFormGroup>
            </div>
            <NButton
              type="submit"
              block
              size="sm"
              btn="light:solid dark:soft-blue"
              rounded="3"
              class="py-5 hover:scale-101 active:scale-99 transition-transform"
              :loading="loading.email"
            >
              Sign In
            </NButton>
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
          <div class="space-y-3">
            <NLink to="/forgot-password" class="text-sm text-primary-600 dark:text-[#E79E4F] hover:underline font-400">
              Forgot password?
            </NLink>
            <p>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?
              </span>
              <NLink to="/signup" class="text-sm text-primary-600 dark:text-lime hover:underline font-400">
                Sign Up
              </NLink>
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
            <NIcon name="i-ph-quotes" class="w-6 h-6 text-#687FE5" />
          </div>
          <div>
            <p class="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">Welcome back</p>
            <h2 class="font-serif text-2xl text-gray-900 dark:text-gray-100 leading-tight">Sign in to Verbatims</h2>
          </div>
        </div>

        <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Keep your favorite lines close — and add new gems.
        </p>

        <div class="mt-6 bg-white/85 dark:bg-gray-900/80 backdrop-blur-md rounded-4 p-4 border border-gray-200/60 dark:border-gray-800/60 shadow-lg/30">
          <!-- Error Alert -->
          <NAlert
            v-if="error"
            color="red"
            variant="soft"
            :title="error"
            :close-button="{ icon: 'i-ph-x', color: 'gray', variant: 'link', padded: false }"
            class="mb-3"
            @close="error = ''"
          />

          <!-- Email/Password Sign In Form -->
          <form @submit.prevent="signInWithEmail" class="space-y-3">
            <NFormGroup label="" name="email" required>
              <NInput
                v-model="form.email"
                type="email"
                placeholder="Enter your email"
                required
                class="rounded-3"
                :disabled="loading.email"
              />
            </NFormGroup>

            <NFormGroup label="" name="password" required>
              <NInput
                v-model="form.password"
                required
                placeholder="Enter your password"
                class="rounded-3"
                :type="isPasswordVisible ? 'text' : 'password'"
                :trailing="isPasswordVisible ? 'i-lucide-eye' : 'i-lucide-eye-off'"
                :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
                @trailing="isPasswordVisible = !isPasswordVisible"
                :disabled="loading.email"
              />
            </NFormGroup>

            <NButton
              type="submit"
              block
              size="sm"
              btn="primary"
              rounded="3"
              class="py-5 hover:scale-101 active:scale-99 transition-transform"
              :loading="loading.email"
            >
              Sign In
            </NButton>
          </form>
        </div>
      </div>
    </div>

    <!-- Bottom callout -->
    <div class="px-6 pb-10 pt-2">
      <div class="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-dashed border-gray-300 dark:border-gray-800 rounded-4 p-4 flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-700 dark:text-gray-300">New to Verbatims?</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Join and share your favorite lines.</p>
        </div>
        <NButton size="sm" btn="light:soft dark:soft-blue" to="/signup" class="font-600">Sign up</NButton>
      </div>
    </div>
  </div>
</template><template v-for="i in 90" :key="i">
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
    
    <!-- Login Form -->
    <div class="relative z-10 max-w-md w-full space-y-8 p-8 bg-white dark:bg-[#18181B] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
      <div>
        <h3 class="mt-2 font-title text-size-8 uppercase font-600 text-gray-900 dark:text-white text-center">
          Sign in <span class="font-300">to Verbatims</span>
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
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
                  @focus="handleInputFocus('email')"
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
                  :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
                  @trailing="isPasswordVisible = !isPasswordVisible"
                  :disabled="loading.email"
                  @focus="handleInputFocus('password')"
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
              Sign In
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
          <div class="space-y-3">
            <ULink to="/forgot-password" class="text-sm text-primary-600 dark:text-[#E79E4F] hover:underline font-400">
              Forgot password?
            </ULink>
            <p>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?
              </span>
              <ULink to="/signup" class="text-sm text-primary-600 dark:text-lime hover:underline font-400">
                Sign Up
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
            <p class="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">Welcome back</p>
            <h2 class="font-serif text-2xl text-gray-900 dark:text-gray-100 leading-tight">Sign in to Verbatims</h2>
          </div>
        </div>

        <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Keep your favorite lines close — and add new gems.
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

          <!-- Email/Password Sign In Form -->
          <form @submit.prevent="signInWithEmail" class="space-y-3">
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
                placeholder="Enter your password"
                class="rounded-3"
                :type="isPasswordVisible ? 'text' : 'password'"
                :trailing="isPasswordVisible ? 'i-lucide-eye' : 'i-lucide-eye-off'"
                :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
                @trailing="isPasswordVisible = !isPasswordVisible"
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
              Sign In
            </UButton>
          </form>
        </div>
      </div>
    </div>

    <!-- Bottom callout -->
    <div class="px-6 pb-10 pt-2">
      <div class="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-dashed border-gray-300 dark:border-gray-800 rounded-4 p-4 flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-700 dark:text-gray-300">New to Verbatims?</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Join and share your favorite lines.</p>
        </div>
        <UButton size="sm" btn="light:soft dark:soft-blue" to="/signup" class="font-600">Sign up</UButton>
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

const lastFocusedInput = ref<'email' | 'password'>('email')

function handleInputFocus(input: 'email' | 'password') {
  lastFocusedInput.value = input
}

function appendLetterToInput(letter: string) {
  if (lastFocusedInput.value === 'password') {
    form.value.password += letter
  } else {
    form.value.email += letter
  }
}

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
