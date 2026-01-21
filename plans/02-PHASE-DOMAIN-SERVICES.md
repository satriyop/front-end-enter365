# Phase 2: Domain Services & Business Logic

## Overview

This phase extracts business logic from components into testable, reusable services. We apply the **Strategy Pattern** heavily to allow different calculation and validation behaviors without modifying core code.

**Prerequisites:** Phase 1 (Foundation & Core Infrastructure)

**Deliverables:**
1. Document Calculation Service with Strategy Pattern
2. Line Items Service for managing document items
3. Status Badge Service for centralized status mappings
4. Form Calculations Module

---

## 2.1 Document Calculation Service (Strategy Pattern)

### The Problem

Currently, every form page (Quotation, Invoice, Bill, PO) has its own calculation logic:

```typescript
// QuotationFormPage.vue - lines 180-220
const subtotal = computed(() => {
  return (form.items || []).reduce((sum, item) => {
    const gross = (item.quantity || 0) * (item.unit_price || 0)
    const discountAmount = item.discount_type === 'percent'
      ? gross * ((item.discount_value || 0) / 100)
      : (item.discount_value || 0)
    return sum + gross - discountAmount
  }, 0)
})

// BillFormPage.vue - nearly identical
// InvoiceFormPage.vue - nearly identical
// PurchaseOrderFormPage.vue - nearly identical
```

### The Solution: Strategy Pattern

```
┌──────────────────────────────────────────────────────────────────┐
│                    CalculationService                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ calculateLineTotal(item, taxStrategy, discountStrategy)     │ │
│  │ calculateSubtotal(items)                                    │ │
│  │ calculateTax(subtotal, taxStrategy)                         │ │
│  │ calculateDiscount(gross, item, discountStrategy)            │ │
│  │ calculateGrandTotal(subtotal, tax, additionalCharges)       │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ TaxStrategy   │     │DiscountStrategy│    │ RoundingStrategy│
├───────────────┤     ├───────────────┤     ├───────────────┤
│ PPNStrategy   │     │ PercentDiscount│    │ StandardRound │
│ InclusiveTax  │     │ AmountDiscount │    │ RoundUp       │
│ NoTax         │     │ TieredDiscount │    │ BankerRound   │
└───────────────┘     └───────────────┘     └───────────────┘
```

### Strategy Interfaces

```typescript
// src/services/calculation/strategies/types.ts
import type { LineItem } from '@/api/types'

/**
 * Tax calculation strategy
 */
export interface TaxStrategy {
  name: string
  rate: number
  calculate(subtotal: number): number
  isInclusive: boolean
}

/**
 * Discount calculation strategy
 */
export interface DiscountStrategy {
  name: string
  calculate(grossAmount: number, discountValue: number): number
}

/**
 * Rounding strategy
 */
export interface RoundingStrategy {
  name: string
  round(value: number, precision?: number): number
}

/**
 * Line item calculation input
 */
export interface CalculableLineItem {
  quantity: number
  unit_price: number
  discount_type?: 'percent' | 'amount' | null
  discount_value?: number | null
  tax_rate?: number | null
}

/**
 * Line item calculation result
 */
export interface LineItemCalculation {
  gross: number
  discount: number
  net: number
  tax: number
  total: number
}

/**
 * Document totals calculation result
 */
export interface DocumentTotals {
  subtotal: number
  totalDiscount: number
  taxableAmount: number
  tax: number
  grandTotal: number
}
```

### Tax Strategies

```typescript
// src/services/calculation/strategies/tax/PPNStrategy.ts
import type { TaxStrategy } from '../types'

/**
 * Indonesian PPN (Value Added Tax) - 11%
 */
export class PPNStrategy implements TaxStrategy {
  readonly name = 'PPN 11%'
  readonly rate = 0.11
  readonly isInclusive = false

  calculate(subtotal: number): number {
    return subtotal * this.rate
  }
}

// src/services/calculation/strategies/tax/InclusiveTaxStrategy.ts
export class InclusiveTaxStrategy implements TaxStrategy {
  readonly name: string
  readonly rate: number
  readonly isInclusive = true

  constructor(rate: number = 0.11, name: string = 'Inclusive Tax') {
    this.rate = rate
    this.name = name
  }

  calculate(subtotal: number): number {
    // Tax is already included in the price
    // Extract tax from inclusive amount: tax = amount - (amount / (1 + rate))
    return subtotal - (subtotal / (1 + this.rate))
  }
}

// src/services/calculation/strategies/tax/NoTaxStrategy.ts
export class NoTaxStrategy implements TaxStrategy {
  readonly name = 'No Tax'
  readonly rate = 0
  readonly isInclusive = false

  calculate(_subtotal: number): number {
    return 0
  }
}
```

