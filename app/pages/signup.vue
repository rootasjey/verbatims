<template>
  <AuthPageShell
    :title="String($t('auth.sign_up_title'))"
    :description="String($t('auth.sign_up_mobile_tagline'))"
  >
    <NAlert
      v-if="error"
      role="alert"
      alert="soft-red"
      :title="error"
      :close-button="{ icon: 'i-ph-x', color: 'gray', btn: 'link', padded: false }"
      class="mb-6"
      @close="error = ''"
    />

    <form class="space-y-5" @submit.prevent="signUpWithEmail">
      <NFormGroup :label="$ts('auth.name_label')" name="name" class="auth-form-label" required>
        <NInput
          v-model="form.name"
          name="name"
          type="text"
          autocomplete="name"
          :placeholder="$ts('auth.name_placeholder')"
          required
          :disabled="loading.email"
          class="auth-form-input"
        />
      </NFormGroup>

      <NFormGroup :label="$ts('auth.email_label')" name="email" class="auth-form-label" required>
        <NInput
          v-model="form.email"
          name="email"
          type="email"
          autocomplete="email"
          inputmode="email"
          :placeholder="$ts('auth.email_placeholder')"
          required
          :disabled="loading.email"
          class="auth-form-input"
        />
      </NFormGroup>

      <NFormGroup :label="$ts('auth.password_label')" name="password" class="auth-form-label" required>
        <div class="relative">
          <NInput
            v-model="form.password"
            name="password"
            autocomplete="new-password"
            required
            :type="isPasswordVisible ? 'text' : 'password'"
            :disabled="loading.email"
            class="auth-form-input w-full pr-12"
          />
          <button
            type="button"
            class="absolute right-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700 dark:text-gray-400 dark:hover:bg-white/8 dark:hover:text-gray-100 dark:focus-visible:outline-gray-300"
            :aria-label="String($t(isPasswordVisible ? 'auth.hide_password' : 'auth.show_password'))"
            :aria-pressed="isPasswordVisible"
            @click="isPasswordVisible = !isPasswordVisible"
          >
            <NIcon :name="isPasswordVisible ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="h-5 w-5" />
          </button>
        </div>
        <p class="mt-2 font-sans text-xs font-400 text-gray-600 dark:text-gray-400">
          {{ $t('auth.password_min_chars') }}
        </p>
      </NFormGroup>

      <NButton
        type="submit"
        block
        size="md"
        btn="solid-gray"
        class="!min-h-12 !rounded-lg !bg-[#171614] font-sans text-sm font-600 tracking-wide !text-[#F7F5EF] transition-[transform,background-color] duration-150 hover:!bg-[#302E2B] active:scale-96 motion-reduce:active:scale-100 motion-reduce:transition-none focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-gray-800 dark:!bg-[#F3F1EC] dark:!text-[#171614] dark:hover:!bg-white dark:focus-visible:!outline-gray-200"
        :loading="loading.email"
      >
        {{ $t('auth.sign_up_button') }}
      </NButton>
    </form>

    <div class="my-6 flex items-center gap-4" role="separator">
      <span class="h-px flex-1 bg-black/10 dark:bg-white/15" aria-hidden="true" />
      <span class="font-sans text-xs text-gray-600 dark:text-gray-400">{{ $t('auth.sign_up_with') }}</span>
      <span class="h-px flex-1 bg-black/10 dark:bg-white/15" aria-hidden="true" />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <NButton btn="outline-gray" class="!min-h-12 !rounded-lg !border-[#B8B3A8] bg-transparent font-sans text-sm !text-gray-800 hover:!bg-black/5 dark:!border-[#615D56] dark:!text-gray-100 dark:hover:!bg-white/5" :loading="loading.github" @click="signInWith('github')">
        <template #leading>
          <NIcon name="i-ph-github-logo" class="h-4 w-4" />
        </template>
        {{ $t('auth.gitHub') }}
      </NButton>
      <NButton btn="outline-gray" class="!min-h-12 !rounded-lg !border-[#B8B3A8] bg-transparent font-sans text-sm !text-gray-800 hover:!bg-black/5 dark:!border-[#615D56] dark:!text-gray-100 dark:hover:!bg-white/5" :loading="loading.google" @click="signInWith('google')">
        <template #leading>
          <NIcon name="i-ph-google-logo" class="h-4 w-4" />
        </template>
        {{ $t('auth.google') }}
      </NButton>
    </div>

    <template #footer>
      <div class="space-y-3">
        <p>
          {{ $t('auth.has_account') }}
          <NLink to="/login" class="ml-1 font-600 text-gray-950 underline decoration-gray-400 underline-offset-4 hover:decoration-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-gray-100">
            {{ $t('auth.sign_in_link') }}
          </NLink>
        </p>
        <p class="max-w-[58ch] text-xs leading-relaxed">
          {{ $t('auth.terms_prefix') }}
          <NLink to="/terms" class="underline decoration-gray-400 underline-offset-2 hover:decoration-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            {{ $t('auth.terms_of_service') }}
          </NLink>
          {{ $t('auth.terms_joiner') }}
          <NLink to="/privacy" class="underline decoration-gray-400 underline-offset-2 hover:decoration-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            {{ $t('auth.privacy_policy') }}
          </NLink>.
        </p>
      </div>
    </template>
  </AuthPageShell>
</template>

<script setup lang="ts">
const { $t, $ts } = useI18n()

useHead({
  title: $ts('auth.meta_title_sign_up'),
  meta: [
    { name: 'description', content: $ts('auth.meta_desc_sign_up') }
  ]
})

definePageMeta({
  layout: 'default',
  pageTransition: {
    name: 'auth-page'
  }
})

const { user } = useUserSession()
if (user.value) {
  await navigateTo('/dashboard')
}

const form = ref({
  name: '',
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

const signUpWithEmail = async () => {
  if (!form.value.name || !form.value.email || !form.value.password) {
    error.value = $ts('auth.error_fill_fields')
    return
  }

  if (form.value.password.length < 8) {
    error.value = $ts('auth.error_password_length')
    return
  }

  loading.value.email = true
  error.value = ''

  try {
    await $fetch<ApiResponse<{ user: Record<string, unknown> }>>('/api/auth/register', {
      method: 'POST',
      body: {
        name: form.value.name,
        email: form.value.email,
        password: form.value.password
      }
    })

    await refreshCookie('nuxt-session')
    await useUserSession().fetch()
    await navigateTo('/dashboard')
  } catch (err: any) {
    console.error('Email sign up error:', err)
    error.value = err.data?.message || $ts('auth.error_create_account')
  } finally {
    loading.value.email = false
  }
}

const signInWith = async (provider: 'github' | 'google') => {
  loading.value[provider] = true
  error.value = ''

  try {
    await navigateTo(`/api/auth/${provider}`, { external: true })
  } catch (err) {
    console.error(`${provider} auth error:`, err)
    error.value = $ts('auth.error_oauth')
  } finally {
    loading.value[provider] = false
  }
}
</script>
