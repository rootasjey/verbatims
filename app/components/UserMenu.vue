<template>
  <NDropdownMenu :items="menuItems" :modal="false" :_dropdown-menu-content="{ side: 'bottom', align: 'end' }" class="font-sans">
    <NButton
      btn="~"
      size="sm"
      icon
      class="hover:scale-105 active:scale-95 transition-transform min-w-0 min-h-0"
    >
      <NAvatar
        size="2"
        :src="user.avatar_url" 
        :alt="user.name"
      >
        <template #fallback>
          <BrandAvatarFallback />
        </template>
      </NAvatar>
    </NButton>
  </NDropdownMenu>
</template>

<script setup>
const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

const { $t } = useI18n()
const { clear } = useUserSession()

const menuItems = computed(() => [
  {
    label: $t('components.user_menu.home'),
    leading: 'i-ph-house',
    onclick: () => navigateTo('/')
  },
  {
    label: $t('components.user_menu.dashboard'),
    leading: 'i-ph-square-split-vertical-duotone',
    onclick: () => navigateTo('/dashboard')
  },
  {
    label: $t('components.user_menu.collections'),
    leading: 'i-ph-bookmark',
    onclick: () => navigateTo('/dashboard/lists')
  },
  {
    label: $t('components.user_menu.submissions'),
    leading: 'i-ph-file-text',
    onclick: () => navigateTo('/dashboard/my-quotes/pending')
  },
  {
    label: $t('components.user_menu.liked'),
    leading: 'i-ph-heart',
    onclick: () => navigateTo('/dashboard/favourites')
  },
  {
    label: $t('components.user_menu.settings'),
    leading: 'i-ph-gear',
    onclick: () => navigateTo('/dashboard/settings')
  },
  // Show admin menu for admins and moderators
  {},
  ...(props.user.role === 'admin' || props.user.role === 'moderator' ? [{
    label: $t('components.user_menu.admin'),
    leading: 'i-ph-shield-check',
    onclick: () => navigateTo('/admin'),
  }] : []),
  {
    label: $t('components.user_menu.sign_out'),
    leading: 'i-ph-sign-out',
    onclick: async () => {
      await clear()
      await navigateTo('/')
    }
  }
])
</script>
