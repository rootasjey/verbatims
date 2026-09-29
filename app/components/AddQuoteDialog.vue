<template>
  <AppDialog
    v-model="isOpen"
    :title="dialogTitle"
    title-class="font-sans text-lg font-600 tracking-normal"
    center-title
    :submit-text="submitButtonText"
    :submitting="submitting"
    :can-submit="!!form.content.trim()"
    :hide-footer="!canUseForm || !isEditMode"
    :max-width="canUseForm && isEditMode ? '2xl' : 'md'"
    scrollable
    @submit="submitQuote"
    @close="closeDialog"
  >
    <section v-if="!canUseForm" class="mx-auto max-w-sm py-2 text-center md:py-3">
      <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-200">
        <NIcon name="i-ph-quotes" class="h-6 w-6" />
      </div>
      <p class="font-sans text-base leading-relaxed text-gray-600 dark:text-gray-400">
        {{ $t('components.dialogs.add_quote_guest_message') }}
      </p>
      <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <NButton btn="solid-black" class="rounded-full px-6" @click="goToAuth('/login')">
          {{ $t('auth.sign_in_button') }}
        </NButton>
        <NButton btn="outline-gray" class="rounded-full px-6" @click="goToAuth('/signup')">
          {{ $t('auth.sign_up_button') }}
        </NButton>
      </div>
    </section>

    <form v-else-if="!isEditMode" @submit.prevent="quoteStep === 1 ? goToAttributionStep() : submitQuote()" @keydown.capture="handleCreateEscape" @keydown="handleCreateFormKeydown" class="space-y-5 px-2">
      <div class="grid grid-cols-2 gap-3" :aria-label="String($t('components.dialogs.add_quote_steps'))">
        <button type="button" :aria-current="quoteStep === 1 ? 'step' : undefined" :class="['w-full border-b-2 pb-2 text-left font-sans text-sm transition-colors', quoteStep === 1 ? 'border-gray-900 font-600 text-gray-900 dark:border-gray-100 dark:text-gray-100' : 'border-gray-200 text-gray-500 hover:text-gray-800 dark:border-neutral-700 dark:text-gray-400 dark:hover:text-gray-200']" @click="goToQuoteStep">
          <span class="mr-2 text-xs tabular-nums opacity-60">01</span>{{ $t('components.dialogs.quote_step') }}
        </button>
        <button type="button" :aria-current="quoteStep === 2 ? 'step' : undefined" :disabled="form.content.trim().length < 2" :class="['w-full border-b-2 pb-2 text-left font-sans text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50', quoteStep === 2 ? 'border-gray-900 font-600 text-gray-900 dark:border-gray-100 dark:text-gray-100' : 'border-gray-200 text-gray-500 hover:text-gray-800 dark:border-neutral-700 dark:text-gray-400 dark:hover:text-gray-200']" @click="goToAttributionStep">
          <span class="mr-2 text-xs tabular-nums opacity-60">02</span>{{ $t('components.dialogs.attribution_step') }}
        </button>
      </div>

      <div ref="stepViewportRef" :style="{ height: stepViewportHeight }" class="quote-step-viewport relative overflow-hidden" @transitionend.self="finishStepTransition">
      <Transition :name="transitionName">
      <section v-if="quoteStep === 1" key="quote" data-quote-step="1" class="space-y-4 p-2">
        <div class="relative">
          <textarea
            ref="quoteTextarea"
            autofocus
          v-model="form.content"
          :placeholder="quotePlaceholder"
          rows="5"
          :disabled="submitting"
          required
          @input="draftSaved = false"
          class="min-h-40 w-full resize-y rounded-1.5 bg-gray-100/80 px-4 pb-10 pt-4 font-serif text-xl leading-snug text-gray-900 placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/60 dark:bg-neutral-900/80 dark:text-gray-100 dark:placeholder-gray-600 dark:focus-visible:ring-gray-500"
        />
          <span class="pointer-events-none absolute bottom-3 right-4 font-sans text-xs tabular-nums text-gray-500 dark:text-gray-400" aria-live="polite" :aria-label="String($t('components.dialogs.character_count', { count: form.content.length }))">{{ form.content.length }}</span>
        </div>
      </section>

      <section v-else key="attribution" data-quote-step="2" class="space-y-4">
        <div>
          <label class="sr-only" for="add-quote-author">{{ $t('components.dialogs.author_label') }}</label>
          <div class="flex min-h-12 flex-wrap items-center gap-2 rounded-1 border border-gray-300 px-3 py-1.5 transition-colors focus-within:border-gray-700 dark:border-neutral-700 dark:focus-within:border-neutral-300">
            <span v-if="form.selectedAuthor" class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-1 pr-2 font-sans text-sm text-gray-900 dark:bg-neutral-800 dark:text-gray-100">
              <NAvatar :src="form.selectedAuthor.image_url" :alt="form.selectedAuthor.name" size="xs" class="shrink-0" />
              <span class="max-w-48 truncate">{{ form.selectedAuthor.name }}</span>
              <button type="button" class="ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-neutral-700 dark:hover:text-gray-100" :aria-label="String($t('components.dialogs.clear_selection'))" @mousedown.prevent @click="clearAuthorFromField"><NIcon name="i-tabler-x" class="h-3.5 w-3.5" /></button>
            </span>
            <input
              id="add-quote-author"
              ref="authorInputRef"
              v-model="authorQuery"
              type="text"
              :placeholder="(form.selectedAuthor ? $t('components.dialogs.replace_selection') : $t('components.dialogs.search_author')) as string"
              :disabled="submitting"
              class="min-w-40 flex-1 border-0 bg-transparent px-1 py-2 font-sans text-base text-gray-900 outline-none placeholder-gray-400 focus:border-0 focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder-gray-500"
              @input="onAuthorInput"
              @focus="handleAuthorInputFocus"
              @blur="handleAuthorInputBlur"
              @keydown="onAuthorKeydown"
            />
          </div>
          <Transition name="quote-suggestions" @leave="collapseSuggestionPanel">
          <div v-if="showAuthorSuggestions && (authorSuggestions.length || authorQuery)" ref="authorSuggestionsRef" :style="{ height: authorSuggestionsHeight }" class="quote-suggestions-panel mt-2 max-h-48 w-full overflow-auto rounded-1.5 border border-gray-200 bg-[#FAFAF9] shadow-lg dark:border-neutral-700 dark:bg-neutral-900" tabindex="-1" @blur="handleAuthorSuggestionsBlur" @keydown="handleAuthorKeydown">
            <button v-for="(author, index) in authorSuggestions" :key="author.id" type="button" :class="['flex w-full items-center gap-2 px-3 py-2 text-left transition-colors', selectedAuthorIndex === index ? 'bg-gray-100 dark:bg-neutral-700' : 'hover:bg-gray-100 dark:hover:bg-neutral-800']" @click="selectAuthor(author)">
              <NAvatar :src="author.image_url" :alt="author.name" size="xs" class="shrink-0" />
              <span class="min-w-0">
                <span class="block truncate font-sans text-sm text-gray-900 dark:text-gray-100">{{ author.name }}</span>
                <span v-if="author.job" class="block truncate font-sans text-xs text-gray-500 dark:text-gray-400">{{ author.job }}</span>
              </span>
            </button>
            <button v-if="authorQuery && !authorSuggestions.some(author => author.name.toLowerCase() === authorQuery.toLowerCase())" type="button" :class="['block w-full border-t border-gray-200 px-3 py-2 text-left font-sans text-sm text-gray-700 dark:border-neutral-700 dark:text-gray-300', selectedAuthorIndex === authorSuggestions.length ? 'bg-gray-100 dark:bg-neutral-700' : 'hover:bg-gray-100 dark:hover:bg-neutral-800']" @click="createNewAuthor">
              {{ $t('components.dialogs.create_new_author', { name: authorQuery }) }}
            </button>
          </div>
          </Transition>
        </div>

        <div>
          <label class="sr-only" for="add-quote-reference">{{ $t('components.dialogs.reference_label') }}</label>
          <div class="flex min-h-12 flex-wrap items-center gap-2 rounded-1 border border-gray-300 px-3 py-1.5 transition-colors focus-within:border-gray-700 dark:border-neutral-700 dark:focus-within:border-neutral-300">
            <span v-if="form.selectedReference" class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-1 pr-2 font-sans text-sm text-gray-900 dark:bg-neutral-800 dark:text-gray-100">
              <NAvatar :src="form.selectedReference.image_url" :alt="form.selectedReference.name" rounded="2" size="xs" class="shrink-0" />
              <span class="max-w-48 truncate">{{ form.selectedReference.name }}</span>
              <button type="button" class="ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-neutral-700 dark:hover:text-gray-100" :aria-label="String($t('components.dialogs.clear_selection'))" @mousedown.prevent @click="clearReferenceFromField"><NIcon name="i-tabler-x" class="h-3.5 w-3.5" /></button>
            </span>
            <input
              id="add-quote-reference"
              ref="referenceInputRef"
              v-model="referenceQuery"
              type="text"
              :placeholder="(form.selectedReference ? $t('components.dialogs.replace_selection') : $t('components.dialogs.search_reference')) as string"
              :disabled="submitting"
              class="min-w-40 flex-1 border-0 bg-transparent px-1 py-2 font-sans text-base text-gray-900 outline-none placeholder-gray-400 focus:border-0 focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder-gray-500"
              @input="onReferenceInput"
              @focus="handleReferenceInputFocus"
              @blur="handleReferenceInputBlur"
              @keydown="onReferenceKeydown"
            />
          </div>
          <Transition name="quote-suggestions" @leave="collapseSuggestionPanel">
          <div v-if="showReferenceSuggestions && (referenceSuggestions.length || referenceQuery)" ref="referenceSuggestionsRef" :style="{ height: referenceSuggestionsHeight }" class="quote-suggestions-panel mt-2 max-h-48 w-full overflow-auto rounded-1.5 border border-gray-200 bg-[#FAFAF9] shadow-lg dark:border-neutral-700 dark:bg-neutral-900" tabindex="-1" @blur="handleReferenceSuggestionsBlur" @keydown="handleReferenceKeydown">
            <button v-for="(reference, index) in referenceSuggestions" :key="reference.id" type="button" :class="['flex w-full items-center gap-2 px-3 py-2 text-left transition-colors', selectedReferenceIndex === index ? 'bg-gray-100 dark:bg-neutral-700' : 'hover:bg-gray-100 dark:hover:bg-neutral-800']" @click="selectReference(reference)">
              <NAvatar :src="reference.image_url" :alt="reference.name" rounded="2" size="xs" class="shrink-0" />
              <span class="min-w-0">
                <span class="block truncate font-sans text-sm text-gray-900 dark:text-gray-100">{{ reference.name }}</span>
                <span v-if="reference.primary_type" class="block truncate font-sans text-xs capitalize text-gray-500 dark:text-gray-400">{{ reference.primary_type.replace('_', ' ') }}</span>
              </span>
            </button>
            <button v-if="referenceQuery && !referenceSuggestions.some(reference => reference.name.toLowerCase() === referenceQuery.toLowerCase())" type="button" :class="['block w-full border-t border-gray-200 px-3 py-2 text-left font-sans text-sm text-gray-700 dark:border-neutral-700 dark:text-gray-300', selectedReferenceIndex === referenceSuggestions.length ? 'bg-gray-100 dark:bg-neutral-700' : 'hover:bg-gray-100 dark:hover:bg-neutral-800']" @click="createNewReference">
              {{ $t('components.dialogs.create_new_reference', { name: referenceQuery }) }}
            </button>
          </div>
          </Transition>
        </div>
        <Transition name="quote-suggestions" @leave="collapseSuggestionPanel">
          <p v-if="!hasAttribution" class="quote-suggestions-panel font-sans text-xs text-gray-500 dark:text-gray-400">{{ $t('components.dialogs.attribution_required') }}</p>
        </Transition>
      </section>
      </Transition>
      </div>

      <p v-if="draftSaved" role="status" aria-live="polite" class="flex items-center gap-2 font-sans text-sm text-gray-600 dark:text-gray-300">
        <NIcon name="i-tabler-circle-check" class="h-4 w-4 shrink-0" />
        {{ $t('components.dialogs.draft_saved_continue') }}
      </p>
      <div class="flex items-center justify-between gap-3 border-t border-gray-200/80 pt-4 dark:border-neutral-700/80">
        <NButton btn="ghost-gray" type="button" :disabled="submitting" @click="quoteStep === 2 ? goToQuoteStep() : closeDialog()">
          {{ quoteStep === 2 ? $t('common.back') : $t('common.cancel') }}
        </NButton>
        <NButton v-if="quoteStep === 1" btn="solid-black" type="button" :disabled="form.content.trim().length < 2 || submitting" @click="goToAttributionStep">
          {{ $t('common.next') }}<NIcon name="i-ph-arrow-right" class="ml-2 h-4 w-4" />
        </NButton>
        <NButton v-else btn="solid-black" type="submit" :disabled="!hasAttribution || submitting" :loading="submitting" class="min-h-10 rounded-1 px-4">
          {{ $t('components.dialogs.save_as_draft') }}
        </NButton>
      </div>
    </form>

    <form v-else @keydown="handleFormKeydown" class="space-y-7 md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] md:items-start md:gap-10 md:space-y-0">
      <div class="md:sticky md:top-0 md:self-start">
      <!-- Quote Content -->
      <div>
        <textarea
          ref="quoteTextarea"
          v-model="form.content"
          :placeholder="$t('components.dialogs.quote_placeholder') as string"
          rows="7"
          :disabled="submitting"
          required
          class="w-full min-h-64 font-serif text-2xl md:text-3xl leading-snug text-gray-900 dark:text-gray-100 rounded-3
            bg-gray-100/80 dark:bg-neutral-900/80 px-5 py-5 placeholder-gray-400 dark:placeholder-gray-600
            focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/60 resize-y"
        />
        <div class="px-1 pt-2 flex justify-between">
          <span class="font-sans text-xs font-600 text-gray-500 dark:text-gray-400">{{ dialogTitle }}</span>
          <span class="font-sans text-xs font-600 text-gray-500 dark:text-gray-400">{{ form.content.length }} characters</span>
        </div>
      </div>

      </div>

      <div class="space-y-6 md:pt-1">
      <div class="hidden md:block pb-1">
        <p class="font-sans text-xs font-700 uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Details</p>
      </div>
      <!-- Author -->
      <div>
        <label class="block font-sans text-sm text-gray-700 dark:text-gray-300 mb-1.5">{{ $t('components.dialogs.author_label') }}</label>
        <div class="relative">
          <input
            ref="authorInputRef"
            v-model="authorQuery"
            type="text"
            :placeholder="$t('components.dialogs.search_author') as string"
            :disabled="submitting"
            class="w-full font-sans text-base bg-transparent border-b border-gray-300 dark:border-neutral-700 px-0 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-700 dark:focus:border-gray-300"
            @input="onAuthorInput"
            @focus="handleAuthorInputFocus"
            @blur="handleAuthorInputBlur"
            @keydown="handleAuthorKeydown"
          />
          <div
            v-if="showAuthorSuggestions && (authorSuggestions.length > 0 || authorQuery)"
            ref="authorSuggestionsRef"
            class="absolute z-10 w-full mt-2 bg-[#FAFAF9] dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2 shadow-xl max-h-48 overflow-auto"
            tabindex="-1"
            @blur="handleAuthorSuggestionsBlur"
            @keydown="handleAuthorKeydown"
          >
            <div
              v-for="(author, index) in authorSuggestions"
              :key="author.id"
              :class="[
                'px-3 py-2 cursor-pointer font-sans text-sm',
                selectedAuthorIndex === index ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              ]"
              @click="selectAuthor(author)"
              @mouseenter="selectedAuthorIndex = index"
            >
              <p class="text-sm text-gray-900 dark:text-gray-100">{{ author.name }}</p>
              <p v-if="author.job" class="text-xs text-gray-500 dark:text-gray-400">{{ author.job }}</p>
            </div>
            <div
              v-if="authorQuery && !authorSuggestions.some(a => a.name.toLowerCase() === authorQuery.toLowerCase())"
              :class="[
                'px-3 py-2 cursor-pointer border-t border-dashed border-gray-200 dark:border-gray-700 font-sans text-sm',
                selectedAuthorIndex === authorSuggestions.length ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              ]"
              @click="createNewAuthor"
              @mouseenter="selectedAuthorIndex === authorSuggestions.length ? selectedAuthorIndex = authorSuggestions.length : null"
            >
              <p class="text-sm text-blue-600 dark:text-blue-400">{{ $t('components.dialogs.create_new_author', { name: authorQuery }) }}</p>
            </div>
          </div>
        </div>
        <div v-if="form.selectedAuthor" class="mt-2 p-2 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
          <div>
            <span class="font-sans text-sm text-gray-900 dark:text-gray-100">{{ form.selectedAuthor.name }}</span>
            <span v-if="form.selectedAuthor.job" class="font-sans text-xs text-gray-500 dark:text-gray-400 ml-2">{{ form.selectedAuthor.job }}</span>
          </div>
          <button type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" @click="clearAuthor"><NIcon name="i-ph-x" class="w-4 h-4" /></button>
        </div>
      </div>

      <!-- Reference -->
      <div>
        <label class="block font-sans text-sm text-gray-700 dark:text-gray-300 mb-1.5">{{ $t('components.dialogs.reference_label') }}</label>
        <div class="relative">
          <input
            ref="referenceInputRef"
            v-model="referenceQuery"
            type="text"
            :placeholder="$t('components.dialogs.search_reference') as string"
            :disabled="submitting"
            class="w-full font-sans text-base bg-transparent border-b border-gray-300 dark:border-neutral-700 px-0 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-700 dark:focus:border-gray-300"
            @input="onReferenceInput"
            @focus="handleReferenceInputFocus"
            @blur="handleReferenceInputBlur"
            @keydown="handleReferenceKeydown"
          />
          <div
            v-if="showReferenceSuggestions && (referenceSuggestions.length > 0 || referenceQuery)"
            ref="referenceSuggestionsRef"
            class="absolute z-10 w-full mt-2 bg-[#FAFAF9] dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2 shadow-xl max-h-48 overflow-auto"
            tabindex="-1"
            @blur="handleReferenceSuggestionsBlur"
            @keydown="handleReferenceKeydown"
          >
            <div
              v-for="(reference, index) in referenceSuggestions"
              :key="reference.id"
              :class="[
                'px-3 py-2 cursor-pointer font-sans text-sm',
                selectedReferenceIndex === index ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              ]"
              @click="selectReference(reference)"
              @mouseenter="selectedReferenceIndex = index"
            >
              <p class="text-sm text-gray-900 dark:text-gray-100">{{ reference.name }}</p>
              <p v-if="reference.primary_type" class="text-xs text-gray-500 dark:text-gray-400 capitalize">{{ reference.primary_type.replace('_', ' ') }}</p>
            </div>
            <div
              v-if="referenceQuery && !referenceSuggestions.some(r => r.name.toLowerCase() === referenceQuery.toLowerCase())"
              :class="[
                'px-3 py-2 cursor-pointer border-t border-dashed border-gray-200 dark:border-gray-700 font-sans text-sm',
                selectedReferenceIndex === referenceSuggestions.length ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              ]"
              @click="createNewReference"
              @mouseenter="selectedReferenceIndex = referenceSuggestions.length"
            >
              <p class="text-sm text-blue-600 dark:text-blue-400">{{ $t('components.dialogs.create_new_reference', { name: referenceQuery }) }}</p>
            </div>
          </div>
        </div>
        <div v-if="form.selectedReference" class="mt-2 p-2 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
          <div>
            <span class="font-sans text-sm text-gray-900 dark:text-gray-100">{{ form.selectedReference.name }}</span>
            <span v-if="form.selectedReference.primary_type" class="font-sans text-xs text-gray-500 dark:text-gray-400 ml-2 capitalize">{{ form.selectedReference.primary_type.replace('_', ' ') }}</span>
          </div>
          <button type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" @click="clearReference"><NIcon name="i-ph-x" class="w-4 h-4" /></button>
        </div>
      </div>

      <!-- Provenance (moderators and admins only) -->
      <div v-if="canEditProvenance" class="border-t border-gray-200 dark:border-gray-800 pt-6 space-y-4">
        <div>
          <h3 class="font-sans text-sm font-600 text-gray-800 dark:text-gray-200">Provenance</h3>
          <p class="mt-1 font-sans text-xs text-gray-500 dark:text-gray-400">Record where this quote was verified.</p>
        </div>
        <div>
          <label class="block font-sans text-sm text-gray-700 dark:text-gray-300 mb-1.5">Source type</label>
          <select
            v-model="form.sourceType"
            :disabled="submitting"
            class="w-full font-sans text-sm bg-transparent border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 cursor-pointer focus:outline-none"
          >
            <option value="" class="dark:bg-gray-800">No source type</option>
            <option value="wikiquote-en" class="dark:bg-gray-800">Wikiquote (English)</option>
            <option value="wikiquote-fr" class="dark:bg-gray-800">Wikiquote (French)</option>
          </select>
        </div>
        <div>
          <label class="block font-sans text-sm text-gray-700 dark:text-gray-300 mb-1.5">Source URL</label>
          <input
            v-model="form.sourceUrl"
            type="url"
            placeholder="https://..."
            :disabled="submitting"
            class="w-full font-sans text-sm bg-transparent border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
          />
        </div>
      </div>
      </div>
    </form>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useQuoteForm } from '~/composables/useQuoteForm'
