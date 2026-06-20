<template>
  <div class="space-y-6">
    <!-- Search -->
    <div>
      <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
        User Search (name or email)
      </label>
      <input
        :model-value="modelValue.search"
        @update:model-value="updateFilter('search', $event)"
        placeholder="Search by name or email"
        class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none w-full"
      />
    </div>

    <!-- Role Filter -->
    <div>
      <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
        User Role
      </label>
      <div>
        <select
          multiple
          :value="roleModel.map(o => o.value)"
          @change="roleModel = Array.from(($event.target as HTMLSelectElement).selectedOptions).map(o => ({ label: o.text, value: o.value }))"
          class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.5 text-gray-700 dark:text-gray-300 cursor-pointer w-full"
        >
          <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <!-- Status Filters -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
          Account Status
        </label>
        <div>
          <select
            :value="activeStatusModel?.value === undefined ? '' : String(activeStatusModel.value)"
            @change="activeStatusModel = (($event.target as HTMLSelectElement).value === '' ? null : activeStatusOptions.find(o => String(o.value) === ($event.target as HTMLSelectElement).value) ?? null)"
            class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.5 text-gray-700 dark:text-gray-300 cursor-pointer w-full"
          >
            <option value="">All accounts</option>
            <option v-for="opt in activeStatusOptions" :key="String(opt.value)" :value="String(opt.value)">{{ opt.label }}</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
          Email Verification
        </label>
        <div>
          <select
            :value="emailVerifiedModel?.value === undefined ? '' : String(emailVerifiedModel.value)"
            @change="emailVerifiedModel = (($event.target as HTMLSelectElement).value === '' ? null : verificationOptions.find(o => String(o.value) === ($event.target as HTMLSelectElement).value) ?? null)"
            class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.5 text-gray-700 dark:text-gray-300 cursor-pointer w-full"
          >
            <option value="">All users</option>
            <option v-for="opt in verificationOptions" :key="String(opt.value)" :value="String(opt.value)">{{ opt.label }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Language and Location -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
          Language Preference
        </label>
        <div>
          <select
            multiple
            :value="languageModel.map(o => o.value)"
            @change="languageModel = Array.from(($event.target as HTMLSelectElement).selectedOptions).map(o => ({ label: o.text, value: o.value }))"
            class="font-sans text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1.5 text-gray-700 dark:text-gray-300 cursor-pointer w-full"
          >
            <option v-for="opt in languageOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
          Location (search)
        </label>
        <input
          :model-value="modelValue.location"
          @update:model-value="updateFilter('location', $event)"
          placeholder="Search by location"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none w-full"
        />
      </div>
    </div>

    <!-- Job/Profession Filter -->
    <div>
      <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
        Job/Profession (search)
      </label>
      <input
        :model-value="modelValue.job"
        @update:model-value="updateFilter('job', $event)"
        placeholder="Search by job or profession"
        class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none w-full"
      />
    </div>

    <!-- Creation Date Range -->
    <div>
      <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
        Registration Date Range
      </label>
      <div class="grid grid-cols-2 gap-3">
        <input
          :model-value="modelValue.date_range?.start"
          @update:model-value="updateDateRange('date_range', 'start', $event)"
          type="date"
          placeholder="Start date"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
        />
        <input
          :model-value="modelValue.date_range?.end"
          @update:model-value="updateDateRange('date_range', 'end', $event)"
          type="date"
          placeholder="End date"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
        />
      </div>
    </div>

    <!-- Last Login Date Range -->
    <div>
      <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
        Last Login Date Range
      </label>
      <div class="grid grid-cols-2 gap-3">
        <input
          :model-value="modelValue.last_login_range?.start"
          @update:model-value="updateDateRange('last_login_range', 'start', $event)"
          type="date"
          placeholder="Start date"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
        />
        <input
          :model-value="modelValue.last_login_range?.end"
          @update:model-value="updateDateRange('last_login_range', 'end', $event)"
          type="date"
          placeholder="End date"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
        />
      </div>
    </div>

    <!-- Activity Filters -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
          Minimum Quotes Created
        </label>
        <input
          :model-value="modelValue.min_quotes"
          @update:model-value="updateFilter('min_quotes', $event ? parseInt($event) : 0)"
          type="number"
          min="0"
          placeholder="0"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 w-24 focus:outline-none"
        />
      </div>

      <div>
        <label class="block font-sans text-sm font-500 text-gray-700 dark:text-gray-300 mb-2">
          Minimum Collections Created
        </label>
        <input
          :model-value="modelValue.min_collections"
          @update:model-value="updateFilter('min_collections', $event ? parseInt($event) : 0)"
          type="number"
          min="0"
          placeholder="0"
          class="font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-900 dark:text-gray-100 w-24 focus:outline-none"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: UserExportFilters
}

