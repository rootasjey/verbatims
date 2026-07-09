<template>
  <!-- Desktop: clean editorial layout -->
  <div v-if="!isMobile" class="min-h-screen flex items-center justify-center bg-[#FAFAF9] dark:bg-[#0C0A09] py-16 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-sm">
      <!-- Editorial header -->
      <div class="text-center mb-10">
        <div class="w-8 h-px bg-gray-300 dark:bg-gray-600 mx-auto mb-6" />
        <h1 class="font-serif text-3xl font-200 text-gray-900 dark:text-gray-100">
          Sign in
        </h1>
        <p class="font-sans text-sm text-gray-500 dark:text-gray-400 mt-2">
          to your Verbatims account
        </p>
      </div>

      <!-- Form card -->
      <div class="bg-gray-100 dark:bg-gray-900/20 rounded-sm px-6 py-6 border border-gray-200 dark:border-gray-700">
        <!-- Error Alert -->
        <NAlert
          v-if="error"
          alert="soft-red"
          :title="error"
          :close-button="{ icon: 'i-ph-x', color: 'gray', btn: 'link', padded: false }"
          class="mb-4"
          @close="error = ''"
        />

        <form @submit.prevent="signInWithEmail" class="space-y-4">
          <NFormGroup label="Email" name="email" class="font-sans text-sm text-gray-600 dark:text-gray-400" required>
            <NInput
              v-model="form.email"
              type="email"
              placeholder="you@example.com"
              required
              :disabled="loading.email"
              class="bg-white dark:bg-[#0C0A09] border border-dashed border-gray-300 dark:border-gray-600 rounded-none font-sans text-sm"
            />
          </NFormGroup>

          <NFormGroup label="Password" name="password" class="font-sans text-sm text-gray-600 dark:text-gray-400" required>
            <div class="relative">
              <NInput
                v-model="form.password"
                required
                placeholder="••••••••"
                :type="isPasswordVisible ? 'text' : 'password'"
                :disabled="loading.email"
                class="bg-white dark:bg-[#0C0A09] border border-dashed border-gray-300 dark:border-gray-600 rounded-none font-sans text-sm w-full pr-10"
              />
              <button
                type="button"
                @click="isPasswordVisible = !isPasswordVisible"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <NIcon :name="isPasswordVisible ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="w-4 h-4" />
              </button>
            </div>
          </NFormGroup>

          <div class="flex items-center justify-end">
            <NLink to="/forgot-password" class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
              Forgot password?
            </NLink>
          </div>

          <NButton
            type="submit"
            block
            size="sm"
            btn="light:solid dark:soft-blue"
            class="py-4 font-sans text-sm font-600 tracking-wide hover:scale-[1.02] active:scale-99 transition-[transform]"
            :loading="loading.email"
          >
            Sign In
          </NButton>
        </form>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-dashed border-gray-200 dark:border-gray-700" />
          </div>
          <div class="relative flex justify-center">
            <span class="px-2 bg-gray-100 dark:bg-gray-800 font-sans text-xs text-gray-400 dark:text-gray-500">
              or sign in with
            </span>
          </div>
        </div>

        <!-- Social providers -->
        <div class="grid grid-cols-2 gap-3">
          <NButton btn="ghost-gray" class="font-sans text-sm border border-dashed border-gray-200 dark:border-gray-700" :loading="loading.github" @click="signInWith('github')">
            <template #leading>
              <NIcon name="i-ph-github-logo" class="w-4 h-4" />
            </template>
            GitHub
          </NButton>
          <NButton btn="ghost-gray" class="font-sans text-sm border border-dashed border-gray-200 dark:border-gray-700" :loading="loading.google" @click="signInWith('google')">
            <template #leading>
              <NIcon name="i-ph-google-logo" class="w-4 h-4" />
            </template>
            Google
          </NButton>
        </div>
      </div>

      <!-- Bottom link -->
      <p class="text-center mt-8 font-sans text-sm text-gray-500 dark:text-gray-400">
        Don't have an account?&nbsp;
        <NLink to="/signup" class="text-gray-900 dark:text-gray-100 font-600 hover:underline">Sign up</NLink>
      </p>
    </div>
  </div>

  <!-- Mobile: editorial layout -->
  <div v-else class="min-h-screen bg-[#FAFAF9] dark:bg-[#0C0A09]">
    <div class="px-6 pt-10 pb-6">
      <div class="flex items-center gap-2 mb-3">
        <span class="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
        <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">Welcome back</p>
      </div>
      <h1 class="font-serif text-2xl font-200 text-gray-900 dark:text-gray-100 leading-tight">
        Sign in to <span class="font-600">Verbatims</span>
      </h1>
      <p class="font-sans text-sm text-gray-500 dark:text-gray-400 mt-1">
        Keep your favorite lines close
      </p>
    </div>

    <div class="px-6">
      <div class="bg-gray-100 dark:bg-gray-800 rounded-sm px-5 py-5 border border-dashed border-gray-200 dark:border-gray-700">
        <!-- Error Alert -->
        <NAlert
          v-if="error"
          alert="soft-red"
          :title="error"
          :close-button="{ icon: 'i-ph-x', color: 'gray', btn: 'link', padded: false }"
          class="mb-4"
          @close="error = ''"
        />

        <form @submit.prevent="signInWithEmail" class="space-y-4">
          <NFormGroup label="Email" name="email" class="font-sans text-sm text-gray-600 dark:text-gray-400" required>
            <NInput
              v-model="form.email"
              type="email"
              placeholder="you@example.com"
              required
              :disabled="loading.email"
              class="bg-white dark:bg-[#0C0A09] border border-dashed border-gray-300 dark:border-gray-600 rounded-none font-sans text-sm"
            />
          </NFormGroup>

          <NFormGroup label="Password" name="password" class="font-sans text-sm text-gray-600 dark:text-gray-400" required>
            <div class="relative">
              <NInput
                v-model="form.password"
                required
                placeholder="••••••••"
                :type="isPasswordVisible ? 'text' : 'password'"
                :disabled="loading.email"
                class="bg-white dark:bg-[#0C0A09] border border-dashed border-gray-300 dark:border-gray-600 rounded-none font-sans text-sm w-full pr-10"
              />
              <button
                type="button"
                @click="isPasswordVisible = !isPasswordVisible"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <NIcon :name="isPasswordVisible ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="w-4 h-4" />
              </button>
            </div>
          </NFormGroup>

          <div class="flex items-center justify-end">
            <NLink to="/forgot-password" class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
              Forgot password?
            </NLink>
          </div>

          <NButton
            type="submit"
            block
            size="sm"
            btn="ghost-gray"
            class="py-4 font-sans text-sm font-600 tracking-wide border border-dashed border-gray-300 dark:border-gray-600"
            :loading="loading.email"
          >
            Sign In
          </NButton>
        </form>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-dashed border-gray-200 dark:border-gray-700" />
          </div>
          <div class="relative flex justify-center">
            <span class="px-2 bg-gray-100 dark:bg-gray-800 font-sans text-xs text-gray-400 dark:text-gray-500">
              or sign in with
            </span>
          </div>
        </div>

        <!-- Social providers -->
        <div class="grid grid-cols-2 gap-3">
          <NButton btn="ghost-gray" class="font-sans text-sm border border-dashed border-gray-200 dark:border-gray-700" :loading="loading.github" @click="signInWith('github')">
            <template #leading>
              <NIcon name="i-ph-github-logo" class="w-4 h-4" />
            </template>
            GitHub
          </NButton>
          <NButton btn="ghost-gray" class="font-sans text-sm border border-dashed border-gray-200 dark:border-gray-700" :loading="loading.google" @click="signInWith('google')">
            <template #leading>
              <NIcon name="i-ph-google-logo" class="w-4 h-4" />
            </template>
            Google
          </NButton>
        </div>
      </div>
    </div>

    <!-- Bottom callout -->
    <div class="px-6 pb-10 pt-6">
      <div class="border border-dashed border-gray-200 dark:border-gray-700 rounded-sm px-5 py-4 flex items-center justify-between">
        <div>
          <p class="font-sans text-sm text-gray-700 dark:text-gray-300">New here?</p>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-0.5">Join and share your favorite lines.</p>
        </div>
        <NButton size="sm" btn="ghost-gray" to="/signup" class="font-sans text-sm font-600">Sign up</NButton>
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
    await navigateTo(`/api/auth/${provider}`, { external: true })
  } catch (error) {
    console.error(`${provider} sign in error:`, error)
  } finally {
    loading.value[provider] = false
  }
}
</script>
