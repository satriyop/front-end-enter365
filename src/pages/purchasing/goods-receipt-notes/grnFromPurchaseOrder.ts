export function createGrnFromPurchaseOrderPath(purchaseOrderId: number): string {
  return `/purchase-orders/${purchaseOrderId}/create-grn`
}

export type PurchaseOrderLineForReceipt = {
  product_id?: number | null
  quantity?: number
  quantity_received?: number
  quantity_remaining?: number
  unit_price?: number | string | null
}

export type GrnPrefillLine = {
  product_id: number | null
  quantity_ordered: number
  unit_price: number
}

export function remainingGrnLinesFromPurchaseOrder(po: {
  items?: PurchaseOrderLineForReceipt[] | null
}): GrnPrefillLine[] {
  return (po.items ?? [])
    .map((item) => {
      const remaining = item.quantity_remaining
        ?? Math.max(0, Number(item.quantity ?? 0) - Number(item.quantity_received ?? 0))
      return {
        product_id: item.product_id ?? null,
        quantity_ordered: remaining,
        unit_price: Number(item.unit_price) || 0,
      }
    })
    .filter((line) => line.quantity_ordered > 0)
}
