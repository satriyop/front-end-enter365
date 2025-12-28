import { z } from 'zod'

// ============================================
// Common Zod Schemas for Indonesian Business
// ============================================

/**
 * Indonesian phone number validation
 * Accepts: 08xx, +628xx, 628xx formats
 */
export const phoneSchema = z
  .string()
  .regex(/^(\+62|62|0)8[1-9][0-9]{7,10}$/, 'Invalid phone number format')
  .or(z.literal(''))
  .optional()
  .nullable()

/**
 * Indonesian NPWP (Tax ID) validation
 * Format: XX.XXX.XXX.X-XXX.XXX
 */
export const npwpSchema = z
  .string()
  .regex(/^\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3}$/, 'Invalid NPWP format (XX.XXX.XXX.X-XXX.XXX)')
  .or(z.literal(''))
  .optional()
  .nullable()

/**
 * Indonesian NIK (ID Card) validation
 * 16 digits
 */
export const nikSchema = z
  .string()
  .regex(/^\d{16}$/, 'NIK must be 16 digits')
  .or(z.literal(''))
  .optional()
  .nullable()

/**
 * Email validation
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .or(z.literal(''))
  .optional()
  .nullable()

/**
 * Required string
 */
export const requiredString = (field: string) =>
  z.string().min(1, `${field} is required`)

/**
 * Required positive number
 */
export const requiredPositiveNumber = (field: string) =>
  z.number({ invalid_type_error: `${field} must be a number` })
    .positive(`${field} must be greater than 0`)

/**
 * Optional positive number (allows 0)
 */
export const optionalPositiveNumber = z
  .number()
  .min(0, 'Must be 0 or greater')
  .optional()
  .nullable()

/**
 * Currency amount (integer, for IDR)
 */
export const currencySchema = z
  .number({ invalid_type_error: 'Must be a number' })
  .int('Amount must be a whole number')
  .min(0, 'Amount cannot be negative')

/**
 * Percentage (0-100)
 */
export const percentageSchema = z
  .number()
  .min(0, 'Percentage cannot be negative')
  .max(100, 'Percentage cannot exceed 100')

/**
 * Date string (YYYY-MM-DD)
 */
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')

/**
 * Required date
 */
export const requiredDate = (field: string) =>
  z.string().min(1, `${field} is required`).regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')

// ============================================
// Entity-Specific Schemas
// ============================================

/**
 * Contact form schema
 * Note: Uses empty strings instead of null for form compatibility
 */
export const contactSchema = z.object({
  code: requiredString('Code'),
  name: requiredString('Name'),
  type: z.enum(['customer', 'supplier', 'both'], {
    errorMap: () => ({ message: 'Please select a type' }),
  }),
  email: z.string().email('Invalid email address').or(z.literal('')).optional(),
  phone: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{7,10}$/, 'Invalid phone number').or(z.literal('')).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postal_code: z.string().optional(),
  npwp: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3}$/, 'Invalid NPWP format').or(z.literal('')).optional(),
  nik: z.string().regex(/^\d{16}$/, 'NIK must be 16 digits').or(z.literal('')).optional(),
  credit_limit: z.number().min(0).optional(),
  payment_term_days: z.number().int().min(0).max(365).optional(),
  is_active: z.boolean().default(true),
})

/**
 * Product form schema
 */
export const productSchema = z.object({
  sku: requiredString('SKU'),
  name: requiredString('Name'),
  type: z.enum(['product', 'service'], {
    errorMap: () => ({ message: 'Please select a type' }),
  }),
  description: z.string().optional().nullable(),
  unit: requiredString('Unit'),
  purchase_price: currencySchema.optional().nullable(),
  selling_price: currencySchema.optional().nullable(),
  category_id: z.number().optional().nullable(),
  is_active: z.boolean().default(true),
})

/**
 * Quotation item schema
 */
export const quotationItemSchema = z.object({
  product_id: z.number().optional().nullable(),
  description: requiredString('Description'),
  quantity: requiredPositiveNumber('Quantity'),
  unit: requiredString('Unit'),
  unit_price: currencySchema,
  discount_percent: percentageSchema.optional().default(0),
  tax_rate: percentageSchema.optional().default(0),
  notes: z.string().optional().nullable(),
})

/**
 * Quotation form schema
 */
export const quotationSchema = z.object({
  contact_id: z.number({ required_error: 'Please select a customer' }).positive('Please select a customer'),
  quotation_date: requiredDate('Quotation date'),
  valid_until: requiredDate('Valid until date'),
  subject: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  discount_type: z.enum(['percentage', 'fixed']).optional().nullable(),
  discount_value: optionalPositiveNumber,
  tax_rate: percentageSchema.optional().default(11),
  notes: z.string().optional().nullable(),
  terms_conditions: z.string().optional().nullable(),
  items: z.array(quotationItemSchema).min(1, 'At least one item is required'),
})

