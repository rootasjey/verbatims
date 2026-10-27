<template>
  <main class="mx-auto min-h-screen max-w-5xl px-6 pb-20 pt-12 sm:px-8 md:pt-24 lg:px-10">
    <NuxtLink to="/quotes" class="mb-8 inline-flex font-sans text-sm text-gray-500 underline decoration-gray-300 underline-offset-4 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
      {{ $t('back_to_quotes') }}
    </NuxtLink>

    <template v-if="isPublic && collection">
      <header class="mb-12 border-b border-gray-200 pb-8 dark:border-gray-800">
        <h1 class="max-w-4xl break-words font-serif text-5xl font-500 leading-tight tracking-[-0.035em] text-gray-900 dark:text-gray-100 sm:text-6xl">
          {{ collection.name }}
        </h1>
        <p v-if="collection.description" class="mt-5 max-w-3xl font-sans text-lg leading-relaxed text-gray-600 dark:text-gray-400">
          {{ collection.description }}
        </p>
        <p class="mt-5 font-sans text-sm text-gray-500 dark:text-gray-400">
          {{ $t('list_by', { name: collection.user_name || String($t('unknown_curator')) }) }}
          <span class="mx-2 text-gray-300 dark:text-gray-700">·</span>
          {{ $t(collection.quotes_count === 1 ? 'quote_count_singular' : 'quote_count_plural', { count: collection.quotes_count }) }}
        </p>
      </header>

      <p v-if="!collection.quotes.length" class="py-16 font-serif text-2xl text-gray-500 dark:text-gray-400">
        {{ $t('empty_list') }}
      </p>
      <ol v-else class="divide-y divide-gray-200/80 dark:divide-white/10">
        <li v-for="quote in collection.quotes" :key="quote.id" class="py-7 first:pt-0 sm:py-9">
          <NuxtLink :to="`/quotes/${quote.id}`" class="group block rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gray-500 dark:focus-visible:outline-gray-300">
            <QuoteEditorialText :text="quote.name" class="whitespace-normal break-words font-serif text-xl leading-snug tracking-[-0.01em] text-gray-900 transition-colors group-hover:text-gray-600 dark:text-gray-100 dark:group-hover:text-gray-300 sm:text-2xl lg:text-3xl" />
            <p class="mt-3 font-sans text-sm text-gray-600 dark:text-gray-400">
              <span v-if="quote.author?.name" class="font-500 text-gray-800 dark:text-gray-200">{{ quote.author.name }}</span>
              <span v-if="quote.author?.name && quote.reference?.name" class="mx-2 text-gray-300 dark:text-gray-700">·</span>
              <span v-if="quote.reference?.name">{{ quote.reference.name }}</span>
              <span v-if="!quote.author?.name && !quote.reference?.name">{{ $t('source_not_recorded') }}</span>
            </p>
          </NuxtLink>
        </li>
      </ol>
    </template>

    <section v-else class="max-w-2xl py-16">
      <h1 class="font-serif text-4xl font-500 tracking-[-0.03em] text-gray-900 dark:text-gray-100">
        {{ isPrivate ? $t('private_title') : $t('not_found_title') }}
      </h1>
      <p class="mt-4 font-sans text-lg leading-relaxed text-gray-600 dark:text-gray-400">
        {{ isPrivate ? $t('private_description') : $t('not_found_description') }}
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useVerbatimsSeo } from '~/composables/useSeo'

interface PublicListQuote {
  id: number
  name: string
  author?: { name?: string } | null
  reference?: { name?: string } | null
}

interface PublicList {
  id: number
  name: string
  description: string | null
  is_public: boolean
  user_name: string | null
  quotes_count: number
  quotes: PublicListQuote[]
}

const route = useRoute()
const { $t, $ts } = useI18n()
const { locale } = useI18nLocale()
const listId = String(route.params.id)
const { data: response, error } = await useFetch<{ data: PublicList }>(`/api/collections/${encodeURIComponent(listId)}`, {
  query: { page: 1, limit: 50 },
  key: `public-list-${listId}`,
})

const collection = computed(() => response.value?.data?.is_public ? response.value.data : null)
const isPublic = computed(() => Boolean(collection.value))
const isPrivate = computed(() => response.value?.data?.is_public === false || error.value?.statusCode === 403)
const pageTitle = computed(() => collection.value
  ? `${collection.value.name} — Verbatims`
  : $ts(isPrivate.value ? 'private_title' : 'not_found_title'))
const pageDescription = computed(() => collection.value?.description
  || $ts(isPublic.value ? 'public_description' : isPrivate.value ? 'private_description' : 'not_found_description'))

useVerbatimsSeo(() => ({
  title: pageTitle.value,
  description: pageDescription.value,
  imagePath: `/api/og/collections/${encodeURIComponent(listId)}.png?locale=${locale.value || 'en'}`,
  imageAlt: pageTitle.value,
}))

useHead(() => ({
  meta: [{ name: 'robots', content: isPublic.value ? 'index,follow' : 'noindex,nofollow' }],
}))

</script>