### Discount Strategies

```typescript
// src/services/calculation/strategies/discount/PercentDiscountStrategy.ts
import type { DiscountStrategy } from '../types'

export class PercentDiscountStrategy implements DiscountStrategy {
  readonly name = 'Percentage'

  calculate(grossAmount: number, discountValue: number): number {
    const percentage = Math.min(discountValue, 100) // Cap at 100%
    return grossAmount * (percentage / 100)
  }
}

// src/services/calculation/strategies/discount/AmountDiscountStrategy.ts
export class AmountDiscountStrategy implements DiscountStrategy {
  readonly name = 'Fixed Amount'

  calculate(grossAmount: number, discountValue: number): number {
    // Discount cannot exceed gross amount
    return Math.min(discountValue, grossAmount)
  }
}

// src/services/calculation/strategies/discount/TieredDiscountStrategy.ts
export interface DiscountTier {
  minQuantity: number
  discountPercent: number
}

export class TieredDiscountStrategy implements DiscountStrategy {
  readonly name = 'Tiered'

  constructor(private tiers: DiscountTier[]) {
    // Sort tiers by minQuantity descending for easy lookup
    this.tiers = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity)
  }

  calculate(grossAmount: number, quantity: number): number {
    const tier = this.tiers.find((t) => quantity >= t.minQuantity)
    if (!tier) return 0
    return grossAmount * (tier.discountPercent / 100)
  }
}
```

### Rounding Strategies

```typescript
// src/services/calculation/strategies/rounding/StandardRoundingStrategy.ts
import type { RoundingStrategy } from '../types'

export class StandardRoundingStrategy implements RoundingStrategy {
  readonly name = 'Standard'

  round(value: number, precision: number = 0): number {
    const multiplier = Math.pow(10, precision)
    return Math.round(value * multiplier) / multiplier
  }
}

// src/services/calculation/strategies/rounding/RoundUpStrategy.ts
export class RoundUpStrategy implements RoundingStrategy {
  readonly name = 'Round Up'

  round(value: number, precision: number = 0): number {
    const multiplier = Math.pow(10, precision)
    return Math.ceil(value * multiplier) / multiplier
  }
}

// src/services/calculation/strategies/rounding/IndonesianRoundingStrategy.ts
/**
 * Indonesian business convention: round to nearest 100 or 1000
 */
export class IndonesianRoundingStrategy implements RoundingStrategy {
  readonly name = 'Indonesian (nearest 100)'

  constructor(private roundTo: number = 100) {}

  round(value: number): number {
    return Math.round(value / this.roundTo) * this.roundTo
  }
}
```

### Calculation Service

