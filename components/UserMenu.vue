<template>
  <UDropdownMenu :items="menuItems" :popper="{ placement: 'bottom-end' }" class="font-sans">
    <UButton
      btn="text"
      size="xs"
    >
      <UAvatar
        :src="user.avatar_url"
        :alt="user.name"
        size="xs"
      />
    </UButton>
  </UDropdownMenu>
</template>

<script setup>
const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

const { clear } = useUserSession()

const menuItems = computed(() => [
  {
    label: 'Home',
    leading: 'i-ph-house',
    onclick: () => navigateTo('/')
  },
  {
    label: 'Dashboard',
    leading: 'i-ph-square-split-vertical-duotone',
    onclick: () => navigateTo('/dashboard')
  },
  {
    label: 'My Collections',
    leading: 'i-ph-bookmark',
    onclick: () => navigateTo('/dashboard/collections')
  },
  {
    label: 'My Submissions',
    leading: 'i-ph-file-text',
    onclick: () => navigateTo('/dashboard/my-quotes/pending')
  },
  {
    label: 'Liked Quotes',
    leading: 'i-ph-heart',
    onclick: () => navigateTo('/dashboard/favourites')
  },
  {
    label: 'Settings',
    leading: 'i-ph-gear',
    onclick: () => navigateTo('/dashboard/settings')
  },
  // Show admin menu for admins and moderators
  {},
  ...(props.user.role === 'admin' || props.user.role === 'moderator' ? [{
    label: 'Admin Panel',
    leading: 'i-ph-shield-check',
    onclick: () => navigateTo('/admin'),
  }] : []),
  {
    label: 'Sign Out',
    leading: 'i-ph-sign-out',
    onclick: async () => {
      await clear()
      await navigateTo('/')
    }
  }
])
</script>
