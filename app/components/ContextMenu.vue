<template>
  <ContextMenuRoot>
    <div @contextmenu.capture="onCapture">
      <ContextMenuTrigger>
        <slot />
      </ContextMenuTrigger>
    </div>
    <ContextMenuPortal to="body">
      <ContextMenuContent
        :class="['z-50 min-w-40 overflow-hidden rounded-md border border-base bg-popover p-1 text-popover shadow-md',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          contentClass]"
      >
        <template v-for="(item, i) in items" :key="i">
          <ContextMenuSeparator
            v-if="!item.label && !item.items"
            class="my-1 -mx-1 h-px bg-border"
          />
          <ContextMenuSub v-else-if="item.items">
            <ContextMenuSubTrigger
              :disabled="item.disabled"
              :class="[itemClass,
                'data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-800',
                'dark:data-[highlighted]:bg-gray-800 dark:data-[highlighted]:text-gray-100',
                'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none']"
            >
              <span v-if="item.leading" :class="[item.leading, iconClass, 'flex-shrink-0']" />
              <span class="flex-1 min-w-0 truncate">{{ item.label }}</span>
              <span :class="['i-lucide-chevron-right ml-auto opacity-60 flex-shrink-0', iconClass]" />
            </ContextMenuSubTrigger>
            <ContextMenuPortal to="body">
              <ContextMenuSubContent
                class="z-50 min-w-40 overflow-hidden rounded-md border border-base bg-popover p-1 text-popover shadow-lg
                  data-[state=open]:animate-in data-[state=closed]:animate-out
                  data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
                  data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
              >
                <template v-for="(subItem, j) in item.items" :key="j">
                  <ContextMenuSeparator
                    v-if="!subItem.label && !subItem.items"
                    class="my-1 -mx-1 h-px bg-border"
                  />
                  <ContextMenuSub v-else-if="subItem.items">
                    <ContextMenuSubTrigger
                      :disabled="subItem.disabled"
                      :class="[itemClass,
                        'data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-800',
                        'dark:data-[highlighted]:bg-gray-800 dark:data-[highlighted]:text-gray-100',
                        'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none']"
                    >
                      <span v-if="subItem.leading" :class="[subItem.leading, iconClass, 'flex-shrink-0']" />
                      <span class="flex-1 min-w-0 truncate">{{ subItem.label }}</span>
                      <span :class="['i-lucide-chevron-right ml-auto opacity-60 flex-shrink-0', iconClass]" />
                    </ContextMenuSubTrigger>
                    <ContextMenuPortal to="body">
                      <ContextMenuSubContent
                        class="z-50 min-w-40 overflow-hidden rounded-md border border-base bg-popover p-1 text-popover shadow-lg
                          data-[state=open]:animate-in data-[state=closed]:animate-out
                          data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
                          data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                      >
                        <ContextMenuItem
                          v-for="(nestedItem, k) in subItem.items"
                          :key="k"
                          :disabled="nestedItem.disabled"
                          :class="[itemClass,
                            'data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-800',
                            'dark:data-[highlighted]:bg-gray-800 dark:data-[highlighted]:text-gray-100',
                            'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none']"
                          @select="nestedItem.onclick"
                        >
                          <span v-if="nestedItem.leading" :class="[nestedItem.leading, iconClass, 'flex-shrink-0']" />
                          <span class="flex-1 min-w-0 truncate">{{ nestedItem.label }}</span>
                          <span v-if="nestedItem.shortcut" :class="[shortcutClass]">{{ nestedItem.shortcut }}</span>
                        </ContextMenuItem>
                      </ContextMenuSubContent>
                    </ContextMenuPortal>
                  </ContextMenuSub>
                  <ContextMenuItem
                    v-else
                    :key="`sub-${j}`"
                    :disabled="subItem.disabled"
                    :class="[itemClass,
                      'data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-800',
                      'dark:data-[highlighted]:bg-gray-800 dark:data-[highlighted]:text-gray-100',
                      'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none']"
                    @select="subItem.onclick"
                  >
                    <span v-if="subItem.leading" :class="[subItem.leading, iconClass, 'flex-shrink-0']" />
                    <span class="flex-1 min-w-0 truncate">{{ subItem.label }}</span>
                    <span v-if="subItem.shortcut" :class="[shortcutClass]">{{ subItem.shortcut }}</span>
                  </ContextMenuItem>
                </template>
              </ContextMenuSubContent>
            </ContextMenuPortal>
          </ContextMenuSub>
          <ContextMenuItem
            v-else
            :disabled="item.disabled"
            :class="[itemClass,
              'data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-800',
              'dark:data-[highlighted]:bg-gray-800 dark:data-[highlighted]:text-gray-100',
              'data-[disabled]:opacity-50 data-[disabled]:pointer-events-none']"
            @select="item.onclick"
          >
            <span v-if="item.leading" :class="[item.leading, iconClass, 'flex-shrink-0']" />
            <span class="flex-1 min-w-0 truncate">{{ item.label }}</span>
            <span v-if="item.shortcut" :class="[shortcutClass]">{{ item.shortcut }}</span>
          </ContextMenuItem>
        </template>
        <template v-if="nativeOnModifier">
          <ContextMenuSeparator class="my-1 -mx-1 h-px bg-border" />
          <div class="px-2.5 py-1.5 flex items-center gap-1.5 select-none pointer-events-none opacity-50">
            <span class="i-ph-info w-3 h-3 flex-shrink-0" />
            <span class="text-[0.7em] leading-tight">{{ $t('common.context_menu_native_hint') }}</span>
          </div>
        </template>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  ContextMenuRoot,
  ContextMenuTrigger,
  ContextMenuPortal,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from 'reka-ui'

interface ContextMenuItem {
  label?: string | null
  leading?: string
  shortcut?: string | null
  disabled?: boolean
  items?: ContextMenuItem[]
  onclick?: () => void
}

interface Props {
  items: ContextMenuItem[]
  size?: 'sm' | 'xs'
  nativeOnModifier?: 'ctrl' | 'shift' | 'alt'
  contentClass?: string
}

const { $t } = useI18n()

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  contentClass: ''
})

const onCapture = (e: MouseEvent) => {
  if (!props.nativeOnModifier) return
  const modKey = props.nativeOnModifier
  const hasMod = modKey === 'ctrl' ? e.ctrlKey : modKey === 'shift' ? e.shiftKey : e.altKey
  if (hasMod) {
    e.stopPropagation()
  }
}

const itemClass = computed(() => {
  const base = 'w-full justify-start font-normal h-auto text-left transition-color focus-visible:outline-0 select-none flex items-center gap-2 rounded-sm cursor-pointer'
  const padding = props.size === 'xs' ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5'
  return `${base} ${padding}`
})

const iconClass = computed(() => props.size === 'xs' ? 'w-3.5 h-3.5' : 'w-4 h-4')

const shortcutClass = computed(() => {
  const base = 'ml-auto tracking-widest opacity-60 flex-shrink-0 whitespace-nowrap'
  const text = props.size === 'xs' ? 'text-[0.8em]' : 'text-[0.875em]'
  return `${base} ${text}`
})
</script>