```typescript
// src/services/calculation/CalculationService.ts
import { eventBus } from '@/infrastructure/events'
import type {
  TaxStrategy,
  DiscountStrategy,
  RoundingStrategy,
  CalculableLineItem,
  LineItemCalculation,
  DocumentTotals,
} from './strategies/types'
import { PPNStrategy } from './strategies/tax/PPNStrategy'
import { PercentDiscountStrategy } from './strategies/discount/PercentDiscountStrategy'
import { AmountDiscountStrategy } from './strategies/discount/AmountDiscountStrategy'
import { StandardRoundingStrategy } from './strategies/rounding/StandardRoundingStrategy'

export interface CalculationServiceOptions {
  taxStrategy?: TaxStrategy
  roundingStrategy?: RoundingStrategy
  defaultDiscountStrategy?: DiscountStrategy
}

export class CalculationService {
  private taxStrategy: TaxStrategy
  private roundingStrategy: RoundingStrategy
  private percentDiscountStrategy: DiscountStrategy
  private amountDiscountStrategy: DiscountStrategy

  constructor(options: CalculationServiceOptions = {}) {
    this.taxStrategy = options.taxStrategy ?? new PPNStrategy()
    this.roundingStrategy = options.roundingStrategy ?? new StandardRoundingStrategy()
    this.percentDiscountStrategy = new PercentDiscountStrategy()
    this.amountDiscountStrategy = new AmountDiscountStrategy()
  }

  /**
   * Calculate a single line item
   */
  calculateLineItem(item: CalculableLineItem): LineItemCalculation {
    const quantity = item.quantity || 0
    const unitPrice = item.unit_price || 0
    const gross = quantity * unitPrice

    // Calculate discount based on type
    let discount = 0
    if (item.discount_value && item.discount_value > 0) {
      const strategy = item.discount_type === 'percent'
        ? this.percentDiscountStrategy
        : this.amountDiscountStrategy

      discount = strategy.calculate(gross, item.discount_value)
    }

    const net = gross - discount

    // Calculate tax on net amount
    const taxRate = item.tax_rate ?? this.taxStrategy.rate
    const tax = this.taxStrategy.isInclusive
      ? net - (net / (1 + taxRate))
      : net * taxRate

    const total = this.taxStrategy.isInclusive ? net : net + tax

    return {
      gross: this.round(gross),
      discount: this.round(discount),
      net: this.round(net),
      tax: this.round(tax),
      total: this.round(total),
    }
  }

  /**
   * Calculate all line items
   */
  calculateLineItems(items: CalculableLineItem[]): LineItemCalculation[] {
    return items.map((item) => this.calculateLineItem(item))
  }

  /**
   * Calculate document totals
   */
  calculateTotals(items: CalculableLineItem[]): DocumentTotals {
    const calculations = this.calculateLineItems(items)

    const subtotal = calculations.reduce((sum, calc) => sum + calc.net, 0)
    const totalDiscount = calculations.reduce((sum, calc) => sum + calc.discount, 0)
    const tax = calculations.reduce((sum, calc) => sum + calc.tax, 0)
    const grandTotal = calculations.reduce((sum, calc) => sum + calc.total, 0)

    const result: DocumentTotals = {
      subtotal: this.round(subtotal),
      totalDiscount: this.round(totalDiscount),
      taxableAmount: this.round(subtotal),
      tax: this.round(tax),
      grandTotal: this.round(grandTotal),
    }

    // Emit event for observability
    eventBus.emit('document:updated', {
      documentType: 'calculation',
      id: 0,
      changes: ['totals'],
    })

    return result
  }

  /**
   * Apply rounding strategy
   */
  private round(value: number): number {
    return this.roundingStrategy.round(value)
  }

  /**
   * Get current tax strategy info
   */
  getTaxInfo(): { name: string; rate: number; isInclusive: boolean } {
    return {
      name: this.taxStrategy.name,
      rate: this.taxStrategy.rate,
      isInclusive: this.taxStrategy.isInclusive,
    }
  }

  /**
   * Create a new service with different tax strategy
   */
  withTaxStrategy(strategy: TaxStrategy): CalculationService {
    return new CalculationService({
      taxStrategy: strategy,
      roundingStrategy: this.roundingStrategy,
    })
  }
}

// Default singleton instance
export const calculationService = new CalculationService()
```

### Vue Composable

```typescript
// src/services/calculation/useCalculation.ts
import { computed, type Ref } from 'vue'
import { CalculationService, type CalculationServiceOptions } from './CalculationService'
import type { CalculableLineItem, DocumentTotals, LineItemCalculation } from './strategies/types'

export function useCalculation(
  items: Ref<CalculableLineItem[]>,
  options?: CalculationServiceOptions
) {
  const service = new CalculationService(options)

  /**
   * Calculated totals (reactive)
   */
  const totals = computed<DocumentTotals>(() => {
    return service.calculateTotals(items.value)
  })

  /**
   * Individual line calculations (reactive)
   */
  const lineCalculations = computed<LineItemCalculation[]>(() => {
    return service.calculateLineItems(items.value)
  })

  /**
   * Get calculation for specific line
   */
  function getLineCalculation(index: number): LineItemCalculation | null {
    return lineCalculations.value[index] ?? null
  }

  /**
   * Tax info
   */
  const taxInfo = computed(() => service.getTaxInfo())

  return {
    totals,
    lineCalculations,
    getLineCalculation,
    taxInfo,
    service,
  }
}
```

---

## 2.2 Line Items Service

### The Problem

Every document form manually manages line items with similar code:
- Add/remove items
- Reorder items
- Update quantities with validation
- Calculate per-line totals

### The Solution

```typescript
// src/services/line-items/types.ts
export interface BaseLineItem {
  id?: number
  product_id?: number | null
  description?: string
  quantity: number
  unit_price: number
  discount_type?: 'percent' | 'amount' | null
  discount_value?: number | null
  unit?: string
  notes?: string
}

export interface LineItemsConfig {
  minItems?: number
  maxItems?: number
  requireProduct?: boolean
  defaultItem?: Partial<BaseLineItem>
}
```

