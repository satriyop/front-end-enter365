export interface TillMarkProduct {
  id: number
  name: string
  sku?: string | null
}

function letters(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
}

function markCandidates(name: string, sku: string | null | undefined): string[] {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const first = letters(words[0] ?? name)
  const second = letters(words[1] ?? '')
  const compact = letters(name)
  const skuTail = letters(sku ?? '').slice(-3)

  const twoWord = (first.slice(0, 1) + (second.slice(0, 1) || first.slice(1, 2))).slice(0, 2)
  const firstTwo = first.slice(0, 2)
  const withDigit = second && /\d/.test(words[1] ?? '')
    ? (first.slice(0, 1) + (words[1] ?? '').replace(/\D/g, '').slice(0, 1)).toUpperCase()
    : null

  return [
    twoWord,
    withDigit,
    firstTwo,
    compact.slice(0, 3),
    skuTail.slice(0, 2),
    skuTail,
    compact.slice(0, 4),
  ].filter((mark): mark is string => Boolean(mark && mark.length >= 2))
}

export function tillTileMarks(products: TillMarkProduct[]): Record<number, string> {
  const used = new Set<string>()
  const marks: Record<number, string> = {}

  for (const product of products) {
    const picked = markCandidates(product.name, product.sku).find((mark) => !used.has(mark))
    let mark = picked
    if (!mark) {
      const base = letters(product.sku || product.name).slice(0, 2) || 'XX'
      let n = 1
      mark = base
      while (used.has(mark)) {
        n += 1
        mark = `${base}${n}`
      }
    }
    used.add(mark)
    marks[product.id] = mark
  }

  return marks
}
