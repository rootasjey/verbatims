<template>
  <div class="min-h-screen">
    <!-- Mobile layout -->
    <div v-if="isMobile" class="mobile-settings-page">
      <!-- Header & Tab selector -->
      <div class="p-4 pt-6">
        <div class="text-center mb-4">
          <h1 class="text-2xl font-600 text-gray-900 dark:text-white">Settings</h1>
          <p class="text-gray-600 dark:text-gray-400">Manage your profile, notifications, and data</p>
        </div>

        <div class="flex gap-3">
          <NSelect
            v-model="selectedTab"
            :items="tabs"
            placeholder="Section"
            size="sm"
            item-key="name"
            value-key="name"
            class="flex-1"
          />
        </div>
      </div>

      <!-- Content -->
      <div class="px-4 pb-6 space-y-6">
        <!-- Profile Tab: Profile Info + Language + Privacy -->
        <div v-if="selectedTab.value === 'profile'" class="space-y-6">
          <NCard class="shadow-none">
            <template #header>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Profile Information
              </h2>
            </template>

            <div class="space-y-6">
              <div class="grid grid-cols-1 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name
                  </label>
                  <NInput
                    v-model="profileForm.name"
                    placeholder="Your display name"
                    size="md"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <NInput
                    v-model="profileForm.email"
                    type="email"
                    placeholder="your@email.com"
                    size="md"
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
                <NInput
                  v-model="profileForm.bio"
                  type="textarea"
                  placeholder="Tell us about yourself..."
                  :rows="4"
                  size="md"
                />
              </div>

              <div class="flex">
                <NButton
                  btn="solid-black"
                  class="w-full"
                  :loading="savingProfile"
                  @click="saveProfile"
                >
                  Save Profile
                </NButton>
              </div>
            </div>
          </NCard>

          <NCard class="shadow-none">
            <template #header>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Language Preferences
              </h2>
            </template>

            <div class="space-y-4">
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
          </NCard>

          <NCard class="shadow-none">
            <template #header>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Privacy & Visibility
              </h2>
            </template>

            <div class="space-y-6">
              <div class="space-y-4">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                      Public Profile
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Allow others to see your profile and public collections.
                    </p>
                  </div>
                  <NSwitch v-model="privacySettings.public_profile" />
                </div>

                <div class="flex items-center justify-between gap-4">
                  <div>
                    <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                      Show Quote Attribution
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Display your name as the submitter on approved quotes.
                    </p>
                  </div>
                  <NSwitch v-model="privacySettings.show_attribution" />
                </div>
              </div>

              <div class="flex">
                <NButton
                  btn="solid-black"
                  class="w-full"
                  :loading="savingPrivacy"
                  @click="savePrivacy"
                >
                  Save Settings
                </NButton>
              </div>
            </div>
          </NCard>
        </div>

        <div v-else-if="selectedTab.value === 'ui'" class="space-y-6">
          <NCard class="shadow-none">
            <template #header>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                User Interface
              </h2>
            </template>

            <div class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Choose your preferred theme for the application.
                </p>
                <ThemeSelector />
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Show Home Title
                  </label>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Show the big "VERBATIMS" title on the home page.
                  </p>
                </div>
                <NSwitch v-model="showHomeTitle" />
              </div>
            </div>
          </NCard>
        </div>

        <!-- Notifications Tab -->
        <div v-else-if="selectedTab.value === 'notifications'" class="space-y-6">
          <NCard class="shadow-none">
            <template #header>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h2>
            </template>

            <div class="space-y-6">
              <div class="space-y-4">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                      Quote Approval Notifications
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Get notified when your submitted quotes are approved or rejected.
                    </p>
                  </div>
                  <NSwitch v-model="notificationSettings.quote_approval" />
                </div>

                <div class="flex items-center justify-between gap-4">
                  <div>
                    <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                      Collection Updates
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Get notified when someone adds quotes to your public collections.
                    </p>
                  </div>
                  <NSwitch v-model="notificationSettings.collection_updates" />
                </div>

                <div class="flex items-center justify-between gap-4">
                  <div>
                    <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                      Weekly Digest
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Receive a weekly summary of new quotes and activity.
                    </p>
                  </div>
                  <NSwitch v-model="notificationSettings.weekly_digest" />
                </div>
              </div>

              <div class="flex">
                <NButton
                  btn="solid-black"
                  class="w-full"
                  :loading="savingNotifications"
                  @click="saveNotifications"
                >
                  Save Preferences
                </NButton>
              </div>
            </div>
          </NCard>
        </div>

        <!-- Data Tab: Danger Zone -->
        <div v-else-if="selectedTab.value === 'data'" class="space-y-6">
          <NCard class="shadow-none">
            <template #header>
              <h2 class="text-lg font-semibold">
                Danger Zone
              </h2>
            </template>

            <div class="space-y-6">
              <div class="border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 class="text-sm font-medium mb-2">
                  Delete Account
                </h3>
                <p class="text-sm mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <NButton
                  btn="solid-red"
                  variant="outline"
                  class="w-full"
                  @click="showDeleteModal = true"
                >
                  Delete Account
                </NButton>
              </div>
            </div>
          </NCard>
        </div>
      </div>
    </div>

    <!-- Desktop layout -->
    <div v-else>
      <!-- Tabs wrapper -->
      <NTabs v-model="activeTab" :items="tabs" class="w-full">
        <template #content="{ item }">
        <!-- Profile Tab: Profile Info + Language + Privacy -->
        <div v-if="item.value === 'profile'" class="space-y-8">
          <NCard class="shadow-none">
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
                  <NInput
                    v-model="profileForm.name"
                    placeholder="Your display name"
                    size="lg"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <NInput
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
                <NInput
                  v-model="profileForm.bio"
                  type="textarea"
                  placeholder="Tell us about yourself..."
                  :rows="3"
                  size="lg"
                />
              </div>

              <div class="flex justify-end">
                <NButton
                  btn="solid-black"
                  :loading="savingProfile"
                  @click="saveProfile"
                >
                  Save Profile
                </NButton>
              </div>
            </div>
          </NCard>

          <NCard class="shadow-none">
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
          </NCard>

          <NCard class="shadow-none">
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
                  <NSwitch v-model="privacySettings.public_profile" />
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
                  <NSwitch v-model="privacySettings.show_attribution" />
                </div>
              </div>

              <div class="flex justify-end">
                <NButton
                  btn="solid-black"
                  :loading="savingPrivacy"
                  @click="savePrivacy"
                >
                  Save Settings
                </NButton>
              </div>
            </div>
          </NCard>
        </div>

        <!-- User Interface Tab -->
        <div v-else-if="item.value === 'ui'" class="space-y-8">
          <NCard class="shadow-none">
            <template #header>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                User Interface
              </h2>
            </template>

            <div class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Choose your preferred theme for the application.
                </p>
                <ThemeSelector />
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Show Home Title
                  </label>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Show the big "VERBATIMS" title on the home page.
                  </p>
                </div>
                <NSwitch v-model="showHomeTitle" />
              </div>
            </div>
          </NCard>
        </div>

        <!-- Notifications Tab -->
        <div v-else-if="item.value === 'notifications'" class="space-y-8">
          <NCard class="shadow-none">
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
                  <NSwitch v-model="notificationSettings.quote_approval" />
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
                  <NSwitch v-model="notificationSettings.collection_updates" />
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
                  <NSwitch v-model="notificationSettings.weekly_digest" />
                </div>
              </div>

              <div class="flex justify-end">
                <NButton
                  btn="solid-black"
                  :loading="savingNotifications"
                  @click="saveNotifications"
                >
                  Save Preferences
                </NButton>
              </div>
            </div>
          </NCard>
        </div>

        <!-- Data Tab: Danger Zone -->
        <div v-else-if="item.value === 'data'" class="space-y-8">
          <NCard class="shadow-none">
            <template #header>
              <h2 class="text-xl font-semibold">
                Danger Zone
              </h2>
            </template>

            <div class="space-y-6">
              <div class="border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 class="text-sm font-medium mb-2">
                  Delete Account
                </h3>
                <p class="text-sm mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <NButton
                  btn="solid-red"
                  variant="outline"
                  @click="showDeleteModal = true"
                >
                  Delete Account
                </NButton>
              </div>
            </div>
          </NCard>
        </div>
      </template>
    </NTabs>
    </div>

    <!-- Delete Account Confirmation -->
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
            <NButton btn="outline" @click="showDeleteModal = false">
              Cancel
            </NButton>
            <NButton
              color="red"
              :loading="deleting"
              @click="deleteAccount"
            >
              Delete My Account
            </NButton>
          </div>
        </template>
      </NCard>
    </NDialog>
  </div>