```typescript
// src/services/line-items/LineItemsService.ts
import { ref, computed, type Ref } from 'vue'
import type { BaseLineItem, LineItemsConfig } from './types'
import { eventBus } from '@/infrastructure/events'

const DEFAULT_LINE_ITEM: BaseLineItem = {
  product_id: null,
  description: '',
  quantity: 1,
  unit_price: 0,
  discount_type: null,
  discount_value: null,
  unit: 'pcs',
  notes: '',
}

export function createLineItemsService<T extends BaseLineItem>(
  initialItems: T[] = [],
  config: LineItemsConfig = {}
) {
  const {
    minItems = 0,
    maxItems = 100,
    defaultItem = {},
  } = config

  const items: Ref<T[]> = ref(
    initialItems.length > 0
      ? initialItems
      : minItems > 0
        ? [{ ...DEFAULT_LINE_ITEM, ...defaultItem } as T]
        : []
  )

  /**
   * Can add more items?
   */
  const canAdd = computed(() => items.value.length < maxItems)

  /**
   * Can remove items?
   */
  const canRemove = computed(() => items.value.length > minItems)

  /**
   * Has items?
   */
  const hasItems = computed(() => items.value.length > 0)

  /**
   * Item count
   */
  const count = computed(() => items.value.length)

  /**
   * Add a new line item
   */
  function addItem(item?: Partial<T>): void {
    if (!canAdd.value) return

    const newItem = {
      ...DEFAULT_LINE_ITEM,
      ...defaultItem,
      ...item,
    } as T

    items.value.push(newItem)

    eventBus.emit('user:action', {
      action: 'line-item-added',
      target: 'line-items',
    })
  }

  /**
   * Remove a line item by index
   */
  function removeItem(index: number): void {
    if (!canRemove.value) return
    if (index < 0 || index >= items.value.length) return

    items.value.splice(index, 1)

    eventBus.emit('user:action', {
      action: 'line-item-removed',
      target: 'line-items',
    })
  }

  /**
   * Update a line item
   */
  function updateItem(index: number, updates: Partial<T>): void {
    if (index < 0 || index >= items.value.length) return

    items.value[index] = {
      ...items.value[index],
      ...updates,
    }
  }

  /**
   * Move item to a new position
   */
  function moveItem(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= items.value.length) return
    if (toIndex < 0 || toIndex >= items.value.length) return

    const [item] = items.value.splice(fromIndex, 1)
    items.value.splice(toIndex, 0, item)
  }

  /**
   * Duplicate an item
   */
  function duplicateItem(index: number): void {
    if (!canAdd.value) return
    if (index < 0 || index >= items.value.length) return

    const original = items.value[index]
    const duplicate = { ...original, id: undefined } as T

    items.value.splice(index + 1, 0, duplicate)
  }

  /**
   * Clear all items
   */
  function clearItems(): void {
    items.value = minItems > 0
      ? [{ ...DEFAULT_LINE_ITEM, ...defaultItem } as T]
      : []
  }

  /**
   * Set items (replace all)
   */
  function setItems(newItems: T[]): void {
    items.value = newItems
  }

  /**
   * Get item at index
   */
  function getItem(index: number): T | undefined {
    return items.value[index]
  }

  /**
   * Find item by product ID
   */
  function findByProductId(productId: number): { item: T; index: number } | null {
    const index = items.value.findIndex((item) => item.product_id === productId)
    if (index === -1) return null
    return { item: items.value[index], index }
  }

  /**
   * Validate all items
   */
  function validate(): { valid: boolean; errors: Map<number, string[]> } {
    const errors = new Map<number, string[]>()

    items.value.forEach((item, index) => {
      const itemErrors: string[] = []

      if (item.quantity <= 0) {
        itemErrors.push('Quantity must be greater than 0')
      }

      if (item.unit_price < 0) {
        itemErrors.push('Unit price cannot be negative')
      }

      if (config.requireProduct && !item.product_id) {
        itemErrors.push('Product is required')
      }

      if (itemErrors.length > 0) {
        errors.set(index, itemErrors)
      }
    })

    return {
      valid: errors.size === 0,
      errors,
    }
  }

  return {
    // Reactive state
    items,
    count,
    canAdd,
    canRemove,
    hasItems,

    // Actions
    addItem,
    removeItem,
    updateItem,
    moveItem,
    duplicateItem,
    clearItems,
    setItems,

    // Queries
    getItem,
    findByProductId,
    validate,
  }
}

export type LineItemsService<T extends BaseLineItem> = ReturnType<typeof createLineItemsService<T>>
```