import { useQuoteStepTransition } from '~/composables/useQuoteStepTransition'

interface Props {
  modelValue: boolean
  editQuote?: QuoteWithRelations | AdminQuote | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'quote-added'): void
  (e: 'quote-updated'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { $t } = useI18n()
const { user } = useUserSession()

const quoteTextarea = ref<HTMLTextAreaElement | null>(null)
const quoteStep = ref<1 | 2>(1)
const lastSavedQuote = ref('')
const draftSaved = ref(false)
const quotePlaceholder = computed(() => {
  if (!lastSavedQuote.value) return String($t('components.dialogs.quote_placeholder'))
  const excerpt = lastSavedQuote.value.replace(/\s+/g, ' ').trim()
  return excerpt.length > 90 ? `${excerpt.slice(0, 87).trimEnd()}…` : excerpt
})
const { stepViewportRef, stepViewportHeight, transitionName, changeStep, finishStepTransition } = useQuoteStepTransition(quoteStep)

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEditMode = computed(() => !!props.editQuote)
const canUseForm = computed(() => Boolean(user.value) || isEditMode.value)
const canEditProvenance = computed(() => isEditMode.value && ['admin', 'moderator'].includes(user.value?.role || ''))
const dialogTitle = computed(() => isEditMode.value ? String($t('components.dialogs.edit_quote')) : String($t('components.dialogs.add_quote')))
const submitButtonText = computed(() => isEditMode.value ? String($t('components.dialogs.update')) : String($t('common.save')))
const {
  form,
  authorQuery,
  referenceQuery,
  authorSuggestions,
  referenceSuggestions,
  showAuthorSuggestions,
  showReferenceSuggestions,
  submitting,
  selectedAuthorIndex,
  selectedReferenceIndex,
  authorInputRef,
  referenceInputRef,
  authorSuggestionsRef,
  referenceSuggestionsRef,
  searchAuthors,
  searchReferences,
  handleAuthorInputFocus,
  handleAuthorInputBlur,
  handleAuthorSuggestionsBlur,
  handleAuthorKeydown,
  handleReferenceInputFocus,
  handleReferenceInputBlur,
  handleReferenceSuggestionsBlur,
  handleReferenceKeydown,
  selectAuthor,
  selectReference,
  createNewAuthor,
  createNewReference,
  clearAuthor,
  clearReference,
  resetForm,
  initializeFormForEdit,
  createPayload
} = useQuoteForm()

const authorSuggestionsHeight = ref('0px')
const referenceSuggestionsHeight = ref('0px')

watch([showAuthorSuggestions, authorSuggestions, authorQuery], async ([visible]) => {
  if (!visible) return
  await nextTick()
  const panel = authorSuggestionsRef.value
  if (panel) authorSuggestionsHeight.value = `${Math.min(panel.scrollHeight, 192)}px`
}, { flush: 'post' })

watch([showReferenceSuggestions, referenceSuggestions, referenceQuery], async ([visible]) => {
  if (!visible) return
  await nextTick()
  const panel = referenceSuggestionsRef.value
  if (panel) referenceSuggestionsHeight.value = `${Math.min(panel.scrollHeight, 192)}px`
}, { flush: 'post' })

const collapseSuggestionPanel = (element: Element, done: () => void) => {
  const panel = element as HTMLElement
  panel.style.height = `${panel.getBoundingClientRect().height}px`
  panel.style.marginTop = getComputedStyle(panel).marginTop

  let completed = false
  const finish = () => {
    if (completed) return
    completed = true
    clearTimeout(fallback)
    panel.removeEventListener('transitionend', onTransitionEnd)
    done()
  }
  const onTransitionEnd = (event: TransitionEvent) => {
    if (event.target === panel && event.propertyName === 'height') finish()
  }
  const fallback = setTimeout(finish, 320)
  panel.addEventListener('transitionend', onTransitionEnd)

  requestAnimationFrame(() => {
    panel.style.height = '0px'
    panel.style.marginTop = '0px'
  })
}

const hasAttribution = computed(() => Boolean(form.value.selectedAuthor || form.value.selectedReference))
const { showErrorToast } = useErrorToast()

const handleFormKeydown = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    if (form.value.content.trim() && !submitting.value) submitQuote()
  }
}

