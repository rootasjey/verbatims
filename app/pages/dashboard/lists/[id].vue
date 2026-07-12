<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="space-y-6">
      <div class="animate-pulse">
        <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/4 mb-4" />
        <div class="h-8 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-3" />
        <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-2/3 mb-6" />
        <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
      </div>
      <div class="space-y-5">
        <div v-for="i in 4" :key="i" class="animate-pulse pb-5 border-b border-dashed border-gray-100 dark:border-gray-800">
          <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4 mb-2" />
          <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="!collection" class="py-16 text-center">
      <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">{{ $t('error_title') }}</p>
      <p class="font-sans text-sm text-gray-500 dark:text-gray-400 mb-6">{{ $t('error_desc') }}</p>
      <NuxtLink to="/dashboard/lists" class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors border-b border-dashed border-gray-300 dark:border-gray-600 pb-0.5">
        &larr; {{ $t('back_to_lists') }}
      </NuxtLink>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Header -->
      <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
        <NuxtLink to="/dashboard/lists" class="inline-flex items-center gap-1 font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-4">
          &larr; {{ $t('back_to_lists') }}
        </NuxtLink>

        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100 truncate">
                {{ collection.name }}
              </h1>
              <span
                v-if="collection.is_public"
                class="hidden md:inline font-sans text-xs text-green-600 dark:text-green-400 flex-shrink-0"
              >
                {{ $t('common.public') }}
              </span>
              <span
                v-else
                class="hidden md:inline font-sans text-xs text-gray-400 dark:text-gray-500 flex-shrink-0"
              >
                {{ $t('common.private') }}
              </span>
            </div>

            <p v-if="collection.description" class="font-sans text-sm text-gray-500 dark:text-gray-400 mb-3 leading-relaxed max-w-2xl">
              {{ collection.description }}
            </p>

            <div class="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
              <span>{{ collection.quotes_count || 0 }} {{ (collection.quotes_count || 0) === 1 ? $t('common.quote_singular') : $t('common.quote_plural') }}</span>
              <span class="text-gray-200 dark:text-gray-700">·</span>
              <span>{{ $t('common.created') }} {{ formatDate(collection.created_at) }}</span>
              <span v-if="collection.updated_at" class="text-gray-200 dark:text-gray-700">·</span>
              <span v-if="collection.updated_at">{{ $t('common.updated') }} {{ formatDate(collection.updated_at) }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <button
              @click="shareCollection"
              class="hidden md:inline-flex items-center gap-1.5 font-sans text-xs text-gray-600 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-sm"
            >
              {{ $t('button_share') }}
            </button>
            <NDropdownMenu :items="collectionActions">
              <NButton icon btn="ghost" size="xs" label="i-ph-dots-three-vertical" @click.stop />
            </NDropdownMenu>
          </div>
        </div>

        <div class="md:hidden mt-3 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
          <span
            class="font-sans"
            :class="collection.is_public ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'"
          >
            {{ collection.is_public ? $t('common.public') : $t('common.private') }}
          </span>
          <span class="text-gray-200 dark:text-gray-700">·</span>
          <button @click="shareCollection" class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">{{ $t('button_share') }}</button>
        </div>
      </div>

      <!-- Empty -->
      <div v-if="!collection.quotes?.length" class="py-16 text-center">
        <p class="font-serif text-xl font-200 text-gray-400 dark:text-gray-500 mb-2">{{ $t('empty_title') }}</p>
        <p class="font-sans text-sm text-gray-500 dark:text-gray-400">{{ $t('empty_desc') }}</p>
      </div>

      <!-- Quotes Feed -->
      <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
        <div
          v-for="(quote, idx) in collection.quotes"
          :key="quote.id"
          class="py-5 first:pt-0 last:pb-0 group animate-fade-in-up"
          :style="{ animationDelay: `${idx * 0.05}s` }"
        >
          <div class="flex items-start gap-4">
            <NuxtLink :to="`/quotes/${quote.id}`" class="flex-1 min-w-0 block">
              <blockquote class="font-body text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed line-clamp-2 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                &ldquo;{{ quote.name }}&rdquo;
              </blockquote>
              <div class="flex items-center gap-2 mt-2 flex-wrap">
                <span class="font-sans text-xs text-gray-600 dark:text-gray-400 font-500">{{ (quote as any).author_name || $t('common.unknown') }}</span>
                <span v-if="(quote as any).reference_name" class="text-gray-300 dark:text-gray-600">·</span>
                <span v-if="(quote as any).reference_name" class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ (quote as any).reference_name }}</span>
                <span class="text-gray-300 dark:text-gray-600">·</span>
                <span class="font-sans text-xs text-gray-400 dark:text-gray-500">{{ $t('common.added') }} {{ formatDate(quote.added_at) }}</span>
              </div>
            </NuxtLink>
            <div class="hidden md:flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <NTooltip :content="$t('tooltip_share') as string">
                <button @click.stop="handleShareQuote(quote)" class="p-1.5 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  <NIcon name="i-ph-share" class="w-4 h-4" />
                </button>
              </NTooltip>
              <NTooltip :content="$t('tooltip_remove') as string">
                <button @click.stop="handleRemoveFromCollection(quote)" class="p-1.5 rounded-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                  <NIcon name="i-ph-x" class="w-4 h-4" />
                </button>
              </NTooltip>
            </div>
          </div>
        </div>
      </div>

      <!-- Spacer for sticky footer -->
      <div v-if="totalPages > 1" class="h-20" />
    </div>
  </div>

  <!-- Sticky Pagination Footer -->
  <div
    v-if="totalPages > 1"
    class="fixed bottom-0 z-20 bg-[#FAFAF9] dark:bg-[#0C0A09] border-t border-dashed border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between shadow-sm transition-all duration-300 ease-in-out"
    :style="{ left: footerLeftOffset + 'px', width: footerWidth }"
  >
    <span class="font-sans text-xs text-gray-500 dark:text-gray-400">
      Page
      <button
        class="font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 underline underline-offset-2 decoration-dotted decoration-gray-300 dark:decoration-gray-600"
        @click="showPageJumpDialog = true"
      >
        {{ currentPage }}
      </button>
      of {{ totalPages }}
    </span>
    <div class="flex items-center gap-3">
      <OutlinedButton v-if="currentPage > 1" @click="currentPage = Math.max(1, currentPage - 1)">&larr; Previous</OutlinedButton>
      <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">This is the first page</span>
      <button
        class="font-sans text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm px-2.5 py-1.5 transition-colors"
        @click="showPageJumpDialog = true"
      >
        {{ currentPage }} / {{ totalPages }}
      </button>
      <OutlinedButton v-if="currentPage < totalPages" @click="currentPage = Math.min(totalPages, currentPage + 1)">Next &rarr;</OutlinedButton>
      <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">This is the last page</span>
    </div>
  </div>

  <!-- Page Jump Dialog -->
  <PageJumpDialog
    v-model="showPageJumpDialog"
    :total-pages="totalPages"
    @jump="onPageJump"
  />
