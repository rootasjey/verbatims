export interface PageHeaderInfo {
  title: string
  subtitle?: string
  section?: 'admin' | 'dashboard' | 'public'
}

export const usePageHeaderStore = defineStore('pageHeader', () => {
  // State
  const currentPage = ref<PageHeaderInfo>({
    title: '',
    subtitle: undefined,
    section: 'public'
  })

  const isVisible = ref(false)

  // Getters
  const pageTitle = computed(() => currentPage.value.title)
  const pageSubtitle = computed(() => currentPage.value.subtitle)
  const pageSection = computed(() => currentPage.value.section)
  const hasSubtitle = computed(() => Boolean(currentPage.value.subtitle))
  const shouldShowHeader = computed(() => isVisible.value && Boolean(currentPage.value.title))

  // Actions
  function setPageHeader(info: PageHeaderInfo) {
    currentPage.value = { ...info }
    isVisible.value = true
  }

  function setTitle(title: string) {
    currentPage.value.title = title
    if (!isVisible.value && title) {
      isVisible.value = true
    }
  }

  function setSubtitle(subtitle?: string) {
    currentPage.value.subtitle = subtitle
  }

  function setSection(section: 'admin' | 'dashboard' | 'public') {
    currentPage.value.section = section
  }

  function clearHeader() {
    currentPage.value = {
      title: '',
      subtitle: undefined,
      section: 'public'
    }
    isVisible.value = false
  }

  function hideHeader() {
    isVisible.value = false
  }

  function showHeader() {
    if (currentPage.value.title) {
      isVisible.value = true
    }
  }

  // Utility function to set page header based on route
  function setPageHeaderFromRoute(route: string) {
    // Only show headers for admin and dashboard routes
    if (!route.startsWith('/admin') && !route.startsWith('/dashboard')) {
      clearHeader()
      return
    }

    const routeMap: Record<string, PageHeaderInfo> = {
      // Admin routes
      '/admin': {
        title: 'Admin Panel',
        subtitle: 'System administration and content management',
        section: 'admin'
      },
      '/admin/quotes/published': {
        title: 'Published Quotes',
        subtitle: 'Manage all approved and published quotes in the system',
        section: 'admin'
      },
      '/admin/quotes/pending': {
        title: 'Pending Quotes',
        subtitle: 'Review and moderate quotes awaiting approval',
        section: 'admin'
      },
      '/admin/quotes/drafts': {
        title: 'Draft Quotes',
        subtitle: 'Manage user draft quotes and submissions',
        section: 'admin'
      },
      '/admin/authors': {
        title: 'Authors',
        subtitle: 'Manage all authors in the system',
        section: 'admin'
      },
      '/admin/references': {
        title: 'References',
        subtitle: 'Manage all references and sources in the system',
        section: 'admin'
      },
      '/admin/users': {
        title: 'Users',
        subtitle: 'Manage user accounts and permissions',
        section: 'admin'
      },
      '/admin/maintenance': {
        title: 'Database Maintenance',
        subtitle: 'System maintenance and database operations',
        section: 'admin'
      },
      '/admin/import': {
        title: 'Import Data',
        subtitle: 'Import quotes, authors, and references from external sources',
        section: 'admin'
      },
      '/admin/export': {
        title: 'Export Data',
        subtitle: 'Export system data in various formats',
        section: 'admin'
      },

      // Dashboard routes
      '/dashboard': {
        title: 'Dashboard',
        subtitle: 'Your personal quote management hub',
        section: 'dashboard'
      },
      '/dashboard/favourites': {
        title: 'Favourites',
        subtitle: 'Your liked quotes and saved favourites',
        section: 'dashboard'
      },
      '/dashboard/lists': {
        title: 'Lists',
        subtitle: 'Your personal quote collections and lists',
        section: 'dashboard'
      },
      '/dashboard/my-quotes/drafts': {
        title: 'Draft Quotes',
        subtitle: 'Your unpublished quote drafts',
        section: 'dashboard'
      },
      '/dashboard/my-quotes/pending': {
        title: 'Pending Quotes',
        subtitle: 'Your quotes awaiting moderation',
        section: 'dashboard'
      },
      '/dashboard/my-quotes/published': {
        title: 'Published Quotes',
        subtitle: 'Your approved and published quotes',
        section: 'dashboard'
      },
      '/dashboard/settings': {
        title: 'Settings',
        subtitle: 'Manage your account preferences and settings',
        section: 'dashboard'
      }
    }

    const pageInfo = routeMap[route]
    if (pageInfo) {
      setPageHeader(pageInfo)
    } else {
      // For unknown routes, try to extract a reasonable title
      const segments = route.split('/').filter(Boolean)
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1]
        const title = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ')
        const section = segments[0] as 'admin' | 'dashboard' | 'public'
        setPageHeader({
          title,
          section: ['admin', 'dashboard'].includes(section) ? section : 'public'
        })
      } else {
        clearHeader()
      }
    }
  }

  return {
    // State
    currentPage: readonly(currentPage),
    isVisible: readonly(isVisible),

    // Getters
    pageTitle,
    pageSubtitle,
    pageSection,
    hasSubtitle,
    shouldShowHeader,

    // Actions
    setPageHeader,
    setTitle,
    setSubtitle,
    setSection,
    clearHeader,
    hideHeader,
    showHeader,
    setPageHeaderFromRoute
  }
})
