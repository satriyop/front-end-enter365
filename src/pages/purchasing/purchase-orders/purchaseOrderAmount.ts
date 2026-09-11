import { toNumber, type NumericValue } from '@/utils/format'

/**
 * List/detail AMOUNT for a purchase order.
 * The API field is `total_amount`; some clients historically read `total`.
 */
export function purchaseOrderAmount(po: {
  total_amount?: NumericValue
  total?: NumericValue
}): number {
  if (po.total_amount != null && po.total_amount !== '') {
    return toNumber(po.total_amount)
  }
  return toNumber(po.total)
}
