import { test as setup, expect } from '@playwright/test'

const authFile = 'tests/e2e/.auth/user.json'

setup('authenticate', async ({ page }) => {
  await page.goto('/login')

  await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'admin@example.com')
  await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password')
  await page.click('button[type="submit"]')

  // Wait for redirect to dashboard (root path) after successful login
  await page.waitForURL('http://localhost:3000/')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

  // Save auth state (includes localStorage token)
  await page.context().storageState({ path: authFile })
})
