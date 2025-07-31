<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Settings
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Manage your account preferences and settings.
      </p>
    </div>

    <!-- Settings Sections -->
    <div class="space-y-8">
      <!-- Profile Settings -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Profile Information
          </h2>
        </template>

        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Name
              </label>
              <UInput
                v-model="profileForm.name"
                placeholder="Your display name"
                size="lg"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <UInput
                v-model="profileForm.email"
                type="email"
                placeholder="your@email.com"
                size="lg"
                disabled
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bio
            </label>
            <UInput
              v-model="profileForm.bio"
              type="textarea"
              placeholder="Tell us about yourself..."
              :rows="3"
              size="lg"
            />
          </div>

          <div class="flex justify-end">
            <UButton
              :loading="savingProfile"
              @click="saveProfile"
            >
              Save Profile
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Language Preferences -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Language Preferences
          </h2>
        </template>

        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preferred Language
            </label>
            <LanguageSelector />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This affects the quotes you see by default and your submissions.
            </p>
          </div>
        </div>
      </UCard>

      <!-- Notification Settings -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Notifications
          </h2>
        </template>

        <div class="space-y-6">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                  Quote Approval Notifications
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Get notified when your submitted quotes are approved or rejected.
                </p>
              </div>
              <USwitch v-model="notificationSettings.quote_approval" />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                  Collection Updates
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Get notified when someone adds quotes to your public collections.
                </p>
              </div>
              <USwitch v-model="notificationSettings.collection_updates" />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                  Weekly Digest
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Receive a weekly summary of new quotes and activity.
                </p>
              </div>
              <USwitch v-model="notificationSettings.weekly_digest" />
            </div>
          </div>

          <div class="flex justify-end">
            <UButton
              :loading="savingNotifications"
              @click="saveNotifications"
            >
              Save Preferences
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Privacy Settings -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Privacy & Visibility
          </h2>
        </template>

        <div class="space-y-6">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                  Public Profile
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Allow others to see your profile and public collections.
                </p>
              </div>
              <USwitch v-model="privacySettings.public_profile" />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                  Show Quote Attribution
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Display your name as the submitter on approved quotes.
                </p>
              </div>
              <USwitch v-model="privacySettings.show_attribution" />
            </div>
          </div>

          <div class="flex justify-end">
            <UButton
              :loading="savingPrivacy"
              @click="savePrivacy"
            >
              Save Settings
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Danger Zone -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold text-red-600 dark:text-red-400">
            Danger Zone
          </h2>
        </template>

        <div class="space-y-6">
          <div class="border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              Delete Account
            </h3>
            <p class="text-sm text-red-600 dark:text-red-400 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <UButton
              color="red"
              variant="outline"
              @click="showDeleteModal = true"
            >
              Delete Account
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Delete Account Confirmation -->
    <UDialog v-model="showDeleteModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Delete Account</h3>
        </template>
        
        <div class="space-y-4">
          <p class="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete your account? This will permanently remove:
          </p>
          <ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>Your profile and account information</li>
            <li>All your submitted quotes (drafts, pending, and published)</li>
            <li>Your collections and lists</li>
            <li>Your likes and favorites</li>
            <li>All associated data</li>
          </ul>
          <p class="text-red-600 dark:text-red-400 font-medium">
            This action cannot be undone.
          </p>
        </div>
        
        <template #footer>
          <div class="flex justify-end space-x-3">
            <UButton btn="outline" @click="showDeleteModal = false">
              Cancel
            </UButton>
            <UButton
              color="red"
              :loading="deleting"
              @click="deleteAccount"
            >
              Delete My Account
            </UButton>
          </div>
        </template>
      </UCard>
    </UDialog>
  </div>
</template>

<script setup lang="ts">
// Types for settings forms
interface ProfileForm {
  name: string
  email: string
  bio: string
}

interface NotificationSettings {
  quote_approval: boolean
  collection_updates: boolean
  weekly_digest: boolean
}

interface PrivacySettings {
  public_profile: boolean
  show_attribution: boolean
}

// Use dashboard layout
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

// SEO
useHead({
  title: 'Settings - Dashboard - Verbatims'
})

const { user } = useUserSession()

// Form data
const profileForm = ref<ProfileForm>({
  name: user.value?.name || '',
  email: user.value?.email || '',
  bio: (user.value as any)?.bio || ''
})

const notificationSettings = ref<NotificationSettings>({
  quote_approval: true,
  collection_updates: true,
  weekly_digest: false
})

const privacySettings = ref<PrivacySettings>({
  public_profile: true,
  show_attribution: true
})

// Loading states
const savingProfile = ref(false)
const savingNotifications = ref(false)
const savingPrivacy = ref(false)
const deleting = ref(false)

// Modals
const showDeleteModal = ref(false)

// Methods
const saveProfile = async () => {
  savingProfile.value = true
  try {
    await $fetch('/api/user/profile', {
      method: 'PUT',
      body: profileForm.value
    })
    // Could show success toast here
  } catch (error) {
    console.error('Failed to save profile:', error)
    // Could show error toast here
  } finally {
    savingProfile.value = false
  }
}

const saveNotifications = async () => {
  savingNotifications.value = true
  try {
    await $fetch('/api/user/notifications', {
      method: 'PUT',
      body: notificationSettings.value
    })
    // Could show success toast here
  } catch (error) {
    console.error('Failed to save notification settings:', error)
    // Could show error toast here
  } finally {
    savingNotifications.value = false
  }
}

const savePrivacy = async () => {
  savingPrivacy.value = true
  try {
    await $fetch('/api/user/privacy', {
      method: 'PUT',
      body: privacySettings.value
    })
    // Could show success toast here
  } catch (error) {
    console.error('Failed to save privacy settings:', error)
    // Could show error toast here
  } finally {
    savingPrivacy.value = false
  }
}

const deleteAccount = async () => {
  deleting.value = true
  try {
    await $fetch('/api/user/account', {
      method: 'DELETE'
    })
    // Redirect to home page after deletion
    await navigateTo('/')
  } catch (error) {
    console.error('Failed to delete account:', error)
    // Could show error toast here
  } finally {
    deleting.value = false
  }
}

// Load user settings on mount
onMounted(async () => {
  try {
    const [notificationData, privacyData] = await Promise.all([
      $fetch('/api/user/notifications'),
      $fetch('/api/user/privacy')
    ])

    if ((notificationData as any)?.data) {
      notificationSettings.value = { ...notificationSettings.value, ...(notificationData as any).data }
    }

    if ((privacyData as any)?.data) {
      privacySettings.value = { ...privacySettings.value, ...(privacyData as any).data }
    }
  } catch (error) {
    console.error('Failed to load user settings:', error)
  }
})
</script>
