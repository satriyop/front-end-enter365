import { z } from 'zod'

// ============================================
// Common Zod Schemas for Indonesian Business
// ============================================
//
// IMPORTANT: Form schemas should NOT use .nullable() for string fields.
// - Forms work with empty strings "", not null
// - Use .optional() or .optional().default('') for optional string fields
// - Only use .nullable() for foreign key IDs (e.g., contact_id, warehouse_id)
//   because these genuinely can be null in the database
//
// Pattern:
//   String fields:     .optional()              → string | undefined ✓
//   Foreign key IDs:   .optional().nullable()   → number | null | undefined ✓
//

/**
 * Indonesian phone number validation (for forms - no nullable)
 * Accepts: 08xx, +628xx, 628xx formats, or empty string
 */
export const phoneSchema = z
  .string()
  .regex(/^(\+62|62|0)8[1-9][0-9]{7,10}$/, 'Invalid phone number format')
  .or(z.literal(''))
  .optional()

/**
 * Indonesian NPWP (Tax ID) validation (for forms - no nullable)
 * Format: XX.XXX.XXX.X-XXX.XXX or empty string
 */
export const npwpSchema = z
  .string()
  .regex(/^\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3}$/, 'Invalid NPWP format (XX.XXX.XXX.X-XXX.XXX)')
  .or(z.literal(''))
  .optional()

/**
 * Indonesian NIK (ID Card) validation (for forms - no nullable)
 * 16 digits or empty string
 */
export const nikSchema = z
  .string()
  .regex(/^\d{16}$/, 'NIK must be 16 digits')
  .or(z.literal(''))
  .optional()

/**
 * Email validation (for forms - no nullable)
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .or(z.literal(''))
  .optional()

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
 * Unit price schema
 */
export const unitPriceSchema = z
  .number({ invalid_type_error: 'Must be a number' })
  .min(0, 'Price cannot be negative')

/**
 * Quantity schema
 */
export const quantitySchema = z
  .number({ invalid_type_error: 'Must be a number' })
  .min(0.0001, 'Quantity must be at least 0.0001')

/**
 * Percentage (0-100)
 */
export const percentageSchema = z
  .number()
  .min(0, 'Percentage cannot be negative')
  .max(100, 'Percentage cannot exceed 100')

/**
 * Subject schema (max 255)
 */
export const subjectSchema = z.string().max(255, 'Subject is too long').optional().default('')

/**
 * Reference schema (max 100)
 */
export const referenceSchema = z.string().max(100, 'Reference is too long').optional().default('')

/**
 * Notes schema (max 2000)
 */
export const notesSchema = z.string().max(2000, 'Notes are too long').optional().default('')

/**
 * Item notes schema (max 500)
 */
export const itemNotesSchema = z.string().max(500, 'Item notes are too long').optional().default('')

/**
 * Description schema (max 500)
 */
export const descriptionSchema = z.string().max(500, 'Description is too long').optional().default('')

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
  code: requiredString('Code').max(50),
  name: requiredString('Name').max(255),
  type: z.enum(['customer', 'supplier', 'both'], {
    errorMap: () => ({ message: 'Please select a type' }),
  }),
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  postal_code: z.string().max(10).optional(),
  npwp: npwpSchema,
  nik: nikSchema,
  // Payment terms
  credit_limit: currencySchema.optional(),
  payment_term_days: z.number().int().min(0).max(365).optional(),
  currency: z.string().max(3).optional().default(''),
  // Early payment discount
  early_discount_percent: z.number().min(0).max(100).optional().nullable(),
  early_discount_days: z.number().int().min(0).max(365).optional().nullable(),
  // Bank account details
  bank_name: z.string().max(100).optional().default(''),
  bank_account_number: z.string().max(30).optional().default(''),
  bank_account_name: z.string().max(100).optional().default(''),
  // Subcontractor fields
  is_subcontractor: z.boolean().optional().default(false),
  hourly_rate: z.number().int().min(0).optional().nullable(),
  daily_rate: z.number().int().min(0).optional().nullable(),
  subcontractor_services: z.array(z.string()).optional().default([]),
  notes: z.string().max(2000).optional().default(''),
  is_active: z.boolean().default(true),
})

