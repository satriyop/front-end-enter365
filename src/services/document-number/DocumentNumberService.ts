/**
 * Document Number Service
 *
 * Manages document number generation strategies and configurations
 * for different document types.
 */

import { logger } from '@/infrastructure/logger'
import type {
  NumberGenerationStrategy,
  NumberGenerationConfig,
  DocumentTypeConfig,
  ParsedDocumentNumber,
} from './types'

export class DocumentNumberService {
  private strategies = new Map<string, NumberGenerationStrategy>()
  private documentConfigs = new Map<string, DocumentTypeConfig>()

  /**
   * Register a number generation strategy
   */
  registerStrategy(key: string, strategy: NumberGenerationStrategy): void {
    this.strategies.set(key, strategy)
    logger.debug('Number generation strategy registered', { key, name: strategy.name })
  }

  /**
   * Get a registered strategy
   */
  getStrategy(key: string): NumberGenerationStrategy | undefined {
    return this.strategies.get(key)
  }

  /**
   * Configure a document type
   */
  configureDocumentType(
    documentType: string,
    strategyKey: string,
    config: NumberGenerationConfig
  ): void {
    const strategy = this.strategies.get(strategyKey)
    if (!strategy) {
      throw new Error(`Strategy not found: ${strategyKey}`)
    }

    this.documentConfigs.set(documentType, {
      type: documentType,
      strategyKey,
      config,
    })

    logger.debug('Document type configured', { documentType, strategyKey })
  }

  /**
   * Generate a document number for a specific type
   */
  generate(documentType: string, sequence: number): string {
    const config = this.documentConfigs.get(documentType)
    if (!config) {
      throw new Error(`Document type not configured: ${documentType}`)
    }

    const strategy = this.strategies.get(config.strategyKey)
    if (!strategy) {
      throw new Error(`Strategy not found: ${config.strategyKey}`)
    }

    return strategy.generate(sequence, config.config)
  }

  /**
   * Parse a document number
   */
  parse(documentType: string, documentNumber: string): ParsedDocumentNumber | null {
    const config = this.documentConfigs.get(documentType)
    if (!config) {
      return null
    }

    const strategy = this.strategies.get(config.strategyKey)
    if (!strategy) {
      return null
    }

    return strategy.parse(documentNumber)
  }

  /**
   * Get configuration for a document type
   */
  getDocumentConfig(documentType: string): DocumentTypeConfig | undefined {
    return this.documentConfigs.get(documentType)
  }

  /**
   * Preview what a document number would look like
   */
  preview(documentType: string, sequence: number = 1): string {
    return this.generate(documentType, sequence)
  }
}

// Singleton instance
export const documentNumberService = new DocumentNumberService()
