# Component Tests

> Testing Vue components with Vue Test Utils and Vitest

## Quick Reference

| Test Type | Use Case |
|-----------|----------|
| Shallow mount | Unit test component in isolation |
| Full mount | Test with child components |
| With providers | Test with Pinia, Router, Vue Query |

---

## Basic Component Test

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '@/components/ui/Button.vue'

describe('Button', () => {
  it('renders slot content', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click me',
      },
    })

    expect(wrapper.text()).toContain('Click me')
  })

  it('emits click event', async () => {
    const wrapper = mount(Button)

    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('applies variant class', () => {
    const wrapper = mount(Button, {
      props: { variant: 'destructive' },
    })

    expect(wrapper.classes()).toContain('bg-destructive')
  })

  it('disables button when disabled prop is true', () => {
    const wrapper = mount(Button, {
      props: { disabled: true },
    })

    expect(wrapper.attributes('disabled')).toBeDefined()
  })
})
```

---

## Testing with Providers

Use `renderWithProviders` for components that need Pinia, Router, or Vue Query:

```typescript
import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '@/test/utils'
import ContactList from '@/components/ContactList.vue'

describe('ContactList', () => {
  it('renders contact list', async () => {
    const { wrapper, getByTestId } = renderWithProviders(ContactList, {
      props: {
        contacts: [
          { id: 1, name: 'PT Test Company' },
          { id: 2, name: 'CV Another Company' },
        ],
      },
    })

    expect(wrapper.findAll('[data-testid="contact-row"]')).toHaveLength(2)
  })

  it('navigates to contact detail on click', async () => {
    const { wrapper, router } = renderWithProviders(ContactList, {
      props: {
        contacts: [{ id: 1, name: 'PT Test Company' }],
      },
      routes: [
        { path: '/', component: ContactList },
        { path: '/contacts/:id', component: { template: '<div>Detail</div>' } },
      ],
    })

    await wrapper.find('[data-testid="contact-row"]').trigger('click')

    expect(router.currentRoute.value.path).toBe('/contacts/1')
  })
})
```

---

## Testing User Interactions

### Click Events

```typescript
it('opens modal on button click', async () => {
  const { wrapper, getByTestId } = renderWithProviders(MyComponent)

  expect(wrapper.find('[data-testid="modal"]').exists()).toBe(false)

  await wrapper.find('[data-testid="open-modal-btn"]').trigger('click')

  expect(wrapper.find('[data-testid="modal"]').exists()).toBe(true)
})
```

### Form Input

```typescript
it('updates model on input', async () => {
  const wrapper = mount(SearchInput)

  const input = wrapper.find('input')
  await input.setValue('search term')

  expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['search term'])
})
```

### Select Change

```typescript
it('filters by status', async () => {
  const { wrapper } = renderWithProviders(ContactFilter)

  const select = wrapper.find('[data-testid="status-filter"]')
  await select.setValue('active')

  expect(wrapper.emitted('filter-change')?.[0]).toEqual([{ status: 'active' }])
})
```

### Keyboard Events

```typescript
it('submits on Enter key', async () => {
  const wrapper = mount(SearchInput)

  await wrapper.find('input').trigger('keydown.enter')

  expect(wrapper.emitted('submit')).toBeTruthy()
})
```

---

## Testing Async Operations

### Wait for Loading

```typescript
import { flushPromises } from '@/test/utils'

it('shows loading then data', async () => {
  const { wrapper } = renderWithProviders(DataTable)

  // Initially loading
  expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true)

  // Wait for async operations
  await flushPromises()

  // Loading complete
  expect(wrapper.find('[data-testid="loading"]').exists()).toBe(false)
  expect(wrapper.find('[data-testid="data-row"]').exists()).toBe(true)
})
```

### Mocking API Calls

```typescript
import { vi } from 'vitest'
import * as contactsApi from '@/api/useContacts'

