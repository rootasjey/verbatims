<template>
  <div>
    <!-- Editorial Header -->
    <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">Themes</h1>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">{{ totalThemes }} {{ totalThemes === 1 ? 'theme' : 'themes' }}</p>
        </div>
        <div class="hidden md:flex items-center gap-3">
          <input v-model="searchQuery" type="text" placeholder="Search themes..." class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none w-48" />
          <select v-model="selectedSort" class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.6 text-gray-700 dark:text-gray-300 cursor-pointer">
            <option v-for="opt in sortOptions" :key="opt.value" :value="opt">{{ opt.label }}</option>
          </select>
          <OutlinedButton size="md" @click="openCreate"><span class="i-ph-plus" /> New theme</OutlinedButton>
        </div>
      </div>
      <div class="md:hidden mt-4">
        <input v-model="searchQuery" type="text" placeholder="Search themes..." class="w-full font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none" />
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="loading && themes.length === 0" class="space-y-5">
      <div v-for="i in 5" :key="i" class="animate-pulse pb-5 border-b border-dashed border-gray-100 dark:border-gray-800">
        <div class="h-4 bg-gray-100 dark:bg-gray-900 rounded w-3/4 mb-2" /><div class="h-3 bg-gray-100 dark:bg-gray-900 rounded w-1/4" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="themes.length === 0 && !loading" class="py-16 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-sm">
      <NIcon name="i-ph-palette" class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
      <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">{{ searchQuery ? 'No matching themes' : 'No themes yet' }}</p>
      <p class="font-sans text-sm text-gray-500 dark:text-gray-400">{{ searchQuery ? 'Try adjusting your search terms.' : 'Create themes to feature curated collections of quotes on the homepage.' }}</p>
    </div>

    <!-- Table -->
    <div v-else>
      <div v-if="selectedIds.length > 0" class="flex items-center gap-3 mb-4 pb-3 border-b border-dashed border-gray-200 dark:border-gray-700">
        <span class="font-sans text-xs text-gray-500 dark:text-gray-400">{{ selectedIds.length }} selected</span>
        <button class="font-sans text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors" @click="showDeleteDialog = true">Delete All</button>
        <button class="font-sans text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ml-auto" @click="clearSelection">Clear</button>
      </div>

      <div class="border border-dashed border-gray-200 dark:border-gray-700 rounded-sm overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="border-b border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0C0A09]">
              <th class="w-10 px-3 py-3 text-left"><NCheckbox checkbox="gray" :model-value="themes.length > 0 && themes.every(t => !!rowSelection[t.id])" @update:model-value="selectAllOnPage" /></th>
              <th class="px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Name</th>
              <th class="w-28 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
              <th class="w-32 px-3 py-3 text-left font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Schedule</th>
              <th class="w-16 px-3 py-3 text-center font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Filters</th>
              <th class="w-16 px-3 py-3 text-center font-sans text-xs font-500 uppercase tracking-wider text-gray-500 dark:text-gray-400">Priority</th>
              <th class="w-10 px-3 py-3 text-left">
                <NDropdownMenu :items="headerActions">
                  <button @click.stop class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><NIcon name="i-ph-caret-down" class="w-4 h-4" /></button>
                </NDropdownMenu>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="(theme, idx) in themes" :key="theme.id" :data-highlighted="idx === highlightedRowIndex ? 'true' : undefined" :class="['animate-fade-in-up transition-colors group', { 'bg-[#FAFAF9] dark:bg-[#1C1B1A]': idx === highlightedRowIndex }, { 'bg-indigo-50/50 dark:bg-indigo-950/30': !!rowSelection[theme.id] }]" :style="{ animationDelay: `${idx * 0.03}s` }">
              <td class="px-3 py-3">
                <div :class="[Object.keys(rowSelection).length > 0 ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity']">
                  <NCheckbox checkbox="gray" :model-value="!!rowSelection[theme.id]" @click="rowSelection[theme.id] = !rowSelection[theme.id]" />
                </div>
              </td>
              <td class="px-3 py-3">
                <div class="min-w-0">
                  <div class="font-sans text-sm text-gray-900 dark:text-gray-100 truncate">{{ theme.name }}</div>
                  <code class="font-sans text-xs text-gray-400 dark:text-gray-500">{{ theme.slug }}</code>
                </div>
              </td>
              <td class="px-3 py-3">
                <div class="flex items-center gap-1.5">
                  <span v-if="theme.isActive" class="font-sans text-xs px-1.5 py-0.5 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20">Active</span>
                  <span v-else-if="theme.isDefault" class="font-sans text-xs px-1.5 py-0.5 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20">Default</span>
                  <span v-else-if="theme.scheduledDate" class="font-sans text-xs px-1.5 py-0.5 text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20">Scheduled</span>
                  <span v-else class="font-sans text-xs px-1.5 py-0.5 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800">Inactive</span>
                </div>
              </td>
              <td class="px-3 py-3 font-sans text-xs text-gray-500 dark:text-gray-400">{{ theme.scheduledDate || (theme.scheduledStart ? formatDate(theme.scheduledStart) : '—') }}</td>
              <td class="px-3 py-3 font-sans text-sm text-gray-900 dark:text-gray-100 text-center">{{ theme.filters_count || 0 }}</td>
              <td class="px-3 py-3 font-sans text-sm text-gray-900 dark:text-gray-100 text-center">{{ theme.priority }}</td>
              <td class="px-3 py-3">
                <NDropdownMenu :items="getThemeActions(theme)">
                  <button @click.stop class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><NIcon name="i-ph-dots-three-vertical" class="w-4 h-4" /></button>
                </NDropdownMenu>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="flex items-center justify-between pt-4">
        <span class="font-sans text-xs text-gray-500 dark:text-gray-400">Page {{ currentPage }} of {{ totalPages }} &middot; {{ totalThemes }} total</span>
        <div class="flex items-center gap-3">
          <OutlinedButton v-if="currentPage > 1" @click="currentPage = Math.max(1, currentPage - 1)">&larr; Previous</OutlinedButton>
          <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">This is the first page</span>
          <OutlinedButton v-if="currentPage < totalPages" @click="currentPage = Math.min(totalPages, currentPage + 1)">Next &rarr;</OutlinedButton>
          <span v-else class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">This is the last page</span>
        </div>
      </div>
      <div v-else class="pt-4 text-center">
        <span class="font-sans text-xs text-gray-300 dark:text-gray-600 italic">No more pages to show</span>
      </div>
    </div>

    <NDialog v-model:open="showEditDialog" :una="{ dialogContent: 'md:max-w-2xl lg:max-w-5xl' }">
      <template #header>
        <div>
          <h3 class="font-title uppercase text-size-4 font-600 ml-4">{{ editMode ? 'Edit Theme' : 'Create Theme' }}</h3>
          <p class="text-xs text-gray-400 dark:text-gray-600 italic ml-4">{{ editMode ? 'Edit the theme details below' : 'Create a new theme manually or using AI suggestions' }}</p>
        </div>
      </template>
      <div class="max-h-[75vh] overflow-y-auto">
        <div class="space-y-6 px-4">
          <div v-if="!editMode" class="pb-2">
            <div v-if="suggestions.length === 0 && !loadingSuggestions" class="flex items-center gap-2 flex-wrap">
              <NTooltip>
                <OutlinedButton size="sm" @click="loadSuggestions"><span class="i-ph-lightbulb" /> Generate Suggestions</OutlinedButton>
                <template #content>
                  <div class="max-w-sm">
                    <p>Generates theme ideas from top tags, authors, and references using rule-based patterns. No AI configuration required.</p>
                  </div>
                </template>
              </NTooltip>
              <NTooltip>
                <OutlinedButton size="sm" @click="loadAISuggestions"><span class="i-ph-sparkle" /> AI Suggestions</OutlinedButton>
                <template #content>
                  <div class="max-w-sm">
                    <p>Generates creative theme ideas using an AI language model. Requires AI provider configuration in settings.</p>
                  </div>
                </template>
              </NTooltip>
              <NTooltip>
                <OutlinedButton icon size="sm" :class="useLocation ? 'border-indigo-300 dark:border-indigo-600 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'" @click="toggleLocation">
                  <NIcon :name="useLocation ? 'i-lucide-map-pin-check-inside' : 'i-lucide-map-pin-minus-inside'" />
                </OutlinedButton>
                <template #content>
                  <div class="max-w-sm"><p>{{ useLocation ? 'Location context is ON — AI suggestions consider the visitor\'s country.' : 'Location context is OFF — AI suggestions ignore location.' }}</p></div>
                </template>
              </NTooltip>

              <NTooltip>
                <OutlinedButton icon size="sm" class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" @click="showAISettings = true; loadAISettings()">
                  <NIcon name="i-ph-gear" />
                </OutlinedButton>
                <template #content>
                  <div class="max-w-sm"><p>Settings</p></div>
                </template>
              </NTooltip>

              <NTooltip>
                <OutlinedButton icon size="sm" :class="promptTags.length ? 'border-indigo-300 dark:border-indigo-600 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'" @click="showTagInput = !showTagInput">
                  <NIcon name="i-ph-hash" />
                </OutlinedButton>
                <template #content>
                  <div class="max-w-sm"><p>Add seed tags to guide suggestion generation toward specific themes</p></div>
                </template>
              </NTooltip>
            </div>
            <div v-else-if="loadingSuggestions && suggestions.length === 0">
              <div class="flex items-center gap-2 text-sm text-gray-500">
                <span class="i-ph-circle-notch animate-spin" />
                Generating suggestions...
              </div>
            </div>
            <div v-else-if="suggestions.length > 0">
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Theme Suggestions</h4>
                <div class="flex items-center gap-1">
                  <OutlinedButton size="sm" @click="loadSuggestions"><span class="i-ph-arrows-clockwise" />Refresh</OutlinedButton>
                  <OutlinedButton size="sm" @click="showAISettings = true; loadAISettings()"><span class="i-ph-gear" />Settings</OutlinedButton>
                  <OutlinedButton size="sm" @click="cancelSuggestions()"><span class="i-ph-x" />Cancel</OutlinedButton>
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
            </div>

            <div v-if="showTagInput || promptTags.length" class="mt-2 flex items-center gap-2 flex-wrap">
              <span v-for="(tag, i) in promptTags" :key="i" class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                {{ tag }}
                <button class="ml-0.5 hover:text-red-500 transition-colors leading-none text-sm" @click="promptTags.splice(i, 1)">&times;</button>
              </span>
              <NInput
                v-if="showTagInput"
                v-model="tagInputValue"
                placeholder="Type tag name and press Enter"
                size="xs"
                class="w-44 seed-tag-input"
                @keydown="onTagInputKeydown"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <NInput
                v-model="form.name"
                placeholder="e.g., To Infinity & Beyond"
                :disabled="submitting"
                class="pl-22"
                required>
                <template #leading>
                  <span class="block bg-gray-100 dark:bg-gray-800 py-1 px-2 rounded-1 text-sm font-medium text-gray-900 dark:text-white">Name *</span>
                </template>
                <template #trailing>
                  <NButton
                    icon size="xs" btn="soft-gray"
                    :label="suggestingName ? 'i-lucide-loader-circle' : 'i-lucide-wand-sparkles'"
                    :disabled="submitting || suggestingName"
                    class="pointer-events-auto cursor-pointer"
                    :class="suggestingName ? 'animate-spin' : ''"
                    @click="suggestName"
                  />
                </template>
              </NInput>
            </div>
            <div>
              <NInput
                v-model="form.slug"
                placeholder="e.g., space"
                :disabled="submitting"
                class="pl-22"
                required>
                <template #leading>
                  <span class="block bg-gray-100 dark:bg-gray-800 py-1 px-2 rounded-1 text-sm font-medium text-gray-900 dark:text-white">Slug *</span>
                </template>
              </NInput>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Description</label>
            <NInput type="textarea" v-model="form.description" :rows="2" placeholder="Short theme description" :disabled="submitting" />
          </div>

          <div class="bg-gray-50 dark:bg-gray-800 rounded-2 px-18 py-6">
            <h4 class="uppercase text-sm font-400 text-gray-900 dark:text-white mb-3">Theme Colors</h4>
            <div class="flex gap-16">
              <div>
                <label class="block text-sm font-medium text-gray-900 dark:text-white">Primary</label>
                <span class="block mb-2 text-xs font-mono text-gray-500 dark:text-gray-400">{{ form.color_primary }}</span>
                <div class="flex items-center gap-3">
                  <BlossomColorPicker
                    :value="primaryPickerValue"
                    @change="onPrimaryChange"
                    :show-alpha-slider="false"
                    :core-size="28"
                    :petal-size="28"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-900 dark:text-white">Secondary</label>
                <span class="block mb-2 text-xs font-mono text-gray-500 dark:text-gray-400">{{ form.color_secondary }}</span>
                <div class="flex items-center gap-3">
                  <BlossomColorPicker
                    :value="secondaryPickerValue"
                    @change="onSecondaryChange"
                    :show-alpha-slider="false"
                    :core-size="28"
                    :petal-size="28"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Image URL</label>
            <NInput v-model="form.image_url" placeholder="https://..." :disabled="submitting" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Priority</label>
              <NNumberField v-model="form.priority" :min="0" :disabled="submitting" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Scheduled Date</label>
              <NInput v-model="form.scheduled_date" type="date" :disabled="submitting" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Scheduled Start</label>
              <NInput v-model="form.scheduled_start" type="datetime-local" :disabled="submitting" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Scheduled End</label>
              <NInput v-model="form.scheduled_end" type="datetime-local" :disabled="submitting" />
            </div>
            <div class="flex items-end gap-4 pb-1">
              <NCheckbox v-model="form.is_active" label="Active" />
              <NCheckbox v-model="form.is_default" label="Default fallback" />
            </div>
          </div>

          <div class="border-t pt-4">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Content Filters</h4>
            <div class="space-y-2 mb-3">
              <div v-for="(filter, idx) in filters" :key="filter.id || idx" class="grid grid-cols-[9rem_1fr_auto] gap-2 items-center">
                <NSelect
                  v-model="filter.type"
                  :items="filterTypeOptions"
                  size="sm"
                  class="w-full"
                  @update:model-value="onFilterValueInput(idx)"
                />
                <div class="relative min-w-0 transition-all duration-300" :class="fetchingFilterIndex === idx ? 'ring-2 ring-indigo-400/40 rounded-lg' : ''">
                  <NInput v-model="filter.value" placeholder="Value" size="sm" class="w-full filter-value-input" :loading="fetchingFilterIndex === idx" @input="onFilterValueInput(idx)" @focus="onFilterValueInput(idx)" @keydown="onFilterKeydown(idx, $event)" @blur="hideFilterSuggestions" />
                  <div v-if="activeFilterIndex === idx && filterSuggestions.length" data-suggestions-dropdown class="absolute bottom-full mb-1 left-0 right-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    <div v-for="(s, si) in filterSuggestions" :key="s.value" class="px-3 py-1.5 text-xs cursor-pointer truncate" :class="si === highlightedIndex ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'"                       :data-highlighted-suggestion="si === highlightedIndex ? '' : undefined" @mousedown.prevent="selectFilterSuggestion(idx, s)" @mouseenter="highlightedIndex = si">
                      {{ s.label }}
                    </div>
                  </div>
                </div>
                <button class="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors" @click="removeFilter(idx)"><NIcon name="i-ph-x" class="w-4 h-4" /></button>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <OutlinedButton size="sm" @click="addFilter"><span class="i-ph-plus" /> Add Filter</OutlinedButton>
              <template v-if="filterRecommendations.length">
                <span class="text-2xs text-gray-400">Suggestions:</span>
                <button v-for="r in filterRecommendations" :key="`${r.type}:${r.value}`" class="text-2xs px-2 py-0.5 rounded-full border border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors" @click="applyFilterRecommendation(r)">
                  {{ r.label }}<span v-if="r.type !== 'tag_name'" class="ml-1 opacity-50">—{{ r.type.replace('_name', '').slice(0, 3) }}</span>
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3 px-4 pb-2">
          <NButton btn="gray-link" class="hover:underline decoration-offset-6" :disabled="submitting" @click="showEditDialog = false">Cancel</NButton>
          <PrimaryButton class="px-6" :loading="submitting" :disabled="!form.name.trim() || !form.slug.trim()" @click="saveTheme">
            {{ editMode ? 'Update Theme' : 'Create Theme' }}
          </PrimaryButton>
        </div>
      </template>
    </NDialog>

    <NDialog v-model:open="showDeleteDialog" :una="{ dialogContent: 'md:max-w-sm' }">
      <div>
        <h3 class="font-title uppercase text-size-4 font-600 mb-3 ml-4">Delete Theme</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete <span class="font-medium">{{ themeToDelete?.name }}</span>? This will remove all its content filters.
        </p>
        <div class="flex justify-end gap-3">
          <button class="font-sans text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors" :disabled="submitting" @click="showDeleteDialog = false">Cancel</button>
          <OutlinedButton variant="destructive" :loading="submitting" @click="confirmDelete">Delete</OutlinedButton>
        </div>
      </div>
    </NDialog>

    <NDialog v-model:open="showAISettings" :una="{ dialogContent: 'md:max-w-md' }">
      <template #header>
        <h3 class="font-title uppercase text-size-4 font-600 ml-4">AI Suggestions Settings</h3>
      </template>
      <div class="space-y-4 px-4">
        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Provider</label>
          <NSelect v-model="aiSettings.provider" :items="providerOptions" size="sm" />
          <p class="text-xs text-gray-400 mt-1 capitalize">Selected: {{ aiSettings.provider }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2 capitalize">API Key ({{ aiSettings.provider }})</label>
          <NInput
            :model-value="activeProviderSettings.apiKey"
            @update:model-value="(v) => setProviderSetting('api_key', v)"
            placeholder="sk-..." size="sm" type="password"
          />
          <p class="text-xs text-gray-400 mt-1">Stored in the database. Falls back to <code class="text-xs px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800">{{ aiSettings.provider === 'openrouter' ? 'OPENROUTER_API_KEY' : aiSettings.provider === 'opencode' ? 'OPENCODE_API_KEY' : aiSettings.provider === 'openai' ? 'OPENAI_API_KEY' : 'AI_API_KEY' }}</code> env var.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">Model</label>
          <NInput
            :model-value="activeProviderSettings.model"
            @update:model-value="(v) => setProviderSetting('model', v)"
            placeholder="e.g. gpt-4o-mini" size="sm"
          />
        </div>

        <div v-if="aiSettings.provider === 'custom'">
          <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">API Base URL</label>
          <NInput v-model="aiSettings.custom_base_url" placeholder="https://..." size="sm" />
        </div>
        <div v-else>
          <p class="text-xs text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            Base URL: <code class="text-xs px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800">{{ aiSettings.provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : aiSettings.provider === 'opencode' ? 'https://opencode.ai/zen/go/v1' : 'https://api.openai.com/v1' }}</code>
          </p>
        </div>

      </div>
      <template #footer>
        <div class="flex justify-end gap-3 px-4 pt-2 pb-2">
          <button class="font-sans text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors" @click="showAISettings = false">Cancel</button>
          <OutlinedButton variant="primary" :loading="savingAISettings" @click="saveAISettings">Save Settings</OutlinedButton>
        </div>
      </template>
    </NDialog>
  </div>
</template>

<script setup lang="ts">
import { formatRelativeTime } from '~/utils/time-formatter'
import { useAdminKeyboardShortcuts } from '~/composables/useAdminKeyboardShortcuts'
import { useTableKeyboardNav } from '~/composables/useTableKeyboardNav'
import { BlossomColorPicker } from '@dayflow/blossom-color-picker-vue'
import type { BlossomColorPickerColor } from '@dayflow/blossom-color-picker-vue'
import { ensureHexColor, hexToBlossomValue } from '~/utils/color'

const { showErrorToast } = useErrorToast()

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Themes - Admin - Verbatims' })

const loading = ref(false)
const themes = ref<any[]>([])
const totalThemes = ref(0)
const currentPage = ref(1)
const pageSize = ref(50)
const searchQuery = ref('')
const selectedSort = ref({ label: 'Priority (High-Low)', value: 'priority_desc' })

const showEditDialog = ref(false)
const editMode = ref(false)
const editingThemeId = ref<number | null>(null)
const submitting = ref(false)

const showDeleteDialog = ref(false)
const themeToDelete = ref<any>(null)

const showAISettings = ref(false)
const savingAISettings = ref(false)

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
    useToast().toast({ toast: 'outline-success', title: 'AI settings saved' })
  } catch {
    showErrorToast(null, { title: 'Error', fallback: 'Failed to save AI settings' })
  } finally {
    savingAISettings.value = false
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
    showErrorToast(null, { title: 'Error', fallback: 'Failed to save location preference' })
  }
}

