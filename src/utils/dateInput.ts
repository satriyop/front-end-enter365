/** Display ISO `yyyy-mm-dd` as day-first `dd/mm/yyyy`. */
export function isoToDayFirst(iso: string | null | undefined): string {
  if (!iso) {
    return ''
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!match) {
    return ''
  }
  return `${match[3]}/${match[2]}/${match[1]}`
}

/** Parse `dd/mm/yyyy` (or `dd-mm-yyyy`) into ISO `yyyy-mm-dd`. */
export function dayFirstToIso(value: string): string | null {
  const match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(value.trim())
  if (!match) {
    return null
  }
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null
  }
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const parsed = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(parsed.getTime()) || parsed.getDate() !== day) {
    return null
  }
  return iso
}
