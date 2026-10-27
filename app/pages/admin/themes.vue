<template>
  <div>
    <!-- Editorial Header -->
    <div data-admin-page-header class="pb-6 mb-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">{{ $t('title') }}</h1>
        </div>
        <div class="hidden md:flex items-center gap-3">
          <AdminSearchToggle v-model="searchQuery" :placeholder="$t('search_placeholder') as string" :close-label="$t('common.close') as string" />
          <NCombobox
            v-model="selectedSort"
            :items="nonPrioritySortOptions"
            by="value"
            :_combobox-list="{
              class: 'min-w-[180px]',
            }"
            :_combobox-trigger="{
              btn: 'outline-gray',
              size: 'sm',
              trailing: 'i-lucide-chevron-down',
              class: 'gap-1 px-2 text-sm leading-normal font-normal w-fit min-w-0 rounded-md border-[#d2cfc6] bg-[#f0efe9] dark:border-white/15 dark:bg-white/[0.06]',
            }"
          >
            <template #trigger="{ modelValue }">
              <span class="text-xs font-medium leading-none">{{ modelValue?.value?.startsWith('priority_') ? $t('sort_other') : modelValue?.label }}</span>
            </template>
          </NCombobox>
          <NButton btn="solid-black" size="sm" trailing="i-lucide-grid-2x2-plus" class="gap-2 rounded-lg" @click="openCreate">
            {{ $t('new_theme') }}
          </NButton>
        </div>
      </div>
      <div class="md:hidden mt-4 space-y-3">
        <input v-model="searchQuery" type="text" :placeholder="$t('search_placeholder') as string" class="w-full font-sans text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500" />
        <div class="flex items-center justify-between gap-3">
          <NCombobox
            v-model="selectedSort"
            :items="nonPrioritySortOptions"
            by="value"
            :_combobox-list="{ class: 'min-w-[180px]' }"
            :_combobox-trigger="{ btn: 'outline-gray', size: 'sm', trailing: 'i-lucide-chevron-down', class: 'gap-1 px-2 text-sm leading-normal font-normal w-fit min-w-0 rounded-md border-[#d2cfc6] bg-[#f0efe9] dark:border-white/15 dark:bg-white/[0.06]' }"
          >
            <template #trigger="{ modelValue }"><span class="text-xs font-medium leading-none">{{ modelValue?.value?.startsWith('priority_') ? $t('sort_other') : modelValue?.label }}</span></template>
          </NCombobox>
          <NButton btn="solid-black" size="sm" trailing="i-lucide-grid-2x2-plus" class="gap-2 rounded-lg" @click="openCreate">
            {{ $t('new_theme') }}
          </NButton>
        </div>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="loading && themes.length === 0" class="space-y-5">
      <div v-for="i in 5" :key="i" class="animate-pulse pb-5 border-b border-gray-100 dark:border-gray-800">
        <div class="h-4 bg-gray-100 dark:bg-gray-900 rounded w-3/4 mb-2" /><div class="h-3 bg-gray-100 dark:bg-gray-900 rounded w-1/4" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="themes.length === 0 && !loading" class="py-12 md:py-16 px-6 text-center border border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30">
      <NIcon name="i-ph-palette" class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
      <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">{{ searchQuery ? $t('empty_search_title') : $t('empty_title') }}</p>
      <p class="font-sans text-sm text-gray-500 dark:text-gray-400">{{ searchQuery ? $t('empty_search_desc') : $t('empty_desc') }}</p>
    </div>

    <!-- Table -->
    <div v-else>
      <div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-x-auto">
        <table class="w-full min-w-[720px]">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0C0A09]">
              <th class="w-10 px-3 py-3 text-left"><NCheckbox checkbox="gray" :model-value="themes.length > 0 && themes.every(t => !!rowSelection[t.id])" @update:model-value="selectAllOnPage" /></th>
              <th class="px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_name') }}</th>
              <th class="w-28 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_status') }}</th>
              <th class="w-32 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_schedule') }}</th>
              <th class="w-24 px-3 py-3 text-center font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <div class="inline-flex items-center justify-center gap-1">
                  <span>{{ $t('col_filters') }}</span>
                  <AdminSortButton
                    :direction="sortDirectionFor('filters_asc', 'filters_desc')"
                    :ascending-label="$t('sort_fewest_filters') as string"
                    :descending-label="$t('sort_most_filters') as string"
                    @toggle="toggleSort('filters_asc', 'filters_desc')"
                  />
                </div>
              </th>
              <th class="w-20 px-3 py-3 text-center font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <div class="inline-flex items-center justify-center gap-1">
                  <span>{{ $t('col_priority') }}</span>
                  <button
                    type="button"
                    class="rounded p-0.5 text-gray-500 transition-colors hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 dark:text-gray-400 dark:hover:text-gray-100"
                    :aria-label="(selectedSort.value !== 'priority_desc' ? $t('sort_priority_high') : $t('sort_priority_low')) as string"
                    @click.stop="togglePrioritySort"
                  >
                    <NIcon :name="selectedSort.value === 'priority_asc' ? 'i-ph-sort-ascending' : selectedSort.value === 'priority_desc' ? 'i-ph-sort-descending' : 'i-ph-arrows-down-up'" class="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </th>
              <th class="w-10 px-3 py-3 text-left">
                <NDropdownMenu :items="headerActions" :modal="false">
                  <button @click.stop class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><NIcon name="i-ph-caret-down" class="w-4 h-4" /></button>
                </NDropdownMenu>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <ContextMenu
              v-for="(theme, idx) in themes"
              :key="theme.id"
              as-child
              ignore-interactive-targets
              size="xs"
              native-on-modifier="ctrl"
              :items="getThemeActions(theme)"
            >
            <tr :data-highlighted="idx === highlightedRowIndex ? 'true' : undefined" :class="['animate-fade-in-up transition-colors group', { 'bg-[#FAFAF9] dark:bg-[#1C1B1A]': idx === highlightedRowIndex }, { 'bg-gray-100 dark:bg-gray-800/70': !!rowSelection[theme.id] }]" :style="{ animationDelay: `${idx * 0.03}s` }">
              <td class="px-3 py-3">
                <div :class="[Object.keys(rowSelection).length > 0 ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity']">
                  <NCheckbox checkbox="gray" :model-value="!!rowSelection[theme.id]" @click="rowSelection[theme.id] = !rowSelection[theme.id]" />
                </div>
              </td>
              <td class="px-3 py-3">
                <div class="min-w-0">
                  <div class="font-sans text-sm text-gray-900 dark:text-gray-100 truncate cursor-pointer" @click="openEdit(theme)">{{ theme.name }}</div>
                  <a
                    :href="`/?theme=${theme.slug}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="font-sans text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 focus-visible:underline focus-visible:underline-offset-2 no-underline transition-colors"
                  >{{ theme.slug }}</a>
                </div>
              </td>
              <td class="px-3 py-3">
                <div class="flex items-center gap-1.5">
                  <NDropdownMenu v-if="theme.isActive" :items="getStatusActions(theme, 'active')" :modal="false">
                    <span class="font-sans text-xs px-1.5 py-0.5 rounded text-[#2373F4] dark:text-[#75A7FF] bg-[#2373F4]/10 dark:bg-[#2373F4]/15 cursor-pointer">{{ $t('status_active') }}</span>
                  </NDropdownMenu>
                  <NDropdownMenu v-else-if="theme.isDefault" :items="getStatusActions(theme, 'default')" :modal="false">
                    <span class="font-sans text-xs px-1.5 py-0.5 rounded text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 cursor-pointer">{{ $t('status_default') }}</span>
                  </NDropdownMenu>
                  <NDropdownMenu v-else-if="theme.scheduledDate" :items="getStatusActions(theme, 'scheduled')" :modal="false">
                    <span class="font-sans text-xs px-1.5 py-0.5 rounded text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 cursor-pointer">{{ $t('status_scheduled') }}</span>
                  </NDropdownMenu>
                  <NDropdownMenu v-else :items="getStatusActions(theme, 'inactive')" :modal="false">
                    <span class="font-sans text-xs px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 cursor-pointer">{{ $t('status_inactive') }}</span>
                  </NDropdownMenu>
                </div>
              </td>
              <td class="px-3 py-3 font-sans text-xs text-gray-500 dark:text-gray-400">{{ theme.scheduledDate || (theme.scheduledStart ? formatDate(theme.scheduledStart) : '—') }}</td>
              <td class="px-3 py-3 font-sans text-sm text-gray-900 dark:text-gray-100 text-center">
                <div class="flex items-center justify-center gap-1">
                  <span>{{ theme.filters_count || 0 }}</span>
                  <span v-if="theme.pending_suggestions_count > 0" class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-2xs font-600" :title="`${theme.pending_suggestions_count} pending suggestion(s)`">{{ theme.pending_suggestions_count }}</span>
                </div>
              </td>
              <td class="px-3 py-3 font-sans text-sm text-gray-900 dark:text-gray-100 text-center">
                <template v-if="editingPriority === theme.id">
                  <NInput v-model="priorityEditValue" type="number" :min="0" size="xs" class="w-16 text-center priority-input" autofocus @blur="savePriority(theme)" @keydown.enter="savePriority(theme)" @keydown.escape="editingPriority = null" />
                </template>
                <span v-else class="cursor-pointer hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors" @click="startEditPriority(theme)">{{ theme.priority }}</span>
              </td>
              <td class="px-3 py-3">
                <NDropdownMenu :items="getThemeActions(theme)" :modal="false">
                  <button @click.stop class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><NIcon name="i-ph-dots-three-vertical" class="w-4 h-4" /></button>
                </NDropdownMenu>
              </td>
            </tr>
            </ContextMenu>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1 || selectedIds.length > 0" class="h-20" />
    </div>

    <div
      v-if="totalPages > 1 || selectedIds.length > 0"
      class="fixed bottom-0 z-20 bg-[#FAFAF9] dark:bg-[#0C0A09] border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between shadow-sm transition-all duration-300 ease-in-out"
      :style="{ left: footerLeftOffset + 'px', width: footerWidth }"
    >
      <span class="font-sans text-xs text-gray-500 dark:text-gray-400">
        Page
        <button
          class="font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 underline underline-offset-2 decoration-dotted decoration-gray-300 dark:decoration-gray-600"
          @click="showPageJumpDialog = true"
        >
          {{ currentPage }}
        </button>
        of {{ totalPages }} &middot; {{ totalThemes }} {{ totalThemes === 1 ? 'theme' : 'themes' }}
      </span>
      <DashboardBulkSelectionControls
        :selection-mode="selectedIds.length > 0"
        :selected-count="selectedIds.length"
        :visible-count="themes.length"
        :actions="bulkSelectionActions"
        @toggle-visible="selectAllOnPage"
        @clear="clearSelection"
        @exit-mode="clearSelection"
        @action="onBulkSelectionAction"
      />
      <div class="flex items-center gap-3">
        <OutlinedButton v-if="currentPage > 1" @click="currentPage = Math.max(1, currentPage - 1)">&larr; Previous</OutlinedButton>
        <button
          class="font-sans text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg px-3 py-2 transition-colors"
          @click="showPageJumpDialog = true"
        >
          {{ currentPage }} / {{ totalPages }}
        </button>
        <OutlinedButton v-if="currentPage < totalPages" @click="currentPage = Math.min(totalPages, currentPage + 1)">Next &rarr;</OutlinedButton>
      </div>
    </div>

    <AppDialog
      v-model="showEditDialog"
      :title="(editMode ? $t('dialog_edit_title') : $t('dialog_create_title')) as string"
      title-class="sr-only"
      hide-header-border
      compact-header
      max-width="xl"
      scrollable
      :dialog-content-style="{ width: 'calc(100vw - 2rem)', maxWidth: '42rem' }"
      :una="{ dialogContent: 'top-[calc(50%+1.25rem)] max-h-[calc(100dvh_-_5rem)] box-border max-w-[calc(100vw_-_2rem)] overflow-x-hidden px-3 sm:px-4 [&_*:focus-visible]:ring-stone-600 dark:[&_*:focus-visible]:ring-stone-400', dialogOverlay: 'z-[39] bg-black/45' }"
    >
      <template #header-title>
        <div role="tablist" :aria-label="$t('dialog_sections') as string" class="grid min-w-0 flex-1 grid-cols-4 gap-2 sm:gap-3">
          <button
            v-for="(tab, index) in tabs"
            :key="tab.value"
            :id="`theme-tab-${tab.value}`"
            type="button"
            role="tab"
            :aria-label="tab.name as string"
            :aria-selected="activeTab === tab.value"
            :aria-controls="`theme-panel-${tab.value}`"
            :tabindex="activeTab === tab.value ? 0 : -1"
            :class="['min-h-10 min-w-0 border-b-2 pb-2 text-left font-sans text-[10px] leading-tight transition-colors focus-visible:outline-none focus-visible:ring-0 focus-visible:bg-stone-200/70 dark:focus-visible:bg-white/10 sm:text-sm', activeTab === tab.value ? 'border-gray-900 font-600 text-gray-900 dark:border-gray-100 dark:text-gray-100' : 'border-gray-200 text-gray-500 hover:text-gray-800 dark:border-neutral-700 dark:text-gray-400 dark:hover:text-gray-200']"
            @click="activeTab = tab.value"
            @keydown="onThemeTabKeydown($event, index)"
          >
            <span class="mr-1.5 text-[9px] tabular-nums opacity-60 sm:text-xs">0{{ index + 1 }}</span>
            <span class="truncate sm:hidden">{{ tab.shortName }}</span>
            <span class="hidden truncate sm:inline">{{ tab.name }}</span>
          </button>
        </div>
      </template>
      <div class="w-full min-w-0 px-0">
        <div
          ref="themePanelRef"
          :id="`theme-panel-${activeTab}`"
          role="tabpanel"
          :aria-label="activeTabName"
          tabindex="0"
          class="mt-0 min-h-[24vh] px-2 pr-1 pt-1 focus-visible:outline-none"
        >
              <!-- General -->
              <div v-if="activeTab === 'general'" class="space-y-5">
                <div class="grid grid-cols-1 gap-4">
                  <div>
                    <NInput
                      v-model="form.name"
                      :placeholder="$t('dialog_name_placeholder') as string"
                      :disabled="submitting"
                      class="pl-22"
                      required>
                      <template #leading>
                        <span class="block bg-gray-100 dark:bg-gray-800 py-1 px-2 rounded-1 text-sm font-medium text-gray-900 dark:text-white">{{ $t('dialog_name_label') }}</span>
                      </template>
                    </NInput>
                  </div>
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,12rem)] sm:items-center">
                    <NInput
                      v-model="form.slug"
                      :placeholder="$t('dialog_slug_placeholder') as string"
                      :disabled="submitting"
                      class="min-w-0 pl-22"
                      required>
                      <template #leading>
                        <span class="block bg-gray-100 dark:bg-gray-800 py-1 px-2 rounded-1 text-sm font-medium text-gray-900 dark:text-white">{{ $t('dialog_slug_label') }}</span>
                      </template>
                    </NInput>

                    <div class="grid min-w-0 w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
                      <label class="block bg-gray-100 dark:bg-gray-800 p-2 rounded-1 text-sm font-medium text-gray-900 dark:text-white">{{ $t('dialog_priority') }}</label>
                      <NNumberField v-model="form.priority" :min="0" :disabled="submitting" class="min-w-0 w-full" />
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">{{ $t('dialog_desc_label') }}</label>
                  <NInput type="textarea" v-model="form.description" :rows="2" :placeholder="$t('dialog_desc_placeholder') as string" :disabled="submitting" />
                </div>

                <div class="flex flex-wrap items-center gap-3">
                  <div class="flex items-center gap-2">
                    <label class="block text-sm font-medium text-gray-900 dark:text-white">{{ $t('dialog_lang_label') }}</label>
                    <NTooltip :content="$t('dialog_lang_hint')?.toString()">
                      <NIcon name="i-ph-info" />
                    </NTooltip>
                    <NCombobox
                      :model-value="languageOptions.find(o => o.value === form.language) || null"
                      @update:model-value="(v: { value: string; label: string; flag: string } | null) => { form.language = v?.value || '' }"
                      :items="languageOptions"
                      by="value"
                      :_combobox-input="{
                        placeholder: $t('dialog_lang_all') as string,
                        class: 'text-sm',
                      }"
                      :_combobox-list="{
                        class: 'min-w-[160px]',
                      }"
                      :_combobox-trigger="{
                        btn: 'ghost-gray',
                        size: 'sm',
                        trailing: '',
                        class: 'gap-1 px-1.5 text-sm font-normal w-fit min-w-0',
                      }"
                    >
                      <template #trigger="{ modelValue }">
                        <div class="flex items-center gap-1.5">
                          <img
                            v-if="modelValue"
                            :src="modelValue.flag"
                            alt=""
                            class="w-5 h-5 object-cover rounded-[2px] shrink-0"
                          />
                          <span v-if="modelValue" class="text-xs font-medium leading-none">{{ modelValue.value === 'en' ? 'EN' : 'FRA' }}</span>
                          <span v-else class="text-xs font-medium leading-none text-gray-400">{{ $t('dialog_lang_all') }}</span>
                        </div>
                      </template>
                      <template #label="{ item }">
                        <div class="flex items-center gap-2">
                          <img :src="item.flag" alt="" class="w-5 h-5 object-cover rounded-[2px] shrink-0" />
                          <span>{{ item.label }}</span>
                        </div>
                      </template>
                    </NCombobox>
                  </div>

                  <NSeparator orientation="vertical" class="mx-2 hidden h-7 sm:block" />

                  <div class="flex items-center gap-2">
                    <NTooltip :content="(form.is_active ? $t('dialog_deactivate') : $t('dialog_activate')) as string">
                      <NToggle
                        :leading="form.is_active ? 'i-tabler-circuit-switch-closed' : 'i-tabler-circuit-switch-open'"
                        :icon="false"
                        :square="false"
                        :label="form.is_active ? $t('dialog_active')?.toLocaleString() : $t('dialog_inactive') as string"
                        :class="[{ 'bg-gray-100 dark:bg-gray-900': form.is_active }]"
                        class="active:scale-98 hover:bg-gray-100 dark:hover:bg-gray-800 transition-[colors,transform]"
                        v-model="form.is_active"
                      />
                    </NTooltip>

                    <NSeparator orientation="vertical" class="mx-2 hidden h-7 sm:block" />

                    <NTooltip :content="form.is_default ? $t('dialog_unset_default')?.toString() : $t('dialog_set_default')?.toString()">
                      <NToggle
                        :leading="form.is_default ? 'i-tabler-git-branch' : 'i-tabler-git-branch-deleted'"
                        :icon="false"
                        :square="false"
                        :label="$t('dialog_default_fallback')?.toLocaleString()"
                        :class="[{ 'bg-gray-100 dark:bg-gray-900': form.is_default }]"
                        class="active:scale-98 hover:bg-gray-100 dark:hover:bg-gray-800 transition-[colors,transform]"
                        v-model="form.is_default"
                      />
                    </NTooltip>
                  </div>
                </div>

                <NCollapsible v-model:open="showTranslations" class="rounded-2 bg-gray-50 dark:bg-gray-900">
                  <NCollapsibleTrigger as-child>
                    <button class="flex items-center justify-between w-full px-4 py-3 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                      <div class="flex items-center gap-3">
                        <span>{{ $t('dialog_i18n_title') }}</span>

                        <NTooltip :content="$t('dialog_add_translation')?.toString()">
                          <NIcon name="i-ph-plus" class="w-3.5 h-3.5 hover:scale-110 active:scale-99 transition-[transform]" @click.stop="addTranslation" />
                        </NTooltip>
                      </div>
                      <NIcon name="i-ph-caret-down" class="w-3.5 h-3.5 shadow-none transition-[transform]" :class="showTranslations ? 'rotate-180' : ''" />
                    </button>
                  </NCollapsibleTrigger>
                  <NCollapsibleContent>
                    <div class="px-4 pb-4 space-y-4">
                      <div v-for="(t, idx) in translations" :key="t._key" class="grid w-full min-w-0 grid-cols-[6rem_minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-2 p-1">
                        <NSelect v-model="t.language" :items="['en', 'fr']" size="xs" class="w-full" :disabled="submitting" />
                        <NInput v-model="t.name" :placeholder="$t('dialog_i18n_name_placeholder')?.toString()" size="sm" :disabled="submitting" />
                        <NInput v-model="t.description" :placeholder="$t('dialog_i18n_desc_placeholder')?.toString()" size="sm" :disabled="submitting" />

                        <NTooltip :content="$t('dialog_i18n_remove_translation')?.toString()">
                          <NButton btn="soft-gray" class="h-8 w-8" @click="removeTranslation(idx)"><NIcon name="i-ph-x" class="w-4 h-4" /></NButton>
                        </NTooltip>
                        <div class="col-span-full min-w-0">
                          <NInput v-model="t.home_copy_json" class="w-full min-w-0" type="textarea" :rows="2" placeholder="Homepage editorial copy (JSON)" size="sm" :disabled="submitting" />
                        </div>
                      </div>
                      <p v-if="translations.length === 0" class="animate-fade-in text-sm text-gray-500 dark:text-gray-400">{{ $t('dialog_i18n_empty') }}</p>
                    </div>
                  </NCollapsibleContent>
                </NCollapsible>
              </div>

              <!-- Appearance -->
              <div v-if="activeTab === 'appearance'" class="space-y-6">
                <div class="py-3">
                  <h4 class="py-2 text-md font-400 text-gray-900 dark:text-white">{{ $t('dialog_theme_image') }}</h4>
                  <div class="space-y-4">
                    <div class="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-neutral-900">
                      <input ref="desktopImageInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" class="hidden" :disabled="submitting || !!uploadingThemeImage" @change="onThemeImageSelected($event, 'desktop')">
                      <template v-if="form.image_url">
                        <NTooltip :content="$t('dialog_image_replace')?.toString()">
                          <button
                            type="button"
                            class="group relative block h-36 w-full overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                            :aria-label="$t('dialog_image_replace')?.toString()"
                            :disabled="submitting || !!uploadingThemeImage"
                            @click="desktopImageInput?.click()"
                          >
                            <img v-if="!desktopImagePreviewFailed" :src="form.image_url" :alt="form.image_alt || ''" class="h-full w-full object-cover transition-[filter] group-hover:brightness-90" @error="desktopImagePreviewFailed = true" />
                            <div v-else class="flex h-full items-center justify-center gap-2 px-4 text-sm text-gray-500 dark:text-gray-400">
                              <NIcon name="i-ph-image-broken" class="h-5 w-5 shrink-0" />
                              <span>{{ $t('dialog_image_preview_unavailable') }}</span>
                            </div>
                            <span class="absolute left-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm dark:bg-neutral-900/90 dark:text-white">
                              <NIcon :name="uploadingThemeImage === 'desktop' ? 'i-ph-circle-notch' : 'i-ph-upload-simple'" class="h-4 w-4" :class="uploadingThemeImage === 'desktop' ? 'animate-spin' : ''" />
                            </span>
                          </button>
                        </NTooltip>
                        <NTooltip :content="$t('dialog_image_remove')?.toString()">
                          <NButton btn="soft-gray" class="absolute right-2 top-2 z-10 h-9 w-9 rounded-full shadow-sm" :aria-label="$t('dialog_image_remove')?.toString()" :disabled="submitting || !!uploadingThemeImage" @click.stop="clearThemeImage('desktop')">
                            <NIcon name="i-ph-x" class="h-4 w-4" />
                          </NButton>
                        </NTooltip>
                      </template>
                      <button
                        v-else
                        type="button"
                        class="flex h-36 w-full flex-col items-center justify-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:text-gray-300 dark:hover:bg-neutral-800"
                        :aria-label="$t('dialog_image_upload')?.toString()"
                        :disabled="submitting || !!uploadingThemeImage"
                        @click="desktopImageInput?.click()"
                      >
                        <NIcon :name="uploadingThemeImage === 'desktop' ? 'i-ph-circle-notch' : 'i-ph-upload-simple'" class="h-5 w-5" :class="uploadingThemeImage === 'desktop' ? 'animate-spin' : ''" />
                        <span>{{ uploadingThemeImage === 'desktop' ? $t('dialog_image_uploading') : $t('dialog_image_upload') }}</span>
                      </button>
                    </div>
                    <div>
                      <label class="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{{ $t('dialog_image_url') }}</label>
                      <div class="min-w-0">
                        <NInput v-model="form.image_url" class="w-full min-w-0" :placeholder="$t('dialog_image_placeholder') as string" :disabled="submitting" />
                      </div>
                      <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">{{ $t('dialog_image_upload_limit') }}</p>
                    </div>
                    <div>
                      <label class="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{{ $t('dialog_image_alt') }}</label>
                      <NInput v-model="form.image_alt" :placeholder="$t('dialog_image_alt_placeholder') as string" :disabled="submitting" />
                    </div>
                    <NCollapsible v-model:open="showDesktopAttribution" class="border-t border-gray-200/80 pt-3 dark:border-neutral-700/80">
                      <NCollapsibleTrigger as-child>
                        <button class="flex w-full items-center justify-between gap-3 text-left text-sm font-medium text-gray-700 transition-colors hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:text-gray-300 dark:hover:text-white">
                          <span>{{ $t('dialog_image_attribution_details') }}</span>
                          <NIcon name="i-ph-caret-down" class="h-4 w-4 shrink-0 transition-transform" :class="showDesktopAttribution ? 'rotate-180' : ''" />
                        </button>
                      </NCollapsibleTrigger>
                      <NCollapsibleContent>
                        <div class="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
                          <div>
                            <label class="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{{ $t('dialog_image_credit') }}</label>
                            <NInput v-model="form.image_credit" :placeholder="$t('dialog_image_credit_placeholder') as string" :disabled="submitting" />
                          </div>
                          <div>
                            <label class="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{{ $t('dialog_image_license') }}</label>
                            <NInput v-model="form.image_license" :placeholder="$t('dialog_image_license_placeholder') as string" :disabled="submitting" />
                          </div>
                          <div class="sm:col-span-2">
                            <label class="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{{ $t('dialog_image_source_url') }}</label>
                            <NInput v-model="form.image_source_url" :placeholder="$t('dialog_image_source_url_placeholder') as string" :disabled="submitting" />
                          </div>
                          <div>
                            <label class="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{{ $t('dialog_image_date') }}</label>
                            <NInput v-model="form.image_date" :placeholder="$t('dialog_image_date_placeholder') as string" :disabled="submitting" />
                          </div>
                          <div>
                            <label class="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{{ $t('dialog_image_location') }}</label>
                            <NInput v-model="form.image_location" :placeholder="$t('dialog_image_location_placeholder') as string" :disabled="submitting" />
                          </div>
                        </div>
                      </NCollapsibleContent>
                    </NCollapsible>
                    <NCollapsible v-model:open="showMobileImage">
                      <div class="border-t border-gray-200 pt-4 dark:border-gray-700">
                        <NCollapsibleTrigger as-child>
                          <button class="flex w-full items-center justify-between gap-3 text-left text-sm font-medium text-gray-700 transition-colors hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:text-gray-300 dark:hover:text-white">
                            <span class="flex items-center gap-2">
                              <NIcon name="i-ph-caret-down" class="h-4 w-4 shrink-0 transition-transform" :class="showMobileImage ? 'rotate-180' : ''" />
                              <span>{{ $t(showMobileImage || hasMobileImageSettings ? 'dialog_mobile_theme_image' : 'dialog_mobile_image_add') }}</span>
                            </span>
                          </button>
                        </NCollapsibleTrigger>
                        <p class="mt-1 pl-6 text-xs text-gray-500 dark:text-gray-400">{{ $t('dialog_mobile_image_optional_help') }}</p>
                        <NCollapsibleContent>
                          <div class="space-y-4 pt-4">
                        <div class="relative w-32 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-neutral-900">
                          <input ref="mobileImageInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" class="hidden" :disabled="submitting || !!uploadingThemeImage" @change="onThemeImageSelected($event, 'mobile')">
                          <template v-if="form.mobile_image_url">
                            <NTooltip :content="$t('dialog_image_replace')?.toString()">
                              <button
                                type="button"
                                class="group relative block h-56 w-full overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                                :aria-label="$t('dialog_image_replace')?.toString()"
                                :disabled="submitting || !!uploadingThemeImage"
                                @click="mobileImageInput?.click()"
                              >
                                <img v-if="!mobileImagePreviewFailed" :src="form.mobile_image_url" :alt="form.mobile_image_alt || ''" class="h-full w-full object-cover transition-[filter] group-hover:brightness-90" @error="mobileImagePreviewFailed = true" />
                                <div v-else class="flex h-full flex-col items-center justify-center gap-2 px-3 text-center text-xs text-gray-500 dark:text-gray-400">
                                  <NIcon name="i-ph-image-broken" class="h-5 w-5 shrink-0" />
                                  <span>{{ $t('dialog_image_preview_unavailable') }}</span>
                                </div>
                                <span class="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm dark:bg-neutral-900/90 dark:text-white">
                                  <NIcon :name="uploadingThemeImage === 'mobile' ? 'i-ph-circle-notch' : 'i-ph-upload-simple'" class="h-4 w-4" :class="uploadingThemeImage === 'mobile' ? 'animate-spin' : ''" />
                                </span>
                              </button>
                            </NTooltip>
                            <NTooltip :content="$t('dialog_image_remove')?.toString()">
                              <NButton btn="soft-gray" class="absolute right-2 top-2 z-10 h-8 w-8 rounded-full shadow-sm" :aria-label="$t('dialog_image_remove')?.toString()" :disabled="submitting || !!uploadingThemeImage" @click.stop="clearThemeImage('mobile')">
                                <NIcon name="i-ph-x" class="h-4 w-4" />
                              </NButton>
                            </NTooltip>
                          </template>
                          <button
                            v-else
                            type="button"
                            class="flex h-56 w-full flex-col items-center justify-center gap-2 px-2 text-center text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:text-gray-300 dark:hover:bg-neutral-800"
                            :aria-label="$t('dialog_image_upload')?.toString()"
                            :disabled="submitting || !!uploadingThemeImage"
                            @click="mobileImageInput?.click()"
                          >
                            <NIcon :name="uploadingThemeImage === 'mobile' ? 'i-ph-circle-notch' : 'i-ph-upload-simple'" class="h-5 w-5" :class="uploadingThemeImage === 'mobile' ? 'animate-spin' : ''" />
                            <span>{{ uploadingThemeImage === 'mobile' ? $t('dialog_image_uploading') : $t('dialog_image_upload') }}</span>
                          </button>
                        </div>
                        <div>
                          <label class="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{{ $t('dialog_image_url') }}</label>
                          <div class="min-w-0">
                            <NInput v-model="form.mobile_image_url" class="w-full min-w-0" :placeholder="$t('dialog_mobile_image_url_placeholder') as string" :disabled="submitting" />
                          </div>
                          <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">{{ $t('dialog_image_upload_limit') }}</p>
                        </div>
                        <div>
                          <label class="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{{ $t('dialog_image_alt') }}</label>
                          <NInput v-model="form.mobile_image_alt" :placeholder="$t('dialog_image_alt_placeholder') as string" :disabled="submitting" />
                        </div>
                        <NCollapsible v-model:open="showMobileAttribution" class="border-t border-gray-200/80 pt-3 dark:border-neutral-700/80">
                          <NCollapsibleTrigger as-child>
                            <button class="flex w-full items-center justify-between gap-3 text-left text-sm font-medium text-gray-700 transition-colors hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:text-gray-300 dark:hover:text-white">
                              <span>{{ $t('dialog_image_attribution_details') }}</span>
                              <NIcon name="i-ph-caret-down" class="h-4 w-4 shrink-0 transition-transform" :class="showMobileAttribution ? 'rotate-180' : ''" />
                            </button>
                          </NCollapsibleTrigger>
                          <NCollapsibleContent>
                            <div class="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
                              <div>
                                <label class="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{{ $t('dialog_image_credit') }}</label>
                                <NInput v-model="form.mobile_image_credit" :placeholder="$t('dialog_image_credit_placeholder') as string" :disabled="submitting" />
                              </div>
                              <div>
                                <label class="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{{ $t('dialog_image_license') }}</label>
                                <NInput v-model="form.mobile_image_license" :placeholder="$t('dialog_image_license_placeholder') as string" :disabled="submitting" />
                              </div>
                              <div class="sm:col-span-2">
                                <label class="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{{ $t('dialog_image_source_url') }}</label>
                                <NInput v-model="form.mobile_image_source_url" :placeholder="$t('dialog_image_source_url_placeholder') as string" :disabled="submitting" />
                              </div>
                              <div>
                                <label class="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{{ $t('dialog_image_date') }}</label>
                                <NInput v-model="form.mobile_image_date" :placeholder="$t('dialog_image_date_placeholder') as string" :disabled="submitting" />
                              </div>
                              <div>
                                <label class="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{{ $t('dialog_image_location') }}</label>
                                <NInput v-model="form.mobile_image_location" :placeholder="$t('dialog_image_location_placeholder') as string" :disabled="submitting" />
                              </div>
                            </div>
                          </NCollapsibleContent>
                        </NCollapsible>
                          </div>
                        </NCollapsibleContent>
                      </div>
                    </NCollapsible>
                  </div>
                </div>
                <div class="py-5">
                  <h4 class="mb-5 text-center font-serif text-xl text-gray-900 dark:text-white">{{ $t('dialog_colors') }}</h4>
                  <div class="grid grid-cols-2 justify-items-center gap-4 sm:gap-8">
                    <div class="flex min-w-0 flex-col items-center text-center">
                      <div class="mb-3 flex justify-center">
                        <BlossomColorPicker
                          :value="primaryPickerValue"
                          @change="onPrimaryChange"
                          :show-alpha-slider="false"
                          :core-size="28"
                          :petal-size="28"
                        />
                      </div>
                      <label class="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{{ $t('dialog_primary') }}</label>
                      <NInput :model-value="form.color_primary" @update:model-value="onPrimaryHexInput" size="sm" class="mb-2 w-28 max-w-full font-mono text-center" />
                    </div>
                    <div class="flex min-w-0 flex-col items-center text-center">
                      <div class="mb-3 flex justify-center">
                        <BlossomColorPicker
                          :value="secondaryPickerValue"
                          @change="onSecondaryChange"
                          :show-alpha-slider="false"
                          :core-size="28"
                          :petal-size="28"
                        />
                      </div>
                      <label class="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{{ $t('dialog_secondary') }}</label>
                      <NInput :model-value="form.color_secondary" @update:model-value="onSecondaryHexInput" size="sm" class="mb-2 w-28 max-w-full font-mono text-center" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Featured -->
              <div v-if="activeTab === 'curation'" class="space-y-8">
                <div class="space-y-3">
                  <h4 class="font-serif text-xl text-gray-900 dark:text-gray-100">{{ $t('dialog_featured_quote') }}</h4>
                  <div class="relative">
                    <NInput
                      v-model="featuredQuoteQuery"
                      :placeholder="$t('dialog_featured_quote_placeholder') as string"
                      :loading="featuredQuoteLoading"
                      @input="onFeaturedQuoteSearch"
                      @focus="onFeaturedQuoteSearch"
                      @keydown="onFeaturedQuoteKeydown($event)"
                      @blur="hideFeaturedQuoteSuggestions"
                    />
                    <div
                      v-if="featuredQuoteActive && featuredQuoteResults.length"
                      role="listbox"
                      class="absolute bottom-full left-0 right-0 z-50 mb-1 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-[#FAFAF9] shadow-xl dark:border-neutral-700 dark:bg-[#151515]"
                    >
                      <div
                        v-for="(s, si) in featuredQuoteResults"
                        :key="s.value"
                        role="option"
                        :aria-selected="si === featuredQuoteHighlighted"
                        class="cursor-pointer truncate px-4 py-2.5 text-sm transition-colors"
                        :class="si === featuredQuoteHighlighted ? 'bg-gray-100 text-gray-950 dark:bg-white/10 dark:text-white' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'"
                        @mousedown.prevent="selectFeaturedQuote(s)"
                        @mouseenter="featuredQuoteHighlighted = si"
                      >
                        {{ s.label }}
                      </div>
                    </div>
                  </div>
                  <div v-if="form.featured_quote_id" class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <NIcon name="i-ph-check-circle" class="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
                    <span>{{ $t('dialog_featured_selected') }}</span>
                    <NTooltip v-if="featuredQuoteQuery" :content="featuredQuoteQuery"><span class="cursor-help font-mono text-xs text-gray-500">#{{ form.featured_quote_id }}</span></NTooltip><span v-else class="font-mono text-xs text-gray-500">#{{ form.featured_quote_id }}</span>
                    <NTooltip :content="$t('common.clear')?.toString()"><NButton btn="ghost-gray" size="xs" icon label="i-ph-x" :aria-label="$t('common.clear')?.toString()" class="ml-auto h-8 w-8" @click="clearFeaturedQuote" /></NTooltip>
                  </div>
                </div>

                <div class="space-y-3 border-t border-gray-200/80 pt-6 dark:border-neutral-700/80">
                  <h4 class="font-serif text-xl text-gray-900 dark:text-gray-100">{{ $t('dialog_featured_reference') }}</h4>
                  <div class="relative">
                    <NInput
                      v-model="featuredRefQuery"
                      :placeholder="$t('dialog_featured_reference_placeholder') as string"
                      :loading="featuredRefLoading"
                      @input="onFeaturedRefSearch"
                      @focus="onFeaturedRefSearch"
                      @keydown="onFeaturedRefKeydown($event)"
                      @blur="hideFeaturedRefSuggestions"
                    />
                    <div
                      v-if="featuredRefActive && featuredRefResults.length"
                      role="listbox"
                      class="absolute bottom-full left-0 right-0 z-50 mb-1 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-[#FAFAF9] shadow-xl dark:border-neutral-700 dark:bg-[#151515]"
                    >
                      <div
                        v-for="(s, si) in featuredRefResults"
                        :key="s.value"
                        role="option"
                        :aria-selected="si === featuredRefHighlighted"
                        class="cursor-pointer truncate px-4 py-2.5 text-sm transition-colors"
                        :class="si === featuredRefHighlighted ? 'bg-gray-100 text-gray-950 dark:bg-white/10 dark:text-white' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'"
                        @mousedown.prevent="selectFeaturedRef(s)"
                        @mouseenter="featuredRefHighlighted = si"
                      >
                        {{ s.label }}
                      </div>
                    </div>
                  </div>
                  <div v-if="form.featured_reference_id" class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <NIcon name="i-ph-check-circle" class="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
                    <span>{{ $t('dialog_featured_selected') }}</span>
                    <NTooltip v-if="featuredRefQuery" :content="featuredRefQuery"><span class="cursor-help font-mono text-xs text-gray-500">#{{ form.featured_reference_id }}</span></NTooltip><span v-else class="font-mono text-xs text-gray-500">#{{ form.featured_reference_id }}</span>
                    <NTooltip :content="$t('common.clear')?.toString()"><NButton btn="ghost-gray" size="xs" icon label="i-ph-x" :aria-label="$t('common.clear')?.toString()" class="ml-auto h-8 w-8" @click="clearFeaturedRef" /></NTooltip>
                  </div>
                </div>
              </div>

              <!-- Scheduling -->
              <div v-if="activeTab === 'scheduling'" class="space-y-6 overflow-y-auto max-h-full">
                <div class="flex flex-col gap-4 max-w-xs">
                  <div>
                    <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">{{ $t('dialog_scheduled_start') }}</label>
                    <NInput v-model="form.scheduled_start" type="datetime-local" :disabled="submitting" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">{{ $t('dialog_scheduled_end') }}</label>
                    <NInput v-model="form.scheduled_end" type="datetime-local" :disabled="submitting" />
                  </div>
                </div>
              </div>

              <!-- Filters -->
              <div v-if="activeTab === 'curation'" class="mt-8 border-t border-gray-200/80 pt-6 dark:border-neutral-700/80">
                <div>
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <h4 class="font-serif text-xl text-gray-900 dark:text-gray-100">{{ $t('dialog_filters') }}</h4>
                    <NButton btn="outline-gray" class="min-h-9 gap-2 px-3" @click="addFilter"><NIcon name="i-ph-plus" class="h-4 w-4" />{{ $t('dialog_add_filter') }}</NButton>
                  </div>

                  <div class="space-y-2 mt-4 mb-3">
                    <div v-for="(filter, idx) in filters" :key="filter.id || idx" class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[9rem_minmax(0,1fr)_auto]">
                      <NSelect
                        :model-value="displayFilterType(filter.type)"
                        :items="filterTypeLabels"
                        class="w-full"
                        @update:model-value="(label: string) => setFilterType(idx, label)"
                      />
                      <div class="relative col-span-2 min-w-0 transition-all duration-300 sm:col-span-1 sm:col-start-2" :class="fetchingFilterIndex === idx ? 'ring-2 ring-indigo-400/40 rounded-lg' : ''">
                        <NInput v-model="filter.value" :placeholder="$t('dialog_filter_value') as string" size="sm" class="w-full filter-value-input" :loading="fetchingFilterIndex === idx" @input="onFilterValueInput(idx)" @focus="onFilterValueInput(idx)" @keydown="onFilterKeydown(idx, $event)" @blur="hideFilterSuggestions" />
                        <div v-if="activeFilterIndex === idx && filterSuggestions.length" data-suggestions-dropdown class="absolute bottom-full mb-1 left-0 right-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          <div v-for="(s, si) in filterSuggestions" :key="s.value" class="px-3 py-1.5 text-xs cursor-pointer truncate" :class="si === highlightedIndex ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'"                          :data-highlighted-suggestion="si === highlightedIndex ? '' : undefined" @mousedown.prevent="selectFilterSuggestion(idx, s)" @mouseenter="highlightedIndex = si">
                            {{ s.label }}
                          </div>
                        </div>
                      </div>
                      <button class="col-start-2 row-start-1 flex min-h-9 min-w-9 items-center justify-center rounded-1 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300 sm:col-auto sm:row-auto" :aria-label="$t('common.delete')?.toString()" @click="removeFilter(idx)"><NIcon name="i-ph-x" class="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <template v-if="filterRecommendations.length">
                      <NTooltip v-for="r in filterRecommendations" :key="`${r.type}:${r.value}`" :content="$t('dialog_suggestions_label')?.toString()">
                        <NBadge badge="solid-gray" :key="`${r.type}:${r.value}`" icon="i-tabler-sparkles text-primary"  class="cursor-pointer hover:scale-102 active:scale-99 transition-[colors,transform]" @click="applyFilterRecommendation(r)">
                          {{ r.label }}<span class="ml-1 text-gray-500 dark:text-gray-400"> · {{ displayFilterType(r.type) }}</span>
                        </NBadge>
                      </NTooltip>
                    </template>
                  </div>
                </div>

                <div v-if="editMode && entitySuggestions.length" class="border-t pt-8">
                  <h4 class="text-xl font-200 text-gray-900 dark:text-white mb-3">
                    {{ $t('dialog_entity_suggestions') }}
                    <span class="ml-1.5 text-sm inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-yellow-300 text-2xs font-600">{{ entitySuggestions.length }}</span>
                  </h4>
                  <div class="space-y-1.5">
                    <div v-for="s in entitySuggestions" :key="s.id" class="flex items-center gap-2 px-4 py-1.5 rounded-sm bg-gray-50 dark:bg-gray-900/50">
                      <span class="font-sans text-xs text-gray-900 dark:text-gray-100 min-w-0 flex-1 truncate">
                        <span class="font-500">{{ s.suggestedValue }}</span>
                        <span class="text-gray-400 dark:text-gray-500"> — {{ s.type }}</span>
                        <span v-if="s.status !== 'pending'" class="ml-2 text-2xs uppercase" :class="s.status === 'accepted' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'">{{ s.status }}</span>
                      </span>
                      <template v-if="s.status === 'pending'">
                        <NTooltip :content="$t('dialog_accept') as string">
                          <NButton icon btn="soft-gray" label="i-tabler-check" @click="acceptSuggestion(s.id)"></NButton>
                        </NTooltip>
                        <NTooltip :content="$t('dialog_reject') as string">
                          <NButton icon btn="soft-gray" label="i-tabler-x" @click="rejectSuggestion(s.id)"></NButton>
                        </NTooltip>
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <!-- AI Suggestions (create mode only) -->
              <div v-if="activeTab === 'ai'" class="p-1 px-4 space-y-6 overflow-y-auto max-h-full max-w-xl">
                <!-- Step header -->
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ $t('dialog_ai_step_title') }}</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ $t('dialog_ai_step_desc') }}</p>
                </div>

                <!-- Keyword area (always visible) -->
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('dialog_seed_tags_label') }}</label>
                    <button v-if="promptTags.length > 0" class="text-xs text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors" @click="promptTags = []">
                      {{ $t('common.clear') }}
                    </button>
                  </div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span v-for="(tag, i) in promptTags" :key="i" class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      {{ tag }}
                      <button class="ml-0.5 hover:text-red-500 transition-colors leading-none text-sm" @click="promptTags.splice(i, 1)">&times;</button>
                    </span>
                    <NInput
                      v-model="tagInputValue"
                      :placeholder="$t('dialog_tag_placeholder') as string"
                      size="sm"
                      autofocus
                      class="w-70 seed-tag-input dark:focus-visible:ring-indigo"
                      @keydown="onTagInputKeydown"
                    />
                  </div>
                </div>

                <!-- Initial state: no suggestions loaded -->
                <div v-if="suggestions.length === 0 && !loadingSuggestions" class="space-y-4">
                  <div class="flex flex-wrap gap-3">
                    <PrimaryButton btn="soft-indigo" class="text-sm font-600 gap-2 p-1 px-2" @click="loadAISuggestions">
                      <span class="i-ph-sparkle" /> {{ $t('dialog_ai') }}
                    </PrimaryButton>
                  </div>

                  <div class="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                    <button class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors" @click="showAISettings = true; loadAISettings()">
                      <NIcon name="i-ph-gear" class="inline-block mr-1" />{{ $t('dialog_settings') }}
                    </button>
                    <span class="text-gray-300 dark:text-gray-600">·</span>
                    <NTooltip>
                      <button class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors" :class="useLocation ? 'text-indigo-500' : ''" @click="toggleLocation">
                        <NIcon :name="useLocation ? 'i-lucide-map-pin-check-inside' : 'i-lucide-map-pin-minus-inside'" class="inline-block mr-1" />
                        {{ useLocation ? 'Location ON' : 'Location OFF' }}
                      </button>
                      <template #content>
                        <div class="max-w-sm"><p>{{ useLocation ? 'Location context is ON — AI suggestions consider the visitor\'s country.' : 'Location context is OFF — AI suggestions ignore location.' }}</p></div>
                      </template>
                    </NTooltip>
                  </div>

                  <div class="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4">
                    <button class="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" @click="skipToManual">
                      {{ $t('dialog_skip_suggestions') }} &rarr;
                    </button>
                  </div>
                </div>

                <!-- Loading state -->
                <div v-else-if="loadingSuggestions && suggestions.length === 0">
                  <div class="flex items-center gap-2 text-sm text-gray-500">
                    <span class="i-ph-circle-notch animate-spin" />
                    {{ $t('dialog_generating') }}
                  </div>
                </div>

                <!-- Suggestions loaded -->
                <div v-else-if="suggestions.length > 0" class="space-y-6">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white">{{ $t('dialog_suggestions') }}</h4>
                    <div class="flex items-center gap-1">
                      <OutlinedButton size="sm" @click="loadAISuggestions"><span class="i-ph-arrows-clockwise" />{{ $t('dialog_refresh') }}</OutlinedButton>
                      <OutlinedButton size="sm" @click="showAISettings = true; loadAISettings()"><span class="i-ph-gear" />{{ $t('dialog_settings') }}</OutlinedButton>
                      <OutlinedButton size="sm" @click="cancelSuggestions()"><span class="i-ph-x" />{{ $t('dialog_cancel') }}</OutlinedButton>
                    </div>
                  </div>
                  <div class="relative">
                    <div ref="suggestionScrollRef" class="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth">
                      <div v-for="(s, i) in suggestions" :key="i"
                        class="flex-shrink-0 w-56 p-3 rounded-xl border-1.5 cursor-pointer transition-all overflow-hidden"
                        :class="selectedSuggestionIndex === i
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
                        @click="applySuggestion(i)">
                        <div class="flex items-center gap-1.5 mb-2">
                          <span class="w-3 h-3 rounded-full border border-white/50" :style="{ backgroundColor: s.color_primary }" />
                          <span class="w-3 h-3 rounded-full border border-white/50" :style="{ backgroundColor: s.color_secondary }" />
                          <span class="text-2xs uppercase tracking-wider text-gray-400 ml-auto font-medium">{{ s.type }}</span>
                        </div>
                        <p class="text-sm font-semibold truncate text-gray-900 dark:text-white">{{ s.name }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{{ s.description }}</p>
                        <div class="flex flex-wrap gap-1 mt-2">
                          <span v-for="f in s.filters" :key="f.value" class="text-2xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 truncate max-w-full">
                            {{ f.value }}
                          </span>
                        </div>
                        <div v-if="selectedSuggestionIndex === i" class="mt-2 pt-2 border-t border-dashed border-indigo-200 dark:border-indigo-800">
                          <button class="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors" @click.stop="applySuggestion(i); skipToManual()">
                            {{ $t('dialog_apply_suggestion') }} &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      v-if="suggestions.length > 3"
                      class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      @click="scrollSuggestions(-1)"
                    >
                      <span class="i-ph-caret-left text-sm" />
                    </button>
                    <button
                      v-if="suggestions.length > 3"
                      class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      @click="scrollSuggestions(1)"
                    >
                      <span class="i-ph-caret-right text-sm" />
                    </button>
                  </div>

                  <!-- Skip to manual -->
                  <div class="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4">
                    <button class="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" @click="skipToManual">
                      {{ $t('dialog_skip_suggestions') }} &rarr;
                    </button>
                  </div>
                </div>
              </div>
        </div>
      </div>

      <template #footer>
        <div class="flex w-full min-w-0 justify-end gap-3 border-t border-gray-200/80 pt-4 dark:border-neutral-700/80">
          <NButton btn="ghost-gray" class="min-h-10 rounded-1 px-4 font-600" :disabled="submitting" @click="showEditDialog = false">{{ $t('common.cancel') }}</NButton>
          <NButton btn="solid-black" class="min-h-10 rounded-1 px-4" :loading="submitting" :disabled="!form.name.trim() || !form.slug.trim()" @click="saveTheme">
            {{ editMode ? $t('dialog_update') : $t('dialog_create') }}
            <NIcon v-if="!submitting" name="i-ph-check" class="ml-2 h-4 w-4" aria-hidden="true" />
          </NButton>
        </div>
      </template>
    </AppDialog>

    <AppDialog
      v-model="showDeleteDialog"
      :title="$t('dialog_delete_title') as string"
      :submitting="submitting"
      cancel-button-class="min-h-10 px-4"
      max-width="md"
      :can-submit="!deleteDisabled"
      @submit="confirmDelete"
    >
      <div class="space-y-5">
        <p class="font-semibold text-gray-900 dark:text-gray-100">
          <template v-if="themeToDelete">
            {{ themeToDelete.name }} <span class="font-normal text-gray-500 dark:text-gray-400">· #{{ themeToDelete.id }}</span>
          </template>
          <template v-else>
            {{ $t('dialog_delete_bulk_identity', { count: selectedIds.length }) }}
          </template>
        </p>

        <DeleteWarningPanel>
          {{ $t(themeToDelete ? 'dialog_delete_single_body' : 'dialog_delete_bulk_body', { count: selectedIds.length }) }}
        </DeleteWarningPanel>
      </div>

      <template #submit>
        <NButton :btn="deleteDisabled ? 'soft-gray' : 'solid-red'" class="min-h-10 px-4" :loading="submitting" :disabled="deleteDisabled" @click="confirmDelete">
          {{ $t('common.delete') }}
        </NButton>
      </template>
    </AppDialog>

    <NDialog v-model:open="showAISettings" :una="{ dialogContent: 'md:max-w-md' }">
      <template #header>
        <h3 class="font-title uppercase text-size-4 font-600 ml-4">{{ $t('dialog_ai_settings') }}</h3>
      </template>
      <div class="space-y-4 px-4">
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">{{ $t('dialog_ai_provider') }}</label>
          <NSelect v-model="aiSettings.provider" :items="providerOptions" size="sm" />
          <p class="text-xs text-gray-400 mt-1 capitalize">Selected: {{ aiSettings.provider }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2 capitalize">{{ $t('dialog_ai_api_key') }} ({{ aiSettings.provider }})</label>
          <NInput
            :model-value="activeProviderSettings.apiKey"
            @update:model-value="(v) => setProviderSetting('api_key', v)"
            placeholder="sk-..." size="sm" type="password"
          />
          <p class="text-xs text-gray-400 mt-1">Stored in the database. Falls back to <code class="text-xs px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800">{{ aiSettings.provider === 'openrouter' ? 'OPENROUTER_API_KEY' : aiSettings.provider === 'opencode' ? 'OPENCODE_API_KEY' : aiSettings.provider === 'openai' ? 'OPENAI_API_KEY' : 'AI_API_KEY' }}</code> env var.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">{{ $t('dialog_ai_model') }}</label>
          <div class="flex gap-2">
            <NInput
              :model-value="activeProviderSettings.model"
              @update:model-value="(v) => setProviderSetting('model', v)"
              placeholder="e.g. gpt-4o-mini" size="sm" class="flex-1"
            />
            <OutlinedButton size="sm" :loading="testingConnection" @click="testConnection">
              {{ testingConnection ? $t('dialog_ai_testing') : $t('dialog_ai_test') }}
            </OutlinedButton>
          </div>
        </div>

        <div v-if="aiSettings.provider === 'custom'">
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">{{ $t('dialog_ai_base_url') }}</label>
          <NInput v-model="aiSettings.custom_base_url" placeholder="https://..." size="sm" />
        </div>
        <div v-else>
          <p class="text-xs text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            {{ $t('dialog_ai_base_url_label') }} <code class="text-xs px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800">{{ aiSettings.provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : aiSettings.provider === 'opencode' ? 'https://opencode.ai/zen/go/v1' : 'https://api.openai.com/v1' }}</code>
          </p>
        </div>

      </div>
      <template #footer>
        <div class="flex justify-end gap-3 px-4 pt-2 pb-2">
          <button class="font-sans text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors" @click="showAISettings = false">{{ $t('common.cancel') }}</button>
          <OutlinedButton variant="primary" :loading="savingAISettings" @click="saveAISettings">{{ $t('common.save') }}</OutlinedButton>
        </div>
      </template>
    </NDialog>
    <PageJumpDialog
      v-model="showPageJumpDialog"
      :total-pages="totalPages"
      @jump="onPageJump"
    />
  </div>
</template>

<script setup lang="ts">
import { formatRelativeTime } from '~/utils/time-formatter'
import { useAdminKeyboardShortcuts } from '~/composables/useAdminKeyboardShortcuts'
import { useTableKeyboardNav } from '~/composables/useTableKeyboardNav'
import { BlossomColorPicker } from '@dayflow/blossom-color-picker-vue'
import type { BlossomColorPickerColor } from '@dayflow/blossom-color-picker-vue'
import { ensureHexColor, hexToBlossomValue } from '~/utils/color'

const { $t } = useI18n()
const { showErrorToast } = useErrorToast()

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: $t('meta_title') as string })

