# Unit Tests

> Testing pure functions, composables, and utilities with Vitest

## Quick Reference

| What to Test | Example |
|--------------|---------|
| Pure functions | `formatCurrency(1500000)` |
| Composables | `useSolarCalculator()` |
| Utility functions | `calculatePayback()` |
| Validators | `validateEmail()` |

---

## Basic Structure

```typescript
import { describe, it, expect } from 'vitest'
import { formatCurrency } from '@/utils/format'

describe('formatCurrency', () => {
  it('formats number as IDR', () => {
    expect(formatCurrency(1500000)).toBe('Rp 1.500.000')
  })

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('Rp 0')
  })

  it('handles negative numbers', () => {
    expect(formatCurrency(-500000)).toBe('-Rp 500.000')
  })
})
```

---

## Testing Composables

### Reactive Composables

```typescript
import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useSolarCalculator } from '@/composables/useSolarCalculator'

describe('useSolarCalculator', () => {
  it('calculates annual production', () => {
    const { annualProduction, setSystemCapacity, setPeakSunHours } = useSolarCalculator()

    setSystemCapacity(5.5)  // 5.5 kWp
    setPeakSunHours(4.5)    // 4.5 hours/day

    // 5.5 * 4.5 * 365 * 0.8 (performance ratio) = 7,227 kWh
    expect(annualProduction.value).toBeCloseTo(7227, 0)
  })

  it('updates when inputs change', () => {
    const { annualProduction, setSystemCapacity } = useSolarCalculator()

    setSystemCapacity(3.3)
    const initial = annualProduction.value

    setSystemCapacity(5.5)
    expect(annualProduction.value).toBeGreaterThan(initial)
  })
})
```

### Composables with Refs

```typescript
import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import { useDebounce } from '@/composables/useDebounce'

describe('useDebounce', () => {
  it('debounces value changes', async () => {
    vi.useFakeTimers()

    const source = ref('initial')
    const debounced = useDebounce(source, 300)

    expect(debounced.value).toBe('initial')

    source.value = 'changed'
    expect(debounced.value).toBe('initial') // Not changed yet

    vi.advanceTimersByTime(300)
    await nextTick()

    expect(debounced.value).toBe('changed')

    vi.useRealTimers()
  })
})
```

---

## Testing Async Functions

```typescript
import { describe, it, expect, vi } from 'vitest'
import { fetchSolarData } from '@/api/solarData'

describe('fetchSolarData', () => {
  it('fetches data for location', async () => {
    const mockResponse = {
      peak_sun_hours: 4.5,
      irradiance: 1000,
    }

    vi.mock('@/api/client', () => ({
      api: {
        get: vi.fn().mockResolvedValue({ data: mockResponse })
      }
    }))

    const data = await fetchSolarData(-6.2, 106.8)

    expect(data.peak_sun_hours).toBe(4.5)
    expect(data.irradiance).toBe(1000)
  })

  it('handles errors', async () => {
    vi.mock('@/api/client', () => ({
      api: {
        get: vi.fn().mockRejectedValue(new Error('Network error'))
      }
    }))

    await expect(fetchSolarData(-6.2, 106.8)).rejects.toThrow('Network error')
  })
})
```

---

## Test Factories

Create reusable test data:

```typescript
// src/test/factories/contact.ts
import { createFactory } from '@/test/utils'
import type { Contact } from '@/api/types'

export const createContact = createFactory<Contact>({
  id: 1,
  name: 'PT Test Company',
  email: 'test@company.com',
  phone: '08123456789',
  type: 'customer',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
})

// Usage in tests
it('displays contact name', () => {
  const contact = createContact({ name: 'PT Custom Name' })
  // ... test with contact
})
```

### Factory Patterns

```typescript
// Create multiple
const contacts = [
  createContact({ id: 1, name: 'Contact 1' }),
  createContact({ id: 2, name: 'Contact 2' }),
  createContact({ id: 3, name: 'Contact 3' }),
]

// Create with nested data
export const createQuotation = createFactory<Quotation>({
  id: 1,
  quotation_number: 'Q-2024-001',
  contact: createContact(),
  items: [],
  // ...
})
```

---

## Mocking

### Mock Functions

```typescript
import { vi } from 'vitest'

const mockFn = vi.fn()

// Return value
mockFn.mockReturnValue(42)

// Return value once
mockFn.mockReturnValueOnce(1).mockReturnValueOnce(2)

// Resolved promise
mockFn.mockResolvedValue({ success: true })

// Implementation
mockFn.mockImplementation((x) => x * 2)
```

### Mock Modules

```typescript
// Mock entire module
vi.mock('@/utils/format', () => ({
  formatCurrency: vi.fn((n) => `Rp ${n}`),
}))

// Partial mock
vi.mock('@/utils/format', async () => {
  const actual = await vi.importActual('@/utils/format')
  return {
    ...actual,
    formatCurrency: vi.fn((n) => `Rp ${n}`),
  }
})
```

### Mock Timers

```typescript
it('debounces input', async () => {
  vi.useFakeTimers()

  const callback = vi.fn()
  setupDebounce(callback, 500)

  trigger()
  expect(callback).not.toHaveBeenCalled()

  vi.advanceTimersByTime(500)
  expect(callback).toHaveBeenCalledOnce()

  vi.useRealTimers()
})
```

---

## Assertions

### Common Matchers

```typescript
// Equality
expect(value).toBe(42)
expect(obj).toEqual({ a: 1 })
expect(obj).toStrictEqual({ a: 1 })

// Truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()
expect(value).toBeUndefined()

// Numbers
expect(num).toBeGreaterThan(10)
expect(num).toBeLessThan(100)
expect(num).toBeCloseTo(0.3, 5)

// Strings
expect(str).toContain('hello')
expect(str).toMatch(/pattern/)

// Arrays
expect(arr).toContain(item)
expect(arr).toHaveLength(3)

// Objects
expect(obj).toHaveProperty('key')
expect(obj).toHaveProperty('nested.key', value)

// Functions
expect(fn).toHaveBeenCalled()
expect(fn).toHaveBeenCalledWith(arg1, arg2)
expect(fn).toHaveBeenCalledTimes(3)

// Promises
await expect(promise).resolves.toBe(value)
await expect(promise).rejects.toThrow('error')
```

---

## Best Practices

### Do

```typescript
// Test one thing per test
it('calculates payback period correctly', () => {
  const payback = calculatePayback(72000000, 10000000)
  expect(payback).toBeCloseTo(7.2, 1)
})

// Use descriptive test names
it('returns zero when investment is zero', () => {
  // ...
})

// Arrange-Act-Assert pattern
it('formats currency', () => {
  // Arrange
  const amount = 1500000

  // Act
  const result = formatCurrency(amount)

  // Assert
  expect(result).toBe('Rp 1.500.000')
})
```

### Don't

```typescript
// Don't test implementation details
// BAD: Testing internal state
expect(calculator._internalCache).toEqual({...})

// GOOD: Test public behavior
expect(calculator.getResult()).toBe(42)

// Don't write tests that always pass
// BAD:
it('works', () => {
  expect(true).toBe(true)
})

// Don't use random data without seeding
// BAD:
const value = Math.random()

// GOOD: Use deterministic test data
const value = 0.5
```

---

## Related Documentation

- [README.md](README.md) - Testing overview
- [COMPONENT-TESTS.md](COMPONENT-TESTS.md) - Component testing
- [../api/HOOKS-PATTERN.md](../api/HOOKS-PATTERN.md) - Testing API hooks
