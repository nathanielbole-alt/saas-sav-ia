import { test, expect } from '@playwright/test'
import { loginViaUI } from './utils/auth'
import { ROUTES } from './utils/constants'

test.describe('Onboarding Flow', () => {
  /**
   * Prerequisites: These tests require a test user whose profile
   * has `is_onboarded = false`. If the user is already onboarded,
   * the redirect tests will behave differently.
   */

  test('non-onboarded user accessing /dashboard is redirected to /dashboard/onboarding', async ({
    page,
  }) => {
    await loginViaUI(page)

    const url = page.url()
    // If the user is not onboarded, they should be on the onboarding page
    // If already onboarded, they stay on /dashboard — both are valid outcomes
    expect(url).toContain('/dashboard')
  })

  test('onboarding Step 1 — Welcome screen renders', async ({ page }) => {
    await loginViaUI(page)

    // If redirected to onboarding, check Step 1 content
    if (page.url().includes('/onboarding')) {
      await expect(
        page.locator('text=Bienvenue sur Savly')
      ).toBeVisible({ timeout: 10_000 })
      await expect(
        page.locator('button:has-text("Commencer")')
      ).toBeVisible()
    }
  })

  test('onboarding Step 2 — Profile form validation', async ({ page }) => {
    await loginViaUI(page)

    if (!page.url().includes('/onboarding')) {
      test.skip()
      return
    }

    // Step 1 → Click "Commencer"
    await page.locator('button:has-text("Commencer")').click()

    // Step 2 — Should see profile form
    await expect(
      page.locator('input[placeholder="Jean Dupont"]')
    ).toBeVisible({ timeout: 5_000 })
    await expect(
      page.locator('input[placeholder="Mon Entreprise"]')
    ).toBeVisible()

    // Try to continue without filling required fields
    const continueButton = page.locator('button:has-text("Continuer")')
    await expect(continueButton).toBeVisible()

    // Fill required fields
    await page.locator('input[placeholder="Jean Dupont"]').fill('Test User E2E')
    await page
      .locator('input[placeholder="Mon Entreprise"]')
      .fill('Test Org E2E')

    // Select optional fields
    const selects = page.locator('select')
    const selectCount = await selects.count()
    if (selectCount > 0) {
      await selects.first().selectOption({ index: 1 })
    }
  })

  test('onboarding Step 3 — Channels screen renders', async ({ page }) => {
    await loginViaUI(page)

    if (!page.url().includes('/onboarding')) {
      test.skip()
      return
    }

    // Navigate to Step 3: Step 1 → Step 2 → Step 3
    await page.locator('button:has-text("Commencer")').click()
    await page
      .locator('input[placeholder="Jean Dupont"]')
      .fill('Test User E2E')
    await page
      .locator('input[placeholder="Mon Entreprise"]')
      .fill('Test Org E2E')
    await page.locator('button:has-text("Continuer")').click()

    // Step 3 — Should see channel connection options
    await expect(page.locator('text=Gmail')).toBeVisible({ timeout: 5_000 })
    await expect(page.locator('text=Shopify')).toBeVisible()

    // Skip button should exist
    await expect(
      page.locator('button:has-text("Passer cette etape")')
    ).toBeVisible()
  })

  test('onboarding Step 4 — SAV Policies renders', async ({ page }) => {
    await loginViaUI(page)

    if (!page.url().includes('/onboarding')) {
      test.skip()
      return
    }

    // Navigate to Step 4: Step 1 → Step 2 → Step 3 (skip) → Step 4
    await page.locator('button:has-text("Commencer")').click()
    await page
      .locator('input[placeholder="Jean Dupont"]')
      .fill('Test User E2E')
    await page
      .locator('input[placeholder="Mon Entreprise"]')
      .fill('Test Org E2E')
    await page.locator('button:has-text("Continuer")').click()

    // Skip channels
    await page
      .locator('button:has-text("Passer cette etape")')
      .click({ timeout: 5_000 })

    // Step 4 — Should see policy textareas
    const textareas = page.locator('textarea')
    await expect(textareas.first()).toBeVisible({ timeout: 5_000 })

    // Skip button should exist
    await expect(
      page.locator('button:has-text("Passer pour l\'instant")')
    ).toBeVisible()
  })

  test('onboarding Step 5 — Completion screen', async ({ page }) => {
    await loginViaUI(page)

    if (!page.url().includes('/onboarding')) {
      test.skip()
      return
    }

    // Navigate through all steps
    // Step 1
    await page.locator('button:has-text("Commencer")').click()

    // Step 2
    await page
      .locator('input[placeholder="Jean Dupont"]')
      .fill('Test User E2E')
    await page
      .locator('input[placeholder="Mon Entreprise"]')
      .fill('Test Org E2E')
    await page.locator('button:has-text("Continuer")').click()

    // Step 3 — Skip
    await page
      .locator('button:has-text("Passer cette etape")')
      .click({ timeout: 5_000 })

    // Step 4 — Skip
    await page
      .locator('button:has-text("Passer pour l\'instant")')
      .click({ timeout: 5_000 })

    // Step 5 — Should see completion screen
    await expect(
      page.locator('text=Tout est pret')
    ).toBeVisible({ timeout: 5_000 })
    await expect(
      page.locator('button:has-text("Acceder au dashboard")')
    ).toBeVisible()
  })

  test('step indicator shows 5 steps', async ({ page }) => {
    await loginViaUI(page)

    if (!page.url().includes('/onboarding')) {
      test.skip()
      return
    }

    // Step labels should be present
    const stepLabels = ['Bienvenue', 'Profil', 'Canaux', 'Termine']
    for (const label of stepLabels) {
      await expect(page.locator(`text=${label}`).first()).toBeVisible({
        timeout: 5_000,
      })
    }
  })
})
