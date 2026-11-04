<template>
  <div>
    <!-- Editorial Header -->
    <div data-admin-page-header class="pb-6 mb-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
            {{ $t('title') }}
          </h1>
          <p class="mt-2 font-sans text-sm text-gray-500 dark:text-gray-400">{{ $t('subtitle') }}</p>
        </div>
        <div class="hidden md:flex items-center gap-3">
          <AdminSearchToggle v-model="searchQuery" :placeholder="$t('search_placeholder') as string" :close-label="$t('common.close') as string" />
          <button class="inline-flex min-h-11 items-center gap-2 rounded-md bg-gray-950 px-5 text-sm font-600 text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-gray-500 dark:bg-gray-100 dark:text-gray-950 dark:hover:bg-white" @click="openCreateDialog">
            {{ $t('create_button') }}
            <NIcon name="i-ph-arrow-right" class="h-4 w-4" />
          </button>
        </div>
      </div>
      <div class="md:hidden mt-4 space-y-3">
        <input v-model="searchQuery" type="text" :placeholder="$t('search_placeholder') as string" class="w-full font-sans text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500" />
        <div class="flex justify-end">
          <button class="inline-flex min-h-11 items-center gap-2 rounded-md bg-gray-950 px-5 text-sm font-600 text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-gray-500 dark:bg-gray-100 dark:text-gray-950 dark:hover:bg-white" @click="openCreateDialog">
            {{ $t('create_button') }}
            <NIcon name="i-ph-arrow-right" class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && keys.length === 0" class="space-y-5">
      <div v-for="i in 5" :key="i" class="animate-pulse pb-5 border-b border-dashed border-gray-100 dark:border-gray-800">
        <div class="h-4 bg-gray-100 dark:bg-gray-900 rounded w-3/4 mb-2" /><div class="h-3 bg-gray-100 dark:bg-gray-900 rounded w-1/4" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="keys.length === 0 && !loading" class="py-12 md:py-16 px-6 text-center border border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30">
      <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">{{ searchQuery ? $t('empty_search_title') : $t('empty_title') }}</p>
      <p class="font-sans text-xs text-gray-400 dark:text-gray-500 mb-4">{{ $t('empty_desc') }}</p>
      <button class="inline-flex min-h-11 items-center gap-2 rounded-md bg-gray-950 px-5 text-sm font-600 text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-gray-500 dark:bg-gray-100 dark:text-gray-950 dark:hover:bg-white" @click="openCreateDialog">
        {{ $t('create_button') }}
        <NIcon name="i-ph-arrow-right" class="h-4 w-4" />
      </button>
    </div>

    <!-- Table -->
    <div v-else>
      <div class="hidden md:block border border-gray-200 dark:border-gray-800 rounded-xl overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0C0A09]">
              <th class="px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_identity') }}</th>
              <th class="w-36 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_access') }}</th>
              <th class="w-24 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_rate_limit') }}</th>
              <th class="w-32 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_permissions') }}</th>
              <th class="w-28 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_owner') }}</th>
              <th class="w-28 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_created') }}</th>
              <th class="w-10 px-3 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <ContextMenu
              v-for="key in keys"
              :key="key.id"
              as-child
              ignore-interactive-targets
              size="xs"
              native-on-modifier="ctrl"
              :items="getRowActions(key)"
            >
            <tr class="transition-colors group hover:bg-[#E7E5DE] dark:hover:bg-[#292725]">
              <td class="px-3 py-3">
                <button class="block max-w-full truncate text-left font-sans text-sm text-gray-900 hover:underline dark:text-gray-100" @click="editKey(key)">{{ key.name }}</button>
                <code class="mt-1 inline-block font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{{ key.keyPrefix }}...</code>
              </td>
              <td class="px-3 py-3">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="font-sans text-xs px-1.5 py-0.5 rounded" :class="tierClass(key.tier)">{{ key.tier }}</span>
                  <span class="inline-flex rounded-md px-1.5 py-0.5 font-sans text-xs font-medium" :class="key.isActive ? 'text-[#2373F4] dark:text-[#8AB5FF] bg-[#2373F4]/10 dark:bg-[#2373F4]/15' : 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.08]'">
                  {{ key.isActive ? $t('common.status_active') : $t('common.status_inactive') }}
                  </span>
                </div>
              </td>
              <td class="px-3 py-3 font-sans text-xs text-gray-500 dark:text-gray-400">
                {{ key.readRateLimit }}/{{ formatWindow(key.readWindowSec) }}
              </td>
              <td class="px-3 py-3">
                <div class="flex flex-wrap gap-1.5">
                  <NTooltip v-for="perm in key.permissions" :key="perm" :content="permissionLabel(perm)">
                    <span tabindex="0" role="img" :aria-label="permissionLabel(perm)" class="grid h-7 min-w-7 place-items-center rounded-md border border-gray-200 bg-gray-50 px-1 text-gray-600 dark:border-gray-700 dark:bg-white/[0.06] dark:text-gray-300">
                      <NIcon :name="permissionIcon(perm)" class="h-3.5 w-3.5" />
                    </span>
                  </NTooltip>
                </div>
              </td>
              <td class="px-3 py-3 font-sans text-xs text-gray-500 dark:text-gray-400">{{ key.userName }}</td>
              <td class="px-3 py-3 font-sans text-xs text-gray-500 dark:text-gray-400">{{ formatDate(key.createdAt) }}</td>
              <td class="px-3 py-3">
                <NDropdownMenu :items="getRowActions(key)" :modal="false">
                  <button @click.stop class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><NIcon name="i-ph-dots-three-vertical" class="w-4 h-4" /></button>
                </NDropdownMenu>
              </td>
            </tr>
            </ContextMenu>
          </tbody>
        </table>
      </div>

      <div class="md:hidden space-y-3">
        <ContextMenu
          v-for="key in keys"
          :key="key.id"
          as-child
          ignore-interactive-targets
          size="xs"
          native-on-modifier="ctrl"
          :items="getRowActions(key)"
        >
        <article class="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h2 class="font-sans text-base font-600 text-gray-900 dark:text-gray-100 break-words">{{ key.name }}</h2>
              <code class="inline-block mt-2 font-mono text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{{ key.keyPrefix }}...</code>
            </div>
            <NDropdownMenu :items="getRowActions(key)" :modal="false">
              <button :aria-label="$t('row_actions', { name: key.name }) as string" class="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 transition-colors">
                <NIcon name="i-ph-dots-three-vertical" class="w-4 h-4" />
              </button>
            </NDropdownMenu>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ $t('col_tier') }}</p>
              <span class="mt-1 inline-flex rounded px-1.5 py-0.5 text-xs" :class="tierClass(key.tier)">{{ key.tier }}</span>
            </div>
            <div>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ $t('col_status') }}</p>
              <span class="mt-1 inline-flex rounded-md px-1.5 py-0.5 font-sans text-xs font-medium" :class="key.isActive ? 'text-[#2373F4] dark:text-[#8AB5FF] bg-[#2373F4]/10 dark:bg-[#2373F4]/15' : 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/[0.08]'">
                {{ key.isActive ? $t('common.status_active') : $t('common.status_inactive') }}
              </span>
            </div>
            <div>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ $t('col_rate_limit') }}</p>
              <p class="mt-1 text-gray-800 dark:text-gray-200">{{ key.readRateLimit }}/{{ formatWindow(key.readWindowSec) }}</p>
            </div>
            <div>
              <p class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ $t('col_owner') }}</p>
              <p class="mt-1 text-gray-800 dark:text-gray-200">{{ key.userName }}</p>
            </div>
          </div>
          <div class="mt-4 border-t border-gray-100 dark:border-gray-800 pt-3">
            <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mb-2">{{ $t('col_permissions') }}</p>
            <div class="flex flex-wrap gap-1.5">
              <NTooltip v-for="perm in key.permissions" :key="perm" :content="permissionLabel(perm)">
                <span tabindex="0" role="img" :aria-label="permissionLabel(perm)" class="grid h-8 min-w-8 place-items-center rounded-md border border-gray-200 bg-gray-50 px-1.5 text-gray-600 dark:border-gray-700 dark:bg-white/[0.06] dark:text-gray-300">
                  <NIcon :name="permissionIcon(perm)" class="h-4 w-4" />
                </span>
              </NTooltip>
            </div>
          </div>
          <p class="mt-3 font-sans text-xs text-gray-500 dark:text-gray-400">{{ $t('col_created') }} · {{ formatDate(key.createdAt) }}</p>
        </article>
        </ContextMenu>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="h-20" />
    </div>

    <div
      v-if="totalPages > 1"
      class="fixed bottom-0 z-20 bg-[#FAFAF9] dark:bg-[#0C0A09] border-t border-gray-200 dark:border-gray-800 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between shadow-sm transition-all duration-300 ease-in-out"
      :style="{ left: footerLeftOffset + 'px', width: footerWidth }"
    >
      <span class="font-sans text-xs text-gray-500 dark:text-gray-400">
        Page
        <button
          class="font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 underline underline-offset-2 decoration-gray-300 dark:decoration-gray-600"
          @click="showPageJumpDialog = true"
        >
          {{ currentPage }}
        </button>
        of {{ totalPages }} &middot; {{ total }} {{ total === 1 ? 'key' : 'keys' }}
      </span>
      <div class="flex items-center gap-3">
        <OutlinedButton v-if="currentPage > 1" class="rounded-lg" @click="currentPage = Math.max(1, currentPage - 1)">&larr; Previous</OutlinedButton>
        <button
          class="font-sans text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg px-3 py-2 transition-colors"
          @click="showPageJumpDialog = true"
        >
          {{ currentPage }} / {{ totalPages }}
        </button>
        <OutlinedButton v-if="currentPage < totalPages" class="rounded-lg" @click="currentPage = Math.min(totalPages, currentPage + 1)">Next &rarr;</OutlinedButton>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <ClientOnly>
    <NDialog v-model:open="showDialog" :una="{ dialogContent: 'w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] max-w-4xl gap-6 overflow-y-auto rounded-xl border border-gray-200 bg-white text-gray-900 shadow-xl dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 p-5 sm:p-7' }">
      <template #header>
        <div>
          <h2 class="font-serif text-2xl font-400 tracking-tight text-gray-900 dark:text-gray-100">{{ editingKey ? $t('dialog_edit_title') : $t('dialog_create_title') }}</h2>
        </div>
      </template>
      <div v-if="createdKey && !editingKey" class="space-y-5">
        <div class="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-900">
          <div class="mb-4 flex items-start gap-3">
            <NIcon name="i-ph-check-circle" class="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
            <div>
              <h3 class="font-sans text-base font-600 text-gray-900 dark:text-gray-100">{{ $t('created_title') }}</h3>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">{{ $t('warning_save') }}</p>
            </div>
          </div>
          <p class="mb-2 font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ form.name }}</p>
          <div class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-neutral-950">
            <code class="min-w-0 flex-1 break-all px-2 font-mono text-sm text-gray-900 dark:text-gray-100">{{ createdKey }}</code>
            <NButton btn="outline-gray" class="min-h-10 shrink-0 px-3" @click="copyKey">{{ copied ? $t('common.copied') : $t('common.copy') }}</NButton>
          </div>
        </div>
      </div>
      <div v-else class="space-y-6">
        <nav v-if="!editingKey" :aria-label="$t('steps_label') as string" class="grid grid-cols-3 gap-2 border-b border-gray-200 pb-4 dark:border-gray-700">
          <button type="button" :aria-current="creationStep === 1 ? 'step' : undefined" class="flex min-h-11 items-center gap-2 rounded-lg px-2 text-left text-xs transition-colors sm:px-3 sm:text-sm" :class="creationStep === 1 ? 'bg-gray-100 font-600 text-gray-950 dark:bg-gray-800 dark:text-gray-50' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/60'" @click="creationStep = 1">
            <span class="font-mono text-[10px] opacity-70 sm:text-xs">01.</span><span class="truncate">{{ $t('step_onboarding') }}</span>
          </button>
          <button type="button" :aria-current="creationStep === 2 ? 'step' : undefined" class="flex min-h-11 items-center gap-2 rounded-lg px-2 text-left text-xs transition-colors sm:px-3 sm:text-sm" :class="creationStep === 2 ? 'bg-gray-100 font-600 text-gray-950 dark:bg-gray-800 dark:text-gray-50' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/60'" @click="creationStep = 2">
            <span class="font-mono text-[10px] opacity-70 sm:text-xs">02.</span><span class="truncate">{{ $t('step_access') }}</span>
          </button>
          <button type="button" :aria-current="creationStep === 3 ? 'step' : undefined" class="flex min-h-11 items-center gap-2 rounded-lg px-2 text-left text-xs transition-colors sm:px-3 sm:text-sm" :class="creationStep === 3 ? 'bg-gray-100 font-600 text-gray-950 dark:bg-gray-800 dark:text-gray-50' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/60'" @click="creationStep = 3">
            <span class="font-mono text-[10px] opacity-70 sm:text-xs">03.</span><span class="truncate">{{ $t('step_limits') }}</span>
          </button>
        </nav>

        <div v-if="editingKey || creationStep === 1" class="space-y-5">
        <div>
          <label class="mb-1.5 block font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ $t('label_name') }}</label>
          <input v-model="form.name" type="text" :placeholder="$t('placeholder_name') as string" class="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 font-sans text-sm text-gray-900 placeholder-gray-400 outline-none transition focus-visible:ring-2 focus-visible:ring-stone-500/70 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100 dark:placeholder-gray-500" />
        </div>
        <div>
          <label class="mb-1.5 block font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ $t('label_tier') }}</label>
          <NCombobox v-model="selectedTierOption" :items="tierOptions" by="value" :_combobox-list="{ class: 'min-w-[220px]' }" :_combobox-trigger="{ btn: 'outline-gray', size: 'md', trailing: 'i-lucide-chevron-down', class: 'min-h-11 w-full justify-between rounded-lg font-sans text-sm' }">
            <template #trigger="{ modelValue }"><span class="truncate">{{ modelValue?.label }}</span></template>
          </NCombobox>
        </div>
        </div>

        <div v-if="editingKey || creationStep === 2">
        <div>
          <label class="mb-2 block font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ $t('label_permissions') }}</label>
          <ApiKeyPermissionPicker v-model="form.permissions" :sections="permissionSections" />
          <p class="mt-2 font-sans text-xs text-gray-500 dark:text-gray-400">{{ $t('permissions_audit_hint') }}</p>
        </div>
        </div>

        <div v-if="editingKey || creationStep === 3" class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="flex-1">
              <label class="mb-1.5 block font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ $t('label_rate_limit') }}</label>
              <input v-model.number="form.readRateLimit" type="number" min="1" class="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 font-sans text-sm text-gray-900 outline-none transition focus-visible:ring-2 focus-visible:ring-stone-500/70 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100" />
            </div>
            <div class="flex-1">
              <label class="mb-1.5 block font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ $t('label_read_window') }}</label>
              <input v-model.number="form.readWindowSec" type="number" min="1" class="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 font-sans text-sm text-gray-900 outline-none transition focus-visible:ring-2 focus-visible:ring-stone-500/70 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100" />
            </div>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="flex-1">
              <label class="mb-1.5 block font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ $t('label_write_rate_limit') }}</label>
              <input v-model.number="form.writeRateLimit" type="number" min="1" class="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 font-sans text-sm text-gray-900 outline-none transition focus-visible:ring-2 focus-visible:ring-stone-500/70 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100" />
            </div>
            <div class="flex-1">
              <label class="mb-1.5 block font-sans text-sm font-500 text-gray-700 dark:text-gray-300">{{ $t('label_write_window') }}</label>
              <input v-model.number="form.writeWindowSec" type="number" min="1" class="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 font-sans text-sm text-gray-900 outline-none transition focus-visible:ring-2 focus-visible:ring-stone-500/70 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100" />
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="-mx-5 -mb-5 flex w-[calc(100%+2.5rem)] justify-end gap-3 border-t border-gray-200 px-5 pt-4 pb-5 dark:border-neutral-700 sm:-mx-7 sm:-mb-7 sm:w-[calc(100%+3.5rem)] sm:px-7 sm:pb-7">
          <NButton v-if="createdKey && !editingKey" btn="solid-black" class="min-h-10 rounded-lg px-4" @click="closeDialog">{{ $t('common.done') }}</NButton>
          <template v-else-if="!editingKey && creationStep < 3">
            <NButton btn="ghost-gray" class="min-h-10 px-4" @click="closeDialog">{{ $t('common.cancel') }}</NButton>
            <NButton v-if="creationStep > 1" btn="ghost-gray" class="min-h-10 px-4" @click="creationStep -= 1">{{ $t('step_previous') }}</NButton>
            <NButton btn="solid-black" class="min-h-10 rounded-lg px-4" :disabled="creationStep === 1 && !form.name.trim()" @click="continueCreation">{{ $t('step_next') }}</NButton>
          </template>
          <template v-else>
            <NButton btn="ghost-gray" class="min-h-10 px-4" @click="closeDialog">{{ $t('common.cancel') }}</NButton>
            <NButton btn="solid-black" class="min-h-10 rounded-lg px-4" :loading="saving" :disabled="saving || !form.name.trim()" @click="save">{{ editingKey ? $t('common.save') : $t('dialog_create_title') }}</NButton>
          </template>
        </div>
      </template>
    </NDialog>
    </ClientOnly>

    <!-- Delete Dialog -->
    <AppDialog
      v-model="showDeleteDialog"
      :title="$t('dialog_delete_title') as string"
      :submitting="deleting"
      cancel-button-class="min-h-10 px-4"
      max-width="md"
      @submit="confirmDelete"
    >
      <div class="space-y-5">
        <p class="break-words font-semibold text-gray-900 dark:text-gray-100">
          {{ deletingKey?.name }} <span class="font-normal text-gray-500 dark:text-gray-400">· #{{ deletingKey?.id }}</span>
        </p>

        <DeleteWarningPanel>{{ $t('dialog_delete_body') }}</DeleteWarningPanel>
      </div>

      <template #submit>
        <NButton btn="solid-red" :loading="deleting" :disabled="deleting || !deletingKey" class="min-h-10 px-4" @click="confirmDelete">
          {{ $t('common.delete') }}
        </NButton>
      </template>
    </AppDialog>
    <PageJumpDialog
      v-model="showPageJumpDialog"
      :total-pages="totalPages"
      @jump="onPageJump"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
