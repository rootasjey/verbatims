<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="font-title text-size-12 font-bold text-gray-900 dark:text-white">
        Database Maintenance
      </h1>
      <p class="-mt-4 font-body text-gray-600 dark:text-gray-400">
        Perform database maintenance operations and manage data integrity
      </p>
    </div>

    <!-- Success/Error Alerts -->
    <div class="mb-6 space-y-4">
      <UAlert
        v-if="successMessage"
        alert="green"
        variant="soft"
        :title="successMessage"
        :close-button="{ icon: 'i-ph-x', color: 'gray', variant: 'link', padded: false }"
        @close="successMessage = ''"
      />

      <UAlert
        v-if="errorMessage"
        alert="red"
        variant="soft"
        :title="errorMessage"
        :close-button="{ icon: 'i-ph-x', color: 'gray', variant: 'link', padded: false }"
        @close="errorMessage = ''"
      />
    </div>

    <!-- Database Reset Section -->
    <UCard class="mb-8">
      <template #header>
        <div class="flex items-center space-x-3">
          <UIcon name="i-ph-warning" class="h-6 w-6 text-red-500" />
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Database Reset
          </h2>
        </div>
      </template>

      <div class="space-y-4">
        <div class="rounded-lg p-2">
          <div class="flex items-start space-x-3">
            <div>
              <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                Destructive Operation Warning
              </h3>
              <p class="mt-1 mb-6 text-sm text-red-700 dark:text-red-300">
                This operation will permanently delete ALL data in the database including:
              </p>
              <ul class="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                <li>All quotes, authors, and references</li>
                <li>All user accounts and collections</li>
                <li>All tags, likes, and interaction data</li>
                <li>All moderation history and reports</li>
              </ul>
              <p class="mt-4 text-sm font-medium text-red-800 dark:text-red-200">
                This action cannot be undone. Make sure you have a backup if needed.
              </p>
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <UButton
            btn="solid-black"
            :loading="isResetting"
            :disabled="isResetting"
            @click="showResetConfirmation = true"
          >
            <template #leading>
              <UIcon name="i-ph-trash" />
            </template>
            Reset Entire Database
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Reset Confirmation Dialog -->
    <UDialog v-model:open="showResetConfirmation">
      <UCard class="border-none">
        <template #header>
          <div class="flex items-center space-x-3">
            <UIcon name="i-ph-warning-circle" class="h-6 w-6 text-red-500" />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Confirm Database Reset
            </h3>
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-gray-700 dark:text-gray-300">
            You are about to permanently delete all data in the database. This action cannot be undone.
          </p>

          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">
              What will happen:
            </h4>
            <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• All data rows in every table will be permanently deleted</li>
              <li>• The database schema (tables, indexes, triggers) will remain intact</li>
              <li>• A new admin user will be initialized</li>
              <li>• You will need to log in again after the reset</li>
            </ul>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type "RESET DATABASE" to confirm:
              </label>
              <UInput
                v-model="confirmationText"
                placeholder="RESET DATABASE"
                :disabled="isResetting"
                class="w-full"
              />
            </div>

            <div class="flex items-center space-x-2">
              <UCheckbox
                v-model="acknowledgeDataLoss"
                :disabled="isResetting"
              />
              <label class="text-sm text-gray-700 dark:text-gray-300">
                I understand that all data will be permanently deleted
              </label>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end space-x-3">
            <UButton
              btn="ghost"
              :disabled="isResetting"
              @click="cancelReset"
            >
              Cancel
            </UButton>
            <UButton
              btn="solid-black"
              :loading="isResetting"
              :disabled="!canConfirmReset"
              @click="confirmReset"
            >
              <template #leading>
                <UIcon name="i-ph-trash" />
              </template>
              Reset Database
            </UButton>
          </div>
        </template>
      </UCard>
    </UDialog>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({
  title: 'Verbatims • Database Maintenance - Admin'
})

// Reactive state
const isResetting = ref(false)
const showResetConfirmation = ref(false)
const confirmationText = ref('')
const acknowledgeDataLoss = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Computed properties
const canConfirmReset = computed(() => {
  return confirmationText.value === 'RESET DATABASE' &&
         acknowledgeDataLoss.value &&
         !isResetting.value
})

// Database reset functionality
const cancelReset = () => {
  showResetConfirmation.value = false
  confirmationText.value = ''
  acknowledgeDataLoss.value = false
}

const confirmReset = async () => {
  if (!canConfirmReset.value) return

  isResetting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    console.log('🔥 Initiating database reset...')

    const response = await $fetch('/api/admin/reset-database', {
      method: 'POST',
      body: {
        confirmationToken: 'RESET_DATABASE_CONFIRMED'
      }
    })

    console.log('✅ Database reset completed:', response)

    // Show success message (Worker-safe: data cleared, schema unchanged)
    successMessage.value = `Database reset completed successfully! ${response.data.tablesCleared} tables cleared, ${response.data.rowsDeleted} rows deleted. You will be redirected shortly.`

    // Close dialog
    showResetConfirmation.value = false
    cancelReset()

    // Redirect to home after a short delay since the user session has been cleared
    setTimeout(() => {
      console.log('🔄 Redirecting to home page...')
      navigateTo('/')
    }, 3000)

  } catch (error) {
    console.error('❌ Database reset failed:', error)

    // Show error message
    errorMessage.value = error.data?.message || error.message || 'Database reset failed. Please try again.'

    // Close dialog on error
    showResetConfirmation.value = false
    cancelReset()
  } finally {
    isResetting.value = false
  }
}


</script>
