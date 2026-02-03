<script setup lang="ts">
/**
 * LineItemsTable Component
 *
 * Universal line items table for document forms.
 * Works with useLineItems composable for calculations.
 *
 * @example
 * ```vue
 * <LineItemsTable
 *   :items="items"
 *   :calculations="lineCalculations"
 *   :product-options="productLookup"
 *   @add="addItem"
 *   @remove="removeItem"
 *   @update="updateItem"
 * />
 * ```
 */

import { computed } from 'vue'
import type { BaseLineItem } from '@/services/line-items'
import type { LineItemCalculation } from '@/services/calculation'
import { Button, Input, Select } from '@/components/ui'
import { Plus, Trash2, GripVertical, Copy } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/format'

interface Props {
  items: BaseLineItem[]
  calculations?: LineItemCalculation[]
  productOptions?: Array<{ value: number | string; label: string; price?: number }>
  canAdd?: boolean
  canRemove?: boolean
  canReorder?: boolean
  canDuplicate?: boolean
  showTax?: boolean
  showDiscount?: boolean
  showProductSelect?: boolean
  disabled?: boolean
  errors?: Map<number, string[]>
  minItems?: number
}

const props = withDefaults(defineProps<Props>(), {
  calculations: () => [],
  productOptions: () => [],
  canAdd: true,
  canRemove: true,
  canReorder: false,
  canDuplicate: false,
  showTax: true,
  showDiscount: true,
  showProductSelect: true,
  disabled: false,
  minItems: 1,
})

const emit = defineEmits<{
  add: [item?: Partial<BaseLineItem>]
  remove: [index: number]
  update: [index: number, field: keyof BaseLineItem, value: unknown]
  reorder: [fromIndex: number, toIndex: number]
  duplicate: [index: number]
  'product-selected': [index: number, productId: number | string]
}>()

// Discount type options
const discountTypeOptions = [
  { value: '', label: 'None' },
  { value: 'percent', label: '%' },
  { value: 'amount', label: 'Rp' },
]

// Check if can remove based on minimum items
const canRemoveItem = computed(() => props.canRemove && props.items.length > props.minItems)

// Get calculation for specific line
function getCalculation(index: number): LineItemCalculation | null {
  return props.calculations[index] ?? null
}

// Get error for specific line
function getError(index: number): string | null {
  const errors = props.errors?.get(index)
  return errors?.[0] ?? null
}

// Handle product selection
function handleProductSelect(index: number, productId: number | string | null) {
  emit('update', index, 'product_id', productId)

  if (productId) {
    emit('product-selected', index, productId)

    // Auto-fill price from product options
    const product = props.productOptions.find((p) => p.value === productId)
    if (product?.price) {
      emit('update', index, 'unit_price', product.price)
    }
  }
}

// Handle field update
function handleUpdate(index: number, field: keyof BaseLineItem, event: Event) {
  const target = event.target as HTMLInputElement
  let value: unknown = target.value

  // Convert numeric fields
  if (['quantity', 'unit_price', 'discount_value'].includes(field)) {
    value = parseFloat(target.value) || 0
  }

  emit('update', index, field, value)
}

// Column visibility
const showProductColumn = computed(() => props.showProductSelect)
const showDiscountColumn = computed(() => props.showDiscount)

// Calculate colspan for empty state
const emptyColspan = computed(() => {
  let cols = 5 // description, qty, unit, price, subtotal, actions
  if (showProductColumn.value) cols++
  if (showDiscountColumn.value) cols++
  if (props.canReorder) cols++
  return cols
})
</script>

