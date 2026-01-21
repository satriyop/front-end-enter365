/**
 * Export Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'

// Helper to read blob contents in test environment
async function readBlobAsText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(blob)
  })
}
import { ExportService } from '../ExportService'
import { CSVExportStrategy } from '../strategies/CSVExportStrategy'
import { ExcelExportStrategy } from '../strategies/ExcelExportStrategy'
import type { ExportColumn } from '../types'

interface TestData extends Record<string, unknown> {
  id: number
  name: string
  price: number
  date: Date
}

describe('ExportService', () => {
  let service: ExportService

  beforeEach(() => {
    service = new ExportService()
  })

  describe('strategy registration', () => {
    it('should register strategies', () => {
      service.registerStrategy('csv', new CSVExportStrategy())
      expect(service.getStrategy('csv')).toBeDefined()
    })

    it('should return available formats', () => {
      service.registerStrategy('csv', new CSVExportStrategy())
      service.registerStrategy('excel', new ExcelExportStrategy())

      const formats = service.getAvailableFormats()
      expect(formats).toHaveLength(2)
      expect(formats.find((f) => f.key === 'csv')).toBeDefined()
      expect(formats.find((f) => f.key === 'excel')).toBeDefined()
    })

    it('should return undefined for unknown strategy', () => {
      expect(service.getStrategy('unknown')).toBeUndefined()
    })
  })
})

describe('CSVExportStrategy', () => {
  const strategy = new CSVExportStrategy<TestData>()

  const testData: TestData[] = [
    { id: 1, name: 'Product A', price: 100, date: new Date('2024-01-15') },
    { id: 2, name: 'Product B', price: 200.5, date: new Date('2024-02-20') },
  ]

  const columns: ExportColumn<TestData>[] = [
    { key: 'id', header: 'ID', format: 'number' },
    { key: 'name', header: 'Name' },
    { key: 'price', header: 'Price', format: 'currency' },
    { key: 'date', header: 'Date', format: 'date' },
  ]

  it('should have correct metadata', () => {
    expect(strategy.name).toBe('CSV')
    expect(strategy.extension).toBe('csv')
    expect(strategy.mimeType).toContain('text/csv')
  })

  it('should export data to CSV blob', async () => {
    const blob = await strategy.export(testData, columns)

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toContain('text/csv')

    const text = await readBlobAsText(blob)
    expect(text).toContain('ID,Name,Price,Date')
    expect(text).toContain('1,Product A,100.00,2024-01-15')
    expect(text).toContain('2,Product B,200.50,2024-02-20')
  })

  it('should escape special characters', async () => {
    const dataWithSpecialChars: TestData[] = [
      { id: 1, name: 'Product, with comma', price: 100, date: new Date('2024-01-15') },
      { id: 2, name: 'Product "with quotes"', price: 200, date: new Date('2024-01-15') },
    ]

    const blob = await strategy.export(dataWithSpecialChars, columns)
    const text = await readBlobAsText(blob)

    expect(text).toContain('"Product, with comma"')
    expect(text).toContain('"Product ""with quotes"""')
  })

  it('should handle null and undefined values', async () => {
    const dataWithNulls = [
      { id: 1, name: null as unknown as string, price: 100, date: new Date('2024-01-15') },
    ]

    const blob = await strategy.export(dataWithNulls, columns)
    const text = await readBlobAsText(blob)

    expect(text).toContain('1,,100.00')
  })

  it('should use custom delimiter', async () => {
    const semicolonStrategy = new CSVExportStrategy<TestData>({ delimiter: ';' })
    const blob = await semicolonStrategy.export(testData, columns)
    const text = await readBlobAsText(blob)

    expect(text).toContain('ID;Name;Price;Date')
  })

  it('should use custom formatter', async () => {
    const customColumns: ExportColumn<TestData>[] = [
      { key: 'id', header: 'ID' },
      { key: 'price', header: 'Price', formatter: (v) => `$${v}` },
    ]

    const blob = await strategy.export(testData, customColumns)
    const text = await readBlobAsText(blob)

    expect(text).toContain('$100')
    expect(text).toContain('$200.5')
  })
})

describe('ExcelExportStrategy', () => {
  const strategy = new ExcelExportStrategy<TestData>()

  const testData: TestData[] = [
    { id: 1, name: 'Product A', price: 100, date: new Date('2024-01-15') },
  ]

  const columns: ExportColumn<TestData>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
    { key: 'price', header: 'Price', format: 'currency' },
  ]

  it('should have correct metadata', () => {
    expect(strategy.name).toBe('Excel')
    expect(strategy.extension).toBe('xlsx')
    expect(strategy.mimeType).toContain('spreadsheetml')
  })

  it('should export data to Excel blob', async () => {
    const blob = await strategy.export(testData, columns)

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(0)
  })

  it('should use custom sheet name', async () => {
    const customStrategy = new ExcelExportStrategy<TestData>({ sheetName: 'Products' })
    const blob = await customStrategy.export(testData, columns)

    expect(blob).toBeInstanceOf(Blob)
  })
})