const loading = ref(true)
const themes = ref<any[]>([])
const totalThemes = ref(0)
const currentPage = ref(1)
useSyncedPageQuery(currentPage)
const pageSize = ref(50)
const searchQuery = ref('')

const showPageJumpDialog = ref(false)
const footerLeftOffset = ref(0)
const footerWidth = ref('100%')
const selectedSort = ref({ label: 'Priority (High-Low)', value: 'priority_desc' })
const editingPriority = ref<number | null>(null)
const priorityEditValue = ref(0)

const showEditDialog = ref(false)
const themeEditorOpen = useState<boolean>('admin-theme-dialog-open', () => false)
const editMode = ref(false)
const editingThemeId = ref<number | null>(null)
const submitting = ref(false)
const desktopImageInput = ref<HTMLInputElement | null>(null)
const mobileImageInput = ref<HTMLInputElement | null>(null)
const desktopImagePreviewFailed = ref(false)
const mobileImagePreviewFailed = ref(false)
const showDesktopAttribution = ref(false)
const showMobileAttribution = ref(false)
const showMobileImage = ref(false)
const uploadingThemeImage = ref<'desktop' | 'mobile' | null>(null)
const stagedThemeImageUrls = ref<string[]>([])

const hasMobileImageSettings = computed(() => [
  form.value.mobile_image_url,
  form.value.mobile_image_alt,
  form.value.mobile_image_credit,
  form.value.mobile_image_source_url,
  form.value.mobile_image_license,
  form.value.mobile_image_date,
  form.value.mobile_image_location,
].some(value => value.trim().length > 0))