/**
 * Product form schema
 */
export const productSchema = z.object({
  sku: requiredString('SKU').max(50),
  name: requiredString('Name').max(255),
  type: z.enum(['product', 'service'], {
    errorMap: () => ({ message: 'Please select a type' }),
  }),
  description: z.string().max(500).optional().default(''),
  unit: requiredString('Unit').max(20),
  // Pricing
  purchase_price: unitPriceSchema.default(0),
  selling_price: unitPriceSchema.default(0),
  tax_rate: percentageSchema.default(11),
  is_taxable: z.boolean().default(true),
  // Inventory
  track_inventory: z.boolean().default(true),
  min_stock: z.number().min(0, 'Minimum stock cannot be negative').default(0),
  // Category & additional info
  category_id: z.number().optional().nullable(),
  barcode: z.string().max(100).optional().default(''),
  brand: z.string().max(100).optional().default(''),
  // Sales & purchasing options
  is_sellable: z.boolean().default(true),
  is_purchasable: z.boolean().default(true),
  // Account mapping (for products with inventory tracking)
  inventory_account_id: z.number().optional().nullable(),
  cogs_account_id: z.number().optional().nullable(),
  sales_account_id: z.number().optional().nullable(),
  purchase_account_id: z.number().optional().nullable(),
  // Status
  is_active: z.boolean().default(true),
})

/**
 * Product Category form schema
 */
export const productCategorySchema = z.object({
  code: z.string().max(50).optional().default(''),
  name: requiredString('Name').max(100),
  description: z.string().max(500).optional().default(''),
  parent_id: z.number().optional().nullable(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
})

/**
 * Quotation item schema
 */
export const quotationItemSchema = z.object({
  product_id: z.number().optional().nullable(),
  description: requiredString('Description').max(500),
  quantity: quantitySchema.default(1),
  unit: z.string().max(20).default('pcs'),
  unit_price: unitPriceSchema.default(0),
  discount_percent: percentageSchema.default(0),
  tax_rate: percentageSchema.default(11),
  notes: itemNotesSchema,
})

/**
 * Quotation form schema
 */
export const quotationSchema = z.object({
  contact_id: z.number({ required_error: 'Please select a customer' }).positive('Please select a customer'),
  quotation_date: requiredDate('Quotation date'),
  valid_until: z.string().optional().default(''),
  subject: subjectSchema,
  reference: referenceSchema,
  currency: z.string().default('IDR'),
  exchange_rate: z.number().min(0).default(1),
  discount_type: z.enum(['percentage', 'fixed']).default('percentage'),
  discount_value: z.number().min(0).default(0),
  tax_rate: percentageSchema.default(11),
  notes: notesSchema,
  terms_conditions: z.string().max(5000, 'Terms are too long').optional().default(''),
  items: z.array(quotationItemSchema).min(1, 'At least one item is required'),
}).refine((data) => {
  if (!data.quotation_date || !data.valid_until) return true
  return new Date(data.valid_until) >= new Date(data.quotation_date)
}, {
  message: 'Valid until date must be after or equal to quotation date',
  path: ['valid_until'],
})

/**
 * Invoice item schema
 */
export const invoiceItemSchema = z.object({
  description: requiredString('Description').max(500),
  quantity: quantitySchema.default(1),
  unit: z.string().max(20).default('pcs'),
  unit_price: unitPriceSchema.default(0),
  revenue_account_id: z.number().optional().nullable(),
})

/**
 * Invoice form schema
 */
export const invoiceSchema = z.object({
  contact_id: z.number({ required_error: 'Please select a customer' }).positive('Please select a customer'),
  invoice_date: requiredDate('Invoice date'),
  due_date: requiredDate('Due date'),
  description: descriptionSchema,
  reference: referenceSchema,
  currency: z.string().default('IDR'),
  exchange_rate: z.number().min(0).default(1),
  tax_rate: percentageSchema.default(11),
  discount_amount: currencySchema.default(0),
  receivable_account_id: z.number().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
}).refine((data) => {
  if (!data.invoice_date || !data.due_date) return true
  return new Date(data.due_date) >= new Date(data.invoice_date)
}, {
  message: 'Due date must be after or equal to invoice date',
  path: ['due_date'],
})

/**
 * User form schema (create & edit)
 * Password is optional (for edit mode). Confirmation handled at submit time.
 */
export const userSchema = z.object({
  name: requiredString('Name').max(255),
  email: requiredString('Email').email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().default(''),
  password_confirmation: z.string().optional().default(''),
  is_active: z.boolean().default(true),
  roles: z.array(z.number()).default([]),
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
  notes: z.string().optional().default(''),
})

/**
 * Complete Solar Proposal schema (all steps combined)
 */
export const solarProposalSchema = solarProposalStep1Schema
  .merge(solarProposalStep2Schema)
  .merge(solarProposalStep3Schema)
  .merge(solarProposalStep4Schema)

// ============================================
// Settings & Profile Schemas
// ============================================

/**
 * Profile update schema (name and email only)
 */
export const profileUpdateSchema = z.object({
  name: requiredString('Name'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
})

/**
 * Password change schema with confirmation matching
 */
export const passwordChangeSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
})