onMounted(async () => {
  try {
    const res = await $fetch<{ data: Record<string, string> }>('/api/admin/settings')
    useLocation.value = res.data?.theme_suggestions_use_location !== '0'
  } catch {}
})

const suggestingName = ref(false)

const suggestName = async () => {
  const current = form.value.name.trim()
  if (current.length < 3) {
    useToast().toast({ toast: 'outline-warning', title: 'Enter at least 3 characters first' })
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
    showErrorToast(e, { title: 'Error', fallback: 'Failed to generate name' })
  } finally {
    suggestingName.value = false
  }
}

const suggestions = ref<any[]>([])
const loadingSuggestions = ref(false)
const selectedSuggestionIndex = ref<number | null>(null)
const suggestionScrollRef = ref<HTMLElement | null>(null)

const promptTags = ref<string[]>([])
const showTagInput = ref(false)
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
    showTagInput.value = false
  }
}

watch(showTagInput, (open) => {
  if (open) {
    nextTick(() => document.querySelector<HTMLElement>('.seed-tag-input')?.focus())
  }
})

const cancelSuggestions = () => {
  suggestions.value = []
  selectedSuggestionIndex.value = null
  promptTags.value = []
  showTagInput.value = false
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
  selectedSuggestionIndex.value = null
  try {
    const params: Record<string, string> = {}
    if (promptTags.value.length) params.tags = promptTags.value.join(',')
    const res = await $fetch('/api/admin/themes/suggestions', { params })
    suggestions.value = res?.data || []
  } catch {
    showErrorToast(null, { title: 'Error', fallback: 'Failed to load suggestions' })
  } finally {
    loadingSuggestions.value = false
  }
}

