<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50 dark:from-[#0C0A09] dark:to-[#0B0907]">
    <AppHeader />

    <!-- Content -->
    <div class="mt-24 mb-12 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <!-- Decorative background dots -->
      <div aria-hidden class="pointer-events-none absolute inset-0 opacity-30 dark:opacity-15">
        <div class="absolute -top-24 -left-24 size-[28rem] rounded-full bg-gradient-to-br from-[#687FE5]/15 to-emerald/10 blur-3xl" />
        <div class="absolute -bottom-20 -right-24 size-[26rem] rounded-full bg-gradient-to-tr from-fuchsia/10 to-[#687FE5]/15 blur-3xl" />
      </div>

      <!-- 404 headline -->
      <div class="text-center mb-6">
        <h1 v-if="statusCode === 404" class="font-title text-size-24 md:text-size-42 md:text-size-54 font-600 hyphens-auto overflow-hidden break-words line-height-none uppercase mb-4 transform-gpu transition-all duration-700 ease-out">404</h1>
        <h1 v-else class="font-extrabold tracking-tight text-6xl sm:text-7xl md:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-amber-500 to-amber-300 select-none">Oops</h1>
        <p class="mt-2 text-base sm:text-lg text-gray-600 dark:text-gray-400">
          <span v-if="statusCode === 404">We couldn't find that page.</span>
          <span v-else>{{ message }}</span>
        </p>
        
        <!-- Quick actions -->
        <div class="flex justify-center items-center gap-2">
          <UButton btn="link-gray" @click="goHome">
            Go home
          </UButton>
          <span>•</span>
          <UButton btn="link-gray" @click="exploreQuotes">
            Explore quotes
          </UButton>
        </div>
      </div>

      <div class="mt-12 mx-6 flex flex-col gap-4">
        <UButton btn="link" @click="shuffleQuote" class="text-center mt-2 text-xs text-gray-500 dark:text-gray-500">Press Space to shuffle</UButton>
        <blockquote class="text-center text-xl sm:text-2xl md:text-6xl font-serif font-100 leading-relaxed text-gray-900 dark:text-gray-100">
          <span v-if="currentQuote" class="whitespace-pre-line">“{{ currentQuote.name }}”</span>
          <span v-else class="text-gray-500 dark:text-gray-400">Loading a quote…</span>
        </blockquote>
        <div class="flex flex-col items-center justify-between flex-wrap gap-3 text-gray-600 dark:text-gray-400">
          <div class="flex items-center gap-2">
            <span v-if="currentQuote?.author_id" class="font-medium">— {{ currentQuote.author?.name }}</span>
            <span v-if="currentQuote?.reference_id" class="opacity-70">· {{ currentQuote.reference?.name }}</span>
          </div>
          <div class="flex items-center gap-2">
            <UTooltip content="Copy quote">
              <UButton size="xs" btn="ghost-gray" icon label="i-ph-copy" @click="copyQuote" />
            </UTooltip>
            <UTooltip content="Open this quote">
              <UButton size="xs" btn="soft-gray" icon label="i-ph-arrow-square-out" :disabled="!currentQuote?.id" @click="openQuote" />
            </UTooltip>
          </div>
        </div>
      </div>
    </div>
  </div>
  <UToaster />
</template>

<script setup lang="ts">
import type { QuoteWithMetadata } from './types'

const error = useError()
const statusCode = computed(() => Number((error.value as any)?.statusCode ?? (error.value as any)?.status ?? 500))
const message = computed(() => (error.value as any)?.message || 'Something went wrong')

const quotes = ref<QuoteWithMetadata[]>([])
const index = ref(0)

const currentQuote = computed<QuoteWithMetadata | undefined>(() => quotes.value[index.value])

const goHome = () => clearError({ redirect: '/' })
const exploreQuotes = () => navigateTo('/quotes')

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
    const { data } = await useFetch('/api/quotes/random?count=12', { server: false })
    const arr = data.value?.data
    loaded = arr
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
