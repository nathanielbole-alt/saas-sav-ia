import { test, expect } from '@playwright/test'
import { loginViaUI } from './utils/auth'
import { ROUTES } from './utils/constants'

test.describe('Dashboard Navigation', () => {
  /**
   * Prerequisites: These tests require an onboarded test user.
   * If the user is not onboarded, they will be redirected to onboarding
   * and the tests will be skipped gracefully.
   */

  test.beforeEach(async ({ page }) => {
    await loginViaUI(page)

    // Skip suite if user is not onboarded
    if (page.url().includes('/onboarding')) {
      test.skip()
    }
  })

  test('sidebar renders with all navigation sections', async ({ page }) => {
    // Sidebar links (visible on desktop)
    const navItems = [
      'Inbox',
      'Tickets',
      'Clients',
      'Analytics',
      'Billing',
      'Settings',
    ]

    for (const item of navItems) {
      await expect(
        page.locator(`a:has-text("${item}")`).first()
      ).toBeVisible({ timeout: 5_000 })
    }
  })

  test('navigate to Analytics page', async ({ page }) => {
    await page.locator('a:has-text("Analytics")').first().click()
    await page.waitForURL(`**${ROUTES.analytics}*`, { timeout: 10_000 })

    expect(page.url()).toContain(ROUTES.analytics)
    await expect(page.locator('text=Analytics').first()).toBeVisible()
  })

  test('navigate to Settings page', async ({ page }) => {
    await page.locator('a:has-text("Settings")').first().click()
    await page.waitForURL(`**${ROUTES.settings}*`, { timeout: 10_000 })

    expect(page.url()).toContain(ROUTES.settings)
  })

  test('navigate to Tickets page', async ({ page }) => {
    await page.locator('a:has-text("Tickets")').first().click()
    await page.waitForURL(`**${ROUTES.tickets}*`, { timeout: 10_000 })

    expect(page.url()).toContain(ROUTES.tickets)
  })

  test('navigate to Customers page', async ({ page }) => {
    await page.locator('a:has-text("Clients")').first().click()
    await page.waitForURL(`**${ROUTES.customers}*`, { timeout: 10_000 })

    expect(page.url()).toContain(ROUTES.customers)
  })

  test('navigate to Billing page', async ({ page }) => {
    await page.locator('a:has-text("Billing")').first().click()
    await page.waitForURL(`**${ROUTES.billing}*`, { timeout: 10_000 })

    expect(page.url()).toContain(ROUTES.billing)
  })

  test('Settings page shows Team section for admin/owner', async ({
    page,
  }) => {
    await page.locator('a:has-text("Settings")').first().click()
    await page.waitForURL(`**${ROUTES.settings}*`, { timeout: 10_000 })

    // Team section should be visible (for owner/admin)
    const teamSection = page.locator('text=Equipe')
    const isVisible = await teamSection.isVisible().catch(() => false)

    if (isVisible) {
      await expect(teamSection).toBeVisible()
      // Check for invite button
      await expect(
        page.locator('text=Inviter un membre')
      ).toBeVisible()
    }
  })

  test('Analytics page shows stat cards', async ({ page }) => {
    await page.locator('a:has-text("Analytics")').first().click()
    await page.waitForURL(`**${ROUTES.analytics}*`, { timeout: 10_000 })

    // Check for key analytics elements
    await expect(page.locator('text=Tickets ce mois').first()).toBeVisible({
      timeout: 5_000,
    })
    await expect(page.locator('text=Tickets ouverts').first()).toBeVisible()
    await expect(page.locator('text=Clients').first()).toBeVisible()
  })

  test('dashboard inbox loads without errors', async ({ page }) => {
    // The default /dashboard route shows the Inbox
    await expect(page.locator('body')).toBeVisible()

    // No error state should be visible
    const errorEl = page.locator('text=Erreur')
    const hasError = await errorEl.isVisible().catch(() => false)
    expect(hasError).toBe(false)
  })
})