### Usage in Composable

```typescript
// src/composables/useLineItems.ts
import { watch, type Ref } from 'vue'
import { createLineItemsService, type LineItemsConfig } from '@/services/line-items'
import { useCalculation } from '@/services/calculation'
import type { BaseLineItem } from '@/services/line-items/types'
import type { CalculationServiceOptions } from '@/services/calculation'

export interface UseLineItemsOptions<T extends BaseLineItem> {
  initialItems?: T[]
  lineItemsConfig?: LineItemsConfig
  calculationConfig?: CalculationServiceOptions
  onItemsChange?: (items: T[]) => void
}

export function useLineItems<T extends BaseLineItem>(
  options: UseLineItemsOptions<T> = {}
) {
  const {
    initialItems = [],
    lineItemsConfig = {},
    calculationConfig = {},
    onItemsChange,
  } = options

  // Line items management
  const lineItems = createLineItemsService<T>(initialItems, lineItemsConfig)

  // Calculations
  const calculations = useCalculation(lineItems.items as Ref<T[]>, calculationConfig)

  // Watch for changes
  if (onItemsChange) {
    watch(lineItems.items, (newItems) => {
      onItemsChange(newItems)
    }, { deep: true })
  }

  return {
    // From line items service
    items: lineItems.items,
    count: lineItems.count,
    canAdd: lineItems.canAdd,
    canRemove: lineItems.canRemove,
    hasItems: lineItems.hasItems,
    addItem: lineItems.addItem,
    removeItem: lineItems.removeItem,
    updateItem: lineItems.updateItem,
    moveItem: lineItems.moveItem,
    duplicateItem: lineItems.duplicateItem,
    clearItems: lineItems.clearItems,
    setItems: lineItems.setItems,
    validateItems: lineItems.validate,

    // From calculations
    totals: calculations.totals,
    lineCalculations: calculations.lineCalculations,
    getLineCalculation: calculations.getLineCalculation,
    taxInfo: calculations.taxInfo,
  }
}
```

---

## 2.3 Status Badge Service

### The Problem

Status color mappings are duplicated across multiple files:

```typescript
// usePurchaseOrders.ts
export function getPurchaseOrderStatus(po) { ... }

// useDeliveryOrders.ts
export function getDeliveryOrderStatus(do) { ... }

// InvoiceDetailPage.vue
const statusColor = computed(() => { ... })
```

### The Solution: Centralized Status Registry

```typescript
// src/services/status/types.ts
export type StatusVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info'

export interface StatusConfig {
  label: string
  variant: StatusVariant
  icon?: string
  description?: string
}

export type StatusRegistry = Record<string, StatusConfig>

export interface DocumentStatusRegistry {
  quotation: StatusRegistry
  invoice: StatusRegistry
  bill: StatusRegistry
  purchase_order: StatusRegistry
  delivery_order: StatusRegistry
  work_order: StatusRegistry
  payment: StatusRegistry
  journal_entry: StatusRegistry
}
```

