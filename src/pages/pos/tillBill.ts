export interface TillBill {
  subtotal: number
  service: number
  tax: number
  payable: number
}

/** Nearest-unit cash rounding (half up). Unit 0 leaves the bill exact. */
export function roundCashPayable(payable: number, unit = 100): number {
  const amount = Math.round(Math.max(0, payable))
  if (unit < 1) {
    return amount
  }
  const remainder = ((amount % unit) + unit) % unit
  if (remainder === 0) {
    return amount
  }

  return remainder >= unit / 2 ? amount - remainder + unit : amount - remainder
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
