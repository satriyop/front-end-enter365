export type DeliveryProductLike = {
  id: number
  name: string
  unit?: string | null
}

export type DeliveryLineDraft = {
  product_id?: number | null
  description: string
  unit: string
}

export function applyDeliveryProductDefaults(item: DeliveryLineDraft, product: DeliveryProductLike): void {
  item.product_id = Number(product.id)
  item.description = product.name
  item.unit = product.unit || 'pcs'
}
