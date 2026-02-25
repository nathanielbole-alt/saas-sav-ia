type LogLevel = 'info' | 'warn' | 'error'
type LogMeta = Record<string, unknown> | undefined

type SentryModule = {
  captureMessage: (message: string, context?: Record<string, unknown>) => void
  captureException: (error: unknown, context?: Record<string, unknown>) => void
}

function isSentryModule(value: unknown): value is SentryModule {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<SentryModule>
  return (
    typeof candidate.captureMessage === 'function' &&
    typeof candidate.captureException === 'function'
  )
}

function getSentry(): SentryModule | null {
  const sentryGlobal = (globalThis as { Sentry?: unknown }).Sentry
  return isSentryModule(sentryGlobal) ? sentryGlobal : null
}

function write(level: LogLevel, message: string, meta?: LogMeta) {
  const timestamp = new Date().toISOString()

  if (process.env.NODE_ENV === 'development') {
    console[level](`[${timestamp}] ${message}`, meta ?? {})
    return
  }

  const payload = {
    level,
    message,
    timestamp,
    ...(meta ? { meta } : {}),
  }

  console[level](JSON.stringify(payload))

  const sentry = getSentry()
  if (!sentry) return

  if (level === 'error') {
    sentry.captureException(new Error(message), { extra: meta })
    return
  }

  sentry.captureMessage(message, {
    level,
    extra: meta,
  })
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    write('info', message, meta)
  },
  warn(message: string, meta?: LogMeta) {
    write('warn', message, meta)
  },
  error(message: string, meta?: LogMeta) {
    write('error', message, meta)
  },
}
