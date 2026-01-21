/**
 * Monthly Reset Number Generation Strategy
 *
 * Generates numbers in format: PREFIX-YYYYMM-0001
 * Sequence resets monthly.
 */

import type {
  NumberGenerationStrategy,
  NumberGenerationConfig,
  ParsedDocumentNumber,
} from '../types'

export class MonthlyResetStrategy implements NumberGenerationStrategy {
  readonly name = 'Monthly Reset'

  generate(sequence: number, config: NumberGenerationConfig): string {
    const { prefix = '', suffix = '', separator = '-', padding = 4 } = config

    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')

    const parts: string[] = []

    // Add prefix
    if (prefix) {
      parts.push(prefix)
    }

    // Add year-month
    parts.push(`${year}${month}`)

    // Add padded sequence
    parts.push(String(sequence).padStart(padding, '0'))

    // Add suffix
    if (suffix) {
      parts.push(suffix)
    }

    return parts.join(separator)
  }

  parse(documentNumber: string): ParsedDocumentNumber | null {
    // Try to extract year, month and sequence from formats like:
    // INV-202401-0001, INV202401-0001
    const patterns = [
      // With prefix: PREFIX-YYYYMM-NNNN
      /^([A-Z]+)?-?(\d{4})(\d{2})-(\d+)(?:-([A-Z0-9]+))?$/,
    ]

    for (const pattern of patterns) {
      const match = documentNumber.match(pattern)
      if (match && match[2] && match[3] && match[4]) {
        return {
          prefix: match[1] || undefined,
          year: parseInt(match[2], 10),
          month: parseInt(match[3], 10),
          sequence: parseInt(match[4], 10),
          suffix: match[5] || undefined,
        }
      }
    }

    return null
  }
}