const handleCreateFormKeydown = (event: KeyboardEvent) => {
  if (event.defaultPrevented || event.isComposing) return

  if (quoteStep.value === 1 && (event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    void goToAttributionStep()
    return
  }

  if (quoteStep.value === 2 && event.key === 'Enter' && !submitting.value) {
    event.preventDefault()
    void submitQuote()
  }
}

const handleCreateEscape = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  event.preventDefault()
  event.stopPropagation()
  if (quoteStep.value === 2) void goToQuoteStep()
  else closeDialog()
}

const onAuthorKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !authorQuery.value && form.value.selectedAuthor) {
    event.preventDefault()
    clearAuthor()
    return
  }
  handleAuthorKeydown(event)
}

const onReferenceKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !referenceQuery.value && form.value.selectedReference) {
    event.preventDefault()
    clearReference()
    return
  }
  handleReferenceKeydown(event)
}

const clearAuthorFromField = () => {
  clearAuthor()
  nextTick(() => authorInputRef.value?.focus?.())
}

const clearReferenceFromField = () => {
  clearReference()
  nextTick(() => referenceInputRef.value?.focus?.())
}

const onAuthorInput = () => {
  draftSaved.value = false
  showAuthorSuggestions.value = Boolean(authorQuery.value.trim())
  if (authorQuery.value.trim()) void searchAuthors($fetch, { limit: 5, minLength: 1 })
  else authorSuggestions.value = []
}

