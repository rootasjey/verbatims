<template>
  <div>
    <!-- Editorial Header -->
    <div data-admin-page-header class="pb-6 mb-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
            {{ $t('title') }}
          </h1>
        </div>
        <div class="hidden md:flex items-center gap-3">
          <AdminSearchToggle v-model="searchQuery" :placeholder="$t('search_placeholder') as string" :close-label="$t('common.close') as string" />
          <NCombobox
            v-model="selectedSort"
            :items="sortOptions"
            by="value"
            :_combobox-list="{
              class: 'min-w-[200px]',
              align: 'end',
            }"
            :_combobox-trigger="{
              btn: 'outline-gray',
              size: 'sm',
              trailing: 'i-lucide-chevron-down',
              class: 'gap-1 px-2 text-sm leading-normal font-normal w-fit min-w-0 rounded-md border-[#d2cfc6] bg-[#f0efe9] dark:border-white/15 dark:bg-white/[0.06]',
            }"
          >
            <template #trigger="{ modelValue }">
              <span class="text-xs font-medium leading-none">{{ modelValue?.label }}</span>
            </template>
          </NCombobox>
          <NCombobox v-model="selectedAuditProgress" :items="auditProgressFilterOptions" by="value" :_combobox-list="{ class: 'min-w-[200px]' }" :_combobox-trigger="{ btn: 'outline-gray', size: 'sm', trailing: 'i-lucide-chevron-down', class: 'gap-1 px-2 text-sm leading-normal font-normal w-fit min-w-0 rounded-md border-[#d2cfc6] bg-[#f0efe9] dark:border-white/15 dark:bg-white/[0.06]' }">
            <template #trigger="{ modelValue }"><span class="text-xs font-medium leading-none">{{ modelValue?.label }}</span></template>
          </NCombobox>
        </div>
      </div>
      <!-- Mobile search -->
      <div class="md:hidden mt-4 space-y-2">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('search_placeholder_mobile') as string"
          class="w-full font-sans text-sm bg-transparent border-b border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400"
        />
        <div class="flex flex-wrap items-center gap-2">
          <NCombobox
            v-model="selectedSort"
            :items="sortOptions"
            by="value"
            :_combobox-list="{
              class: 'min-w-[200px]',
            }"
            :_combobox-trigger="{
              btn: 'outline-gray',
              size: 'xs',
              trailing: 'i-lucide-chevron-down',
              class: 'gap-1 px-2 text-xs leading-normal font-normal w-fit min-w-0 rounded-md border-[#d2cfc6] bg-[#f0efe9] dark:border-white/15 dark:bg-white/[0.06]',
            }"
          >
            <template #trigger="{ modelValue }">
              <span class="text-xs leading-none">{{ modelValue?.label }}</span>
            </template>
          </NCombobox>
          <NCombobox
            v-model="selectedLanguage"
            :items="languageOptions"
            by="value"
            :_combobox-input="{
              placeholder: $t('common.all_languages') as string,
              class: 'text-xs',
            }"
            :_combobox-list="{ class: 'min-w-[200px]' }"
            :_combobox-trigger="{
              btn: 'outline-gray',
              size: 'xs',
              trailing: 'i-lucide-chevron-down',
              class: 'gap-1 px-2 text-xs leading-normal font-normal w-fit min-w-0 rounded-md border-[#d2cfc6] bg-[#f0efe9] dark:border-white/15 dark:bg-white/[0.06]',
            }"
          >
            <template #trigger="{ modelValue }">
              <span class="text-xs leading-none">{{ modelValue?.label || $t('common.all_languages') }}</span>
            </template>
          </NCombobox>
          <NCombobox v-model="selectedAuditProgress" :items="auditProgressFilterOptions" by="value" :_combobox-list="{ class: 'min-w-[200px]' }" :_combobox-trigger="{ btn: 'outline-gray', size: 'xs', trailing: 'i-lucide-chevron-down', class: 'gap-1 px-2 text-xs leading-normal font-normal w-fit min-w-0 rounded-md border-[#d2cfc6] bg-[#f0efe9] dark:border-white/15 dark:bg-white/[0.06]' }">
            <template #trigger="{ modelValue }"><span class="text-xs leading-none">{{ modelValue?.label }}</span></template>
          </NCombobox>
        </div>
      </div>
      <section class="mt-5 rounded-xl border border-gray-200 bg-white/60 p-4 dark:border-gray-800 dark:bg-white/[0.03]" :aria-label="$t('audit_schedule_title') as string">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-48">
            <h2 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">{{ $t('audit_schedule_title') }}</h2>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ $t('audit_schedule_pilot', { count: quoteAuditConfig.pilotCount, reviewed: quoteAuditConfig.pilotReviewedCount }) }}
              <span aria-hidden="true"> · </span>
              {{ quoteAuditConfig.provider.valid ? $t('audit_openrouter_key_ready') : $t('audit_openrouter_key_missing') }}
              <template v-if="quoteAuditConfig.provider.valid"> · {{ quoteAuditConfig.provider.model }}</template>
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <label class="sr-only" for="quote-audit-mode">{{ $t('audit_schedule_mode') }}</label>
            <select id="quote-audit-mode" v-model="quoteAuditConfig.mode" class="rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-[#171615] dark:text-gray-100">
              <option value="paused">{{ $t('audit_schedule_paused') }}</option>
              <option value="pilot" :disabled="!quoteAuditConfig.provider.valid">{{ $t('audit_schedule_pilot_mode') }}</option>
              <option value="continuous" :disabled="!quoteAuditConfig.provider.valid || quoteAuditConfig.pilotCount < 20 || quoteAuditConfig.pilotReviewedCount < 20">{{ $t('audit_schedule_continuous') }}</option>
            </select>
            <label class="sr-only" for="quote-audit-cadence">{{ $t('audit_schedule_cadence') }}</label>
            <select id="quote-audit-cadence" v-model="quoteAuditConfig.cadence" class="rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-[#171615] dark:text-gray-100">
              <option value="weekdays">{{ $t('audit_schedule_weekdays') }}</option>
              <option value="weekly">{{ $t('audit_schedule_weekly') }}</option>
            </select>
            <NButton btn="outline-gray" size="sm" :disabled="loadingQuoteAuditConfig || runningQuoteAuditTest || quoteAuditConfig.pilotCount > 0 || !quoteAuditConfig.provider.valid" @click="runQuoteAuditTest">
              {{ runningQuoteAuditTest ? $t('audit_test_running') : $t('audit_test_one_quote') }}
            </NButton>
            <NButton btn="solid-primary" size="sm" :disabled="loadingQuoteAuditConfig || savingQuoteAuditConfig || (quoteAuditConfig.mode !== 'paused' && !quoteAuditConfig.provider.valid) || (quoteAuditConfig.mode === 'continuous' && quoteAuditConfig.pilotReviewedCount < 20)" @click="saveQuoteAuditConfig">
              {{ savingQuoteAuditConfig ? $t('audit_schedule_saving') : $t('audit_schedule_save') }}
            </NButton>
          </div>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <label class="sr-only" for="quote-audit-openrouter-key">{{ $t('audit_openrouter_key_label') }}</label>
          <input id="quote-audit-openrouter-key" v-model="openRouterKey" type="password" autocomplete="off" spellcheck="false" :placeholder="$t('audit_openrouter_key_placeholder') as string" class="min-w-64 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-[#171615] dark:text-gray-100" :disabled="savingOpenRouterKey || loadingQuoteAuditConfig">
          <NButton btn="outline-gray" size="sm" :disabled="savingOpenRouterKey || !openRouterKey.trim()" @click="saveOpenRouterKey">
            {{ savingOpenRouterKey ? $t('audit_openrouter_key_saving') : $t('audit_openrouter_key_save') }}
          </NButton>
          <NButton v-if="quoteAuditConfig.provider.configured" btn="outline-gray" size="sm" :disabled="savingOpenRouterKey" @click="removeOpenRouterKey">
            {{ $t('audit_openrouter_key_remove') }}
          </NButton>
        </div>
        <p v-if="quoteAuditConfig.provider.configured && !quoteAuditConfig.provider.valid" class="mt-2 text-xs text-amber-700 dark:text-amber-300">
          {{ quoteAuditConfig.provider.status === 'rejected' ? $t('audit_openrouter_key_rejected') : quoteAuditConfig.provider.status === 'model_unavailable' ? $t('audit_openrouter_model_unavailable') : $t('audit_openrouter_key_unavailable') }}
        </p>
        <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">{{ $t('audit_openrouter_key_note') }}</p>
        <p v-if="quoteAuditConfig.mode === 'continuous' && quoteAuditConfig.pilotReviewedCount < 20" class="mt-2 text-xs text-amber-700 dark:text-amber-300">
          {{ $t('audit_schedule_review_pilot_first') }}
        </p>
        <div v-if="quoteAuditTestReport" class="mt-4 rounded-lg border border-gray-200 p-3 text-xs dark:border-gray-800" aria-live="polite">
          <p class="font-600 text-gray-900 dark:text-gray-100">{{ $t('audit_test_result', { id: quoteAuditTestReport.insertedIds[0] ?? quoteAuditTestReport.selectedIds[0] ?? '—' }) }}</p>
          <p v-if="quoteAuditTestReport.error" class="mt-1 text-red-700 dark:text-red-300">{{ quoteAuditTestReport.error }}</p>
          <template v-else>
            <p class="mt-1 text-gray-600 dark:text-gray-300">{{ $t('audit_test_outcome', { outcome: quoteAuditTestReport.results[0]?.outcome ?? 'inconclusive' }) }}</p>
            <p v-if="quoteAuditTestReport.uncertainIds.length" class="mt-1 text-amber-800 dark:text-amber-200">{{ $t('audit_test_uncertain') }}</p>
            <ul v-if="quoteAuditTestReport.results[0]?.sources.length" class="mt-2 space-y-1">
              <li v-for="source in quoteAuditTestReport.results[0].sources" :key="`${source.dimension}-${source.url}`">
                <span class="text-gray-500 dark:text-gray-400">{{ $t(`audit_dimension_${source.dimension}`) }} · </span>
                <a :href="source.url" target="_blank" rel="noopener noreferrer" class="text-blue-700 underline underline-offset-2 dark:text-blue-300">{{ source.title || source.url }}</a>
              </li>
            </ul>
          </template>
          <p class="mt-2 text-gray-500 dark:text-gray-400">{{ $t('audit_evidence_human_review') }}</p>
        </div>
      </section>
    </div>

    <!-- First-load Skeleton -->
    <div v-if="!hasLoadedOnce && loading" class="space-y-5">
      <div v-for="i in 5" :key="i" class="animate-pulse pb-5 border-b border-gray-100 dark:border-gray-800">
        <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4 mb-2" />
        <div class="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-2" />
        <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="hasLoadedOnce && filteredQuotes.length === 0" class="py-16 text-center">
      <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">
        {{ searchQuery ? $t('empty_search_title') : $t('empty_title') }}
      </p>
      <p class="font-sans text-sm text-gray-500 dark:text-gray-400 mb-6">
        {{ searchQuery ? $t('empty_desc') : $t('empty_desc_default') }}
      </p>
    </div>

    <!-- Table -->
    <div v-else-if="hasLoadedOnce">
      <div class="border border-gray-200 dark:border-gray-700 rounded-xl overflow-x-auto">
        <table class="w-full min-w-[900px]">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0C0A09]">
              <th class="w-10 px-3 py-3 text-left">
                <NCheckbox
                  checkbox="gray"
                  :model-value="allSelected"
                  @update:model-value="toggleAllSelection"
                />
              </th>
              <th class="px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('common.quote_singular') }}</th>
              <th class="w-28 px-3 py-2 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <div class="flex items-center gap-1.5">
                  <span>{{ $t('col_language') }}</span>
                  <NTooltip :content="$t('filter_by_language', { selected: (selectedLanguage.label || $t('common.all_languages')) as string }) as string">
                    <NCombobox
                      v-model="selectedLanguage"
                      :items="languageOptions"
                      by="value"
                      :_combobox-input="{
                        placeholder: $t('common.all_languages') as string,
                        class: 'text-xs',
                      }"
                      :_combobox-list="{ class: 'min-w-[200px]' }"
                      :_combobox-trigger="{
                        btn: 'outline-gray',
                        size: 'xs',
                        trailing: '',
                        class: 'relative !inline-flex !h-6 !min-h-6 !w-6 !min-w-6 !items-center !justify-center !px-0 !py-0 rounded-md border-[#d2cfc6] bg-[#f0efe9] dark:border-white/15 dark:bg-white/[0.06]',
                        ariaLabel: $t('filter_by_language', { selected: (selectedLanguage.label || $t('common.all_languages')) as string }) as string,
                      }"
                    >
                      <template #trigger>
                        <NIcon name="i-lucide-list-filter" class="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
                        <span v-if="selectedLanguage.value" class="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-gray-900 dark:bg-gray-100" aria-hidden="true" />
                      </template>
                    </NCombobox>
                  </NTooltip>
                </div>
              </th>
              <th class="w-32 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('col_user') }}</th>
              <th class="w-20 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('common.status') }}</th>
              <th class="w-40 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ $t('audit_column') }}</th>
              <th class="w-36 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <div class="inline-flex items-center gap-1">
                  <span>{{ $t('col_published') }}</span>
                  <AdminSortButton
                    :direction="sortDirectionFor('oldest', 'newest')"
                    :ascending-label="$t('sort_oldest_first') as string"
                    :descending-label="$t('sort_most_recent') as string"
                    @toggle="toggleSort('oldest', 'newest')"
                  />
                </div>
              </th>
              <th class="w-10 px-3 py-3 text-left"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <ContextMenu
              v-for="(quote, idx) in filteredQuotes"
              :key="quote.id"
              size="xs"
              native-on-modifier="ctrl"
              :items="getQuoteActions(quote)"
              as-child
              ignore-interactive-targets
            >
              <tr
              :data-highlighted="idx === highlightedRowIndex ? 'true' : undefined"
              :class="[
                'animate-fade-in-up transition-colors group',
                { 'bg-[#FAFAF9] dark:bg-[#1C1B1A]': idx === highlightedRowIndex },
                { 'bg-indigo-50/50 dark:bg-indigo-950/30': !!rowSelection[quote.id] }
              ]"
              :style="{ animationDelay: `${idx * 0.03}s` }"
            >
              <td class="px-3 py-3">
                <div :class="[Object.keys(rowSelection).length > 0 ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity']">
                  <NCheckbox
                    checkbox="gray"
                    :model-value="!!rowSelection[quote.id]"
                    @click="handleRowCheckboxClick($event, idx, quote.id)"
                  />
                </div>
              </td>
              <td class="px-3 py-3 max-w-md">
                <blockquote class="font-body text-sm text-gray-900 dark:text-gray-100 leading-relaxed line-clamp-2 mb-1">
                  {{ quote.name }}
                </blockquote>
                <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <template v-if="quote.author?.name">
                    <ContextMenu v-if="quote.author?.id" size="xs" native-on-modifier="ctrl" :items="getAuthorActions(quote)">
                      <span class="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors">{{ quote.author.name }}</span>
                    </ContextMenu>
                    <span v-else>{{ quote.author.name }}</span>
                  </template>
                  <span v-if="quote.author?.name && quote.reference?.name">&middot;</span>
                  <template v-if="quote.reference?.name">
                    <ContextMenu v-if="quote.reference?.id" size="xs" native-on-modifier="ctrl" :items="getReferenceActions(quote)">
                      <span class="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors">{{ quote.reference.name }}</span>
                    </ContextMenu>
                    <span v-else>{{ quote.reference.name }}</span>
                  </template>
                </div>
              </td>
              <td class="px-3 py-3">
                <NCombobox
                  :model-value="getLanguageOption(quote.language)"
                  @update:model-value="onLanguageChange(quote, $event)"
                  :items="inlineLanguageOptions"
                  by="value"
                  :_combobox-input="{
                    placeholder: 'Search language...',
                    class: 'text-xs',
                  }"
                  :_combobox-list="{
                    class: 'min-w-[100px]',
                  }"
                  :_combobox-trigger="{
                    btn: 'ghost-gray',
                    size: 'xs',
                    trailing: '',
                    class: 'gap-1 px-1 text-xs font-normal w-full min-w-0 h-auto justify-start',
                  }"
                >
                  <template #trigger="{ modelValue }">
                    {{ modelValue?.label || quote.language }}
                  </template>
                </NCombobox>
              </td>
              <td class="px-3 py-3">
                <span v-if="quote.user_name" class="font-sans text-sm text-gray-900 dark:text-gray-100">
                  {{ quote.user_name }}
                </span>
                <span v-else class="font-sans text-sm text-gray-400 dark:text-gray-500 italic">
                  {{ $t('common.unknown') }}
                </span>
              </td>
              <td class="px-3 py-3">
                <NCombobox
                  :model-value="getStatusOption(quote.status)"
                  @update:model-value="onStatusChange(quote, $event)"
                  :items="statusOptions"
                  by="value"
                  :_combobox-input="{
                    placeholder: 'Change status...',
                    class: 'text-xs',
                  }"
                  :_combobox-list="{
                    class: 'min-w-[100px]',
                  }"
                  :_combobox-trigger="getStatusTriggerProps(quote.status)"
                >
                  <template #trigger="{ modelValue }">
                    {{ modelValue?.label }}
                  </template>
                </NCombobox>
              </td>
              <td class="px-3 py-3">
                <button
                  class="flex max-w-40 flex-col items-start gap-0.5 rounded-md px-2 py-1 text-left transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 dark:hover:bg-white/10"
                  :aria-label="$t('audit_edit', { quote: quote.name }) as string"
                  @click="openAuditReview(quote)"
                >
                  <span class="text-xs font-medium text-gray-800 dark:text-gray-200">{{ auditProgressLabel(quote.audit_progress) }}</span>
                  <span class="max-w-full truncate text-[11px] text-gray-500 dark:text-gray-400">{{ auditOutcomeLabel(quote.audit_outcome) }}</span>
                </button>
              </td>
              <td class="px-3 py-3 font-sans text-xs text-gray-500 dark:text-gray-400">
                {{ formatRelativeTime(quote.moderated_at || quote.created_at) }}
              </td>
              <td class="px-3 py-3">
                <NDropdownMenu :items="getQuoteActions(quote)" :modal="false">
                  <button
                    @click.stop
                    class="p-1 rounded-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <NIcon name="i-ph-dots-three-vertical" class="w-4 h-4" />
                  </button>
                </NDropdownMenu>
              </td>
              </tr>
            </ContextMenu>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1 || selectedQuotes.length > 0" class="h-20" />
    </div>

    <div
      v-if="totalPages > 1 || selectedQuotes.length > 0"
      class="fixed bottom-0 z-20 flex items-center justify-between gap-4 rounded-t-2xl border border-b-0 border-[#d8d4cb] bg-[#e7e4dd] px-5 py-3 shadow-[0_-6px_18px_rgba(12,10,9,0.06)] transition-[left,width] duration-300 ease-in-out dark:border-white/10 dark:bg-[#17191e] sm:px-8 lg:px-12"
      :style="{ left: footerLeftOffset + 'px', width: footerWidth }"
    >
      <span class="shrink-0 font-sans text-xs text-gray-500 dark:text-gray-400">
        Page
        <button
          class="rounded-md px-1.5 py-0.5 font-medium text-gray-800 transition-colors hover:bg-black/5 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white"
          @click="showPageJumpDialog = true"
        >
          {{ currentPage }}
        </button>
        of {{ totalPages }}
      </span>
      <DashboardBulkSelectionControls
        :selection-mode="selectedQuotes.length > 0"
        :selected-count="selectedQuotes.length"
        :visible-count="filteredQuotes.length"
        :actions="bulkSelectionActions"
        @toggle-visible="selectAllOnPage"
        @clear="clearSelection"
        @exit-mode="clearSelection"
        @action="onBulkSelectionAction"
      />
      <div class="ml-auto flex shrink-0 items-center gap-2">
        <NButton v-if="currentPage > 1" btn="outline-gray" size="sm" rounded="full" :aria-label="$t('common.previous') as string" class="px-2 font-sans text-xs transition-transform active:scale-98 sm:px-4" @click="currentPage = Math.max(1, currentPage - 1)">
          <NIcon name="i-tabler-arrow-left" class="h-4 w-4" /><span class="sr-only sm:not-sr-only">{{ $t('common.previous') }}</span>
        </NButton>
        <NButton v-if="currentPage < totalPages" btn="outline-gray" size="sm" rounded="full" :aria-label="$t('common.next') as string" class="px-2 font-sans text-xs transition-transform active:scale-98 sm:px-4" @click="currentPage = Math.min(totalPages, currentPage + 1)">
          <span class="sr-only sm:not-sr-only">{{ $t('common.next') }}</span><NIcon name="i-tabler-arrow-right" class="h-4 w-4" />
        </NButton>
      </div>
    </div>

    <ClientOnly>
      <AddQuoteDialog
        v-model="showEditQuoteDialog"
        :edit-quote="selectedQuote"
        @quote-updated="onQuoteUpdated"
      />
    </ClientOnly>

    <ClientOnly>
      <AddAuthorDialog
        v-model="showEditAuthorDialog"
        :edit-author="authorToEdit"
        @author-updated="onAuthorUpdated"
      />
    </ClientOnly>

    <ClientOnly>
      <AddReferenceDialog
        v-model="showEditReferenceDialog"
        :edit-reference="referenceToEdit"
        @reference-updated="onReferenceUpdated"
      />
    </ClientOnly>

    <AddToCollectionBulkModal
      v-if="selectedQuotes.length > 0"
      v-model="showBulkAddToCollection"
      :quote-ids="selectedQuotes"
      @added="handleBulkAddedToCollection"
    />

    <ClientOnly>
      <BulkEditQuotesDialog
        v-model:open="showBulkEditDialog"
        :selected-quotes="selectedQuotesData"
        @updated="onBulkEditComplete"
      />
    </ClientOnly>

    <ClientOnly>
      <NDialog v-model:open="showBulkUnpublishModal">
        <template #header>
          <h3 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">Unpublish {{ selectedQuotes.length }} {{ selectedQuotes.length === 1 ? 'Quote' : 'Quotes' }}</h3>
        </template>
        <p class="font-sans text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to unpublish {{ selectedQuotes.length }} {{ selectedQuotes.length === 1 ? 'quote' : 'quotes' }}?
          They will be moved back to drafts.
        </p>
        <template #footer>
          <div class="flex justify-end gap-3">
            <button class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-3 py-1.5" @click="showBulkUnpublishModal = false">Cancel</button>
            <OutlinedButton variant="destructive" @click="bulkUnpublish(); showBulkUnpublishModal = false">Unpublish All</OutlinedButton>
          </div>
        </template>
      </NDialog>
    </ClientOnly>

    <ClientOnly>
      <NDialog v-model:open="showAuditDialog" :una="{ dialogContent: 'w-[calc(100vw-2rem)] max-w-xl' }">
        <template #header>
          <h3 class="font-serif text-xl font-400 text-gray-900 dark:text-gray-100">{{ $t('audit_title') }}</h3>
        </template>
        <p v-if="auditQuote" class="mb-5 line-clamp-3 font-body text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          “{{ auditQuote.name }}”
          <span v-if="auditQuote.author?.name" class="block pt-1 font-sans text-xs text-gray-500">{{ auditQuote.author.name }}<template v-if="auditQuote.reference?.name"> · {{ auditQuote.reference.name }}</template></span>
        </p>
        <section v-if="auditEvidence" class="mb-5 max-h-[42vh] space-y-3 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-800" :aria-label="$t('audit_evidence_title') as string">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h4 class="font-sans text-sm font-600 text-gray-900 dark:text-gray-100">{{ $t('audit_evidence_title') }}</h4>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ auditEvidence.summary }}</p>
              <p class="mt-1 text-[11px] text-gray-400 dark:text-gray-500">{{ $t('audit_evidence_date', { date: formatRelativeTime(auditEvidence.auditedAt) }) }}</p>
            </div>
            <span class="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-500 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">{{ $t('audit_progress_awaiting_review') }}</span>
          </div>
          <div v-for="(finding, dimension) in auditEvidence.dimensions" :key="dimension" class="border-t border-gray-100 pt-3 first:border-0 first:pt-0 dark:border-gray-800">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h5 class="font-sans text-xs font-600 text-gray-800 dark:text-gray-200">{{ $t(`audit_dimension_${dimension}`) }}</h5>
              <span class="text-[11px] text-gray-500 dark:text-gray-400">{{ $t(`audit_evidence_status_${finding.status}`) }}</span>
            </div>
            <p class="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">{{ finding.assessment }}</p>
            <p v-if="finding.evidenceLocation" class="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{{ $t('audit_evidence_location') }}: {{ finding.evidenceLocation }}</p>
            <ul v-if="finding.sources?.length" class="mt-2 space-y-1">
              <li v-for="source in finding.sources" :key="source.url" class="text-xs">
                <a :href="source.url" target="_blank" rel="noopener noreferrer" class="text-blue-700 underline decoration-blue-300 underline-offset-2 hover:decoration-blue-700 dark:text-blue-300">{{ source.title || source.url }}</a>
                <span class="ml-1 text-gray-500 dark:text-gray-400">{{ $t(`audit_source_level_${source.sourceLevel}`) }}<template v-if="source.support"> — {{ source.support }}</template></span>
              </li>
            </ul>
            <ul v-if="finding.caveats?.length" class="mt-2 list-disc space-y-1 pl-4 text-[11px] text-amber-800 dark:text-amber-200"><li v-for="caveat in finding.caveats" :key="caveat">{{ caveat }}</li></ul>
          </div>
          <p class="border-t border-gray-100 pt-2 text-[11px] text-gray-500 dark:border-gray-800 dark:text-gray-400">{{ $t('audit_evidence_human_review') }}</p>
        </section>
        <div class="space-y-4">
          <label class="block space-y-1.5">
            <span class="font-sans text-xs font-medium text-gray-700 dark:text-gray-300">{{ $t('audit_progress_label') }}</span>
            <select v-model="auditDraft.progress" class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-[#171615] dark:text-gray-100">
              <option v-for="option in auditProgressOptions" :key="option.value" :value="option.value">{{ $t(option.labelKey) }}</option>
            </select>
          </label>
          <label class="block space-y-1.5">
            <span class="font-sans text-xs font-medium text-gray-700 dark:text-gray-300">{{ $t('audit_outcome_label') }}</span>
            <select v-model="auditDraft.outcome" class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-[#171615] dark:text-gray-100">
              <option value="">{{ $t('audit_outcome_none') }}</option>
              <option v-for="option in auditOutcomeOptions" :key="option.value" :value="option.value">{{ $t(option.labelKey) }}</option>
            </select>
            <span class="block text-[11px] text-gray-500 dark:text-gray-400">{{ $t('audit_outcome_hint') }}</span>
          </label>
          <label class="block space-y-1.5">
            <span class="font-sans text-xs font-medium text-gray-700 dark:text-gray-300">{{ $t('audit_notes_label') }}</span>
            <textarea v-model="auditDraft.notes" rows="4" maxlength="5000" class="w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 font-sans text-sm text-gray-900 dark:border-gray-700 dark:bg-[#171615] dark:text-gray-100" :placeholder="$t('audit_notes_placeholder') as string" />
          </label>
          <p v-if="auditQuote?.audit_reviewed_at" class="text-[11px] text-gray-500 dark:text-gray-400">{{ $t('audit_last_reviewed', { date: formatRelativeTime(auditQuote.audit_reviewed_at) }) }}</p>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <NButton btn="ghost-gray" size="sm" @click="showAuditDialog = false">{{ $t('common.cancel') }}</NButton>
            <NButton btn="solid-primary" size="sm" :disabled="savingAudit" @click="saveAuditReview">{{ savingAudit ? $t('audit_saving') : $t('common.save') }}</NButton>
          </div>
        </template>
      </NDialog>
    </ClientOnly>

    <PageJumpDialog
      v-model="showPageJumpDialog"
      :total-pages="totalPages"
      @jump="onPageJump"
    />
  </div>
</template>

<script setup lang="ts">
import type { QuoteLanguage } from '~/types'
import type { QuoteAuditOutcome, QuoteAuditProgress } from '#shared/constants/quote-audit'
import type { LanguageOption } from '~/stores/language'
import { formatRelativeTime, getDateTimestamp } from '~/utils/time-formatter'
import { useAdminKeyboardShortcuts } from '~/composables/useAdminKeyboardShortcuts'
import { useTableKeyboardNav } from '~/composables/useTableKeyboardNav'
import { useErrorToast } from '~/composables/useErrorToast'

const { showErrorToast } = useErrorToast()

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const { $t } = useI18n()

const quoteAuditConfig = reactive({
  mode: 'paused' as 'paused' | 'pilot' | 'continuous',
  cadence: 'weekdays' as 'weekdays' | 'weekly',
  provider: {
    configured: false,
    valid: false,
    model: 'openai/gpt-5-nano',
    modelAvailable: false,
    status: null as 'rejected' | 'model_unavailable' | 'unavailable' | null,
  },
  pilotCount: 0,
  pilotReviewedCount: 0,
})
const loadingQuoteAuditConfig = ref(true)
const savingQuoteAuditConfig = ref(false)
const runningQuoteAuditTest = ref(false)
const savingOpenRouterKey = ref(false)
const openRouterKey = ref('')
const quoteAuditTestReport = ref<{
  selectedIds: number[]
  insertedIds: number[]
  uncertainIds: number[]
  error: string | null
  results: Array<{ quoteId: number, outcome: QuoteAuditOutcome, sources: Array<{ dimension: string, url: string, title: string }> }>
} | null>(null)

const loadQuoteAuditConfig = async () => {
  loadingQuoteAuditConfig.value = true
  try {
    const response = await $fetch<{ data: typeof quoteAuditConfig }>('/api/admin/quote-audit/config')
    Object.assign(quoteAuditConfig, response.data)
  } catch (error) {
    showErrorToast(error, $t('audit_schedule_load_error') as string)
  } finally {
    loadingQuoteAuditConfig.value = false
  }
}

const saveOpenRouterKey = async () => {
  savingOpenRouterKey.value = true
  try {
    await $fetch('/api/admin/quote-audit/openrouter', { method: 'PUT', body: { apiKey: openRouterKey.value } })
    openRouterKey.value = ''
    await loadQuoteAuditConfig()
  } catch (error) {
    showErrorToast(error, $t('audit_openrouter_key_error') as string)
  } finally {
    savingOpenRouterKey.value = false
  }
}

const removeOpenRouterKey = async () => {
  if (!window.confirm($t('audit_openrouter_key_remove_confirm') as string)) return
  savingOpenRouterKey.value = true
  try {
    await $fetch('/api/admin/quote-audit/openrouter', { method: 'DELETE' })
    await loadQuoteAuditConfig()
  } catch (error) {
    showErrorToast(error, $t('audit_openrouter_key_remove_error') as string)
  } finally {
    savingOpenRouterKey.value = false
  }
}

const saveQuoteAuditConfig = async () => {
  savingQuoteAuditConfig.value = true
  try {
    const response = await $fetch<{ data: { mode: typeof quoteAuditConfig.mode, cadence: typeof quoteAuditConfig.cadence } }>('/api/admin/quote-audit/config', {
      method: 'PUT',
      body: { mode: quoteAuditConfig.mode, cadence: quoteAuditConfig.cadence },
    })
    quoteAuditConfig.mode = response.data.mode
    quoteAuditConfig.cadence = response.data.cadence
    await loadQuoteAuditConfig()
  } catch (error) {
    showErrorToast(error, $t('audit_schedule_save_error') as string)
  } finally {
    savingQuoteAuditConfig.value = false
  }
}

const runQuoteAuditTest = async () => {
  runningQuoteAuditTest.value = true
  quoteAuditTestReport.value = null
  try {
    const response = await $fetch<{ data: typeof quoteAuditTestReport.value }>('/api/admin/quote-audit/test', { method: 'POST' })
    quoteAuditTestReport.value = response.data
    await loadQuoteAuditConfig()
  } catch (error) {
    showErrorToast(error, $t('audit_test_error') as string)
  } finally {
    runningQuoteAuditTest.value = false
  }
}

useHead({
  title: $t('meta_title') as string
})

const quotes = ref<AdminQuote[]>([])
const loading = ref(true)
const hasLoadedOnce = ref(false)
const searchQuery = ref('')
const selectedSort = ref({ label: $t('sort_most_recent') as string, value: 'newest' })
const currentPage = ref(1)
const pageSize = ref(50)
const totalQuotes = ref(0)

const languageStore = useLanguageStore()
const languageOptions = computed(() =>
  languageStore.availableLanguages.map((lang: LanguageOption) => ({
    label: lang.display,
    value: lang.value === 'all' ? '' : lang.value
  }))
)

const selectedLanguage = ref({ label: $t('common.all_languages') as string, value: '' })
const selectedAuditProgress = ref({ label: $t('audit_filter_all') as string, value: '' })
const auditProgressFilterOptions = computed(() => [
  { label: $t('audit_filter_all') as string, value: '' },
  ...auditProgressOptions.map(option => ({ label: $t(option.labelKey) as string, value: option.value })),
])

const inlineLanguageOptions = computed(() =>
  languageStore.availableLanguages
    .filter(lang => lang.value !== 'all')
    .map(lang => ({ label: lang.display, value: lang.value }))
)

const getLanguageOption = (lang: string | undefined) =>
  inlineLanguageOptions.value.find(opt => opt.value === lang) ?? null

const onLanguageChange = async (quote: AdminQuote, newLang: { label: string; value: string } | null) => {
  const newValue = newLang?.value
  if (!newValue || newValue === quote.language) return
  const previousLanguage = quote.language
  quote.language = newValue as QuoteLanguage
  try {
    await $fetch('/api/admin/quotes/bulk-edit', {
      method: 'POST',
      body: { quote_ids: [quote.id], language: newValue }
    })
  } catch (error) {
    quote.language = previousLanguage
    console.error('Failed to update language:', error)
    showErrorToast(error, 'Failed to update language')
  }
}

const statusOptions = computed(() => [
  { label: $t('common.status_approved') as string, value: 'approved' },
  { label: $t('common.status_draft') as string, value: 'draft' },
])

const getStatusOption = (status: string | undefined) =>
  statusOptions.value.find(opt => opt.value === status) ?? null

const getStatusTriggerProps = (status: string) => ({
  btn: 'ghost-gray',
  size: 'xs',
  trailing: '',
  class: `gap-1 px-1.5 text-xs font-normal w-full min-w-0 h-auto justify-start ${statusPillClass(status)}`,
})

const onStatusChange = async (quote: AdminQuote, newStatus: { label: string; value: string } | null) => {
  const newValue = newStatus?.value
  if (!newValue || newValue === quote.status) return
  if (newValue === 'draft') {
    await unpublishQuote(quote)
  }
}

const statusPillClass = (status: string) => {
  switch (status) {
    case 'approved': return 'text-[#2373F4] dark:text-[#75A7FF] bg-[#2373F4]/10 dark:bg-[#2373F4]/15'
    case 'draft': return 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
    default: return 'text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
  }
}

const selectedQuote = ref<AdminQuote | undefined>(undefined)
const showEditQuoteDialog = ref(false)
const rowSelection = ref<Record<number, boolean>>({})
const lastSelectedIndex = ref<number | null>(null)
const selectedQuotes = computed<number[]>(() => Object
  .entries(rowSelection.value)
  .filter(([, v]) => !!v)
  .map(([k]) => Number(k)))

const selectedQuotesData = computed<AdminQuote[]>(() =>
  quotes.value.filter(quote => selectedQuotes.value.includes(quote.id))
)
const showBulkAddToCollection = ref(false)
const showBulkEditDialog = ref(false)
const showBulkUnpublishModal = ref(false)
const showAuditDialog = ref(false)
const savingAudit = ref(false)
const auditQuote = ref<AdminQuote | null>(null)
const auditDraft = reactive<{ progress: QuoteAuditProgress; outcome: QuoteAuditOutcome | ''; notes: string }>({
  progress: 'pending',
  outcome: '',
  notes: '',
})

const auditProgressOptions = [
  { value: 'pending', labelKey: 'audit_progress_pending' },
  { value: 'in_progress', labelKey: 'audit_progress_in_progress' },
  { value: 'awaiting_review', labelKey: 'audit_progress_awaiting_review' },
  { value: 'reviewed', labelKey: 'audit_progress_reviewed' },
] as const satisfies ReadonlyArray<{ value: QuoteAuditProgress; labelKey: string }>

const auditOutcomeOptions = [
  { value: 'source_candidate_found', labelKey: 'audit_outcome_source_candidate_found' },
  { value: 'possible_misattribution', labelKey: 'audit_outcome_possible_misattribution' },
  { value: 'primary_source_confirmed', labelKey: 'audit_outcome_primary_source_confirmed' },
  { value: 'no_primary_source_found', labelKey: 'audit_outcome_no_primary_source_found' },
  { value: 'disputed', labelKey: 'audit_outcome_disputed' },
  { value: 'inconclusive', labelKey: 'audit_outcome_inconclusive' },
] as const satisfies ReadonlyArray<{ value: QuoteAuditOutcome; labelKey: string }>

const auditProgressLabel = (progress?: QuoteAuditProgress) => {
  const option = auditProgressOptions.find(item => item.value === (progress || 'pending'))
  return option ? $t(option.labelKey) : $t('audit_progress_pending')
}

const auditOutcomeLabel = (outcome?: QuoteAuditOutcome | null) => {
  const option = auditOutcomeOptions.find(item => item.value === outcome)
  return option ? $t(option.labelKey) : $t('audit_outcome_none')
}

const readAuditNotes = (value?: string | null) => {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    if (parsed?.version === 1 && parsed?.dimensions && typeof parsed.dimensions === 'object') return parsed
  } catch {
    // Older reviews store free-form human notes.
  }
  return { humanNotes: value }
}

const auditEvidence = computed(() => {
  const parsed = readAuditNotes(auditQuote.value?.audit_notes)
  return parsed?.version === 1 ? parsed : null
})

const openAuditReview = (quote: AdminQuote) => {
  auditQuote.value = quote
  auditDraft.progress = quote.audit_progress || 'pending'
  auditDraft.outcome = quote.audit_outcome || ''
  auditDraft.notes = readAuditNotes(quote.audit_notes)?.humanNotes || ''
  showAuditDialog.value = true
}

const saveAuditReview = async () => {
  if (!auditQuote.value) return
  savingAudit.value = true
  try {
    const auditReviewUrl: string = `/api/admin/quotes/${auditQuote.value.id}/audit-review`
    const sendAuditReview = $fetch as unknown as (url: string, options: {
      method: 'PUT'
      body: { progress: string, outcome: string | null, notes: string }
    }) => Promise<{ notes?: string | null }>
    const response = await sendAuditReview(auditReviewUrl, {
      method: 'PUT',
      body: { ...auditDraft, outcome: auditDraft.outcome || null },
    })
    auditQuote.value.audit_progress = auditDraft.progress
    auditQuote.value.audit_outcome = auditDraft.outcome || null
    auditQuote.value.audit_notes = response.notes ?? (auditDraft.notes.trim() || null)
    auditQuote.value.audit_reviewed_at = auditDraft.progress === 'reviewed' ? new Date().toISOString() : null
    showAuditDialog.value = false
  } catch (error) {
    showErrorToast(error, $t('audit_save_error') as string)
  } finally {
    savingAudit.value = false
  }
}
const showPageJumpDialog = ref(false)
const footerLeftOffset = ref(0)
const footerWidth = ref('100%')

const bulkSelectionActions = computed(() => [
  { key: 'edit', label: $t('bulk_edit') as string, icon: 'i-tabler-edit' },
  { key: 'collection', label: $t('common.add_to_collection') as string, icon: 'i-tabler-folder-plus' },
  { key: 'unpublish', label: $t('bulk_unpublish') as string, icon: 'i-tabler-eye-off' },
])

const onBulkSelectionAction = (key: string) => {
  if (key === 'edit') showBulkEditDialog.value = true
  else if (key === 'collection') showBulkAddToCollection.value = true
  else if (key === 'unpublish') showBulkUnpublishModal.value = true
}

const sortOptions = computed(() => [
  { label: $t('sort_most_recent') as string, value: 'newest' },
  { label: $t('sort_oldest_first') as string, value: 'oldest' },
  { label: $t('sort_most_liked') as string, value: 'likes' },
  { label: $t('sort_most_viewed') as string, value: 'views' }
])

const sortDirectionFor = (ascendingValue: string, descendingValue: string): 'asc' | 'desc' | null => {
  if (selectedSort.value.value === ascendingValue) return 'asc'
  if (selectedSort.value.value === descendingValue) return 'desc'
  return null
}

const toggleSort = (ascendingValue: string, descendingValue: string) => {
  const nextValue = selectedSort.value.value === descendingValue ? ascendingValue : descendingValue
  const option = sortOptions.value.find(item => item.value === nextValue)
  if (!option) return
  selectedSort.value = option
  currentPage.value = 1
}

const totalPages = computed(() => Math.ceil(totalQuotes.value / pageSize.value))

const filteredQuotes = computed(() => {
  let filtered = quotes.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(quote =>
      quote.name.toLowerCase().includes(query) ||
      quote.author?.name?.toLowerCase().includes(query) ||
      quote.reference?.name?.toLowerCase().includes(query) ||
      quote.user?.name?.toLowerCase().includes(query)
    )
  }

  if (selectedLanguage.value.value) {
    filtered = filtered.filter(quote => quote.language === selectedLanguage.value.value)
  }

  if (selectedSort.value.value) {
    filtered = [...filtered].sort((a, b) => {
      switch (selectedSort.value.value) {
        case 'newest':
          return getDateTimestamp(b.moderated_at || b.created_at) - getDateTimestamp(a.moderated_at || a.created_at)
        case 'oldest':
          return getDateTimestamp(a.moderated_at || a.created_at) - getDateTimestamp(b.moderated_at || b.created_at)
        case 'likes':
          return (b.likes_count || 0) - (a.likes_count || 0)
        case 'views':
          return (b.views_count || 0) - (a.views_count || 0)
        default:
          return 0
      }
    })
  }

  return filtered
})

