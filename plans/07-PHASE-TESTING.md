# Phase 7: Testing Infrastructure

## Overview

This phase establishes comprehensive testing infrastructure to ensure refactored code is reliable and maintainable. Good tests provide confidence to refactor and add features without breaking existing functionality.

**Prerequisites:** Phases 1-6 (at least partially completed)

**Deliverables:**
1. Test utilities and factories
2. Unit tests for services
3. Component tests for UI
4. Integration tests for workflows
5. E2E test setup (optional)

---

## 7.1 Test Setup

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/api/types.ts', // Generated file
        '**/*.d.ts',
        '**/index.ts',
      ],
    },
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
```

### Test Setup File

```typescript
// src/test/setup.ts
import { vi, beforeEach, afterEach } from 'vitest'
import { config } from '@vue/test-utils'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Vue Test Utils global config
config.global.stubs = {
  teleport: true,
}

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})
```

---

## 7.2 Test Utilities & Factories

### Data Factories

```typescript
// src/test/factories/index.ts
export * from './contactFactory'
export * from './productFactory'
export * from './quotationFactory'
export * from './invoiceFactory'
export * from './lineItemFactory'
```

```typescript
// src/test/factories/contactFactory.ts
import type { Contact } from '@/api/types'

let contactId = 1

export function createContact(overrides: Partial<Contact> = {}): Contact {
  const id = contactId++
  return {
    id,
    name: `Contact ${id}`,
    email: `contact${id}@example.com`,
    phone: '081234567890',
    address: '123 Test Street',
    type: 'customer',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

export function createContacts(count: number, overrides: Partial<Contact> = {}): Contact[] {
  return Array.from({ length: count }, () => createContact(overrides))
}

export function resetContactFactory(): void {
  contactId = 1
}
```

```typescript
// src/test/factories/productFactory.ts
import type { Product } from '@/api/types'

let productId = 1

export function createProduct(overrides: Partial<Product> = {}): Product {
  const id = productId++
  return {
    id,
    name: `Product ${id}`,
    sku: `SKU-${id.toString().padStart(4, '0')}`,
    description: `Description for product ${id}`,
    unit_price: 100000 + id * 10000,
    unit: 'pcs',
    category_id: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

export function createProducts(count: number, overrides: Partial<Product> = {}): Product[] {
  return Array.from({ length: count }, () => createProduct(overrides))
}

export function resetProductFactory(): void {
  productId = 1
}
```

```typescript
// src/test/factories/lineItemFactory.ts
import type { BaseLineItem } from '@/services/line-items'

let lineItemId = 1

export function createLineItem(overrides: Partial<BaseLineItem> = {}): BaseLineItem {
  const id = lineItemId++
  return {
    id,
    product_id: id,
    description: `Line item ${id}`,
    quantity: 1,
    unit_price: 100000,
    discount_type: null,
    discount_value: null,
    unit: 'pcs',
    notes: '',
    ...overrides,
  }
}

export function createLineItems(count: number, overrides: Partial<BaseLineItem> = {}): BaseLineItem[] {
  return Array.from({ length: count }, () => createLineItem(overrides))
}

export function resetLineItemFactory(): void {
  lineItemId = 1
}
```

```typescript
// src/test/factories/quotationFactory.ts
import type { Quotation } from '@/api/types'
import { createLineItems } from './lineItemFactory'
import { createContact } from './contactFactory'

let quotationId = 1

export function createQuotation(overrides: Partial<Quotation> = {}): Quotation {
  const id = quotationId++
  const contact = createContact()
  const items = createLineItems(3)

  return {
    id,
    number: `QUO-2024-${id.toString().padStart(4, '0')}`,
    contact_id: contact.id,
    contact,
    date: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    subtotal: 300000,
    tax: 33000,
    total: 333000,
    reference: '',
    notes: '',
    items,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

export function resetQuotationFactory(): void {
  quotationId = 1
}
```

### Mock API Utilities

```typescript
// src/test/mocks/api.ts
import { vi } from 'vitest'
import type { QueryClient } from '@tanstack/vue-query'

export function createMockQueryClient(): QueryClient {
  return {
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    prefetchQuery: vi.fn(),
    cancelQueries: vi.fn(),
    removeQueries: vi.fn(),
    clear: vi.fn(),
  } as unknown as QueryClient
}

export function mockApiSuccess<T>(data: T) {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  }
}

export function mockApiError(status: number, message: string, errors?: Record<string, string[]>) {
  return {
    response: {
      status,
      data: {
        message,
        errors,
      },
    },
  }
}

export function mockPaginatedResponse<T>(data: T[], page = 1, perPage = 10, total = 100) {
  return {
    data,
    meta: {
      current_page: page,
      last_page: Math.ceil(total / perPage),
      per_page: perPage,
      total,
    },
  }
}
```

### Component Test Utilities

```typescript
// src/test/utils/component.ts
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import type { Component } from 'vue'

interface MountOptions {
  props?: Record<string, any>
  slots?: Record<string, any>
  global?: Record<string, any>
  queryClient?: QueryClient
}

export function mountWithProviders<T extends Component>(
  component: T,
  options: MountOptions = {}
): VueWrapper {
  const pinia = createPinia()
  setActivePinia(pinia)

  const queryClient = options.queryClient ?? new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  return mount(component, {
    props: options.props,
    slots: options.slots,
    global: {
      plugins: [
        pinia,
        [VueQueryPlugin, { queryClient }],
      ],
      stubs: {
        teleport: true,
        ...options.global?.stubs,
      },
      ...options.global,
    },
  })
}

export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
```

---

## 7.3 Unit Tests for Services

### Calculation Service Tests

```typescript
// src/services/calculation/__tests__/CalculationService.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { CalculationService } from '../CalculationService'
import { PPNStrategy } from '../strategies/tax/PPNStrategy'
import { NoTaxStrategy } from '../strategies/tax/NoTaxStrategy'
import { InclusiveTaxStrategy } from '../strategies/tax/InclusiveTaxStrategy'

describe('CalculationService', () => {
  let service: CalculationService

  beforeEach(() => {
    service = new CalculationService()
  })

  describe('calculateLineItem', () => {
    it('calculates basic line item with PPN (11%)', () => {
      const result = service.calculateLineItem({
        quantity: 2,
        unit_price: 100000,
      })

      expect(result.gross).toBe(200000)
      expect(result.discount).toBe(0)
      expect(result.net).toBe(200000)
      expect(result.tax).toBe(22000)
      expect(result.total).toBe(222000)
    })

    it('calculates percent discount correctly', () => {
      const result = service.calculateLineItem({
        quantity: 1,
        unit_price: 100000,
        discount_type: 'percent',
        discount_value: 10,
      })

      expect(result.gross).toBe(100000)
      expect(result.discount).toBe(10000)
      expect(result.net).toBe(90000)
      expect(result.tax).toBe(9900) // 11% of 90000
      expect(result.total).toBe(99900)
    })

    it('calculates amount discount correctly', () => {
      const result = service.calculateLineItem({
        quantity: 1,
        unit_price: 100000,
        discount_type: 'amount',
        discount_value: 5000,
      })

      expect(result.discount).toBe(5000)
      expect(result.net).toBe(95000)
    })

    it('caps percent discount at 100%', () => {
      const result = service.calculateLineItem({
        quantity: 1,
        unit_price: 100000,
        discount_type: 'percent',
        discount_value: 150, // Over 100%
      })

      expect(result.discount).toBe(100000) // Capped at gross
      expect(result.net).toBe(0)
    })

    it('caps amount discount at gross amount', () => {
      const result = service.calculateLineItem({
        quantity: 1,
        unit_price: 100000,
        discount_type: 'amount',
        discount_value: 150000, // More than gross
      })

      expect(result.discount).toBe(100000) // Capped
      expect(result.net).toBe(0)
    })

    it('handles zero quantity', () => {
      const result = service.calculateLineItem({
        quantity: 0,
        unit_price: 100000,
      })

      expect(result.gross).toBe(0)
      expect(result.total).toBe(0)
    })

    it('handles zero price', () => {
      const result = service.calculateLineItem({
        quantity: 10,
        unit_price: 0,
      })

      expect(result.gross).toBe(0)
      expect(result.total).toBe(0)
    })
  })

  describe('with different tax strategies', () => {
    it('uses no tax strategy', () => {
      const noTaxService = new CalculationService({
        taxStrategy: new NoTaxStrategy(),
      })

      const result = noTaxService.calculateLineItem({
        quantity: 1,
        unit_price: 100000,
      })

      expect(result.tax).toBe(0)
      expect(result.total).toBe(100000)
    })

    it('handles inclusive tax correctly', () => {
      const inclusiveTaxService = new CalculationService({
        taxStrategy: new InclusiveTaxStrategy(0.11),
      })

      const result = inclusiveTaxService.calculateLineItem({
        quantity: 1,
        unit_price: 111000, // Price includes tax
      })

      expect(result.net).toBe(111000)
      expect(result.tax).toBeCloseTo(11000, -2)
      expect(result.total).toBe(111000) // Same as net for inclusive
    })
  })

  describe('calculateTotals', () => {
    it('calculates document totals correctly', () => {
      const items = [
        { quantity: 2, unit_price: 100000 },
        { quantity: 1, unit_price: 50000, discount_type: 'percent' as const, discount_value: 10 },
      ]

      const result = service.calculateTotals(items)

      expect(result.subtotal).toBe(245000) // 200000 + 45000
      expect(result.totalDiscount).toBe(5000)
      expect(result.tax).toBe(26950) // 11% of 245000
      expect(result.grandTotal).toBe(271950)
    })

    it('handles empty items array', () => {
      const result = service.calculateTotals([])

      expect(result.subtotal).toBe(0)
      expect(result.totalDiscount).toBe(0)
      expect(result.tax).toBe(0)
      expect(result.grandTotal).toBe(0)
    })
  })
})
```

### State Machine Tests

```typescript
// src/services/state-machine/__tests__/StateMachine.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StateMachine } from '../StateMachine'
import type { MachineConfig } from '../types'

interface TestContext {
  count: number
}

type TestEvent =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'RESET' }

const testMachineConfig: MachineConfig<TestContext, TestEvent> = {
  id: 'test',
  initial: 'idle',
  context: { count: 0 },
  states: {
    idle: {
      label: 'Idle',
      on: {
        INCREMENT: {
          target: 'active',
          actions: [(ctx) => { ctx.count++ }],
        },
      },
    },
    active: {
      label: 'Active',
      on: {
        INCREMENT: {
          target: 'active',
          actions: [(ctx) => { ctx.count++ }],
        },
        DECREMENT: {
          target: 'active',
          guard: (ctx) => ctx.count > 0,
          guardMessage: 'Count cannot go below 0',
          actions: [(ctx) => { ctx.count-- }],
        },
        RESET: 'idle',
      },
    },
  },
}

describe('StateMachine', () => {
  let machine: StateMachine<TestContext, TestEvent>

  beforeEach(() => {
    machine = new StateMachine(testMachineConfig)
  })

  it('initializes with correct state', () => {
    expect(machine.value).toBe('idle')
    expect(machine.context.count).toBe(0)
  })

  it('transitions to new state', async () => {
    const result = await machine.transition('INCREMENT')

    expect(result.success).toBe(true)
    expect(machine.value).toBe('active')
    expect(machine.context.count).toBe(1)
  })

  it('runs transition actions', async () => {
    await machine.transition('INCREMENT')
    await machine.transition('INCREMENT')
    await machine.transition('INCREMENT')

    expect(machine.context.count).toBe(3)
  })

  it('blocks transition when guard fails', async () => {
    // Go to active state
    await machine.transition('INCREMENT')

    // Try to decrement when count is 1
    await machine.transition('DECREMENT')
    expect(machine.context.count).toBe(0)

    // Now try to decrement when count is 0
    const result = await machine.transition('DECREMENT')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Count cannot go below 0')
    expect(machine.context.count).toBe(0) // Unchanged
  })

  it('returns error for invalid transition', async () => {
    const result = await machine.transition('DECREMENT') // Not valid from 'idle'

    expect(result.success).toBe(false)
    expect(result.error).toContain("No transition 'DECREMENT'")
  })

  it('reports available transitions', async () => {
    expect(machine.getAvailableTransitions()).toEqual(['INCREMENT'])

    await machine.transition('INCREMENT')

    expect(machine.getAvailableTransitions()).toEqual(['INCREMENT', 'DECREMENT', 'RESET'])
  })

  it('checks if transition is possible', async () => {
    expect(machine.canTransition('INCREMENT')).toBe(true)
    expect(machine.canTransition('DECREMENT')).toBe(false)

    await machine.transition('INCREMENT')

    expect(machine.canTransition('DECREMENT')).toBe(true)
  })
})
```

### Line Items Service Tests

```typescript
// src/services/line-items/__tests__/LineItemsService.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createLineItemsService } from '../LineItemsService'
import { createLineItem, createLineItems, resetLineItemFactory } from '@/test/factories'

describe('LineItemsService', () => {
  beforeEach(() => {
    resetLineItemFactory()
  })

  describe('initialization', () => {
    it('creates with empty items', () => {
      const service = createLineItemsService()

      expect(service.items.value).toHaveLength(0)
      expect(service.hasItems.value).toBe(false)
    })

    it('creates with initial items', () => {
      const items = createLineItems(3)
      const service = createLineItemsService(items)

      expect(service.items.value).toHaveLength(3)
      expect(service.hasItems.value).toBe(true)
    })

    it('creates with minimum items requirement', () => {
      const service = createLineItemsService([], { minItems: 1 })

      expect(service.items.value).toHaveLength(1)
      expect(service.canRemove.value).toBe(false)
    })
  })

  describe('add/remove operations', () => {
    it('adds item correctly', () => {
      const service = createLineItemsService()
      service.addItem({ quantity: 5, unit_price: 50000 })

      expect(service.items.value).toHaveLength(1)
      expect(service.items.value[0].quantity).toBe(5)
      expect(service.items.value[0].unit_price).toBe(50000)
    })

    it('removes item correctly', () => {
      const items = createLineItems(3)
      const service = createLineItemsService(items)

      service.removeItem(1)

      expect(service.items.value).toHaveLength(2)
      expect(service.items.value.map((i) => i.id)).toEqual([1, 3])
    })

    it('enforces maximum items', () => {
      const service = createLineItemsService([], { maxItems: 2 })

      service.addItem({ quantity: 1, unit_price: 100 })
      service.addItem({ quantity: 2, unit_price: 200 })
      service.addItem({ quantity: 3, unit_price: 300 })

      expect(service.items.value).toHaveLength(2)
      expect(service.canAdd.value).toBe(false)
    })

    it('duplicates item correctly', () => {
      const items = [createLineItem({ description: 'Original' })]
      const service = createLineItemsService(items)

      service.duplicateItem(0)

      expect(service.items.value).toHaveLength(2)
      expect(service.items.value[1].description).toBe('Original')
      expect(service.items.value[1].id).toBeUndefined() // ID cleared for duplicate
    })
  })

  describe('update operations', () => {
    it('updates item correctly', () => {
      const items = createLineItems(1)
      const service = createLineItemsService(items)

      service.updateItem(0, { quantity: 10, description: 'Updated' })

      expect(service.items.value[0].quantity).toBe(10)
      expect(service.items.value[0].description).toBe('Updated')
    })

    it('moves item correctly', () => {
      const items = createLineItems(3)
      const service = createLineItemsService(items)

      service.moveItem(2, 0)

      expect(service.items.value.map((i) => i.id)).toEqual([3, 1, 2])
    })
  })

  describe('validation', () => {
    it('validates items correctly', () => {
      const items = [
        createLineItem({ quantity: 0 }), // Invalid
        createLineItem({ unit_price: -50 }), // Invalid
        createLineItem({ quantity: 1, unit_price: 100 }), // Valid
      ]
      const service = createLineItemsService(items)

      const { valid, errors } = service.validate()

      expect(valid).toBe(false)
      expect(errors.get(0)).toContain('Quantity must be greater than 0')
      expect(errors.get(1)).toContain('Unit price cannot be negative')
      expect(errors.has(2)).toBe(false)
    })

    it('validates required product', () => {
      const items = [createLineItem({ product_id: null })]
      const service = createLineItemsService(items, { requireProduct: true })

      const { valid, errors } = service.validate()

      expect(valid).toBe(false)
      expect(errors.get(0)).toContain('Product is required')
    })
  })
})
```

---

## 7.4 Component Tests

### Button Component Test

```typescript
// src/components/ui/__tests__/Button.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '../Button.vue'

describe('Button', () => {
  it('renders default button', () => {
    const wrapper = mount(Button, {
      slots: { default: 'Click me' },
    })

    expect(wrapper.text()).toBe('Click me')
    expect(wrapper.classes()).toContain('bg-primary')
  })

  it('renders different variants', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'success', 'warning']

    variants.forEach((variant) => {
      const wrapper = mount(Button, {
        props: { variant },
        slots: { default: 'Button' },
      })

      expect(wrapper.exists()).toBe(true)
    })
  })

  it('renders different sizes', () => {
    const sizes = ['default', 'sm', 'lg', 'xs', 'icon', 'icon-sm']

    sizes.forEach((size) => {
      const wrapper = mount(Button, {
        props: { size },
        slots: { default: 'Button' },
      })

      expect(wrapper.exists()).toBe(true)
    })
  })

  it('emits click event', async () => {
    const wrapper = mount(Button, {
      slots: { default: 'Click me' },
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(Button, {
      props: { disabled: true },
      slots: { default: 'Click me' },
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('renders as link when as="a"', () => {
    const wrapper = mount(Button, {
      props: { as: 'a', href: '/test' },
      slots: { default: 'Link' },
    })

    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('/test')
  })
})
```

### LineItemsTable Component Test

```typescript
// src/components/document/__tests__/LineItemsTable.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import LineItemsTable from '../LineItemsTable.vue'
import { createLineItems, resetLineItemFactory } from '@/test/factories'

describe('LineItemsTable', () => {
  beforeEach(() => {
    resetLineItemFactory()
  })

  it('renders items correctly', () => {
    const items = createLineItems(3)
    const wrapper = mount(LineItemsTable, {
      props: { items },
    })

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(3)
  })

  it('shows empty state when no items', () => {
    const wrapper = mount(LineItemsTable, {
      props: { items: [] },
    })

    expect(wrapper.text()).toContain('No items added yet')
  })

  it('emits add event', async () => {
    const items = createLineItems(1)
    const wrapper = mount(LineItemsTable, {
      props: { items, canAdd: true },
    })

    const addButton = wrapper.find('button:contains("Add Item")')
    await addButton.trigger('click')

    expect(wrapper.emitted('add')).toHaveLength(1)
  })

  it('emits remove event', async () => {
    const items = createLineItems(2)
    const wrapper = mount(LineItemsTable, {
      props: { items, canRemove: true },
    })

    const removeButtons = wrapper.findAll('[data-testid="remove-button"]')
    await removeButtons[0].trigger('click')

    expect(wrapper.emitted('remove')).toHaveLength(1)
    expect(wrapper.emitted('remove')![0]).toEqual([0])
  })

  it('emits update event on input change', async () => {
    const items = createLineItems(1)
    const wrapper = mount(LineItemsTable, {
      props: { items },
    })

    const quantityInput = wrapper.find('input[type="number"]')
    await quantityInput.setValue(5)

    expect(wrapper.emitted('update')).toBeTruthy()
  })

  it('disables inputs when disabled prop is true', () => {
    const items = createLineItems(1)
    const wrapper = mount(LineItemsTable, {
      props: { items, disabled: true },
    })

    const inputs = wrapper.findAll('input')
    inputs.forEach((input) => {
      expect(input.attributes('disabled')).toBeDefined()
    })
  })

  it('shows discount column when showDiscount is true', () => {
    const items = createLineItems(1)
    const wrapper = mount(LineItemsTable, {
      props: { items, showDiscount: true },
    })

    expect(wrapper.text()).toContain('Discount')
  })

  it('hides discount column when showDiscount is false', () => {
    const items = createLineItems(1)
    const wrapper = mount(LineItemsTable, {
      props: { items, showDiscount: false },
    })

    expect(wrapper.text()).not.toContain('Discount')
  })
})
```

---

## 7.5 Integration Tests

### useDocumentForm Integration Test

```typescript
// src/composables/__tests__/useDocumentForm.integration.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useDocumentForm } from '../useDocumentForm'
import { z } from 'zod'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    params: { id: undefined },
  })),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: vi.fn(),
  })),
}))

