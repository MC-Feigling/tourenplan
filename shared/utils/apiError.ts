export function extractError(e: unknown, fallback = 'Unbekannter Fehler'): string {
  const err = e as { data?: { statusMessage?: string }; message?: string }
  return err.data?.statusMessage ?? err.message ?? fallback
}
