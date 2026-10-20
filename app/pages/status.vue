<template>
  <main class="mx-auto min-h-[70vh] max-w-6xl px-6 pb-32 pt-6 sm:px-8 sm:pt-12 md:px-8 md:pb-24 md:pt-28 lg:px-10">
    <header class="flex flex-col gap-3 border-b border-gray-200 pb-4 dark:border-gray-800 sm:gap-6 sm:pb-10 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="font-serif text-5xl font-400 leading-none tracking-[-0.035em] text-gray-900 dark:text-gray-100 md:text-6xl lg:text-7xl">
          {{ $t('title') }}
        </h1>
        <p class="mt-4 max-w-3xl font-sans text-lg leading-relaxed text-gray-600 dark:text-gray-400 md:mt-5 md:text-xl">
          {{ $t('subtitle') }}
        </p>
      </div>

      <NButton
        btn="outline-gray"
        class="min-h-10 shrink-0 self-start px-4 md:self-auto"
        :disabled="checking"
        :aria-label="$t(checking ? 'checking' : 'refresh') as string"
        @click="fetchHealth"
      >
        <span
          class="i-tabler-refresh mr-2 h-4 w-4"
          :class="checking ? 'motion-safe:animate-spin' : ''"
          aria-hidden="true"
        />
        {{ checking ? $t('checking') : $t('refresh') }}
      </NButton>
    </header>

    <section class="mt-4 md:mt-10" :aria-busy="checking">
      <div
        class="flex items-start gap-4 border-b border-gray-200 pb-4 dark:border-gray-800 sm:items-center sm:gap-6 md:pb-10"
        role="status"
        aria-live="polite"
      >
        <span
          class="mt-3 h-2.5 w-2.5 shrink-0 rounded-full sm:mt-0"
          :class="summaryTone.marker"
          aria-hidden="true"
        />

        <div>
          <h2 class="font-serif text-3xl font-400 leading-tight tracking-[-0.025em] text-gray-900 dark:text-gray-100 md:text-4xl">
            {{ $t(statusTitleKey) }}
          </h2>
          <p class="mt-2 max-w-3xl font-sans text-base leading-relaxed text-gray-600 dark:text-gray-400 md:text-lg">
            {{ $t(statusDescriptionKey) }}
          </p>
        </div>
      </div>

      <div class="divide-y divide-gray-200 border-b border-gray-200 dark:divide-gray-800 dark:border-gray-800">
        <article class="grid grid-cols-1 gap-2 py-3 sm:grid-cols-[minmax(12rem,0.8fr)_minmax(0,2fr)] sm:gap-8 md:py-7">
          <h3 class="font-serif text-xl font-400 leading-snug text-gray-900 dark:text-gray-100 md:text-2xl">
            {{ $t('component_api') }}
          </h3>
          <div>
            <p class="font-sans text-base font-600 text-gray-900 dark:text-gray-100">
              {{ $t(apiStatusKey) }}
            </p>
            <p class="mt-1 font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {{ $t('api_description') }}
            </p>
          </div>
        </article>

        <article class="grid grid-cols-1 gap-2 py-3 sm:grid-cols-[minmax(12rem,0.8fr)_minmax(0,2fr)] sm:gap-8 md:py-7">
          <h3 class="font-serif text-xl font-400 leading-snug text-gray-900 dark:text-gray-100 md:text-2xl">
            {{ $t('component_database') }}
          </h3>
          <div>
            <p class="font-sans text-base font-600 text-gray-900 dark:text-gray-100">
              {{ $t(databaseStatusKey) }}
            </p>
            <p class="mt-1 font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {{ databaseProbeDescription }}
            </p>
          </div>
        </article>
      </div>

      <div class="flex flex-col gap-2 pt-4 font-sans text-sm text-gray-500 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {{ $t('last_check') }}
          <time v-if="lastCheckedAt" :datetime="lastCheckedAt">{{ formattedLastChecked }}</time>
          <span v-else>{{ $t('not_checked_yet') }}</span>
        </p>
        <p>{{ $t('automatic_refresh') }}</p>
      </div>
    </section>

    <aside class="mt-20 border-t border-gray-200 pt-4 dark:border-gray-800 md:mt-10">
      <p class="max-w-4xl font-sans text-sm leading-relaxed text-gray-500 dark:text-gray-400">
        {{ $t('scope_note') }}
      </p>
    </aside>
  </main>
</template>

<script setup lang="ts">
const { $t } = useI18n()
const { locale } = useI18nLocale()

useHead({ title: $t('meta_title') as string })

