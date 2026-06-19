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
      <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">Collection not found</p>
      <p class="font-sans text-sm text-gray-500 dark:text-gray-400 mb-6">The collection you're looking for doesn't exist.</p>
      <NuxtLink to="/dashboard/lists" class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors border-b border-dashed border-gray-300 dark:border-gray-600 pb-0.5">
        &larr; Back to Lists
      </NuxtLink>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Header -->
      <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
        <NuxtLink to="/dashboard/lists" class="inline-flex items-center gap-1 font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-4">
          &larr; Back to Lists
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
                Public
              </span>
              <span
                v-else
                class="hidden md:inline font-sans text-xs text-gray-400 dark:text-gray-500 flex-shrink-0"
              >
                Private
              </span>
            </div>

            <p v-if="collection.description" class="font-sans text-sm text-gray-500 dark:text-gray-400 mb-3 leading-relaxed max-w-2xl">
              {{ collection.description }}
            </p>

            <div class="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
              <span>{{ collection.quotes_count || 0 }} {{ (collection.quotes_count || 0) === 1 ? 'quote' : 'quotes' }}</span>
              <span class="text-gray-200 dark:text-gray-700">·</span>
              <span>Created {{ formatDate(collection.created_at) }}</span>
              <span v-if="collection.updated_at" class="text-gray-200 dark:text-gray-700">·</span>
              <span v-if="collection.updated_at">Updated {{ formatDate(collection.updated_at) }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <button
              @click="shareCollection"
              class="hidden md:inline-flex items-center gap-1.5 font-sans text-xs text-gray-600 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-sm"
            >
              Share
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
            {{ collection.is_public ? 'Public' : 'Private' }}
          </span>
          <span class="text-gray-200 dark:text-gray-700">·</span>
          <button @click="shareCollection" class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Share</button>
        </div>
      </div>

      <!-- Empty -->
      <div v-if="!collection.quotes?.length" class="py-16 text-center">
        <p class="font-serif text-xl font-200 text-gray-400 dark:text-gray-500 mb-2">No quotes yet</p>
        <p class="font-sans text-sm text-gray-500 dark:text-gray-400">Add quotes to this collection from any quote page.</p>
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
                <span class="font-sans text-xs text-gray-600 dark:text-gray-400 font-500">{{ (quote as any).author_name || 'Unknown' }}</span>
                <span v-if="(quote as any).reference_name" class="text-gray-300 dark:text-gray-600">·</span>
                <span v-if="(quote as any).reference_name" class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ (quote as any).reference_name }}</span>
                <span class="text-gray-300 dark:text-gray-600">·</span>
                <span class="font-sans text-xs text-gray-400 dark:text-gray-500">Added {{ formatDate(quote.added_at) }}</span>
              </div>
            </NuxtLink>
            <div class="hidden md:flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <NTooltip content="Share quote">
                <button @click.stop="handleShareQuote(quote)" class="p-1.5 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  <NIcon name="i-ph-share" class="w-4 h-4" />
                </button>
              </NTooltip>
              <NTooltip content="Remove from collection">
                <button @click.stop="handleRemoveFromCollection(quote)" class="p-1.5 rounded-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                  <NIcon name="i-ph-x" class="w-4 h-4" />
                </button>
              </NTooltip>
            </div>
          </div>
        </div>
      </div>

      <!-- Load More -->
      <div v-if="hasMore" class="text-center pt-6">
        <button
          :disabled="loadingMore"
          class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors border-b border-dashed border-gray-300 dark:border-gray-600 pb-0.5 disabled:opacity-50"
          @click="loadMoreQuotes"
        >
          {{ loadingMore ? 'Loading...' : 'Load More' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { formatDate } from '~/utils/time-formatter'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const route = useRoute()
const collectionId = computed(() => String(route.params.id))
const { showErrorToast } = useErrorToast()
const pageHeader = usePageHeader()

onMounted(() => {
  pageHeader.setHeaderFromRoute()
})

const collection = ref<CollectionWithQuotes | null>(null)

useHead({
  title: computed(() => collection.value ? `${collection.value.name} - Collections` : 'Collection - Verbatims'),
  meta: [
    {
      name: 'description',
      content: computed(() => collection.value?.description || 'A curated collection of quotes from Verbatims')
    }
  ]
})

const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(false)
const currentPage = ref(1)

const loadCollection = async (reset = true) => {
  try {
    if (reset) {
      loading.value = true
      currentPage.value = 1
    } else {
      loadingMore.value = true
    }

    const response = await $fetch<any>(`/api/collections/${collectionId.value}` as const, {
      query: {
        page: currentPage.value,
        limit: 12
      }
    })

    if (reset) {
      collection.value = response.data as unknown as CollectionWithQuotes
    } else {
      if (collection.value) {
        collection.value.quotes = [...(collection.value.quotes || []), ...(response.data?.quotes || [])]
        ;(collection.value as any).pagination = response.data.pagination
      }
    }

    hasMore.value = response.data.pagination.hasMore
  } catch (error) {
    console.error('Failed to load collection:', error)
    collection.value = null
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMoreQuotes = () => {
  currentPage.value++
  loadCollection(false)
}

const shareCollection = async () => {
  if (!collection.value) return

  try {
    const shareData = {
      title: `${collection.value.name} - Verbatims Collection`,
      text: `Check out this collection of quotes: "${collection.value.name}"`,
      url: window.location.href
    }

    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`)
      useToast().toast({
        title: 'Collection Shared',
        description: 'The collection link has been copied to your clipboard.',
        toast: 'soft-success',
      })
    }
  } catch (error) {
    console.error('Failed to share collection:', error)
  }
}

const collectionActions = computed(() => ([
  {
    label: 'Copy Link',
    leading: 'i-ph-link',
    onclick: async () => {
      try {
        await navigator.clipboard.writeText(window.location.href)
        useToast().toast({ title: 'Link copied', description: 'URL copied to clipboard', toast: 'soft-success' })
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
      title: 'Quote from Verbatims',
      text,
      url: `${window.location.origin}/quotes/${quote.id}`
    })
  } else {
    navigator.clipboard.writeText(text)
    useToast().toast({ title: 'Copied to clipboard', toast: 'outline-success' })
  }
}

const handleRemoveFromCollection = async (quote: any) => {
  if (!confirm('Remove this quote from the collection?')) return

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
    showErrorToast(error, 'Failed to remove quote')
  }
}

onMounted(() => {
  loadCollection()
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
