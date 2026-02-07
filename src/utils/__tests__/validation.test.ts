/**
 * validation.ts Tests
 *
 * Tests common Zod schemas, helper factories, and key entity schemas
 * with date refinements. Focuses on validation rules and the
 * nullable vs optional pattern for form compatibility.
 */

import { describe, it, expect } from 'vitest'
import {
  phoneSchema,
  npwpSchema,
  nikSchema,
  emailSchema,
  requiredString,
  requiredPositiveNumber,
  optionalPositiveNumber,
  currencySchema,
  quantitySchema,
  percentageSchema,
  dateSchema,
  requiredDate,
  subjectSchema,
  notesSchema,
  // Entity schemas with refinements
  invoiceSchema,
  quotationSchema,
  billSchema,
  projectSchema,
  workOrderSchema,
  mrpRunSchema,
  passwordChangeSchema,
  // Simple entity schemas
  contactSchema,
  productSchema,
  warehouseSchema,
  roleSchema,
} from '../validation'

// ============================================
// Indonesian Format Schemas
// ============================================

describe('phoneSchema', () => {
  it('accepts 08xx format', () => {
    expect(phoneSchema.safeParse('081234567890').success).toBe(true)
  })

  it('accepts +628xx format', () => {
    expect(phoneSchema.safeParse('+6281234567890').success).toBe(true)
  })

  it('accepts 628xx format', () => {
    expect(phoneSchema.safeParse('6281234567890').success).toBe(true)
  })

  it('accepts empty string (optional)', () => {
    expect(phoneSchema.safeParse('').success).toBe(true)
  })

  it('accepts undefined (optional)', () => {
    expect(phoneSchema.safeParse(undefined).success).toBe(true)
  })

  it('rejects invalid format', () => {
    expect(phoneSchema.safeParse('12345').success).toBe(false)
  })

  it('rejects landline numbers', () => {
    expect(phoneSchema.safeParse('0211234567').success).toBe(false)
  })
})

describe('npwpSchema', () => {
  it('accepts valid NPWP format', () => {
    expect(npwpSchema.safeParse('12.345.678.9-012.345').success).toBe(true)
  })

  it('accepts empty string', () => {
    expect(npwpSchema.safeParse('').success).toBe(true)
  })

  it('rejects invalid format', () => {
    expect(npwpSchema.safeParse('1234567890').success).toBe(false)
  })
})

describe('nikSchema', () => {
  it('accepts valid 16-digit NIK', () => {
    expect(nikSchema.safeParse('3374012345678901').success).toBe(true)
  })

  it('accepts empty string', () => {
    expect(nikSchema.safeParse('').success).toBe(true)
  })

  it('rejects 15 digits', () => {
    expect(nikSchema.safeParse('337401234567890').success).toBe(false)
  })

  it('rejects 17 digits', () => {
    expect(nikSchema.safeParse('33740123456789012').success).toBe(false)
  })
})

describe('emailSchema', () => {
  it('accepts valid email', () => {
    expect(emailSchema.safeParse('user@example.com').success).toBe(true)
  })

  it('accepts empty string', () => {
    expect(emailSchema.safeParse('').success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(emailSchema.safeParse('not-an-email').success).toBe(false)
  })
})

// ============================================
// Helper Factories
// ============================================

describe('requiredString', () => {
  it('creates a schema requiring non-empty string', () => {
    const schema = requiredString('Name')
    expect(schema.safeParse('John').success).toBe(true)
  })

  it('rejects empty string', () => {
    const schema = requiredString('Name')
    const result = schema.safeParse('')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('Name is required')
    }
  })
})

describe('requiredPositiveNumber', () => {
  it('accepts positive number', () => {
    const schema = requiredPositiveNumber('Amount')
    expect(schema.safeParse(100).success).toBe(true)
  })

  it('rejects zero', () => {
    const schema = requiredPositiveNumber('Amount')
    expect(schema.safeParse(0).success).toBe(false)
  })

  it('rejects negative', () => {
    const schema = requiredPositiveNumber('Amount')
    expect(schema.safeParse(-1).success).toBe(false)
  })

  it('rejects string', () => {
    const schema = requiredPositiveNumber('Amount')
    const result = schema.safeParse('abc')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('must be a number')
    }
  })
})

describe('optionalPositiveNumber', () => {
  it('accepts positive number', () => {
    expect(optionalPositiveNumber.safeParse(10).success).toBe(true)
  })

  it('accepts zero', () => {
    expect(optionalPositiveNumber.safeParse(0).success).toBe(true)
  })

  it('accepts null (nullable for foreign keys)', () => {
    expect(optionalPositiveNumber.safeParse(null).success).toBe(true)
  })

  it('accepts undefined', () => {
    expect(optionalPositiveNumber.safeParse(undefined).success).toBe(true)
  })

  it('rejects negative', () => {
    expect(optionalPositiveNumber.safeParse(-1).success).toBe(false)
  })
})

