const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/nextjs') as {
      init: (options: Record<string, unknown>) => void
    }

    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
    })
  } catch {
    // Sentry package not installed yet.
  }
}

export { }
