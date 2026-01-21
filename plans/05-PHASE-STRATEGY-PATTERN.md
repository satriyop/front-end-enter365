# Phase 5: Strategy Pattern Implementation

## Overview

This phase implements the Strategy pattern for behaviors that need to be swappable without modifying existing code. This provides flexibility to support different business rules, export formats, and validation approaches.

**Prerequisites:** Phase 1, Phase 2, Phase 3, Phase 4

**Deliverables:**
1. Export strategies (PDF, Excel, CSV)
2. Document number generation strategies
3. Notification strategies
4. Pricing strategies

---

## 5.1 Export Strategies

### The Problem

Currently, exports are tightly coupled to specific formats. Adding a new format requires modifying existing code.

### Strategy Interface

```typescript
// src/services/export/types.ts
export interface ExportOptions {
  filename?: string
  orientation?: 'portrait' | 'landscape'
  paperSize?: 'A4' | 'Letter' | 'Legal'
  includeHeaders?: boolean
  columns?: string[]
}

export interface ExportStrategy<T = unknown> {
  name: string
  extension: string
  mimeType: string
  export(data: T[], options?: ExportOptions): Promise<Blob>
}

export interface DocumentExportStrategy<T = unknown> extends ExportStrategy<T> {
  exportSingle(data: T, options?: ExportOptions): Promise<Blob>
}
```

### PDF Export Strategy

```typescript
// src/services/export/strategies/PDFExportStrategy.ts
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { DocumentExportStrategy, ExportOptions } from '../types'

export class PDFExportStrategy<T extends Record<string, any>>
  implements DocumentExportStrategy<T> {

  readonly name = 'PDF'
  readonly extension = 'pdf'
  readonly mimeType = 'application/pdf'

  constructor(
    private config: {
      columns: Array<{ key: keyof T; header: string; width?: number }>
      title?: string
      logo?: string
    }
  ) {}

  async export(data: T[], options?: ExportOptions): Promise<Blob> {
    const doc = new jsPDF({
      orientation: options?.orientation ?? 'portrait',
      unit: 'mm',
      format: options?.paperSize ?? 'A4',
    })

    // Add title
    if (this.config.title) {
      doc.setFontSize(16)
      doc.text(this.config.title, 14, 20)
    }

    // Add table
    autoTable(doc, {
      startY: this.config.title ? 30 : 14,
      head: [this.config.columns.map((col) => col.header)],
      body: data.map((row) =>
        this.config.columns.map((col) => String(row[col.key] ?? ''))
      ),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [249, 115, 22] }, // Orange primary
    })

    return doc.output('blob')
  }

  async exportSingle(data: T, options?: ExportOptions): Promise<Blob> {
    // Custom single document export (e.g., invoice)
    const doc = new jsPDF({
      orientation: options?.orientation ?? 'portrait',
      unit: 'mm',
      format: options?.paperSize ?? 'A4',
    })

    // ... custom layout for single document

    return doc.output('blob')
  }
}
```

### Excel Export Strategy

```typescript
// src/services/export/strategies/ExcelExportStrategy.ts
import * as XLSX from 'xlsx'
import type { ExportStrategy, ExportOptions } from '../types'

export class ExcelExportStrategy<T extends Record<string, any>>
  implements ExportStrategy<T> {

  readonly name = 'Excel'
  readonly extension = 'xlsx'
  readonly mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

  constructor(
    private config: {
      columns: Array<{ key: keyof T; header: string; format?: 'text' | 'number' | 'currency' | 'date' }>
      sheetName?: string
    }
  ) {}

  async export(data: T[], options?: ExportOptions): Promise<Blob> {
    // Transform data to match column headers
    const transformedData = data.map((row) => {
      const obj: Record<string, any> = {}
      this.config.columns.forEach((col) => {
        obj[col.header] = this.formatValue(row[col.key], col.format)
      })
      return obj
    })

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(transformedData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, this.config.sheetName ?? 'Data')

    // Set column widths
    ws['!cols'] = this.config.columns.map((col) => ({ wch: 15 }))

    // Generate blob
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    return new Blob([buffer], { type: this.mimeType })
  }

  private formatValue(value: any, format?: string): any {
    if (value === null || value === undefined) return ''

    switch (format) {
      case 'currency':
        return typeof value === 'number' ? value : parseFloat(value) || 0
      case 'date':
        return value instanceof Date ? value.toLocaleDateString('id-ID') : value
      case 'number':
        return typeof value === 'number' ? value : parseFloat(value) || 0
      default:
        return String(value)
    }
  }
}
```