</template>

<script lang="ts" setup>
import { formatDate } from '~/utils/time-formatter'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { $t } = useI18n()
const route = useRoute()
const collectionId = computed(() => String(route.params.id))
const { showErrorToast } = useErrorToast()
const pageHeader = usePageHeader()

onMounted(() => {
  pageHeader.setHeaderFromRoute()
})

const collection = ref<CollectionWithQuotes | null>(null)

  const pageTitle = computed(() => collection.value
    ? String($t('meta_title', { name: collection.value.name }))
    : String($t('meta_fallback')))
  const pageDesc = computed(() => collection.value?.description || String($t('meta_desc')))

  useHead({
    title: pageTitle,
    meta: [
      { name: 'description', content: pageDesc }
    ]
  })

const loading = ref(true)
const currentPage = ref(1)
const totalPages = ref(0)

const loadCollection = async () => {
  try {
    loading.value = true

    const response = await $fetch<any>(`/api/collections/${collectionId.value}` as const, {
      query: {
        page: currentPage.value,
        limit: 12
      }
    })

    collection.value = response.data as unknown as CollectionWithQuotes
    totalPages.value = response.data?.pagination?.totalPages ?? 1
  } catch (error) {
    console.error('Failed to load collection:', error)
    collection.value = null
  } finally {
    loading.value = false
  }
}

watch(currentPage, () => {
  loadCollection()
})

const shareCollection = async () => {
  if (!collection.value) return

  try {
    const shareText = $t('share_text', { name: collection.value.name })
    const shareData = {
      title: `${collection.value.name} - Verbatims Collection`,
      text: shareText as string,
      url: window.location.href
    }

    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`)
      useToast().toast({
        title: $t('toast_collection_shared') as string,
        description: $t('toast_collection_shared_desc') as string,
        toast: 'soft-success',
      })
    }
  } catch (error) {
    console.error('Failed to share collection:', error)
  }
}

const collectionActions = computed(() => ([
  {
    label: $t('dropdown_copy_link') as string,
    leading: 'i-ph-link',
    onclick: async () => {
      try {
        await navigator.clipboard.writeText(window.location.href)
        useToast().toast({ title: $t('toast_link_copied') as string, description: $t('toast_url_copied') as string, toast: 'soft-success' })
      } catch (error) {
        console.error('Failed to copy link:', error)
      }
    }
  }
]))

const handleShareQuote = (quote: any) => {
  const text = `"${quote.name}"${quote.author_name ? ` - ${quote.author_name}` : ''}`
  if (navigator.share) {
    navigator.share({
      title: $t('share_title') as string,
      text,
      url: `${window.location.origin}/quotes/${quote.id}`
    })
  } else {
    navigator.clipboard.writeText(text)
    useToast().toast({ title: $t('toast_copied_clipboard') as string, toast: 'outline-success' })
  }
}

const handleRemoveFromCollection = async (quote: any) => {
  if (!confirm($t('confirm_remove') as string)) return

  try {
    await $fetch(`/api/collections/${collectionId.value}/quotes/${quote.id}`, {
      method: 'DELETE'
    })

    if (collection.value) {
      collection.value.quotes = collection.value.quotes?.filter((q: any) => q.id !== quote.id) || []
      if (collection.value.quotes_count) {
        collection.value.quotes_count--
      }
    }
  } catch (error) {
    console.error('Failed to remove quote:', error)
    showErrorToast(error, $t('error_remove') as string)
  }
}

const showPageJumpDialog = ref(false)

const onPageJump = (page: number) => {
  currentPage.value = page
}

const footerLeftOffset = ref(0)
const footerWidth = ref('100%')

let footerObserver: ResizeObserver | null = null

const updateFooterPosition = () => {
  const mainEl = document.querySelector('main')
  if (!mainEl) {
    footerLeftOffset.value = 0
    footerWidth.value = '100%'
    return
  }
  const rect = mainEl.getBoundingClientRect()
  footerLeftOffset.value = rect.left
  footerWidth.value = `${rect.width}px`
}

onMounted(() => {
  loadCollection()
  updateFooterPosition()
  footerObserver = new ResizeObserver(updateFooterPosition)
  const mainEl = document.querySelector('main')
  if (mainEl) footerObserver.observe(mainEl)
  window.addEventListener('resize', updateFooterPosition)
})

onUnmounted(() => {
  if (footerObserver) footerObserver.disconnect()
  window.removeEventListener('resize', updateFooterPosition)
})
</script>

<style scoped>
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out both;
}

.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
