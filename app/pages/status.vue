<template>
  <div class="min-h-screen">
    <header class="mt-10 md:mt-6 p-8">
      <h1 class="font-title text-5xl md:text-6xl lg:text-7xl font-600 text-center line-height-none uppercase">
        {{ $t('title') }}
      </h1>
      <p class="italic font-body text-md md:text-base text-center text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
        {{ $t('subtitle') }}
      </p>
    </header>

    <div class="mt-8 max-w-2xl mx-auto px-8 pb-16 space-y-8">
      <!-- Overall status -->
      <div class="bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 p-6 rounded-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span
              class="w-3 h-3 rounded-full"
              :class="health?.status === 'healthy' ? 'bg-green-500' : health?.status === 'degraded' ? 'bg-orange-500' : 'bg-gray-400'"
            />
            <span class="font-serif text-lg font-300 text-gray-900 dark:text-gray-100">
              {{ health?.status === 'healthy' ? $t('healthy') : health?.status === 'degraded' ? $t('degraded') : $t('loading_status') }}
            </span>
          </div>
          <span class="font-mono text-xs text-gray-400 dark:text-gray-500">{{ lastChecked || $t('last_checked_fallback') }}</span>
        </div>
      </div>

      <!-- Component statuses -->
      <div class="space-y-3">
        <div class="flex items-center justify-between py-3 border-b border-dashed border-gray-200 dark:border-gray-700">
          <span class="font-body text-sm text-gray-700 dark:text-gray-300">{{ $t('component_api') }}</span>
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs text-gray-400">{{ health?.response_time_ms }}ms</span>
            <span
              class="w-2 h-2 rounded-full"
              :class="health?.status === 'healthy' ? 'bg-green-500' : 'bg-gray-400'"
            />
          </div>
        </div>

        <div class="flex items-center justify-between py-3 border-b border-dashed border-gray-200 dark:border-gray-700">
          <span class="font-body text-sm text-gray-700 dark:text-gray-300">{{ $t('component_database') }}</span>
          <div class="flex items-center gap-2">
            <span
              class="w-2 h-2 rounded-full"
              :class="health?.database === 'ok' ? 'bg-green-500' : 'bg-red-500'"
            />
          </div>
        </div>
      </div>

      <!-- Auto-refresh -->
      <p class="text-center font-mono text-xs text-gray-400 dark:text-gray-500">
        {{ $t('auto_refresh', { state: refreshing ? ($t('refresh_on') as string) : ($t('refresh_off') as string) }) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $t } = useI18n()

useHead({ title: $t('meta_title') as string })

interface HealthData {
  status: 'healthy' | 'degraded'
  database: 'ok' | 'error'
  response_time_ms: number
  timestamp: string
}

const health = ref<HealthData | null>(null)
const lastChecked = ref<string>('')
const refreshing = ref(true)

async function fetchHealth() {
  try {
    const data = await $fetch<{ success: boolean; data: HealthData }>('/api/v1/health')
    health.value = data.data
    const d = new Date(data.data.timestamp)
    lastChecked.value = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    health.value = { status: 'degraded', database: 'error', response_time_ms: 0, timestamp: new Date().toISOString() }
    lastChecked.value = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
}

onMounted(() => {
  fetchHealth()
  const interval = setInterval(() => {
    if (refreshing.value) fetchHealth()
  }, 30000)
  onUnmounted(() => clearInterval(interval))
})
</script>
