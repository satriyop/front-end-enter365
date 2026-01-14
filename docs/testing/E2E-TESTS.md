# E2E Tests

> End-to-end testing with Playwright (recommended setup)

## Overview

E2E tests verify complete user flows from login to completion. They run against a real browser and test the full application stack.

---

## Recommended Setup

### Install Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

---

## Test Structure

```
e2e/
├── auth.spec.ts           # Authentication flows
├── contacts.spec.ts       # Contact CRUD
├── quotations.spec.ts     # Quotation workflow
├── solar-proposals.spec.ts # Solar proposal wizard
└── fixtures/
    └── auth.ts            # Auth fixtures
```

---

## Basic Test

```typescript
// e2e/contacts.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Contacts', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'password')
    await page.click('[data-testid="login-btn"]')
    await page.waitForURL('/dashboard')
  })

  test('can create a new contact', async ({ page }) => {
    await page.goto('/contacts')
    await page.click('[data-testid="create-contact-btn"]')

    await page.fill('[data-testid="name-input"]', 'PT New Customer')
    await page.fill('[data-testid="email-input"]', 'customer@example.com')
    await page.fill('[data-testid="phone-input"]', '08123456789')

    await page.click('[data-testid="submit-btn"]')

    // Verify redirect to contact list
    await expect(page).toHaveURL(/\/contacts$/)

    // Verify contact appears in list
    await expect(page.locator('text=PT New Customer')).toBeVisible()
  })

  test('can edit existing contact', async ({ page }) => {
    await page.goto('/contacts')
    await page.click('[data-testid="contact-row"]:first-child')
    await page.click('[data-testid="edit-btn"]')

    await page.fill('[data-testid="name-input"]', 'Updated Name')
    await page.click('[data-testid="save-btn"]')

    await expect(page.locator('text=Updated Name')).toBeVisible()
  })

  test('can delete contact', async ({ page }) => {
    await page.goto('/contacts')
    const contactName = await page.locator('[data-testid="contact-row"]:first-child').textContent()

    await page.click('[data-testid="contact-row"]:first-child [data-testid="delete-btn"]')
    await page.click('[data-testid="confirm-delete-btn"]')

    await expect(page.locator(`text=${contactName}`)).not.toBeVisible()
  })
})
```

---

## Authentication Fixture

```typescript
// e2e/fixtures/auth.ts
import { test as base, expect } from '@playwright/test'

type AuthFixture = {
  authenticatedPage: typeof base['page']
}

export const test = base.extend<AuthFixture>({
  authenticatedPage: async ({ page }, use) => {
    // Perform login
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'password')
    await page.click('[data-testid="login-btn"]')
    await page.waitForURL('/dashboard')

    // Store auth state for reuse
    await page.context().storageState({ path: '.auth/user.json' })

    await use(page)
  },
})

export { expect }
```

### Using Auth Fixture

```typescript
// e2e/quotations.spec.ts
import { test, expect } from './fixtures/auth'

test('can create quotation', async ({ authenticatedPage: page }) => {
  await page.goto('/quotations')
  // ... test continues with authenticated user
})
```

---

## Testing Solar Proposal Wizard

```typescript
// e2e/solar-proposals.spec.ts
import { test, expect } from './fixtures/auth'

test.describe('Solar Proposal Wizard', () => {
  test('can complete full proposal creation', async ({ authenticatedPage: page }) => {
    await page.goto('/solar-proposals/create')

    // Step 1: Site Information
    await page.fill('[data-testid="site-name"]', 'PT Test Site')
    await page.fill('[data-testid="site-address"]', 'Jl. Test No. 123')
    await page.fill('[data-testid="roof-area"]', '100')
    await page.click('[data-testid="next-btn"]')

    // Step 2: Electricity Profile
    await page.fill('[data-testid="monthly-consumption"]', '2000')
    await page.selectOption('[data-testid="tariff-category"]', 'R-1/TR 2200')
    await page.click('[data-testid="next-btn"]')

    // Step 3: System Selection
    await page.click('[data-testid="bom-option-5kwp"]')
    await page.click('[data-testid="next-btn"]')

    // Step 4: Review
    await expect(page.locator('[data-testid="system-capacity"]')).toContainText('5.5 kWp')
    await expect(page.locator('[data-testid="annual-production"]')).toContainText('kWh')
    await expect(page.locator('[data-testid="payback-period"]')).toContainText('tahun')

    // Submit
    await page.click('[data-testid="submit-btn"]')

    // Verify success
    await expect(page).toHaveURL(/\/solar-proposals\/\d+/)
    await expect(page.locator('[data-testid="proposal-status"]')).toContainText('Draft')
  })

  test('validates required fields', async ({ authenticatedPage: page }) => {
    await page.goto('/solar-proposals/create')

    // Try to proceed without filling required fields
    await page.click('[data-testid="next-btn"]')

    // Verify validation errors
    await expect(page.locator('[data-testid="error-site-name"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-site-address"]')).toBeVisible()
  })
})
```