</template><template #header>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Profile Information
              </h2>
            </template>

            <div class="space-y-6">
              <div class="grid grid-cols-1 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name
                  </label>
                  <NInput
                    v-model="profileForm.name"
                    placeholder="Your display name"
                    size="md"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <NInput
                    v-model="profileForm.email"
                    type="email"
                    placeholder="your@email.com"
                    size="md"
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
                <NInput
                  v-model="profileForm.bio"
                  type="textarea"
                  placeholder="Tell us about yourself..."
                  :rows="4"
                  size="md"
                />
              </div>

              <div class="flex">
                <NButton
                  btn="solid-black"
                  class="w-full"
                  :loading="savingProfile"
                  @click="saveProfile"
                >
                  Save Profile
                </NButton>
              </div>
            </div>
          </NCard>

          <NCard class="shadow-none">
            <template #header>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Language Preferences
              </h2>
            </template>

            <div class="space-y-4">
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
          </NCard>

          <NCard class="shadow-none">
            <template #header>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Privacy & Visibility
              </h2>
            </template>

            <div class="space-y-6">
              <div class="space-y-4">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                      Public Profile
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Allow others to see your profile and public collections.
                    </p>
                  </div>
                  <NSwitch v-model="privacySettings.public_profile" />
                </div>

                <div class="flex items-center justify-between gap-4">
                  <div>
                    <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                      Show Quote Attribution
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Display your name as the submitter on approved quotes.
                    </p>
                  </div>
                  <NSwitch v-model="privacySettings.show_attribution" />
                </div>
              </div>

              <div class="flex">
                <NButton
                  btn="solid-black"
                  class="w-full"
                  :loading="savingPrivacy"
                  @click="savePrivacy"
                >
                  Save Settings
                </NButton>
              </div>
            </div>
          </NCard>
        </div>

        <div v-else-if="selectedTab.value === 'ui'" class="space-y-6">
          <NCard class="shadow-none">
            <template #header>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                User Interface
              </h2>
            </template>

            <div class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Choose your preferred theme for the application.
                </p>
                <ThemeSelector />
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Show Home Title
                  </label>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Show the big "VERBATIMS" title on the home page.
                  </p>
                </div>
                <NSwitch v-model="showHomeTitle" />
              </div>
            </div>
          </NCard>
        </div>

        <!-- Notifications Tab -->
        <div v-else-if="selectedTab.value === 'notifications'" class="space-y-6">
          <NCard class="shadow-none">
            <template #header>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h2>
            </template>

            <div class="space-y-6">
              <div class="space-y-4">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                      Quote Approval Notifications
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Get notified when your submitted quotes are approved or rejected.
                    </p>
                  </div>
                  <NSwitch v-model="notificationSettings.quote_approval" />
                </div>

                <div class="flex items-center justify-between gap-4">
                  <div>
                    <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                      Collection Updates
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Get notified when someone adds quotes to your public collections.
                    </p>
                  </div>
                  <NSwitch v-model="notificationSettings.collection_updates" />
                </div>

                <div class="flex items-center justify-between gap-4">
                  <div>
                    <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                      Weekly Digest
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      Receive a weekly summary of new quotes and activity.
                    </p>
                  </div>
                  <NSwitch v-model="notificationSettings.weekly_digest" />
                </div>
              </div>

              <div class="flex">
                <NButton
                  btn="solid-black"
                  class="w-full"
                  :loading="savingNotifications"
                  @click="saveNotifications"
                >
                  Save Preferences
                </NButton>
              </div>
            </div>
          </NCard>
        </div>

        <!-- Data Tab: Danger Zone -->
        <div v-else-if="selectedTab.value === 'data'" class="space-y-6">
          <NCard class="shadow-none">
            <template #header>
              <h2 class="text-lg font-semibold">
                Danger Zone
              </h2>
            </template>

            <div class="space-y-6">
              <div class="border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 class="text-sm font-medium mb-2">
                  Delete Account
                </h3>
                <p class="text-sm mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <NButton
                  btn="solid-red"
                  variant="outline"
                  class="w-full"
                  @click="showDeleteModal = true"
                >
                  Delete Account
                </NButton>
              </div>
            </div>
          </NCard>
        </div>
      </div>
    </div>

    <!-- Desktop layout -->
    <div v-else>
      <!-- Tabs wrapper -->
      <NTabs v-model="activeTab" :items="tabs" class="w-full">
        <template #content="{ item }">
        <!-- Profile Tab: Profile Info + Language + Privacy -->
        <div v-if="item.value === 'profile'" class="space-y-8">
          <NCard class="shadow-none">
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
                  <NInput
                    v-model="profileForm.name"
                    placeholder="Your display name"
                    size="lg"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <NInput
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
                <NInput
                  v-model="profileForm.bio"
                  type="textarea"
                  placeholder="Tell us about yourself..."
                  :rows="3"
                  size="lg"
                />
              </div>

              <div class="flex justify-end">
                <NButton
                  btn="solid-black"
                  :loading="savingProfile"
                  @click="saveProfile"
                >
                  Save Profile
                </NButton>
              </div>
            </div>
          </NCard>

          <NCard class="shadow-none">
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
          </NCard>

          <NCard class="shadow-none">
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
                  <NSwitch v-model="privacySettings.public_profile" />
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
                  <NSwitch v-model="privacySettings.show_attribution" />
                </div>
              </div>

              <div class="flex justify-end">
                <NButton
                  btn="solid-black"
                  :loading="savingPrivacy"
                  @click="savePrivacy"
                >
                  Save Settings
                </NButton>
              </div>
            </div>
          </NCard>
        </div>

        <!-- User Interface Tab -->
        <div v-else-if="item.value === 'ui'" class="space-y-8">
          <NCard class="shadow-none">
            <template #header>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                User Interface
              </h2>
            </template>

            <div class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Choose your preferred theme for the application.
                </p>
                <ThemeSelector />
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Show Home Title
                  </label>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Show the big "VERBATIMS" title on the home page.
                  </p>
                </div>
                <NSwitch v-model="showHomeTitle" />
              </div>
            </div>
          </NCard>
        </div>

        <!-- Notifications Tab -->
        <div v-else-if="item.value === 'notifications'" class="space-y-8">
          <NCard class="shadow-none">
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
                  <NSwitch v-model="notificationSettings.quote_approval" />
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
                  <NSwitch v-model="notificationSettings.collection_updates" />
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
                  <NSwitch v-model="notificationSettings.weekly_digest" />
                </div>
              </div>

              <div class="flex justify-end">
                <NButton
                  btn="solid-black"
                  :loading="savingNotifications"
                  @click="saveNotifications"
                >
                  Save Preferences
                </NButton>
              </div>
            </div>
          </NCard>
        </div>

        <!-- Data Tab: Danger Zone -->
        <div v-else-if="item.value === 'data'" class="space-y-8">
          <NCard class="shadow-none">
            <template #header>
              <h2 class="text-xl font-semibold">
                Danger Zone
              </h2>
            </template>

            <div class="space-y-6">
              <div class="border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 class="text-sm font-medium mb-2">
                  Delete Account
                </h3>
                <p class="text-sm mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <NButton
                  btn="solid-red"
                  variant="outline"
                  @click="showDeleteModal = true"
                >
                  Delete Account
                </NButton>
              </div>
            </div>
          </NCard>
        </div>
      </template><template #header>
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
                  <NInput
                    v-model="profileForm.name"
                    placeholder="Your display name"
                    size="lg"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <NInput
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
                <NInput
                  v-model="profileForm.bio"
                  type="textarea"
                  placeholder="Tell us about yourself..."
                  :rows="3"
                  size="lg"
                />
              </div>

              <div class="flex justify-end">
                <NButton
                  btn="solid-black"
                  :loading="savingProfile"
                  @click="saveProfile"
                >
                  Save Profile
                </NButton>
              </div>
            </div>
          </NCard>

          <NCard class="shadow-none">
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
          </NCard>

          <NCard class="shadow-none">
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
                  <NSwitch v-model="privacySettings.public_profile" />
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
                  <NSwitch v-model="privacySettings.show_attribution" />
                </div>
              </div>

              <div class="flex justify-end">
                <NButton
                  btn="solid-black"
                  :loading="savingPrivacy"
                  @click="savePrivacy"
                >
                  Save Settings
                </NButton>
              </div>
            </div>
          </NCard>
        </div>

        <!-- User Interface Tab -->
        <div v-else-if="item.value === 'ui'" class="space-y-8">
          <NCard class="shadow-none">
            <template #header>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                User Interface
              </h2>
            </template>

            <div class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Choose your preferred theme for the application.
                </p>
                <ThemeSelector />
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Show Home Title
                  </label>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Show the big "VERBATIMS" title on the home page.
                  </p>
                </div>
                <NSwitch v-model="showHomeTitle" />
              </div>
            </div>
          </NCard>
        </div>

        <!-- Notifications Tab -->
        <div v-else-if="item.value === 'notifications'" class="space-y-8">
          <NCard class="shadow-none">
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
                  <NSwitch v-model="notificationSettings.quote_approval" />
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
                  <NSwitch v-model="notificationSettings.collection_updates" />
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
                  <NSwitch v-model="notificationSettings.weekly_digest" />
                </div>
              </div>

              <div class="flex justify-end">
                <NButton
                  btn="solid-black"
                  :loading="savingNotifications"
                  @click="saveNotifications"
                >
                  Save Preferences
                </NButton>
              </div>
            </div>
          </NCard>
        </div>

        <!-- Data Tab: Danger Zone -->
        <div v-else-if="item.value === 'data'" class="space-y-8">
          <NCard class="shadow-none">
            <template #header>
              <h2 class="text-xl font-semibold">
                Danger Zone
              </h2>
            </template>

            <div class="space-y-6">
              <div class="border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 class="text-sm font-medium mb-2">
                  Delete Account
                </h3>
                <p class="text-sm mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <NButton
                  btn="solid-red"
                  variant="outline"
                  @click="showDeleteModal = true"
                >
                  Delete Account
                </NButton>
              </div>
            </div>
          </NCard>
        </div>
      </template>
    </NTabs>
    </div>

    <!-- Delete Account Confirmation -->
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
            <NButton btn="outline" @click="showDeleteModal = false">
              Cancel
            </NButton>
            <NButton
              color="red"
              :loading="deleting"
              @click="deleteAccount"
            >
              Delete My Account
            </NButton>
          </div>
        </template>
      </NCard>
    </NDialog>
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

