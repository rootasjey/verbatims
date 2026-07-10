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

    <div class="mt-8 max-w-2xl mx-auto px-8 pb-32 space-y-12">
      <!-- Pricing card -->
      <section class="bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="font-title text-2xl font-600">{{ $t('pricing_title') }}</h2>
            <p class="font-body text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ $t('pricing_desc') }}
            </p>
          </div>
          <div class="text-right">
            <p class="font-title text-3xl font-600 text-gray-900 dark:text-gray-100">{{ $t('price') }}</p>
            <p class="font-body text-xs text-gray-500 dark:text-gray-400">{{ $t('price_label') }}</p>
          </div>
        </div>

        <div class="mt-4 space-y-2 font-body text-sm text-gray-600 dark:text-gray-400">
          <div class="flex items-center gap-2">
            <NIcon name="i-ph-check-circle" class="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
            <span>{{ $t('feature_duration') }}</span>
          </div>
          <div class="flex items-center gap-2">
            <NIcon name="i-ph-check-circle" class="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
            <span>{{ $t('feature_content') }}</span>
          </div>
          <div class="flex items-center gap-2">
            <NIcon name="i-ph-clock-counter-clockwise" class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{{ $t('feature_approval') }}</span>
          </div>
        </div>
      </section>

      <!-- Login prompt -->
      <div v-if="!user" class="text-center py-12">
        <p class="font-body text-lg text-gray-600 dark:text-gray-400 mb-4">
          {{ $t('login_prompt') }}
        </p>
        <NButton :label="$t('login_button') as string" btn="outline-gray" size="lg" to="/login" />
      </div>

      <!-- Form -->
      <form v-else @submit.prevent="submit" class="space-y-6">
        <div>
          <NInput
            v-model="form.message"
            :placeholder="$t('message_placeholder') as string"
            required
            class="bg-white dark:bg-gray-900 b-none shadow-none"
            :una="{ inputTrailingWrapper: 'pr-1.5' }"
          >
            <template #trailing>
              <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
                {{ $t('message_label') }}
              </NBadge>
            </template>
          </NInput>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <NInput
            v-model="form.leading_icon"
            :placeholder="$t('leading_icon_placeholder') as string"
            class="bg-white dark:bg-gray-900 b-none shadow-none"
            :una="{ inputTrailingWrapper: 'pr-1.5' }"
          >
            <template #trailing>
              <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
                {{ $t('leading_icon_label') }}
              </NBadge>
            </template>
          </NInput>
          <NInput
            v-model="form.trailing_icon"
            :placeholder="$t('trailing_icon_placeholder') as string"
            class="bg-white dark:bg-gray-900 b-none shadow-none"
            :una="{ inputTrailingWrapper: 'pr-1.5' }"
          >
            <template #trailing>
              <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
                {{ $t('trailing_icon_label') }}
              </NBadge>
            </template>
          </NInput>
        </div>

        <NInput
          v-model="form.url"
          :placeholder="$t('url_placeholder') as string"
          class="bg-white dark:bg-gray-900 b-none shadow-none"
          :una="{ inputTrailingWrapper: 'pr-1.5' }"
        >
          <template #trailing>
            <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
              {{ $t('url_label') }}
            </NBadge>
          </template>
        </NInput>

        <NButton
          type="submit"
          :loading="submitting"
          :label="$t('submit_button') as string"
          btn="solid-gray"
          size="lg"
          class="w-full"
          trailing="i-ph-arrow-right"
          :disabled="!form.message.trim()"
        />
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { $t } = useI18n()

useHead({
  title: $t('meta_title') as string,
  meta: [
    { name: 'description', content: $t('meta_desc') as string },
  ],
})

const { user } = useUserSession()
const { toast } = useToast()

const submitting = ref(false)

const form = reactive({
  message: '',
  leading_icon: '',
  trailing_icon: '',
  url: '',
})

const submit = async () => {
  if (submitting.value || !form.message.trim()) return
  submitting.value = true

  try {
    const res = await $fetch<{ url: string }>('/api/checkout/sponsor', {
      method: 'POST',
      body: {
        message: form.message.trim(),
        leading_icon: form.leading_icon.trim() || null,
        trailing_icon: form.trailing_icon.trim() || null,
        url: form.url.trim() || null,
      },
    })

    if (res.url) {
      window.location.href = res.url
    }
  } catch (error: any) {
    const msg = error?.data?.statusMessage || error?.message || ($t('error_checkout') as string)
    toast({
      toast: 'soft-error',
      title: $t('toast_error') as string,
      description: msg,
    })
  } finally {
    submitting.value = false
  }
}
</script>