<template>
  <div class="space-y-4">
    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="border-b bg-muted/50">
          <tr>
            <th v-if="canReorder" class="w-10 px-2 py-2"></th>
            <th v-if="showProductColumn" class="px-3 py-2 text-left font-medium">Product</th>
            <th class="px-3 py-2 text-left font-medium">Description</th>
            <th class="w-20 px-3 py-2 text-right font-medium">Qty</th>
            <th class="w-20 px-3 py-2 text-left font-medium">Unit</th>
            <th class="w-32 px-3 py-2 text-right font-medium">Unit Price</th>
            <th v-if="showDiscountColumn" class="w-28 px-3 py-2 text-right font-medium">Discount</th>
            <th class="w-32 px-3 py-2 text-right font-medium">Subtotal</th>
            <th class="w-20 px-2 py-2"></th>
          </tr>
        </thead>

        <tbody class="divide-y">
          <tr
            v-for="(item, index) in items"
            :key="index"
            :class="{ 'bg-destructive/5': getError(index) }"
          >
            <!-- Drag handle -->
            <td v-if="canReorder" class="px-2 py-2">
              <button
                type="button"
                class="cursor-grab text-muted-foreground hover:text-foreground"
                :disabled="disabled"
              >
                <GripVertical class="h-4 w-4" />
              </button>
            </td>

            <!-- Product select -->
            <td v-if="showProductColumn" class="px-3 py-2">
              <Select
                :model-value="item.product_id ?? undefined"
                :options="productOptions"
                placeholder="Select product"
                :disabled="disabled"
                class="w-full min-w-[150px]"
                @update:model-value="handleProductSelect(index, $event)"
              />
            </td>

            <!-- Description -->
            <td class="px-3 py-2">
              <Input
                :model-value="item.description"
                placeholder="Description"
                :disabled="disabled"
                class="w-full min-w-[200px]"
                @input="handleUpdate(index, 'description', $event)"
              />
            </td>

            <!-- Quantity -->
            <td class="px-3 py-2">
              <Input
                type="number"
                :model-value="item.quantity"
                min="0"
                step="any"
                :disabled="disabled"
                class="w-full text-right"
                @input="handleUpdate(index, 'quantity', $event)"
              />
            </td>

            <!-- Unit -->
            <td class="px-3 py-2">
              <Input
                :model-value="item.unit"
                placeholder="pcs"
                :disabled="disabled"
                class="w-full"
                @input="handleUpdate(index, 'unit', $event)"
              />
            </td>

            <!-- Unit Price -->
            <td class="px-3 py-2">
              <Input
                type="number"
                :model-value="item.unit_price"
                min="0"
                :disabled="disabled"
                class="w-full text-right"
                @input="handleUpdate(index, 'unit_price', $event)"
              />
            </td>

            <!-- Discount -->
            <td v-if="showDiscountColumn" class="px-3 py-2">
              <div class="flex gap-1">
                <Select
                  :model-value="item.discount_type ?? ''"
                  :options="discountTypeOptions"
                  :disabled="disabled"
                  class="w-16"
                  @update:model-value="emit('update', index, 'discount_type', $event || null)"
                />
                <Input
                  v-if="item.discount_type"
                  type="number"
                  :model-value="item.discount_value ?? undefined"
                  min="0"
                  :disabled="disabled"
                  class="w-20 text-right"
                  @input="handleUpdate(index, 'discount_value', $event)"
                />
              </div>
            </td>

            <!-- Subtotal (calculated) -->
            <td class="px-3 py-2 text-right font-medium">
              {{ formatCurrency(getCalculation(index)?.total ?? 0) }}
            </td>

            <!-- Actions -->
            <td class="px-2 py-2">
              <div class="flex gap-1">
                <Button
                  v-if="canDuplicate"
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  :disabled="disabled"
                  title="Duplicate item"
                  @click="emit('duplicate', index)"
                >
                  <Copy class="h-4 w-4" />
                </Button>
                <Button
                  v-if="canRemove"
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  :disabled="disabled || !canRemoveItem"
                  title="Remove item"
                  @click="emit('remove', index)"
                >
                  <Trash2 class="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </td>
          </tr>

          <!-- Empty state -->
          <tr v-if="items.length === 0">
            <td :colspan="emptyColspan" class="px-3 py-8 text-center text-muted-foreground">
              No items added yet. Click "Add Item" to get started.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add button -->
    <div v-if="canAdd" class="flex justify-start">
      <Button type="button" variant="outline" :disabled="disabled" @click="emit('add')">
        <Plus class="h-4 w-4 mr-2" />
        Add Item
      </Button>
    </div>

    <!-- Error display slot -->
    <slot name="errors" :errors="errors" />
  </div>
</template>