const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()

definePageMeta({
  layout: false,
  middleware: 'auth'
})

useHead({
  title: 'Settings - Dashboard - Verbatims'
})

const { user } = useUserSession()

const activeTab = ref('profile')
const tabs = [
  { name: 'Profile', value: 'profile' },
  { name: 'User Interface', value: 'ui' },
  { name: 'Notifications', value: 'notifications' },
  { name: 'Data', value: 'data' }
]

const selectedTab = computed({
  get: () => tabs.find(t => t.value === activeTab.value) || tabs[0],
  set: (tab: any) => { activeTab.value = tab?.value || 'profile' }
})

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

const saveProfile = async () => {
  savingProfile.value = true
  try {
    await $fetch('/api/user/profile', {
      method: 'PUT',
      body: profileForm.value
    })
  } catch (error) {
    console.error('Failed to save profile:', error)
    useToast().toast({
      title: 'Error',
      description: 'Failed to save profile information.',
      toast: 'error'
    })
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
    useToast().toast({
      title: 'Error',
      description: 'Failed to save notification settings.',
      toast: 'error'
    })
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
    useToast().toast({
      title: 'Error',
      description: 'Failed to save privacy settings.',
      toast: 'error'
    })
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
    useToast().toast({
      title: 'Error',
      description: 'Failed to delete account.',
      toast: 'error'
    })
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  try {
  setPageLayout(currentLayout.value)
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

watch(currentLayout, (newLayout) => {
  setPageLayout(newLayout)
})
</script>

<style scoped>
.mobile-settings-page {
  min-height: calc(100vh - 80px);
}
</style>
