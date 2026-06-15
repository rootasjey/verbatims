<template>
  <!-- Desktop layout -->
  <div v-if="!isMobile" class="relative min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0C0A09] py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
    <div class="absolute inset-0 z-0 w-full h-full overflow-hidden flex items-start justify-start">
      <div class="flex flex-wrap w-full h-full">
        <template v-for="i in 90" :key="i">
          <span class="mx-2 my-1">
            <span
              class="text-[10vw] font-extrabold text-gray-200 dark:text-gray-800 opacity-35 leading-none"
            >
              {{ String.fromCharCode(65 + ((i - 1) % 26)) }}
            </span>
          </span>
        </template>
      </div>
    </div>

    <div class="relative z-10 max-w-md w-full space-y-8 p-8 bg-white dark:bg-[#18181B] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
      <!-- Invalid/expired token state -->
      <div v-if="tokenError" class="text-center">
        <h3 class="mt-2 font-title text-size-8 uppercase font-600 text-gray-900 dark:text-white">
          Invalid <span class="font-300">link</span>
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">{{ tokenError }}</p>
        <NLink to="/forgot-password" class="text-sm text-primary-600 dark:text-[#E79E4F] hover:underline font-400 mt-4 inline-block">
          Request a new reset link
        </NLink>
      </div>

      <!-- Success state -->
      <div v-else-if="success" class="text-center">
        <NIcon name="i-ph-check-circle" class="w-16 h-16 text-green-500 mx-auto" />
        <h3 class="mt-4 font-title text-size-8 uppercase font-600 text-gray-900 dark:text-white">
          Password <span class="font-300">reset</span>
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Your password has been reset successfully.
        </p>
        <NButton to="/login" block size="sm" btn="light:solid dark:soft-blue" rounded="3" class="py-5 mt-6 hover:scale-101 active:scale-99 transition-transform">
          Sign In
        </NButton>
      </div>

      <!-- Reset form -->
      <template v-else>
        <div>
          <h3 class="mt-2 font-title text-size-8 uppercase font-600 text-gray-900 dark:text-white text-center">
            Reset <span class="font-300">password</span>
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
            Choose a new password for your account
          </p>
        </div>
        <div>
          <div class="space-y-6">
            <NAlert
              v-if="error"
              alert="soft-red"
              :title="error"
              :close-button="{ icon: 'i-ph-x', color: 'gray', btn: 'link', padded: false }"
              @close="error = ''"
            />
            <form @submit.prevent="submitResetPassword" class="space-y-3">
              <div>
                <NFormGroup label="" name="password" required>
                  <NInput
                    v-model="password"
                    required
                    placeholder="New password (min. 8 characters)"
                    class="rounded-3"
                    :type="isPasswordVisible ? 'text' : 'password'"
                    :trailing="isPasswordVisible ? 'i-lucide-eye' : 'i-lucide-eye-off'"
                    :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
                    @trailing="isPasswordVisible = !isPasswordVisible"
                    :disabled="loading"
                  />
                </NFormGroup>
              </div>
              <div>
                <NFormGroup label="" name="confirmPassword" required>
                  <NInput
                    v-model="confirmPassword"
                    required
                    placeholder="Confirm new password"
                    class="rounded-3"
                    :type="isConfirmPasswordVisible ? 'text' : 'password'"
                    :trailing="isConfirmPasswordVisible ? 'i-lucide-eye' : 'i-lucide-eye-off'"
                    :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
                    @trailing="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                    :disabled="loading"
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
                :loading="loading"
              >
                Reset Password
              </NButton>
            </form>
            <div>
              <NLink to="/login" class="text-sm text-primary-600 dark:text-[#E79E4F] hover:underline font-400">
                Back to sign in
              </NLink>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>

  <!-- Mobile layout -->
  <div v-else class="min-h-screen flex flex-col bg-gradient-to-b from-purple-50 via-pink-50 to-amber-50 dark:from-#0B0A09 dark:via-#0C0A09 dark:to-black">
    <div class="relative px-6 pt-10 pb-12 rounded-b-8 bg-gradient-to-br from-green-50/80 to-purple-50/80 dark:from-#0B0A09 dark:to-black">
      <div class="pointer-events-none absolute -top-12 -right-8 w-44 h-44 rounded-full bg-gradient-to-br from-#687FE5/40 to-pink-400/40 blur-2xl" />
      <div class="pointer-events-none absolute top-6 -left-10 w-36 h-36 rounded-full bg-gradient-to-br from-amber-300/40 to-rose-300/40 blur-2xl" />

      <div class="relative z-1">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 flex items-center justify-center">
            <NIcon name="i-ph-key" class="w-6 h-6 text-#687FE5" />
          </div>
          <div>
            <p class="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">New password</p>
            <h2 class="font-serif text-2xl text-gray-900 dark:text-gray-100 leading-tight">Reset your password</h2>
          </div>
        </div>

        <div class="mt-6 bg-white/85 dark:bg-gray-900/80 backdrop-blur-md rounded-4 p-4 border border-gray-200/60 dark:border-gray-800/60 shadow-lg/30">
          <!-- Invalid token state -->
          <div v-if="tokenError" class="text-center py-2">
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ tokenError }}</p>
            <NLink to="/forgot-password" class="text-sm text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block">
              Request a new reset link
            </NLink>
          </div>

          <!-- Success state -->
          <div v-else-if="success" class="text-center py-2">
            <NIcon name="i-ph-check-circle" class="w-12 h-12 text-green-500 mx-auto" />
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Your password has been reset successfully.</p>
            <NButton to="/login" block size="sm" btn="primary" rounded="3" class="py-5 mt-4 hover:scale-101 active:scale-99 transition-transform">
              Sign In
            </NButton>
          </div>

          <!-- Reset form -->
          <template v-else>
            <NAlert
              v-if="error"
              alert="soft-red"
              :title="error"
              class="mb-3"
              :close-button="{ icon: 'i-ph-x', color: 'gray', btn: 'link', padded: false }"
              @close="error = ''"
            />
            <form @submit.prevent="submitResetPassword" class="space-y-3">
              <NFormGroup label="" name="password" required>
                <NInput
                  v-model="password"
                  required
                  placeholder="New password (min. 8 characters)"
                  class="rounded-3"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :trailing="isPasswordVisible ? 'i-lucide-eye' : 'i-lucide-eye-off'"
                  :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
                  @trailing="isPasswordVisible = !isPasswordVisible"
                  :disabled="loading"
                />
              </NFormGroup>
              <NFormGroup label="" name="confirmPassword" required>
                <NInput
                  v-model="confirmPassword"
                  required
                  placeholder="Confirm new password"
                  class="rounded-3"
                  :type="isConfirmPasswordVisible ? 'text' : 'password'"
                  :trailing="isConfirmPasswordVisible ? 'i-lucide-eye' : 'i-lucide-eye-off'"
                  :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
                  @trailing="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                  :disabled="loading"
                />
              </NFormGroup>
              <NButton
                type="submit"
                block
                size="sm"
                btn="primary"
                rounded="3"
                class="py-5 hover:scale-101 active:scale-99 transition-transform"
                :loading="loading"
              >
                Reset Password
              </NButton>
            </form>
          </template>
        </div>
      </div>
    </div>

    <div class="px-6 pb-10 pt-2">
      <div class="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-dashed border-gray-300 dark:border-gray-800 rounded-4 p-4 flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-700 dark:text-gray-300">Remember your password?</p>
        </div>
        <NButton size="sm" btn="light:soft dark:soft-blue" to="/login" class="font-600">Sign in</NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Reset Password - Verbatims',
  meta: [
    { name: 'description', content: 'Set a new password for your Verbatims account.' }
  ]
})

definePageMeta({
  layout: 'default'
})

const { isMobile } = useMobileDetection()
const route = useRoute()
const token = computed(() => route.query.token as string || '')

const password = ref('')
const confirmPassword = ref('')
const isPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref(false)
const tokenError = ref('')

if (!token.value) {
  tokenError.value = 'This reset link is invalid. Please request a new one.'
}

const submitResetPassword = async () => {
  if (!password.value || !confirmPassword.value) {
    error.value = 'Please fill in all fields'
    return
  }

  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters long'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: token.value,
        password: password.value,
      }
    })
    success.value = true
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to reset password. The link may have expired.'
  } finally {
    loading.value = false
  }
}
</script>