/**
 * Rule Set schema for component library rules
 */
export const ruleSetSchema = z.object({
  code: z.string()
    .min(1, 'Code is required')
    .regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase letters, numbers, hyphens, or underscores'),
  name: requiredString('Name'),
  description: z.string().optional().default(''),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
})

/**
 * Warehouse form schema
 * Note: String fields use .optional() (not .nullable()) for form compatibility
 */
export const warehouseSchema = z.object({
  code: z.string().max(20, 'Code must be 20 characters or less').optional().default(''),
  name: requiredString('Name').max(100, 'Name must be 100 characters or less'),
  address: z.string().max(500, 'Address is too long').optional().default(''),
  phone: z.string().max(20, 'Phone number is too long').optional().default(''),
  contact_person: z.string().max(100, 'Contact person name is too long').optional().default(''),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
  notes: z.string().max(2000, 'Notes are too long').optional().default(''),
})

/**
 * Component Standard specification item
 */
export const specificationItemSchema = z.object({
  key: z.string(),
  value: z.string(),
  type: z.enum(['text', 'number']),
})

/**
 * Component Standard schema for component library
 */
export const componentStandardSchema = z.object({
  code: requiredString('Code'),
  name: requiredString('Name'),
  standard: z.string().optional().default(''),
  category: requiredString('Category'),
  subcategory: z.string().optional().default(''),
  unit: requiredString('Unit'),
  is_active: z.boolean().default(true),
  specifications: z.array(specificationItemSchema).optional().default([]),
})

// ============================================
// Project & Payment Schemas
// ============================================

/**
 * Project form schema
 */
