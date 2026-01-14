# Testing

> Testing strategy for Enter365 Vue SPA

## Quick Reference

| Test Type | Tool | Purpose |
|-----------|------|---------|
| Unit | Vitest | Pure functions, composables |
| Component | Vue Test Utils + Vitest | Vue components |
| Integration | Vitest + MSW | API hooks with mocked backend |
| E2E | Playwright | Full user flows |

---

## Test Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | 2.1.8 | Test runner |
| @vue/test-utils | 2.4.6 | Vue component testing |
| jsdom | 25.0.1 | Browser environment |
| v8 | built-in | Coverage provider |

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run specific file
npm test -- src/components/ui/Button.test.ts

# Run tests matching pattern
npm test -- --grep "Button"
```

---

## Test Organization

```
src/
├── test/
│   ├── setup.ts              # Global test setup
│   └── utils.ts              # Test utilities
├── components/
│   └── ui/
│       ├── Button.vue
│       └── Button.test.ts    # Co-located test
├── composables/
│   ├── useFormat.ts
│   └── useFormat.test.ts     # Co-located test
└── api/
    ├── useContacts.ts
    └── useContacts.test.ts   # Co-located test
```

### File Naming

| Pattern | Use For |
|---------|---------|
| `*.test.ts` | All test files |
| `*.spec.ts` | Alternative (also supported) |

---

## Test Utilities

### renderWithProviders

Render components with all common providers (Pinia, Router, Vue Query):

```typescript
import { renderWithProviders } from '@/test/utils'
import MyComponent from './MyComponent.vue'

it('renders correctly', () => {
  const { wrapper, getByTestId } = renderWithProviders(MyComponent, {
    props: { title: 'Hello' },
    initialRoute: '/dashboard',
  })

  expect(getByTestId('title')).toHaveText('Hello')
})
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `props` | `Record<string, unknown>` | `{}` | Component props |
| `slots` | `Record<string, unknown>` | `{}` | Component slots |
| `initialRoute` | `string` | `'/'` | Initial route path |
| `routes` | `RouteRecordRaw[]` | minimal | Custom routes |
| `pinia` | `Pinia` | new | Pre-configured Pinia |
| `queryClient` | `QueryClient` | new | Pre-configured QueryClient |
| `plugins` | `Plugin[]` | `[]` | Additional Vue plugins |

### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `wrapper` | `VueWrapper` | Vue Test Utils wrapper |
| `router` | `Router` | Vue Router instance |
| `pinia` | `Pinia` | Pinia instance |
| `queryClient` | `QueryClient` | TanStack Query client |
| `getByTestId` | `(id: string) => DOMWrapper` | Find element by test ID |
| `getAllByTestId` | `(id: string) => DOMWrapper[]` | Find all by test ID |
| `queryByTestId` | `(id: string) => DOMWrapper \| null` | Find or null |
| `unmount` | `() => void` | Unmount component |

---

## Global Mocks

The test setup (`src/test/setup.ts`) provides global mocks:

| Mock | Why |
|------|-----|
| `window.matchMedia` | Responsive components |
| `IntersectionObserver` | Lazy loading, infinite scroll |
| `ResizeObserver` | Resize-aware components |
| `RouterLink` | Stubbed for unit tests |
| `RouterView` | Stubbed for unit tests |

---

## Configuration

### vitest.config.ts

```typescript
export default defineConfig({
  test: {
    globals: true,           // Use global it, expect, describe
    environment: 'jsdom',    // Browser environment
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,vue}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    pool: 'forks',           // Faster parallel execution
    clearMocks: true,        // Clear mocks between tests
    restoreMocks: true,      // Restore mocks after tests
  }
})
```

---

## Coverage

### Run Coverage

```bash
npm run test:coverage
```

### Coverage Reports

| Report | Location | Purpose |
|--------|----------|---------|
| Text | Console | Quick overview |
| JSON | `coverage/coverage-final.json` | CI integration |
| HTML | `coverage/index.html` | Detailed browser view |

### Excluded from Coverage

```typescript
exclude: [
  'node_modules/',
  'src/test/',
  'src/mocks/',
  '**/*.d.ts',
]
```

---

## Testing Pyramid

```
            E2E Tests
           (Playwright)
          ┌──────────┐
         │  Critical  │
         │   Flows    │
        └──────────────┘

       Integration Tests
      (Vue Query + MSW)
     ┌────────────────────┐
    │  API Hooks + Data   │
    │    Transformations  │
   └──────────────────────┘

      Component Tests
     (Vue Test Utils)
    ┌──────────────────────┐
   │   Vue Components       │
   │   User Interactions    │
  └────────────────────────┘

        Unit Tests
         (Vitest)
       ┌────────────────────┐
      │  Pure Functions      │
      │  Composables         │
      │  Utils               │
     └──────────────────────┘
```

---

## Related Documentation

- [UNIT-TESTS.md](UNIT-TESTS.md) - Unit testing patterns
- [COMPONENT-TESTS.md](COMPONENT-TESTS.md) - Component testing patterns
- [E2E-TESTS.md](E2E-TESTS.md) - End-to-end testing patterns