interface HealthData {
  status: 'healthy' | 'degraded'
  database: 'ok' | 'error'
  response_time_ms: number
  timestamp: string
}

type EndpointState = 'checking' | 'responding' | 'unreachable' | 'invalid'

const health = ref<HealthData | null>(null)
const endpointState = ref<EndpointState>('checking')
const checking = ref(false)
const lastCheckedAt = ref<string | null>(null)

function isHealthData(value: unknown): value is HealthData {
  if (!value || typeof value !== 'object') return false

  const data = value as Record<string, unknown>
  return (data.status === 'healthy' || data.status === 'degraded')
    && (data.database === 'ok' || data.database === 'error')
    && typeof data.response_time_ms === 'number'
    && Number.isFinite(data.response_time_ms)
    && data.response_time_ms >= 0
    && typeof data.timestamp === 'string'
    && Number.isFinite(Date.parse(data.timestamp))
    && ((data.status === 'healthy') === (data.database === 'ok'))
}

const checkStatus = computed(() => {
  if (health.value?.status === 'healthy') return 'healthy'
  if (health.value?.status === 'degraded') return 'degraded'
  if (endpointState.value === 'checking') return 'checking'
  return 'unknown'
})

const statusTitleKey = computed(() => ({
  healthy: 'healthy',
  degraded: 'degraded',
  checking: 'loading_status',
  unknown: 'unknown',
})[checkStatus.value])

const statusDescriptionKey = computed(() => ({
  healthy: 'healthy_description',
  degraded: 'degraded_description',
  checking: 'checking_description',
  unknown: 'unknown_description',
})[checkStatus.value])

const summaryTone = computed(() => {
  if (checkStatus.value === 'healthy') {
    return { marker: 'bg-green-600 dark:bg-green-500' }
  }
  if (checkStatus.value === 'degraded') {
    return { marker: 'bg-amber-600 dark:bg-amber-500' }
  }
  if (checkStatus.value === 'checking') {
    return { marker: 'bg-gray-400 motion-safe:animate-pulse dark:bg-gray-500' }
  }
  return { marker: 'bg-gray-400 dark:bg-gray-500' }
})

const apiStatusKey = computed(() => {
  if (endpointState.value === 'responding') return 'api_responding'
  if (endpointState.value === 'unreachable') return 'api_unreachable'
  if (endpointState.value === 'invalid') return 'api_invalid'
  return 'checking'
})

const databaseStatusKey = computed(() => {
  if (!health.value) return endpointState.value === 'checking' ? 'checking' : 'database_unknown'
  return health.value.database === 'ok' ? 'database_available' : 'database_unavailable'
})

const databaseProbeDescription = computed(() => {
  if (!health.value) return $t('database_description') as string
  if (health.value.database !== 'ok') return $t('database_probe_failed_description') as string

  const responseTime = health.value.response_time_ms === 0
    ? String($t('less_than_one_ms'))
    : String($t('milliseconds', { value: health.value.response_time_ms }))

  return $t('database_probe_time', { time: responseTime }) as string
})

const formattedLastChecked = computed(() => {
  if (!lastCheckedAt.value) return ''

  const language = locale.value === 'fr' ? 'fr-FR' : 'en-US'
  return new Intl.DateTimeFormat(language, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(lastCheckedAt.value))
})

async function fetchHealth() {
  if (checking.value) return

  checking.value = true
  let responseReceived = false
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 10_000)

  try {
    const response = await fetch('/api/v1/health', {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    })
    responseReceived = true
    endpointState.value = 'responding'

    const payload: unknown = await response.json()
    const data = payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>).data
      : undefined

    const success = payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>).success
      : undefined

    if (!isHealthData(data) || typeof success !== 'boolean' || success !== (data.status === 'healthy')) {
      endpointState.value = 'invalid'
      throw new Error('Health endpoint returned an invalid payload')
    }

    const expectedStatus = data.status === 'healthy' ? 200 : 503
    if (response.status !== expectedStatus) {
      endpointState.value = 'invalid'
      throw new Error('Health endpoint status did not match its payload')
    }

    health.value = data
    lastCheckedAt.value = data.timestamp
  } catch {
    health.value = null
    if (endpointState.value !== 'invalid') {
      endpointState.value = responseReceived ? 'invalid' : 'unreachable'
    }
    lastCheckedAt.value = new Date().toISOString()
  } finally {
    window.clearTimeout(timeout)
    checking.value = false
  }
}

let interval: number | undefined

onMounted(() => {
  void fetchHealth()
  interval = window.setInterval(() => void fetchHealth(), 30_000)
})

onUnmounted(() => {
  if (interval !== undefined) window.clearInterval(interval)
})
</script>
