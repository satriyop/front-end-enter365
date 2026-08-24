export interface TillBill {
  subtotal: number
  service: number
  tax: number
  payable: number
}

export function addOnBill(subtotal: number, serviceRate: number, taxRate: number): TillBill {
  const service = Math.round(subtotal * serviceRate / 100)
  const tax = Math.round((subtotal + service) * taxRate / 100)

  return {
    subtotal,
    service,
    tax,
    payable: subtotal + service + tax,
  }
}

export function tillBill(
  subtotal: number,
  pricingMode: string | null | undefined,
  serviceRate: number | null | undefined,
  taxRate: number | null | undefined,
): TillBill {
  if (pricingMode === 'add') {
    return addOnBill(subtotal, serviceRate ?? 0, taxRate ?? 0)
  }

  return { subtotal, service: 0, tax: 0, payable: subtotal }
}