```typescript
// src/services/status/statusRegistry.ts
import type { DocumentStatusRegistry, StatusConfig, StatusVariant } from './types'

export const STATUS_REGISTRY: DocumentStatusRegistry = {
  quotation: {
    draft: { label: 'Draft', variant: 'secondary', description: 'Not yet submitted' },
    submitted: { label: 'Submitted', variant: 'info', description: 'Awaiting approval' },
    approved: { label: 'Approved', variant: 'success', description: 'Ready for invoicing' },
    rejected: { label: 'Rejected', variant: 'destructive', description: 'Rejected by approver' },
    expired: { label: 'Expired', variant: 'warning', description: 'Past validity date' },
    converted: { label: 'Converted', variant: 'primary', description: 'Converted to invoice' },
    cancelled: { label: 'Cancelled', variant: 'secondary', description: 'Cancelled by user' },
  },

  invoice: {
    draft: { label: 'Draft', variant: 'secondary' },
    sent: { label: 'Sent', variant: 'info' },
    partial: { label: 'Partial', variant: 'warning' },
    paid: { label: 'Paid', variant: 'success' },
    overdue: { label: 'Overdue', variant: 'destructive' },
    cancelled: { label: 'Cancelled', variant: 'secondary' },
    void: { label: 'Void', variant: 'secondary' },
  },

  bill: {
    draft: { label: 'Draft', variant: 'secondary' },
    pending: { label: 'Pending', variant: 'info' },
    approved: { label: 'Approved', variant: 'success' },
    partial: { label: 'Partial', variant: 'warning' },
    paid: { label: 'Paid', variant: 'success' },
    overdue: { label: 'Overdue', variant: 'destructive' },
    cancelled: { label: 'Cancelled', variant: 'secondary' },
  },

  purchase_order: {
    draft: { label: 'Draft', variant: 'secondary' },
    submitted: { label: 'Submitted', variant: 'info' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'destructive' },
    partial: { label: 'Partial', variant: 'warning' },
    received: { label: 'Received', variant: 'success' },
    cancelled: { label: 'Cancelled', variant: 'secondary' },
  },

  delivery_order: {
    draft: { label: 'Draft', variant: 'secondary' },
    confirmed: { label: 'Confirmed', variant: 'info' },
    in_transit: { label: 'In Transit', variant: 'warning' },
    delivered: { label: 'Delivered', variant: 'success' },
    cancelled: { label: 'Cancelled', variant: 'secondary' },
  },

  work_order: {
    draft: { label: 'Draft', variant: 'secondary' },
    in_progress: { label: 'In Progress', variant: 'info' },
    completed: { label: 'Completed', variant: 'success' },
    cancelled: { label: 'Cancelled', variant: 'secondary' },
  },

  payment: {
    pending: { label: 'Pending', variant: 'warning' },
    completed: { label: 'Completed', variant: 'success' },
    failed: { label: 'Failed', variant: 'destructive' },
    refunded: { label: 'Refunded', variant: 'info' },
  },

  journal_entry: {
    draft: { label: 'Draft', variant: 'secondary' },
    posted: { label: 'Posted', variant: 'success' },
    reversed: { label: 'Reversed', variant: 'warning' },
  },
}

// Default fallback
const DEFAULT_STATUS: StatusConfig = {
  label: 'Unknown',
  variant: 'secondary',
}
```

```typescript
// src/services/status/StatusService.ts
import { STATUS_REGISTRY } from './statusRegistry'
import type { DocumentStatusRegistry, StatusConfig, StatusVariant } from './types'

type DocumentType = keyof DocumentStatusRegistry

export class StatusService {
  private registry: DocumentStatusRegistry

  constructor(customRegistry?: Partial<DocumentStatusRegistry>) {
    this.registry = { ...STATUS_REGISTRY, ...customRegistry }
  }

  /**
   * Get status configuration for a document type and status
   */
  getStatus(documentType: DocumentType, status: string): StatusConfig {
    const docStatuses = this.registry[documentType]
    return docStatuses?.[status] ?? { label: status, variant: 'secondary' }
  }

  /**
   * Get status label
   */
  getLabel(documentType: DocumentType, status: string): string {
    return this.getStatus(documentType, status).label
  }

  /**
   * Get status variant for Badge component
   */
  getVariant(documentType: DocumentType, status: string): StatusVariant {
    return this.getStatus(documentType, status).variant
  }

  /**
   * Get all statuses for a document type
   */
  getStatuses(documentType: DocumentType): Array<{ value: string } & StatusConfig> {
    const docStatuses = this.registry[documentType]
    return Object.entries(docStatuses).map(([value, config]) => ({
      value,
      ...config,
    }))
  }

  /**
   * Get statuses as Select options
   */
  getSelectOptions(
    documentType: DocumentType,
    includeAll: boolean = false
  ): Array<{ value: string; label: string }> {
    const options = this.getStatuses(documentType).map((s) => ({
      value: s.value,
      label: s.label,
    }))

    if (includeAll) {
      return [{ value: '', label: 'All Status' }, ...options]
    }

    return options
  }

  /**
   * Check if status is "active" (not cancelled/void/rejected)
   */
  isActive(documentType: DocumentType, status: string): boolean {
    const inactiveStatuses = ['cancelled', 'void', 'rejected']
    return !inactiveStatuses.includes(status)
  }

  /**
   * Check if status is "final" (cannot be changed)
   */
  isFinal(documentType: DocumentType, status: string): boolean {
    const finalStatuses = ['paid', 'completed', 'delivered', 'converted', 'posted']
    return finalStatuses.includes(status)
  }
}

// Singleton instance
export const statusService = new StatusService()
```