### CSV Export Strategy

```typescript
// src/services/export/strategies/CSVExportStrategy.ts
import type { ExportStrategy, ExportOptions } from '../types'

export class CSVExportStrategy<T extends Record<string, any>>
  implements ExportStrategy<T> {

  readonly name = 'CSV'
  readonly extension = 'csv'
  readonly mimeType = 'text/csv'

  constructor(
    private config: {
      columns: Array<{ key: keyof T; header: string }>
      delimiter?: string
    }
  ) {}

  async export(data: T[], options?: ExportOptions): Promise<Blob> {
    const delimiter = this.config.delimiter ?? ','

    // Header row
    const headers = this.config.columns.map((col) =>
      this.escapeCSV(col.header)
    ).join(delimiter)

    // Data rows
    const rows = data.map((row) =>
      this.config.columns.map((col) =>
        this.escapeCSV(String(row[col.key] ?? ''))
      ).join(delimiter)
    )

    const csv = [headers, ...rows].join('\n')
    return new Blob([csv], { type: this.mimeType })
  }

  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }
}
```

### Export Service

```typescript
// src/services/export/ExportService.ts
import { eventBus } from '@/infrastructure/events'
import { logger } from '@/infrastructure/logger'
import type { ExportStrategy, ExportOptions } from './types'

export class ExportService {
  private strategies = new Map<string, ExportStrategy<any>>()

  registerStrategy<T>(key: string, strategy: ExportStrategy<T>): void {
    this.strategies.set(key, strategy)
  }

  getStrategy<T>(key: string): ExportStrategy<T> | undefined {
    return this.strategies.get(key)
  }

  getAvailableFormats(): Array<{ key: string; name: string; extension: string }> {
    return Array.from(this.strategies.entries()).map(([key, strategy]) => ({
      key,
      name: strategy.name,
      extension: strategy.extension,
    }))
  }

  async export<T>(
    strategyKey: string,
    data: T[],
    options?: ExportOptions
  ): Promise<void> {
    const strategy = this.getStrategy<T>(strategyKey)

    if (!strategy) {
      throw new Error(`Export strategy not found: ${strategyKey}`)
    }

    logger.info('Starting export', { strategy: strategyKey, count: data.length })

    try {
      const blob = await strategy.export(data, options)
      const filename = options?.filename ?? `export.${strategy.extension}`

      // Trigger download
      this.downloadBlob(blob, filename)

      eventBus.emit('user:action', {
        action: 'export',
        target: `${strategyKey}:${filename}`,
      })

      logger.info('Export completed', { strategy: strategyKey, filename })
    } catch (error) {
      logger.error('Export failed', error as Error, { strategy: strategyKey })
      throw error
    }
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export const exportService = new ExportService()
```

### Vue Composable

```typescript
// src/services/export/useExport.ts
import { ref, computed } from 'vue'
import { exportService } from './ExportService'
import { useToast } from '@/components/ui/Toast'
import type { ExportOptions } from './types'

export function useExport<T>() {
  const { toast } = useToast()
  const isExporting = ref(false)
  const exportError = ref<Error | null>(null)

  const availableFormats = computed(() => exportService.getAvailableFormats())

  async function exportData(
    strategyKey: string,
    data: T[],
    options?: ExportOptions
  ): Promise<void> {
    isExporting.value = true
    exportError.value = null

    try {
      await exportService.export(strategyKey, data, options)
      toast.success('Export completed successfully')
    } catch (error) {
      exportError.value = error as Error
      toast.error('Export failed')
      throw error
    } finally {
      isExporting.value = false
    }
  }

  return {
    isExporting,
    exportError,
    availableFormats,
    exportData,
  }
}
```

---

## 5.2 Document Number Generation Strategies

### The Problem

Document numbers may need different formats based on:
- Document type (QUO-2024-0001, INV-2024-0001)
- Company settings (prefix, suffix)
- Fiscal year vs calendar year
- Sequential vs random

### Strategy Interface

