# Enter365 Services & Strategy Pattern

## Service Layer Overview

Services encapsulate domain logic and use the **Strategy Pattern** for extensibility.

Location: `src/services/`

## Service Inventory (9 services)

| Service | Purpose | Strategies |
|---------|---------|------------|
| `CalculationService` | Line item & document calculations | Tax (3), Discount (3), Rounding (3) |
| `StatusService` | Status colors, labels, transitions | Registry-based per document type |
| `PricingService` | Price lookups & tier calculations | Standard, Volume, Contract |
| `ExportService` | Document exports | CSV, Excel |
| `DocumentNumberService` | Auto-numbering | Sequential, Monthly Reset |
| `NotificationService` | User notifications | Toast, Browser Push |
| `LineItemsService` | Line item CRUD & validation | Factory-based |
| `StateMachine` | Workflow state machines | 3 machine definitions |

## Strategy Pattern Implementation

### Structure
```
src/services/{service-name}/
├── {ServiceName}Service.ts    # Main service class
├── index.ts                   # Barrel exports
├── types.ts                   # Interfaces & types
├── use{ServiceName}.ts        # Vue composable wrapper
├── __tests__/                 # Unit tests
│   └── {ServiceName}Service.test.ts
└── strategies/                # Strategy implementations
    ├── index.ts
    ├── {Strategy1}.ts
    └── {Strategy2}.ts
```

### Creating a New Strategy

```typescript
// 1. Define the strategy interface in types.ts
export interface TaxStrategy {
  name: string
  calculate(subtotal: number): number
  getRate(): number
}

// 2. Implement the strategy
export class PPNStrategy implements TaxStrategy {
  name = 'PPN 11%'
  private rate = 0.11

  calculate(subtotal: number): number {
    return Math.round(subtotal * this.rate)
  }

  getRate(): number {
    return this.rate
  }
}

// 3. Export from strategies/index.ts
export { PPNStrategy } from './PPNStrategy'

// 4. Use in service
const service = new CalculationService({
  taxStrategy: new PPNStrategy(),
  discountStrategy: new PercentDiscountStrategy(),
  roundingStrategy: new StandardRoundingStrategy(),
})
```

## CalculationService

### Configuration
```typescript
interface CalculationConfig {
  taxStrategy: TaxStrategy
  discountStrategy: DiscountStrategy
  roundingStrategy: RoundingStrategy
  taxMode: 'exclusive' | 'inclusive'
}
```

### Available Strategies

**Tax Strategies:**
- `PPNStrategy` - Indonesian PPN 11% (exclusive)
- `InclusiveTaxStrategy` - Tax included in price
- `NoTaxStrategy` - Zero tax

**Discount Strategies:**
- `PercentDiscountStrategy` - Percentage discount
- `AmountDiscountStrategy` - Fixed amount discount
- `TieredDiscountStrategy` - Volume-based tiers (uses `DiscountTier[]`)

**Rounding Strategies:**
- `StandardRoundingStrategy` - Math.round()
- `RoundUpStrategy` - Math.ceil()
- `IndonesianRoundingStrategy` - Round to nearest 100

### Usage
```typescript
import { calculationService, UseCalculationReturn } from '@/services'

// Direct service usage
const result = calculationService.calculateLineItem({
  quantity: 10,
  unitPrice: 100000,
  discountPercent: 5,
})
// Returns: { gross, discount, net, tax, total }

// Vue composable
const { calculate, calculateDocument } = useCalculation()
const totals = calculateDocument(lineItems)
```

### Types
```typescript
interface CalculableLineItem {
  quantity: number
  unitPrice: number
  discountPercent?: number
  discountAmount?: number
}

interface LineItemCalculation {
  gross: number
  discount: number
  net: number
  tax: number
  total: number
}

interface DocumentTotals {
  subtotal: number
  totalDiscount: number
  taxableAmount: number
  tax: number
  grandTotal: number
}
```

## StatusService

### Registering Document Statuses
```typescript
// src/services/status/statusRegistry.ts
export const quotationStatuses: StatusConfig[] = [
  { value: 'draft', label: 'Draft', color: 'default', allowedTransitions: ['pending'] },
  { value: 'pending', label: 'Pending', color: 'warning', allowedTransitions: ['approved', 'rejected'] },
  { value: 'approved', label: 'Approved', color: 'success', allowedTransitions: ['converted'] },
  { value: 'rejected', label: 'Rejected', color: 'destructive', allowedTransitions: [] },
  { value: 'converted', label: 'Converted', color: 'info', allowedTransitions: [] },
]
```

### Exports
```typescript
import {
  StatusService, statusService, useStatus,
  STATUS_REGISTRY, DEFAULT_STATUS_CONFIG,
  type UseStatusReturn, StatusVariant, StatusConfig,
  StatusRegistry, DocumentStatusRegistry, DocumentType,
} from '@/services'
```

