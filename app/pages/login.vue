<template>
  <AuthPageShell
    :title="String($t('auth.sign_in_title'))"
    :description="String($t('auth.sign_in_subtitle'))"
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

    <form class="space-y-5" @submit.prevent="signInWithEmail">
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
            autocomplete="current-password"
            required
            :placeholder="$ts('auth.password_placeholder')"
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
      </NFormGroup>

      <div class="-mt-3 flex justify-end">
        <NLink to="/forgot-password" class="inline-flex min-h-11 items-center font-sans text-sm text-gray-600 underline-offset-4 transition-colors hover:text-gray-950 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-gray-400 dark:hover:text-gray-100">
          {{ $t('auth.forgot_password') }}
        </NLink>
      </div>

      <NButton
        type="submit"
        block
        size="md"
        btn="solid-gray"
        class="!min-h-12 !rounded-lg !bg-[#171614] font-sans text-sm font-600 tracking-wide !text-[#F7F5EF] transition-[transform,background-color] duration-150 hover:!bg-[#302E2B] active:scale-96 motion-reduce:active:scale-100 motion-reduce:transition-none focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-gray-800 dark:!bg-[#F3F1EC] dark:!text-[#171614] dark:hover:!bg-white dark:focus-visible:!outline-gray-200"
        :loading="loading.email"
      >
        {{ $t('auth.sign_in_button') }}
      </NButton>
    </form>

    <div class="my-6 flex items-center gap-4" role="separator">
      <span class="h-px flex-1 bg-black/10 dark:bg-white/15" aria-hidden="true" />
      <span class="font-sans text-xs text-gray-600 dark:text-gray-400">{{ $t('auth.sign_in_with') }}</span>
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
      <p>
        {{ $t('auth.no_account') }}
        <NLink to="/signup" class="ml-1 font-600 text-gray-950 underline decoration-gray-400 underline-offset-4 hover:decoration-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-gray-100">
          {{ $t('auth.sign_up_link') }}
        </NLink>
      </p>
    </template>
  </AuthPageShell>
</template>

<script setup lang="ts">
const { $t, $ts } = useI18n()

useHead({
  title: $ts('auth.meta_title_sign_in'),
  meta: [
    { name: 'description', content: $ts('auth.meta_desc_sign_in') }
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
    error.value = $ts('auth.error_fill_fields')
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
    error.value = err.data?.message || $ts('auth.error_invalid_credentials')
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
    console.error(`${provider} sign in error:`, err)
    error.value = $ts('auth.error_oauth')
  } finally {
    loading.value[provider] = false
  }
}
</script>