const onReferenceInput = () => {
  draftSaved.value = false
  showReferenceSuggestions.value = Boolean(referenceQuery.value.trim())
  if (referenceQuery.value.trim()) void searchReferences($fetch, { limit: 5, minLength: 1 })
  else referenceSuggestions.value = []
}
const closeDialog = () => { isOpen.value = false }

watch(isOpen, (open) => {
  if (open && canUseForm.value) {
    quoteStep.value = 1
    nextTick(() => quoteTextarea.value?.focus())
  }
})

watch(() => props.editQuote, (newQuote) => {
  if (newQuote) initializeFormForEdit(newQuote)
  else resetForm()
}, { immediate: true })

const showContentEmptyError = () => {
  useToast().toast({ title: String($t('components.dialogs.toast_error')), description: String($t('components.dialogs.quote_placeholder')) })
}

const goToAttributionStep = async () => {
  if (form.value.content.trim().length < 2) return
  await changeStep(2)
  nextTick(() => (authorInputRef.value as HTMLInputElement | null)?.focus?.())
}

const goToQuoteStep = async () => {
  await changeStep(1)
  nextTick(() => quoteTextarea.value?.focus())
}

const goToAuth = async (path: '/login' | '/signup') => {
  closeDialog()
  await navigateTo(path)
}

