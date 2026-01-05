<template>
  <div class="space-y-6">
    <!-- Search -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        User Search (name or email)
      </label>
      <NInput
        :model-value="modelValue.search"
        @update:model-value="updateFilter('search', $event)"
        placeholder="Search by name or email"
      />
    </div>

    <!-- Role Filter -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        User Role
      </label>
      <div>
        <NSelect
          :model-value="roleModel"
          @update:model-value="v => roleModel = (Array.isArray(v) ? v : [v])"
          :items="roleOptions"
          item-key="value"
          value-key="value"
          placeholder="All roles"
          multiple
        />
      </div>
    </div>

    <!-- Status Filters -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Account Status
        </label>
        <div>
          <NSelect
            :model-value="activeStatusModel"
            @update:model-value="v => activeStatusModel = (typeof v === 'object' ? v : activeStatusOptions.find(o => o.value === v) ?? null)"
            :items="activeStatusOptions"
            item-key="value"
            value-key="value"
            placeholder="All accounts"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email Verification
        </label>
        <div>
          <NSelect
            :model-value="emailVerifiedModel"
            @update:model-value="v => emailVerifiedModel = (typeof v === 'object' ? v : verificationOptions.find(o => o.value === v) ?? null)"
            :items="verificationOptions"
            item-key="value"
            value-key="value"
            placeholder="All users"
          />
        </div>
      </div>
    </div>

    <!-- Language and Location -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Language Preference
        </label>
        <div>
          <NSelect
            :model-value="languageModel"
            @update:model-value="v => languageModel = (Array.isArray(v) ? v : [v])"
            :items="languageOptions"
            item-key="value"
            value-key="value"
            placeholder="All languages"
            multiple
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Location (search)
        </label>
        <NInput
          :model-value="modelValue.location"
          @update:model-value="updateFilter('location', $event)"
          placeholder="Search by location"
        />
      </div>
    </div>

    <!-- Job/Profession Filter -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Job/Profession (search)
      </label>
      <NInput
        :model-value="modelValue.job"
        @update:model-value="updateFilter('job', $event)"
        placeholder="Search by job or profession"
      />
    </div>

    <!-- Creation Date Range -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Registration Date Range
      </label>
      <div class="grid grid-cols-2 gap-3">
        <NInput
          :model-value="modelValue.date_range?.start"
          @update:model-value="updateDateRange('date_range', 'start', $event)"
          type="date"
          placeholder="Start date"
        />
        <NInput
          :model-value="modelValue.date_range?.end"
          @update:model-value="updateDateRange('date_range', 'end', $event)"
          type="date"
          placeholder="End date"
        />
      </div>
    </div>

    <!-- Last Login Date Range -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Last Login Date Range
      </label>
      <div class="grid grid-cols-2 gap-3">
        <NInput
          :model-value="modelValue.last_login_range?.start"
          @update:model-value="updateDateRange('last_login_range', 'start', $event)"
          type="date"
          placeholder="Start date"
        />
        <NInput
          :model-value="modelValue.last_login_range?.end"
          @update:model-value="updateDateRange('last_login_range', 'end', $event)"
          type="date"
          placeholder="End date"
        />
      </div>
    </div>

    <!-- Activity Filters -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Minimum Quotes Created
        </label>
        <NInput
          :model-value="modelValue.min_quotes"
          @update:model-value="updateFilter('min_quotes', $event ? parseInt($event) : 0)"
          type="number"
          min="0"
          placeholder="0"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Minimum Collections Created
        </label>
        <NInput
          :model-value="modelValue.min_collections"
          @update:model-value="updateFilter('min_collections', $event ? parseInt($event) : 0)"
          type="number"
          min="0"
          placeholder="0"
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