const showDeleteDialog = ref(false)
const themeToDelete = ref<any>(null)
const deleteDisabled = computed(() => submitting.value || (!themeToDelete.value && selectedIds.value.length === 0))

const showAISettings = ref(false)
const showTranslations = ref(false)
const savingAISettings = ref(false)
const testingConnection = ref(false)

const activeTab = ref('general')
const themePanelRef = ref<HTMLElement | null>(null)
let themeDialogResizeAnimation: Animation | null = null

watch(activeTab, async () => {
  const dialog = themePanelRef.value?.closest<HTMLElement>('[role="dialog"]')
  if (!dialog) return
  const startHeight = dialog.getBoundingClientRect().height
  themeDialogResizeAnimation?.cancel()
  themeDialogResizeAnimation = null

  if (import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  await nextTick()
  const endHeight = dialog.getBoundingClientRect().height
  if (Math.abs(endHeight - startHeight) < 1) return

  themeDialogResizeAnimation = dialog.animate(
    [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
    { duration: 220, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
  )
  themeDialogResizeAnimation.onfinish = () => {
    themeDialogResizeAnimation?.cancel()
    themeDialogResizeAnimation = null
  }
}, { flush: 'pre' })

const tabs = computed(() => {
  return [
    { name: $t('tab_details'), shortName: $t('tab_details_short'), value: 'general' },
    { name: $t('tab_appearance'), shortName: $t('tab_appearance_short'), value: 'appearance' },
    { name: $t('tab_curation'), shortName: $t('tab_curation_short'), value: 'curation' },
    { name: $t('tab_scheduling'), shortName: $t('tab_scheduling_short'), value: 'scheduling' },
  ]
})
const activeTabName = computed(() => tabs.value.find(tab => tab.value === activeTab.value)?.name as string || '')

const onThemeTabKeydown = (event: KeyboardEvent, index: number) => {
  const lastIndex = tabs.value.length - 1
  const nextIndex = event.key === 'ArrowRight'
    ? (index + 1) % tabs.value.length
    : event.key === 'ArrowLeft'
      ? (index - 1 + tabs.value.length) % tabs.value.length
      : event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? lastIndex
          : -1
  if (nextIndex < 0) return

  event.preventDefault()
  activeTab.value = tabs.value[nextIndex]!.value
  const tablist = (event.currentTarget as HTMLElement).parentElement
  nextTick(() => tablist?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus())
}

const languageOptions = [
  { value: 'en', label: 'English', flag: '/images/languages/usa.png' },
  { value: 'fr', label: 'Français', flag: '/images/languages/france.png' },
]

const providerOptions = ['openrouter', 'opencode', 'openai', 'custom']

const aiSettings = ref({
  provider: 'openrouter' as string,
  openrouter_api_key: '',
  opencode_api_key: '',
  openai_api_key: '',
  custom_api_key: '',
  openrouter_model: '',
  opencode_model: '',
  openai_model: '',
  custom_model: '',
  custom_base_url: '',
})

const activeProviderSettings = computed(() => {
  const p = aiSettings.value.provider
  const key = p === 'custom' ? 'custom' : p
  return {
    apiKey: (aiSettings.value as any)[`${key}_api_key`] as string,
    model: (aiSettings.value as any)[`${key}_model`] as string,
  }
})

const setProviderSetting = (field: 'api_key' | 'model', value: string) => {
  const k = aiSettings.value.provider === 'custom' ? 'custom' : aiSettings.value.provider
  if (field === 'api_key') (aiSettings.value as any)[`${k}_api_key`] = value
  else (aiSettings.value as any)[`${k}_model`] = value
}

const loadAISettings = async () => {
  try {
    const res = await $fetch<{ data: Record<string, string> }>('/api/admin/settings')
    const d = res.data || {}
    aiSettings.value = {
      provider: d.ai_provider || 'openrouter',
      openrouter_api_key: d.openrouter_api_key || '',
      opencode_api_key: d.opencode_api_key || '',
      openai_api_key: d.openai_api_key || '',
      custom_api_key: d.custom_api_key || '',
      openrouter_model: d.openrouter_model || '',
      opencode_model: d.opencode_model || '',
      openai_model: d.openai_model || '',
      custom_model: d.custom_model || '',
      custom_base_url: d.custom_base_url || '',
    }
  } catch {
    aiSettings.value = {
      provider: 'openrouter', openrouter_api_key: '', opencode_api_key: '',
      openai_api_key: '', custom_api_key: '', openrouter_model: '',
      opencode_model: '', openai_model: '', custom_model: '', custom_base_url: '',
    }
  }
}

const saveAISettings = async () => {
  savingAISettings.value = true
  try {
    const s = aiSettings.value
    await $fetch('/api/admin/settings', {
      method: 'PUT',
      body: {
        settings: {
          ai_provider: s.provider,
          openrouter_api_key: s.openrouter_api_key,
          opencode_api_key: s.opencode_api_key,
          openai_api_key: s.openai_api_key,
          custom_api_key: s.custom_api_key,
          openrouter_model: s.openrouter_model,
          opencode_model: s.opencode_model,
          openai_model: s.openai_model,
          custom_model: s.custom_model,
          custom_base_url: s.custom_base_url,
        },
      },
    })
    showAISettings.value = false
    useToast().toast({ toast: 'outline-success', title: $t('toast_ai_saved') as string })
  } catch {
    showErrorToast(null, { title: $t('toast_error') as string, fallback: 'Failed to save AI settings' })
  } finally {
    savingAISettings.value = false
  }
}

const testConnection = async () => {
  testingConnection.value = true
  try {
    const s = aiSettings.value
    const k = s.provider === 'custom' ? 'custom' : s.provider
    const res = await $fetch('/api/admin/ai/test-connection', {
      method: 'POST',
      body: {
        provider: s.provider,
        apiKey: (s as any)[`${k}_api_key`] as string,
        model: (s as any)[`${k}_model`] as string,
        baseUrl: s.custom_base_url,
      },
    })
    if (res.success) {
      useToast().toast({ toast: 'outline-success', title: $t('toast_ai_test_success') as string })
    } else {
      useToast().toast({ toast: 'outline-error', title: $t('toast_ai_test_failed') as string, description: (res as any).error })
    }
  } catch {
    useToast().toast({ toast: 'outline-error', title: $t('toast_ai_test_failed') as string })
  } finally {
    testingConnection.value = false
  }
}

const useLocation = ref(true)

const toggleLocation = async () => {
  useLocation.value = !useLocation.value
  try {
    await $fetch('/api/admin/settings', {
      method: 'PUT',
      body: { settings: { theme_suggestions_use_location: useLocation.value ? '1' : '0' } },
    })
  } catch {
    useLocation.value = !useLocation.value
    showErrorToast(null, { title: $t('toast_error') as string, fallback: 'Failed to save location preference' })
  }
}

onMounted(async () => {
  try {
    const res = await $fetch<{ data: Record<string, string> }>('/api/admin/settings')
    useLocation.value = res.data?.theme_suggestions_use_location !== '0'
  } catch {}
})

const suggestingName = ref(false)
const entitySuggestions = ref<any[]>([])
const reviewingSuggestion = ref(false)

const loadEntitySuggestions = async (themeId: number) => {
  try {
    const res = await $fetch<{ data: any[] }>(`/api/admin/themes/${themeId}/suggestions`)
    entitySuggestions.value = res.data || []
  } catch { entitySuggestions.value = [] }
}

const acceptSuggestion = async (id: number) => {
  if (reviewingSuggestion.value) return
  reviewingSuggestion.value = true
  try {
    await $fetch(`/api/admin/themes/${editingThemeId.value}/suggestions/${id}`, {
      method: 'PUT', body: { action: 'accepted' },
    })
    const s = entitySuggestions.value.find(s => s.id === id)
    if (s) s.status = 'accepted'
    loadThemes()
  } catch { useToast().toast({ toast: 'soft-error', title: 'Failed to accept suggestion' })
  } finally { reviewingSuggestion.value = false }
}

const rejectSuggestion = async (id: number) => {
  if (reviewingSuggestion.value) return
  reviewingSuggestion.value = true
  try {
    await $fetch(`/api/admin/themes/${editingThemeId.value}/suggestions/${id}`, {
      method: 'PUT', body: { action: 'rejected' },
    })
    const s = entitySuggestions.value.find(s => s.id === id)
    if (s) s.status = 'rejected'
  } catch { useToast().toast({ toast: 'soft-error', title: 'Failed to reject suggestion' })
  } finally { reviewingSuggestion.value = false }
}

const suggestName = async () => {
  const current = form.value.name.trim()
  if (current.length < 3) {
    useToast().toast({ toast: 'outline-warning', title: $t('toast_min_chars') as string })
    return
  }

  suggestingName.value = true
  try {
    const res = await $fetch<{ data: { name: string; slug: string; description: string } }>('/api/admin/themes/suggest-name', {
      method: 'POST',
      body: { name: current },
    })
    if (res?.data) {
      form.value.name = res.data.name
      form.value.slug = res.data.slug || ''
      if (res.data.description) form.value.description = res.data.description
    }
  } catch (e: any) {
    showErrorToast(e, { title: $t('toast_error') as string, fallback: $t('toast_name_failed') as string })
  } finally {
    suggestingName.value = false
  }
}

const suggestions = ref<any[]>([])
const loadingSuggestions = ref(false)
const selectedSuggestionIndex = ref<number | null>(null)
const suggestionScrollRef = ref<HTMLElement | null>(null)

const promptTags = ref<string[]>([])
const tagInputValue = ref('')

const addPromptTag = () => {
  const tag = tagInputValue.value.trim().toLowerCase()
  if (tag && !promptTags.value.includes(tag)) {
    promptTags.value.push(tag)
  }
  tagInputValue.value = ''
  nextTick(() => document.querySelector<HTMLElement>('.seed-tag-input')?.focus())
}

const onTagInputKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    addPromptTag()
  } else if (e.key === 'Escape') {
    e.stopPropagation()
    tagInputValue.value = ''
    ;(e.target as HTMLInputElement)?.blur()
  }
}

const skipToManual = () => {
  activeTab.value = 'general'
}

const cancelSuggestions = () => {
  suggestions.value = []
  selectedSuggestionIndex.value = null
  promptTags.value = []
}

const scrollSuggestions = (direction: number) => {
  const el = suggestionScrollRef.value
  if (el) {
    const cardWidth = 236
    el.scrollBy({ left: direction * cardWidth, behavior: 'smooth' })
  }
}

const loadSuggestions = async () => {
  loadingSuggestions.value = true
  suggestions.value = []
  selectedSuggestionIndex.value = null
  try {
    const languageStore = useLanguageStore()
    const params: Record<string, string> = { ...languageStore.getLanguageQuery() }
    if (promptTags.value.length) params.tags = promptTags.value.join(',')
    const res = await $fetch('/api/admin/themes/suggestions', { params })
    suggestions.value = res?.data || []
  } catch {
    showErrorToast(null, { title: $t('toast_error') as string, fallback: 'Failed to load suggestions' })
  } finally {
    loadingSuggestions.value = false
  }
}

const loadAISuggestions = async () => {
  loadingSuggestions.value = true
  suggestions.value = []
  selectedSuggestionIndex.value = null
  try {
    const languageStore = useLanguageStore()
    const params: Record<string, string> = { ai: 'true', ...languageStore.getLanguageQuery() }
    if (promptTags.value.length) params.tags = promptTags.value.join(',')
    const res = await $fetch('/api/admin/themes/suggestions', { params })
    if (!res?.data || !res.data.length) {
      useToast().toast({ toast: 'outline-warning', title: $t('toast_no_ai') as string, description: 'AI returned no results. Check your AI settings or fallback to regular suggestions.' })
    }
    suggestions.value = res?.data || []
  } catch {
    showErrorToast(null, { title: $t('toast_error') as string, fallback: 'Failed to generate AI suggestions. Check your AI settings.' })
  } finally {
    loadingSuggestions.value = false
  }
}

const applySuggestion = (index: number) => {
  selectedSuggestionIndex.value = index
  const s = suggestions.value[index]
  if (!s) return
  form.value.name = s.name
  form.value.slug = s.slug
  form.value.description = s.description
  form.value.color_primary = ensureHexColor(s.color_primary, '#6366f1')
  form.value.color_secondary = ensureHexColor(s.color_secondary, '#f59e0b')
  initPickerValues(form.value.color_primary, form.value.color_secondary)
  filters.value = s.filters.map((f: any) => ({ id: undefined as number | undefined, type: f.type, value: f.value }))
}

let translationKeyCounter = 0
const translations = ref<{ _key: number; language: string; name: string; description: string; home_copy_json: string }[]>([])

const parseHomeCopy = (value: string) => {
  if (!value.trim()) return null
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

const form = ref({
  slug: '',
  name: '',
  description: '',
  image_url: '',
  image_alt: '',
  image_credit: '',
  image_source_url: '',
  image_license: '',
  image_date: '',
  image_location: '',
  mobile_image_url: '',
  mobile_image_alt: '',
  mobile_image_credit: '',
  mobile_image_source_url: '',
  mobile_image_license: '',
  mobile_image_date: '',
  mobile_image_location: '',
  language: '',
  is_active: false,
  is_default: false,
  scheduled_start: '',
  scheduled_end: '',
  priority: 0,
  color_primary: '#6366f1' as string,
  color_secondary: '#f59e0b' as string,
  featured_quote_id: null as number | null,
  featured_reference_id: null as number | null,
})

watch(() => form.value.image_url, () => { desktopImagePreviewFailed.value = false })
watch(() => form.value.mobile_image_url, () => { mobileImagePreviewFailed.value = false })

const isStagedThemeImageUrl = (url: string) => url.startsWith('/blob/images/theme-staging/')

const deleteStagedThemeImage = async (url: string) => {
  if (!isStagedThemeImageUrl(url)) return
  try {
    await $fetch('/api/admin/themes/staged-image', { method: 'DELETE', body: { url } })
  } catch (error) {
    // The scheduled cleanup removes staged objects if an immediate delete fails.
    console.warn('Failed to remove staged theme image:', error)
  }
}

const discardStagedThemeImages = async () => {
  const urls = [...new Set(stagedThemeImageUrls.value)]
  stagedThemeImageUrls.value = []
  await Promise.allSettled(urls.map(deleteStagedThemeImage))
}

const onThemeImageSelected = async (event: Event, variant: 'desktop' | 'mobile') => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploadingThemeImage.value = variant
  try {
    const formData = new FormData()
    formData.append('image', file)
    const response = await $fetch<{ data: { url: string } }>('/api/admin/themes/staged-image', {
      method: 'POST',
      body: formData,
    })
    const uploadedUrl = response.data.url

    if (!showEditDialog.value) {
      await deleteStagedThemeImage(uploadedUrl)
      return
    }

    if (!stagedThemeImageUrls.value.includes(uploadedUrl)) stagedThemeImageUrls.value.push(uploadedUrl)
    if (variant === 'desktop') form.value.image_url = uploadedUrl
    else form.value.mobile_image_url = uploadedUrl
  } catch (error) {
    showErrorToast(error, { title: $t('toast_error') as string, fallback: $t('dialog_image_upload_failed') as string })
  } finally {
    uploadingThemeImage.value = null
    input.value = ''
  }
}

const clearThemeImage = (variant: 'desktop' | 'mobile') => {
  if (variant === 'desktop') form.value.image_url = ''
  else form.value.mobile_image_url = ''
}

watch(() => [form.value.image_url, form.value.mobile_image_url], (currentUrls) => {
  const stillUsed = new Set(currentUrls)
  const unused = stagedThemeImageUrls.value.filter(url => !stillUsed.has(url))
  if (!unused.length) return
  stagedThemeImageUrls.value = stagedThemeImageUrls.value.filter(url => stillUsed.has(url))
  void Promise.allSettled(unused.map(deleteStagedThemeImage))
})

const primaryPickerValue = ref(hexToBlossomValue('#6366f1'))
const secondaryPickerValue = ref(hexToBlossomValue('#f59e0b'))

function onPrimaryChange(color: BlossomColorPickerColor) {
  form.value.color_primary = color.hex
  primaryPickerValue.value = { hue: color.hue, saturation: color.saturation, alpha: color.alpha, layer: color.layer }
}

function onSecondaryChange(color: BlossomColorPickerColor) {
  form.value.color_secondary = color.hex
  secondaryPickerValue.value = { hue: color.hue, saturation: color.saturation, alpha: color.alpha, layer: color.layer }
}

function initPickerValues(primary: string, secondary: string) {
  primaryPickerValue.value = hexToBlossomValue(primary)
  secondaryPickerValue.value = hexToBlossomValue(secondary)
}

function onPrimaryHexInput(value: string) {
  const hex = ensureHexColor(value, '#6366f1')
  form.value.color_primary = hex
  primaryPickerValue.value = hexToBlossomValue(hex)
}

function onSecondaryHexInput(value: string) {
  const hex = ensureHexColor(value, '#f59e0b')
  form.value.color_secondary = hex
  secondaryPickerValue.value = hexToBlossomValue(hex)
}

const filters = ref<any[]>([])

const filterTypeOptions = [
  { value: 'keyword', label: String($t('dialog_filter_keyword')) },
  { value: 'tag_name', label: String($t('dialog_filter_tag')) },
  { value: 'author_name', label: String($t('dialog_filter_author')) },
  { value: 'reference_name', label: String($t('dialog_filter_reference')) },
  { value: 'author_id', label: String($t('dialog_filter_author_id')) },
  { value: 'reference_id', label: String($t('dialog_filter_reference_id')) },
  { value: 'language', label: String($t('dialog_filter_language')) },
]
const filterTypeLabels = filterTypeOptions.map(option => option.label)

function displayFilterType(type: string) {
  return filterTypeOptions.find(option => option.value === type)?.label || type
}

function setFilterType(index: number, label: string) {
  const option = filterTypeOptions.find(candidate => candidate.label === label)
  if (!option || !filters.value[index]) return
  filters.value[index].type = option.value
  onFilterValueInput(index)
}

// multi-select state
const rowSelection = ref<Record<number, boolean>>({})
const lastSelectedIndex = ref<number | null>(null)

const selectedIds = computed<number[]>(() => Object.entries(rowSelection.value).filter(([, v]) => !!v).map(([k]) => Number(k)))

const bulkSelectionActions = computed(() => [
  { key: 'delete', label: $t('common.delete') as string, icon: 'i-tabler-trash', disabled: submitting.value },
])

const onBulkSelectionAction = (key: string) => {
  if (key === 'delete') {
    themeToDelete.value = null
    showDeleteDialog.value = true
  }
}

const clearSelection = () => { rowSelection.value = {}; lastSelectedIndex.value = null }

const selectAllOnPage = () => {
  if (themes.value.every(t => !!rowSelection.value[t.id])) rowSelection.value = {}
  else themes.value.forEach(t => (rowSelection.value[t.id] = true))
}

const isAnyDialogOpen = computed(() => showEditDialog.value || showDeleteDialog.value)

const { highlightedRowIndex, clearHighlight } = useTableKeyboardNav({
  visibleRowCount: () => themes.value.length,
  onSelectRow: (index: number) => {
    const theme = themes.value[index]
    if (theme) { rowSelection.value[theme.id] = !rowSelection.value[theme.id]; lastSelectedIndex.value = null }
  },
  isDialogOpen: () => isAnyDialogOpen.value,
  isDropdownOpen: () => false,
  pagination: {
    currentPage: () => currentPage.value,
    totalPages: () => totalPages.value,
    setPage: page => { currentPage.value = page }
  }
})

const highlightedTheme = computed<any | null>(() => {
  if (highlightedRowIndex.value === null) return null
  return themes.value[highlightedRowIndex.value] ?? null
})

useAdminKeyboardShortcuts({
  selectAllOnPage, clearSelection,
  hasSelection: () => selectedIds.value.length > 0,
  isDialogOpen: () => isAnyDialogOpen.value,
  isDropdownOpen: () => false,
  onDelete: () => {
    if (selectedIds.value.length) {
      themeToDelete.value = null
      showDeleteDialog.value = true
    }
  },
  onConfirmDialog: () => { if (showDeleteDialog.value) confirmDelete() },
  highlightedRowIndex: () => highlightedRowIndex.value,
  onSingleEdit: () => {
    if (highlightedTheme.value) { openEdit(highlightedTheme.value) }
  },
  onSingleDelete: () => {
    if (highlightedTheme.value) { themeToDelete.value = highlightedTheme.value; showDeleteDialog.value = true }
  },
})

const sortOptions = [
  { label: $t('sort_priority_high') as string, value: 'priority_desc' },
  { label: $t('sort_priority_low') as string, value: 'priority_asc' },
  { label: $t('sort_name_az') as string, value: 'name_asc' },
  { label: $t('sort_name_za') as string, value: 'name_desc' },
  { label: $t('sort_most_filters') as string, value: 'filters_desc' },
  { label: $t('sort_fewest_filters') as string, value: 'filters_asc' },
  { label: $t('sort_slug_az') as string, value: 'slug_asc' },
  { label: $t('sort_scheduled') as string, value: 'scheduled_date_desc' },
]
const nonPrioritySortOptions = sortOptions.filter(option => !option.value.startsWith('priority_'))

useSyncedQueryFilters({
  keys: ['q', 'sort'],
  read: (query) => {
    const sort = readSyncedQueryValue(query.sort)
    return {
      q: readSyncedQueryValue(query.q),
      sort: sortOptions.some(option => option.value === sort) ? sort : 'priority_desc'
    }
  },
  write: (query, state) => ({ ...query, q: state.q.trim() || undefined, sort: state.sort === 'priority_desc' ? undefined : state.sort }),
  get: () => ({ q: searchQuery.value, sort: selectedSort.value.value }),
  apply: (state) => {
    searchQuery.value = state.q
    selectedSort.value = sortOptions.find(option => option.value === state.sort) ?? sortOptions[0]!
  },
  onFilterChange: () => { currentPage.value = 1 }
})

const togglePrioritySort = () => {
  selectedSort.value = selectedSort.value.value === 'priority_asc'
    ? sortOptions[0]!
    : selectedSort.value.value === 'priority_desc'
      ? sortOptions[1]!
      : sortOptions[0]!
}

const sortDirectionFor = (ascendingValue: string, descendingValue: string): 'asc' | 'desc' | null => {
  if (selectedSort.value.value === ascendingValue) return 'asc'
  if (selectedSort.value.value === descendingValue) return 'desc'
  return null
}

const toggleSort = (ascendingValue: string, descendingValue: string) => {
  const nextValue = selectedSort.value.value === descendingValue ? ascendingValue : descendingValue
  const option = sortOptions.find(item => item.value === nextValue)
  if (!option) return
  selectedSort.value = option
  currentPage.value = 1
}

const tableColumns = [
  { header: 'Name', accessorKey: 'name', enableSorting: false, meta: { una: { tableHead: 'min-w-40', tableCell: 'min-w-40' } } },
  { header: 'Status', accessorKey: 'status', enableSorting: false, meta: { una: { tableHead: 'w-28', tableCell: 'w-28' } } },
  { header: 'Schedule', accessorKey: 'schedule', enableSorting: false, meta: { una: { tableHead: 'w-32', tableCell: 'w-32' } } },
  { header: 'Filters', accessorKey: 'filters', enableSorting: false, meta: { una: { tableHead: 'w-16', tableCell: 'w-16 text-center' } } },
  { header: 'Priority', accessorKey: 'priority', enableSorting: false, meta: { una: { tableHead: 'w-16', tableCell: 'w-16 text-center' } } },
  { header: '', accessorKey: 'actions', enableSorting: false, meta: { una: { tableHead: 'w-16', tableCell: 'w-16' } } },
]

const totalPages = computed(() => Math.ceil(totalThemes.value / pageSize.value))

const headerActions = computed(() => {
  const actions: any[] = []
  if (selectedIds.value.length > 0) {
    actions.push({ label: $t('dropdown_delete_selected'), leading: 'i-ph-trash', shortcut: 'D', onclick: () => { themeToDelete.value = null; showDeleteDialog.value = true } })
  }
  if (actions.length > 0) actions.push({})
  actions.push({ label: $t('dropdown_add'), leading: 'i-ph-plus', onclick: () => { openCreate() } })
  actions.push({})
  actions.push({ label: $t('dropdown_refresh'), leading: 'i-ph-arrows-clockwise', onclick: () => loadThemes() })
  actions.push({ label: $t('dropdown_reset'), leading: 'i-ph-x', onclick: () => resetFilters() })
  return actions
})

const duplicateTheme = async (theme: any) => {
  resetForm()
  suggestions.value = []
  selectedSuggestionIndex.value = null
  try {
    const res = await $fetch<{ data: any }>(`/api/admin/themes/${theme.id}`)
    const data = res.data
    let themeConfig: Record<string, any> = {}
    if (data.config) {
      try { themeConfig = typeof data.config === 'string' ? JSON.parse(data.config) : data.config } catch { themeConfig = {} }
    }
    const colorPrimary = ensureHexColor(themeConfig.color_primary, '#6366f1')
    const colorSecondary = ensureHexColor(themeConfig.color_secondary, '#f59e0b')
    form.value = {
      slug: '',
      name: `${data.name} (copy)`,
      description: data.description || '',
      image_url: data.imageUrl || '',
      image_alt: data.imageAlt || '',
      image_credit: data.imageCredit || '',
      image_source_url: data.imageSourceUrl || '',
      image_license: data.imageLicense || '',
      image_date: data.imageDate || '',
      image_location: data.imageLocation || '',
      mobile_image_url: data.mobileImageUrl || '',
      mobile_image_alt: data.mobileImageAlt || '',
      mobile_image_credit: data.mobileImageCredit || '',
      mobile_image_source_url: data.mobileImageSourceUrl || '',
      mobile_image_license: data.mobileImageLicense || '',
      mobile_image_date: data.mobileImageDate || '',
      mobile_image_location: data.mobileImageLocation || '',
      language: data.language || '',
      is_active: false,
      is_default: false,
      scheduled_start: '',
      scheduled_end: '',
      priority: data.priority || 0,
      color_primary: colorPrimary,
      color_secondary: colorSecondary,
      featured_quote_id: themeConfig.featured_quote_id ?? null,
      featured_reference_id: themeConfig.featured_reference_id ?? null,
    }
    showMobileImage.value = hasMobileImageSettings.value
    translations.value = (data.translations || []).map((t: any) => ({
      _key: translationKeyCounter++,
      language: t.language,
      name: t.name,
      description: t.description || '',
      home_copy_json: typeof t.home_copy === 'string' ? t.home_copy : (t.home_copy ? JSON.stringify(t.home_copy, null, 2) : ''),
    }))
    initPickerValues(colorPrimary, colorSecondary)
    filters.value = (data.filters || []).map((f: any) => ({ id: undefined as number | undefined, type: f.type, value: f.value }))
  } catch (e) {
    showErrorToast(e, $t('error_load') as string)
    return
  }
  editMode.value = false
  entitySuggestions.value = []
  activeTab.value = 'general'
  showEditDialog.value = true
}

const startEditPriority = (theme: any) => {
  priorityEditValue.value = theme.priority
  editingPriority.value = theme.id
}

const savePriority = async (theme: any) => {
  const id = editingPriority.value
  if (id === null) return
  editingPriority.value = null
  const val = parseInt(String(priorityEditValue.value), 10)
  if (isNaN(val) || val === theme.priority) return
  try {
    await $fetch(`/api/admin/themes/${id}`, { method: 'PUT', body: { priority: val } })
    theme.priority = val
  } catch {
    useToast().toast({ toast: 'soft-error', title: $t('toast_error') as string })
  }
}

const getStatusActions = (theme: any, status: string) => {
  const actions: any[] = []
  if (status === 'active' || status === 'scheduled') {
    actions.push({ label: $t('row_deactivate'), leading: 'i-ph-toggle-left', onclick: () => toggleActive(theme, false) })
  }
  if (status === 'default') {
    actions.push({ label: $t('row_remove_default'), leading: 'i-ph-star-slash', onclick: () => toggleDefault(theme, false) })
  }
  if (status === 'inactive') {
    actions.push(
      { label: $t('row_activate'), leading: 'i-ph-toggle-right', onclick: () => toggleActive(theme, true) },
      { label: $t('row_set_default'), leading: 'i-ph-star', onclick: () => toggleDefault(theme, true) },
    )
  }
  return actions
}

const getThemeActions = (theme: any) => {
  const actions: any[] = [
    { label: $t('row_edit'), leading: 'i-ph-pencil', onclick: () => openEdit(theme) },
    { label: $t('row_duplicate'), leading: 'i-ph-copy', onclick: () => duplicateTheme(theme) },
    { label: $t('row_preview'), leading: 'i-ph-eye', onclick: () => window.open(`/?theme=${theme.slug}`, '_blank') },
    theme.isActive
      ? { label: $t('row_deactivate'), leading: 'i-ph-toggle-left', onclick: () => toggleActive(theme, false) }
      : { label: $t('row_activate'), leading: 'i-ph-toggle-right', onclick: () => toggleActive(theme, true) },
    theme.isDefault
      ? { label: $t('row_remove_default'), leading: 'i-ph-star-slash', onclick: () => toggleDefault(theme, false) }
      : { label: $t('row_set_default'), leading: 'i-ph-star', onclick: () => toggleDefault(theme, true) },
    {},
    { label: $t('row_delete'), leading: 'i-ph-trash', onclick: () => { themeToDelete.value = theme; showDeleteDialog.value = true } },
  ]
  return actions
}

const loadThemes = async () => {
  try {
    loading.value = true
    const sortValue = selectedSort.value.value
    const lastUnderscoreIndex = sortValue.lastIndexOf('_')
    const sortBy = sortValue.substring(0, lastUnderscoreIndex)
    const sortOrder = sortValue.substring(lastUnderscoreIndex + 1).toUpperCase()

    const res = await $fetch('/api/admin/themes', {
      query: {
        page: currentPage.value,
        limit: pageSize.value,
        search: searchQuery.value || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      },
    })
    themes.value = res?.data || []
    totalThemes.value = res?.pagination?.total || 0
    rowSelection.value = {}
    clearHighlight()
  } catch (e) {
    showErrorToast(e, $t('error_load') as string)
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedSort.value = sortOptions[0]!
  currentPage.value = 1
  rowSelection.value = {}
}

const addTranslation = () => {
  if (!showTranslations.value) {
    showTranslations.value = true
  }

  const usedLangs = translations.value.map(t => t.language)
  const nextLang = ['en', 'fr'].find(l => !usedLangs.includes(l))
  if (!nextLang) {
    useToast().toast({ toast: 'outline-warning', title: $t('toast_all_langs') as string })
    return
  }
  translations.value.push({ _key: translationKeyCounter++, language: nextLang, name: '', description: '', home_copy_json: '' })
}

const removeTranslation = (idx: number) => {
  translations.value.splice(idx, 1)
}

const resetForm = () => {
  void discardStagedThemeImages()
  showDesktopAttribution.value = false
  showMobileAttribution.value = false
  showMobileImage.value = false
  form.value = { slug: '', name: '', description: '', image_url: '', image_alt: '', image_credit: '', image_source_url: '', image_license: '', image_date: '', image_location: '', mobile_image_url: '', mobile_image_alt: '', mobile_image_credit: '', mobile_image_source_url: '', mobile_image_license: '', mobile_image_date: '', mobile_image_location: '', language: '', is_active: false, is_default: false, scheduled_start: '', scheduled_end: '', priority: 0, color_primary: '#6366f1', color_secondary: '#f59e0b', featured_quote_id: null, featured_reference_id: null }
  initPickerValues('#6366f1', '#f59e0b')
  filters.value = []
  filterRecommendations.value = []
  translations.value = []
  entitySuggestions.value = []
  editingThemeId.value = null
  editMode.value = false
  promptTags.value = []
  featuredQuoteQuery.value = ''
  featuredQuoteResults.value = []
  featuredQuoteActive.value = false
  featuredRefQuery.value = ''
  featuredRefResults.value = []
  featuredRefActive.value = false
}

const openCreate = () => {
  resetForm()
  suggestions.value = []
  selectedSuggestionIndex.value = null
  activeTab.value = 'general'
  showEditDialog.value = true
}

const openEdit = async (theme: any) => {
  editMode.value = true
  editingThemeId.value = theme.id
  try {
    const res = await $fetch<{ data: any }>(`/api/admin/themes/${theme.id}`)
    const data = res.data
    let themeConfig: Record<string, any> = {}
    if (data.config) {
      try { themeConfig = typeof data.config === 'string' ? JSON.parse(data.config) : data.config } catch { themeConfig = {} }
    }
    const colorPrimary = ensureHexColor(themeConfig.color_primary, '#6366f1')
    const colorSecondary = ensureHexColor(themeConfig.color_secondary, '#f59e0b')
    form.value = {
      slug: data.slug || '',
      name: data.name || '',
      description: data.description || '',
      image_url: data.imageUrl || '',
      image_alt: data.imageAlt || '',
      image_credit: data.imageCredit || '',
      image_source_url: data.imageSourceUrl || '',
      image_license: data.imageLicense || '',
      image_date: data.imageDate || '',
      image_location: data.imageLocation || '',
      mobile_image_url: data.mobileImageUrl || '',
      mobile_image_alt: data.mobileImageAlt || '',
      mobile_image_credit: data.mobileImageCredit || '',
      mobile_image_source_url: data.mobileImageSourceUrl || '',
      mobile_image_license: data.mobileImageLicense || '',
      mobile_image_date: data.mobileImageDate || '',
      mobile_image_location: data.mobileImageLocation || '',
      language: data.language || '',
      is_active: data.isActive || false,
      is_default: data.isDefault || false,
      scheduled_start: data.scheduledStart ? formatDatetimeForInput(data.scheduledStart) : '',
      scheduled_end: data.scheduledEnd ? formatDatetimeForInput(data.scheduledEnd) : '',
      priority: data.priority || 0,
      color_primary: colorPrimary,
      color_secondary: colorSecondary,
      featured_quote_id: themeConfig.featured_quote_id ?? null,
      featured_reference_id: themeConfig.featured_reference_id ?? null,
    }
    showMobileImage.value = hasMobileImageSettings.value
    if (themeConfig.featured_quote_id) {
      resolveFeaturedName('quote', themeConfig.featured_quote_id, featuredQuoteQuery)
    }
    if (themeConfig.featured_reference_id) {
      resolveFeaturedName('reference', themeConfig.featured_reference_id, featuredRefQuery)
    }
    translations.value = (data.translations || []).map((t: any) => ({
      _key: translationKeyCounter++,
      language: t.language,
      name: t.name,
      description: t.description || '',
      home_copy_json: typeof t.home_copy === 'string' ? t.home_copy : (t.home_copy ? JSON.stringify(t.home_copy, null, 2) : ''),
    }))
    initPickerValues(colorPrimary, colorSecondary)
    filters.value = (data.filters || []).map((f: any) => ({ id: f.id, type: f.type, value: f.value }))
    loadEntitySuggestions(theme.id)
  } catch (e) {
    showErrorToast(e, $t('error_load') as string)
    return
  }
  activeTab.value = 'general'
  showEditDialog.value = true
}

// Featured quote search
const featuredQuoteQuery = ref('')
const featuredQuoteResults = ref<{ label: string; value: string }[]>([])
const featuredQuoteActive = ref(false)
const featuredQuoteHighlighted = ref(-1)
const featuredQuoteLoading = ref(false)
let featuredQuoteTimeout: ReturnType<typeof setTimeout> | undefined

const featuredRefQuery = ref('')
const featuredRefResults = ref<{ label: string; value: string }[]>([])
const featuredRefActive = ref(false)
const featuredRefHighlighted = ref(-1)
const featuredRefLoading = ref(false)
let featuredRefTimeout: ReturnType<typeof setTimeout> | undefined

const searchFeatured = async (type: string, query: string, results: Ref<{ label: string; value: string }[]>, active: Ref<boolean>, loading: Ref<boolean>, highlighted: Ref<number>) => {
  const q = query.trim()
  if (!q || q.length < 1) {
    results.value = []
    active.value = false
    loading.value = false
    return
  }
  loading.value = true
  try {
    const res = await $fetch('/api/admin/themes/filter-suggestions', { query: { q, type } })
    results.value = res?.data || []
    active.value = results.value.length > 0
    highlighted.value = -1
  } catch {
    results.value = []
    active.value = false
    highlighted.value = -1
  } finally {
    loading.value = false
  }
}

const onFeaturedQuoteSearch = () => {
  if (featuredQuoteTimeout) clearTimeout(featuredQuoteTimeout)
  featuredQuoteHighlighted.value = -1
  featuredQuoteTimeout = setTimeout(() => searchFeatured('featured_quote', featuredQuoteQuery.value, featuredQuoteResults, featuredQuoteActive, featuredQuoteLoading, featuredQuoteHighlighted), 200)
}

const onFeaturedQuoteKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    if (featuredQuoteActive.value && featuredQuoteHighlighted.value >= 0 && featuredQuoteHighlighted.value < featuredQuoteResults.value.length) {
      selectFeaturedQuote(featuredQuoteResults.value[featuredQuoteHighlighted.value]!)
    }
    return
  }
  if (!featuredQuoteActive.value) return
  if (e.key === 'ArrowDown') {
    if (!featuredQuoteResults.value.length) return
    e.preventDefault()
    featuredQuoteHighlighted.value = (featuredQuoteHighlighted.value + 1) % featuredQuoteResults.value.length
  } else if (e.key === 'ArrowUp') {
    if (!featuredQuoteResults.value.length) return
    e.preventDefault()
    featuredQuoteHighlighted.value = featuredQuoteHighlighted.value <= 0 ? featuredQuoteResults.value.length - 1 : featuredQuoteHighlighted.value - 1
  } else if (e.key === 'Escape') {
    featuredQuoteResults.value = []
    featuredQuoteActive.value = false
    featuredQuoteHighlighted.value = -1
  }
}