// ============================================
// Value Schemas
// ============================================

describe('currencySchema', () => {
  it('accepts whole number', () => {
    expect(currencySchema.safeParse(150000).success).toBe(true)
  })

  it('accepts zero', () => {
    expect(currencySchema.safeParse(0).success).toBe(true)
  })

  it('rejects negative', () => {
    expect(currencySchema.safeParse(-100).success).toBe(false)
  })

  it('rejects decimal (IDR is integer)', () => {
    expect(currencySchema.safeParse(100.5).success).toBe(false)
  })
})

describe('quantitySchema', () => {
  it('accepts positive quantity', () => {
    expect(quantitySchema.safeParse(10).success).toBe(true)
  })

  it('accepts fractional quantity', () => {
    expect(quantitySchema.safeParse(0.5).success).toBe(true)
  })

  it('rejects zero', () => {
    expect(quantitySchema.safeParse(0).success).toBe(false)
  })

  it('accepts minimum 0.0001', () => {
    expect(quantitySchema.safeParse(0.0001).success).toBe(true)
  })
})

describe('percentageSchema', () => {
  it('accepts 0', () => {
    expect(percentageSchema.safeParse(0).success).toBe(true)
  })

  it('accepts 100', () => {
    expect(percentageSchema.safeParse(100).success).toBe(true)
  })

  it('rejects > 100', () => {
    expect(percentageSchema.safeParse(101).success).toBe(false)
  })

  it('rejects negative', () => {
    expect(percentageSchema.safeParse(-1).success).toBe(false)
  })
})

describe('dateSchema', () => {
  it('accepts YYYY-MM-DD format', () => {
    expect(dateSchema.safeParse('2024-12-27').success).toBe(true)
  })

  it('rejects other formats', () => {
    expect(dateSchema.safeParse('27/12/2024').success).toBe(false)
  })

  it('rejects empty string', () => {
    expect(dateSchema.safeParse('').success).toBe(false)
  })
})

describe('requiredDate', () => {
  it('accepts valid date', () => {
    const schema = requiredDate('Due date')
    expect(schema.safeParse('2024-12-27').success).toBe(true)
  })

  it('rejects empty string with field name in message', () => {
    const schema = requiredDate('Due date')
    const result = schema.safeParse('')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('Due date is required')
    }
  })
})

describe('string field schemas (optional with defaults)', () => {
  it('subjectSchema defaults to empty string', () => {
    const result = subjectSchema.parse(undefined)
    expect(result).toBe('')
  })

  it('subjectSchema rejects > 255 chars', () => {
    expect(subjectSchema.safeParse('x'.repeat(256)).success).toBe(false)
  })

  it('notesSchema defaults to empty string', () => {
    const result = notesSchema.parse(undefined)
    expect(result).toBe('')
  })

  it('notesSchema rejects > 2000 chars', () => {
    expect(notesSchema.safeParse('x'.repeat(2001)).success).toBe(false)
  })
})

// ============================================
// Entity Schemas with Date Refinements
// ============================================

describe('invoiceSchema', () => {
  const validInvoice = {
    contact_id: 1,
    invoice_date: '2024-06-15',
    due_date: '2024-07-15',
    items: [{ description: 'Service', quantity: 1, unit: 'pcs', unit_price: 100000 }],
  }

  it('accepts valid invoice', () => {
    expect(invoiceSchema.safeParse(validInvoice).success).toBe(true)
  })

  it('rejects due_date before invoice_date', () => {
    const result = invoiceSchema.safeParse({
      ...validInvoice,
      due_date: '2024-06-01',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const dueDateError = result.error.issues.find(i => i.path.includes('due_date'))
      expect(dueDateError?.message).toContain('after or equal to invoice date')
    }
  })

  it('accepts same invoice_date and due_date', () => {
    expect(invoiceSchema.safeParse({
      ...validInvoice,
      due_date: '2024-06-15',
    }).success).toBe(true)
  })

  it('requires at least one item', () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, items: [] })
    expect(result.success).toBe(false)
  })

  it('requires contact_id', () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, contact_id: undefined })
    expect(result.success).toBe(false)
  })
})