/**
 * Invoice item schema
 */
export const invoiceItemSchema = z.object({
  description: requiredString('Description'),
  quantity: requiredPositiveNumber('Quantity'),
  unit: z.string().optional().default('unit'),
  unit_price: currencySchema,
  revenue_account_id: z.number().optional().nullable(),
})

/**
 * Invoice form schema
 */
export const invoiceSchema = z.object({
  contact_id: z.number({ required_error: 'Please select a customer' }).positive('Please select a customer'),
  invoice_date: requiredDate('Invoice date'),
  due_date: requiredDate('Due date'),
  description: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  tax_rate: percentageSchema.optional().default(11),
  discount_amount: optionalPositiveNumber,
  receivable_account_id: z.number().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
})

/**
 * User form schema
 */
export const userSchema = z.object({
  name: requiredString('Name'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  is_active: z.boolean().default(true),
  roles: z.array(z.number()).optional(),
})

/**
 * User update schema (password optional)
 */
export const userUpdateSchema = userSchema.omit({ password: true }).extend({
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
})

// ============================================
// Solar Proposal Schemas
// ============================================

/**
 * Roof types for solar installation
 */
export const roofTypeSchema = z.enum(['flat', 'sloped', 'carport'], {
  errorMap: () => ({ message: 'Please select a roof type' }),
})

/**
 * Roof orientation
 */
export const roofOrientationSchema = z.enum(['north', 'south', 'east', 'west'], {
  errorMap: () => ({ message: 'Please select roof orientation' }),
})

/**
 * Solar Proposal Step 1: Site & Customer Information
 */
export const solarProposalStep1Schema = z.object({
  contact_id: z.number({ required_error: 'Please select a customer' }).positive('Please select a customer'),
  site_name: requiredString('Site name'),
  site_address: requiredString('Site address'),
  province: requiredString('Province'),
  city: requiredString('City'),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  roof_area_m2: z.number().positive('Roof area must be greater than 0').optional().nullable(),
  roof_type: roofTypeSchema,
  roof_orientation: roofOrientationSchema,
  roof_tilt_degrees: z.number().min(0, 'Tilt cannot be negative').max(90, 'Tilt cannot exceed 90 degrees').optional().nullable(),
  shading_percentage: percentageSchema.optional().default(0),
})

/**
 * Solar Proposal Step 2: Electricity Profile
 */
export const solarProposalStep2Schema = z.object({
  monthly_consumption_kwh: z.number({ required_error: 'Monthly consumption is required' })
    .positive('Consumption must be greater than 0'),
  pln_tariff_category: requiredString('PLN tariff category'),
  electricity_rate: z.number({ required_error: 'Electricity rate is required' })
    .positive('Rate must be greater than 0'),
  tariff_escalation_percent: z.number()
    .min(0, 'Escalation cannot be negative')
    .max(20, 'Escalation seems too high')
    .optional()
    .default(3),
})

/**
 * Solar Proposal Step 3: System Selection
 */
export const solarProposalStep3Schema = z.object({
  variant_group_id: z.number().positive().optional().nullable(),
  selected_bom_id: z.number().positive().optional().nullable(),
  system_capacity_kwp: z.number().positive('System capacity must be greater than 0').optional().nullable(),
  peak_sun_hours: z.number().positive().optional().nullable(),
  solar_irradiance: z.number().positive().optional().nullable(),
  performance_ratio: z.number().min(0.5).max(1).optional().default(0.8),
})

/**
 * Solar Proposal Step 4: Review & Settings
 */
export const solarProposalStep4Schema = z.object({
  valid_until: requiredDate('Valid until date'),
  notes: z.string().optional().nullable(),
})

/**
 * Complete Solar Proposal schema (all steps combined)
 */
export const solarProposalSchema = solarProposalStep1Schema
  .merge(solarProposalStep2Schema)
  .merge(solarProposalStep3Schema)
  .merge(solarProposalStep4Schema)

// ============================================
// Type exports from schemas
// ============================================

export type ContactFormData = z.infer<typeof contactSchema>
export type ProductFormData = z.infer<typeof productSchema>
export type QuotationFormData = z.infer<typeof quotationSchema>
export type QuotationItemFormData = z.infer<typeof quotationItemSchema>
export type InvoiceFormData = z.infer<typeof invoiceSchema>
export type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>
export type UserFormData = z.infer<typeof userSchema>
export type SolarProposalStep1Data = z.infer<typeof solarProposalStep1Schema>
export type SolarProposalStep2Data = z.infer<typeof solarProposalStep2Schema>
export type SolarProposalStep3Data = z.infer<typeof solarProposalStep3Schema>
export type SolarProposalStep4Data = z.infer<typeof solarProposalStep4Schema>
export type SolarProposalFormData = z.infer<typeof solarProposalSchema>
