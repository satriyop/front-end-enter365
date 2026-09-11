import { toNumber, type NumericValue } from '@/utils/format'

type AmountRecord = Record<string, unknown>

function unwrapRecord(value: unknown): AmountRecord {
  if (value == null || typeof value !== 'object') {
    return {}
  }
  const record = value as AmountRecord
  const inner = record.value
  if (inner && typeof inner === 'object' && !Array.isArray(inner) && ('po_number' in inner || 'subtotal' in inner || 'unit_price' in inner || 'total_amount' in inner)) {
    return inner as AmountRecord
  }
  return record
}

function amount(value: unknown): number {
  return toNumber(value as NumericValue)
}

/**
 * List/detail AMOUNT. Prefer persisted `total_amount`, then `total`,
 * then subtotal + tax − discount (the live API has the parts even when
 * a client still reads a missing `total`).
 */
export function purchaseOrderAmount(po: unknown): number {
  const row = unwrapRecord(po)
  const stored = amount(row.total_amount) || amount(row.total)
  if (stored > 0) {
    return stored
  }
  return amount(row.subtotal) + amount(row.tax_amount) - amount(row.discount_amount)
}

/**
 * Line Total. API lines expose `subtotal` / `total_amount`, not `line_total`.
 */
export function purchaseOrderLineAmount(line: unknown): number {
  const row = unwrapRecord(line)
  const stored = amount(row.total_amount) || amount(row.line_total)
  if (stored > 0) {
    return stored
  }
  const net = amount(row.subtotal)
  if (net > 0) {
    return net + amount(row.tax_amount)
  }
  return amount(row.quantity) * amount(row.unit_price)
}
