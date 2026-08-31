import { expect, type Page, test } from '@playwright/test'

test.describe.configure({ mode: 'serial', timeout: 60_000 })

const SITI = { email: 'siti@kopitiam57.test', password: 'Kopitiam57-kasir' }
const OWNER = { email: 'admin@example.com', password: 'Kopitiam57-kasir' }
const AKUNTAN = { email: 'rina@kopitiam57.test', password: 'Kopitiam57-kasir' }
const GUDANG = { email: 'dewi@kopitiam57.test', password: 'Kopitiam57-kasir' }

/** Kopitiam 57 pastry board — the locked till SKUs. */
const SKU = {
  garlic: 'KT57-SB-GARLIC',
  original: 'KT57-SB-ORI',
  croissant: 'KT57-CROISS-BT',
  smeer: 'KT57-SMEER',
  air: 'KT57-AIR',
} as const

test.describe('Kasir till journeys', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  async function loginAs(page: Page, email: string, password = 'Kopitiam57-kasir'): Promise<void> {
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    const emailInput = page.getByTestId('login-email')
    await expect(emailInput).toBeVisible({ timeout: 15_000 })
    await emailInput.fill(email)
    await expect(emailInput).toHaveValue(email)
    await page.getByTestId('login-password').fill(password)
    await page.getByTestId('login-submit').click()
    await expect(page.getByTestId('login-email')).toHaveCount(0, { timeout: 20_000 })
  }

  async function loginAsSiti(page: Page): Promise<void> {
    await loginAs(page, SITI.email, SITI.password)
    await page.waitForURL(/\/kasir/, { timeout: 20_000 })
  }

  async function loginAsOwner(page: Page): Promise<void> {
    await loginAs(page, OWNER.email, OWNER.password)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20_000 })
  }

  async function ensureShop(page: Page): Promise<void> {
    const start = page.getByTestId('kasir-start')
    const shop = page.getByText('Pesanan')
    await expect(start.or(shop)).toBeVisible({ timeout: 20_000 })
    if (await start.isVisible()) {
      await expect(start).toBeEnabled({ timeout: 15_000 })
      await start.click()
    }
    await expect(shop).toBeVisible({ timeout: 20_000 })
  }

  async function expectLunas(page: Page): Promise<void> {
    await expect(page.getByTestId('kasir-lunas')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Jaringan putus')).toHaveCount(0)
  }

  function skuButton(page: Page, sku: string) {
    return page.getByTestId(`kasir-sku-${sku}`)
  }

  async function tapSku(page: Page, sku: string): Promise<void> {
    const rail = sku === SKU.air ? 'Extra' : 'Pastry'
    await page.locator('.rail button').filter({ hasText: rail }).click()
    const button = skuButton(page, sku)
    await button.scrollIntoViewIfNeeded()
    const name = (await button.locator('.n').innerText()).trim()
    await button.click()
    await expect(page.locator('.ol .n').filter({ hasText: name })).toBeVisible()
  }

  test('cashier login lands on /kasir, not Dashboard', async ({ page }) => {
    await loginAsSiti(page)
    await expect(page).toHaveURL(/\/kasir/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toHaveCount(0)
    await page.goto('/products')
    await expect(page).toHaveURL(/\/kasir/)
    await expect(page.getByRole('link', { name: 'Products' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Contacts' })).toHaveCount(0)
  })

  test('owner login lands on Dashboard and Products shows pastry, not busbars', async ({ page }) => {
    await loginAsOwner(page)
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Products' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Contacts' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Kasir' })).toBeVisible()
    await page.goto('/products')
    await expect(page).toHaveURL(/\/products/)
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible()
    await expect(page.getByText('AC-AMMETER')).toHaveCount(0)
    await expect(page.getByText(/busbar/i)).toHaveCount(0)

    await page.getByPlaceholder('Search by name, SKU, barcode...').fill('Garlic Cheese')
    await expect(page.getByRole('table').getByText('Salt Bread Garlic Cheese')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('table').getByText('KT57-SB-GARLIC')).toBeVisible()

    await page.getByPlaceholder('Search by name, SKU, barcode...').fill('AC-AMMETER')
    await expect(page.getByText('No products found')).toBeVisible({ timeout: 10_000 })
  })

  test('owner till charges Hakau cafe as 25410 after service and PBJT', async ({ page }) => {
    const checkout = page.waitForResponse((response) =>
      response.url().includes('/checkout') && response.request().method() === 'POST',
    )
    await loginAsOwner(page)
    await page.goto('/kasir')
    await ensureShop(page)
    await page.locator('.rail button').filter({ hasText: 'Dimsum' }).click()
    const hakau = skuButton(page, 'KT57-HAKAU')
    await hakau.scrollIntoViewIfNeeded()
    await hakau.click()
    await expect(page.getByTestId('kasir-total')).toHaveText('Rp25.410')
    await expect(page.getByTestId('kasir-tax')).toContainText('PBJT')
    await expect(page.getByRole('link', { name: 'Quotations' })).toHaveCount(0)
    await page.getByTestId('kasir-pay').click()
    await page.getByTestId('kasir-exact-cash').click()
    await page.getByTestId('kasir-finish').click()
    expect((await checkout).status()).toBe(201)
    await expectLunas(page)
  })

  test('akuntan sees reports and not the till', async ({ page }) => {
    await loginAs(page, AKUNTAN.email, AKUNTAN.password)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('link', { name: 'Kasir' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Quotations' })).toHaveCount(0)
    await page.goto('/reports/trial-balance')
    await expect(page.getByRole('heading', { name: 'Neraca Saldo' })).toBeVisible({ timeout: 10_000 })
    await page.goto('/kasir')
    await expect(page.getByTestId('kasir-lunas')).toHaveCount(0)
    await expect(page.getByTestId('kasir-finish')).toHaveCount(0)
    await expect(page.getByText('Pesanan')).toHaveCount(0)
  })

  test('gudang sees products and inventory, not the till', async ({ page }) => {
    await loginAs(page, GUDANG.email, GUDANG.password)
    await page.goto('/products')
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('link', { name: 'Kasir' })).toHaveCount(0)
    await page.goto('/inventory')
    await expect(page.getByRole('heading', { name: 'Stock' })).toBeVisible({ timeout: 10_000 })
    await page.goto('/kasir')
    await expect(page.getByTestId('kasir-lunas')).toHaveCount(0)
    await expect(page.getByTestId('kasir-finish')).toHaveCount(0)
    await expect(page.getByText('Pesanan')).toHaveCount(0)
  })

  test('cashier cannot open Faktur from the till', async ({ page }) => {
    await loginAsSiti(page)
    await page.goto('/invoices')
    await expect(page).toHaveURL(/\/kasir/)
    await expect(page.getByRole('heading', { name: 'Invoices' })).toHaveCount(0)
  })

  test('Keluar from the till returns to login, then owner can sign in', async ({ page }) => {
    await loginAsSiti(page)
    await page.getByTestId('kasir-logout').click()
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
    await expect(page.getByTestId('login-email')).toBeVisible()

    await loginAsOwner(page)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page).not.toHaveURL(/\/kasir/)
  })

  test('cash pad types 50000 into uang diterima, not into kurang', async ({ page }) => {
    await loginAsSiti(page)
    await ensureShop(page)
    await page.getByTestId('kasir-search').fill('Hakau')
    await page.getByTestId('kasir-sku-KT57-HAKAU').click()
    await page.getByTestId('kasir-pay').click()
    await expect(page.getByTestId('kasir-received')).toHaveText('Rp0')
    await page.getByTestId('kasir-key-5').click()
    await expect(page.getByTestId('kasir-received')).toHaveText('Rp5')
    await expect(page.getByTestId('kasir-change')).toHaveText('Rp25.405')
    for (let i = 0; i < 4; i++) {
      await page.getByTestId('kasir-key-0').click()
    }
    await expect(page.getByTestId('kasir-received')).toHaveText('Rp50.000')
    await expect(page.getByTestId('kasir-change')).toHaveText('Rp24.590')
  })

  test('shop shows cafe tile and bill adds Service + PBJT, never DPP/PPN', async ({ page }) => {
    await loginAsSiti(page)
    await ensureShop(page)
    await tapSku(page, SKU.garlic)
    await expect(skuButton(page, SKU.garlic).getByText('Rp28.000')).toBeVisible()
    await expect(page.getByTestId('kasir-subtotal')).toContainText('Rp28.000')
    await expect(page.getByTestId('kasir-service')).toBeVisible()
    await expect(page.getByTestId('kasir-tax')).toContainText('PBJT')
    await expect(page.getByTestId('kasir-total')).toHaveText('Rp32.340')
    await expect(page.getByText('DPP', { exact: true })).toHaveCount(0)
    await expect(page.getByText('PPN', { exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Pastry/ })).toBeVisible()
  })

  test('pastry photo loads and barcode adds Garlic Cheese', async ({ page }) => {
    await loginAsSiti(page)
    await ensureShop(page)
    await page.getByRole('button', { name: /Pastry/ }).click()

    const garlic = skuButton(page, SKU.garlic)
    await expect(garlic).toBeVisible()
    await expect(garlic.getByText('Salt Bread Garlic Cheese')).toBeVisible()
    await expect(garlic.getByText('Rp28.000')).toBeVisible()

    const photo = garlic.locator('img')
    await expect(photo).toBeVisible()
    await expect
      .poll(async () => photo.evaluate((el) => (el as HTMLImageElement).naturalWidth), { timeout: 10_000 })
      .toBeGreaterThan(0)

    await page.getByTestId('kasir-search').fill('899057000016')
    await page.getByTestId('kasir-search').press('Enter')
    await expect(page.locator('.ol .n').filter({ hasText: 'Salt Bread Garlic Cheese' })).toBeVisible()
    await page.getByTestId('kasir-clear').click()
  })

  test('Selesai tunai uang pas on Garlic Cheese shows lunas, never Jaringan putus', async ({ page }) => {
    const checkout = page.waitForResponse((response) =>
      response.url().includes('/checkout') && response.request().method() === 'POST',
    )
    await loginAsSiti(page)
    await ensureShop(page)
    await tapSku(page, SKU.garlic)
    await page.getByTestId('kasir-pay').click()
    await expect(page.getByTestId('kasir-finish')).toHaveText('Uang belum cukup')
    await page.getByTestId('kasir-exact-cash').click()
    await page.getByTestId('kasir-finish').click()
    expect((await checkout).status()).toBe(201)
    await expectLunas(page)
  })

  test('tunai with kembalian then Transaksi baru', async ({ page }) => {
    await loginAsSiti(page)
    await ensureShop(page)
    await tapSku(page, SKU.original)
    await page.getByTestId('kasir-pay').click()
    await page.getByRole('button', { name: 'Rp200.000' }).click()
    await page.getByTestId('kasir-finish').click()
    await expectLunas(page)
    await expect(page.getByText('Kembalian')).toBeVisible()
    await page.getByTestId('kasir-print').click()
    await expect(page.getByText('Printer belum di V1.')).toBeVisible()
    await page.getByTestId('kasir-new-sale').click()
    await expect(page.getByText('Pesanan')).toBeVisible()
  })

  test('QRIS Selesai on Air Mineral shows lunas', async ({ page }) => {
    await loginAsSiti(page)
    await ensureShop(page)
    await tapSku(page, SKU.air)
    await page.getByTestId('kasir-pay').click()
    await page.getByTestId('kasir-tab-qris').click()
    await expect(page.getByText('Tekan Selesai hanya setelah uang benar-benar masuk')).toBeVisible()
    await page.getByTestId('kasir-finish').click()
    await expectLunas(page)
    await page.getByTestId('kasir-new-sale').click()
  })

  test('Simpan parks Butter Croissant and Ambil restores it', async ({ page }) => {
    await loginAsSiti(page)
    await ensureShop(page)
    await tapSku(page, SKU.croissant)
    await page.getByTestId('kasir-hold').click()
    await expect(page.getByText('Pesanan disimpan.')).toBeVisible()
    await page.getByTestId('kasir-holds').click()
    await page.getByTestId('kasir-hold-take').click()
    await expect(page.locator('.ol .n').filter({ hasText: 'Butter Croissant' })).toBeVisible()
    await page.getByTestId('kasir-clear').click()
  })

  test('Batalkan voids Roti Smeer with a reason', async ({ page }) => {
    await loginAsSiti(page)
    await ensureShop(page)
    await tapSku(page, SKU.smeer)
    await page.getByTestId('kasir-pay').click()
    await page.getByTestId('kasir-exact-cash').click()
    await page.getByTestId('kasir-finish').click()
    await expectLunas(page)
    await page.getByTestId('kasir-new-sale').click()
    await page.getByTestId('kasir-voids').click()
    const voidRequest = page.waitForResponse((response) =>
      response.url().includes('/void') && response.request().method() === 'POST',
    )
    await page.getByRole('button', { name: 'Batalkan' }).first().click()
    await page.getByRole('button', { name: 'Salah barang' }).click()
    await expect(page.getByTestId('kasir-void-confirm')).toBeEnabled()
    await page.getByTestId('kasir-void-confirm').click()
    expect((await voidRequest).status()).toBe(200)
    await expect(page.getByText('Penjualan dibatalkan. Stok dikembalikan.')).toBeVisible()
    await expect(page.getByText('DIBATALKAN').first()).toBeVisible()
  })

  test('owner opens own till while Siti is open, sells pastry, never sees busbars', async ({ page }) => {
    const checkout = page.waitForResponse((response) =>
      response.url().includes('/checkout') && response.request().method() === 'POST',
    )
    await loginAsOwner(page)
    await page.goto('/kasir')
    await ensureShop(page)
    await expect(page.getByText('AC-AMMETER')).toHaveCount(0)
    await expect(page.getByText(/busbar/i)).toHaveCount(0)
    await expect(skuButton(page, SKU.garlic)).toBeVisible()
    await tapSku(page, SKU.garlic)
    await page.getByTestId('kasir-pay').click()
    await page.getByTestId('kasir-exact-cash').click()
    await page.getByTestId('kasir-finish').click()
    expect((await checkout).status()).toBe(201)
    await expectLunas(page)
    await page.getByTestId('kasir-new-sale').click()
    await page.getByTestId('kasir-logout').click()
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
  })

  test('Tutup kasir blind-count, Keluar on Buka kasir, owner signs in', async ({ page }) => {
    await loginAsSiti(page)
    await ensureShop(page)
    await page.getByTestId('kasir-close').click()
    await expect(page.getByText('Hitung dulu, baru sistem cocokkan')).toBeVisible()
    await expect(page.getByText('Seharusnya ada di laci')).toHaveCount(0)
    await page.getByTestId('kasir-close-review').click({ force: true })
    await expect(page.getByText('Seharusnya ada di laci')).toBeVisible()
    await page.getByTestId('kasir-close-confirm').click({ force: true })
    await expect(page.getByText('Sesi ditutup')).toBeVisible({ timeout: 10_000 })
    await page.getByTestId('kasir-reopen').click()
    await expect(page.getByText('Buka kasir')).toBeVisible()
    await expect(page.getByTestId('kasir-logout')).toBeVisible()
    await page.getByTestId('kasir-logout').click()
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })

    await loginAsOwner(page)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Products' })).toBeVisible()
  })
})