const selectFeaturedQuote = (s: { label: string; value: string }) => {
  featuredQuoteQuery.value = s.label
  form.value.featured_quote_id = parseInt(s.value, 10)
  featuredQuoteHighlighted.value = -1
  featuredQuoteResults.value = []
  featuredQuoteActive.value = false
}

const hideFeaturedQuoteSuggestions = () => {
  setTimeout(() => {
    featuredQuoteHighlighted.value = -1
    featuredQuoteResults.value = []
    featuredQuoteActive.value = false
  }, 150)
}

const clearFeaturedQuote = () => {
  form.value.featured_quote_id = null
  featuredQuoteQuery.value = ''
  featuredQuoteResults.value = []
  featuredQuoteActive.value = false
}

// Featured reference search
const onFeaturedRefSearch = () => {
  if (featuredRefTimeout) clearTimeout(featuredRefTimeout)
  featuredRefHighlighted.value = -1
  featuredRefTimeout = setTimeout(() => searchFeatured('featured_reference', featuredRefQuery.value, featuredRefResults, featuredRefActive, featuredRefLoading, featuredRefHighlighted), 200)
}

const onFeaturedRefKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    if (featuredRefActive.value && featuredRefHighlighted.value >= 0 && featuredRefHighlighted.value < featuredRefResults.value.length) {
      selectFeaturedRef(featuredRefResults.value[featuredRefHighlighted.value]!)
    }
    return
  }
  if (!featuredRefActive.value) return
  if (e.key === 'ArrowDown') {
    if (!featuredRefResults.value.length) return
    e.preventDefault()
    featuredRefHighlighted.value = (featuredRefHighlighted.value + 1) % featuredRefResults.value.length
  } else if (e.key === 'ArrowUp') {
    if (!featuredRefResults.value.length) return
    e.preventDefault()
    featuredRefHighlighted.value = featuredRefHighlighted.value <= 0 ? featuredRefResults.value.length - 1 : featuredRefHighlighted.value - 1
  } else if (e.key === 'Escape') {
    featuredRefResults.value = []
    featuredRefActive.value = false
    featuredRefHighlighted.value = -1
  }
}

