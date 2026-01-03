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
          :model-value="modelValue.role"
          @update:model-value="updateFilter('role', $event)"
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
            :model-value="modelValue.is_active as any"
            @update:model-value="updateFilter('is_active', $event)"
            :items="activeStatusOptions as any"
            :item-key="('value' as any)"
            :value-key="('value' as any)"
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
            :model-value="modelValue.email_verified as any"
            @update:model-value="updateFilter('email_verified', $event)"
            :items="verificationOptions as any"
            :item-key="('value' as any)"
            :value-key="('value' as any)"
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
            :model-value="modelValue.language as any"
            @update:model-value="updateFilter('language', $event)"
            :items="languageOptions as any"
            :item-key="('value' as any)"
            :value-key="('value' as any)"
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
import type { UserExportFilters } from '~/types/export'

interface Props {
  modelValue: UserExportFilters
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: UserExportFilters]
}>()

// Options for role filter
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
</script>