const { $t } = useI18n()
useHead({ title: $t('meta_title') as string })
const { showErrorToast } = useErrorToast()

const loading = ref(false)
const keys = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
useSyncedPageQuery(currentPage)
const pageSize = ref(50)
const searchQuery = ref('')
useSyncedQueryFilters({
  keys: ['q'],
  read: query => ({ q: readSyncedQueryValue(query.q) }),
  write: (query, state) => ({ ...query, q: state.q.trim() || undefined }),
  get: () => ({ q: searchQuery.value }),
  apply: state => { searchQuery.value = state.q },
  onFilterChange: () => { currentPage.value = 1 }
})

const showPageJumpDialog = ref(false)
const footerLeftOffset = ref(0)
const footerWidth = ref('100%')

const showDialog = ref(false)
const editingKey = ref<any | null>(null)
const saving = ref(false)
const createdKey = ref('')
const copied = ref(false)
const creationStep = ref(1)

const copyKey = async () => {
  try {
    await navigator.clipboard.writeText(createdKey.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = createdKey.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

const showDeleteDialog = ref(false)
const deletingKey = ref<any | null>(null)
const deleting = ref(false)

const availablePermissions = [
  { label: String($t('perm_read')), value: 'read' },
  { label: String($t('perm_read_provenance')), value: 'read:provenance' },
  { label: String($t('perm_quotes')), value: 'write:quotes' },
  { label: String($t('perm_delete_quotes')), value: 'delete:quotes' },
  { label: String($t('perm_sources')), value: 'write:sources' },
  { label: String($t('perm_delete_sources')), value: 'delete:sources' },
  { label: String($t('perm_occurrences')), value: 'write:occurrences' },
  { label: String($t('perm_delete_occurrences')), value: 'delete:occurrences' },
  { label: String($t('perm_attributions')), value: 'write:attributions' },
  { label: String($t('perm_delete_attributions')), value: 'delete:attributions' },
  { label: String($t('perm_assign_authors')), value: 'assign:authors' },
  { label: String($t('perm_assign_references')), value: 'assign:references' },
  { label: String($t('perm_authors')), value: 'write:authors' },
  { label: String($t('perm_delete_authors')), value: 'delete:authors' },
  { label: String($t('perm_references')), value: 'write:references' },
  { label: String($t('perm_delete_references')), value: 'delete:references' },
  { label: String($t('perm_collections')), value: 'write:collections' },
  { label: String($t('perm_delete_collections')), value: 'delete:collections' },
  { label: String($t('perm_social_read')), value: 'social:read' },
  { label: String($t('perm_social_write')), value: 'social:write' },
  { label: String($t('perm_social_delete')), value: 'social:delete' },
  { label: String($t('perm_themes')), value: 'admin:themes' },
  { label: String($t('perm_delete_themes')), value: 'delete:themes' },
  { label: String($t('perm_all')), value: '*' },
]

const permissionSections = [
  {
    label: String($t('permissions_group_access')),
    columns: [{ label: String($t('permissions_column_enabled')) }],
    rows: [
      { label: String($t('permissions_row_api')), scopes: ['read'] },
      { label: String($t('permissions_row_provenance')), scopes: ['read:provenance'] },
      { label: String($t('permissions_row_all')), scopes: ['*'] },
    ],
  },
  {
    label: String($t('permissions_group_content')),
    columns: [
      { label: String($t('permissions_column_modify')) },
      { label: String($t('permissions_column_delete')) },
    ],
    rows: [
      { label: String($t('permissions_row_quotes')), scopes: ['write:quotes', 'delete:quotes'] },
      { label: String($t('permissions_row_sources')), note: String($t('permissions_note_moderator')), noteTooltip: String($t('permissions_note_moderator_tooltip')), scopes: ['write:sources', 'delete:sources'] },
      { label: String($t('permissions_row_occurrences')), note: String($t('permissions_note_moderator')), noteTooltip: String($t('permissions_note_moderator_tooltip')), scopes: ['write:occurrences', 'delete:occurrences'] },
      { label: String($t('permissions_row_attributions')), note: String($t('permissions_note_moderator')), noteTooltip: String($t('permissions_note_moderator_tooltip')), scopes: ['write:attributions', 'delete:attributions'] },
      { label: String($t('permissions_row_assign_author')), note: String($t('permissions_note_assignment')), noteTooltip: String($t('permissions_note_assignment_tooltip')), scopes: ['assign:authors', null] },
      { label: String($t('permissions_row_assign_reference')), note: String($t('permissions_note_assignment')), noteTooltip: String($t('permissions_note_assignment_tooltip')), scopes: ['assign:references', null] },
      { label: String($t('permissions_row_authors')), note: String($t('permissions_note_moderator')), noteTooltip: String($t('permissions_note_moderator_tooltip')), scopes: ['write:authors', 'delete:authors'] },
      { label: String($t('permissions_row_references')), note: String($t('permissions_note_moderator')), noteTooltip: String($t('permissions_note_moderator_tooltip')), scopes: ['write:references', 'delete:references'] },
      { label: String($t('permissions_row_collections')), scopes: ['write:collections', 'delete:collections'] },
    ],
  },
  {
    label: String($t('permissions_group_social')),
    columns: [
      { label: String($t('permissions_column_read')) },
      { label: String($t('permissions_column_write')) },
      { label: String($t('permissions_column_delete')) },
    ],
    rows: [{ label: String($t('permissions_row_social_queue')), note: String($t('permissions_note_moderator')), noteTooltip: String($t('permissions_note_moderator_tooltip')), scopes: ['social:read', 'social:write', 'social:delete'] }],
  },
  {
    label: String($t('permissions_group_themes')),
    columns: [
      { label: String($t('permissions_column_manage')) },
      { label: String($t('permissions_column_delete')) },
    ],
    rows: [{ label: String($t('permissions_row_themes')), note: String($t('permissions_note_moderator')), noteTooltip: String($t('permissions_note_moderator_tooltip')), scopes: ['admin:themes', 'delete:themes'] }],
  },
]

const permissionIcons: Record<string, string> = {
  read: 'i-lucide-eye',
  'read:provenance': 'i-lucide-book-open-text',
  'write:quotes': 'i-lucide-quote',
  'delete:quotes': 'i-lucide-trash-2',
  'write:sources': 'i-lucide-link',
  'delete:sources': 'i-lucide-trash-2',
  'write:occurrences': 'i-lucide-repeat-2',
  'delete:occurrences': 'i-lucide-trash-2',
  'write:attributions': 'i-lucide-user-round-pen',
  'delete:attributions': 'i-lucide-trash-2',
  'assign:authors': 'i-lucide-user-round',
  'assign:references': 'i-lucide-book-open',
  'write:authors': 'i-lucide-user-round-pen',
  'delete:authors': 'i-lucide-trash-2',
  'write:references': 'i-lucide-book-open-check',
  'delete:references': 'i-lucide-trash-2',
  'write:collections': 'i-lucide-library',
  'delete:collections': 'i-lucide-trash-2',
  'social:read': 'i-lucide-message-circle-more',
  'social:write': 'i-lucide-send',
  'social:delete': 'i-lucide-trash-2',
  'admin:themes': 'i-lucide-panels-top-left',
  'delete:themes': 'i-lucide-trash-2',
  '*': 'i-lucide-shield-check',
}

function permissionLabel(value: string) {
  return availablePermissions.find(permission => permission.value === value)?.label ?? value
}

function permissionIcon(value: string) {
  return permissionIcons[value] ?? 'i-lucide-key-round'
}

const tierOptions = [
  { label: String($t('tier_free')), value: 'free' },
  { label: String($t('tier_pro')), value: 'pro' },
  { label: String($t('tier_enterprise')), value: 'enterprise' },
]

const form = reactive({
  name: '',
  tier: 'free',
  permissions: ['read'],
  readRateLimit: 1000,
  readWindowSec: 3600,
  writeRateLimit: 1000,
  writeWindowSec: 3600,
})

const selectedTierOption = computed({
  get: () => tierOptions.find(option => option.value === form.tier) ?? tierOptions[0]!,
  set: (option: typeof tierOptions[number] | null) => { if (option) form.tier = option.value }
})

const tierClass = (tier: string) => {
  switch (tier) {
    case 'pro': return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
    case 'enterprise': return 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
    default: return 'text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
  }
}

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const formatWindow = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h`
}

const formatDate = (ts: number | string | null | undefined) => {
  if (!ts) return '\u2014'
  const d = new Date(ts)
  if (isNaN(d.getTime())) return '\u2014'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const resetForm = () => {
  form.name = ''
  form.tier = 'free'
  form.permissions = ['read']
  form.readRateLimit = 1000
  form.readWindowSec = 3600
  form.writeRateLimit = 1000
  form.writeWindowSec = 3600
  createdKey.value = ''
  copied.value = false
  creationStep.value = 1
  editingKey.value = null
}

const continueCreation = () => {
  if (creationStep.value === 1 && !form.name.trim()) return
  creationStep.value = Math.min(3, creationStep.value + 1)
}

const openCreateDialog = () => {
  resetForm()
  showDialog.value = true
}

const editKey = (key: any) => {
  editingKey.value = key
  form.name = key.name
  form.permissions = [...key.permissions]
  form.readRateLimit = key.readRateLimit
  form.readWindowSec = key.readWindowSec
  form.writeRateLimit = key.writeRateLimit ?? 1000
  form.writeWindowSec = key.writeWindowSec ?? 3600
  form.tier = key.tier
  showDialog.value = true
}

const getRowActions = (key: any) => [
  {
    label: String($t('dropdown_edit')),
    leading: 'i-ph-pencil',
    onclick: () => editKey(key),
  },
  {},
  {
    label: key.isActive ? String($t('dropdown_deactivate')) : String($t('dropdown_activate')),
    leading: key.isActive ? 'i-ph-pause' : 'i-ph-play',
    onclick: async () => {
      await $fetch(`/api/admin/api-keys/${key.id}`, { method: 'PUT', body: { isActive: !key.isActive } })
      loadKeys()
    },
  },
  {},
  {
    label: String($t('dropdown_delete')),
    leading: 'i-ph-trash',
    onclick: () => {
      deletingKey.value = key
      showDeleteDialog.value = true
    },
  },
]

const closeDialog = () => {
  showDialog.value = false
  resetForm()
}

const save = async () => {
  if (!form.name.trim()) return
  saving.value = true
  try {
    if (editingKey.value) {
      await $fetch(`/api/admin/api-keys/${editingKey.value.id}`, {
        method: 'PUT',
        body: {
          name: form.name.trim(),
          tier: form.tier,
          permissions: form.permissions,
          readRateLimit: form.readRateLimit,
          readWindowSec: form.readWindowSec,
          writeRateLimit: form.writeRateLimit,
          writeWindowSec: form.writeWindowSec,
        },
      })
    } else {
      const res = await $fetch('/api/admin/api-keys', {
        method: 'POST',
        body: {
          name: form.name.trim(),
          tier: form.tier,
          permissions: form.permissions,
          readRateLimit: form.readRateLimit,
          readWindowSec: form.readWindowSec,
          writeRateLimit: form.writeRateLimit,
          writeWindowSec: form.writeWindowSec,
        },
      })
      createdKey.value = (res as any).data?.plainKey || ''
    }
    loadKeys()
  } catch (e) {
    showErrorToast(e, String($t('error_save')))
  } finally {
    saving.value = false
  }
}

const confirmDelete = async () => {
  if (!deletingKey.value) return
  deleting.value = true
  try {
    await $fetch(`/api/admin/api-keys/${deletingKey.value.id}`, { method: 'DELETE' })
    showDeleteDialog.value = false
    deletingKey.value = null
    if (keys.value.length <= 1 && currentPage.value > 1) currentPage.value -= 1
    loadKeys()
  } catch (e) {
    showErrorToast(e, String($t('error_delete')))
  } finally {
    deleting.value = false
  }
}

const loadKeys = async () => {
  try {
    loading.value = true
    const res: any = await $fetch('/api/admin/api-keys', {
      query: {
        page: currentPage.value,
        limit: pageSize.value,
        search: searchQuery.value || undefined,
      },
    })
    keys.value = res.data?.apiKeys || []
    total.value = res.pagination?.total || 0
  } catch (e) {
    console.error('Failed to load API keys', e)
    showErrorToast(e, String($t('error_load')))
  } finally {
    loading.value = false
  }
}

const onPageJump = (page: number) => {
  currentPage.value = page
}

let footerObserver: ResizeObserver | null = null

const updateFooterPosition = () => {
  const mainEl = document.querySelector('main')
  if (!mainEl) {
    footerLeftOffset.value = 0
    footerWidth.value = '100%'
    return
  }
  const rect = mainEl.getBoundingClientRect()
  footerLeftOffset.value = rect.left
  footerWidth.value = `${rect.width}px`
}

onMounted(() => {
  updateFooterPosition()
  footerObserver = new ResizeObserver(updateFooterPosition)
  const mainEl = document.querySelector('main')
  if (mainEl) footerObserver.observe(mainEl)
  window.addEventListener('resize', updateFooterPosition)
})

onUnmounted(() => {
  if (footerObserver) footerObserver.disconnect()
  window.removeEventListener('resize', updateFooterPosition)
})

watchDebounced([currentPage, searchQuery], () => { loadKeys() }, { debounce: 300 })
onMounted(() => { loadKeys() })
</script>
