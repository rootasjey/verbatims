<template>
  <!-- Desktop: clean editorial layout -->
  <div v-if="!isMobile" class="min-h-screen flex items-center justify-center bg-[#FAFAF9] dark:bg-[#0C0A09] py-16 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-sm">
      <!-- Editorial header -->
      <div class="text-center mb-10">
        <div class="w-8 h-px bg-gray-300 dark:bg-gray-600 mx-auto mb-6" />
        <h1 class="font-serif text-3xl font-200 text-gray-900 dark:text-gray-100">
          {{ $t('form_title') }}
        </h1>
        <p class="font-sans text-sm text-gray-500 dark:text-gray-400 mt-2">
          {{ $t('form_desc') }}
        </p>
      </div>

      <!-- Form card -->
      <div class="bg-gray-100 dark:bg-gray-900/20 rounded-sm px-6 py-6 border border-gray-200 dark:border-gray-700">
        <!-- Invalid token state -->
        <div v-if="tokenError" class="text-center py-4">
          <p class="font-sans text-sm text-gray-600 dark:text-gray-400">{{ tokenError }}</p>
          <NLink to="/forgot-password" class="font-sans text-sm text-gray-900 dark:text-gray-100 font-600 hover:underline mt-4 inline-block">
            {{ $t('error_action') }}
          </NLink>
        </div>

        <!-- Success state -->
        <div v-else-if="success" class="text-center py-4">
          <NIcon name="i-ph-check-circle" class="w-12 h-12 text-green-500 mx-auto" />
          <h2 class="font-serif text-xl font-200 text-gray-900 dark:text-gray-100 mt-4">{{ $t('success_title') }}</h2>
          <p class="font-sans text-sm text-gray-500 dark:text-gray-400 mt-2">{{ $t('success_desc') }}</p>
          <NButton to="/login" block size="sm" btn="light:solid dark:soft-blue" class="py-4 font-sans text-sm font-600 tracking-wide mt-6 hover:scale-[1.02] active:scale-99 transition-[transform]">
            {{ $t('success_button') }}
          </NButton>
        </div>

        <!-- Reset form -->
        <template v-else>
          <NAlert
            v-if="error"
            alert="soft-red"
            :title="error"
            :close-button="{ icon: 'i-ph-x', color: 'gray', btn: 'link', padded: false }"
            class="mb-4"
            @close="error = ''"
          />

          <form @submit.prevent="submitResetPassword" class="space-y-4">
            <NFormGroup :label="$t('password_label') as string" name="password" class="font-sans text-sm text-gray-600 dark:text-gray-400" required>
              <div class="relative">
                <NInput
                  v-model="password"
                  required
                  :placeholder="passwordPlaceholder"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :disabled="loading"
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

            <NFormGroup :label="$t('confirm_password_label') as string" name="confirmPassword" class="font-sans text-sm text-gray-600 dark:text-gray-400" required>
              <div class="relative">
                <NInput
                  v-model="confirmPassword"
                  required
                  :placeholder="confirmPlaceholder"
                  :type="isConfirmPasswordVisible ? 'text' : 'password'"
                  :disabled="loading"
                  class="bg-white dark:bg-[#0C0A09] border border-dashed border-gray-300 dark:border-gray-600 rounded-none font-sans text-sm w-full pr-10"
                />
                <button
                  type="button"
                  @click="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <NIcon :name="isConfirmPasswordVisible ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="w-4 h-4" />
                </button>
              </div>
            </NFormGroup>

            <NButton
              type="submit"
              block
              size="sm"
              btn="light:solid dark:soft-blue"
              class="py-4 font-sans text-sm font-600 tracking-wide hover:scale-[1.02] active:scale-99 transition-[transform]"
              :loading="loading"
            >
              {{ $t('submit_button') }}
            </NButton>
          </form>

          <!-- Bottom link -->
          <p class="text-center mt-6 font-sans text-sm text-gray-500 dark:text-gray-400">
            <NLink to="/login" class="text-gray-900 dark:text-gray-100 font-600 hover:underline">{{ $t('back_link') }}</NLink>
          </p>
        </template>
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
      <p class="font-sans text-sm text-gray-500 dark:text-gray-400 mt-1">
        {{ $t('form_desc') }}
      </p>
    </div>

    <div class="px-6">
      <div class="bg-gray-100 dark:bg-gray-800 rounded-sm px-5 py-5 border border-dashed border-gray-200 dark:border-gray-700">
        <!-- Invalid token state -->
        <div v-if="tokenError" class="text-center py-4">
          <p class="font-sans text-sm text-gray-600 dark:text-gray-400">{{ tokenError }}</p>
          <NLink to="/forgot-password" class="font-sans text-sm text-gray-900 dark:text-gray-100 font-600 hover:underline mt-4 inline-block">
            {{ $t('error_action') }}
          </NLink>
        </div>

        <!-- Success state -->
        <div v-else-if="success" class="text-center py-4">
          <NIcon name="i-ph-check-circle" class="w-12 h-12 text-green-500 mx-auto" />
          <p class="font-sans text-sm text-gray-500 dark:text-gray-400 mt-2">{{ $t('success_desc') }}</p>
          <NButton to="/login" block size="sm" btn="ghost-gray" class="py-4 font-sans text-sm font-600 tracking-wide border border-dashed border-gray-300 dark:border-gray-600 mt-5">
            {{ $t('success_button') }}
          </NButton>
        </div>

        <!-- Reset form -->
        <template v-else>
          <NAlert
            v-if="error"
            alert="soft-red"
            :title="error"
            :close-button="{ icon: 'i-ph-x', color: 'gray', btn: 'link', padded: false }"
            class="mb-4"
            @close="error = ''"
          />

          <form @submit.prevent="submitResetPassword" class="space-y-4">
            <NFormGroup :label="$t('password_label') as string" name="password" class="font-sans text-sm text-gray-600 dark:text-gray-400" required>
              <div class="relative">
                <NInput
                  v-model="password"
                  required
                  :placeholder="passwordPlaceholder"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :disabled="loading"
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

            <NFormGroup :label="$t('confirm_password_label') as string" name="confirmPassword" class="font-sans text-sm text-gray-600 dark:text-gray-400" required>
              <div class="relative">
                <NInput
                  v-model="confirmPassword"
                  required
                  :placeholder="confirmPlaceholder"
                  :type="isConfirmPasswordVisible ? 'text' : 'password'"
                  :disabled="loading"
                  class="bg-white dark:bg-[#0C0A09] border border-dashed border-gray-300 dark:border-gray-600 rounded-none font-sans text-sm w-full pr-10"
                />
                <button
                  type="button"
                  @click="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <NIcon :name="isConfirmPasswordVisible ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="w-4 h-4" />
                </button>
              </div>
            </NFormGroup>

            <NButton
              type="submit"
              block
              size="sm"
              btn="ghost-gray"
              class="py-4 font-sans text-sm font-600 tracking-wide border border-dashed border-gray-300 dark:border-gray-600"
              :loading="loading"
            >
              {{ $t('submit_button') }}
            </NButton>
          </form>
        </template>
      </div>
    </div>

    <!-- Bottom callout -->
    <div class="px-6 pb-10 pt-6">
      <div class="border border-dashed border-gray-200 dark:border-gray-700 rounded-sm px-5 py-4 flex items-center justify-between">
        <div>
          <p class="font-sans text-sm text-gray-700 dark:text-gray-300">{{ $t('mobile_prompt') }}</p>
        </div>
        <NButton size="sm" btn="ghost-gray" to="/login" class="font-sans text-sm font-600">{{ $t('mobile_sign_in') }}</NButton>
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

const passwordPlaceholder = useMountedTranslation('password_placeholder')
const confirmPlaceholder = useMountedTranslation('confirm_placeholder')

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
