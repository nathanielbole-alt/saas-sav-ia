import { type Page } from '@playwright/test'
import { TEST_USER, ROUTES } from './constants'

/**
 * Login via the UI form at /login.
 * Waits for redirect to /dashboard before returning.
 */
export async function loginViaUI(
  page: Page,
  credentials?: { email: string; password: string }
): Promise<void> {
  const { email, password } = credentials ?? TEST_USER

  await page.goto(ROUTES.login)
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.locator('button:has-text("Se connecter")').click()

  // Wait for navigation away from /login
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
    timeout: 15_000,
  })
}

/**
 * Logout by clearing Supabase cookies and navigating to login.
 */
export async function logout(page: Page): Promise<void> {
  // Clear all cookies to destroy Supabase session
  await page.context().clearCookies()
  await page.goto(ROUTES.login)
  await page.waitForURL(`**${ROUTES.login}*`)
}
