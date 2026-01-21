/**
 * Sequential Number Generation Strategy
 *
 * Generates numbers in format: PREFIX-YYYY-0001
 * Sequence resets yearly.
 */

import type {
  NumberGenerationStrategy,
  NumberGenerationConfig,
  ParsedDocumentNumber,
} from '../types'

export class SequentialStrategy implements NumberGenerationStrategy {
  readonly name = 'Sequential'

  generate(sequence: number, config: NumberGenerationConfig): string {
    const {
      prefix = '',
      suffix = '',
      yearFormat = 'YYYY',
      separator = '-',
      padding = 4,
    } = config

    const parts: string[] = []

    // Add prefix
    if (prefix) {
      parts.push(prefix)
    }

    // Add year
    if (yearFormat !== 'none') {
      const year = new Date().getFullYear()
      parts.push(yearFormat === 'YY' ? String(year).slice(-2) : String(year))
    }

    // Add padded sequence
    parts.push(String(sequence).padStart(padding, '0'))

    // Add suffix
    if (suffix) {
      parts.push(suffix)
    }

    return parts.join(separator)
  }

  parse(documentNumber: string): ParsedDocumentNumber | null {
    // Try to extract year and sequence from formats like:
    // INV-2024-0001, INV-24-0001, INV-0001
    const patterns = [
      // With 4-digit year: PREFIX-YYYY-NNNN
      /^([A-Z]+)?-?(\d{4})-(\d+)(?:-([A-Z0-9]+))?$/,
      // With 2-digit year: PREFIX-YY-NNNN
      /^([A-Z]+)?-?(\d{2})-(\d+)(?:-([A-Z0-9]+))?$/,
      // Without year: PREFIX-NNNN
      /^([A-Z]+)?-?(\d+)(?:-([A-Z0-9]+))?$/,
    ]

    for (const pattern of patterns) {
      const match = documentNumber.match(pattern)
      if (match) {
        // Pattern with year
        if (pattern === patterns[0] || pattern === patterns[1]) {
          const yearStr = match[2] ?? ''
          const sequenceStr = match[3] ?? '0'
          const year =
            yearStr.length === 2 ? 2000 + parseInt(yearStr, 10) : parseInt(yearStr, 10)
          return {
            prefix: match[1] || undefined,
            year,
            sequence: parseInt(sequenceStr, 10),
            suffix: match[4] || undefined,
          }
        }
        // Pattern without year
        const sequenceStr = match[2] ?? '0'
        return {
          prefix: match[1] || undefined,
          sequence: parseInt(sequenceStr, 10),
          suffix: match[3] || undefined,
        }
      }
    }

    return null
  }
}