### Vue Composable

```typescript
// src/services/status/useStatus.ts
import { computed } from 'vue'
import { statusService } from './StatusService'
import type { DocumentStatusRegistry } from './types'

type DocumentType = keyof DocumentStatusRegistry

export function useStatus<D extends DocumentType>(documentType: D) {
  /**
   * Get status config for a value
   */
  function getStatus(status: string) {
    return statusService.getStatus(documentType, status)
  }

  /**
   * Status options for Select
   */
  const statusOptions = computed(() =>
    statusService.getSelectOptions(documentType, true)
  )

  /**
   * Status options without "All"
   */
  const statusOptionsWithoutAll = computed(() =>
    statusService.getSelectOptions(documentType, false)
  )

  return {
    getStatus,
    getLabel: (status: string) => statusService.getLabel(documentType, status),
    getVariant: (status: string) => statusService.getVariant(documentType, status),
    statusOptions,
    statusOptionsWithoutAll,
    isActive: (status: string) => statusService.isActive(documentType, status),
    isFinal: (status: string) => statusService.isFinal(documentType, status),
  }
}
```

---

## 2.4 File Structure

```
src/services/
├── index.ts                        # Re-exports
│
├── calculation/
│   ├── index.ts
│   ├── CalculationService.ts       # Main service
│   ├── useCalculation.ts           # Vue composable
│   ├── strategies/
│   │   ├── types.ts
│   │   ├── tax/
│   │   │   ├── PPNStrategy.ts
│   │   │   ├── InclusiveTaxStrategy.ts
│   │   │   └── NoTaxStrategy.ts
│   │   ├── discount/
│   │   │   ├── PercentDiscountStrategy.ts
│   │   │   ├── AmountDiscountStrategy.ts
│   │   │   └── TieredDiscountStrategy.ts
│   │   └── rounding/
│   │       ├── StandardRoundingStrategy.ts
│   │       ├── RoundUpStrategy.ts
│   │       └── IndonesianRoundingStrategy.ts
│   └── __tests__/
│       ├── CalculationService.test.ts
│       └── strategies.test.ts
│
├── line-items/
│   ├── index.ts
│   ├── types.ts
│   ├── LineItemsService.ts
│   └── __tests__/
│       └── LineItemsService.test.ts
│
└── status/
    ├── index.ts
    ├── types.ts
    ├── statusRegistry.ts
    ├── StatusService.ts
    ├── useStatus.ts
    └── __tests__/
        └── StatusService.test.ts
```

---

## Testing

### Calculation Service Tests

```typescript
// src/services/calculation/__tests__/CalculationService.test.ts
import { describe, it, expect } from 'vitest'
import { CalculationService } from '../CalculationService'
import { PPNStrategy } from '../strategies/tax/PPNStrategy'
import { NoTaxStrategy } from '../strategies/tax/NoTaxStrategy'
import { InclusiveTaxStrategy } from '../strategies/tax/InclusiveTaxStrategy'

describe('CalculationService', () => {
  describe('calculateLineItem', () => {
    it('calculates basic line item correctly', () => {
      const service = new CalculationService()
      const result = service.calculateLineItem({
        quantity: 2,
        unit_price: 100000,
      })

      expect(result.gross).toBe(200000)
      expect(result.discount).toBe(0)
      expect(result.net).toBe(200000)
      expect(result.tax).toBe(22000) // 11% PPN
      expect(result.total).toBe(222000)
    })

    it('applies percent discount correctly', () => {
      const service = new CalculationService()
      const result = service.calculateLineItem({
        quantity: 1,
        unit_price: 100000,
        discount_type: 'percent',
        discount_value: 10,
      })

      expect(result.gross).toBe(100000)
      expect(result.discount).toBe(10000)
      expect(result.net).toBe(90000)
    })

    it('applies amount discount correctly', () => {
      const service = new CalculationService()
      const result = service.calculateLineItem({
        quantity: 1,
        unit_price: 100000,
        discount_type: 'amount',
        discount_value: 5000,
      })

      expect(result.discount).toBe(5000)
      expect(result.net).toBe(95000)
    })

    it('caps discount at gross amount', () => {
      const service = new CalculationService()
      const result = service.calculateLineItem({
        quantity: 1,
        unit_price: 100000,
        discount_type: 'amount',
        discount_value: 150000, // More than gross
      })

      expect(result.discount).toBe(100000) // Capped at gross
      expect(result.net).toBe(0)
    })
  })

  describe('with different tax strategies', () => {
    it('uses no tax strategy', () => {
      const service = new CalculationService({ taxStrategy: new NoTaxStrategy() })
      const result = service.calculateLineItem({
        quantity: 1,
        unit_price: 100000,
      })

      expect(result.tax).toBe(0)
      expect(result.total).toBe(100000)
    })

    it('handles inclusive tax correctly', () => {
      const service = new CalculationService({
        taxStrategy: new InclusiveTaxStrategy(0.11),
      })
      const result = service.calculateLineItem({
        quantity: 1,
        unit_price: 111000, // Price includes tax
      })

      expect(result.net).toBe(111000)
      // Tax extracted from inclusive price
      expect(result.tax).toBeCloseTo(11000, -2)
      expect(result.total).toBe(111000) // Same as net for inclusive
    })
  })

  describe('calculateTotals', () => {
    it('calculates document totals correctly', () => {
      const service = new CalculationService()
      const result = service.calculateTotals([
        { quantity: 2, unit_price: 100000 },
        { quantity: 1, unit_price: 50000, discount_type: 'percent', discount_value: 10 },
      ])

      expect(result.subtotal).toBe(245000) // 200000 + 45000
      expect(result.totalDiscount).toBe(5000)
      expect(result.tax).toBe(26950) // 11% of 245000
      expect(result.grandTotal).toBe(271950)
    })
  })
})
```