export const projectSchema = z.object({
  name: requiredString('Name'),
  contact_id: z.number({ required_error: 'Customer is required' }).positive('Please select a customer'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  location: z.string().optional().default(''),
  description: z.string().optional().default(''),
  start_date: requiredDate('Start date'),
  end_date: z.string().optional().default(''),
  contract_amount: z.number().min(0).default(0),
  budget_amount: z.number().min(0).default(0),
}).refine((data) => {
  if (!data.start_date || !data.end_date) return true
  return new Date(data.end_date) >= new Date(data.start_date)
}, {
  message: 'End date must be after or equal to start date',
  path: ['end_date'],
})

/**
 * Payment form schema
 */
export const paymentSchema = z.object({
  type: z.enum(['receive', 'send'], {
    errorMap: () => ({ message: 'Please select payment type' }),
  }),
  contact_id: z.number({ required_error: 'Please select a contact' }).positive('Please select a contact'),
  payment_date: requiredDate('Payment date'),
  amount: z.number({ required_error: 'Amount is required' }).positive('Amount must be greater than 0'),
  payment_method: z.string().default('transfer'),
  cash_account_id: z.number({ required_error: 'Cash account is required' }).positive('Please select a cash account'),
  reference: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  invoice_id: z.number().optional().nullable(),
  bill_id: z.number().optional().nullable(),
})

/**
 * BOM Template form schema
 * Note: default_output_unit removed - not supported by API
 */
export const bomTemplateSchema = z.object({
  code: z.string()
    .min(1, 'Code is required')
    .regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase letters, numbers, hyphens, or underscores'),
  name: requiredString('Name'),
  description: z.string().optional().default(''),
  category: requiredString('Category'),
  default_rule_set_id: z.number().optional().nullable(),
  is_active: z.boolean().default(true),
})

// ============================================
// Bill & BOM Schemas
// ============================================

/**
 * Bill item schema
 */
export const billItemSchema = z.object({
  description: requiredString('Description').max(500),
  quantity: quantitySchema.default(1),
  unit: z.string().max(20).default('pcs'),
  unit_price: unitPriceSchema.default(0),
  discount_percent: percentageSchema.default(0),
  tax_rate: percentageSchema.default(11),
})

/**
 * Bill form schema
 */
export const billSchema = z.object({
  contact_id: z.number({ required_error: 'Please select a vendor' }).positive('Please select a vendor'),
  vendor_invoice_number: z.string().max(100).optional().default(''),
  bill_date: requiredDate('Bill date'),
  due_date: requiredDate('Due date'),
  description: descriptionSchema,
  currency: z.string().default('IDR'),
  exchange_rate: z.number().min(0).default(1),
  items: z.array(billItemSchema).min(1, 'At least one item is required'),
}).refine((data) => {
  if (!data.bill_date || !data.due_date) return true
  return new Date(data.due_date) >= new Date(data.bill_date)
}, {
  message: 'Due date must be after or equal to bill date',
  path: ['due_date'],
})

// ============================================
// Delivery Order Schemas
// ============================================

/**
 * Delivery order item schema
 */
export const deliveryOrderItemSchema = z.object({
  product_id: z.number().optional().nullable(),
  description: requiredString('Description').max(255),
  quantity: quantitySchema.default(1),
  unit: z.string().max(20).default('pcs'),
  notes: z.string().max(255).optional().default(''),
})

/**
 * Delivery order form schema
 */
export const deliveryOrderSchema = z.object({
  contact_id: z.number({ required_error: 'Please select a customer' }).positive('Please select a customer'),
  invoice_id: z.number().optional().nullable(),
  warehouse_id: z.number().optional().nullable(),
  do_date: requiredDate('DO date'),
  shipping_address: z.string().max(500).optional().default(''),
  shipping_method: z.string().optional().default(''),
  notes: z.string().max(1000).optional().default(''),
  items: z.array(deliveryOrderItemSchema).min(1, 'At least one item is required'),
})

// ============================================
// Sales Return Schemas
// ============================================

/**
 * Sales return item schema
 */
export const salesReturnItemSchema = z.object({
  product_id: z.number().optional().nullable(),
  description: requiredString('Description').max(255),
  quantity: quantitySchema.default(1),
  unit: z.string().max(20).default('pcs'),
  unit_price: unitPriceSchema.default(0),
  condition: z.enum(['good', 'damaged', 'defective']).optional(),
  notes: z.string().max(255).optional().default(''),
})

/**
 * Sales return form schema
 */
export const salesReturnSchema = z.object({
  contact_id: z.number({ required_error: 'Please select a customer' }).positive('Please select a customer'),
  invoice_id: z.number().optional().nullable(),
  warehouse_id: z.number().optional().nullable(),
  return_date: requiredDate('Return date'),
  reason: z.string().optional().default(''),
  tax_rate: percentageSchema.default(11),
  notes: z.string().max(1000).optional().default(''),
  items: z.array(salesReturnItemSchema).min(1, 'At least one item is required'),
})

// ============================================
// Purchase Return Schemas
// ============================================

/**
 * Purchase return item schema
 */
export const purchaseReturnItemSchema = z.object({
  product_id: z.number().optional().nullable(),
  bill_item_id: z.number().optional().nullable(),
  description: requiredString('Description').max(255),
  quantity: quantitySchema.default(1),
  unit: z.string().max(20).default('pcs'),
  unit_price: unitPriceSchema.default(0),
  condition: z.enum(['good', 'damaged', 'defective']).optional(),
  notes: z.string().max(255).optional().default(''),
})

/**
 * Purchase return form schema
 */
export const purchaseReturnSchema = z.object({
  contact_id: z.number({ required_error: 'Please select a vendor' }).positive('Please select a vendor'),
  bill_id: z.number().optional().nullable(),
  warehouse_id: z.number().optional().nullable(),
  return_date: requiredDate('Return date'),
  reason: z.string().optional().default(''),
  tax_rate: percentageSchema.default(11),
  notes: z.string().max(1000).optional().default(''),
  items: z.array(purchaseReturnItemSchema).min(1, 'At least one item is required'),
})

// ============================================
// Purchase Order Schemas
// ============================================

/**
 * Purchase order item schema
 */
export const purchaseOrderItemSchema = z.object({
  product_id: z.number().optional().nullable(),
  description: z.string().default(''),
  quantity: quantitySchema.default(1),
  unit: z.string().default('pcs'),
  unit_price: z.number().default(0),
  discount_percent: z.number().min(0).max(100).default(0),
  tax_rate: z.number().min(0).max(100).default(11),
  notes: z.string().optional().default(''),
})

/**
 * Purchase order form schema
 */
export const purchaseOrderSchema = z.object({
  contact_id: z.number({ required_error: 'Please select a vendor' }).positive('Please select a vendor'),
  po_date: requiredDate('PO date'),
  expected_date: z.string().optional().default(''),
  reference: z.string().optional().default(''),
  subject: z.string().optional().default(''),
  currency: z.string().default('IDR'),
  exchange_rate: z.number().min(0).default(1),
  discount_type: z.enum(['percentage', 'fixed']).default('percentage'),
  discount_value: z.number().min(0).default(0),
  tax_rate: z.number().min(0).max(100).default(11),
  notes: z.string().optional().default(''),
  terms_conditions: z.string().optional().default(''),
  shipping_address: z.string().optional().default(''),
  items: z.array(purchaseOrderItemSchema).min(1, 'At least one item is required'),
})

/**
 * BOM item schema
 */
export const bomItemSchema = z.object({
  type: z.enum(['material', 'labor', 'overhead']).default('material'),
  product_id: z.number().optional().nullable(),
  description: z.string().default(''),
  quantity: quantitySchema.default(1),
  unit: z.string().default('unit'),
  unit_cost: z.number().default(0),
  waste_percentage: z.number().min(0).max(100).default(0),
  sort_order: z.number().default(0),
  notes: z.string().optional().default(''),
})

/**
 * BOM form schema
 */
export const bomSchema = z.object({
  name: requiredString('BOM Name'),
  product_id: z.number({ required_error: 'Please select an output product' }).positive('Please select an output product'),
  output_quantity: z.number().min(0.0001, 'Output quantity must be greater than 0').default(1),
  output_unit: z.string().default('unit'),
  description: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  items: z.array(bomItemSchema).min(1, 'At least one item is required'),
})

/**
 * Work Order form schema
 */
export const workOrderSchema = z.object({
  type: z.enum(['production', 'assembly', 'installation', 'maintenance']).default('production'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  name: requiredString('Name'),
  product_id: z.number().optional().nullable(),
  project_id: z.number().optional().nullable(),
  description: z.string().optional().default(''),
  quantity_ordered: z.number({ required_error: 'Quantity is required' }).int().min(1, 'Quantity must be at least 1'),
  planned_start_date: z.string().optional().default(''),
  planned_end_date: z.string().optional().default(''),
  estimated_material_cost: z.number().min(0).default(0),
  estimated_labor_cost: z.number().min(0).default(0),
  estimated_overhead_cost: z.number().min(0).default(0),
  notes: z.string().optional().default(''),
}).refine((data) => {
  if (!data.planned_start_date || !data.planned_end_date) return true
  return new Date(data.planned_end_date) >= new Date(data.planned_start_date)
}, {
  message: 'Planned end date must be after or equal to start date',
  path: ['planned_end_date'],
})

/**
 * Service item schema for company profiles
 */
export const serviceItemSchema = z.object({
  title: z.string().default(''),
  description: z.string().default(''),
  icon: z.string().default(''),
})

/**
 * Portfolio item schema for company profiles
 */
export const portfolioItemSchema = z.object({
  title: z.string().default(''),
  description: z.string().default(''),
  year: z.number().int().optional(),
})

/**
 * Certification item schema for company profiles
 */
export const certificationItemSchema = z.object({
  name: z.string().default(''),
  issuer: z.string().default(''),
  year: z.number().int().optional(),
})

/**
 * Company Profile form schema
 */
export const companyProfileSchema = z.object({
  name: requiredString('Company name'),
  slug: z.string().default(''),
  custom_domain: z.string().optional().default(''),
  tagline: z.string().optional().default(''),
  description: z.string().optional().default(''),
  founded_year: z.number().int().min(1900).max(2100).optional(),
  employees_count: z.string().optional().default(''),
  primary_color: z.string().default('#FF7A3D'),
  secondary_color: z.string().optional().default(''),
  services: z.array(serviceItemSchema).optional().default([]),
  portfolio: z.array(portfolioItemSchema).optional().default([]),
  certifications: z.array(certificationItemSchema).optional().default([]),
  email: z.string().email('Invalid email').or(z.literal('')).optional().default(''),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  website: z.string().url('Invalid URL').or(z.literal('')).optional().default(''),
  is_active: z.boolean().default(true),
})

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

// Settings & Profile
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>
export type RuleSetFormData = z.infer<typeof ruleSetSchema>
export type WarehouseFormData = z.infer<typeof warehouseSchema>
export type SpecificationItemData = z.infer<typeof specificationItemSchema>
export type ComponentStandardFormData = z.infer<typeof componentStandardSchema>

// Project & Payment
export type ProjectFormData = z.infer<typeof projectSchema>
export type PaymentFormData = z.infer<typeof paymentSchema>
export type BomTemplateFormData = z.infer<typeof bomTemplateSchema>

// Bill & BOM
export type BillItemFormData = z.infer<typeof billItemSchema>
export type BillFormData = z.infer<typeof billSchema>
export type BomItemFormData = z.infer<typeof bomItemSchema>
export type BomFormData = z.infer<typeof bomSchema>
export type WorkOrderFormData = z.infer<typeof workOrderSchema>

// Delivery Order
export type DeliveryOrderItemFormData = z.infer<typeof deliveryOrderItemSchema>
export type DeliveryOrderFormData = z.infer<typeof deliveryOrderSchema>

// Sales Return
export type SalesReturnItemFormData = z.infer<typeof salesReturnItemSchema>
export type SalesReturnFormData = z.infer<typeof salesReturnSchema>

// Purchase Return
export type PurchaseReturnItemFormData = z.infer<typeof purchaseReturnItemSchema>
export type PurchaseReturnFormData = z.infer<typeof purchaseReturnSchema>

// Purchase Order
export type PurchaseOrderItemFormData = z.infer<typeof purchaseOrderItemSchema>
export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>

// Company Profile
export type ServiceItemFormData = z.infer<typeof serviceItemSchema>
export type PortfolioItemFormData = z.infer<typeof portfolioItemSchema>
export type CertificationItemFormData = z.infer<typeof certificationItemSchema>
export type CompanyProfileFormData = z.infer<typeof companyProfileSchema>
export type ProductCategoryFormData = z.infer<typeof productCategorySchema>

// ============================================
// Project Cost & Revenue Schemas
// ============================================

/**
 * Project Cost form schema
 */
export const projectCostSchema = z.object({
  type: z.enum(['material', 'labor', 'subcontractor', 'equipment', 'overhead', 'other'], {
    errorMap: () => ({ message: 'Please select a cost type' }),
  }),
  description: requiredString('Description'),
  quantity: z.number().min(0, 'Quantity cannot be negative').optional().default(1),
  unit: z.string().optional().default(''),
  unit_cost: z.number({ required_error: 'Unit cost is required' }).min(0, 'Unit cost cannot be negative'),
  date: z.string().optional().default(''),
  reference: z.string().optional().default(''),
  notes: z.string().optional().default(''),
})

/**
 * Project Revenue form schema
 */
export const projectRevenueSchema = z.object({
  type: z.enum(['invoice', 'down_payment', 'milestone', 'other'], {
    errorMap: () => ({ message: 'Please select a revenue type' }),
  }),
  description: requiredString('Description'),
  amount: z.number({ required_error: 'Amount is required' }).positive('Amount must be greater than 0'),
  date: z.string().optional().default(''),
  reference: z.string().optional().default(''),
  notes: z.string().optional().default(''),
})

// Project Cost & Revenue types
export type ProjectCostFormData = z.infer<typeof projectCostSchema>
export type ProjectRevenueFormData = z.infer<typeof projectRevenueSchema>

// ============================================
// Manufacturing Schemas
// ============================================

/**
 * Material Requisition item schema
 */
export const materialRequisitionItemSchema = z.object({
  work_order_item_id: z.number().optional().nullable(),
  product_id: z.number().optional().nullable(),
  description: z.string().default(''),
  quantity_requested: z.number().min(1, 'Quantity must be at least 1').default(1),
  unit: z.string().default('unit'),
  notes: z.string().optional().default(''),
})

/**
 * Material Requisition form schema
 */
export const materialRequisitionSchema = z.object({
  work_order_id: z.number({ required_error: 'Please select a work order' }).positive('Please select a work order'),
  warehouse_id: z.number({ required_error: 'Please select a warehouse' }).positive('Please select a warehouse'),
  required_date: requiredDate('Required date'),
  notes: z.string().optional().default(''),
  items: z.array(materialRequisitionItemSchema).min(1, 'At least one item is required'),
})

/**
 * Subcontractor Work Order form schema
 */
export const subcontractorWorkOrderSchema = z.object({
  work_order_id: z.number().optional().nullable(),
  project_id: z.number().optional().nullable(),
  name: requiredString('Name'),
  description: z.string().optional().default(''),
  scope_of_work: requiredString('Scope of work'),
  agreed_amount: z.number({ required_error: 'Agreed amount is required' }).min(0, 'Amount cannot be negative'),
  retention_percent: z.number().min(0).max(100).default(0),
  scheduled_start_date: requiredDate('Scheduled start date'),
  scheduled_end_date: requiredDate('Scheduled end date'),
  work_location: z.string().optional().default(''),
  location_address: z.string().optional().default(''),
  notes: z.string().optional().default(''),
})

// Manufacturing types
export type MaterialRequisitionItemFormData = z.infer<typeof materialRequisitionItemSchema>
export type MaterialRequisitionFormData = z.infer<typeof materialRequisitionSchema>
export type SubcontractorWorkOrderFormData = z.infer<typeof subcontractorWorkOrderSchema>

// ============================================
// MRP Schemas
// ============================================

/**
 * MRP Run parameters schema
 */
export const mrpRunParametersSchema = z.object({
  include_safety_stock: z.boolean().optional().default(true),
  respect_moq: z.boolean().optional().default(true),
  respect_order_multiple: z.boolean().optional().default(true),
})

/**
 * MRP Run form schema
 */
export const mrpRunSchema = z.object({
  name: z.string().max(255).optional().default(''),
  planning_horizon_start: requiredDate('Start date'),
  planning_horizon_end: requiredDate('End date'),
  warehouse_id: z.number().optional().nullable(),
  notes: z.string().max(2000).optional().default(''),
  parameters: mrpRunParametersSchema.optional(),
}).refine((data) => {
  if (!data.planning_horizon_start || !data.planning_horizon_end) return true
  return new Date(data.planning_horizon_end) >= new Date(data.planning_horizon_start)
}, {
  message: 'End date must be after or equal to start date',
  path: ['planning_horizon_end'],
})

// MRP types
export type MrpRunParametersFormData = z.infer<typeof mrpRunParametersSchema>
export type MrpRunFormData = z.infer<typeof mrpRunSchema>

// ============================================
// Role Schema
// ============================================

/**
 * Role form schema
 */
export const roleSchema = z.object({
  name: requiredString('Name').max(50, 'Name must be 50 characters or less'),
  display_name: requiredString('Display name').max(100, 'Display name must be 100 characters or less'),
  description: z.string().max(500, 'Description is too long').optional().default(''),
})

export type RoleFormData = z.infer<typeof roleSchema>

// ============================================
// Down Payment Schema
// ============================================

/**
 * Down Payment form schema
 * Note: type and contact_id are immutable after creation (not in UpdateDownPaymentRequest)
 */
export const downPaymentSchema = z.object({
  type: z.enum(['receivable', 'payable'], {
    errorMap: () => ({ message: 'Please select a type' }),
  }),
  contact_id: z.number({ required_error: 'Please select a contact' }).positive('Please select a contact'),
  dp_date: requiredDate('Down payment date'),
  amount: z.number({ required_error: 'Amount is required' }).positive('Amount must be greater than 0'),
  payment_method: z.enum(['bank_transfer', 'cash', 'check', 'giro', 'credit_card'], {
    errorMap: () => ({ message: 'Please select a payment method' }),
  }),
  cash_account_id: z.number({ required_error: 'Please select a cash account' }).positive('Please select a cash account'),
  reference: z.string().optional().default(''),
  description: z.string().optional().default(''),
  notes: z.string().optional().default(''),
})

export type DownPaymentFormData = z.infer<typeof downPaymentSchema>

// ============================================
// Recurring Template Schema
// ============================================

export const recurringTemplateItemSchema = z.object({
  description: requiredString('Description'),
  quantity: z.number({ required_error: 'Quantity is required' }).positive('Quantity must be greater than 0'),
  unit: z.string().optional().default(''),
  unit_price: z.number({ required_error: 'Unit price is required' }).min(0, 'Price cannot be negative'),
  revenue_account_id: z.number().optional().nullable(),
  expense_account_id: z.number().optional().nullable(),
})

export const recurringTemplateSchema = z.object({
  name: requiredString('Name').max(255),
  type: z.enum(['invoice', 'bill'], {
    errorMap: () => ({ message: 'Please select a type' }),
  }),
  contact_id: z.number({ required_error: 'Please select a contact' }).positive('Please select a contact'),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'], {
    errorMap: () => ({ message: 'Please select a frequency' }),
  }),
  interval: z.number().int().positive().default(1),
  start_date: requiredDate('Start date'),
  end_date: z.string().optional().default(''),
  occurrences_limit: z.number().int().positive().optional().nullable(),
  description: z.string().optional().default(''),
  reference: z.string().optional().default(''),
  tax_rate: z.number().min(0).max(100).default(0),
  discount_amount: z.number().min(0).default(0),
  payment_term_days: z.number().int().min(0).default(30),
  currency: z.string().default('IDR'),
  is_active: z.boolean().default(true),
  auto_post: z.boolean().default(false),
  auto_send: z.boolean().default(false),
  items: z.array(recurringTemplateItemSchema).min(1, 'At least one line item is required'),
})

export type RecurringTemplateItemFormData = z.infer<typeof recurringTemplateItemSchema>
export type RecurringTemplateFormData = z.infer<typeof recurringTemplateSchema>

// ============================================
// Project Task Schemas
// ============================================

/**
 * Project Task form schema
 */
export const projectTaskSchema = z.object({
  title: requiredString('Title').max(255, 'Title must be at most 255 characters'),
  description: z.string().optional().default(''),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  assigned_to: z.number().optional().nullable(),
  start_date: z.string().optional().default(''),
  due_date: z.string().optional().default(''),
  estimated_hours: z.number().min(0, 'Estimated hours cannot be negative').optional().nullable(),
  notes: z.string().optional().default(''),
})

export type ProjectTaskFormData = z.infer<typeof projectTaskSchema>

