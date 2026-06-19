<template>
  <div>
    <!-- Header -->
    <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
        Settings
      </h1>
      <div class="flex items-center gap-5 mt-4 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="activeTab = tab.value"
          class="font-sans text-xs uppercase tracking-[0.15em] whitespace-nowrap transition-colors pb-1"
          :class="activeTab === tab.value
            ? 'text-gray-900 dark:text-gray-100 font-600 border-b border-dashed border-gray-900 dark:border-gray-100'
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'"
        >
          {{ tab.name }}
        </button>
      </div>
    </div>

    <!-- Profile Tab -->
    <div v-if="activeTab === 'profile'" class="space-y-8">
      <!-- Profile Information -->
      <div class="pb-8 border-b border-dashed border-gray-200 dark:border-gray-700">
        <h2 class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 mb-5">
          Profile Information
        </h2>
        <div class="space-y-5 max-w-lg">
          <div>
            <label class="block font-sans text-sm text-gray-700 dark:text-gray-300 mb-1.5">Display Name</label>
            <input
              v-model="profileForm.name"
              type="text"
              placeholder="Your display name"
              class="w-full font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400"
            />
          </div>
          <div>
            <label class="block font-sans text-sm text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
            <input
              v-model="profileForm.email"
              type="email"
              placeholder="your@email.com"
              disabled
              class="w-full font-sans text-sm bg-transparent border-b border-dashed border-gray-200 dark:border-gray-700 px-2 py-1.5 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            />
            <p class="font-sans text-xs text-gray-400 dark:text-gray-500 mt-1">Email cannot be changed. Contact support if needed.</p>
          </div>
          <div>
            <label class="block font-sans text-sm text-gray-700 dark:text-gray-300 mb-1.5">Bio</label>
            <textarea
              v-model="profileForm.bio"
              placeholder="Tell us about yourself..."
              rows="4"
              class="w-full font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400 resize-none"
            />
          </div>
          <div class="pt-2">
            <button
              :disabled="savingProfile"
              class="font-sans text-xs text-gray-700 dark:text-gray-300 border border-dashed border-gray-300 dark:border-gray-600 px-4 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-sm disabled:opacity-50"
              @click="saveProfile"
            >
              {{ savingProfile ? 'Saving...' : 'Save Profile' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Language Preferences -->
      <div class="pb-8 border-b border-dashed border-gray-200 dark:border-gray-700">
        <h2 class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 mb-5">
          Language Preferences
        </h2>
        <div class="max-w-lg">
          <label class="block font-sans text-sm text-gray-700 dark:text-gray-300 mb-1.5">Preferred Language</label>
          <LanguageSelector />
          <p class="font-sans text-xs text-gray-400 dark:text-gray-500 mt-1">This affects the quotes you see by default and your submissions.</p>
        </div>
      </div>

      <!-- Privacy & Visibility -->
      <div>
        <h2 class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 mb-5">
          Privacy &amp; Visibility
        </h2>
        <div class="space-y-5 max-w-lg">
          <div class="flex items-center justify-between gap-4 py-3 border-b border-dashed border-gray-100 dark:border-gray-800">
            <div>
              <h3 class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100">Public Profile</h3>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400">Allow others to see your profile and public collections.</p>
            </div>
            <NSwitch v-model="privacySettings.public_profile" switch-checked="indigo" />
          </div>
          <div class="flex items-center justify-between gap-4 py-3 border-b border-dashed border-gray-100 dark:border-gray-800">
            <div>
              <h3 class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100">Show Quote Attribution</h3>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400">Display your name as the submitter on approved quotes.</p>
            </div>
            <NSwitch v-model="privacySettings.show_attribution" switch-checked="indigo" />
          </div>
        </div>
      </div>
    </div>

    <!-- User Interface Tab -->
    <div v-else-if="activeTab === 'ui'" class="space-y-8">
      <div>
        <h2 class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 mb-5">
          User Interface
        </h2>
        <div class="max-w-lg">
          <label class="block font-sans text-sm text-gray-700 dark:text-gray-300 mb-1.5">Theme</label>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mb-4">Choose your preferred theme for the application.</p>
          <ThemeSelector />
        </div>
        <div class="flex items-center justify-between gap-4 py-3 mt-6 border-b border-dashed border-gray-100 dark:border-gray-800 max-w-lg">
          <div>
            <h3 class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100">Show Home Title</h3>
            <p class="font-sans text-xs text-gray-500 dark:text-gray-400">Show the big "VERBATIMS" title on the home page.</p>
          </div>
          <NSwitch v-model="showHomeTitle" switch-checked="indigo" />
        </div>
      </div>
    </div>

    <!-- Notifications Tab -->
    <div v-else-if="activeTab === 'notifications'" class="space-y-8">
      <div>
        <h2 class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 mb-5">
          Notifications
        </h2>
        <div class="space-y-1 max-w-lg">
          <div class="flex items-center justify-between gap-4 py-3 border-b border-dashed border-gray-100 dark:border-gray-800">
            <div>
              <h3 class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100">Quote Approval</h3>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400">Get notified when your submitted quotes are approved or rejected.</p>
            </div>
            <NSwitch v-model="notificationSettings.quote_approval" switch-checked="indigo" />
          </div>
          <div class="flex items-center justify-between gap-4 py-3 border-b border-dashed border-gray-100 dark:border-gray-800">
            <div>
              <h3 class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100">Collection Updates</h3>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400">Get notified when someone adds quotes to your public collections.</p>
            </div>
            <NSwitch v-model="notificationSettings.collection_updates" switch-checked="indigo" />
          </div>
          <div class="flex items-center justify-between gap-4 py-3 border-b border-dashed border-gray-100 dark:border-gray-800">
            <div>
              <h3 class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100">Weekly Digest</h3>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400">Receive a weekly summary of new quotes and activity.</p>
            </div>
            <NSwitch v-model="notificationSettings.weekly_digest" switch-checked="indigo" />
          </div>
        </div>
      </div>
    </div>

    <!-- Data Tab -->
    <div v-else-if="activeTab === 'data'">
      <div class="max-w-lg">
        <h2 class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 mb-5">
          Danger Zone
        </h2>
        <div class="border border-dashed border-red-200 dark:border-red-900 rounded-sm p-5">
          <h3 class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100 mb-1">Delete Account</h3>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            class="font-sans text-xs text-red-600 dark:text-red-400 border border-dashed border-red-300 dark:border-red-800 px-4 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-sm"
            @click="showDeleteModal = true"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Account Confirmation -->
    <ClientOnly>
      <NDialog v-model="showDeleteModal">
        <NCard>
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
              <NButton btn="outline" @click="showDeleteModal = false">Cancel</NButton>
              <NButton color="red" :loading="deleting" @click="deleteAccount">Delete My Account</NButton>
            </div>
          </template>
        </NCard>
      </NDialog>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { useStorage } from '@vueuse/core'

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

const { showErrorToast } = useErrorToast()

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

useHead({
  title: 'Settings - Dashboard - Verbatims'
})

const pageHeader = usePageHeader()

onMounted(() => {
  pageHeader.setHeaderFromRoute()
})

const { user } = useUserSession()

const tabs = [
  { name: 'Profile', value: 'profile' },
  { name: 'User Interface', value: 'ui' },
  { name: 'Notifications', value: 'notifications' },
  { name: 'Data', value: 'data' }
]

const activeTab = ref('profile')

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

const savingProfile = ref(false)
const savingNotifications = ref(false)
const savingPrivacy = ref(false)
const deleting = ref(false)

const showDeleteModal = ref(false)

const showHomeTitle = useStorage('verbatims.show_home_title', true)

// Auto-save privacy and notification settings on toggle
let privacyTimer: ReturnType<typeof setTimeout> | null = null
watch(privacySettings, () => {
  if (privacyTimer) clearTimeout(privacyTimer)
  privacyTimer = setTimeout(() => savePrivacy(), 500)
}, { deep: true })

let notificationTimer: ReturnType<typeof setTimeout> | null = null
watch(notificationSettings, () => {
  if (notificationTimer) clearTimeout(notificationTimer)
  notificationTimer = setTimeout(() => saveNotifications(), 500)
}, { deep: true })

const saveProfile = async () => {
  savingProfile.value = true
  try {
    await $fetch('/api/user/profile', {
      method: 'PUT',
      body: profileForm.value
    })
  } catch (error) {
    console.error('Failed to save profile:', error)
    showErrorToast(error, 'Failed to save profile information.')
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
  } catch (error) {
    console.error('Failed to save notification settings:', error)
    showErrorToast(error, 'Failed to save notification settings.')
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
  } catch (error) {
    console.error('Failed to save privacy settings:', error)
    showErrorToast(error, 'Failed to save privacy settings.')
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
    await navigateTo('/')
  } catch (error) {
    console.error('Failed to delete account:', error)
    showErrorToast(error, 'Failed to delete account.')
  } finally {
    deleting.value = false
  }
}

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
