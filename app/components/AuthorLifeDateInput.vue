<template>
  <fieldset class="min-w-0 flex-1 space-y-2">
    <div class="flex items-center justify-between gap-3">
      <legend class="text-sm font-500 text-gray-700 dark:text-gray-300">{{ label }}</legend>
      <label class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <input v-model="approximate" type="checkbox" :disabled="disabled" class="accent-blue-600">
        {{ $t('components.dialogs.approximate_date') }}
      </label>
    </div>
    <div class="grid grid-cols-[minmax(5rem,1fr)_minmax(5rem,1fr)] gap-2">
      <NNumberField :model-value="date?.year ?? null" number-field="outline-gray" :min="1" :max="999999" :step="1" :disabled="disabled" :_number-field-input="{ ...getInputAttrs(String($t('components.dialogs.year')), String($t('components.dialogs.year'))), class: 'w-full !rounded-lg !text-sm !shadow-sm' }" @update:model-value="setYear" />
      <NSelect
        v-model="selectedEra"
        :items="eraOptions"
        item-key="label"
        value-key="label"
        select="outline-gray"
        :disabled="disabled"
        :_select-trigger="{ class: '!h-10 !min-h-10 !w-full !rounded-lg !px-2 !text-sm' }"
        :_select-content="{ bodyLock: false }"
      >
        <template #value="{ modelValue }">
          <span class="truncate">{{ (modelValue as EraOption)?.label }}</span>
        </template>
      </NSelect>
      <NNumberField :model-value="date?.month ?? null" number-field="outline-gray" :min="1" :max="12" :step="1" :disabled="disabled" :_number-field-input="{ ...getInputAttrs('MM', String($t('components.dialogs.month'))), class: 'w-full !rounded-lg !text-sm !shadow-sm' }" @update:model-value="setMonth" />
      <NNumberField :model-value="date?.day ?? null" number-field="outline-gray" :min="1" :max="31" :step="1" :disabled="disabled" :_number-field-input="{ ...getInputAttrs(String($t('components.dialogs.day_short')), String($t('components.dialogs.day'))), class: 'w-full !rounded-lg !text-sm !shadow-sm' }" @update:model-value="setDay" />
    </div>
    <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('components.dialogs.life_date_hint') }}</p>
  </fieldset>
</template>

<script setup lang="ts">
import type { AuthorLifeDate, AuthorLifeDateEra } from '#shared/types/author-life-date'

const props = defineProps<{ modelValue: AuthorLifeDate | null; label: string; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: AuthorLifeDate | null] }>()
const { $t } = useI18n()

const date = computed(() => props.modelValue)
function getInputAttrs(placeholder: string, ariaLabel: string) {
  return { placeholder, 'aria-label': ariaLabel }
}
interface EraOption {
  label: string
  value: AuthorLifeDateEra
}

const eraOptions = computed<EraOption[]>(() => [
  { label: String($t('components.dialogs.ce')), value: 'ce' },
  { label: String($t('components.dialogs.bce')), value: 'bce' },
])
const selectedEra = computed<EraOption>({
  get: () => eraOptions.value.find(option => option.value === (date.value?.era ?? 'ce')) ?? eraOptions.value[0]!,
  set: option => setEra(option.value),
})
const approximate = computed({
  get: () => Boolean(date.value?.approximate),
  set: (value: boolean) => update({ approximate: value }),
})

function update(fields: Partial<AuthorLifeDate>) {
  if (!date.value && fields.year === undefined) return
  const current = date.value ?? { year: 1, era: 'ce' as const, calendar: 'gregorian-proleptic' }
  const next = { ...current, ...fields }
  emit('update:modelValue', next.year > 0 ? next : null)
}

function setYear(value: number | null) {
  const year = value
  if (year === null || !Number.isInteger(year) || year < 1) {
    emit('update:modelValue', null)
    return
  }
  update({ year })
}

function setEra(era: AuthorLifeDateEra) {
  update({ era })
}

function setMonth(month: number | null) {
  update({ month: month && month >= 1 && month <= 12 ? month : undefined, day: month ? date.value?.day : undefined })
}

function setDay(day: number | null) {
  if (!date.value?.month) return
  update({ day: day && day >= 1 && day <= 31 ? day : undefined })
}
</script>