// Mock toast
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
  }),
}))

describe('useDocumentForm integration', () => {
  const schema = z.object({
    name: z.string().min(1),
    amount: z.number().positive(),
  })

  const defaultValues = {
    name: '',
    amount: 0,
  }

  const mockCreate = vi.fn()
  const mockUpdate = vi.fn()

  const hooks = {
    useCreate: () => ({
      mutateAsync: mockCreate,
      isPending: ref(false),
    }),
    useUpdate: () => ({
      mutateAsync: mockUpdate,
      isPending: ref(false),
    }),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('detects create mode when no id in route', () => {
    const { isCreateMode, isEditMode } = useDocumentForm(
      {
        documentType: 'test',
        schema,
        defaultValues,
      },
      hooks
    )

    expect(isCreateMode.value).toBe(true)
    expect(isEditMode.value).toBe(false)
  })

  it('validates form before submit', async () => {
    const { submit, errors } = useDocumentForm(
      {
        documentType: 'test',
        schema,
        defaultValues,
      },
      hooks
    )

    await submit()

    expect(mockCreate).not.toHaveBeenCalled()
    expect(Object.keys(errors.value).length).toBeGreaterThan(0)
  })

  it('calls create mutation on valid submit in create mode', async () => {
    mockCreate.mockResolvedValue({ id: 1, name: 'Test', amount: 100 })

    const { form, submit } = useDocumentForm(
      {
        documentType: 'test',
        schema,
        defaultValues,
      },
      hooks
    )

    form.setValues({ name: 'Test', amount: 100 })
    await submit()

    expect(mockCreate).toHaveBeenCalledWith({ name: 'Test', amount: 100 })
  })
})
```

---

## 7.6 Test Coverage Goals

| Category | Target Coverage | Priority |
|----------|-----------------|----------|
| Services (calculation, line-items) | > 90% | High |
| State machines | > 90% | High |
| Composables | > 80% | High |
| UI Components | > 70% | Medium |
| Pages | > 50% | Low |

---

## 7.7 File Structure

```
src/test/
├── setup.ts                    # Global test setup
├── factories/
│   ├── index.ts
│   ├── contactFactory.ts
│   ├── productFactory.ts
│   ├── quotationFactory.ts
│   ├── invoiceFactory.ts
│   └── lineItemFactory.ts
├── mocks/
│   ├── api.ts                  # API mock utilities
│   └── router.ts               # Router mock
└── utils/
    ├── component.ts            # Component test utilities
    └── async.ts                # Async test utilities
```

---

## Checklist

- [ ] Vitest configuration
- [ ] Test setup file with mocks
- [ ] Data factories for all entities
- [ ] API mock utilities
- [ ] Component test utilities
- [ ] Calculation service tests (90%+ coverage)
- [ ] Line items service tests (90%+ coverage)
- [ ] State machine tests (90%+ coverage)
- [ ] Button component tests
- [ ] LineItemsTable component tests
- [ ] useDocumentForm integration tests
- [ ] CI/CD integration with coverage reports

---

## Next Phase

Once Phase 7 is complete, proceed to [Phase 8: Performance & Optimization](./08-PHASE-PERFORMANCE.md) for bundle optimization and performance improvements.