const loadAISuggestions = async () => {
  loadingSuggestions.value = true
  selectedSuggestionIndex.value = null
  try {
    const params: Record<string, string> = { ai: 'true' }
    if (promptTags.value.length) params.tags = promptTags.value.join(',')
    const res = await $fetch('/api/admin/themes/suggestions', { params })
    if (!res?.data || !res.data.length) {
      useToast().toast({ toast: 'outline-warning', title: 'No AI suggestions', description: 'AI returned no results. Check your AI settings or fallback to regular suggestions.' })
    }
    suggestions.value = res?.data || []
  } catch {
    showErrorToast(null, { title: 'AI Error', fallback: 'Failed to generate AI suggestions. Check your AI settings.' })
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

const form = ref({
  slug: '',
  name: '',
  description: '',
  image_url: '',
  is_active: false,
  is_default: false,
  scheduled_date: '',
  scheduled_start: '',
  scheduled_end: '',
  priority: 0,
  color_primary: '#6366f1' as string,
  color_secondary: '#f59e0b' as string,
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

const filters = ref<any[]>([])

const filterTypeOptions = ['keyword', 'tag_name', 'author_name', 'reference_name', 'author_id', 'reference_id', 'language']

// multi-select state
const rowSelection = ref<Record<number, boolean>>({})
const lastSelectedIndex = ref<number | null>(null)

const selectedIds = computed<number[]>(() => Object.entries(rowSelection.value).filter(([, v]) => !!v).map(([k]) => Number(k)))

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
  onDelete: () => { if (selectedIds.value.length) showDeleteDialog.value = true },
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
  { label: 'Priority (High-Low)', value: 'priority_desc' },
  { label: 'Priority (Low-High)', value: 'priority_asc' },
  { label: 'Name A-Z', value: 'name_asc' },
  { label: 'Name Z-A', value: 'name_desc' },
  { label: 'Slug A-Z', value: 'slug_asc' },
  { label: 'Scheduled Date', value: 'scheduled_date_desc' },
]

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
    actions.push({ label: 'Delete Selected', leading: 'i-ph-trash', shortcut: 'D', onclick: () => { showDeleteDialog.value = true } })
  }
  if (actions.length > 0) actions.push({})
  actions.push({ label: 'Add New Theme', leading: 'i-ph-plus', onclick: () => { openCreate() } })
  actions.push({})
  actions.push({ label: 'Refresh', leading: 'i-ph-arrows-clockwise', onclick: () => loadThemes() })
  actions.push({ label: 'Reset Filters', leading: 'i-ph-x', onclick: () => resetFilters() })
  return actions
})