const selectFeaturedRef = (s: { label: string; value: string }) => {
  featuredRefQuery.value = s.label
  form.value.featured_reference_id = parseInt(s.value, 10)
  featuredRefHighlighted.value = -1
  featuredRefResults.value = []
  featuredRefActive.value = false
}

const hideFeaturedRefSuggestions = () => {
  setTimeout(() => {
    featuredRefHighlighted.value = -1
    featuredRefResults.value = []
    featuredRefActive.value = false
  }, 150)
}

const clearFeaturedRef = () => {
  form.value.featured_reference_id = null
  featuredRefQuery.value = ''
  featuredRefResults.value = []
  featuredRefActive.value = false
}

const resolveFeaturedName = async (type: 'quote' | 'reference', id: number, queryRef: Ref<string>) => {
  try {
    const endpoint = type === 'quote' ? `/api/quotes/${id}` : `/api/references/${id}`
    const res = await $fetch<{ data?: { name?: string } }>(endpoint)
    if (res?.data?.name) queryRef.value = res.data.name
  } catch {}
}

const activeFilterIndex = ref<number | null>(null)
const filterSuggestions = ref<{ label: string; value: string }[]>([])
const highlightedIndex = ref(-1)
const fetchingFilterIndex = ref<number | null>(null)
let fetchFilterTimeout: ReturnType<typeof setTimeout> | undefined

