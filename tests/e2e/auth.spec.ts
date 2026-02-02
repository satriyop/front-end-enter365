import { test, expect } from '@playwright/test'

test.describe('Login page', () => {
  // These tests run without saved auth state (unauthenticated)
  test.use({ storageState: { cookies: [], origins: [] } })

  test('renders login form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'wrong@email.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Should show error message (uses text-destructive class or role="alert")
    await expect(page.locator('.text-destructive, [role="alert"]')).toBeVisible()
  })

  test('redirects to login when accessing protected route', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('shows "Sign in to your account" heading', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('text=Sign in to your account')).toBeVisible()
  })
})
