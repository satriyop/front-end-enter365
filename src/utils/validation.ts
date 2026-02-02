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
  credit_limit: currencySchema.optional(),
  payment_term_days: z.number().int().min(0).max(365).optional(),
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
  purchase_price: unitPriceSchema.default(0),
  selling_price: unitPriceSchema.default(0),
  tax_rate: percentageSchema.default(11),
  is_taxable: z.boolean().default(true),
  is_active: z.boolean().default(true),
  track_inventory: z.boolean().default(true),
  min_stock: z.number().min(0, 'Minimum stock cannot be negative').default(0),
  category_id: z.number().optional().nullable(),
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
  description: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
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
  type: z.enum(['receive', 'pay'], {
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
 */
export const bomTemplateSchema = z.object({
  code: z.string()
    .min(1, 'Code is required')
    .regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase letters, numbers, hyphens, or underscores'),
  name: requiredString('Name'),
  description: z.string().optional().default(''),
  category: requiredString('Category'),
  default_output_unit: z.string().default('unit'),
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
  vendor_invoice_number: z.string().max(100).optional().nullable(),
  bill_date: requiredDate('Bill date'),
  due_date: requiredDate('Due date'),
  description: descriptionSchema,
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
// Purchase Order Schemas
// ============================================

/**
 * Purchase order item schema
 */
export const purchaseOrderItemSchema = z.object({
  product_id: z.number().optional().nullable(),
  description: z.string().default(''),
  quantity: z.number().default(1),
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
  quantity: z.number().default(1),
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

// Purchase Order
export type PurchaseOrderItemFormData = z.infer<typeof purchaseOrderItemSchema>
export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>

// Company Profile
export type ServiceItemFormData = z.infer<typeof serviceItemSchema>
export type PortfolioItemFormData = z.infer<typeof portfolioItemSchema>
export type CertificationItemFormData = z.infer<typeof certificationItemSchema>
export type CompanyProfileFormData = z.infer<typeof companyProfileSchema>

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
