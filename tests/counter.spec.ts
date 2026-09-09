import { expect, test } from '@playwright/test'

const key = 'one-more:cravings:v1'

test('one tap persists, celebrates, and can be undone', async ({ page }) => {
  await page.goto('/')
  const button = page.getByRole('button', { name: 'I resisted', exact: true })
  await expect(button).toBeEnabled()
  await expect(page.getByTestId('today-count')).toHaveText('0')
  await button.click()
  await expect(page.getByTestId('today-count')).toHaveText('1')
  await expect(page.getByText('You got through this one.')).toBeVisible()
  await expect
    .poll(() => page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).length, key))
    .toBe(1)
  await page.reload()
  await expect(page.getByTestId('today-count')).toHaveText('1')
  await page.locator('summary').click()
  await expect(page.getByText('Craving resisted', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /Delete craving/ }).click()
  await expect(page.getByTestId('total-count')).toHaveText('0')
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(page.getByTestId('total-count')).toHaveText('1')
  await button.click()
  await expect(page.getByTestId('total-count')).toHaveText('2')
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(page.getByTestId('total-count')).toHaveText('1')
})

test('history uses local days and syncs across tabs', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate((k) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    localStorage.setItem(
      k,
      JSON.stringify([
        { id: 'today', at: today.toISOString() },
        { id: 'yesterday', at: yesterday.toISOString() },
      ]),
    )
  }, key)
  await page.reload()
  await expect(page.getByTestId('today-count')).toHaveText('1')
  await expect(page.getByTestId('total-count')).toHaveText('2')
  await expect(page.locator('summary')).toHaveCount(2)
  await expect(page.locator('summary').nth(1)).toContainText('Yesterday')
  const other = await context.newPage()
  await other.goto('/')
  await other.getByRole('button', { name: 'I resisted', exact: true }).click()
  await expect(page.getByTestId('total-count')).toHaveText('3')
})

test('offline reload retains history and allows logging', async ({ page, context }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'I resisted', exact: true }).click()
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
          once: true,
        }),
      )
  })
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByTestId('today-count')).toHaveText('1')
  await page.getByRole('button', { name: 'I resisted', exact: true }).click()
  await expect(page.getByTestId('today-count')).toHaveText('2')
})

test('corrupt history is preserved and storage failures are reported', async ({ page }) => {
  await page.goto('/')
  await page.evaluate((k) => localStorage.setItem(k, 'broken-data'), key)
  await page.reload()
  await expect(page.getByRole('alert').filter({ hasText: 'history could not be read' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'I resisted', exact: true })).toBeDisabled()
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe('broken-data')
  await page.evaluate((k) => localStorage.removeItem(k), key)
  await page.reload()
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Full', 'QuotaExceededError')
    }
  })
  await page.getByRole('button', { name: 'I resisted', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'could not be saved' })).toBeVisible()
  await expect(page.getByTestId('total-count')).toHaveText('0')
})

test('responsive layout, celebration canvas, and reduced motion', async ({ page }, testInfo) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'I resisted', exact: true }).click()
  await page.waitForTimeout(150)
  const painted = await page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    const context = canvas.getContext('2d')!
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    return pixels.some((value, index) => index % 4 === 3 && value > 0)
  })
  expect(painted).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `test-results/${testInfo.project.name}.png`, fullPage: true })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'I resisted', exact: true }).click()
  await expect(page.getByTestId('today-count')).toHaveText('2')
  expect(
    await page
      .getByRole('button', { name: 'I resisted', exact: true })
      .evaluate((button) => getComputedStyle(button).animationName),
  ).toBe('none')
})
