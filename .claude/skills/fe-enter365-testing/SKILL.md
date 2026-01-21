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
│   ├── factories/          # Test data factories
│   │   ├── index.ts
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
  createInvoice,
  resetFactories,
} from '@/test/factories'

// Create single item
const contact = createContact()
const customer = createCustomer()  // contact with type: 'customer'
const product = createProduct({ price: 50000 })

// Create multiple items
const lineItems = createLineItems(3)  // 3 line items with auto-incrementing IDs

// Create with overrides
const quotation = createQuotation({
  status: 'approved',
  contact: createCustomer(),
  items: createLineItems(5),
})

// Reset IDs between tests
beforeEach(() => {
  resetFactories()
})
```

### Factory Pattern
```typescript
// src/test/factories/contactFactory.ts
import type { Contact } from '@/types'

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
```

### Creating a New Factory
```typescript
// src/test/factories/myEntityFactory.ts
import type { MyEntity } from '@/types'

let idCounter = 1

export function resetMyEntityFactory() {
  idCounter = 1
}

export function createMyEntity(overrides: Partial<MyEntity> = {}): MyEntity {
  const id = idCounter++
  return {
    id,
    name: `Entity ${id}`,
    // ... default values
    ...overrides,
  }
}

// Export from index.ts
export { createMyEntity, resetMyEntityFactory } from './myEntityFactory'
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
    // Reset state if needed
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

  // assertions
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

### Testing Composables
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
