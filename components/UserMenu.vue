<template>
  <UDropdownMenu :items="menuItems" :_dropdown-menu-content="{ side: 'bottom', align: 'end' }" class="font-sans">
    <UButton
      btn="text"
      size="md"
      class="hover:scale-105 active:scale-95 transition-transform"
    >
      <UAvatar
        size="md"
      >
        <UAvatarImage v-if="user && user.avatar_url" :src="user.avatar_url" :alt="user.name" />
        <UAvatarFallback v-else>
          <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
            <mask id="«r1q»" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
              <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
            </mask>
            <g mask="url(#«r1q»)">
              <rect width="36" height="36" fill="#ff005b"></rect>
              <rect x="0" y="0" width="36" height="36" transform="translate(-5 9) rotate(189 18 18) scale(1)" fill="#ffb238" rx="36"></rect>
              <g transform="translate(-5 4.5) rotate(9 18 18)">
                <path d="M13,19 a1,0.75 0 0,0 10,0" fill="#000000"></path>
                <rect x="10" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#000000"></rect>
                <rect x="24" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#000000"></rect>
              </g>
            </g>
          </svg>
        </UAvatarFallback>
      </UAvatar>
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
    onclick: () => navigateTo('/dashboard/lists')
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
