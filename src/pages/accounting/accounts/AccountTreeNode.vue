<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui'
import { getAccountTypeLabel, getAccountTypeColor, type Account } from '@/api/useAccounts'
import { formatCurrency } from '@/utils/format'

const props = defineProps<{
  account: Account & { children?: Account[] }
  level: number
  expandedNodes: Set<string>
}>()

defineEmits<{
  toggle: [id: string]
  click: [account: Account]
  edit: [account: Account]
  delete: [account: Account]
}>()

const hasChildren = computed(() => (props.account.children?.length ?? 0) > 0)
// Ensure ID comparison handles string/number mismatch by forcing string
const isExpanded = computed(() => props.expandedNodes.has(String(props.account.id)))

const isActive = computed(() => 
  props.account.is_active === '1' || 
  props.account.is_active === 'true' || 
  (typeof props.account.is_active === 'boolean' && props.account.is_active)
)

const isSystem = computed(() => 
  props.account.is_system === '1' || 
  props.account.is_system === 'true' || 
  (typeof props.account.is_system === 'boolean' && props.account.is_system)
)
</script>

<template>
  <div>
    <!-- Account Row -->
    <div
      class="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer items-center"
      @click="$emit('click', account)"
    >
      <!-- Account Name with Tree Indent -->
      <div class="col-span-5 flex items-center gap-2" :style="{ paddingLeft: level * 24 + 'px' }">
        <button
          v-if="hasChildren"
          class="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          @click.stop="$emit('toggle', String(account.id))"
        >
          <ChevronDown v-if="isExpanded" class="w-4 h-4 text-slate-400" />
          <ChevronRight v-else class="w-4 h-4 text-slate-400" />
        </button>
        <span v-else class="w-5" />

        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-mono text-sm text-slate-500 dark:text-slate-400">{{ account.code }}</span>
            <span class="font-medium text-slate-900 dark:text-slate-100 truncate">{{ account.name }}</span>
          </div>
        </div>
      </div>

      <!-- Type -->
      <div class="col-span-2">
        <span
          class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
          :class="getAccountTypeColor(account.type)"
        >
          {{ getAccountTypeLabel(account.type) }}
        </span>
      </div>

      <!-- Balance -->
      <div class="col-span-2 text-right font-mono text-sm text-slate-900 dark:text-slate-100">
        {{ account.current_balance ? formatCurrency(parseFloat(account.current_balance)) : '-' }}
      </div>

      <!-- Status -->
      <div class="col-span-1 text-center">
        <span
          class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
          :class="isActive
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'"
        >
          {{ isActive ? 'Active' : 'Inactive' }}
        </span>
      </div>

      <!-- Actions -->
      <div class="col-span-2 flex justify-end gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          @click.stop="$emit('edit', account)"
        >
          <Pencil class="w-4 h-4" />
        </Button>
        <Button
          v-if="!isSystem"
          variant="ghost"
          size="icon-sm"
          class="text-red-500 hover:text-red-600"
          @click.stop="$emit('delete', account)"
        >
          <Trash2 class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- Children (recursive) -->
    <template v-if="hasChildren && isExpanded">
      <AccountTreeNode
        v-for="child in account.children"
        :key="child.id"
        :account="child"
        :level="level + 1"
        :expanded-nodes="expandedNodes"
        @toggle="(id) => $emit('toggle', id)"
        @click="(a) => $emit('click', a)"
        @edit="(a) => $emit('edit', a)"
        @delete="(a) => $emit('delete', a)"
      />
    </template>
  </div>
</template>