it('displays fetched contacts', async () => {
  vi.spyOn(contactsApi, 'useContacts').mockReturnValue({
    data: ref([{ id: 1, name: 'Test Contact' }]),
    isLoading: ref(false),
    error: ref(null),
  })

  const { wrapper } = renderWithProviders(ContactList)
  await flushPromises()

  expect(wrapper.text()).toContain('Test Contact')
})
```

---

## Testing Slots

### Default Slot

```typescript
it('renders default slot', () => {
  const wrapper = mount(Card, {
    slots: {
      default: '<p>Card content</p>',
    },
  })

  expect(wrapper.html()).toContain('<p>Card content</p>')
})
```

### Named Slots

```typescript
it('renders header and footer slots', () => {
  const wrapper = mount(Card, {
    slots: {
      header: '<h2>Title</h2>',
      footer: '<button>Submit</button>',
    },
  })

  expect(wrapper.find('.card-header').html()).toContain('<h2>Title</h2>')
  expect(wrapper.find('.card-footer').html()).toContain('<button>Submit</button>')
})
```

### Scoped Slots

```typescript
it('passes data to scoped slot', () => {
  const wrapper = mount(DataIterator, {
    props: {
      items: [{ id: 1, name: 'Item 1' }],
    },
    slots: {
      default: `
        <template #default="{ item }">
          <span data-testid="item">{{ item.name }}</span>
        </template>
      `,
    },
  })

  expect(wrapper.find('[data-testid="item"]').text()).toBe('Item 1')
})
```

---

## Testing Props

### Required Props

```typescript
it('requires name prop', () => {
  const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})

  mount(ContactCard, {
    props: {}, // Missing required prop
  })

  expect(spy).toHaveBeenCalled()
  spy.mockRestore()
})
```

### Prop Validation

```typescript
it('validates status prop values', () => {
  const wrapper = mount(Badge, {
    props: { status: 'draft' },
  })

  expect(wrapper.classes()).toContain('badge-draft')
})
```

### Reactive Props

```typescript
it('updates when props change', async () => {
  const wrapper = mount(Counter, {
    props: { count: 0 },
  })

  expect(wrapper.text()).toContain('0')

  await wrapper.setProps({ count: 5 })

  expect(wrapper.text()).toContain('5')
})
```

---

## Testing Emits

```typescript
it('emits save event with form data', async () => {
  const wrapper = mount(ContactForm)

  await wrapper.find('[name="name"]').setValue('New Contact')
  await wrapper.find('[name="email"]').setValue('test@example.com')
  await wrapper.find('form').trigger('submit')

  expect(wrapper.emitted('save')).toBeTruthy()
  expect(wrapper.emitted('save')?.[0]).toEqual([
    {
      name: 'New Contact',
      email: 'test@example.com',
    },
  ])
})
```

---

## Testing with Pinia

### Pre-populate Store

```typescript
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

it('shows user name when logged in', async () => {
  const pinia = createPinia()
  setActivePinia(pinia)

  // Pre-populate store
  const authStore = useAuthStore()
  authStore.user = { id: 1, name: 'John Doe' }

  const { wrapper } = renderWithProviders(UserMenu, { pinia })

  expect(wrapper.text()).toContain('John Doe')
})
```

### Test Store Actions

```typescript
it('calls logout on button click', async () => {
  const pinia = createPinia()
  setActivePinia(pinia)

  const authStore = useAuthStore()
  const logoutSpy = vi.spyOn(authStore, 'logout')

  const { wrapper } = renderWithProviders(UserMenu, { pinia })

  await wrapper.find('[data-testid="logout-btn"]').trigger('click')

  expect(logoutSpy).toHaveBeenCalled()
})
```

---

## Test IDs

Use `data-testid` attributes for reliable element selection:

```vue
<!-- In component -->
<template>
  <div>
    <h1 data-testid="page-title">{{ title }}</h1>
    <button data-testid="submit-btn" @click="submit">Submit</button>
  </div>
</template>
```

```typescript
// In test
const { getByTestId } = renderWithProviders(MyComponent)

expect(getByTestId('page-title')).toHaveText('My Title')
await getByTestId('submit-btn').trigger('click')
```

---

## Best Practices

### Do

```typescript
// Test behavior, not implementation
it('shows success message after save', async () => {
  // Good: Testing what user sees
  expect(wrapper.text()).toContain('Saved successfully')
})

// Use test IDs for stability
it('clicks submit button', async () => {
  await wrapper.find('[data-testid="submit"]').trigger('click')
})

// Test accessibility
it('has accessible button', () => {
  const button = wrapper.find('button')
  expect(button.attributes('aria-label')).toBeDefined()
})
```

### Don't

```typescript
// Don't test internal state
expect(wrapper.vm.internalState).toBe(...)  // BAD

// Don't use CSS selectors that may change
wrapper.find('.btn-primary-lg')  // Fragile

// Don't test framework behavior
it('renders v-if correctly', () => { ... })  // Testing Vue, not your code
```

---

## Related Documentation

- [README.md](README.md) - Testing overview
- [UNIT-TESTS.md](UNIT-TESTS.md) - Unit testing
- [E2E-TESTS.md](E2E-TESTS.md) - End-to-end testing
