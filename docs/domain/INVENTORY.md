# Inventory

> Products, BOMs, stock management, and variant groups

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      INVENTORY SYSTEM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐                                                 │
│  │  PRODUCTS   │  Base items in catalog                          │
│  │             │  (panels, inverters, cables, labor)             │
│  └──────┬──────┘                                                 │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐                                                 │
│  │    BOMs     │  Bill of Materials (recipes)                    │
│  │             │  Products + quantities + costs                  │
│  └──────┬──────┘                                                 │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐                                                 │
│  │  VARIANT    │  Groups of BOMs for selection                   │
│  │  GROUPS     │  (3.3kWp, 5.5kWp, 8.8kWp systems)              │
│  └─────────────┘                                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Products

### Data Model

```typescript
interface Product {
  id: number
  sku: string                   // e.g., "PNL-JINKO-545"
  name: string
  description: string
  category: string              // Solar Panel, Inverter, Cable, etc.
  unit: string                  // pcs, m, kg, etc.
  cost_price: number            // Purchase cost
  sell_price: number            // Selling price
  is_active: boolean
  created_at: string
}
```

### Categories

| Category | Examples |
|----------|----------|
| Solar Panel | Jinko 545W, LONGi 550W |
| Inverter | Huawei SUN2000, Growatt |
| Mounting | Rail, Clamp, Bracket |
| Cable | DC Cable, AC Cable |
| Accessory | MC4, Junction Box |
| Labor | Installation, Commissioning |

### API Hooks

```typescript
import {
  useProducts,              // List with filters
  useProduct,               // Single product
  useCreateProduct,         // Create
  useUpdateProduct,         // Update
  useDeleteProduct,         // Delete
  useProductLookup,         // Search autocomplete
} from '@/api/useProducts'
```

---

## Bill of Materials (BOM)

### Data Model

```typescript
interface BOM {
  id: number
  name: string                  // e.g., "5.5 kWp Standard Rooftop"
  description: string
  is_template: boolean          // Reusable template
  is_active: boolean
  capacity_kwp: number          // System capacity

  // Items
  items: BOMItem[]

  // Cost breakdown
  material_cost: number
  labor_cost: number
  overhead_cost: number
  total_cost: number

  // Margin
  margin_percent: number
  sell_price: number

  created_at: string
  updated_at: string
}

interface BOMItem {
  id: number
  product_id: number
  product: Product
  quantity: number
  unit_cost: number
  waste_percent: number         // Material waste allowance
  line_cost: number
  item_type: 'material' | 'labor' | 'overhead'
}
```

### Item Types

| Type | Description | Examples |
|------|-------------|----------|
| `material` | Physical items | Panels, inverters, cables |
| `labor` | Work hours | Installation, commissioning |
| `overhead` | Indirect costs | Transport, permits |

### Cost Calculation

```typescript
// Per item
const itemCost = quantity * unitCost * (1 + wastePercent / 100)

// Totals
const materialCost = items
  .filter(i => i.item_type === 'material')
  .reduce((sum, i) => sum + i.line_cost, 0)

const laborCost = items
  .filter(i => i.item_type === 'labor')
  .reduce((sum, i) => sum + i.line_cost, 0)

const overheadCost = items
  .filter(i => i.item_type === 'overhead')
  .reduce((sum, i) => sum + i.line_cost, 0)

const totalCost = materialCost + laborCost + overheadCost
const sellPrice = totalCost * (1 + marginPercent / 100)
```

### API Hooks

```typescript
import {
  useBoms,
  useBom,
  useCreateBom,
  useUpdateBom,
  useDeleteBom,
  useDuplicateBom,
  useActivateBom,
  useDeactivateBom,
  useBomCostCalculation,
} from '@/api/useBoms'
```

---

## Variant Groups

Variant groups organize BOMs for selection in solar proposals.

### Data Model

```typescript
interface VariantGroup {
  id: number
  name: string                  // e.g., "Standard Rooftop Systems"
  description: string
  is_active: boolean

  // Variants (BOMs in this group)
  variants: VariantGroupItem[]

  created_at: string
}

interface VariantGroupItem {
  id: number
  bom_id: number
  bom: BOM
  sort_order: number
  is_primary: boolean           // Default selection
}
```

### Example

```
Variant Group: "Standard Rooftop Systems"
├── 3.3 kWp System (6 panels)  - Rp 45,000,000
├── 5.5 kWp System (10 panels) - Rp 72,000,000  [PRIMARY]
├── 8.8 kWp System (16 panels) - Rp 110,000,000
└── 11 kWp System (20 panels)  - Rp 135,000,000
```

### Usage in Solar Proposals

```vue
<script setup lang="ts">
const { data: variantGroups } = useVariantGroups()

const selectedGroupId = ref<number | null>(null)
const selectedBomId = ref<number | null>(null)

const availableBoms = computed(() => {
  const group = variantGroups.value?.find(g => g.id === selectedGroupId.value)
  return group?.variants.map(v => v.bom) ?? []
})
</script>

<template>
  <FormField label="System Type">
    <Select
      v-model="selectedGroupId"
      :options="variantGroups?.map(g => ({ value: g.id, label: g.name }))"
    />
  </FormField>

  <FormField label="System Size">
    <Select
      v-model="selectedBomId"
      :options="availableBoms.map(b => ({
        value: b.id,
        label: `${b.name} - ${formatCurrency(b.sell_price)}`
      }))"
    />
  </FormField>
</template>
```

---

## Stock Management

### Stock Levels

```typescript
interface StockLevel {
  product_id: number
  product: Product
  quantity_on_hand: number
  quantity_reserved: number
  quantity_available: number    // on_hand - reserved
  location: string
  last_updated: string
}
```

### Stock Movements

```typescript
interface StockMovement {
  id: number
  product_id: number
  movement_type: 'in' | 'out' | 'adjustment' | 'transfer'
  quantity: number
  reference_type: string        // 'invoice', 'work_order', 'adjustment'
  reference_id: number
  notes: string
  created_at: string
}
```

### Movement Types

| Type | Description | Example |
|------|-------------|---------|
| `in` | Stock received | Purchase delivery |
| `out` | Stock issued | Work order consumption |
| `adjustment` | Correction | Inventory count |
| `transfer` | Between locations | Warehouse to site |

### API Hooks

```typescript
import {
  useInventoryLevels,         // Current stock levels
  useStockMovements,          // Movement history
  useCreateStockAdjustment,   // Adjust stock
  useCreateStockTransfer,     // Transfer between locations
} from '@/api/useInventory'
```

---

## BOM Templates

Reusable BOM templates for quick creation.

### Creating BOM from Template

```typescript
const { mutate: createFromTemplate } = useCreateBomFromTemplate()

function handleCreate(templateId: number, customizations: object) {
  createFromTemplate(
    { templateId, ...customizations },
    {
      onSuccess: (bom) => {
        router.push(`/boms/${bom.id}`)
      },
    }
  )
}
```

---

## Component Standards

Pre-defined components for BOM creation.

```typescript
interface ComponentStandard {
  id: number
  name: string                  // e.g., "Panel - Premium Tier"
  category: string
  products: Product[]           // Approved products for this standard
  is_active: boolean
}
```

Used to ensure consistent product selection across BOMs.

---

## Related Documentation

- [SOLAR-PROPOSALS.md](SOLAR-PROPOSALS.md) - Using BOMs in proposals
- [QUOTATION-WORKFLOW.md](QUOTATION-WORKFLOW.md) - Creating quotations from BOMs
- [GLOSSARY.md](GLOSSARY.md) - Terminology
