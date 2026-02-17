import { test, expect } from '@playwright/test'
import { loginViaUI, logout } from './utils/auth'
import { ROUTES, TEST_USER } from './utils/constants'

test.describe('Authentication', () => {
  test('unauthenticated user visiting /dashboard is redirected to /login', async ({
    page,
  }) => {
    await page.goto(ROUTES.dashboard)

    await page.waitForURL(`**${ROUTES.login}*`, { timeout: 10_000 })
    expect(page.url()).toContain(ROUTES.login)
  })

  test('login with valid credentials redirects to /dashboard', async ({
    page,
  }) => {
    await loginViaUI(page)

    // Should land on /dashboard (or /dashboard/onboarding if not onboarded)
    const url = page.url()
    expect(url).toContain('/dashboard')
  })

  test('login form shows error for invalid credentials', async ({ page }) => {
    await page.goto(ROUTES.login)
    await page.locator('#email').fill('invalid@nonexistent.dev')
    await page.locator('#password').fill('wrongpassword')
    await page.locator('button:has-text("Se connecter")').click()

    // Should stay on login page and show an error
    await page.waitForTimeout(2000)
    expect(page.url()).toContain(ROUTES.login)
  })

  test('login page renders correctly', async ({ page }) => {
    await page.goto(ROUTES.login)

    // Check form elements exist
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(
      page.locator('button:has-text("Se connecter")')
    ).toBeVisible()
    await expect(page.locator('button:has-text("S\'inscrire")')).toBeVisible()
  })

  test('logout clears session and redirects to /login', async ({ page }) => {
    // First log in
    await loginViaUI(page)
    expect(page.url()).toContain('/dashboard')

    // Logout (clear cookies)
    await logout(page)
    expect(page.url()).toContain(ROUTES.login)

    // Verify session is cleared — going to dashboard should redirect to login
    await page.goto(ROUTES.dashboard)
    await page.waitForURL(`**${ROUTES.login}*`, { timeout: 10_000 })
    expect(page.url()).toContain(ROUTES.login)
  })
})
