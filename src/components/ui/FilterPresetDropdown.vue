<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'radix-vue'
import { Bookmark, ChevronDown, Plus, Star, Trash2, X } from 'lucide-vue-next'
import { type FilterPreset } from '@/composables/useFilterPresets'
import Button from './Button.vue'
import Input from './Input.vue'

interface Props {
  presets: FilterPreset[]
  activePresetId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  apply: [preset: FilterPreset]
  save: [name: string]
  delete: [presetId: string]
  setDefault: [presetId: string | null]
}>()

const isOpen = ref(false)
const showSaveDialog = ref(false)
const newPresetName = ref('')

const hasPresets = computed(() => props.presets.length > 0)

function handleSave() {
  if (newPresetName.value.trim()) {
    emit('save', newPresetName.value)
    newPresetName.value = ''
    showSaveDialog.value = false
  }
}

function handleApply(preset: FilterPreset) {
  emit('apply', preset)
  isOpen.value = false
}
</script>

<template>
  <DropdownMenuRoot v-model:open="isOpen">
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="sm">
        <Bookmark class="h-4 w-4" />
        Presets
        <ChevronDown
          class="h-4 w-4 transition-transform"
          :class="{ 'rotate-180': isOpen }"
        />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent
        class="z-50 min-w-[16rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
        :side-offset="4"
        align="end"
      >
        <!-- Save New Preset -->
        <div class="p-2 border-b border-border">
          <template v-if="showSaveDialog">
            <div class="flex gap-2">
              <Input
                v-model="newPresetName"
                size="sm"
                placeholder="Preset name..."
                class="flex-1"
                @keyup.enter="handleSave"
                @keyup.escape="showSaveDialog = false"
              />
              <Button size="sm" @click="handleSave">Save</Button>
              <Button size="icon-sm" variant="ghost" @click="showSaveDialog = false">
                <X class="h-4 w-4" />
              </Button>
            </div>
          </template>
          <template v-else>
            <button
              type="button"
              class="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
              @click="showSaveDialog = true"
            >
              <Plus class="h-4 w-4" />
              Save current filters as preset
            </button>
          </template>
        </div>

        <!-- Presets List -->
        <div v-if="hasPresets" class="max-h-60 overflow-y-auto py-1">
          <DropdownMenuItem
            v-for="preset in presets"
            :key="preset.id"
            class="group relative flex cursor-pointer select-none items-center justify-between rounded-sm px-2 py-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            :class="{ 'bg-primary/10': activePresetId === preset.id }"
            @select.prevent="handleApply(preset)"
          >
            <div class="flex items-center gap-2 min-w-0">
              <Star
                v-if="preset.isDefault"
                class="h-4 w-4 text-warning flex-shrink-0 fill-warning"
              />
              <span class="truncate">{{ preset.name }}</span>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                class="p-1 text-muted-foreground hover:text-warning rounded-sm"
                title="Set as default"
                @click.stop="emit('setDefault', preset.isDefault ? null : preset.id)"
              >
                <Star class="h-4 w-4" :class="{ 'fill-warning': preset.isDefault }" />
              </button>
              <button
                type="button"
                class="p-1 text-muted-foreground hover:text-destructive rounded-sm"
                title="Delete"
                @click.stop="emit('delete', preset.id)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </DropdownMenuItem>
        </div>

        <!-- Empty State -->
        <div v-else class="px-4 py-6 text-center">
          <p class="text-sm text-muted-foreground">No saved presets</p>
          <p class="text-xs text-muted-foreground/70 mt-1">Save your current filters for quick access</p>
        </div>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