const scrollHighlightedIntoView = () => {
  nextTick(() => {
    const el = document.querySelector('[data-highlighted-suggestion]')
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
}

const onFilterValueInput = (idx: number) => {
  if (fetchFilterTimeout) clearTimeout(fetchFilterTimeout)
  highlightedIndex.value = -1
  fetchingFilterIndex.value = idx
  const filter = filters.value[idx]
  if (!filter || !filter.value.trim()) {
    filterSuggestions.value = []
    activeFilterIndex.value = null
    fetchingFilterIndex.value = null
    return
  }
  fetchFilterTimeout = setTimeout(() => searchFilterSuggestions(idx), 200)
}

const searchFilterSuggestions = async (idx: number) => {
  const filter = filters.value[idx]
  if (!filter || !filter.value.trim()) {
    fetchingFilterIndex.value = null
    return
  }

  try {
    const res = await $fetch('/api/admin/themes/filter-suggestions', {
      query: { q: filter.value, type: filter.type },
    })
    filterSuggestions.value = res?.data || []
    activeFilterIndex.value = filterSuggestions.value.length > 0 ? idx : null
    highlightedIndex.value = -1
  } catch {
    filterSuggestions.value = []
    activeFilterIndex.value = null
    highlightedIndex.value = -1
  } finally {
    fetchingFilterIndex.value = null
  }
}

const onFilterKeydown = async (idx: number, e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    if (e.metaKey || e.ctrlKey) return
    e.preventDefault()
    if (activeFilterIndex.value === idx && highlightedIndex.value >= 0 && highlightedIndex.value < filterSuggestions.value.length) {
      selectFilterSuggestion(idx, filterSuggestions.value[highlightedIndex.value]!)
    } else {
      const current = filters.value[idx]
      if (current) {
        filters.value.splice(idx + 1, 0, { id: undefined, type: current.type, value: '' })
        nextTick(() => {
          const inputs = document.querySelectorAll<HTMLInputElement>('.filter-value-input')
          inputs[idx + 1]?.focus()
        })
      }
    }
    return
  }

  if (e.key === 'Backspace' && !filters.value[idx]?.value && filters.value.length > 1) {
    e.preventDefault()
    const prevIdx = idx - 1
    await removeFilter(idx)
    if (prevIdx >= 0) {
      nextTick(() => {
        const inputs = document.querySelectorAll<HTMLInputElement>('.filter-value-input')
        inputs[Math.min(prevIdx, filters.value.length - 1)]?.focus()
      })
    }
    return
  }

  if (activeFilterIndex.value !== idx) return

  if (e.key === 'ArrowDown') {
    if (!filterSuggestions.value.length) return
    e.preventDefault()
    highlightedIndex.value = (highlightedIndex.value + 1) % filterSuggestions.value.length
    scrollHighlightedIntoView()
  } else if (e.key === 'ArrowUp') {
    if (!filterSuggestions.value.length) return
    e.preventDefault()
    highlightedIndex.value = highlightedIndex.value <= 0
      ? filterSuggestions.value.length - 1
      : highlightedIndex.value - 1
    scrollHighlightedIntoView()
  } else if (e.key === 'Escape') {
    filterSuggestions.value = []
    activeFilterIndex.value = null
    highlightedIndex.value = -1
  }
}

let globalKeyHandler: ((e: KeyboardEvent) => void) | undefined

watch(showEditDialog, (open) => {
  themeEditorOpen.value = open
  if (open) {
    globalKeyHandler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        saveTheme()
      }
    }
    document.addEventListener('keydown', globalKeyHandler)
  } else {
    if (globalKeyHandler) {
      document.removeEventListener('keydown', globalKeyHandler)
      globalKeyHandler = undefined
    }
    void discardStagedThemeImages()
  }
}, { immediate: true })

