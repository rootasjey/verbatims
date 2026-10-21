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
      <NInput :model-value="date?.year ?? ''" type="number" min="1" max="999999" step="1" inputmode="numeric" :placeholder="$t('components.dialogs.year') as string" :aria-label="$t('components.dialogs.year') as string" :disabled="disabled" @update:model-value="setYear" />
      <select :value="date?.era ?? 'ce'" :aria-label="$t('components.dialogs.era') as string" :disabled="disabled" class="min-h-10 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-800 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" @change="setEra">
        <option value="ce">{{ $t('components.dialogs.ce') }}</option>
        <option value="bce">{{ $t('components.dialogs.bce') }}</option>
      </select>
      <NInput :model-value="date?.month ?? ''" type="number" min="1" max="12" step="1" inputmode="numeric" placeholder="MM" :aria-label="$t('components.dialogs.month') as string" :disabled="disabled" @update:model-value="setMonth" />
      <NInput :model-value="date?.day ?? ''" type="number" min="1" max="31" step="1" inputmode="numeric" :placeholder="$t('components.dialogs.day_short') as string" :aria-label="$t('components.dialogs.day') as string" :disabled="disabled" @update:model-value="setDay" />
    </div>
    <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('components.dialogs.life_date_hint') }}</p>
  </fieldset>
</template>

<script setup lang="ts">
import type { AuthorLifeDate, AuthorLifeDateEra } from '#shared/types/author-life-date'

const props = defineProps<{ modelValue: AuthorLifeDate | null; label: string; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: AuthorLifeDate | null] }>()

const date = computed(() => props.modelValue)
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

function setYear(value: string | number | undefined) {
  const year = value === '' || value === undefined ? null : Number(value)
  if (year === null || !Number.isInteger(year) || year < 1) {
    emit('update:modelValue', null)
    return
  }
  update({ year })
}

function setEra(event: Event) {
  update({ era: (event.target as HTMLSelectElement).value as AuthorLifeDateEra })
}

function setMonth(value: string | number | undefined) {
  const month = value === '' || value === undefined ? undefined : Number(value)
  update({ month: month && month >= 1 && month <= 12 ? month : undefined, day: month ? date.value?.day : undefined })
}

function setDay(value: string | number | undefined) {
  if (!date.value?.month) return
  const day = value === '' || value === undefined ? undefined : Number(value)
  update({ day: day && day >= 1 && day <= 31 ? day : undefined })
}
</script>
