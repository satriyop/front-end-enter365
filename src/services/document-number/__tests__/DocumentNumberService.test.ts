/**
 * Document Number Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DocumentNumberService } from '../DocumentNumberService'
import { SequentialStrategy } from '../strategies/SequentialStrategy'
import { MonthlyResetStrategy } from '../strategies/MonthlyResetStrategy'

describe('DocumentNumberService', () => {
  let service: DocumentNumberService

  beforeEach(() => {
    service = new DocumentNumberService()
    service.registerStrategy('sequential', new SequentialStrategy())
    service.registerStrategy('monthly', new MonthlyResetStrategy())
  })

  describe('strategy registration', () => {
    it('should register strategies', () => {
      expect(service.getStrategy('sequential')).toBeDefined()
      expect(service.getStrategy('monthly')).toBeDefined()
    })

    it('should return undefined for unknown strategy', () => {
      expect(service.getStrategy('unknown')).toBeUndefined()
    })
  })

  describe('document type configuration', () => {
    it('should configure document types', () => {
      service.configureDocumentType('invoice', 'sequential', {
        prefix: 'INV',
        yearFormat: 'YYYY',
        padding: 4,
      })

      const config = service.getDocumentConfig('invoice')
      expect(config).toBeDefined()
      expect(config?.strategyKey).toBe('sequential')
      expect(config?.config.prefix).toBe('INV')
    })

    it('should throw for unknown strategy', () => {
      expect(() => {
        service.configureDocumentType('test', 'unknown', { prefix: 'TEST' })
      }).toThrow('Strategy not found: unknown')
    })
  })

  describe('SequentialStrategy', () => {
    beforeEach(() => {
      service.configureDocumentType('invoice', 'sequential', {
        prefix: 'INV',
        yearFormat: 'YYYY',
        padding: 4,
      })
    })

    it('should generate sequential numbers', () => {
      const year = new Date().getFullYear()

      expect(service.generate('invoice', 1)).toBe(`INV-${year}-0001`)
      expect(service.generate('invoice', 42)).toBe(`INV-${year}-0042`)
      expect(service.generate('invoice', 999)).toBe(`INV-${year}-0999`)
    })

    it('should handle 2-digit year format', () => {
      service.configureDocumentType('quotation', 'sequential', {
        prefix: 'QUO',
        yearFormat: 'YY',
        padding: 4,
      })

      const year = String(new Date().getFullYear()).slice(-2)
      expect(service.generate('quotation', 1)).toBe(`QUO-${year}-0001`)
    })

    it('should handle no year format', () => {
      service.configureDocumentType('receipt', 'sequential', {
        prefix: 'RCP',
        yearFormat: 'none',
        padding: 5,
      })

      expect(service.generate('receipt', 1)).toBe('RCP-00001')
    })

    it('should handle suffix', () => {
      service.configureDocumentType('test', 'sequential', {
        prefix: 'TEST',
        suffix: 'HQ',
        yearFormat: 'YYYY',
        padding: 3,
      })

      const year = new Date().getFullYear()
      expect(service.generate('test', 1)).toBe(`TEST-${year}-001-HQ`)
    })

    it('should parse document numbers', () => {
      const year = new Date().getFullYear()
      const parsed = service.parse('invoice', `INV-${year}-0042`)

      expect(parsed).not.toBeNull()
      expect(parsed?.sequence).toBe(42)
      expect(parsed?.year).toBe(year)
      expect(parsed?.prefix).toBe('INV')
    })
  })

  describe('MonthlyResetStrategy', () => {
    beforeEach(() => {
      service.configureDocumentType('delivery', 'monthly', {
        prefix: 'DO',
        padding: 4,
      })
    })

    it('should generate monthly numbers', () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')

      expect(service.generate('delivery', 1)).toBe(`DO-${year}${month}-0001`)
      expect(service.generate('delivery', 99)).toBe(`DO-${year}${month}-0099`)
    })

    it('should parse monthly document numbers', () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1

      const parsed = service.parse('delivery', `DO-${year}${String(month).padStart(2, '0')}-0042`)

      expect(parsed).not.toBeNull()
      expect(parsed?.sequence).toBe(42)
      expect(parsed?.year).toBe(year)
      expect(parsed?.month).toBe(month)
    })
  })

  describe('preview', () => {
    it('should preview document number', () => {
      service.configureDocumentType('invoice', 'sequential', {
        prefix: 'INV',
        yearFormat: 'YYYY',
        padding: 4,
      })

      const year = new Date().getFullYear()
      expect(service.preview('invoice')).toBe(`INV-${year}-0001`)
      expect(service.preview('invoice', 100)).toBe(`INV-${year}-0100`)
    })
  })

  describe('error handling', () => {
    it('should throw for unconfigured document type', () => {
      expect(() => {
        service.generate('unknown', 1)
      }).toThrow('Document type not configured: unknown')
    })

    it('should return null for parse of unconfigured type', () => {
      expect(service.parse('unknown', 'TEST-0001')).toBeNull()
    })
  })
})

describe('SequentialStrategy parsing', () => {
  const strategy = new SequentialStrategy()

  it('should parse PREFIX-YYYY-NNNN format', () => {
    const result = strategy.parse('INV-2024-0042')
    expect(result?.prefix).toBe('INV')
    expect(result?.year).toBe(2024)
    expect(result?.sequence).toBe(42)
  })

  it('should parse PREFIX-YY-NNNN format', () => {
    const result = strategy.parse('INV-24-0042')
    expect(result?.prefix).toBe('INV')
    expect(result?.year).toBe(2024)
    expect(result?.sequence).toBe(42)
  })

  it('should parse PREFIX-NNNN format', () => {
    const result = strategy.parse('INV-0042')
    expect(result?.prefix).toBe('INV')
    expect(result?.sequence).toBe(42)
    expect(result?.year).toBeUndefined()
  })

  it('should return null for invalid format', () => {
    expect(strategy.parse('invalid')).toBeNull()
    expect(strategy.parse('')).toBeNull()
  })
})