const getThemeActions = (theme: any) => {
  const actions: any[] = [
    { label: 'Edit Theme', leading: 'i-ph-pencil', onclick: () => openEdit(theme) },
    theme.isActive
      ? { label: 'Deactivate', leading: 'i-ph-toggle-left', onclick: () => toggleActive(theme, false) }
      : { label: 'Activate', leading: 'i-ph-toggle-right', onclick: () => toggleActive(theme, true) },
    theme.isDefault
      ? { label: 'Remove from Defaults', leading: 'i-ph-star-slash', onclick: () => toggleDefault(theme, false) }
      : { label: 'Set as Default', leading: 'i-ph-star', onclick: () => toggleDefault(theme, true) },
    {},
    { label: 'Delete Theme', leading: 'i-ph-trash', onclick: () => { themeToDelete.value = theme; showDeleteDialog.value = true } },
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
    showErrorToast(e, 'Failed to load themes')
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

const resetForm = () => {
  form.value = { slug: '', name: '', description: '', image_url: '', is_active: false, is_default: false, scheduled_date: '', scheduled_start: '', scheduled_end: '', priority: 0, color_primary: '#6366f1', color_secondary: '#f59e0b' }
  initPickerValues('#6366f1', '#f59e0b')
  filters.value = []
  filterRecommendations.value = []
  editingThemeId.value = null
  editMode.value = false
  promptTags.value = []
  showTagInput.value = false
}

const openCreate = () => {
  resetForm()
  suggestions.value = []
  selectedSuggestionIndex.value = null
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
      is_active: data.isActive || false,
      is_default: data.isDefault || false,
      scheduled_date: data.scheduledDate || '',
      scheduled_start: data.scheduledStart ? formatDatetimeForInput(data.scheduledStart) : '',
      scheduled_end: data.scheduledEnd ? formatDatetimeForInput(data.scheduledEnd) : '',
      priority: data.priority || 0,
      color_primary: colorPrimary,
      color_secondary: colorSecondary,
    }
    initPickerValues(colorPrimary, colorSecondary)
    filters.value = (data.filters || []).map((f: any) => ({ id: f.id, type: f.type, value: f.value }))
  } catch (e) {
    showErrorToast(e, 'Failed to load theme details')
    return
  }
  showEditDialog.value = true
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
  }
})

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
      showErrorToast(null, { title: 'Error', fallback: 'Failed to delete filter' })
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
      is_active: form.value.is_active,
      is_default: form.value.is_default,
      scheduled_date: form.value.scheduled_date || null,
      scheduled_start: form.value.scheduled_start || null,
      scheduled_end: form.value.scheduled_end || null,
      priority: form.value.priority || 0,
      config: { color_primary: form.value.color_primary, color_secondary: form.value.color_secondary },
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

    showEditDialog.value = false
    await loadThemes()
  } catch (error: any) {
    console.error('Error saving theme:', error)
    if (error?.statusCode === 409) {
      showErrorToast(error, { title: 'Duplicate slug' })
      return
    }
    showErrorToast(error, { title: 'Error' })
  } finally {
    submitting.value = false
  }
}

