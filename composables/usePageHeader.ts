import type { PageHeaderInfo } from '~/stores/pageHeader'

/**
 * Composable for managing page headers in admin and dashboard sections
 * Provides easy access to the page header store with automatic cleanup
 */
export const usePageHeader = () => {
  const store = usePageHeaderStore()
  const route = useRoute()

  // Auto-set header based on current route
  const setHeaderFromRoute = () => {
    store.setPageHeaderFromRoute(route.path)
  }

  const setHeader = (info: PageHeaderInfo) => {
    store.setPageHeader(info)
  }

  // Set just the title (keeping existing subtitle and section)
  const setTitle = (title: string) => {
    store.setTitle(title)
  }

  // Set just the subtitle (keeping existing title and section)
  const setSubtitle = (subtitle?: string) => {
    store.setSubtitle(subtitle)
  }

  const clearHeader = () => {
    store.clearHeader()
  }

  const hideHeader = () => {
    store.hideHeader()
  }

  const showHeader = () => {
    store.showHeader()
  }

  const title = computed(() => store.pageTitle)
  const subtitle = computed(() => store.pageSubtitle)
  const section = computed(() => store.pageSection)
  const hasSubtitle = computed(() => store.hasSubtitle)
  const shouldShow = computed(() => store.shouldShowHeader)

  return {
    // Getters
    title,
    subtitle,
    section,
    hasSubtitle,
    shouldShow,

    // Actions
    setHeader,
    setTitle,
    setSubtitle,
    setHeaderFromRoute,
    clearHeader,
    hideHeader,
    showHeader
  }
}
