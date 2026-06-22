<template>
  <div class="min-h-screen bg-[#FAFAF9] dark:bg-[#0C0A09]">
    <AppHeader />

    <main class="mx-auto max-w-2xl px-6 py-16 md:py-24">
      <!-- Erratum label -->
      <div class="flex items-center gap-3 mb-12">
        <span class="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span class="font-sans text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 flex-shrink-0">Erratum</span>
        <span class="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      <!-- Status headline -->
      <h1 v-if="statusCode === 404" class="font-title text-8xl md:text-9xl font-600 text-center text-gray-900 dark:text-gray-100 leading-none select-none">
        404
      </h1>
      <h1 v-else class="font-title text-6xl md:text-7xl font-600 text-center text-gray-900 dark:text-gray-100 leading-none select-none">
        Error
      </h1>

      <!-- Editorial message -->
      <p v-if="statusCode === 404" class="font-serif text-2xl md:text-3xl font-200 text-center text-gray-500 dark:text-gray-400 mt-4 leading-relaxed text-balance">
        This page has escaped our archives.
      </p>
      <p v-else class="font-serif text-xl md:text-2xl font-200 text-center text-gray-500 dark:text-gray-400 mt-4 leading-relaxed text-balance">
        {{ message }}
      </p>

      <!-- Navigation -->
      <div class="flex justify-center items-center gap-6 mt-10">
        <HomeNavLink to="/" class="px-4 py-1">Go home</HomeNavLink>
        <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        <HomeNavLink to="/quotes" class="px-4 py-1">Explore quotes</HomeNavLink>
      </div>

      <!-- Dashed divider -->
      <div class="border-t b-dashed border-gray-300 dark:border-gray-700 my-12" />

      <!-- From the Archive section -->
      <div class="flex items-center gap-2 mb-6">
        <span class="w-2 h-2 rounded-full bg-[#3C82F6]" />
        <span class="font-sans text-xs font-600 uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
          From the Archive
        </span>
      </div>

      <!-- Quote -->
      <blockquote class="font-serif text-3xl md:text-4xl lg:text-5xl font-200 text-gray-900 dark:text-gray-100 leading-relaxed text-balance">
        <span v-if="currentQuote">"{{ currentQuote.name }}"</span>
        <span v-else class="text-gray-400 dark:text-gray-500">Loading a quote…</span>
      </blockquote>

      <!-- Attribution -->
      <div v-if="currentQuote" class="flex flex-wrap items-center gap-x-2 gap-y-1 mt-4 text-gray-500 dark:text-gray-400">
        <span v-if="currentQuote.author_id" class="font-subtitle text-lg font-600 text-gray-700 dark:text-gray-300">— {{ currentQuote.author?.name }}</span>
        <span v-if="currentQuote.reference_id" class="opacity-70">· {{ currentQuote.reference?.name }}</span>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3 mt-6">
        <NTooltip content="Copy quote">
          <NButton size="xs" btn="ghost-gray" icon label="i-ph-copy" @click="copyQuote" />
        </NTooltip>
        <NTooltip content="Open this quote">
          <NButton size="xs" btn="soft-gray" icon label="i-ph-arrow-square-out" :disabled="!currentQuote?.id" @click="openQuote" />
        </NTooltip>
        <span class="text-xs text-gray-400 dark:text-gray-500 ml-auto">Press <kbd class="font-sans text-xs border border-gray-200 dark:border-gray-700 rounded-sm px-1.5 py-0.5">Space</kbd> to shuffle</span>
      </div>
    </main>
  </div>
  <NToaster />
</template>

<script setup lang="ts">
const { error: errorProp } = defineProps<{ error?: any }>()
const nuxtError = useError()
const statusCode = computed(() => Number(
  (errorProp as any)?.statusCode ?? (errorProp as any)?.status ??
  (nuxtError.value as any)?.statusCode ?? (nuxtError.value as any)?.status ??
  500
))
const message = computed(() => (errorProp as any)?.message ?? (nuxtError.value as any)?.message ?? 'Something went wrong')

const quotes = ref<QuoteWithMetadata[]>([])
const index = ref(0)

