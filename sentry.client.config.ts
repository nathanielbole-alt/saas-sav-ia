const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/nextjs') as {
      init: (options: Record<string, unknown>) => void
    }

    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      replaysSessionSampleRate: 0.05,
    })
  } catch {
    // Sentry package not installed yet.
  }
}

export { }
