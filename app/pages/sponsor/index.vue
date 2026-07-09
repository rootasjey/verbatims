<template>
  <div class="min-h-screen">
    <header class="mt-10 md:mt-6 p-8">
      <h1 class="font-title text-5xl md:text-6xl lg:text-7xl font-600 text-center line-height-none uppercase">
        Sponsor
      </h1>
      <p class="italic font-body text-md md:text-base text-center text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
        Promote your brand, project, or message on Verbatims.
      </p>
    </header>

    <div class="mt-8 max-w-2xl mx-auto px-8 pb-32 space-y-12">
      <!-- Pricing card -->
      <section class="bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="font-title text-2xl font-600">Sponsored Message</h2>
            <p class="font-body text-sm text-gray-500 dark:text-gray-400 mt-1">
              Your message displayed in the sponsor bar at the bottom of every page.
            </p>
          </div>
          <div class="text-right">
            <p class="font-title text-3xl font-600 text-gray-900 dark:text-gray-100">5€</p>
            <p class="font-body text-xs text-gray-500 dark:text-gray-400">one-time payment</p>
          </div>
        </div>

        <div class="mt-4 space-y-2 font-body text-sm text-gray-600 dark:text-gray-400">
          <div class="flex items-center gap-2">
            <NIcon name="i-ph-check-circle" class="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
            <span>Visible for <strong class="text-gray-900 dark:text-gray-200">7 days</strong> in the sponsor bar</span>
          </div>
          <div class="flex items-center gap-2">
            <NIcon name="i-ph-check-circle" class="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
            <span>Include a message, icons, and an optional link</span>
          </div>
          <div class="flex items-center gap-2">
            <NIcon name="i-ph-clock-counter-clockwise" class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Requires <strong class="text-gray-900 dark:text-gray-200">manual approval</strong> before publishing</span>
          </div>
        </div>
      </section>

      <!-- Login prompt -->
      <div v-if="!user" class="text-center py-12">
        <p class="font-body text-lg text-gray-600 dark:text-gray-400 mb-4">
          You need to be logged in to purchase a sponsored message.
        </p>
        <NButton label="Log in" btn="outline-gray" size="lg" to="/login" />
      </div>

      <!-- Form -->
      <form v-else @submit.prevent="submit" class="space-y-6">
        <div>
          <NInput
            v-model="form.message"
            placeholder="Your message, e.g. Check out our new collection!"
            required
            class="bg-white dark:bg-gray-900 b-none shadow-none"
            :una="{ inputTrailingWrapper: 'pr-1.5' }"
          >
            <template #trailing>
              <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
                Message *
              </NBadge>
            </template>
          </NInput>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <NInput
            v-model="form.leading_icon"
            placeholder="i-ph-star"
            class="bg-white dark:bg-gray-900 b-none shadow-none"
            :una="{ inputTrailingWrapper: 'pr-1.5' }"
          >
            <template #trailing>
              <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
                Leading Icon
              </NBadge>
            </template>
          </NInput>
          <NInput
            v-model="form.trailing_icon"
            placeholder="i-ph-heart"
            class="bg-white dark:bg-gray-900 b-none shadow-none"
            :una="{ inputTrailingWrapper: 'pr-1.5' }"
          >
            <template #trailing>
              <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
                Trailing Icon
              </NBadge>
            </template>
          </NInput>
        </div>

        <NInput
          v-model="form.url"
          placeholder="https://example.com"
          class="bg-white dark:bg-gray-900 b-none shadow-none"
          :una="{ inputTrailingWrapper: 'pr-1.5' }"
        >
          <template #trailing>
            <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
              URL
            </NBadge>
          </template>
        </NInput>

        <NButton
          type="submit"
          :loading="submitting"
          label="Pay 5€ & Publish"
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

useHead({
  title: 'Sponsor \u2022 Verbatims',
  meta: [
    { name: 'description', content: 'Promote your brand or message on Verbatims with a sponsored message in the sponsor bar.' },
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
    const msg = error?.data?.statusMessage || error?.message || 'Failed to create checkout'
    toast({
      toast: 'soft-error',
      title: 'Error',
      description: msg,
    })
  } finally {
    submitting.value = false
  }
}
</script>