const currentQuote = computed<QuoteWithMetadata | undefined>(() => quotes.value[index.value])

const openQuote = () => {
  if (!currentQuote.value?.id) return
  navigateTo(`/quotes/${currentQuote.value.id}`)
}

const copyQuote = async () => {
  const c = currentQuote.value; if (!c) return
  const text = `"${c.name}"${c.author_id ? ` — ${c.author?.name}` : ''}${c.reference_id ? ` · ${c.reference?.name}` : ''}`

  try {
    await navigator.clipboard?.writeText(text)
    useToast().toast({
      title: 'Copied to clipboard',
      leading: 'i-ph-check-circle',
    })
  } catch { /* Silently ignore clipboard errors */ }
}

const shuffleQuote = () => {
  if (quotes.value.length <= 1) return
  let next = index.value
  while (next === index.value && quotes.value.length > 1) {
    next = Math.floor(Math.random() * quotes.value.length)
  }
  index.value = next
}

onMounted(async () => {
  const fallback: QuoteWithMetadata[] = [
    {
      name: 'The only limit to our realization of tomorrow is our doubts of today.', author_id: 1,
      author: {
        name: 'Franklin D. Roosevelt', is_fictional: false,
        id: 0,
      },
      id: 0,
      language: 'en',
      user_id: 0,
      status: 'draft',
      views_count: 0,
      likes_count: 0,
      shares_count: 0,
      is_featured: false,
      created_at: '',
      updated_at: ''
    },
    {
      name: 'Simplicity is the soul of efficiency.', author_id: 2,
      author: {
        name: 'Austin Freeman', is_fictional: false,
        id: 0,
      },
      id: 0,
      language: 'en',
      user_id: 0,
      status: 'draft',
      views_count: 0,
      likes_count: 0,
      shares_count: 0,
      is_featured: false,
      created_at: '',
      updated_at: ''
    },
    {
      name: 'Not all those who wander are lost.', author_id: 3,
      author: {
        name: 'J.R.R. Tolkien', is_fictional: false,
        id: 0,
      },
      id: 0,
      language: 'en',
      user_id: 0,
      status: 'draft',
      views_count: 0,
      likes_count: 0,
      shares_count: 0,
      is_featured: false,
      created_at: '',
      updated_at: ''
    },
    {
      name: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author_id: 4,
      author: { name: 'Will Durant', is_fictional: false, id: 0 },
      id: 0,
      language: 'en',
      user_id: 0,
      status: 'draft',
      views_count: 0,
      likes_count: 0,
      shares_count: 0,
      is_featured: false,
      created_at: '',
      updated_at: ''
    },
    {
      name: 'What you do speaks so loudly that I cannot hear what you say.', author_id: 5,
      author: { name: 'Ralph Waldo Emerson', is_fictional: false, id: 0 },
      id: 0,
      language: 'en',
      user_id: 0,
      status: 'draft',
      views_count: 0,
      likes_count: 0,
      shares_count: 0,
      is_featured: false,
      created_at: '',
      updated_at: ''
    },
    {
      name: 'The future depends on what you do today.', author_id: 6,
      author: { name: 'Mahatma Gandhi', is_fictional: false, id: 0 },
      id: 0,
      language: 'en',
      user_id: 0,
      status: 'draft',
      views_count: 0,
      likes_count: 0,
      shares_count: 0,
      is_featured: false,
      created_at: '',
      updated_at: ''
    },
  ]

  let loaded: QuoteWithMetadata[] | undefined

  try {
    const { data } = await useFetch<any>('/api/quotes/random?count=12', { server: false })
    const arr = data.value?.data
    loaded = arr as unknown as QuoteWithMetadata[]
  } catch {
    // Ignore and fallback
  }

  quotes.value = loaded?.length ? loaded : fallback
  index.value = 0
})

// Keyboard shortcuts: Space = shuffle
onMounted(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === ' ' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
      e.preventDefault()
      shuffleQuote()
    }
  }
  window.addEventListener('keydown', handler)
  onBeforeUnmount(() => window.removeEventListener('keydown', handler))
})
</script>
