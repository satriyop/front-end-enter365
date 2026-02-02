/** Numeric value from API (can be string from PHP serialization) */
export type NumericValue = number | string | null | undefined

/**
 * Convert API numeric value to number
 * Handles PHP decimal serialization as strings
 */
export function toNumber(value: NumericValue): number {
  if (value == null) return 0
  if (typeof value === 'string') return parseFloat(value) || 0
  if (isNaN(value)) return 0
  return value
}

/**
 * Format number as Indonesian Rupiah
 * Accepts both number and string (from API responses)
 */
export function formatCurrency(value: NumericValue): string {
  const num = toNumber(value)
  if (num === 0 && value == null) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

/**
 * Format currency in compact form (Indonesian style)
 * < 1M: full format (Rp 500.000)
 * 1M - 1B: Rp 326 jt (millions)
 * >= 1B: Rp 1,5 M (billions)
 */
export function formatCurrencyCompact(value: NumericValue): string {
  const num = toNumber(value)
  if (num === 0) return 'Rp 0'

  const absValue = Math.abs(num)
  const sign = num < 0 ? '-' : ''

  if (absValue >= 1_000_000_000) {
    // Billions (Miliar)
    const billions = absValue / 1_000_000_000
    return `${sign}Rp ${billions.toFixed(1).replace('.', ',')} M`
  }

  if (absValue >= 1_000_000) {
    // Millions (Juta)
    const millions = absValue / 1_000_000
    if (millions >= 100) {
      // Show without decimal for >= 100 juta
      return `${sign}Rp ${Math.round(millions)} jt`
    }
    return `${sign}Rp ${millions.toFixed(1).replace('.', ',')} jt`
  }

  // Under 1 million - show full format
  return formatCurrency(num)
}

/**
 * Format number with Indonesian thousand separators
 */
export function formatNumber(value: NumericValue): string {
  const num = toNumber(value)
  return new Intl.NumberFormat('id-ID').format(num)
}

/**
 * Format percentage
 */
export function formatPercent(value: NumericValue, decimals: number = 1): string {
  const num = toNumber(value)
  return `${num.toFixed(decimals).replace('.', ',')}%`
}

/**
 * Format date in Indonesian format (27 Des 2024)
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

/**
 * Format date and time
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/**
 * Format relative time (2 hours ago)
 */
export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Baru saja'
  if (diffMins < 60) return `${diffMins} menit lalu`
  if (diffHours < 24) return `${diffHours} jam lalu`
  if (diffDays < 7) return `${diffDays} hari lalu`

  return formatDate(d)
}

/**
 * Calculate days remaining until date
 */
export function daysRemaining(dueDate: string | Date): { days: number; isOverdue: boolean } {
  const due = new Date(dueDate)
  const now = new Date()
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  return {
    days: Math.abs(diffDays),
    isOverdue: diffDays < 0,
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Get initials from name (max 2 chars)
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Format solar offset percentage with smart label
 * < 100%: Shows coverage percentage (e.g., "85% Tercukupi")
 * >= 100%: Shows surplus/multiplier (e.g., "Surplus 2.5x")
 */
export function formatSolarOffset(percent: number | null | undefined): {
  value: string
  label: string
  isSurplus: boolean
} {
  if (percent == null || percent === 0) {
    return { value: '0%', label: 'Kebutuhan Tercukupi', isSurplus: false }
  }

  if (percent < 100) {
    return {
      value: `${percent.toFixed(1).replace('.', ',')}%`,
      label: 'Kebutuhan Tercukupi',
      isSurplus: false,
    }
  }

  // >= 100% - surplus
  const multiplier = percent / 100
  return {
    value: `${multiplier.toFixed(1).replace('.', ',')}x`,
    label: 'Surplus Energi',
    isSurplus: true,
  }
}
