<template>
  <div>
    <ClientOnly>
      <NCollapsible>
      <template #trigger>
        <div class="flex-col items-center mx-auto">
          <NButton btn="text-gray" class="min-w-330px md:w-600px mb-4 underline decoration-offset-8">
            Show metadata
          </NButton>
        </div>
      </template>

      <template #content>
        <div class="md:w-600px rounded-xl border-0.5px border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-[#0C0A09]/50">
          <div class="border-b border-gray-200 dark:border-gray-800 mb-6 p-6">
            <h3 class="md:text-xl line-height-4 sm:text-size-4 font-title font-semibold text-gray-900 dark:text-white">
              Metadata
            </h3>
            <span class="text-sm font-sans font-medium text-gray-500 dark:text-gray-400">
              All secondary information about the quote.
            </span>
          </div>

          <dl class="space-y-4 pb-4">
            <!-- Language -->
            <div class="px-4 py-1 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <dt class="flex items-center text-sm font-sans font-medium text-gray-500 dark:text-gray-400">
                <NIcon name="i-ph-globe-hemisphere-east-duotone" class="w-4 h-4 mr-2 text-gray-400" />
                Language
              </dt>
              <dd class=" text-size-3.5 ml-5.5 sm:ml-0 sm:col-span-2 text-base font-sans font-500 text-gray-900 dark:text-white">
                {{ getLanguageName(quote.language) }}
              </dd>
            </div>

            <div class="border-t border-gray-200 dark:border-gray-800"></div>

            <!-- Submitted by -->
            <div class="px-4 py-1 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <dt class="flex items-center text-sm font-sans font-medium text-gray-500 dark:text-gray-400">
                <NIcon name="i-ph-person-arms-spread" class="w-4 h-4 mr-2 text-gray-400" />
                Submitted by
              </dt>
              <dd class="sm:col-span-2 ml-5.5 sm:ml-0 text-base text-size-3.5 font-sans font-500 text-gray-900 dark:text-white">{{ quote.user?.name }}</dd>
            </div>

            <div class="border-t border-gray-200 dark:border-gray-800"></div>

            <!-- Added on -->
            <div class="px-4 py-1 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <dt class="flex items-center text-sm font-sans font-medium text-gray-500 dark:text-gray-400">
                <NIcon name="i-ph-calendar-dots-duotone" class="w-4 h-4 mr-2 text-gray-400" />
                Added on
              </dt>
              <dd class="sm:col-span-2 ml-5.5 sm:ml-0 text-base text-size-3.5 font-sans font-500 text-gray-900 dark:text-white">{{ formatDate(quote.created_at) }}</dd>
            </div>

            <div v-if="quote.reference">
              <div class="border-t border-gray-200 dark:border-gray-800 my-4"></div>
              <!-- Reference type -->
              <div class="px-4 py-1 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <dt class="flex items-center text-sm font-sans font-medium text-gray-500 dark:text-gray-400">
                  <NIcon :name="getReferenceIcon(quote.reference.primary_type)" class="w-4 h-4 mr-2 text-gray-400" />
                  Reference type
                </dt>
                <dd class="sm:col-span-2 ml-5.5 sm:ml-0 text-base text-size-3.5 font-sans font-500 text-gray-900 dark:text-white capitalize">{{ quote.reference.primary_type.replace('_',' ') }}</dd>
              </div>
            </div>

            <div v-if="quote.is_featured">
              <div class="border-t border-gray-200 dark:border-gray-800 my-4"></div>
              <!-- Status -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <dt class="flex items-center text-sm font-sans font-medium text-gray-500 dark:text-gray-400">
                  <NIcon name="i-ph-star" class="w-4 h-4 mr-2 text-yellow-500" />
                  Status
                </dt>
                <dd class="sm:col-span-2">
                  <NBadge color="yellow" variant="subtle" class="font-sans">
                    <NIcon name="i-ph-sparkle" class="w-3 h-3 mr-1" />
                    Featured quote
                  </NBadge>
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </template>
      </NCollapsible>

      <template #fallback>
        <div class="flex-col items-center mx-auto">
          <div class="min-w-330px md:w-600px mb-4 underline decoration-offset-8 text-gray-600 dark:text-gray-400 text-center">
            Show metadata
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template><script lang="ts" setup>
import type { QuoteWithRelations } from '~/types';

interface Props {
  quote: QuoteWithRelations;
  relatedQuotes?: QuoteWithRelations[];
  waveColor?: string;
}

defineProps<Props>();
</script>