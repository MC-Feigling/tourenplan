export function useApiFetch() {
  return import.meta.server ? useRequestFetch() : $fetch
}
