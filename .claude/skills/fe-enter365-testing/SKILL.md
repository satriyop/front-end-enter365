# Enter365 Testing

## Overview

Testing infrastructure using Vitest and Vue Test Utils with factories and mocks.

Location: `src/test/`

## Test Stack

| Tool | Purpose |
|------|---------|
| Vitest | Test runner |
| Vue Test Utils | Component testing |
| @testing-library/vue | User-centric testing |
| msw | API mocking (optional) |

## Test Structure

```
src/
├── test/
│   ├── factories/          # Test data factories (5 factories)
│   │   ├── index.ts        # Master exports + resetAllFactories()
│   │   ├── contactFactory.ts
│   │   ├── productFactory.ts
│   │   ├── lineItemFactory.ts
│   │   ├── quotationFactory.ts
│   │   └── invoiceFactory.ts
│   └── mocks/
│       ├── index.ts
│       └── api.ts          # API mock utilities
│
└── {module}/
    └── __tests__/
        └── {Module}.test.ts
```

## Test Factories

### Available Factories

| Factory | Creates | Variants |
|---------|---------|----------|
| `contactFactory` | Contact, Customer, Vendor | `createContact`, `createContacts`, `createCustomer`, `createVendor` |
| `productFactory` | Product | `createProduct`, `createProducts` |
| `lineItemFactory` | LineItem | `createLineItem`, `createLineItems` |
| `quotationFactory` | Quotation | `createQuotation`, `createQuotations`, `createDraftQuotation`, `createSubmittedQuotation`, `createApprovedQuotation`, `createExpiredQuotation` |
| `invoiceFactory` | Invoice | `createInvoice`, `createInvoices`, `createDraftInvoice`, `createSentInvoice`, `createPartiallyPaidInvoice`, `createPaidInvoice`, `createOverdueInvoice` |

### Usage
```typescript
import {
  createContact,
  createCustomer,
  createVendor,
  createProduct,
  createLineItem,
  createLineItems,
  createQuotation,
  createDraftQuotation,
  createSubmittedQuotation,
  createApprovedQuotation,
  createExpiredQuotation,
  createInvoice,
  createDraftInvoice,
  createSentInvoice,
  createPartiallyPaidInvoice,
  createPaidInvoice,
  createOverdueInvoice,
  resetAllFactories,
} from '@/test/factories'

// Create single item
const contact = createContact()
const customer = createCustomer()
const product = createProduct({ price: 50000 })

// Create multiple items
const lineItems = createLineItems(3)

// Create with overrides
const quotation = createQuotation({
  status: 'approved',
  contact: createCustomer(),
  items: createLineItems(5),
})

// Status-specific shortcuts
const draft = createDraftQuotation()
const submitted = createSubmittedQuotation()
const approved = createApprovedQuotation()
const expired = createExpiredQuotation()

// Invoice variants
const draftInvoice = createDraftInvoice()
const sentInvoice = createSentInvoice()
const partiallyPaid = createPartiallyPaidInvoice()
const paidInvoice = createPaidInvoice()
const overdueInvoice = createOverdueInvoice()

// Reset IDs between tests
beforeEach(() => {
  resetAllFactories()
})
```

### Factory Pattern
```typescript
// src/test/factories/contactFactory.ts
let contactIdCounter = 1

export function resetContactFactory() {
  contactIdCounter = 1
}

export function createContact(overrides: Partial<Contact> = {}): Contact {
  const id = contactIdCounter++
  return {
    id,
    name: `Contact ${id}`,
    email: `contact${id}@example.com`,
    phone: `08123456${String(id).padStart(4, '0')}`,
    type: 'customer',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

export function createCustomer(overrides: Partial<Contact> = {}): Contact {
  return createContact({ type: 'customer', ...overrides })
}

export function createVendor(overrides: Partial<Contact> = {}): Contact {
  return createContact({ type: 'vendor', ...overrides })
}

export function createContacts(count: number, overrides: Partial<Contact> = {}): Contact[] {
  return Array.from({ length: count }, () => createContact(overrides))
}
```

### Exported Types
```typescript
// Quotation types
import type { Quotation, LabelValue, QuotationStatus } from '@/test/factories'

// Invoice types
import type { Invoice, InvoiceStatus } from '@/test/factories'
```

### Creating a New Factory
```typescript
// src/test/factories/myEntityFactory.ts
let idCounter = 1

export function resetMyEntityFactory() {
  idCounter = 1
}

export function createMyEntity(overrides: Partial<MyEntity> = {}): MyEntity {
  const id = idCounter++
  return {
    id,
    name: `Entity ${id}`,
    ...overrides,
  }
}

// Add to index.ts
export { createMyEntity, resetMyEntityFactory } from './myEntityFactory'

// Update resetAllFactories()
export function resetAllFactories() {
  resetContactFactory()
  resetProductFactory()
  resetLineItemFactory()
  resetQuotationFactory()
  resetInvoiceFactory()
  resetMyEntityFactory()  // Add here
}
```

## API Mocks

### Mock Utilities
```typescript
import {
  mockPaginatedResponse,
  mockValidationError,
  createMockQuery,
  createMockMutation,
} from '@/test/mocks'

// Mock paginated response
const response = mockPaginatedResponse(createLineItems(10), {
  currentPage: 1,
  perPage: 15,
  total: 50,
})

// Mock validation error
const error = mockValidationError({
  email: ['Email is required', 'Email format invalid'],
  password: ['Password too short'],
})

// Mock TanStack Query
const mockQuery = createMockQuery<Contact[]>({
  data: [createCustomer(), createCustomer()],
  isLoading: false,
})

const mockMutation = createMockMutation<Contact>({
  mutateAsync: vi.fn().mockResolvedValue(createCustomer()),
})
```

