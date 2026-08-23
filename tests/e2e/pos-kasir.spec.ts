import { expect, type Page, test } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

test.describe('Kasir till journeys', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  async function loginAsSiti(page: Page): Promise<void> {
    await page.goto('/login')
    await page.getByTestId('login-email').fill('siti@kopitiam57.test')
    await page.getByTestId('login-password').fill('password')
    await page.getByTestId('login-submit').click()
    await page.waitForURL(/\/kasir/, { timeout: 20_000 })
  }

  async function ensureShop(page: Page): Promise<void> {
    const start = page.getByTestId('kasir-start')
    if (await start.isVisible().catch(() => false)) {
      await start.click()
    }
    await expect(page.getByText('Pesanan')).toBeVisible({ timeout: 20_000 })
  }

  async function expectLunas(page: Page): Promise<void> {
    await expect(page.getByTestId('kasir-lunas')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Jaringan putus')).toHaveCount(0)
  }

  test('cashier login lands on /kasir, not Dashboard', async ({ page }) => {
    await loginAsSiti(page)
    await expect(page).toHaveURL(/\/kasir/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toHaveCount(0)
  })

  test('shop shows Total only — no DPP/PPN', async ({ page }) => {
    await loginAsSiti(page)
    await ensureShop(page)
    await expect(page.getByText('Total')).toBeVisible()
    await expect(page.getByText('DPP', { exact: true })).toHaveCount(0)
    await expect(page.getByText('PPN', { exact: true })).toHaveCount(0)
  })

  test('barcode enter adds Kopi O', async ({ page }) => {
    await loginAsSiti(page)
    await ensureShop(page)
    await page.getByTestId('kasir-search').fill('899057000001')
    await page.getByTestId('kasir-search').press('Enter')
    await expect(page.locator('.ol .n').filter({ hasText: 'Kopi O' })).toBeVisible()
    await page.getByTestId('kasir-clear').click()
  })

  test('Selesai tunai uang pas shows lunas, never Jaringan putus', async ({ page }) => {
    const checkout = page.waitForResponse((response) =>
      response.url().includes('/checkout') && response.request().method() === 'POST',
    )
    await loginAsSiti(page)
    await ensureShop(page)
    await page.getByRole('button', { name: /Es Teh Manis/ }).first().click()
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
    await page.getByRole('button', { name: /Kopi O/ }).first().click()
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

  test('QRIS Selesai shows lunas', async ({ page }) => {
    await loginAsSiti(page)
    await ensureShop(page)
    await page.getByRole('button', { name: /Jasa Packing/ }).first().click()
    await page.getByTestId('kasir-pay').click()
    await page.getByTestId('kasir-tab-qris').click()
    await expect(page.getByText('Tekan Selesai hanya setelah uang benar-benar masuk')).toBeVisible()
    await page.getByTestId('kasir-finish').click()
    await expectLunas(page)
    await page.getByTestId('kasir-new-sale').click()
  })

  test('Simpan parks the cart and Ambil restores it', async ({ page }) => {
    await loginAsSiti(page)
    await ensureShop(page)
    await page.getByRole('button', { name: /Milo/ }).first().click()
    await page.getByTestId('kasir-hold').click()
    await expect(page.getByText('Pesanan disimpan.')).toBeVisible()
    await page.getByTestId('kasir-holds').click()
    await page.getByTestId('kasir-hold-take').click()
    await expect(page.locator('.ol .n').filter({ hasText: 'Milo' })).toBeVisible()
    await page.getByTestId('kasir-clear').click()
  })

  test('Batalkan voids a sale with a reason', async ({ page }) => {
    await loginAsSiti(page)
    await ensureShop(page)
    await page.getByRole('button', { name: /Kantong Plastik/ }).first().click()
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

  test('Tutup kasir blind-count then reopen', async ({ page }) => {
    await loginAsSiti(page)
    await ensureShop(page)
    await page.getByTestId('kasir-close').click()
    await expect(page.getByText('Hitung dulu, baru sistem cocokkan')).toBeVisible()
    await expect(page.getByText('Seharusnya ada di laci')).toHaveCount(0)
    await page.getByTestId('kasir-close-review').click()
    await expect(page.getByText('Seharusnya ada di laci')).toBeVisible()
    await page.getByTestId('kasir-close-confirm').click()
    await expect(page.getByText('Sesi ditutup')).toBeVisible({ timeout: 10_000 })
    await page.getByTestId('kasir-reopen').click()
    await expect(page.getByText('Buka kasir')).toBeVisible()
    await page.getByTestId('kasir-start').click()
    await expect(page.getByText('Pesanan')).toBeVisible({ timeout: 20_000 })
  })
})