const submitQuote = async () => {
  if (submitting.value) return
  if (form.value.content.trim().length < 2) { showContentEmptyError(); return }
  if (!user.value) return
  if (!isEditMode.value && !hasAttribution.value) {
    void goToAttributionStep()
    return
  }
  submitting.value = true
  let savedDraft = false

  try {
    const payload = createPayload()
    if (isEditMode.value && props.editQuote) {
      const { language: _language, ...updatePayload } = payload
      await submitUpdateQuote(props.editQuote.id, updatePayload)
      return
    }
    await submitCreateQuote(payload)
    savedDraft = true
  } catch (error) {
    console.error('Error submitting quote:', error)
    showErrorToast(error, isEditMode.value ? String($t('components.dialogs.toast_error')) : String($t('components.dialogs.toast_error')))
  } finally {
    submitting.value = false
    if (savedDraft) nextTick(() => quoteTextarea.value?.focus())
  }
}

const submitCreateQuote = async (payload: CreateQuoteData) => {
  const savedText = form.value.content.trim()
  await $fetch('/api/quotes', { method: 'POST', body: payload })
  lastSavedQuote.value = savedText
  form.value.content = ''
  draftSaved.value = true
  emit('quote-added')
  await changeStep(1)
}

const submitUpdateQuote = async (editQuoteId: number, payload: CreateQuoteData | Omit<CreateQuoteData, 'language'>) => {
  await $fetch(`/api/quotes/${editQuoteId}`, { method: 'PUT', body: payload })
  emit('quote-updated')
  closeDialog()
}

const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showAuthorSuggestions.value = false
    showReferenceSuggestions.value = false
    selectedAuthorIndex.value = -1
    selectedReferenceIndex.value = -1
  }
}

onMounted(() => { document.addEventListener('click', handleClickOutside) })
onUnmounted(() => { document.removeEventListener('click', handleClickOutside) })
</script>
