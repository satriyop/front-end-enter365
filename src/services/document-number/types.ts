/**
 * Document Number Service Types
 *
 * Defines interfaces for document number generation strategies.
 */

/**
 * Configuration for number generation
 */
export interface NumberGenerationConfig {
  /** Prefix (e.g., "INV", "QUO") */
  prefix?: string
  /** Suffix (e.g., branch code) */
  suffix?: string
  /** Year format in the number */
  yearFormat?: 'YYYY' | 'YY' | 'none'
  /** Separator between parts */
  separator?: string
  /** Padding for sequence number */
  padding?: number
}

/**
 * Parsed document number result
 */
export interface ParsedDocumentNumber {
  sequence: number
  year?: number
  month?: number
  prefix?: string
  suffix?: string
}

/**
 * Number generation strategy interface
 */
export interface NumberGenerationStrategy {
  /** Strategy name */
  readonly name: string
  /** Generate a document number */
  generate(sequence: number, config: NumberGenerationConfig): string
  /** Parse a document number back to its components */
  parse(documentNumber: string): ParsedDocumentNumber | null
}

/**
 * Document type configuration
 */
export interface DocumentTypeConfig {
  type: string
  config: NumberGenerationConfig
  strategyKey: string
}
