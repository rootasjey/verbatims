<template>
  <div class="mb-8">
    <div class="flex sm:flex-row gap-4 max-w-2xl mx-auto">
      <div class="flex-1">
        <NInput
          ref="searchInput"
          input="outline-gray"
          v-model="searchModel"
          :placeholder="`Search among ${totalCount || 0} references...`"
          leading="i-ph-magnifying-glass"
          :trailing="searchModel ? 'i-ph-x' : undefined"
          size="md"
          class="focus:border-2 focus:border-lime-500"
          @trailing="searchModel = ''; focus()"
          :una="{
            inputTrailing: 'pointer-events-auto cursor-pointer'
          }"
        />
      </div>
      <div class="hidden md:flex gap-2">
        <NSelect
          v-model="primaryTypeModel"
          :items="typeOptions"
          placeholder="All Types"
          item-key="label"
          value-key="label"
          select="outline-gray"
        />
        <NSelect
          v-model="sortByModel"
          :items="sortOptions"
          placeholder="Sort by"
          item-key="label"
          value-key="label"
          select="outline-gray"
        />
        <NButton
          icon
          :label="sortOrder === 'ASC' ? 'i-ph-sort-ascending' : 'i-ph-sort-descending'"
          btn="soft-gray"
          @click="$emit('toggle-sort-order')"
        />
      </div>
      <div class="block md:hidden">
        <NButton
          icon
          label="i-ph-faders"
          size="sm"
          btn="outline-gray"
          class="rounded-full"
          @click="$emit('open-mobile-filters')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Option { label: string; value: string }

const searchInput = ref<any>(null)

const props = withDefaults(defineProps<{
  visibleCount?: number
  totalCount?: number
  searchQuery?: string
  primaryType?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC' | string
  typeOptions?: Option[]
  sortOptions?: Option[]
}>(), {
  visibleCount: 0,
  totalCount: 0,
  searchQuery: '',
  primaryType: '',
  sortBy: 'name',
  sortOrder: 'ASC',
  typeOptions: () => [],
  sortOptions: () => []
})

const emit = defineEmits([
  'update:searchQuery',
  'update:primaryType',
  'update:sortBy',
  'toggle-sort-order',
  'open-mobile-filters'
])

const searchModel = computed({
  get: () => props.searchQuery as string,
  set: (v: string) => emit('update:searchQuery', v)
})

const primaryTypeModel = computed({
  get: () => (props.typeOptions as Option[]).find((o) => o.value === props.primaryType) ?? (props.typeOptions as Option[])[0] ?? { label: '', value: '' },
  set: (opt: Option) => emit('update:primaryType', opt.value)
})

const sortByModel = computed({
  get: () => (props.sortOptions as Option[]).find((o) => o.value === props.sortBy) ?? (props.sortOptions as Option[])[0] ?? { label: '', value: '' },
  set: (opt: Option) => emit('update:sortBy', opt.value)
})

const focus = () => {
  const inputComponent = searchInput.value

  if (typeof inputComponent?.focus === 'function') {
    inputComponent.focus()
    return
  }

  const inputElement = inputComponent?.$el?.querySelector?.('input')
  if (inputElement instanceof HTMLElement) {
    inputElement.focus()
  }
}

const typeCharacter = (key: string) => {
  emit('update:searchQuery', `${props.searchQuery || ''}${key}`)
  nextTick(() => {
    focus()
  })
}

defineExpose({
  focus,
  typeCharacter
})

</script>
