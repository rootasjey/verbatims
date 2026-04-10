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
      <!-- Loading state -->
      <div v-if="loading" class="text-center py-8">
        <NIcon name="i-ph-spinner" class="w-10 h-10 text-primary-500 animate-spin mx-auto" />
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-4">Verifying your email...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center">
        <NIcon name="i-ph-x-circle" class="w-16 h-16 text-red-500 mx-auto" />
        <h3 class="mt-4 font-title text-size-8 uppercase font-600 text-gray-900 dark:text-white">
          Verification <span class="font-300">failed</span>
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">{{ error }}</p>
        <div class="mt-4 space-y-2">
          <NButton v-if="canResend" size="sm" btn="light:solid dark:soft-blue" rounded="3" class="w-full" @click="resendVerification" :loading="resending">
            Resend verification email
          </NButton>
          <NLink to="/login" class="text-sm text-primary-600 dark:text-[#E79E4F] hover:underline font-400 block mt-2">
            Back to sign in
          </NLink>
        </div>
      </div>

      <!-- Success state -->
      <div v-else class="text-center">
        <NIcon name="i-ph-check-circle" class="w-16 h-16 text-green-500 mx-auto" />
        <h3 class="mt-4 font-title text-size-8 uppercase font-600 text-gray-900 dark:text-white">
          Email <span class="font-300">verified</span>
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Your email has been verified successfully. You can now submit quotes for review.
        </p>
        <NButton to="/dashboard" block size="sm" btn="light:solid dark:soft-blue" rounded="3" class="py-5 mt-6 hover:scale-101 active:scale-99 transition-transform">
          Go to Dashboard
        </NButton>
      </div>
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
            <NIcon name="i-ph-envelope-simple" class="w-6 h-6 text-#687FE5" />
          </div>
          <div>
            <p class="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">Verification</p>
            <h2 class="font-serif text-2xl text-gray-900 dark:text-gray-100 leading-tight">Verify your email</h2>
          </div>
        </div>

        <div class="mt-6 bg-white/85 dark:bg-gray-900/80 backdrop-blur-md rounded-4 p-4 border border-gray-200/60 dark:border-gray-800/60 shadow-lg/30">
          <!-- Loading state -->
          <div v-if="loading" class="text-center py-6">
            <NIcon name="i-ph-spinner" class="w-10 h-10 text-primary-500 animate-spin mx-auto" />
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-4">Verifying your email...</p>
          </div>

          <!-- Error state -->
          <div v-else-if="error" class="text-center py-2">
            <NIcon name="i-ph-x-circle" class="w-12 h-12 text-red-500 mx-auto" />
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">{{ error }}</p>
            <NButton v-if="canResend" size="sm" btn="primary" rounded="3" class="mt-4 w-full" @click="resendVerification" :loading="resending">
              Resend verification email
            </NButton>
          </div>

          <!-- Success state -->
          <div v-else class="text-center py-2">
            <NIcon name="i-ph-check-circle" class="w-12 h-12 text-green-500 mx-auto" />
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Your email has been verified. You can now submit quotes for review.</p>
            <NButton to="/dashboard" block size="sm" btn="primary" rounded="3" class="py-5 mt-4 hover:scale-101 active:scale-99 transition-transform">
              Go to Dashboard
            </NButton>
          </div>
        </div>
      </div>
    </div>

    <div class="px-6 pb-10 pt-2">
      <div v-if="error" class="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-dashed border-gray-300 dark:border-gray-800 rounded-4 p-4 flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-700 dark:text-gray-300">Need to sign in?</p>
        </div>
        <NButton size="sm" btn="light:soft dark:soft-blue" to="/login" class="font-600">Sign in</NButton>
      </div>
      <div v-else class="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-dashed border-gray-300 dark:border-gray-800 rounded-4 p-4 flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-700 dark:text-gray-300">Go to dashboard?</p>
        </div>
        <NButton size="sm" btn="light:soft dark:soft-blue" to="/dashboard" class="font-600">Dashboard</NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Verify Email - Verbatims',
  meta: [
    { name: 'description', content: 'Verify your Verbatims email address.' }
  ]
})

definePageMeta({
  layout: 'default'
})

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

const route = useRoute()
const token = computed(() => route.query.token as string || '')

const loading = ref(true)
const error = ref('')
const success = ref(false)
const canResend = ref(true)
const resending = ref(false)

const verifyEmail = async () => {
  if (!token.value) {
    error.value = 'This verification link is invalid. Please request a new one.'
    loading.value = false
    return
  }

  try {
    await $fetch('/api/auth/verify-email', {
      method: 'POST',
      body: { token: token.value }
    })
    success.value = true
  } catch (err: any) {
    const message = err.data?.message || 'Verification failed. The link may have expired.'
    error.value = message
    canResend.value = true
  } finally {
    loading.value = false
  }
}

const resendVerification = async () => {
  resending.value = true
  try {
    await $fetch('/api/auth/send-verification', { method: 'POST' })
    error.value = ''
    canResend.value = false
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to resend verification email.'
  } finally {
    resending.value = false
  }
}

onMounted(() => {
  verifyEmail()
})
</script>