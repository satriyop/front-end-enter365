/** Max digits a kasir can type on the cash pad (Rp99.999.999). */
export const CASH_PAD_MAX_DIGITS = 8

/**
 * Type cash received like a phone number: 5-0-0-0-0 = Rp50.000.
 * `000` appends three zeros. Extra digits past the cap are ignored.
 */
export function typeCashReceived(current: number, key: string, maxDigits = CASH_PAD_MAX_DIGITS): number {
  let digits = String(Math.round(Math.max(0, current)))

  if (key === 'del') {
    digits = digits.slice(0, -1)
  } else if (key === '0' || key === '000' || /^[1-9]$/.test(key)) {
    const next = (digits === '0' ? '' : digits) + key
    if (next.length > maxDigits) {
      return Number(digits) || 0
    }
    digits = next
  }

  return Number(digits) || 0
}
