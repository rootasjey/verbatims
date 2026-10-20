<template>
  <main class="mx-auto min-h-[70vh] max-w-5xl px-5 pb-24 pt-6 md:px-8 md:py-20">
    <header class="border-b border-gray-200 pb-6 dark:border-gray-800 md:pb-10">
      <p class="font-mono text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
        {{ $t('eyebrow') }}
      </p>

      <div class="mt-3 flex flex-col gap-4 sm:mt-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div>
          <h1 class="font-title text-5xl font-500 line-height-none text-gray-950 dark:text-gray-50 md:text-7xl">
            {{ $t('title') }}
          </h1>
          <p class="mt-4 max-w-2xl font-body text-base text-gray-600 dark:text-gray-300 md:text-lg">
            {{ $t('subtitle') }}
          </p>
        </div>

        <NButton
          btn="outline-gray"
          class="shrink-0 self-start sm:self-auto"
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
      </div>
    </header>

    <section class="mt-4 md:mt-10" :aria-busy="checking">
      <div
        class="flex items-start gap-4 border-b border-gray-200 pb-4 dark:border-gray-800 sm:items-center sm:gap-6 md:pb-7"
        role="status"
        aria-live="polite"
      >
        <div
          class="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:mt-0"
          :class="summaryTone.background"
          aria-hidden="true"
        >
          <span class="h-5 w-5" :class="summaryTone.icon" />
        </div>

        <div>
          <p class="font-mono text-xs uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
            {{ $t('overall_status') }}
          </p>
          <h2 class="mt-1 font-title text-2xl font-500 text-gray-950 dark:text-gray-50 md:text-3xl">
            {{ $t(statusTitleKey) }}
          </h2>
          <p class="mt-2 max-w-3xl font-body text-sm leading-6 text-gray-600 dark:text-gray-300 md:text-base">
            {{ $t(statusDescriptionKey) }}
          </p>
        </div>
      </div>

      <div class="grid sm:grid-cols-2 sm:divide-x sm:divide-gray-200 dark:sm:divide-gray-800">
        <article class="py-3 sm:pr-8 md:py-7">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="font-mono text-xs uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                {{ $t('component_api') }}
              </p>
              <p class="mt-2 font-body text-lg font-600 text-gray-900 dark:text-gray-100">
                {{ $t(apiStatusKey) }}
              </p>
            </div>
            <span class="i-tabler-world h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
          </div>
          <p class="mt-2 font-body text-sm leading-6 text-gray-600 dark:text-gray-400">
            {{ $t('api_description') }}
          </p>
        </article>

        <article class="border-t border-gray-200 py-3 dark:border-gray-800 sm:border-t-0 sm:pl-8 md:py-7">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="font-mono text-xs uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                {{ $t('component_database') }}
              </p>
              <p class="mt-2 font-body text-lg font-600 text-gray-900 dark:text-gray-100">
                {{ $t(databaseStatusKey) }}
              </p>
            </div>
            <span class="i-tabler-database h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
          </div>
          <p class="mt-2 font-body text-sm leading-6 text-gray-600 dark:text-gray-400">
            {{ databaseProbeDescription }}
          </p>
        </article>
      </div>

      <div class="flex flex-col gap-1 border-t border-gray-200 pt-4 font-mono text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {{ $t('last_check') }}
          <time v-if="lastCheckedAt" :datetime="lastCheckedAt">{{ formattedLastChecked }}</time>
          <span v-else>{{ $t('not_checked_yet') }}</span>
        </p>
        <p>{{ $t('automatic_refresh') }}</p>
      </div>
    </section>

    <aside class="mt-20 border-l-2 border-gray-300 pl-4 dark:border-gray-700 md:mt-8">
      <p class="font-body text-sm leading-6 text-gray-600 dark:text-gray-400">
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
    return { background: 'bg-green-50 dark:bg-green-950/40', icon: 'i-tabler-circle-check text-green-700 dark:text-green-400' }
  }
  if (checkStatus.value === 'degraded') {
    return { background: 'bg-amber-50 dark:bg-amber-950/40', icon: 'i-tabler-alert-triangle text-amber-700 dark:text-amber-400' }
  }
  if (checkStatus.value === 'checking') {
    return { background: 'bg-gray-100 dark:bg-gray-800', icon: 'i-tabler-loader-2 motion-safe:animate-spin text-gray-600 dark:text-gray-300' }
  }
  return { background: 'bg-gray-100 dark:bg-gray-800', icon: 'i-tabler-help-circle text-gray-600 dark:text-gray-300' }
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
