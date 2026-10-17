import { nextTick } from 'vue'
import { watchDebounced } from '@vueuse/core'
import type { LocationQuery, LocationQueryRaw } from 'vue-router'

export type SyncedQueryFilterState = Record<string, string>

interface SyncedQueryFiltersOptions<TState extends SyncedQueryFilterState> {
  keys: readonly (keyof TState & string)[]
  read: (query: LocationQuery) => TState
  write: (query: LocationQuery, state: TState) => LocationQueryRaw
  get: () => TState
  apply: (state: TState) => void
  onFilterChange?: () => void
  pageKey?: string
  debounce?: number
}

const queryValue = (value: unknown) => {
  const firstValue = Array.isArray(value) ? value[0] : value
  return typeof firstValue === 'string' ? firstValue : ''
}

export function useSyncedQueryFilters<TState extends SyncedQueryFilterState>(options: SyncedQueryFiltersOptions<TState>) {
  const route = useRoute()
  const router = useRouter()

  const readFromRoute = () => options.read(route.query)
  const isSameState = (left: TState, right: TState) => JSON.stringify(left) === JSON.stringify(right)
  const hasQueryChanges = (nextQuery: LocationQueryRaw) =>
    options.keys.some(key => JSON.stringify(route.query[key]) !== JSON.stringify(nextQuery[key]))

  const initialState = readFromRoute()
  if (!isSameState(initialState, options.get())) options.apply(initialState)

  const canonicalInitialQuery = options.write({ ...route.query }, initialState)
  if (import.meta.client && hasQueryChanges(canonicalInitialQuery)) {
    void router.replace({ path: route.path, query: canonicalInitialQuery, hash: route.hash })
  }

  watchDebounced(() => options.get(), async (state) => {
    let nextQuery = options.write({ ...route.query }, state)
    if (!hasQueryChanges(nextQuery)) return

    if (options.onFilterChange) {
      options.onFilterChange()
      await nextTick()
      nextQuery = options.write({ ...route.query }, options.get())
      nextQuery = { ...nextQuery, [options.pageKey ?? 'page']: undefined }
    }

    if (import.meta.client) {
      await router.replace({ path: route.path, query: nextQuery, hash: route.hash })
    }
  }, { deep: true, debounce: options.debounce ?? 250 })

  watch(() => options.keys.map(key => route.query[key]), () => {
    const nextState = readFromRoute()
    if (!isSameState(nextState, options.get())) options.apply(nextState)
  })
}

export function readSyncedQueryValue(value: unknown) {
  return queryValue(value)
}
