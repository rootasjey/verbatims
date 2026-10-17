import type { Ref } from 'vue'

const getPageFromQuery = (value: unknown) => {
  const queryValue = Array.isArray(value) ? value[0] : value
  const page = Number(queryValue)
  return Number.isSafeInteger(page) && page > 0 ? page : 1
}

export function useSyncedPageQuery(page: Ref<number>) {
  const route = useRoute()
  const router = useRouter()

  page.value = getPageFromQuery(route.query.page)

  watch(page, (value) => {
    const normalizedPage = Number.isSafeInteger(value) && value > 0 ? value : 1
    if (value !== normalizedPage) {
      page.value = normalizedPage
      return
    }

    const queryPage = normalizedPage > 1 ? String(normalizedPage) : undefined
    if (route.query.page === queryPage) return

    if (import.meta.client) {
      void router.replace({ query: { ...route.query, page: queryPage } })
    }
  }, { immediate: true })

  watch(() => route.query.page, (value) => {
    const nextPage = getPageFromQuery(value)
    if (page.value !== nextPage) {
      page.value = nextPage
      return
    }

    const queryPage = nextPage > 1 ? String(nextPage) : undefined
    if (value !== queryPage && import.meta.client) {
      void router.replace({ query: { ...route.query, page: queryPage } })
    }
  })
}