const selectFilterSuggestion = (idx: number, suggestion: { label: string; value: string }) => {
  if (filters.value[idx]) {
    filters.value[idx].value = suggestion.value
  }
  highlightedIndex.value = -1
  filterSuggestions.value = []
  activeFilterIndex.value = null
}

const hideFilterSuggestions = () => {
  setTimeout(() => {
    highlightedIndex.value = -1
    filterSuggestions.value = []
    activeFilterIndex.value = null
  }, 150)
}

const filterRecommendations = ref<{ type: string; value: string; label: string }[]>([])
let recommendTimeout: ReturnType<typeof setTimeout> | undefined

const fetchFilterRecommendations = async () => {
  const active = filters.value.filter(f => f.value.trim())
  if (!active.length && !form.value.name.trim()) {
    filterRecommendations.value = []
    return
  }

  try {
    const res = await $fetch<{ data: { type: string; value: string; label: string }[] }>('/api/admin/themes/filter-recommendations', {
      method: 'POST',
      body: {
        name: form.value.name,
        filters: active.map(f => ({ type: f.type, value: f.value })),
      },
    })
    filterRecommendations.value = res.data || []
  } catch {
    filterRecommendations.value = []
  }
}

const scheduleFilterRecommendations = () => {
  if (recommendTimeout) clearTimeout(recommendTimeout)
  recommendTimeout = setTimeout(fetchFilterRecommendations, 400)
}

