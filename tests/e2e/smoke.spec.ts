import { test, expect } from '@playwright/test'

test('dashboard loads after auth', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Enter365|Solar ERP/)
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})

test('sidebar navigation renders', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('nav.flex-1')).toBeVisible()
})
