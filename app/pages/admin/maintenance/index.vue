<template>
  <div>
    <!-- Editorial Header -->
    <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
        {{ $t('title') }}
      </h1>
      <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">
        {{ $t('subtitle') }}
      </p>
    </div>

    <!-- Success/Error Alerts -->
    <div class="mb-6 space-y-4">
      <div v-if="successMessage" class="font-sans text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 border border-dashed border-green-200 dark:border-green-700">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="font-sans text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 border border-dashed border-red-200 dark:border-red-700">
        {{ errorMessage }}
      </div>
    </div>

    <!-- Database Reset Section -->
    <div class="border border-dashed border-gray-200 dark:border-gray-700 p-6 mb-8">
      <div class="flex items-center gap-3 mb-4">
        <NIcon name="i-ph-warning" class="w-5 h-5 text-red-500" />
        <h2 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100 uppercase tracking-wider">{{ $t('section_reset') }}</h2>
      </div>

      <div class="bg-red-50 dark:bg-red-900/10 border border-dashed border-red-200 dark:border-red-800 p-4 mb-4">
        <h3 class="font-sans text-sm font-500 text-red-800 dark:text-red-200 mb-2">{{ $t('warning_heading') }}</h3>
        <p class="font-sans text-xs text-red-700 dark:text-red-300 mb-3">{{ $t('warning_body') }}</p>
        <ul class="font-sans text-xs text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
          <li>{{ $t('warning_item_quotes') }}</li>
          <li>{{ $t('warning_item_users') }}</li>
          <li>{{ $t('warning_item_interactions') }}</li>
          <li>{{ $t('warning_item_moderation') }}</li>
        </ul>
        <p class="font-sans text-xs font-500 text-red-800 dark:text-red-200 mt-3">{{ $t('warning_final') }}</p>
      </div>

      <div class="flex justify-end">
        <OutlinedButton variant="destructive" :disabled="isResetting" @click="showResetConfirmation = true">{{ $t('button_reset') }}</OutlinedButton>
      </div>
    </div>

    <!-- Reset Confirmation Dialog -->
    <NDialog v-model:open="showResetConfirmation">
      <div class="border border-dashed border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center gap-3 mb-4">
          <NIcon name="i-ph-warning-circle" class="w-5 h-5 text-red-500" />
          <h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">{{ $t('dialog_confirm_title') }}</h3>
        </div>

        <p class="font-sans text-sm text-gray-700 dark:text-gray-300 mb-4">{{ $t('dialog_confirm_body') }}</p>

        <div class="bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 p-4 mb-4">
          <h4 class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100 mb-2">{{ $t('dialog_what_happens') }}</h4>
          <ul class="font-sans text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>&bull; {{ $t('dialog_item_all_data') }}</li>
            <li>&bull; The database schema (tables, indexes, triggers) will remain intact</li>
            <li>&bull; A new admin user will be initialized</li>
            <li>&bull; You will need to log in again after the reset</li>
          </ul>
        </div>

        <div class="space-y-3 mb-4">
          <div>
            <label class="block font-sans text-sm text-gray-700 dark:text-gray-300 mb-1.5">{{ $t('dialog_label_confirm') }}</label>
            <input v-model="confirmationText" :placeholder="$t('dialog_placeholder_confirm') as string" :disabled="isResetting" class="w-full font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none" />
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
const acknowledgeDataLoss = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const canConfirmReset = computed(() => confirmationText.value === 'RESET DATABASE' && acknowledgeDataLoss.value && !isResetting.value)

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
