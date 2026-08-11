<template>
  <!-- Desktop: clean editorial layout -->
  <div v-if="!isMobile" class="min-h-screen flex items-center justify-center bg-[#FAFAF9] dark:bg-[#0C0A09] py-16 px-4 sm:px-6 lg:px-8">
    <div class="w-full max-w-sm">
      <!-- Editorial header -->
      <div class="text-center mb-10">
        <div class="w-8 h-px bg-gray-300 dark:bg-gray-600 mx-auto mb-6" />
        <h1 class="font-serif text-3xl font-200 text-gray-900 dark:text-gray-100">
          {{ $t('desktop_title') }}
        </h1>
        <p class="font-sans text-sm text-gray-500 dark:text-gray-400 mt-2">
          {{ $t('desktop_subtitle') }}
        </p>
      </div>

      <!-- Form card -->
      <div class="bg-gray-100 dark:bg-gray-900/20 rounded-sm px-6 py-6 border border-gray-200 dark:border-gray-700">
        <NAlert
          v-if="success"
          alert="soft-green"
          :title="$t('success_alert') as string"
          :close-button="{ icon: 'i-ph-x', color: 'gray', btn: 'link', padded: false }"
          class="mb-4"
          @close="success = ''"
        />
        <NAlert
          v-if="error"
          alert="soft-red"
          :title="error"
          :close-button="{ icon: 'i-ph-x', color: 'gray', btn: 'link', padded: false }"
          class="mb-4"
          @close="error = ''"
        />

        <form v-if="!success" @submit.prevent="submitForgotPassword" class="space-y-4">
          <NFormGroup :label="$t('email_label') as string" name="email" class="font-sans text-sm text-gray-600 dark:text-gray-400" required>
            <NInput
              v-model="email"
              type="email"
              :placeholder="emailPlaceholder"
              required
              :disabled="loading"
              class="bg-white dark:bg-[#0C0A09] border border-dashed border-gray-300 dark:border-gray-600 rounded-none font-sans text-sm"
            />
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
        {{ $t('mobile_desc') }}
      </p>
    </div>

    <div class="px-6">
      <div class="bg-gray-100 dark:bg-gray-800 rounded-sm px-5 py-5 border border-dashed border-gray-200 dark:border-gray-700">
        <NAlert
          v-if="success"
          alert="soft-green"
          :title="$t('success_alert') as string"
          :close-button="{ icon: 'i-ph-x', color: 'gray', btn: 'link', padded: false }"
          class="mb-4"
          @close="success = ''"
        />
        <NAlert
          v-if="error"
          alert="soft-red"
          :title="error"
          :close-button="{ icon: 'i-ph-x', color: 'gray', btn: 'link', padded: false }"
          class="mb-4"
          @close="error = ''"
        />

        <form v-if="!success" @submit.prevent="submitForgotPassword" class="space-y-4">
          <NFormGroup :label="$t('email_label') as string" name="email" class="font-sans text-sm text-gray-600 dark:text-gray-400" required>
            <NInput
              v-model="email"
              type="email"
              :placeholder="emailPlaceholder"
              required
              :disabled="loading"
              class="bg-white dark:bg-[#0C0A09] border border-dashed border-gray-300 dark:border-gray-600 rounded-none font-sans text-sm"
            />
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

const { user } = useUserSession()
if (user.value) {
  await navigateTo('/dashboard')
}

const { isMobile } = useMobileDetection()
const email = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

const emailPlaceholder = useMountedTranslation('email_placeholder')

const submitForgotPassword = async () => {
  if (!email.value) {
    error.value = $t('error_required') as string
    return
  }

  loading.value = true
  error.value = ''

  try {
    const result = await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value }
    })
    success.value = (result as any).message
  } catch (err: any) {
    error.value = err.data?.message || ($t('error_generic') as string)
  } finally {
    loading.value = false
  }
}
</script>