---

## Testing Quotation Workflow

```typescript
// e2e/quotations.spec.ts
import { test, expect } from './fixtures/auth'

test.describe('Quotation Workflow', () => {
  test('full workflow: draft -> submitted -> approved -> invoice', async ({ authenticatedPage: page }) => {
    // Create quotation
    await page.goto('/quotations/create')
    await page.selectOption('[data-testid="contact-select"]', { label: 'PT Test Customer' })

    // Add line items
    await page.click('[data-testid="add-item-btn"]')
    await page.selectOption('[data-testid="product-select"]', { label: 'Jinko 545W Panel' })
    await page.fill('[data-testid="quantity-input"]', '10')
    await page.click('[data-testid="save-item-btn"]')

    await page.click('[data-testid="save-quotation-btn"]')

    // Submit for approval
    await page.click('[data-testid="submit-btn"]')
    await expect(page.locator('[data-testid="status-badge"]')).toContainText('Submitted')

    // Approve
    await page.click('[data-testid="approve-btn"]')
    await expect(page.locator('[data-testid="status-badge"]')).toContainText('Approved')

    // Convert to invoice
    await page.click('[data-testid="convert-to-invoice-btn"]')
    await expect(page).toHaveURL(/\/invoices\/\d+/)
    await expect(page.locator('[data-testid="invoice-number"]')).toContainText('INV-')
  })
})
```

---

## Page Object Pattern

```typescript
// e2e/pages/ContactsPage.ts
import { Page, Locator } from '@playwright/test'

export class ContactsPage {
  readonly page: Page
  readonly createButton: Locator
  readonly searchInput: Locator
  readonly contactRows: Locator

  constructor(page: Page) {
    this.page = page
    this.createButton = page.locator('[data-testid="create-contact-btn"]')
    this.searchInput = page.locator('[data-testid="search-input"]')
    this.contactRows = page.locator('[data-testid="contact-row"]')
  }

  async goto() {
    await this.page.goto('/contacts')
  }

  async search(term: string) {
    await this.searchInput.fill(term)
    await this.page.waitForResponse(/\/api\/contacts/)
  }

  async createContact(data: { name: string; email: string }) {
    await this.createButton.click()
    await this.page.fill('[data-testid="name-input"]', data.name)
    await this.page.fill('[data-testid="email-input"]', data.email)
    await this.page.click('[data-testid="submit-btn"]')
  }

  async getContactCount() {
    return await this.contactRows.count()
  }
}

// Usage
test('can search contacts', async ({ authenticatedPage: page }) => {
  const contactsPage = new ContactsPage(page)
  await contactsPage.goto()

  await contactsPage.search('PT Test')

  const count = await contactsPage.getContactCount()
  expect(count).toBeGreaterThan(0)
})
```

---

## Running E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test e2e/contacts.spec.ts

# Run with UI
npx playwright test --ui

# Run in headed mode (visible browser)
npx playwright test --headed

# Run specific browser
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug

# Generate test from actions
npx playwright codegen http://localhost:3000
```

---

## CI Integration

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Best Practices

### Do

```typescript
// Use data-testid for stable selectors
await page.click('[data-testid="submit-btn"]')

// Wait for network requests
await page.waitForResponse(/\/api\/contacts/)

// Use assertions
await expect(page.locator('.success')).toBeVisible()

// Clean up test data
test.afterEach(async ({ page }) => {
  // Reset test state
})
```

### Don't

```typescript
// Don't use arbitrary waits
await page.waitForTimeout(2000)  // BAD

// Don't use fragile selectors
await page.click('.btn-primary:nth-child(3)')  // BAD

// Don't test implementation details
expect(await page.evaluate(() => window.__STORE__))  // BAD
```

---

## Related Documentation

- [README.md](README.md) - Testing overview
- [COMPONENT-TESTS.md](COMPONENT-TESTS.md) - Component testing
- [../deployment/CI-CD.md](../deployment/CI-CD.md) - CI/CD setup
