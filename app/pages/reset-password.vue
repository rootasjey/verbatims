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
          {{ $t('error_title') }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">{{ tokenError }}</p>
        <NLink to="/forgot-password" class="text-sm text-primary-600 dark:text-[#E79E4F] hover:underline font-400 mt-4 inline-block">
          {{ $t('error_action') }}
        </NLink>
      </div>

      <!-- Success state -->
      <div v-else-if="success" class="text-center">
        <NIcon name="i-ph-check-circle" class="w-16 h-16 text-green-500 mx-auto" />
        <h3 class="mt-4 font-title text-size-8 uppercase font-600 text-gray-900 dark:text-white">
          {{ $t('success_title') }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {{ $t('success_desc') }}
        </p>
        <NButton to="/login" block size="sm" btn="light:solid dark:soft-blue" rounded="3" class="py-5 mt-6 hover:scale-101 active:scale-99 transition-transform">
          {{ $t('success_button') }}
        </NButton>
      </div>

      <!-- Reset form -->
      <template v-else>
        <div>
          <h3 class="mt-2 font-title text-size-8 uppercase font-600 text-gray-900 dark:text-white text-center">
            {{ $t('form_title') }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 text-center">
            {{ $t('form_desc') }}
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
                    :placeholder="$t('password_placeholder') as string"
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
                    :placeholder="$t('confirm_placeholder') as string"
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
                {{ $t('back_link') }}
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
            <p class="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">{{ $t('mobile_subheading') }}</p>
            <h2 class="font-serif text-2xl text-gray-900 dark:text-gray-100 leading-tight">{{ $t('mobile_title') }}</h2>
          </div>
        </div>

        <div class="mt-6 bg-white/85 dark:bg-gray-900/80 backdrop-blur-md rounded-4 p-4 border border-gray-200/60 dark:border-gray-800/60 shadow-lg/30">
          <!-- Invalid token state -->
          <div v-if="tokenError" class="text-center py-2">
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ tokenError }}</p>
            <NLink to="/forgot-password" class="text-sm text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block">
              {{ $t('error_action') }}
            </NLink>
          </div>

          <!-- Success state -->
          <div v-else-if="success" class="text-center py-2">
            <NIcon name="i-ph-check-circle" class="w-12 h-12 text-green-500 mx-auto" />
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">{{ $t('success_desc') }}</p>
            <NButton to="/login" block size="sm" btn="primary" rounded="3" class="py-5 mt-4 hover:scale-101 active:scale-99 transition-transform">
              {{ $t('success_button') }}
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
                  :placeholder="$t('password_placeholder') as string"
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
                  :placeholder="$t('confirm_placeholder') as string"
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
                {{ $t('submit_button') }}
              </NButton>
            </form>
          </template>
        </div>
      </div>
    </div>

    <div class="px-6 pb-10 pt-2">
      <div class="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-dashed border-gray-300 dark:border-gray-800 rounded-4 p-4 flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ $t('mobile_prompt') }}</p>
        </div>
        <NButton size="sm" btn="light:soft dark:soft-blue" to="/login" class="font-600">{{ $t('mobile_sign_in') }}</NButton>
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

const password = ref('')
const confirmPassword = ref('')
const isPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref(false)
const tokenError = ref('')

if (!token.value) {
  tokenError.value = $t('error_invalid_token') as string
}

const submitResetPassword = async () => {
  if (!password.value || !confirmPassword.value) {
    error.value = $t('error_required') as string
    return
  }

  if (password.value.length < 8) {
    error.value = $t('error_password_length') as string
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = $t('error_passwords_mismatch') as string
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
    error.value = err.data?.message || ($t('error_generic') as string)
  } finally {
    loading.value = false
  }
}
</script>