### Line Items Service Tests

```typescript
// src/services/line-items/__tests__/LineItemsService.test.ts
import { describe, it, expect } from 'vitest'
import { createLineItemsService } from '../LineItemsService'

describe('LineItemsService', () => {
  it('creates with default empty items', () => {
    const service = createLineItemsService()
    expect(service.items.value).toHaveLength(0)
    expect(service.hasItems.value).toBe(false)
  })

  it('creates with initial items', () => {
    const service = createLineItemsService([
      { quantity: 1, unit_price: 100000 },
    ])
    expect(service.items.value).toHaveLength(1)
    expect(service.hasItems.value).toBe(true)
  })

  it('enforces minimum items', () => {
    const service = createLineItemsService([], { minItems: 1 })
    expect(service.items.value).toHaveLength(1)
    expect(service.canRemove.value).toBe(false)
  })

  it('adds items correctly', () => {
    const service = createLineItemsService()
    service.addItem({ quantity: 5, unit_price: 50000 })

    expect(service.items.value).toHaveLength(1)
    expect(service.items.value[0].quantity).toBe(5)
  })

  it('removes items correctly', () => {
    const service = createLineItemsService([
      { quantity: 1, unit_price: 100 },
      { quantity: 2, unit_price: 200 },
    ])

    service.removeItem(0)

    expect(service.items.value).toHaveLength(1)
    expect(service.items.value[0].quantity).toBe(2)
  })

  it('enforces maximum items', () => {
    const service = createLineItemsService([], { maxItems: 2 })
    service.addItem({ quantity: 1, unit_price: 100 })
    service.addItem({ quantity: 2, unit_price: 200 })
    service.addItem({ quantity: 3, unit_price: 300 })

    expect(service.items.value).toHaveLength(2)
    expect(service.canAdd.value).toBe(false)
  })

  it('validates items', () => {
    const service = createLineItemsService([
      { quantity: 0, unit_price: 100 }, // Invalid quantity
      { quantity: 1, unit_price: -50 }, // Invalid price
    ])

    const { valid, errors } = service.validate()

    expect(valid).toBe(false)
    expect(errors.get(0)).toContain('Quantity must be greater than 0')
    expect(errors.get(1)).toContain('Unit price cannot be negative')
  })
})
```

---

## Checklist

- [ ] Calculation service with Strategy pattern
- [ ] Tax strategies (PPN, Inclusive, NoTax)
- [ ] Discount strategies (Percent, Amount, Tiered)
- [ ] Rounding strategies (Standard, RoundUp, Indonesian)
- [ ] `useCalculation` composable
- [ ] Line items service (add, remove, update, move)
- [ ] Status registry with all document types
- [ ] `useStatus` composable
- [ ] Unit tests for all services
- [ ] Integration with event bus

---

## Next Phase

Once Phase 2 is complete, proceed to [Phase 3: Composables Consolidation](./03-PHASE-COMPOSABLES.md) to build the unified `useDocumentForm` and other composables that use these services.