```typescript
// src/services/document-number/types.ts
export interface NumberGenerationConfig {
  prefix?: string
  suffix?: string
  yearFormat?: 'YYYY' | 'YY' | 'none'
  separator?: string
  padding?: number
}

export interface NumberGenerationStrategy {
  name: string
  generate(sequence: number, config: NumberGenerationConfig): string
  parse(documentNumber: string): { sequence: number; year?: number } | null
}
```

### Sequential Strategy

```typescript
// src/services/document-number/strategies/SequentialStrategy.ts
import type { NumberGenerationStrategy, NumberGenerationConfig } from '../types'

export class SequentialStrategy implements NumberGenerationStrategy {
  readonly name = 'Sequential'

  generate(sequence: number, config: NumberGenerationConfig): string {
    const {
      prefix = '',
      suffix = '',
      yearFormat = 'YYYY',
      separator = '-',
      padding = 4,
    } = config

    const parts: string[] = []

    if (prefix) parts.push(prefix)

    if (yearFormat !== 'none') {
      const year = new Date().getFullYear()
      parts.push(yearFormat === 'YY' ? String(year).slice(-2) : String(year))
    }

    parts.push(String(sequence).padStart(padding, '0'))

    if (suffix) parts.push(suffix)

    return parts.join(separator)
  }

  parse(documentNumber: string): { sequence: number; year?: number } | null {
    const match = documentNumber.match(/(\d{4})?-?(\d+)/)
    if (!match) return null

    return {
      year: match[1] ? parseInt(match[1]) : undefined,
      sequence: parseInt(match[2]),
    }
  }
}
```

### Monthly Reset Strategy

```typescript
// src/services/document-number/strategies/MonthlyResetStrategy.ts
import type { NumberGenerationStrategy, NumberGenerationConfig } from '../types'

export class MonthlyResetStrategy implements NumberGenerationStrategy {
  readonly name = 'Monthly Reset'

  generate(sequence: number, config: NumberGenerationConfig): string {
    const {
      prefix = '',
      separator = '-',
      padding = 4,
    } = config

    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')

    const parts: string[] = []
    if (prefix) parts.push(prefix)
    parts.push(`${year}${month}`)
    parts.push(String(sequence).padStart(padding, '0'))

    return parts.join(separator)
  }

  parse(documentNumber: string): { sequence: number; year?: number; month?: number } | null {
    const match = documentNumber.match(/(\d{4})(\d{2})-?(\d+)/)
    if (!match) return null

    return {
      year: parseInt(match[1]),
      month: parseInt(match[2]),
      sequence: parseInt(match[3]),
    }
  }
}
```

---

## 5.3 Notification Strategies

### The Problem

Different users may prefer different notification methods:
- Toast notifications (default)
- Browser notifications
- Sound alerts
- Email (via API)

### Strategy Interface

```typescript
// src/services/notification/types.ts
export type NotificationLevel = 'info' | 'success' | 'warning' | 'error'

export interface NotificationPayload {
  title: string
  message: string
  level: NotificationLevel
  action?: {
    label: string
    onClick: () => void
  }
}

export interface NotificationStrategy {
  name: string
  isAvailable(): boolean
  notify(payload: NotificationPayload): Promise<void>
}
```

### Toast Strategy (Default)

```typescript
// src/services/notification/strategies/ToastStrategy.ts
import { useToast } from '@/components/ui/Toast'
import type { NotificationStrategy, NotificationPayload } from '../types'

export class ToastStrategy implements NotificationStrategy {
  readonly name = 'Toast'

  isAvailable(): boolean {
    return true // Always available
  }

  async notify(payload: NotificationPayload): Promise<void> {
    const { toast } = useToast()

    switch (payload.level) {
      case 'success':
        toast.success(payload.message)
        break
      case 'warning':
        toast.warning(payload.message)
        break
      case 'error':
        toast.error(payload.message)
        break
      default:
        toast.info(payload.message)
    }
  }
}
```

### Browser Notification Strategy

```typescript
// src/services/notification/strategies/BrowserNotificationStrategy.ts
import type { NotificationStrategy, NotificationPayload } from '../types'

export class BrowserNotificationStrategy implements NotificationStrategy {
  readonly name = 'Browser Notification'

  isAvailable(): boolean {
    return 'Notification' in window && Notification.permission === 'granted'
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  async notify(payload: NotificationPayload): Promise<void> {
    if (!this.isAvailable()) return

    const notification = new Notification(payload.title, {
      body: payload.message,
      icon: '/logo.png',
      tag: payload.level,
    })

    if (payload.action) {
      notification.onclick = () => {
        payload.action!.onClick()
        notification.close()
      }
    }
  }
}
```