describe('quotationSchema', () => {
  const validQuotation = {
    contact_id: 1,
    quotation_date: '2024-06-15',
    items: [{ description: 'Widget', quantity: 1, unit: 'pcs', unit_price: 50000 }],
  }

  it('accepts valid quotation', () => {
    expect(quotationSchema.safeParse(validQuotation).success).toBe(true)
  })

  it('rejects valid_until before quotation_date', () => {
    const result = quotationSchema.safeParse({
      ...validQuotation,
      valid_until: '2024-06-01',
    })
    expect(result.success).toBe(false)
  })

  it('passes when valid_until is empty (optional)', () => {
    expect(quotationSchema.safeParse({
      ...validQuotation,
      valid_until: '',
    }).success).toBe(true)
  })
})

describe('billSchema', () => {
  const validBill = {
    contact_id: 1,
    bill_date: '2024-06-15',
    due_date: '2024-07-15',
    items: [{ description: 'Material', quantity: 1, unit: 'pcs', unit_price: 75000 }],
  }

  it('accepts valid bill', () => {
    expect(billSchema.safeParse(validBill).success).toBe(true)
  })

  it('rejects due_date before bill_date', () => {
    const result = billSchema.safeParse({
      ...validBill,
      due_date: '2024-06-01',
    })
    expect(result.success).toBe(false)
  })
})

describe('projectSchema', () => {
  const validProject = {
    name: 'Solar Installation',
    contact_id: 1,
    start_date: '2024-06-01',
  }

  it('accepts valid project', () => {
    expect(projectSchema.safeParse(validProject).success).toBe(true)
  })

  it('rejects end_date before start_date', () => {
    const result = projectSchema.safeParse({
      ...validProject,
      end_date: '2024-05-01',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const endDateError = result.error.issues.find(i => i.path.includes('end_date'))
      expect(endDateError?.message).toContain('after or equal to start date')
    }
  })

  it('passes when end_date is empty (optional)', () => {
    expect(projectSchema.safeParse({
      ...validProject,
      end_date: '',
    }).success).toBe(true)
  })
})

describe('workOrderSchema', () => {
  const validWO = {
    name: 'WO-001',
    quantity_ordered: 10,
  }

  it('accepts valid work order', () => {
    expect(workOrderSchema.safeParse(validWO).success).toBe(true)
  })

  it('rejects planned_end_date before planned_start_date', () => {
    const result = workOrderSchema.safeParse({
      ...validWO,
      planned_start_date: '2024-06-15',
      planned_end_date: '2024-06-01',
    })
    expect(result.success).toBe(false)
  })
})

describe('mrpRunSchema', () => {
  const validMrp = {
    planning_horizon_start: '2024-06-01',
    planning_horizon_end: '2024-12-31',
  }

  it('accepts valid MRP run', () => {
    expect(mrpRunSchema.safeParse(validMrp).success).toBe(true)
  })

  it('rejects end before start', () => {
    const result = mrpRunSchema.safeParse({
      ...validMrp,
      planning_horizon_end: '2024-05-01',
    })
    expect(result.success).toBe(false)
  })
})

describe('passwordChangeSchema', () => {
  it('accepts matching passwords', () => {
    expect(passwordChangeSchema.safeParse({
      current_password: 'oldpass123',
      password: 'newpass123',
      password_confirmation: 'newpass123',
    }).success).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const result = passwordChangeSchema.safeParse({
      current_password: 'oldpass123',
      password: 'newpass123',
      password_confirmation: 'differentpass',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('do not match')
    }
  })

  it('rejects short password', () => {
    expect(passwordChangeSchema.safeParse({
      current_password: 'oldpass123',
      password: 'short',
      password_confirmation: 'short',
    }).success).toBe(false)
  })
})

// ============================================
// Nullable vs Optional Pattern
// ============================================

describe('nullable vs optional pattern', () => {
  it('contact string fields default to empty string (not null)', () => {
    const result = contactSchema.safeParse({
      code: 'C001',
      name: 'Test Contact',
      type: 'customer',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.notes).toBe('')
      expect(result.data.bank_name).toBe('')
    }
  })

  it('product foreign key fields accept null', () => {
    const result = productSchema.safeParse({
      sku: 'SKU001',
      name: 'Product',
      type: 'product',
      unit: 'pcs',
      category_id: null,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.category_id).toBeNull()
    }
  })

  it('warehouse string fields default to empty string', () => {
    const result = warehouseSchema.safeParse({ name: 'Main Warehouse' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.code).toBe('')
      expect(result.data.address).toBe('')
      expect(result.data.phone).toBe('')
    }
  })
})

// ============================================
// Simple Entity Schemas (basic field validation)
// ============================================

describe('roleSchema', () => {
  it('accepts valid role', () => {
    expect(roleSchema.safeParse({
      name: 'admin',
      display_name: 'Administrator',
    }).success).toBe(true)
  })

  it('rejects name > 50 chars', () => {
    expect(roleSchema.safeParse({
      name: 'a'.repeat(51),
      display_name: 'Test',
    }).success).toBe(false)
  })
})
