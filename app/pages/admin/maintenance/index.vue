<template>
  <div>
    <!-- Editorial Header -->
    <div class="mb-6 border-b border-gray-200 pb-5 dark:border-gray-800 sm:mb-8 sm:pb-6">
      <h1 class="font-serif text-3xl font-200 text-gray-900 dark:text-gray-100 md:text-4xl">
        {{ $t('title') }}
      </h1>
      <p class="mt-2 max-w-2xl font-sans text-sm leading-6 text-gray-600 dark:text-gray-400">
        {{ $t('subtitle') }}
      </p>
    </div>

    <!-- Success/Error Alerts -->
    <div class="mb-6 space-y-4">
      <div v-if="successMessage" class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 font-sans text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-sans text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        {{ errorMessage }}
      </div>
    </div>

    <!-- Database Reset Section -->
    <section class="mb-8 max-w-4xl rounded-xl border border-gray-200 bg-white/60 p-4 dark:border-gray-700 dark:bg-gray-900/30 sm:p-6">
      <div class="mb-4 flex items-center gap-3">
        <NIcon name="i-ph-warning" class="w-5 h-5 text-red-500" />
        <h2 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100 uppercase tracking-wider">{{ $t('section_reset') }}</h2>
      </div>

      <div class="mb-5 rounded-xl border border-red-200 bg-red-50/80 p-4 dark:border-red-900 dark:bg-red-950/30 sm:p-5">
        <h3 class="font-sans text-sm font-500 text-red-800 dark:text-red-200 mb-2">{{ $t('warning_heading') }}</h3>
        <p class="mb-3 font-sans text-sm leading-6 text-red-800 dark:text-red-200">{{ $t('warning_body') }}</p>
        <ul class="list-inside list-disc space-y-1.5 font-sans text-sm text-red-800 dark:text-red-200">
          <li>{{ $t('warning_item_quotes') }}</li>
          <li>{{ $t('warning_item_users') }}</li>
          <li>{{ $t('warning_item_interactions') }}</li>
          <li>{{ $t('warning_item_moderation') }}</li>
        </ul>
        <p class="mt-4 font-sans text-sm font-semibold text-red-900 dark:text-red-100">{{ $t('warning_final') }}</p>
      </div>

      <div class="flex justify-end">
        <OutlinedButton variant="destructive" :disabled="isResetting" @click="showResetConfirmation = true">{{ $t('button_reset') }}</OutlinedButton>
      </div>
    </section>

    <!-- Reset Confirmation Dialog -->
    <NDialog v-model:open="showResetConfirmation">
      <div class="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 sm:p-6">
        <div class="mb-4 flex items-center gap-3">
          <NIcon name="i-ph-warning-circle" class="w-5 h-5 text-red-500" />
          <h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">{{ $t('dialog_confirm_title') }}</h3>
        </div>

        <p class="mb-4 font-sans text-sm leading-6 text-gray-700 dark:text-gray-300">{{ $t('dialog_confirm_body') }}</p>

        <div class="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-950">
          <h4 class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100 mb-2">{{ $t('dialog_what_happens') }}</h4>
          <ul class="font-sans text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>&bull; {{ $t('dialog_item_all_data') }}</li>
            <li>&bull; {{ $t('dialog_item_schema') }}</li>
            <li>&bull; {{ $t('dialog_item_admin') }}</li>
            <li>&bull; {{ $t('dialog_item_logout') }}</li>
          </ul>
        </div>

        <div class="space-y-3 mb-4">
          <div>
            <label class="mb-1.5 block font-sans text-sm text-gray-700 dark:text-gray-300">{{ $t('dialog_label_confirm', { phrase: confirmationPhrase }) }}</label>
            <input v-model="confirmationText" :placeholder="confirmationPhrase" :disabled="isResetting" class="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 font-sans text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-300/60 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-gray-400 dark:focus:ring-gray-700/60" />
          </div>
          <label class="flex items-center gap-2 font-sans text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" v-model="acknowledgeDataLoss" :disabled="isResetting" class="accent-gray-700 dark:accent-gray-300" />
            {{ $t('dialog_checkbox_understand') }}
          </label>
        </div>

        <div class="flex justify-end gap-3">
          <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-3 py-1.5" :disabled="isResetting" @click="cancelReset">{{ $t('dialog_cancel') }}</button>
          <OutlinedButton variant="destructive" :loading="isResetting" :disabled="!canConfirmReset" @click="confirmReset">{{ $t('dialog_reset') }}</OutlinedButton>
        </div>
      </div>
    </NDialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { $t } = useI18n()
useHead({ title: $t('meta_title') as string })

const isResetting = ref(false)
const showResetConfirmation = ref(false)
const confirmationText = ref('')
const confirmationPhrase = computed(() => String($t('dialog_confirmation_phrase')))
const acknowledgeDataLoss = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const canConfirmReset = computed(() => confirmationText.value.trim() === confirmationPhrase.value && acknowledgeDataLoss.value && !isResetting.value)

const cancelReset = () => { showResetConfirmation.value = false; confirmationText.value = ''; acknowledgeDataLoss.value = false }

const confirmReset = async () => {
  if (!canConfirmReset.value) return
  isResetting.value = true; errorMessage.value = ''; successMessage.value = ''
  try {
    const response = await $fetch('/api/admin/reset-database', { method: 'POST', body: { confirmationToken: 'RESET_DATABASE_CONFIRMED' } })
    successMessage.value = String($t('success_message', { details: `${response.data.tablesCleared} tables cleared, ${response.data.rowsDeleted} rows deleted. You will be redirected shortly.` }))
    showResetConfirmation.value = false; cancelReset()
    setTimeout(() => navigateTo('/'), 3000)
  } catch (error) {
    errorMessage.value = error.data?.message || error.message || String($t('error_message'))
    showResetConfirmation.value = false; cancelReset()
  } finally { isResetting.value = false }
}
</script>
