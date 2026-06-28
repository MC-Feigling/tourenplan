export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    console.info(`[tourenplan] ${message}`, meta ?? '')
  },
  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(`[tourenplan] ${message}`, meta ?? '')
  },
  error(message: string, meta?: Record<string, unknown>) {
    console.error(`[tourenplan] ${message}`, meta ?? '')
  },
}
