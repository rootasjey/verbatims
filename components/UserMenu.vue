<template>
  <UDropdown :items="menuItems" :popper="{ placement: 'bottom-end' }">
    <UButton
      variant="ghost"
      size="sm"
      class="flex items-center space-x-2"
    >
      <UAvatar
        :src="user.avatar_url"
        :alt="user.name"
        size="sm"
      />
      <span class="hidden sm:block text-sm font-medium">{{ user.name }}</span>
      <UIcon name="i-ph-caret-down" class="w-4 h-4" />
    </UButton>
  </UDropdown>
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
  [{
    label: 'Dashboard',
    icon: 'i-ph-house',
    to: '/dashboard'
  }, {
    label: 'My Collections',
    icon: 'i-ph-bookmark',
    to: '/dashboard/collections'
  }, {
    label: 'My Submissions',
    icon: 'i-ph-file-text',
    to: '/dashboard/submissions'
  }, {
    label: 'Liked Quotes',
    icon: 'i-ph-heart',
    to: '/dashboard/liked'
  }],
  [{
    label: 'Settings',
    icon: 'i-ph-gear',
    to: '/dashboard/settings'
  }],
  // Show admin menu for admins and moderators
  ...(props.user.role === 'admin' || props.user.role === 'moderator' ? [[{
    label: 'Admin Panel',
    icon: 'i-ph-shield-check',
    to: '/admin'
  }]] : []),
  [{
    label: 'Sign Out',
    icon: 'i-ph-sign-out',
    click: async () => {
      await clear()
      await navigateTo('/')
    }
  }]
])
</script>
