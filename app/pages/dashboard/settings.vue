<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center gap-6 overflow-x-auto border-b border-black/10 dark:border-white/10">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="selectTab(tab.value)"
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
    <div v-if="activeTab === 'profile'" key="profile" class="max-w-xl space-y-6">
      <button
        type="button"
        aria-haspopup="dialog"
        class="group flex w-full flex-wrap items-center justify-between gap-4 rounded-xl p-2 text-left transition-colors hover:bg-gray-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/30 focus-visible:ring-offset-2 dark:hover:bg-white/[0.03] dark:focus-visible:ring-white/30 dark:focus-visible:ring-offset-[#0C0A09] motion-reduce:transition-none"
        @click="avatarPickerOpen = true"
      >
        <span class="flex min-w-0 items-center gap-4">
          <img
            v-if="user?.avatar_url"
            :src="user.avatar_url"
            alt=""
            width="64"
            height="64"
            class="h-16 w-16 shrink-0 rounded-xl border border-gray-200 bg-white object-cover dark:border-white/10 dark:bg-white/5"
          />
          <span v-else class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5">
            <BrandAvatarFallback />
          </span>
          <span class="min-w-0">
            <span class="block font-serif text-lg font-500 text-gray-900 dark:text-gray-100">{{ $t('section_avatar') }}</span>
            <span class="mt-1 block max-w-sm font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">{{ $t('helper_avatar') }}</span>
          </span>
        </span>
        <NIcon name="i-ph-pencil-simple-line" aria-hidden="true" class="h-5 w-5 shrink-0 text-gray-400 transition-colors group-hover:text-gray-700 dark:text-gray-500 dark:group-hover:text-gray-200" />
      </button>
      <DashboardAvatarPickerDialog
        v-model="avatarPickerOpen"
        :current-avatar-url="user?.avatar_url"
        :saving="savingAvatar"
        @save="saveAvatar"
      />
      <div>
        <label for="display-name" class="sr-only">{{ $t('label_display_name') }}</label>
        <div class="flex min-h-11 w-full items-center gap-2 rounded-md border border-[#d2cfc6] bg-[#f0efe9] px-3 transition-colors focus-within:border-gray-500 focus-within:ring-2 focus-within:ring-gray-900/10 dark:border-white/15 dark:bg-white/[0.06] dark:focus-within:border-gray-400 dark:focus-within:ring-white/10">
          <span v-if="profileForm.name.length <= 24" class="hidden shrink-0 rounded bg-[#e4e2db] px-2 py-1 font-sans text-xs font-600 text-gray-700 sm:inline-flex dark:bg-white/[0.1] dark:text-gray-300">
            {{ $t('label_display_name') }}
          </span>
          <NTooltip :content="$t('label_display_name') as string" :_tooltip-content="{ side: 'top', sideOffset: 8 }">
            <span
              :class="profileForm.name.length > 24 ? 'inline-flex' : 'inline-flex sm:hidden'"
              class="h-7 w-7 shrink-0 cursor-help items-center justify-center rounded bg-[#e4e2db] text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/25 dark:bg-white/[0.1] dark:text-gray-300 dark:focus-visible:ring-white/30"
              tabindex="0"
              :aria-label="$t('label_display_name') as string"
            >
              <NIcon name="i-ph-user" class="h-4 w-4" />
            </span>
          </NTooltip>
          <input
            id="display-name"
            v-model="profileForm.name"
            type="text"
            :placeholder="$t('placeholder_display_name') as string"
            class="min-w-0 flex-1 bg-transparent py-2.5 font-sans text-sm text-gray-900 placeholder-gray-600 outline-none dark:text-gray-100 dark:placeholder-gray-400"
          />
        </div>
      </div>
      <div>
        <label for="account-email" class="sr-only">{{ $t('label_email') }}</label>
        <div class="flex min-h-11 w-full items-center gap-2 rounded-md border border-[#d2cfc6] bg-[#f0efe9] px-3 transition-colors focus-within:border-gray-500 focus-within:ring-2 focus-within:ring-gray-900/10 dark:border-white/15 dark:bg-white/[0.06] dark:focus-within:border-gray-400 dark:focus-within:ring-white/10">
          <span class="hidden shrink-0 rounded bg-[#e4e2db] px-2 py-1 font-sans text-xs font-600 text-gray-700 sm:inline-flex dark:bg-white/[0.1] dark:text-gray-300">{{ $t('label_email') }}</span>
          <NTooltip :content="$t('label_email') as string" :_tooltip-content="{ side: 'top', sideOffset: 8 }">
            <span class="inline-flex h-7 w-7 shrink-0 cursor-help items-center justify-center rounded bg-[#e4e2db] text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/25 sm:hidden dark:bg-white/[0.1] dark:text-gray-300 dark:focus-visible:ring-white/30" tabindex="0" :aria-label="$t('label_email') as string">
              <NIcon name="i-ph-envelope-simple" class="h-4 w-4" />
            </span>
          </NTooltip>
          <input id="account-email" v-model="emailForm" type="email" autocomplete="email" required :placeholder="$t('placeholder_email') as string" class="min-w-0 flex-1 bg-transparent py-2.5 font-sans text-sm text-gray-900 placeholder-gray-600 outline-none dark:text-gray-100 dark:placeholder-gray-400" />
        </div>
        <p class="mt-2 font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {{ $t('helper_email_current') }} <span class="break-all font-500 text-gray-800 dark:text-gray-200">{{ currentEmail }}</span>. {{ $t('helper_email_verification') }}
        </p>
        <p v-if="pendingEmail" class="mt-2 font-sans text-sm leading-relaxed text-amber-800 dark:text-amber-300" role="status">
          {{ $t('email_change_pending') }} <span class="break-all font-600">{{ pendingEmail }}</span>.
        </p>
        <p v-if="emailChangeMessage" class="mt-2 font-sans text-sm leading-relaxed text-gray-700 dark:text-gray-300" role="status">{{ emailChangeMessage }}</p>
        <p v-if="emailChangeError" class="mt-2 font-sans text-sm leading-relaxed text-red-700 dark:text-red-300" role="alert">{{ emailChangeError }}</p>
        <NButton :disabled="sendingEmailChange || !emailForm.trim() || emailForm.trim().toLowerCase() === currentEmail.toLowerCase()" btn="outline-gray" class="mt-3 min-h-10 justify-center px-4 font-sans text-sm font-600" @click="requestEmailChange">
          {{ sendingEmailChange ? $t('sending') : emailForm.trim().toLowerCase() === pendingEmail?.toLowerCase() ? $t('resend_email_confirmation') : $t('change_email_button') }}
        </NButton>
      </div>
      <div>
        <label for="profile-bio" class="sr-only">{{ $t('label_bio') }}</label>
        <div class="w-full rounded-md border border-[#d2cfc6] bg-[#f0efe9] px-3 pt-2.5 transition-colors focus-within:border-gray-500 focus-within:ring-2 focus-within:ring-gray-900/10 dark:border-white/15 dark:bg-white/[0.06] dark:focus-within:border-gray-400 dark:focus-within:ring-white/10">
          <span aria-hidden="true" class="inline-flex rounded bg-[#e4e2db] px-2 py-1 font-sans text-xs font-600 text-gray-700 dark:bg-white/[0.1] dark:text-gray-300">
            {{ $t('label_bio') }}
          </span>
          <textarea
            id="profile-bio"
            v-model="profileForm.bio"
            :placeholder="$t('placeholder_bio') as string"
            rows="4"
            class="w-full resize-y bg-transparent py-2 font-sans text-sm leading-relaxed text-gray-900 placeholder-gray-600 outline-none dark:text-gray-100 dark:placeholder-gray-400"
          />
        </div>
      </div>
      <div class="pt-2">
        <div class="flex flex-wrap items-center gap-3">
          <NButton
            :disabled="savingProfile || !hasProfileChanges"
            btn="solid-black"
            class="min-h-10 justify-center bg-gray-900 px-4 font-sans text-sm font-600 text-gray-50 transition-[transform,background-color] hover:bg-gray-700 active:scale-99 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
            @click="saveProfile"
          >
            {{ savingProfile ? $t('saving') : $t('save_profile') }}
          </NButton>
          <NButton
            v-if="hasProfileChanges"
            :disabled="savingProfile"
            btn="outline-gray"
            class="min-h-10 justify-center px-4 font-sans text-sm font-600"
            @click="discardProfileChanges"
          >
            {{ $t('discard_changes') }}
          </NButton>
        </div>
      </div>
    </div>
    <div v-else-if="activeTab === 'privacy'" key="privacy" class="max-w-xl space-y-1">
      <div class="flex items-center justify-between gap-4 border-b border-gray-500/20 py-4 dark:border-white/10">
        <div>
          <h3 class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100">{{ $t('label_public_profile') }}</h3>
          <p class="mt-1 font-sans text-sm leading-relaxed text-gray-700 dark:text-gray-400">{{ $t('desc_public_profile') }}</p>
        </div>
        <NTooltip :content="$t('coming_soon') as string">
          <span class="inline-flex cursor-not-allowed" tabindex="0">
            <NSwitch v-model="privacySettings.public_profile" switch-checked="gray" disabled />
          </span>
        </NTooltip>
      </div>
      <div class="flex items-center justify-between gap-4 border-b border-gray-500/20 py-4 dark:border-white/10">
        <div>
          <h3 class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100">{{ $t('label_show_attribution') }}</h3>
          <p class="mt-1 font-sans text-sm leading-relaxed text-gray-700 dark:text-gray-400">{{ $t('desc_show_attribution') }}</p>
        </div>
        <NTooltip :content="$t('coming_soon') as string">
          <span class="inline-flex cursor-not-allowed" tabindex="0">
            <NSwitch v-model="privacySettings.show_attribution" switch-checked="gray" disabled />
          </span>
        </NTooltip>
      </div>
    </div>
    <div v-else-if="activeTab === 'security'" key="security" class="max-w-xl space-y-6">
      <NButton
        v-if="!showPasswordForm"
        btn="outline-gray"
        class="min-h-10 justify-center bg-[#f0efe9] px-4 font-sans text-sm font-600 text-gray-700 transition-[background-color,color,box-shadow] duration-200 hover:bg-[#fbfaf7] hover:text-gray-950 hover:shadow-[0_4px_14px_rgba(28,25,23,0.16)] active:!shadow-none dark:bg-white/[0.06] dark:text-gray-200 dark:hover:bg-white/[0.12] dark:hover:text-white dark:hover:shadow-[0_4px_14px_rgba(0,0,0,0.45)] dark:active:!shadow-none"
        :aria-expanded="showPasswordForm"
        aria-controls="password-change-form"
        @click="openPasswordForm"
      >
        {{ $t('change_password_prompt') }}
      </NButton>
      <Transition name="password-form">
        <div v-if="showPasswordForm" id="password-change-form" class="space-y-6">
          <div>
            <label for="current-password" class="sr-only">{{ $t('label_current_password') }}</label>
            <div class="flex min-h-11 w-full items-center gap-2 rounded-md border border-[#d2cfc6] bg-[#f0efe9] px-3 transition-colors focus-within:border-gray-500 focus-within:ring-2 focus-within:ring-gray-900/10 dark:border-white/15 dark:bg-white/[0.06] dark:focus-within:border-gray-400 dark:focus-within:ring-white/10">
              <span aria-hidden="true" class="hidden shrink-0 rounded bg-[#e4e2db] px-2 py-1 font-sans text-xs font-600 text-gray-700 sm:inline-flex dark:bg-white/[0.1] dark:text-gray-300">{{ $t('label_current_password') }}</span>
              <NTooltip :content="$t('label_current_password') as string" :_tooltip-content="{ side: 'top', sideOffset: 8 }">
                <span class="inline-flex h-7 w-7 shrink-0 cursor-help items-center justify-center rounded bg-[#e4e2db] text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/25 sm:hidden dark:bg-white/[0.1] dark:text-gray-300 dark:focus-visible:ring-white/30" tabindex="0" :aria-label="$t('label_current_password') as string">
                  <NIcon name="i-ph-lock-key" class="h-4 w-4" />
                </span>
              </NTooltip>
              <input ref="currentPasswordInput" id="current-password" v-model="passwordForm.currentPassword" type="password" autocomplete="current-password" :placeholder="currentPasswordPlaceholder" class="min-w-0 flex-1 bg-transparent py-2.5 font-sans text-sm text-gray-900 placeholder-gray-600 outline-none dark:text-gray-100 dark:placeholder-gray-400" />
            </div>
          </div>
          <div>
            <label for="new-password" class="sr-only">{{ $t('label_new_password') }}</label>
            <div class="flex min-h-11 w-full items-center gap-2 rounded-md border border-[#d2cfc6] bg-[#f0efe9] px-3 transition-colors focus-within:border-gray-500 focus-within:ring-2 focus-within:ring-gray-900/10 dark:border-white/15 dark:bg-white/[0.06] dark:focus-within:border-gray-400 dark:focus-within:ring-white/10">
              <span aria-hidden="true" class="hidden shrink-0 rounded bg-[#e4e2db] px-2 py-1 font-sans text-xs font-600 text-gray-700 sm:inline-flex dark:bg-white/[0.1] dark:text-gray-300">{{ $t('label_new_password') }}</span>
              <NTooltip :content="$t('label_new_password') as string" :_tooltip-content="{ side: 'top', sideOffset: 8 }">
                <span class="inline-flex h-7 w-7 shrink-0 cursor-help items-center justify-center rounded bg-[#e4e2db] text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/25 sm:hidden dark:bg-white/[0.1] dark:text-gray-300 dark:focus-visible:ring-white/30" tabindex="0" :aria-label="$t('label_new_password') as string">
                  <NIcon name="i-ph-lock" class="h-4 w-4" />
                </span>
              </NTooltip>
              <input id="new-password" v-model="passwordForm.newPassword" type="password" autocomplete="new-password" :placeholder="newPasswordPlaceholder" class="min-w-0 flex-1 bg-transparent py-2.5 font-sans text-sm text-gray-900 placeholder-gray-600 outline-none dark:text-gray-100 dark:placeholder-gray-400" />
            </div>
          </div>
          <div>
            <label for="confirm-password" class="sr-only">{{ $t('label_confirm_password') }}</label>
            <div class="flex min-h-11 w-full items-center gap-2 rounded-md border border-[#d2cfc6] bg-[#f0efe9] px-3 transition-colors focus-within:border-gray-500 focus-within:ring-2 focus-within:ring-gray-900/10 dark:border-white/15 dark:bg-white/[0.06] dark:focus-within:border-gray-400 dark:focus-within:ring-white/10">
              <span aria-hidden="true" class="hidden shrink-0 rounded bg-[#e4e2db] px-2 py-1 font-sans text-xs font-600 text-gray-700 sm:inline-flex dark:bg-white/[0.1] dark:text-gray-300">{{ $t('label_confirm_password') }}</span>
              <NTooltip :content="$t('label_confirm_password') as string" :_tooltip-content="{ side: 'top', sideOffset: 8 }">
                <span class="inline-flex h-7 w-7 shrink-0 cursor-help items-center justify-center rounded bg-[#e4e2db] text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/25 sm:hidden dark:bg-white/[0.1] dark:text-gray-300 dark:focus-visible:ring-white/30" tabindex="0" :aria-label="$t('label_confirm_password') as string">
                  <NIcon name="i-ph-lock-key-open" class="h-4 w-4" />
                </span>
              </NTooltip>
              <input id="confirm-password" v-model="passwordForm.confirmPassword" type="password" autocomplete="new-password" :placeholder="confirmPasswordPlaceholder" class="min-w-0 flex-1 bg-transparent py-2.5 font-sans text-sm text-gray-900 placeholder-gray-600 outline-none dark:text-gray-100 dark:placeholder-gray-400" />
            </div>
          </div>
          <p v-if="passwordError" class="font-sans text-xs text-red-700 dark:text-red-400" role="alert">{{ passwordError }}</p>
          <p v-else-if="passwordMessage" class="font-sans text-xs text-gray-700 dark:text-gray-300" role="status">{{ passwordMessage }}</p>
          <div class="flex flex-wrap items-center gap-3 pt-2">
            <NButton :disabled="savingPassword" btn="solid-black" class="min-h-10 justify-center bg-gray-900 px-4 font-sans text-sm font-600 text-gray-50 transition-[transform,background-color] hover:bg-gray-700 active:scale-99 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300" @click="savePassword">
              {{ savingPassword ? $t('saving') : $t('change_password_now') }}
            </NButton>
            <NButton btn="text-gray-600" class="min-h-10 px-3 font-sans text-sm" :disabled="savingPassword" @click="closePasswordForm">
              {{ $t('common.cancel') }}
            </NButton>
          </div>
        </div>
      </Transition>
    </div>
    <div v-else-if="activeTab === 'preferences'" key="preferences" class="max-w-2xl space-y-5">
      <section class="border-b border-gray-200 pb-5 dark:border-white/10">
        <h2 class="mb-4 font-serif text-xl font-500 leading-snug text-gray-900 dark:text-gray-100">
          {{ $t('label_preferred_language') }}
        </h2>
        <div class="max-w-xl">
          <LanguageSelector appearance="toolbar" :aria-label="$t('label_preferred_language') as string" />
          <p class="mt-2 font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">{{ $t('helper_language') }}</p>
        </div>
      </section>
      <section>
        <h2 class="mb-4 font-serif text-xl font-500 leading-snug text-gray-900 dark:text-gray-100">
          {{ $t('section_ui') }}
        </h2>
        <div class="max-w-xl">
          <label class="mb-2 block font-sans text-sm font-500 text-gray-800 dark:text-gray-200">{{ $t('label_theme') }}</label>
          <p class="mb-4 font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">{{ $t('helper_theme') }}</p>
          <ThemeSelector appearance="settings" />
        </div>
      </section>
    </div>

    <!-- Notifications Tab -->
    <div v-else-if="activeTab === 'notifications'" key="notifications" class="max-w-2xl space-y-1">
      <div class="flex items-center justify-between gap-4 border-b border-gray-200 py-4 dark:border-white/10">
        <div>
          <h3 class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100">{{ $t('label_quote_approval') }}</h3>
          <p class="mt-1 font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">{{ $t('desc_quote_approval') }}</p>
        </div>
        <NTooltip :content="$t('coming_soon') as string">
          <span class="inline-flex cursor-not-allowed" tabindex="0">
            <NSwitch v-model="notificationSettings.quote_approval" switch-checked="gray" disabled />
          </span>
        </NTooltip>
      </div>
      <div class="flex items-center justify-between gap-4 border-b border-gray-200 py-4 dark:border-white/10">
        <div>
          <h3 class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100">{{ $t('label_collection_updates') }}</h3>
          <p class="mt-1 font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">{{ $t('desc_collection_updates') }}</p>
        </div>
        <NTooltip :content="$t('coming_soon') as string">
          <span class="inline-flex cursor-not-allowed" tabindex="0">
            <NSwitch v-model="notificationSettings.collection_updates" switch-checked="gray" disabled />
          </span>
        </NTooltip>
      </div>
      <div class="flex items-center justify-between gap-4 border-b border-gray-200 py-4 dark:border-white/10">
        <div>
          <h3 class="font-sans text-sm font-500 text-gray-900 dark:text-gray-100">{{ $t('label_weekly_digest') }}</h3>
          <p class="mt-1 font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">{{ $t('desc_weekly_digest') }}</p>
        </div>
        <NTooltip :content="$t('coming_soon') as string">
          <span class="inline-flex cursor-not-allowed" tabindex="0">
            <NSwitch v-model="notificationSettings.weekly_digest" switch-checked="gray" disabled />
          </span>
        </NTooltip>
      </div>
    </div>

    <!-- Data Tab -->
    <div v-else-if="activeTab === 'data'" key="data">
      <div class="max-w-2xl">
        <h2 class="mb-5 font-serif text-xl font-500 leading-snug text-gray-900 dark:text-gray-100">
          {{ $t('section_danger_zone') }}
        </h2>
        <div>
          <p class="mb-4 max-w-lg font-sans text-sm leading-relaxed text-gray-700 dark:text-gray-400">
            {{ $t('desc_delete_account') }}
          </p>
          <NButton btn="solid-black" class="!min-h-10 justify-center !bg-[#171614] px-4 font-sans text-sm font-600 !text-[#F7F5EF] transition-[transform,background-color] hover:!bg-[#302E2B] active:scale-99 dark:!bg-[#F3F1EC] dark:!text-[#171614] dark:hover:!bg-white" @click="showDeleteModal = true">
            {{ $t('button_delete_account') }}
          </NButton>
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
interface ProfileForm {
  name: string
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

const { user, fetch: refreshUserSession } = useUserSession()

const settingsTabValues = ['profile', 'preferences', 'privacy', 'notifications', 'security', 'data'] as const
type SettingsTab = typeof settingsTabValues[number]

const isSettingsTab = (value: unknown): value is SettingsTab =>
  typeof value === 'string' && settingsTabValues.includes(value as SettingsTab)

const route = useRoute()
const router = useRouter()

const tabs = computed<Array<{ name: string, value: SettingsTab }>>(() => [
  { name: String($t('tab_profile')), value: 'profile' },
  { name: String($t('tab_preferences')), value: 'preferences' },
  { name: String($t('section_privacy')), value: 'privacy' },
  { name: String($t('tab_notifications')), value: 'notifications' },
  { name: String($t('section_security')), value: 'security' },
  { name: String($t('tab_data')), value: 'data' }
])

const activeTab = computed<SettingsTab>(() =>
  isSettingsTab(route.query.tab) ? route.query.tab : 'profile'
)

const selectTab = (tab: SettingsTab) => {
  const query = { ...route.query, tab: tab === 'profile' ? undefined : tab }
  if (route.query.tab === query.tab) return
  void router.push({ query })
}

const profileForm = ref<ProfileForm>({
  name: user.value?.name || '',
  bio: (user.value as any)?.bio || ''
})
const savedProfile = ref<ProfileForm>({ ...profileForm.value })
const hasProfileChanges = computed(() =>
  profileForm.value.name !== savedProfile.value.name || profileForm.value.bio !== savedProfile.value.bio
)

const discardProfileChanges = () => {
  profileForm.value = { ...savedProfile.value }
}

const currentEmail = computed(() => user.value?.email || '')
const emailForm = ref(user.value?.email || '')
const pendingEmail = ref<string | null>(null)
const sendingEmailChange = ref(false)
const emailChangeMessage = ref('')
const emailChangeError = ref('')

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
const avatarPickerOpen = ref(false)
const savingAvatar = ref(false)
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
const showPasswordForm = ref(false)
const currentPasswordInput = ref<HTMLInputElement | null>(null)

const loadPendingEmailChange = async () => {
  try {
    const result = await $fetch<{ pendingEmail: string | null }>('/api/user/email-change')
    pendingEmail.value = result.pendingEmail
    if (result.pendingEmail) emailForm.value = result.pendingEmail
  } catch (error) {
    console.error('Failed to load pending email change:', error)
  }
}

const requestEmailChange = async () => {
  const nextEmail = emailForm.value.trim().toLowerCase()
  emailChangeError.value = ''
  emailChangeMessage.value = ''
  if (!nextEmail || nextEmail === currentEmail.value.toLowerCase()) return

  sendingEmailChange.value = true
  try {
    const result = await $fetch<{ pendingEmail: string }>('/api/user/email-change', {
      method: 'POST',
      body: { email: nextEmail },
    })
    pendingEmail.value = result.pendingEmail
    emailForm.value = result.pendingEmail
    emailChangeMessage.value = $t('email_change_sent') as string
  } catch (error: any) {
    const statusCode = error?.statusCode || error?.status
    emailChangeError.value = statusCode === 409
      ? $t('error_email_in_use') as string
      : statusCode === 400
        ? $t('error_email_same') as string
        : $t('error_email_change') as string
  } finally {
    sendingEmailChange.value = false
  }
}

const openPasswordForm = async () => {
  showPasswordForm.value = true
  await nextTick()
  currentPasswordInput.value?.focus()
}

const closePasswordForm = () => {
  showPasswordForm.value = false
  passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  passwordError.value = ''
  passwordMessage.value = ''
}

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

const saveProfile = async () => {
  const formAtSubmit = { ...profileForm.value }
  const submittedProfile = {
    name: formAtSubmit.name.trim(),
    bio: formAtSubmit.bio.trim()
  }

  savingProfile.value = true
  try {
    await $fetch('/api/user/profile', {
      method: 'PUT',
      body: submittedProfile
    })
    savedProfile.value = submittedProfile
    if (profileForm.value.name === formAtSubmit.name && profileForm.value.bio === formAtSubmit.bio) {
      profileForm.value = { ...submittedProfile }
    }
  } catch (error) {
    console.error('Failed to save profile:', error)
    showErrorToast(error, $t('error_save_profile') as string)
  } finally {
    savingProfile.value = false
  }
}

const saveAvatar = async (avatarUrl: string) => {
  savingAvatar.value = true
  try {
    await $fetch('/api/user/profile', {
      method: 'PUT',
      body: { avatar_url: avatarUrl }
    })
    await refreshUserSession()
    avatarPickerOpen.value = false
  } catch (error) {
    console.error('Failed to save avatar:', error)
    showErrorToast(error, $t('error_save_avatar') as string)
  } finally {
    savingAvatar.value = false
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
  void loadPendingEmailChange()
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

.password-form-enter-active,
.password-form-leave-active {
  transition: opacity 180ms cubic-bezier(0.16, 1, 0.3, 1), transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.password-form-enter-from,
.password-form-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (prefers-reduced-motion: reduce) {
  .dashboard-tab-enter-active,
  .dashboard-tab-leave-active,
  .password-form-enter-active,
  .password-form-leave-active {
    transition-duration: 100ms;
  }

  .dashboard-tab-enter-from,
  .dashboard-tab-leave-to {
    transform: none;
  }

  .password-form-enter-from,
  .password-form-leave-to {
    transform: none;
  }
}
</style>
