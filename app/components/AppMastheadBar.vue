<template>
  <div
    :class="[
      'sticky top-0 z-4 w-full border-b b-dashed transition-all duration-300',
      scrollY === 0
        ? 'bg-[#FAFAF9] dark:bg-[#0C0A09]'
        : 'bg-[#FAFAF9]/80 dark:bg-[#0C0A09]/80 backdrop-blur-md'
    ]"
  >
    <div class="flex items-center justify-between px-4 lg:px-8 py-3 mx-auto">
      <div class="flex items-center gap-4">
        <NButton btn="~" @click="handleLogoClick" rounded="none" class="group w-43 px-0 flex justify-start cursor-pointer active:scale-95 transition-transform relative overflow-hidden">
          <span class="font-subtitle font-700 italic tracking-[0.1rem] text-xl relative z-1 transition-colors duration-300 group-hover:text-white dark:group-hover:text-[#0C0A09]">verbatims</span>
          <span class="absolute inset-0 bg-[#0C0A09] dark:bg-[#FAFAF9] w-0 group-hover:w-full transition-all duration-300 ease-out -z-0" />
        </NButton>
        <div class="h-5 w-px mx-4.2 hidden sm:block" />
        <span class="hidden sm:inline font-sans text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
          {{ currentDate }}
        </span>
      </div>

      <NNavigationMenu
        :items="navMenuItems"
        indicator
      >
        <template #item-content="{ items: menuItems }">
          <ul class="grid gap-1 p-3 min-w-64 max-w-80">
            <li v-for="child in menuItems" :key="child.label">
              <NNavigationMenuContentItem v-bind="child" />
            </li>
          </ul>
        </template>
      </NNavigationMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const scrollY = ref(0)

const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const navMenuItems = computed(() => [
  {
    label: 'Explore',
    trailing: '',
    items: [
      {
        label: 'Authors',
        leading: 'i-ph-users-duotone',
        description: 'Browse quotes by author',
        to: '/authors'
      },
      {
        label: 'References',
        leading: 'i-ph-book-duotone',
        description: 'Explore books, films, and more',
        to: '/references'
      },
      {
        label: 'Quotes',
        leading: 'i-ph-quotes',
        description: 'Explore quotes from various sources',
        to: '/quotes'
      },
      {
        label: 'Tags',
        leading: 'i-ph-tag-duotone',
        description: 'Browse quote topics and themes',
        to: '/tags'
      },
    ]
  },
  {
    label: 'Contribute',
    trailing: '',
    items: [
      {
        label: 'Add Quote',
        leading: 'i-ph-quotes-duotone',
        description: 'Contribute a new quote',
        onclick: () => { console.log('Add Quote') }
      },
      {
        label: 'Suggest Edit',
        leading: 'i-ph-pencil-duotone',
        description: 'Suggest an edit to an existing quote',
        onclick: () => { console.log('Suggest Edit') }
      },
      {
        label: 'Report Issue',
        leading: 'i-ph-bug-duotone',
        description: 'Report a problem or bug',
        onclick: () => { console.log('Report Issue') }
      },
    ]
  },
  {
    label: 'About',
    trailing: '',
    items: [
      {
        label: 'About Verbatims',
        description: 'Learn more about Verbatims',
        to: '/about'
      },
      {
        label: 'Contact',
        description: 'Get in touch with us',
        onclick: () => { console.log('Contact') }
      },
      {
        label: 'Privacy Policy',
        leading: 'i-ph-shield-check-duotone',
        description: 'Read our privacy policy',
        to: '/privacy'
      },
      {
        label: 'Terms',
        leading: 'i-ph-file-text-duotone',
        description: 'Read our terms of service',
        to: '/terms'
      },
      {
        label: 'Licenses',
        leading: 'i-ph-book-open-duotone',
        description: 'Read our licenses',
        to: '/licenses'
      },
      {
        label: 'Version',
        leading: 'i-ph-git-branch-duotone',
        description: '0.47.0',
        to: 'https://github.com/rootasjey/verbatims',
        target: '_blank'
      },
    ]
  }
])

const handleScroll = () => {
  scrollY.value = window.scrollY
}

const handleLogoClick = (event: MouseEvent) => {
  if (route.path !== '/') {
    navigateTo('/')
    return
  }

  event.preventDefault()

  if (scrollY.value === 0) return

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  scrollY.value = window.scrollY

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })
})
</script>
