<template>
  <!-- Desktop: clean editorial layout -->
  <div v-if="!isMobile" class="min-h-screen flex items-center justify-center bg-[#FAFAF9] dark:bg-[#0C0A09] py-16 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-sm">
      <!-- Editorial header -->
      <div class="text-center mb-10">
        <div class="w-8 h-px bg-gray-300 dark:bg-gray-600 mx-auto mb-6" />
        <h1 class="font-serif text-3xl font-200 text-gray-900 dark:text-gray-100">
          {{ $t('meta_title') }}
        </h1>
      </div>

      <!-- Form card -->
      <div class="bg-gray-100 dark:bg-gray-900/20 rounded-sm px-6 py-6 border border-gray-200 dark:border-gray-700">
        <!-- Loading state -->
        <div v-if="loading" class="text-center py-8">
          <NIcon name="i-ph-spinner" class="w-10 h-10 text-gray-400 animate-spin mx-auto" />
          <p class="font-sans text-sm text-gray-600 dark:text-gray-400 mt-4">{{ $t('loading') }}</p>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="text-center py-4">
          <NIcon name="i-ph-x-circle" class="w-12 h-12 text-red-500 mx-auto" />
          <h3 class="font-serif text-xl font-200 text-gray-900 dark:text-gray-100 mt-4">{{ $t('error_title') }}</h3>
          <p class="font-sans text-sm text-gray-600 dark:text-gray-400 mt-2">{{ error }}</p>
          <div class="mt-5 space-y-3">
            <NButton v-if="canResend" size="sm" btn="light:solid dark:soft-blue" class="py-4 font-sans text-sm font-600 tracking-wide w-full" @click="resendVerification" :loading="resending">
              {{ $t('error_resend') }}
            </NButton>
            <NLink to="/login" class="font-sans text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 block">
              {{ $t('error_link') }}
            </NLink>
          </div>
        </div>

        <!-- Success state -->
        <div v-else class="text-center py-4">
          <NIcon name="i-ph-check-circle" class="w-12 h-12 text-green-500 mx-auto" />
          <h3 class="font-serif text-xl font-200 text-gray-900 dark:text-gray-100 mt-4">{{ $t('success_title') }}</h3>
          <p class="font-sans text-sm text-gray-600 dark:text-gray-400 mt-2">{{ $t('success_desc') }}</p>
          <NButton to="/dashboard" block size="sm" btn="light:solid dark:soft-blue" class="py-4 font-sans text-sm font-600 tracking-wide mt-6 hover:scale-[1.02] active:scale-99 transition-[transform]">
            {{ $t('success_button') }}
          </NButton>
        </div>
      </div>
    </div>
  </div>

  <!-- Mobile: editorial layout -->
  <div v-else class="min-h-screen bg-[#FAFAF9] dark:bg-[#0C0A09]">
    <div class="px-6 pt-10 pb-6">
      <div class="flex items-center gap-2 mb-3">
        <span class="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
        <p class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">{{ $t('mobile_subheading') }}</p>
      </div>
      <h1 class="font-serif text-2xl font-200 text-gray-900 dark:text-gray-100 leading-tight">
        {{ $t('mobile_title') }}
      </h1>
    </div>

    <div class="px-6">
      <div class="bg-gray-100 dark:bg-gray-800 rounded-sm px-5 py-5 border border-dashed border-gray-200 dark:border-gray-700">
        <!-- Loading state -->
        <div v-if="loading" class="text-center py-8">
          <NIcon name="i-ph-spinner" class="w-10 h-10 text-gray-400 animate-spin mx-auto" />
          <p class="font-sans text-sm text-gray-600 dark:text-gray-400 mt-4">{{ $t('loading') }}</p>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="text-center py-4">
          <NIcon name="i-ph-x-circle" class="w-12 h-12 text-red-500 mx-auto" />
          <p class="font-sans text-sm text-gray-600 dark:text-gray-400 mt-3">{{ error }}</p>
          <NButton v-if="canResend" size="sm" btn="ghost-gray" class="py-4 font-sans text-sm font-600 tracking-wide border border-dashed border-gray-300 dark:border-gray-600 mt-5 w-full" @click="resendVerification" :loading="resending">
            {{ $t('error_resend') }}
          </NButton>
        </div>

        <!-- Success state -->
        <div v-else class="text-center py-4">
          <NIcon name="i-ph-check-circle" class="w-12 h-12 text-green-500 mx-auto" />
          <p class="font-sans text-sm text-gray-600 dark:text-gray-400 mt-3">{{ $t('success_desc') }}</p>
          <NButton to="/dashboard" block size="sm" btn="ghost-gray" class="py-4 font-sans text-sm font-600 tracking-wide border border-dashed border-gray-300 dark:border-gray-600 mt-5">
            {{ $t('success_button') }}
          </NButton>
        </div>
      </div>
    </div>

    <!-- Bottom callout -->
    <div class="px-6 pb-10 pt-6">
      <div class="border border-dashed border-gray-200 dark:border-gray-700 rounded-sm px-5 py-4 flex items-center justify-between">
        <div>
          <p class="font-sans text-sm text-gray-700 dark:text-gray-300">{{ error ? $t('mobile_prompt_error') : $t('mobile_prompt_success') }}</p>
        </div>
        <NButton size="sm" btn="ghost-gray" :to="error ? '/login' : '/dashboard'" class="font-sans text-sm font-600">{{ error ? $t('mobile_sign_in') : $t('mobile_dashboard') }}</NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $t } = useI18n()

useHead({
  title: $t('meta_title') as string,
  meta: [
    { name: 'description', content: $t('meta_desc') as string }
  ]
})

definePageMeta({
  layout: 'default'
})

const { isMobile } = useMobileDetection()
const route = useRoute()
const token = computed(() => route.query.token as string || '')

const loading = ref(true)
const error = ref('')
const success = ref(false)
const canResend = ref(true)
const resending = ref(false)

const verifyEmail = async () => {
  if (!token.value) {
    error.value = $t('error_invalid_token') as string
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
    const message = err.data?.message || ($t('error_generic') as string)
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
    error.value = err.data?.message || ($t('error_resend_failed') as string)
  } finally {
    resending.value = false
  }
}

onMounted(() => {
  verifyEmail()
})
</script>
