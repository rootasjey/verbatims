import type { PageHeaderInfo } from '~/stores/pageHeader'
import { storeToRefs } from 'pinia'

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

  // Use storeToRefs to expose reactive refs directly
  const { pageTitle, pageSubtitle, pageSection, hasSubtitle, shouldShowHeader } = storeToRefs(store)

  return {
    // Getters
    title: pageTitle,
    subtitle: pageSubtitle,
    section: pageSection,
    hasSubtitle,
    shouldShow: shouldShowHeader,

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