import { computed } from 'vue'

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: UserExportFilters]
}>()

// const currentRole = ref<{ label: string; value: string } | null>(null)
const roleOptions = [
  { label: 'User', value: 'user' },
  { label: 'Moderator', value: 'moderator' },
  { label: 'Admin', value: 'admin' }
]

// Options for active status filter
const activeStatusOptions = [
  { label: 'Active Accounts', value: true },
  { label: 'Inactive Accounts', value: false }
]

// Options for email verification filter
const verificationOptions = [
  { label: 'Verified Email', value: true },
  { label: 'Unverified Email', value: false }
]

// Options for language filter
const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'Spanish', value: 'es' },
  { label: 'German', value: 'de' },
  { label: 'Italian', value: 'it' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Russian', value: 'ru' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Chinese', value: 'zh' }
]

const updateFilter = (key: keyof UserExportFilters, value: any) => {
  const updated = { ...props.modelValue, [key]: value }
  emit('update:modelValue', updated)
}

const updateDateRange = (rangeType: 'date_range' | 'last_login_range', type: 'start' | 'end', value: string) => {
  const currentRange = props.modelValue[rangeType] || { start: '', end: '' }
  const updated = {
    ...props.modelValue,
    [rangeType]: {
      ...currentRange,
      [type]: value
    }
  }
  emit('update:modelValue', updated)
}

type Option<T = string> = { label: string; value: T }

// Computed binding for the role filter (maps between `string[]` in model and `Option[]` for NSelect)
const roleModel = computed({
  get(): Option[] {
    const val = props.modelValue.role
    const values = Array.isArray(val) ? val : (val ? [val] : [])
    return values.map(v => roleOptions.find(o => o.value === v) ?? { label: v, value: v })
  },
  set(options: Option[]) {
    const values = options?.map(o => o.value) ?? []
    updateFilter('role', values)
  }
})

// Computed binding for the language filter (maps between `string[]` in model and `Option[]` for NSelect)
const languageModel = computed({
  get(): Option[] {
    const val = props.modelValue.language
    const values = Array.isArray(val) ? val : (val ? [val] : [])
    return values.map(v => languageOptions.find(o => o.value === v) ?? { label: v, value: v })
  },
  set(options: Option[]) {
    const values = options?.map(o => o.value) ?? []
    updateFilter('language', values)
  }
})

// Computed binding for boolean single-selects
const activeStatusModel = computed<Option<boolean> | null>({
  get() {
    const val = props.modelValue.is_active
    if (val === undefined || val === null) return null
    return activeStatusOptions.find(o => o.value === val) ?? { label: String(val), value: val }
  },
  set(option) {
    const val = option ? option.value : undefined
    updateFilter('is_active', val)
  }
})

const emailVerifiedModel = computed<Option<boolean> | null>({
  get() {
    const val = props.modelValue.email_verified
    if (val === undefined || val === null) return null
    return verificationOptions.find(o => o.value === val) ?? { label: String(val), value: val }
  },
  set(option) {
    const val = option ? option.value : undefined
    updateFilter('email_verified', val)
  }
})
</script>