### Usage
```typescript
const { getStatusBadge, canTransitionTo, getNextStatuses } = useStatus('quotation')

const badge = getStatusBadge('approved')
// { label: 'Approved', variant: 'success' }

const canApprove = canTransitionTo('pending', 'approved') // true
const nextOptions = getNextStatuses('pending') // ['approved', 'rejected']
```

## PricingService

### Strategies
- `StandardPricingStrategy` - Use product's base price (priority: 0)
- `VolumeDiscountStrategy` - Quantity-based pricing tiers (priority: 5)
- `ContractPricingStrategy` - Customer-specific contract prices (priority: 10, highest)

### Usage
```typescript
import { usePricing } from '@/services/pricing'

const { getPrice, getPriceWithTiers } = usePricing()

const price = await getPrice({
  productId: 123,
  quantity: 100,
  customerId: 456,
})

// Returns PricingResult: { finalPrice, discount, discountPercent, pricingRule }
```

### Contract Pricing
```typescript
const strategy = new ContractPricingStrategy()
strategy.addContract({
  customerId: 456,
  productId: 123,
  contractPrice: 85000,
  validFrom: '2025-01-01',
  validUntil: '2025-12-31',
})
```

## ExportService

### Strategies
- `CSVExportStrategy` - CSV with UTF-8 BOM for Excel compatibility, custom delimiters, format options (currency, percent, date, number)
- `ExcelExportStrategy` - XLSX with formatting (lazy-loaded)

### Usage
```typescript
import { useExport } from '@/services/export'

const { exportToCSV, exportToExcel } = useExport()

await exportToCSV(invoices, {
  filename: 'invoices.csv',
  columns: ['number', 'date', 'customer', 'total'],
})
```

## DocumentNumberService

### Strategies
- `SequentialStrategy` - Sequential with prefix/suffix and leading zeros
- `MonthlyResetStrategy` - Monthly counter reset (e.g., INV/2025-01/0001)

### Usage
```typescript
import { documentNumberService } from '@/services/document-number'

const number = documentNumberService.generate('invoice')
// e.g., "INV-2025-0042"

const preview = documentNumberService.preview('invoice')
// Preview next number without consuming it
```

## NotificationService

### Strategies
- `ToastStrategy` - In-app toast/snackbar notifications (uses toast library)
- `BrowserNotificationStrategy` - Native browser desktop notifications (permission-based)

### Architecture
- Singleton pattern: `notificationService` instance
- Multi-channel: all available strategies execute in parallel
- Promise-based with `Promise.allSettled()` for error resilience

### Usage
```typescript
import { notificationService } from '@/services/notification'

// Convenience methods
notificationService.info('Document saved', 'Your changes have been saved')
notificationService.success('Order confirmed', 'Order #123 placed successfully')
notificationService.warning('Low stock', 'Product XYZ is running low')
notificationService.error('Failed to save', 'Please check your connection')
```

### Types
```typescript
interface NotificationStrategy {
  name: string
  notify(payload: NotificationPayload): Promise<void>
  isAvailable(): boolean
}

interface NotificationPayload {
  title: string
  message: string
  level: 'info' | 'success' | 'warning' | 'error'
}
```

## LineItemsService

### Factory-based (no strategies)
```typescript
import { createLineItemsService } from '@/services'
import type { BaseLineItem, LineItemsConfig, ValidationResult } from '@/services'

const service = createLineItemsService({
  minItems: 1,
  maxItems: 100,
  validateItem: (item) => { /* custom validation */ },
})
```

## Creating a New Service

### Template
```typescript
// src/services/my-service/types.ts
export interface MyStrategy {
  name: string
  execute(input: Input): Output
}

export interface MyServiceConfig {
  strategy: MyStrategy
}

// src/services/my-service/MyService.ts
export class MyService {
  private strategy: MyStrategy

  constructor(config: MyServiceConfig) {
    this.strategy = config.strategy
  }

  execute(input: Input): Output {
    return this.strategy.execute(input)
  }

  setStrategy(strategy: MyStrategy): void {
    this.strategy = strategy
  }
}

// src/services/my-service/useMyService.ts
const service = new MyService({ strategy: new DefaultStrategy() })

export function useMyService() {
  return {
    execute: (input: Input) => service.execute(input),
    setStrategy: (s: MyStrategy) => service.setStrategy(s),
  }
}

// src/services/my-service/index.ts
export { MyService } from './MyService'
export { useMyService } from './useMyService'
export * from './strategies'
export type * from './types'
```

## Service Registration (DI Container)

```typescript
// src/infrastructure/container/index.ts
import { ServiceTokens } from './types'

container.register(ServiceTokens.Calculation, () => calculationService)
container.register(ServiceTokens.Status, () => statusService)

// Usage with DI
const calc = useService(ServiceTokens.Calculation)
```
