<template>
  <main class="mx-auto flex min-h-[55vh] max-w-2xl items-center px-5 py-16 sm:px-8">
    <section class="w-full border-t border-gray-300 pt-8 dark:border-white/15">
      <NIcon :name="success ? 'i-ph-check-circle' : error ? 'i-ph-warning-circle' : 'i-ph-envelope-simple'" class="mb-5 h-8 w-8 text-gray-700 dark:text-gray-300" />
      <h1 class="font-serif text-3xl font-400 text-gray-950 dark:text-gray-50 sm:text-4xl">
        {{ success ? $t('success_title') : $t('title') }}
      </h1>
      <p v-if="success" class="mt-4 max-w-prose font-sans text-base leading-relaxed text-gray-700 dark:text-gray-300">
        {{ $t('success_body') }} <strong class="break-all font-600">{{ confirmedEmail }}</strong>.
      </p>
      <p v-else-if="error" class="mt-4 max-w-prose font-sans text-base leading-relaxed text-red-700 dark:text-red-300" role="alert">
        {{ error }}
      </p>
      <p v-else class="mt-4 max-w-prose font-sans text-base leading-relaxed text-gray-700 dark:text-gray-300">
        {{ $t('body') }}
      </p>

      <div class="mt-8 flex flex-wrap gap-3">
        <NButton v-if="!success && !error" :disabled="confirming || !token" btn="solid-black" class="min-h-11 justify-center bg-gray-900 px-5 font-sans text-sm font-600 text-white transition-colors hover:bg-gray-700 active:scale-99 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300" @click="confirmEmail">
          {{ confirming ? $t('confirming') : $t('confirm_button') }}
        </NButton>
        <NButton v-if="success" to="/dashboard/settings?tab=profile" btn="solid-black" class="min-h-11 justify-center bg-gray-900 px-5 font-sans text-sm font-600 text-white transition-colors hover:bg-gray-700 active:scale-99 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300">
          {{ $t('settings_button') }}
        </NButton>
        <NButton v-else-if="error" to="/dashboard/settings?tab=profile" btn="outline-gray" class="min-h-11 justify-center px-5 font-sans text-sm font-600">
          {{ $t('settings_button') }}
        </NButton>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
const { $t } = useI18n()
const route = useRoute()
const token = computed(() => typeof route.query.token === 'string' ? route.query.token : '')
const confirming = ref(false)
const confirmedEmail = ref('')
const error = ref('')
const success = ref(false)

useHead({ title: $t('meta_title') as string })

definePageMeta({ layout: 'default' })

const confirmEmail = async () => {
  if (!token.value) {
    error.value = $t('error_invalid') as string
    return
  }

  confirming.value = true
  error.value = ''
  try {
    const result = await $fetch<{ success: true, email: string }>('/api/auth/verify-email-change', {
      method: 'POST',
      body: { token: token.value },
    })
    confirmedEmail.value = result.email
    success.value = true
    await useUserSession().fetch()
  } catch (cause: any) {
    const statusCode = cause?.statusCode || cause?.status
    error.value = statusCode === 409
      ? $t('error_conflict') as string
      : statusCode === 400
        ? $t('error_invalid') as string
        : $t('error_generic') as string
  } finally {
    confirming.value = false
  }
}
</script>
