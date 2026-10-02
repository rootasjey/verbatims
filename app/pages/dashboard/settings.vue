<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h2 class="font-serif text-2xl font-500 leading-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
        {{ $t('title') }}
      </h2>
      <div class="mt-5 flex items-center gap-6 overflow-x-auto border-b border-black/10 dark:border-white/10">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="activeTab = tab.value"
          type="button"
          class="whitespace-nowrap border-b-2 border-transparent px-1 py-2 font-sans text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/20 dark:focus-visible:ring-white/20"
          :class="activeTab === tab.value
            ? 'border-gray-900 font-600 text-gray-900 dark:border-gray-100 dark:text-gray-100'
            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'"
        >
          {{ tab.name }}
        </button>
      </div>
    </div>

    <Transition name="dashboard-tab" mode="out-in">
    <!-- Profile Tab -->
    <div v-if="activeTab === 'profile'" key="profile" class="space-y-10">
      <!-- Profile Information -->
      <div class="border-b border-gray-200 pb-8 dark:border-white/10">
        <h2 class="mb-5 font-serif text-xl font-500 leading-snug text-gray-900 dark:text-gray-100">
          {{ $t('section_profile') }}
        </h2>
        <div class="max-w-2xl space-y-6">
          <div>
            <label class="mb-2 block font-sans text-sm font-500 text-gray-800 dark:text-gray-200">{{ $t('label_display_name') }}</label>
            <input
              v-model="profileForm.name"
              type="text"
              :placeholder="$t('placeholder_display_name') as string"
              class="w-full rounded-md border border-gray-300 bg-white/60 px-3 py-2.5 font-sans text-sm text-gray-900 placeholder-gray-500 transition-colors focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:border-white/15 dark:bg-white/[0.04] dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-gray-400 dark:focus:ring-white/10"
            />
          </div>
          <div>
            <label class="mb-2 block font-sans text-sm font-500 text-gray-800 dark:text-gray-200">{{ $t('label_email') }}</label>
            <input
              v-model="profileForm.email"
              type="email"
              :placeholder="$t('placeholder_email') as string"
              disabled
              class="w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-3 py-2.5 font-sans text-sm text-gray-500 opacity-80 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400"
            />
            <p class="mt-2 font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">{{ $t('helper_email') }}</p>
          </div>
          <div>
            <label class="mb-2 block font-sans text-sm font-500 text-gray-800 dark:text-gray-200">{{ $t('label_bio') }}</label>
            <textarea
              v-model="profileForm.bio"
              :placeholder="$t('placeholder_bio') as string"
              rows="4"
              class="w-full resize-y rounded-md border border-gray-300 bg-white/60 px-3 py-2.5 font-sans text-sm leading-relaxed text-gray-900 placeholder-gray-500 transition-colors focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:border-white/15 dark:bg-white/[0.04] dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-gray-400 dark:focus:ring-white/10"
            />
          </div>
          <div class="pt-2">
            <button
              :disabled="savingProfile"
              class="min-h-10 rounded-md border border-gray-300 px-4 py-2 font-sans text-sm font-600 text-gray-800 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20 dark:text-gray-100 dark:hover:bg-white/10 dark:focus-visible:ring-white/20"
              @click="saveProfile"
            >
              {{ savingProfile ? $t('saving') : $t('save_profile') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Language Preferences -->
      <div class="border-b border-gray-200 pb-8 dark:border-white/10">
        <h2 class="mb-5 font-serif text-xl font-500 leading-snug text-gray-900 dark:text-gray-100">
          {{ $t('section_language') }}
        </h2>
        <div class="max-w-2xl">
          <label class="mb-2 block font-sans text-sm font-500 text-gray-800 dark:text-gray-200">{{ $t('label_preferred_language') }}</label>
          <LanguageSelector />
          <p class="mt-2 font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">{{ $t('helper_language') }}</p>
        </div>
      </div>

      <!-- Privacy & Visibility -->
      <div>
        <h2 class="mb-5 font-serif text-xl font-500 leading-snug text-gray-900 dark:text-gray-100">
          {{ $t('section_privacy') }}
        </h2>
        <div class="max-w-2xl space-y-1">
          <div class="flex items-center justify-between gap-4 border-b border-gray-200 py-4 dark:border-white/10">
            <div>
              <h3 class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100">{{ $t('label_public_profile') }}</h3>
              <p class="mt-1 font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">{{ $t('desc_public_profile') }}</p>
            </div>
            <NSwitch v-model="privacySettings.public_profile" switch-checked="indigo" />
          </div>
          <div class="flex items-center justify-between gap-4 border-b border-gray-200 py-4 dark:border-white/10">
            <div>
              <h3 class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100">{{ $t('label_show_attribution') }}</h3>
              <p class="mt-1 font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">{{ $t('desc_show_attribution') }}</p>
            </div>
            <NSwitch v-model="privacySettings.show_attribution" switch-checked="indigo" />
          </div>
        </div>
      </div>
      <!-- Security -->
      <div class="border-b border-gray-200 pb-8 dark:border-white/10">
        <h2 class="mb-5 font-serif text-xl font-500 leading-snug text-gray-900 dark:text-gray-100">
          {{ $t('section_security') }}
        </h2>
        <div class="max-w-2xl space-y-6">
          <div>
            <label class="mb-2 block font-sans text-sm font-500 text-gray-800 dark:text-gray-200">{{ $t('label_current_password') }}</label>
            <input
              v-model="passwordForm.currentPassword"
              type="password"
              :placeholder="currentPasswordPlaceholder"
              class="w-full rounded-md border border-gray-300 bg-white/60 px-3 py-2.5 font-sans text-sm text-gray-900 placeholder-gray-500 transition-colors focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:border-white/15 dark:bg-white/[0.04] dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-gray-400 dark:focus:ring-white/10"
            />
          </div>
          <div>
            <label class="mb-2 block font-sans text-sm font-500 text-gray-800 dark:text-gray-200">{{ $t('label_new_password') }}</label>
            <input
              v-model="passwordForm.newPassword"
              type="password"
              :placeholder="newPasswordPlaceholder"
              class="w-full rounded-md border border-gray-300 bg-white/60 px-3 py-2.5 font-sans text-sm text-gray-900 placeholder-gray-500 transition-colors focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:border-white/15 dark:bg-white/[0.04] dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-gray-400 dark:focus:ring-white/10"
            />
          </div>
          <div>
            <label class="mb-2 block font-sans text-sm font-500 text-gray-800 dark:text-gray-200">{{ $t('label_confirm_password') }}</label>
            <input
              v-model="passwordForm.confirmPassword"
              type="password"
              :placeholder="confirmPasswordPlaceholder"
              class="w-full rounded-md border border-gray-300 bg-white/60 px-3 py-2.5 font-sans text-sm text-gray-900 placeholder-gray-500 transition-colors focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:border-white/15 dark:bg-white/[0.04] dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-gray-400 dark:focus:ring-white/10"
            />
          </div>
          <p v-if="passwordError" class="font-sans text-xs text-red-500 dark:text-red-400">{{ passwordError }}</p>
          <p v-else-if="passwordMessage" class="font-sans text-xs text-green-600 dark:text-green-400">{{ passwordMessage }}</p>
          <div class="pt-2">
            <button
              :disabled="savingPassword"
              class="min-h-10 rounded-md border border-gray-300 px-4 py-2 font-sans text-sm font-600 text-gray-800 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20 dark:text-gray-100 dark:hover:bg-white/10 dark:focus-visible:ring-white/20"
              @click="savePassword"
            >
              {{ savingPassword ? $t('saving') : $t('change_password') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="activeTab === 'ui'" key="ui" class="space-y-8">
      <div>
        <h2 class="mb-5 font-serif text-xl font-500 leading-snug text-gray-900 dark:text-gray-100">
          {{ $t('section_ui') }}
        </h2>
        <div class="max-w-2xl">
          <label class="mb-2 block font-sans text-sm font-500 text-gray-800 dark:text-gray-200">{{ $t('label_theme') }}</label>
          <p class="mb-4 font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">{{ $t('helper_theme') }}</p>
          <ThemeSelector />
        </div>
        <div class="mt-6 flex max-w-2xl items-center justify-between gap-4 border-b border-gray-200 py-4 dark:border-white/10">
          <div>
            <h3 class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100">{{ $t('label_show_home_title') }}</h3>
            <p class="mt-1 font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">{{ $t('desc_show_home_title') }}</p>
          </div>
          <NSwitch v-model="showHomeTitle" switch-checked="indigo" />
        </div>
      </div>
    </div>

    <!-- Notifications Tab -->
    <div v-else-if="activeTab === 'notifications'" key="notifications" class="space-y-8">
      <div>
        <h2 class="mb-5 font-serif text-xl font-500 leading-snug text-gray-900 dark:text-gray-100">
          {{ $t('section_notifications') }}
        </h2>
        <div class="max-w-2xl space-y-1">
          <div class="flex items-center justify-between gap-4 border-b border-gray-200 py-4 dark:border-white/10">
            <div>
              <h3 class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100">{{ $t('label_quote_approval') }}</h3>
              <p class="mt-1 font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">{{ $t('desc_quote_approval') }}</p>
            </div>
            <NSwitch v-model="notificationSettings.quote_approval" switch-checked="indigo" />
          </div>
          <div class="flex items-center justify-between gap-4 border-b border-gray-200 py-4 dark:border-white/10">
            <div>
              <h3 class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100">{{ $t('label_collection_updates') }}</h3>
              <p class="mt-1 font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">{{ $t('desc_collection_updates') }}</p>
            </div>
            <NSwitch v-model="notificationSettings.collection_updates" switch-checked="indigo" />
          </div>
          <div class="flex items-center justify-between gap-4 border-b border-gray-200 py-4 dark:border-white/10">
            <div>
              <h3 class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100">{{ $t('label_weekly_digest') }}</h3>
              <p class="mt-1 font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">{{ $t('desc_weekly_digest') }}</p>
            </div>
            <NSwitch v-model="notificationSettings.weekly_digest" switch-checked="indigo" />
          </div>
        </div>
      </div>
    </div>

    <!-- Data Tab -->
    <div v-else-if="activeTab === 'data'" key="data">
      <div class="max-w-2xl">
        <h2 class="mb-5 font-serif text-xl font-500 leading-snug text-gray-900 dark:text-gray-100">
          {{ $t('section_danger_zone') }}
        </h2>
        <div class="rounded-lg border border-red-200 p-5 dark:border-red-900/60">
          <h3 class="mb-1 font-sans text-base font-600 text-gray-900 dark:text-gray-100">{{ $t('heading_delete_account') }}</h3>
          <p class="mb-4 font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {{ $t('desc_delete_account') }}
          </p>
          <button
            class="min-h-10 rounded-md border border-red-300 px-4 py-2 font-sans text-sm font-600 text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            @click="showDeleteModal = true"
          >
            {{ $t('button_delete_account') }}
          </button>
        </div>
      </div>
    </div>
    </Transition>

    <!-- Delete Account Confirmation -->
    <ClientOnly>
      <NDialog v-model="showDeleteModal">
        <NCard>
          <template #header>
            <h3 class="text-lg font-semibold text-red-600">{{ $t('dialog_delete_title') }}</h3>
          </template>
          <div class="space-y-4">
            <p class="text-gray-600 dark:text-gray-400">
              {{ $t('dialog_delete_body') }}
            </p>
            <ul class="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>{{ $t('dialog_delete_item_profile') }}</li>
              <li>{{ $t('dialog_delete_item_quotes') }}</li>
              <li>{{ $t('dialog_delete_item_collections') }}</li>
              <li>{{ $t('dialog_delete_item_likes') }}</li>
              <li>{{ $t('dialog_delete_item_data') }}</li>
            </ul>
            <p class="text-red-600 dark:text-red-400 font-medium">
              {{ $t('dialog_delete_warning') }}
            </p>
          </div>
          <template #footer>
            <div class="flex justify-end space-x-3">
              <NButton btn="outline" @click="showDeleteModal = false">{{ $t('common.cancel') }}</NButton>
              <NButton color="red" :loading="deleting" @click="deleteAccount">{{ $t('dialog_delete_confirm') }}</NButton>
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
  layout: 'default',
  middleware: 'auth'
})

const { $t } = useI18n()

useHead({
  title: $t('meta_title') as string
})

const pageHeader = usePageHeader()

onMounted(() => {
  pageHeader.setHeaderFromRoute()
})

const { user } = useUserSession()

const tabs = computed(() => [
  { name: $t('tab_profile'), value: 'profile' },
  { name: $t('tab_ui'), value: 'ui' },
  { name: $t('tab_notifications'), value: 'notifications' },
  { name: $t('tab_data'), value: 'data' }
])

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

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const currentPasswordPlaceholder = useMountedTranslation('placeholder_current_password')
const newPasswordPlaceholder = useMountedTranslation('placeholder_new_password')
const confirmPasswordPlaceholder = useMountedTranslation('placeholder_confirm_password')
const savingPassword = ref(false)
const passwordError = ref('')
const passwordMessage = ref('')

const savePassword = async () => {
  passwordError.value = ''
  passwordMessage.value = ''

  if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword || !passwordForm.value.confirmPassword) {
    passwordError.value = $t('error_password_required') as string
    return
  }
  if (passwordForm.value.newPassword.length < 8) {
    passwordError.value = $t('error_password_length') as string
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = $t('error_password_mismatch') as string
    return
  }

  savingPassword.value = true
  try {
    await $fetch('/api/auth/change-password', {
      method: 'POST',
      body: {
        currentPassword: passwordForm.value.currentPassword,
        newPassword: passwordForm.value.newPassword
      }
    })
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    passwordMessage.value = $t('password_changed') as string
  } catch (error) {
    console.error('Failed to change password:', error)
    showErrorToast(error, $t('error_save_password') as string)
  } finally {
    savingPassword.value = false
  }
}

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
    showErrorToast(error, $t('error_save_profile') as string)
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
    showErrorToast(error, $t('error_save_notifications') as string)
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
    showErrorToast(error, $t('error_save_privacy') as string)
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
    showErrorToast(error, $t('error_delete_account') as string)
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

<style scoped>
.dashboard-tab-enter-active {
  transition: opacity 180ms cubic-bezier(0.16, 1, 0.3, 1), transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dashboard-tab-leave-active {
  transition: opacity 100ms ease-in, transform 100ms ease-in;
}

.dashboard-tab-enter-from {
  opacity: 0;
  transform: translateX(8px);
}

.dashboard-tab-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .dashboard-tab-enter-active,
  .dashboard-tab-leave-active {
    transition-duration: 100ms;
  }

  .dashboard-tab-enter-from,
  .dashboard-tab-leave-to {
    transform: none;
  }
}
</style>