const confirmDelete = async () => {
  if (!themeToDelete.value && selectedIds.value.length === 0) return
  submitting.value = true
  try {
    if (themeToDelete.value) {
      await $fetch(`/api/admin/themes/${themeToDelete.value.id}`, { method: 'DELETE' })

    } else {
      const ids = [...selectedIds.value]
      const results = await Promise.allSettled(ids.map(id => $fetch(`/api/admin/themes/${id}`, { method: 'DELETE' })))
      const failed = results.filter(r => r.status === 'rejected').length
      useToast().toast({ toast: failed ? 'outline-warning' : 'soft-success', title: `Deleted ${ids.length - failed} theme${ids.length - failed !== 1 ? 's' : ''}` })
    }
    showDeleteDialog.value = false
    themeToDelete.value = null
    rowSelection.value = {}
    await loadThemes()
  } catch (e) {
    showErrorToast(e, 'Failed to delete theme')
  } finally {
    submitting.value = false
  }
}

const toggleActive = async (theme: any, isActive: boolean) => {
  try {
    await $fetch(`/api/admin/themes/${theme.id}/activate`, { method: 'PUT', body: { is_active: isActive } })
    await loadThemes()
  } catch {
    showErrorToast(null, { title: 'Error', fallback: 'Failed to toggle theme' })
  }
}

const toggleDefault = async (theme: any, isDefault: boolean) => {
  try {
    await $fetch(`/api/admin/themes/${theme.id}/default`, { method: 'PUT', body: { is_default: isDefault } })
    await loadThemes()
  } catch {
    showErrorToast(null, { title: 'Error', fallback: 'Failed to toggle default' })
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

watchDebounced([currentPage, searchQuery, selectedSort], () => { loadThemes() }, { debounce: 300 })
onMounted(() => { loadThemes() })
</script>

<style scoped>
@keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in-up { animation: fade-in-up 0.5s ease-out both; }
</style>
