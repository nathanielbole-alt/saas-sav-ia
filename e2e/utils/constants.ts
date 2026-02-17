/**
 * Test credentials — use a dedicated test account.
 * Override via env vars E2E_USER_EMAIL / E2E_USER_PASSWORD.
 */
export const TEST_USER = {
  email: process.env.E2E_USER_EMAIL ?? 'test@example.com',
  password: process.env.E2E_USER_PASSWORD ?? 'testpassword123',
}

export const ROUTES = {
  login: '/login',
  dashboard: '/dashboard',
  onboarding: '/dashboard/onboarding',
  analytics: '/dashboard/analytics',
  settings: '/dashboard/settings',
  tickets: '/dashboard/tickets',
  customers: '/dashboard/customers',
  billing: '/dashboard/billing',
} as const