### Notification Service

```typescript
// src/services/notification/NotificationService.ts
import { eventBus } from '@/infrastructure/events'
import type { NotificationStrategy, NotificationPayload, NotificationLevel } from './types'
import { ToastStrategy } from './strategies/ToastStrategy'

export class NotificationService {
  private strategies: NotificationStrategy[] = []
  private defaultStrategy: NotificationStrategy

  constructor() {
    this.defaultStrategy = new ToastStrategy()
    this.strategies.push(this.defaultStrategy)
  }

  addStrategy(strategy: NotificationStrategy): void {
    if (strategy.isAvailable()) {
      this.strategies.push(strategy)
    }
  }

  async notify(payload: NotificationPayload): Promise<void> {
    // Notify all available strategies
    await Promise.all(
      this.strategies
        .filter((s) => s.isAvailable())
        .map((s) => s.notify(payload))
    )

    eventBus.emit('user:action', {
      action: 'notification',
      target: `${payload.level}:${payload.title}`,
    })
  }

  // Convenience methods
  info(title: string, message: string): Promise<void> {
    return this.notify({ title, message, level: 'info' })
  }

  success(title: string, message: string): Promise<void> {
    return this.notify({ title, message, level: 'success' })
  }

  warning(title: string, message: string): Promise<void> {
    return this.notify({ title, message, level: 'warning' })
  }

  error(title: string, message: string): Promise<void> {
    return this.notify({ title, message, level: 'error' })
  }
}

export const notificationService = new NotificationService()
```

---

## 5.4 Pricing Strategies

### The Problem

Different customers may have different pricing rules:
- Standard pricing
- Wholesale pricing (volume discounts)
- Contract pricing (fixed prices)
- Promotional pricing

### Strategy Interface

```typescript
// src/services/pricing/types.ts
export interface PricingContext {
  customerId?: number
  customerType?: 'retail' | 'wholesale' | 'contract'
  quantity: number
  productId: number
  basePrice: number
  date?: Date
}

export interface PricingResult {
  finalPrice: number
  discount: number
  discountPercent: number
  pricingRule: string
}

export interface PricingStrategy {
  name: string
  priority: number // Lower = higher priority
  isApplicable(context: PricingContext): boolean
  calculatePrice(context: PricingContext): PricingResult
}
```

### Volume Discount Strategy

```typescript
// src/services/pricing/strategies/VolumeDiscountStrategy.ts
import type { PricingStrategy, PricingContext, PricingResult } from '../types'

interface VolumeTier {
  minQuantity: number
  discountPercent: number
}

export class VolumeDiscountStrategy implements PricingStrategy {
  readonly name = 'Volume Discount'
  readonly priority = 20

  constructor(private tiers: VolumeTier[]) {
    // Sort by minQuantity descending
    this.tiers = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity)
  }

  isApplicable(context: PricingContext): boolean {
    return this.tiers.some((tier) => context.quantity >= tier.minQuantity)
  }

  calculatePrice(context: PricingContext): PricingResult {
    const tier = this.tiers.find((t) => context.quantity >= t.minQuantity)

    if (!tier) {
      return {
        finalPrice: context.basePrice,
        discount: 0,
        discountPercent: 0,
        pricingRule: 'Standard',
      }
    }

    const discount = context.basePrice * (tier.discountPercent / 100)
    const finalPrice = context.basePrice - discount

    return {
      finalPrice,
      discount,
      discountPercent: tier.discountPercent,
      pricingRule: `Volume ${tier.minQuantity}+ (${tier.discountPercent}% off)`,
    }
  }
}
```

### Contract Pricing Strategy