const loadQuotes = async () => {
  try {
    loading.value = true
    type AdminQuotesResponse = {
      success: boolean
      data: AdminQuote[]
      pagination?: { total?: number }
    }

    const response = await $fetch<AdminQuotesResponse>('/api/admin/quotes', {
      query: {
        status: 'approved',
        page: currentPage.value,
        limit: pageSize.value,
        search: searchQuery.value || undefined,
        language: selectedLanguage.value.value || undefined,
        audit_progress: selectedAuditProgress.value.value || undefined,
        sort_by: 'published_at',
        sort_order: selectedSort.value.value === 'oldest' ? 'ASC' : 'DESC'
      }
    })

    quotes.value = response.data || []
    totalQuotes.value = response.pagination?.total || 0
    rowSelection.value = {}
    clearHighlight()
  } catch (error) {
    console.error('Failed to load published quotes:', error)
    if ((error as any)?.statusCode && (error as any).statusCode !== 500) {
      showErrorToast(error, 'Failed to load published quotes')
    }
  } finally {
    loading.value = false
    hasLoadedOnce.value = true
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedLanguage.value = languageOptions.value[0] ?? { label: $t('common.all_languages') as string, value: '' }
  selectedAuditProgress.value = auditProgressFilterOptions.value[0]!
  selectedSort.value = sortOptions.value[0]!
  currentPage.value = 1
  rowSelection.value = {}
  lastSelectedIndex.value = null
}

const getQuoteActions = (quote: AdminQuote) => [
  {
    label: $t('action_edit') as string,
    leading: 'i-ph-pencil',
    onclick: () => editQuote(quote)
  },
  {
    label: $t('action_view_public') as string,
    leading: 'i-ph-eye',
    onclick: () => viewQuote(quote)
  },
  {},
  {
    label: $t('action_unpublish') as string,
    leading: 'i-ph-eye-slash',
    onclick: () => unpublishQuote(quote)
  }
]

const showEditAuthorDialog = ref(false)
const authorToEdit = ref<Author | null>(null)
const showEditReferenceDialog = ref(false)
const referenceToEdit = ref<QuoteReference | null>(null)

const editAuthor = (author: Partial<Author>) => {
  authorToEdit.value = author as Author
  showEditAuthorDialog.value = true
}

const onAuthorUpdated = () => {
  showEditAuthorDialog.value = false
  authorToEdit.value = null
  loadQuotes()
}

const editReference = (reference: Partial<QuoteReference>) => {
  referenceToEdit.value = reference as QuoteReference
  showEditReferenceDialog.value = true
}

const onReferenceUpdated = () => {
  showEditReferenceDialog.value = false
  referenceToEdit.value = null
  loadQuotes()
}

const getAuthorActions = (quote: AdminQuote) => {
  const author = quote.author
  if (!author?.id) return []
  return [
    { label: $t('action_edit_author') as string, leading: 'i-ph-pencil', onclick: () => editAuthor(author) },
    { label: $t('action_view_author_page') as string, leading: 'i-ph-eye', onclick: () => navigateTo(`/authors/${author.id}`) }
  ]
}

const getReferenceActions = (quote: AdminQuote) => {
  const reference = quote.reference
  if (!reference?.id) return []
  return [
    { label: $t('action_edit_reference') as string, leading: 'i-ph-pencil', onclick: () => editReference(reference) },
    { label: $t('action_view_reference_page') as string, leading: 'i-ph-eye', onclick: () => navigateTo(`/references/${reference.id}`) }
  ]
}

const viewQuote = (quote: AdminQuote) => {
  navigateTo(`/quotes/${quote.id}`)
}

const editQuote = (quote: AdminQuote) => {
  selectedQuote.value = quote
  showEditQuoteDialog.value = true
}

const onQuoteUpdated = () => {
  showEditQuoteDialog.value = false
  selectedQuote.value = undefined
  loadQuotes()
}

const onBulkEditComplete = () => {
  showBulkEditDialog.value = false
  rowSelection.value = {}
  lastSelectedIndex.value = null
  loadQuotes()
}

const unpublishQuote = async (quote: AdminQuote) => {
  try {
    await $fetch('/api/admin/quotes/unpublish', {
      method: 'POST',
      body: { id: quote.id }
    })
    await loadQuotes()
  } catch (e) {
    console.error('Unpublish failed:', e)
    showErrorToast(e, 'Failed to unpublish quote')
  }
}

const clearSelection = () => { rowSelection.value = {}; lastSelectedIndex.value = null }

const setRowSelected = (id: number, value: boolean) => { rowSelection.value[id] = value === true }

const selectAllOnPage = () => {
  if (allSelectedOnPage.value) rowSelection.value = {}
  else visibleIds.value.forEach(id => (rowSelection.value[id] = true))
}

const isAnyDialogOpen = computed(() =>
  showEditQuoteDialog.value || showBulkAddToCollection.value ||
  showBulkEditDialog.value || showBulkUnpublishModal.value || showAuditDialog.value ||
  showPageJumpDialog.value
)

const visibleIds = computed<number[]>(() => filteredQuotes.value.map(q => q.id))
const allSelectedOnPage = computed<boolean>(() =>
  visibleIds.value.length > 0 && visibleIds.value.every(id => !!rowSelection.value[id])
)

const allSelected = computed<boolean | 'indeterminate'>({
  get: () => {
    const total = filteredQuotes.value.length
    const count = selectedQuotes.value.length
    if (total === 0) return false
    if (count === total) return true
    if (count > 0) return 'indeterminate'
    return false
  },
  set: (v) => {
    const newSel: Record<number, boolean> = {}
    if (v === true) {
      filteredQuotes.value.forEach(q => { newSel[q.id] = true })
    }
    rowSelection.value = newSel
    lastSelectedIndex.value = null
  }
})

const toggleAllSelection = (v: boolean | 'indeterminate') => {
  if (v) {
    const newSel: Record<number, boolean> = {}
    filteredQuotes.value.forEach(q => { newSel[q.id] = true })
    rowSelection.value = newSel
  } else {
    rowSelection.value = {}
  }
  lastSelectedIndex.value = null
}

const { highlightedRowIndex, clearHighlight } = useTableKeyboardNav({
  visibleRowCount: () => filteredQuotes.value.length,
  onSelectRow: (index: number) => {
    const quote = filteredQuotes.value[index]
    if (quote) {
      rowSelection.value[quote.id] = !rowSelection.value[quote.id]
      lastSelectedIndex.value = null
    }
  },
  isDialogOpen: () => isAnyDialogOpen.value,
  isDropdownOpen: () => false,
  pagination: {
    currentPage: () => currentPage.value,
    totalPages: () => totalPages.value,
    setPage: page => { currentPage.value = page }
  }
})

const highlightedQuote = computed<AdminQuote | null>(() => {
  if (highlightedRowIndex.value === null) return null
  return filteredQuotes.value[highlightedRowIndex.value] ?? null
})

useAdminKeyboardShortcuts({
  selectAllOnPage,
  clearSelection,
  hasSelection: () => selectedQuotes.value.length > 0,
  isDialogOpen: () => isAnyDialogOpen.value,
  isDropdownOpen: () => false,
  onEdit: () => { showBulkEditDialog.value = true },
  onDelete: () => { showBulkUnpublishModal.value = true },
  onConfirmDialog: () => {
    if (showBulkUnpublishModal.value) { bulkUnpublish(); showBulkUnpublishModal.value = false }
  },
  highlightedRowIndex: () => highlightedRowIndex.value,
  onSingleEdit: () => {
    if (highlightedQuote.value) editQuote(highlightedQuote.value)
  },
  onSingleView: () => {
    if (highlightedQuote.value) viewQuote(highlightedQuote.value)
  },
  onSingleDelete: () => {
    if (highlightedQuote.value) unpublishQuote(highlightedQuote.value)
  }
})

const handleRowCheckboxClick = (event: MouseEvent, index: number, id: number) => {
  const currently = !!rowSelection.value[id]
  const newVal = !currently
  if (event.shiftKey && lastSelectedIndex.value !== null) {
    const start = Math.min(lastSelectedIndex.value, index)
    const end = Math.max(lastSelectedIndex.value, index)
    for (let i = start; i <= end; i += 1) {
      const row = filteredQuotes.value[i]
      if (row) rowSelection.value[row.id] = newVal
    }
  } else {
    rowSelection.value[id] = newVal
  }
  lastSelectedIndex.value = index
}

const handleBulkAddedToCollection = () => {
  showBulkAddToCollection.value = false
  clearSelection()
}

const bulkUnpublish = async () => {
  try {
    if (selectedQuotes.value.length === 0) return
    await $fetch('/api/admin/quotes/unpublish', {
      method: 'POST',
      body: { ids: selectedQuotes.value }
    })
    clearSelection()
    await loadQuotes()
  } catch (e) {
    console.error('Bulk unpublish failed:', e)
    showErrorToast(e, 'Failed to unpublish selected quotes')
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
  loadQuoteAuditConfig()
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

watchDebounced([currentPage, searchQuery, selectedLanguage, selectedSort, selectedAuditProgress], () => {
  loadQuotes()
}, { debounce: 300, immediate: true })
</script>

<style scoped>
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out both;
}

.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
