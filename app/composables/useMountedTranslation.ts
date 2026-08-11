import { ref } from 'vue'

/**
 * SSR-safe translation for attribute bindings.
 *
 * nuxt-i18n-micro renders `$t(...)` values correctly in text interpolation but
 * attribute-bound values (placeholder, alt, aria-label, ...) keep the raw key in
 * the SSR HTML and hydration does not repaint them. Resolving the value in
 * `onMounted` guarantees it is rendered from the fully-loaded client translations.
 */
export function useMountedTranslation(key: string) {
  const { $t } = useI18n()
  const value = ref('')
  onMounted(() => {
    value.value = $t(key) as string
  })
  return value
}