```typescript
// src/services/pricing/strategies/ContractPricingStrategy.ts
import type { PricingStrategy, PricingContext, PricingResult } from '../types'

interface ContractPrice {
  customerId: number
  productId: number
  contractPrice: number
  validFrom: Date
  validUntil: Date
}

export class ContractPricingStrategy implements PricingStrategy {
  readonly name = 'Contract Pricing'
  readonly priority = 10 // Highest priority

  constructor(private contracts: ContractPrice[]) {}

  isApplicable(context: PricingContext): boolean {
    if (!context.customerId) return false

    const now = context.date ?? new Date()
    return this.contracts.some(
      (c) =>
        c.customerId === context.customerId &&
        c.productId === context.productId &&
        c.validFrom <= now &&
        c.validUntil >= now
    )
  }

  calculatePrice(context: PricingContext): PricingResult {
    const now = context.date ?? new Date()
    const contract = this.contracts.find(
      (c) =>
        c.customerId === context.customerId &&
        c.productId === context.productId &&
        c.validFrom <= now &&
        c.validUntil >= now
    )

    if (!contract) {
      return {
        finalPrice: context.basePrice,
        discount: 0,
        discountPercent: 0,
        pricingRule: 'Standard',
      }
    }

    const discount = context.basePrice - contract.contractPrice
    const discountPercent = (discount / context.basePrice) * 100

    return {
      finalPrice: contract.contractPrice,
      discount,
      discountPercent,
      pricingRule: 'Contract Price',
    }
  }
}
```

### Pricing Service

```typescript
// src/services/pricing/PricingService.ts
import { eventBus } from '@/infrastructure/events'
import type { PricingStrategy, PricingContext, PricingResult } from './types'

export class PricingService {
  private strategies: PricingStrategy[] = []

  addStrategy(strategy: PricingStrategy): void {
    this.strategies.push(strategy)
    // Sort by priority (lower = higher priority)
    this.strategies.sort((a, b) => a.priority - b.priority)
  }

  calculatePrice(context: PricingContext): PricingResult {
    // Find first applicable strategy
    const strategy = this.strategies.find((s) => s.isApplicable(context))

    if (!strategy) {
      return {
        finalPrice: context.basePrice,
        discount: 0,
        discountPercent: 0,
        pricingRule: 'Standard',
      }
    }

    const result = strategy.calculatePrice(context)

    eventBus.emit('user:action', {
      action: 'price-calculated',
      target: `${strategy.name}:${result.pricingRule}`,
    })

    return result
  }

  getApplicableStrategies(context: PricingContext): PricingStrategy[] {
    return this.strategies.filter((s) => s.isApplicable(context))
  }
}

export const pricingService = new PricingService()
```

---

## 5.5 File Structure

```
src/services/
├── export/
│   ├── index.ts
│   ├── types.ts
│   ├── ExportService.ts
│   ├── useExport.ts
│   ├── strategies/
│   │   ├── PDFExportStrategy.ts
│   │   ├── ExcelExportStrategy.ts
│   │   └── CSVExportStrategy.ts
│   └── __tests__/
│       └── ExportService.test.ts
│
├── document-number/
│   ├── index.ts
│   ├── types.ts
│   ├── DocumentNumberService.ts
│   └── strategies/
│       ├── SequentialStrategy.ts
│       └── MonthlyResetStrategy.ts
│
├── notification/
│   ├── index.ts
│   ├── types.ts
│   ├── NotificationService.ts
│   └── strategies/
│       ├── ToastStrategy.ts
│       └── BrowserNotificationStrategy.ts
│
└── pricing/
    ├── index.ts
    ├── types.ts
    ├── PricingService.ts
    ├── usePricing.ts
    └── strategies/
        ├── VolumeDiscountStrategy.ts
        └── ContractPricingStrategy.ts
```

---

## Benefits Summary

| Strategy Type | Benefit |
|---------------|---------|
| **Export** | Add new formats without touching existing code |
| **Document Numbers** | Different numbering schemes per document type |
| **Notifications** | Users can enable/disable notification channels |
| **Pricing** | Complex pricing rules without spaghetti code |

---

## Checklist

- [ ] Export service with PDF, Excel, CSV strategies
- [ ] Document number generation strategies
- [ ] Notification service with toast and browser strategies
- [ ] Pricing service with volume and contract strategies
- [ ] useExport composable
- [ ] usePricing composable
- [ ] Tests for all services
- [ ] Bootstrap configuration for registering strategies

---

## Next Phase

Once Phase 5 is complete, proceed to [Phase 6: State Machine Implementation](./06-PHASE-STATE-MACHINE.md) for formal document workflow management.