const applyFilterRecommendation = (r: { type: string; value: string; label: string }) => {
  filters.value.push({ id: undefined, type: r.type, value: r.value })
  filterRecommendations.value = filterRecommendations.value.filter(
    rec => !(rec.type === r.type && rec.value === r.value)
  )
}

watch([filters, () => form.value.name], scheduleFilterRecommendations, { deep: true })

const addFilter = () => {
  filters.value.push({ id: undefined, type: 'keyword', value: '' })
}

const removeFilter = async (idx: number) => {
  const filter = filters.value[idx]
  if (filter.id) {
    try {
      await $fetch(`/api/admin/themes/${editingThemeId.value}/filters/${filter.id}`, { method: 'DELETE' })
    } catch {
      showErrorToast(null, { title: $t('toast_error') as string, fallback: $t('error_delete_filter') as string })
      return
    }
  }
  filters.value.splice(idx, 1)
}

const saveTheme = async () => {
  if (submitting.value) return
  if (!form.value.name.trim() || !form.value.slug.trim()) return
  submitting.value = true
  try {
    const payload: any = {
      slug: form.value.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      name: form.value.name.trim(),
      description: form.value.description.trim() || null,
      image_url: form.value.image_url.trim() || null,
      image_alt: form.value.image_alt.trim() || null,
      image_credit: form.value.image_credit.trim() || null,
      image_source_url: form.value.image_source_url.trim() || null,
      image_license: form.value.image_license.trim() || null,
      image_date: form.value.image_date.trim() || null,
      image_location: form.value.image_location.trim() || null,
      mobile_image_url: form.value.mobile_image_url.trim() || null,
      mobile_image_alt: form.value.mobile_image_alt.trim() || null,
      mobile_image_credit: form.value.mobile_image_credit.trim() || null,
      mobile_image_source_url: form.value.mobile_image_source_url.trim() || null,
      mobile_image_license: form.value.mobile_image_license.trim() || null,
      mobile_image_date: form.value.mobile_image_date.trim() || null,
      mobile_image_location: form.value.mobile_image_location.trim() || null,
      language: form.value.language || null,
      translations: translations.value
        .filter(t => t.language && t.name.trim())
        .map(t => ({ language: t.language, name: t.name.trim(), description: t.description.trim() || null, home_copy: parseHomeCopy(t.home_copy_json) })),
      is_active: form.value.is_active,
      is_default: form.value.is_default,
      scheduled_start: form.value.scheduled_start || null,
      scheduled_end: form.value.scheduled_end || null,
      priority: form.value.priority || 0,
      config: { color_primary: form.value.color_primary, color_secondary: form.value.color_secondary, featured_quote_id: form.value.featured_quote_id || null, featured_reference_id: form.value.featured_reference_id || null },
    }

    if (editMode.value && editingThemeId.value) {
      await $fetch(`/api/admin/themes/${editingThemeId.value}`, { method: 'PUT', body: payload })

      const existingFilterIds = new Set(filters.value.filter(f => f.id).map(f => f.id))
      for (const filter of filters.value) {
        if (!filter.id) {
          await $fetch(`/api/admin/themes/${editingThemeId.value}/filters`, {
            method: 'POST',
            body: { type: filter.type, value: filter.value, match_mode: 'any' },
          })
        }
      }


    } else {
      const res = await $fetch('/api/admin/themes', { method: 'POST', body: payload })
      const newId = res?.data?.id

      if (newId) {
        for (const filter of filters.value) {
          if (filter.value.trim()) {
            await $fetch(`/api/admin/themes/${newId}/filters`, {
              method: 'POST',
              body: { type: filter.type, value: filter.value, match_mode: 'any' },
            })
          }
        }
      }
    }

    const stagedUrlsUsedBySavedTheme = new Set(
      [form.value.image_url, form.value.mobile_image_url].filter(isStagedThemeImageUrl),
    )
    const unusedStagedUrls = stagedThemeImageUrls.value.filter(url => !stagedUrlsUsedBySavedTheme.has(url))
    stagedThemeImageUrls.value = []
    await Promise.allSettled(unusedStagedUrls.map(deleteStagedThemeImage))
    showEditDialog.value = false
    await loadThemes()
  } catch (error: any) {
    console.error('Error saving theme:', error)
    if (error?.statusCode === 409) {
      showErrorToast(error, { title: $t('error_duplicate_slug') as string })
      return
    }
    showErrorToast(error, { title: $t('toast_error') as string })
  } finally {
    submitting.value = false
  }
}

const confirmDelete = async () => {
  if (deleteDisabled.value) return
  submitting.value = true
  try {
    if (themeToDelete.value) {
      await $fetch(`/api/admin/themes/${themeToDelete.value.id}`, { method: 'DELETE' })

    } else {
      const ids = [...selectedIds.value]
      const results = await Promise.allSettled(ids.map(id => $fetch(`/api/admin/themes/${id}`, { method: 'DELETE' })))
      const failed = results.filter(r => r.status === 'rejected').length
      useToast().toast({ toast: failed ? 'outline-warning' : 'soft-success', title: $t('toast_deleted', { n: ids.length - failed, s: ids.length - failed !== 1 ? 's' : '' }) as string })
    }
    showDeleteDialog.value = false
    themeToDelete.value = null
    rowSelection.value = {}
    await loadThemes()
  } catch (e) {
    showErrorToast(e, $t('error_delete_theme') as string)
  } finally {
    submitting.value = false
  }
}

const toggleActive = async (theme: any, isActive: boolean) => {
  try {
    await $fetch(`/api/admin/themes/${theme.id}/activate`, { method: 'PUT', body: { is_active: isActive } })
    await loadThemes()
  } catch {
    showErrorToast(null, { title: $t('toast_error') as string, fallback: $t('error_toggle') as string })
  }
}

const toggleDefault = async (theme: any, isDefault: boolean) => {
  try {
    await $fetch(`/api/admin/themes/${theme.id}/default`, { method: 'PUT', body: { is_default: isDefault } })
    await loadThemes()
  } catch {
    showErrorToast(null, { title: $t('toast_error') as string, fallback: $t('error_toggle_default') as string })
  }
}

const formatDate = (val: any) => {
  if (!val) return '—'
  const d = new Date(val)
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString()
}

const formatDatetimeForInput = (val: any) => {
  if (!val) return ''
  const d = new Date(val)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 16)
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
  themeEditorOpen.value = false
  if (footerObserver) footerObserver.disconnect()
  window.removeEventListener('resize', updateFooterPosition)
})

watchDebounced([currentPage, searchQuery, selectedSort], () => { loadThemes() }, { debounce: 300 })
onMounted(() => { loadThemes() })
</script>

<style scoped>
@keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in-up { animation: fade-in-up 0.5s ease-out both; }
</style>