## Component Testing

### Basic Component Test
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from '../MyComponent.vue'

describe('MyComponent', () => {
  beforeEach(() => {
    resetAllFactories()
  })

  it('renders correctly', () => {
    const wrapper = mount(MyComponent, {
      props: {
        title: 'Test Title',
      },
    })

    expect(wrapper.text()).toContain('Test Title')
  })

  it('emits event on button click', async () => {
    const wrapper = mount(MyComponent)

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('submit')).toHaveLength(1)
  })
})
```

### Testing with Slots
```typescript
it('renders slot content', () => {
  const wrapper = mount(Card, {
    slots: {
      default: '<p>Card content</p>',
      header: '<h2>Card title</h2>',
    },
  })

  expect(wrapper.html()).toContain('Card content')
  expect(wrapper.html()).toContain('Card title')
})
```

### Testing with Provide/Inject
```typescript
it('uses injected values', () => {
  const wrapper = mount(MyComponent, {
    global: {
      provide: {
        someKey: 'someValue',
      },
    },
  })
})
```

### Testing with data-testid
```typescript
// Components use data-testid for reliable E2E selectors
it('finds elements by testid', () => {
  const wrapper = mount(MyComponent)

  expect(wrapper.find('[data-testid="submit-btn"]').exists()).toBe(true)
  expect(wrapper.find('[data-testid="total-amount"]').text()).toContain('1,000')
})
```

## Service Testing

### Testing Services
```typescript
import { describe, it, expect } from 'vitest'
import { CalculationService } from '../CalculationService'
import { PPNStrategy, PercentDiscountStrategy, StandardRoundingStrategy } from '../strategies'

describe('CalculationService', () => {
  const service = new CalculationService({
    taxStrategy: new PPNStrategy(),
    discountStrategy: new PercentDiscountStrategy(),
    roundingStrategy: new StandardRoundingStrategy(),
  })

  it('calculates line item correctly', () => {
    const result = service.calculateLineItem({
      quantity: 10,
      unitPrice: 100000,
      discountPercent: 10,
    })

    expect(result.gross).toBe(1000000)
    expect(result.discount).toBe(100000)
    expect(result.net).toBe(900000)
    expect(result.tax).toBe(99000)  // 11% of net
    expect(result.total).toBe(999000)
  })
})
```

### Testing Strategies
```typescript
describe('PPNStrategy', () => {
  const strategy = new PPNStrategy()

  it('calculates 11% tax', () => {
    expect(strategy.calculate(1000000)).toBe(110000)
  })

  it('returns correct rate', () => {
    expect(strategy.getRate()).toBe(0.11)
  })
})
```

## Composable Testing

```typescript
import { describe, it, expect, vi } from 'vitest'
import { useLineItems } from '../useLineItems'
import { createLineItem, resetLineItemFactory } from '@/test/factories'

describe('useLineItems', () => {
  beforeEach(() => {
    resetLineItemFactory()
  })

  it('adds item correctly', () => {
    const { items, addItem } = useLineItems({
      initialItems: [],
    })

    addItem({ description: 'New Item', quantity: 1, unit_price: 100000 })

    expect(items.value).toHaveLength(1)
    expect(items.value[0].description).toBe('New Item')
  })

  it('calculates totals', () => {
    const { totals } = useLineItems({
      initialItems: [
        createLineItem({ quantity: 2, unit_price: 50000 }),
      ],
    })

    expect(totals.value.subtotal).toBe(100000)
  })

  it('calls onChange callback', () => {
    const onChange = vi.fn()
    const { addItem } = useLineItems({
      initialItems: [],
      onItemsChange: onChange,
    })

    addItem()

    expect(onChange).toHaveBeenCalled()
  })
})
```

## State Machine Testing

```typescript
describe('quotationMachine', () => {
  it('transitions from draft to pending', () => {
    const machine = createQuotationMachine({ documentId: 1, userId: 1 })

    expect(machine.currentState).toBe('draft')
    machine.send('SUBMIT')
    expect(machine.currentState).toBe('pending')
  })

  it('blocks invalid transitions', () => {
    const machine = createQuotationMachine({ documentId: 1, userId: 1 })

    expect(machine.can('APPROVE')).toBe(false)  // Can't approve from draft
  })
})
```

## Test Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run specific test file
npm run test -- src/services/calculation/__tests__/CalculationService.test.ts

# Run tests with coverage
npm run test -- --coverage

# Run tests matching pattern
npm run test -- --grep "calculates"
```

## Test Conventions

### File Naming
- Test files: `{ComponentName}.test.ts`
- Location: `__tests__/` folder in same directory as source

### Test Structure
```typescript
describe('ComponentName', () => {
  describe('feature group', () => {
    it('should do specific thing', () => {
      // Arrange
      const input = createTestData()

      // Act
      const result = doSomething(input)

      // Assert
      expect(result).toBe(expected)
    })
  })
})
```

### Best Practices

1. **Reset State**: Always reset factories and mocks in `beforeEach`
2. **Descriptive Names**: Use clear test descriptions
3. **One Assertion Focus**: Each test should verify one behavior
4. **Arrange-Act-Assert**: Follow AAA pattern
5. **No Implementation Details**: Test behavior, not implementation
6. **Mock External Dependencies**: API calls, timers, etc.
7. **Use Factories**: Never hardcode test data
8. **data-testid**: Use for E2E-reliable element selection
