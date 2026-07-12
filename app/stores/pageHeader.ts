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

    const { $t } = useI18n()

    const section = route.startsWith('/admin') ? 'admin' as const : 'dashboard' as const

    const routeKeyMap: Record<string, { titleKey: string; subtitleKey?: string }> = {
      // Admin routes
      '/admin': { titleKey: 'admin.headers.panel', subtitleKey: 'admin.headers.panel_desc' },
      '/admin/quotes/published': { titleKey: 'admin.headers.published', subtitleKey: 'admin.headers.published_desc' },
      '/admin/quotes/pending': { titleKey: 'admin.headers.pending', subtitleKey: 'admin.headers.pending_desc' },
      '/admin/quotes/drafts': { titleKey: 'admin.headers.drafts', subtitleKey: 'admin.headers.drafts_desc' },
      '/admin/authors': { titleKey: 'admin.headers.authors', subtitleKey: 'admin.headers.authors_desc' },
      '/admin/references': { titleKey: 'admin.headers.references', subtitleKey: 'admin.headers.references_desc' },
      '/admin/enrichment': { titleKey: 'admin.headers.enrichment', subtitleKey: 'admin.headers.enrichment_desc' },
      '/admin/harvest': { titleKey: 'admin.headers.harvest' },
      '/admin/tags': { titleKey: 'admin.headers.tags' },
      '/admin/sponsors': { titleKey: 'admin.headers.sponsors' },
      '/admin/themes': { titleKey: 'admin.headers.themes' },
      '/admin/social-queue': { titleKey: 'admin.headers.social_queue', subtitleKey: 'admin.headers.social_queue_desc' },
      '/admin/users': { titleKey: 'admin.headers.users', subtitleKey: 'admin.headers.users_desc' },
      '/admin/maintenance': { titleKey: 'admin.headers.maintenance', subtitleKey: 'admin.headers.maintenance_desc' },
      '/admin/import': { titleKey: 'admin.headers.import', subtitleKey: 'admin.headers.import_desc' },
      '/admin/export': { titleKey: 'admin.headers.export', subtitleKey: 'admin.headers.export_desc' },
      '/admin/api-keys': { titleKey: 'admin.headers.api_keys' },
      '/admin/messages': { titleKey: 'admin.headers.messages' },

      // Dashboard routes
      '/dashboard': { titleKey: 'dashboard.headers.overview', subtitleKey: 'dashboard.headers.overview_desc' },
      '/dashboard/favourites': { titleKey: 'dashboard.headers.favourites', subtitleKey: 'dashboard.headers.favourites_desc' },
      '/dashboard/lists': { titleKey: 'dashboard.headers.lists', subtitleKey: 'dashboard.headers.lists_desc' },
      '/dashboard/my-quotes/drafts': { titleKey: 'dashboard.headers.drafts', subtitleKey: 'dashboard.headers.drafts_desc' },
      '/dashboard/my-quotes/pending': { titleKey: 'dashboard.headers.pending', subtitleKey: 'dashboard.headers.pending_desc' },
      '/dashboard/my-quotes/published': { titleKey: 'dashboard.headers.published', subtitleKey: 'dashboard.headers.published_desc' },
      '/dashboard/settings': { titleKey: 'dashboard.headers.settings', subtitleKey: 'dashboard.headers.settings_desc' },
      '/dashboard/sponsors': { titleKey: 'dashboard.headers.sponsors' },
      '/dashboard/developer': { titleKey: 'dashboard.headers.developer' },
    }

    const keys = routeKeyMap[route]
    if (keys) {
      setPageHeader({
        title: $t(keys.titleKey) as string,
        subtitle: keys.subtitleKey ? ($t(keys.subtitleKey) as string) : undefined,
        section
      })
    } else {
      // For unknown routes, try to extract a reasonable title
      const segments = route.split('/').filter(Boolean)
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1] ?? ''
        const title = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ')
        setPageHeader({
          title,
          section
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
