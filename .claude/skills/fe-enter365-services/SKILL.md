# Enter365 Services & Strategy Pattern

## Service Layer Overview

Services encapsulate domain logic and use the **Strategy Pattern** for extensibility.

Location: `src/services/`

## Available Services

| Service | Purpose | Strategies |
|---------|---------|------------|
| `CalculationService` | Line item & document calculations | Tax, Discount, Rounding |
| `StatusService` | Status colors, labels, transitions | Per document type |
| `PricingService` | Price lookups & tier calculations | Standard, Volume, Contract |
| `ExportService` | Document exports | CSV, Excel, PDF |
| `DocumentNumberService` | Auto-numbering | Sequential, Monthly Reset |
| `NotificationService` | User notifications | Toast, Browser Push |
| `LineItemsService` | Line item CRUD & validation | - |

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
// src/services/calculation/strategies/tax/PPNStrategy.ts
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
- `PPNStrategy` - Indonesian PPN 11%
- `InclusiveTaxStrategy` - Tax included in price
- `NoTaxStrategy` - Zero tax

**Discount Strategies:**
- `PercentDiscountStrategy` - Percentage discount
- `AmountDiscountStrategy` - Fixed amount discount
- `TieredDiscountStrategy` - Volume-based tiers

**Rounding Strategies:**
- `StandardRoundingStrategy` - Math.round()
- `RoundUpStrategy` - Math.ceil()
- `IndonesianRoundingStrategy` - Round to nearest 100

### Usage
```typescript
import { calculationService, useCalculation } from '@/services/calculation'

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

### Usage
```typescript
import { useStatus } from '@/services/status'

const { getStatusBadge, canTransitionTo, getNextStatuses } = useStatus('quotation')

// Get badge props
const badge = getStatusBadge('approved')
// { label: 'Approved', variant: 'success' }

// Check transitions
const canApprove = canTransitionTo('pending', 'approved') // true
const nextOptions = getNextStatuses('pending') // ['approved', 'rejected']
```

## PricingService

### Strategies
- `StandardPricingStrategy` - Use product's base price
- `VolumeDiscountStrategy` - Quantity-based pricing tiers
- `ContractPricingStrategy` - Customer-specific contract prices

### Usage
```typescript
import { usePricing } from '@/services/pricing'

const { getPrice, getPriceWithTiers } = usePricing()

const price = await getPrice({
  productId: 123,
  quantity: 100,
  customerId: 456,
})
```

## ExportService

### Strategies
- `CSVExportStrategy` - Simple CSV export
- `ExcelExportStrategy` - XLSX with formatting (lazy-loaded)
- PDF uses backend generation

### Usage
```typescript
import { useExport } from '@/services/export'

const { exportToCSV, exportToExcel } = useExport()

// Export data
await exportToCSV(invoices, {
  filename: 'invoices.csv',
  columns: ['number', 'date', 'customer', 'total'],
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
import type { MyStrategy, MyServiceConfig } from './types'

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
import { MyService } from './MyService'
import { DefaultStrategy } from './strategies'

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
