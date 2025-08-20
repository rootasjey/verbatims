/**
 * Composable for detecting mobile devices and managing mobile-specific behavior
 */
export const useMobileDetection = () => {
  const isMobile = ref(false)
  const isTablet = ref(false)
  const isDesktop = ref(false)

  const MOBILE_BREAKPOINT = 768 // md
  const TABLET_BREAKPOINT = 1024 // lg

  const updateDeviceType = () => {
    if (import.meta.client) {
      const width = window.innerWidth
      
      isMobile.value = width < MOBILE_BREAKPOINT
      isTablet.value = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT
      isDesktop.value = width >= TABLET_BREAKPOINT
    }
  }

  onMounted(() => {
    updateDeviceType()
    window.addEventListener('resize', updateDeviceType)
  })

  onUnmounted(() => {
    if (import.meta.client) {
      window.removeEventListener('resize', updateDeviceType)
    }
  })

  // Computed properties for convenience
  const isMobileOrTablet = computed(() => isMobile.value || isTablet.value)
  const preferMobileLayout = computed(() => isMobile.value)

  return {
    isMobile: readonly(isMobile),
    isTablet: readonly(isTablet),
    isDesktop: readonly(isDesktop),
    isMobileOrTablet: readonly(isMobileOrTablet),
    preferMobileLayout: readonly(preferMobileLayout),
    MOBILE_BREAKPOINT,
    TABLET_BREAKPOINT
  }
}

/**
 * Composable for managing layout switching between mobile and desktop
 */
export const useLayoutSwitching = () => {
  const { preferMobileLayout } = useMobileDetection()
  const route = useRoute()

  // Determine which layout to use based on device and route
  const getLayoutForRoute = () => {
    // Special routes that should always use their specific layouts
    if (route.path.startsWith('/dashboard')) {
      return preferMobileLayout.value ? 'mobile' : 'dashboard'
    }
    
    if (route.path.startsWith('/admin')) {
      return preferMobileLayout.value ? 'mobile' : 'admin'
    }

    // Default routes use mobile layout on mobile, default layout on desktop
    return preferMobileLayout.value ? 'mobile' : 'default'
  }

  const currentLayout = computed(() => getLayoutForRoute())

  return {
    currentLayout: currentLayout,
    preferMobileLayout: preferMobileLayout,
  }
}
